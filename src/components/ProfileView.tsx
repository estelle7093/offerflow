import React, { useState, useRef } from 'react';
import { ICONS, Application } from '../constants';
import { motion, AnimatePresence } from 'motion/react';
import { aiApi, profileApi, resumesApi } from '../services/apiClient';
import * as mammoth from 'mammoth';
import * as pdfjs from 'pdfjs-dist';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface ResumeItem {
  id: string;
  fileName: string;
  fileType: string;
  text: string;
  createdAt: number;
  diagnosis?: any;
}

interface ProfileProps {
  applications: Application[];
  userAvatar: string;
  onAvatarChange: (newAvatar: string) => void;
  onNameChange: (newName: string) => void;
}

export default function ProfileView({ applications, userAvatar, onAvatarChange, onNameChange }: ProfileProps) {
  const totalApps = applications.length;
  const interviewingCount = applications.filter(a => ['interviewing', 'offer'].includes(a.status)).length;
  const offerCount = applications.filter(a => a.status === 'offer').length;
  const avgMatch = Math.round(applications.reduce((acc, a) => acc + (a.aiMatchingScore || 0), 0) / (totalApps || 1));
  
  const interviewRate = totalApps > 0 ? Math.round((interviewingCount / totalApps) * 100) : 0;
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [userInfo, setUserInfo] = useState({
    name: '加载中...',
    title: '产品经理 @ 招聘平台',
    status: '求职中',
    location: '上海',
    tag: '#AI-Product',
    goal: '斩获优质 Offer',
    goalCurrent: 3,
    goalTotal: 5
  });

  React.useEffect(() => {
    profileApi.get().then(profile => {
      if (profile) {
        setUserInfo(prev => ({
          ...prev,
          name: profile.name || '新用户',
          status: profile.status || prev.status,
          location: profile.location || prev.location,
          goal: profile.goal || prev.goal,
          goalCurrent: profile.goal_current ?? prev.goalCurrent,
          goalTotal: profile.goal_total ?? prev.goalTotal,
        }));
        setEditForm(prev => ({
          ...prev,
          name: profile.name || '新用户',
          status: profile.status || prev.status,
          location: profile.location || prev.location,
          goal: profile.goal || prev.goal,
          goalCurrent: profile.goal_current ?? prev.goalCurrent,
          goalTotal: profile.goal_total ?? prev.goalTotal,
        }));
      }
    });
  }, []);

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [editForm, setEditForm] = useState(userInfo);

  // New multi-resume state
  const [resumes, setResumes] = useState<ResumeItem[]>([]);
  const [activeResumeId, setActiveResumeId] = useState<string | null>(null);

  React.useEffect(() => {
    resumesApi.list().then(data => {
      setResumes(data);
      if (data.length > 0) {
        setActiveResumeId(data[0].id);
      }
    }).catch(err => console.error("Failed to fetch resumes", err));
  }, []);

  const activeResume = resumes.find(r => r.id === activeResumeId) || null;

  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  
  const diagnosis = activeResume?.diagnosis || null;

  const resumeFileInputRef = useRef<HTMLInputElement>(null);

  const handleResumeFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const fileName = file.name;
      const fileExt = fileName.split('.').pop()?.toLowerCase();
      setIsParsing(true);

      try {
        let extractedText = '';
        if (fileExt === 'docx') {
          const arrayBuffer = await file.arrayBuffer();
          const result = await mammoth.extractRawText({ arrayBuffer });
          extractedText = result.value;
        } else if (fileExt === 'pdf') {
          const arrayBuffer = await file.arrayBuffer();
          const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
          const pdf = await loadingTask.promise;
          let fullText = '';
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            fullText += textContent.items.map((item: any) => item.str).join(' ') + '\n\n';
          }
          extractedText = fullText.trim();
        } else {
          extractedText = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (event) => resolve(event.target?.result as string);
            reader.readAsText(file);
          });
        }

        if (!extractedText || extractedText.trim().length === 0) {
          throw new Error('未提取到有效文字');
        }

        const newResume = await resumesApi.create({
          fileName,
          fileType: fileExt || 'file',
          text: extractedText
        });

        const updatedResumes = [newResume, ...resumes];
        setResumes(updatedResumes);
        setActiveResumeId(newResume.id);
        setIsPreviewing(true);
      } catch (error: any) {
        alert(`解析失败: ${error.message}`);
      } finally {
        setIsParsing(false);
        e.target.value = ''; 
      }
    }
  };

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleRemoveResume = async (e: React.MouseEvent | React.TouchEvent, id: string) => {
    e.stopPropagation();
    if (deletingId === id) {
      try {
        await resumesApi.delete(id);
        setResumes(prev => {
          const updatedResumes = prev.filter(r => r.id !== id);
          if (activeResumeId === id) {
            const nextActiveId = updatedResumes.length > 0 ? updatedResumes[0].id : null;
            setTimeout(() => {
              setActiveResumeId(nextActiveId);
            }, 0);
          }
          return updatedResumes;
        });
      } catch (err: any) {
        alert('删除失败: ' + err.message);
      }
      setDeletingId(null);
    } else {
      setDeletingId(id);
      setTimeout(() => {
        setDeletingId(current => current === id ? null : current);
      }, 3000);
    }
  };

  const handleCreateTextResume = async () => {
    try {
      const newResume = await resumesApi.create({
        fileName: `新简历稿 ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        fileType: 'txt',
        text: ''
      });
      setResumes([newResume, ...resumes]);
      setActiveResumeId(newResume.id);
    } catch (err: any) {
      alert('创建失败: ' + err.message);
    }
  };

  const saveTimeoutRef = useRef<NodeJS.Timeout>();

  const handleResumeChange = (text: string) => {
    if (!activeResumeId) return;
    setResumes(prev => prev.map(r => r.id === activeResumeId ? { ...r, text } : r));
    
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      resumesApi.update(activeResumeId, { text }).catch(() => {});
    }, 1000);
  };

  const handleSaveProfile = async () => {
    setUserInfo(editForm);
    try {
      await profileApi.update({
        name: editForm.name,
        location: editForm.location,
        status: editForm.status
      });
    } catch {}
    onNameChange(editForm.name);
    setIsEditingProfile(false);
  };

  const handleSaveGoal = async () => {
    setUserInfo(editForm);
    try {
      await profileApi.update({ goal: editForm.goal, goal_total: editForm.goalTotal });
    } catch {}
    setIsEditingGoal(false);
  };

  const handleCycleStatus = async () => {
    const statuses = ['求职中', '面试中', '待入职', '已入职'];
    const currentIndex = statuses.indexOf(userInfo.status);
    const nextIndex = (currentIndex + 1) % statuses.length;
    const updated = { ...userInfo, status: statuses[nextIndex] };
    setUserInfo(updated);
    try { await profileApi.update({ status: updated.status }); } catch {}
  };

  const handleIncrementGoal = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (userInfo.goalCurrent < userInfo.goalTotal) {
      const updated = { ...userInfo, goalCurrent: userInfo.goalCurrent + 1 };
      setUserInfo(updated);
      try { await profileApi.update({ goal_current: updated.goalCurrent }); } catch {}
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('图片大小不能超过 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        onAvatarChange(base64String);
      };
      reader.readAsDataURL(file);
    }
  };


  const handleDiagnose = async () => {
    if (!activeResume) {
      alert('请先上传或选择一份简历');
      return;
    }
    setIsDiagnosing(true);
    try {
      const result = await aiApi.diagnoseResume(activeResume.text);
      if (result) {
        setResumes(prev => prev.map(r => r.id === activeResume.id ? { ...r, diagnosis: result } : r));
        if (activeResume.id) {
          try {
            await resumesApi.update(activeResume.id, { diagnosis: result });
          } catch (e) {
            console.error('Save diagnosis error:', e);
          }
        }
      } else {
        alert('诊断失败，请检查网路');
      }
    } catch (err: any) {
      alert('诊断失败: ' + (err.message || '未知错误'));
    }
    setIsDiagnosing(false);
  };

  return (
    <div className="space-y-4 pb-12">
      {/* User Hero Section - Compact */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        <div className="lg:col-span-8 flex flex-col md:flex-row items-center md:items-start gap-4 bg-white p-4 rounded-xl shadow-sm border border-outline-variant/10">
          <div className="relative group cursor-pointer shrink-0" onClick={handleAvatarClick}>

            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleFileChange} 
            />
            <img 
              src={userAvatar} 
              alt="User" 
              className="w-24 h-24 rounded-full object-cover ring-4 ring-primary/5 transition-transform group-hover:scale-105 duration-500"
            />
            <button className="absolute bottom-2 right-2 bg-primary text-white p-2 rounded-full shadow-lg hover:scale-110 active:scale-95 transition-transform">
              <ICONS.Camera size={14} />
            </button>
          </div>
          <div className="text-center md:text-left space-y-3 flex-1">
            {isEditingProfile ? (
              <div className="space-y-4 max-w-sm">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-on-surface-variant/60">真实姓名</label>
                  <input 
                    className="w-full bg-surface-container-low px-4 py-2 rounded-xl border border-outline-variant/30 text-on-surface font-bold outline-none focus:ring-2 focus:ring-primary"
                    value={editForm.name}
                    onChange={e => setEditForm({...editForm, name: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-on-surface-variant/60">目前状态</label>
                    <input 
                      className="w-full bg-surface-container-low px-4 py-2 rounded-xl border border-outline-variant/30 text-xs font-bold outline-none focus:ring-2 focus:ring-primary"
                      value={editForm.status}
                      onChange={e => setEditForm({...editForm, status: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-on-surface-variant/60">城市地点</label>
                    <input 
                      className="w-full bg-surface-container-low px-4 py-2 rounded-xl border border-outline-variant/30 text-xs font-bold outline-none focus:ring-2 focus:ring-primary"
                      value={editForm.location}
                      onChange={e => setEditForm({...editForm, location: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-on-surface-variant/60">个人标签</label>
                  <input 
                    className="w-full bg-surface-container-low px-4 py-2 rounded-xl border border-outline-variant/30 text-xs font-bold outline-none focus:ring-2 focus:ring-primary"
                    value={editForm.tag}
                    onChange={e => setEditForm({...editForm, tag: e.target.value})}
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button onClick={handleSaveProfile} className="btn-primary py-2 px-4 rounded-xl text-xs">保存修改</button>
                  <button onClick={() => setIsEditingProfile(false)} className="py-2 px-4 bg-surface-container text-on-surface-variant rounded-xl text-xs font-bold">取消</button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-center relative w-full px-8">
                  <h1 className="text-on-surface w-full text-center">{userInfo.name}</h1>
                  <button 
                    onClick={() => {
                      setEditForm(userInfo);
                      setIsEditingProfile(true);
                    }}
                    className="absolute right-0 p-2 hover:bg-surface-container rounded-full text-primary transition-colors"
                    title="编辑基本信息"
                  >
                    <ICONS.Pencil size={18} />
                  </button>
                </div>
                <div className="flex flex-wrap justify-center gap-3 pt-3">
                  <button 
                    onClick={handleCycleStatus}
                    className="px-4 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-bold ring-1 ring-primary/20 hover:bg-primary/20 transition-all active:scale-95 flex items-center gap-2 group"
                    title="点击切换职业阶段"
                  >
                    {userInfo.status}
                    <ICONS.RefreshCw size={12} className="opacity-40 group-hover:rotate-180 transition-transform duration-500" />
                  </button>
                  <span className="px-4 py-1.5 bg-secondary-container/20 text-on-secondary-container rounded-full text-xs font-bold ring-1 ring-secondary-container/30">{userInfo.location}</span>
                  <span className="px-4 py-1.5 bg-surface-container-low text-on-surface-variant rounded-full text-xs font-bold border border-outline-variant/20 italic">{userInfo.tag}</span>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="lg:col-span-4 h-full bg-primary-container text-white p-4 rounded-xl flex flex-col justify-between shadow-lg relative overflow-hidden group min-h-[180px]">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/5 rounded-full blur-xl group-hover:scale-150 transition-transform duration-1000"></div>

          
          <div className="relative z-10 h-full flex flex-col">
            <div className="flex justify-between items-start mb-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-on-primary-container opacity-90">当前目标</p>
              {!isEditingGoal && (
                <button 
                  onClick={() => {
                    setEditForm(userInfo);
                    setIsEditingGoal(true);
                  }}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                  title="编辑目标"
                >
                  <ICONS.Pencil size={14} />
                </button>
              )}
            </div>

            {isEditingGoal ? (
              <div className="space-y-4 flex-1 flex flex-col justify-center">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-white/60">目标描述</label>
                  <input 
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white text-lg font-bold outline-none focus:bg-white/20"
                    value={editForm.goal}
                    onChange={e => setEditForm({...editForm, goal: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-white/60">当前进度</label>
                    <input 
                      type="number"
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white text-sm font-bold outline-none focus:bg-white/20"
                      value={editForm.goalCurrent}
                      onChange={e => setEditForm({...editForm, goalCurrent: parseInt(e.target.value) || 0})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-white/60">总目标数</label>
                    <input 
                      type="number"
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white text-sm font-bold outline-none focus:bg-white/20"
                      value={editForm.goalTotal}
                      onChange={e => setEditForm({...editForm, goalTotal: parseInt(e.target.value) || 1})}
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <button onClick={handleSaveGoal} className="px-3 py-1.5 bg-white text-primary rounded-lg text-[10px] font-black uppercase">保存</button>
                  <button onClick={() => setIsEditingGoal(false)} className="px-3 py-1.5 bg-black/20 text-white rounded-lg text-[10px] font-black uppercase">取消</button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col justify-center py-2">
                <h2 className="text-white text-xl lg:text-2xl mb-4 leading-tight font-black tracking-tight">{userInfo.goal}</h2>
                <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden shadow-inner flex items-center p-0.5 border border-white/5 cursor-pointer group/progress relative" onClick={handleIncrementGoal}>
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(userInfo.goalCurrent / userInfo.goalTotal) * 100}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="bg-white h-full rounded-full"
                  ></motion.div>
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/progress:opacity-100 transition-opacity">
                    <span className="text-[8px] font-black bg-white text-primary px-1.5 py-0.5 rounded-full shadow-sm">点击推进 +1</span>
                  </div>
                </div>
                <p className="mt-3 text-[11px] font-black tracking-wide text-white/80 uppercase">
                  进度：{userInfo.goalCurrent} / {userInfo.goalTotal}
                </p>
              </div>
            )}
          </div>
          <ICONS.Zap className="absolute -bottom-6 -right-6 text-white/5 pointer-events-none" size={100} />
        </div>
      </section>

      {/* Career Report Section - Optimized Layout */}
      <section className="bg-white p-4 rounded-xl border border-outline-variant/10 shadow-sm relative">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 relative z-10">
          <div className="space-y-0.5">
            <h3 className="flex items-center gap-2 text-on-surface text-base">
              <ICONS.ShieldCheck size={18} className="text-secondary" />
              简历管理与诊断
            </h3>
            <p className="text-[9px] text-on-surface-variant/40 font-black uppercase tracking-widest">多版本管理 · AI 智能评估</p>
          </div>
          <div className="flex items-center gap-2">
            <input 
              type="file" 
              ref={resumeFileInputRef} 
              className="hidden" 
              accept=".txt,.md,.pdf,.docx" 
              onChange={handleResumeFileUpload} 
            />
            <button 
              onClick={() => resumeFileInputRef.current?.click()}
              className="py-1.5 px-3 text-[11px] font-bold bg-white text-primary rounded-lg border border-primary/20 flex items-center gap-1.5 hover:bg-primary/5 transition-all active:scale-95"
            >
              <ICONS.Plus size={14} /> 上传文件
            </button>
            <button 
              onClick={handleCreateTextResume}
              className="py-1.5 px-3 text-[11px] font-bold bg-white text-on-surface-variant rounded-lg border border-outline-variant/30 flex items-center gap-1.5 hover:bg-surface-container transition-all active:scale-95"
            >
              <ICONS.Pencil size={14} /> 新建文字稿
            </button>
            <button 
              onClick={handleDiagnose}
              disabled={isDiagnosing || !activeResume}
              className="btn-primary py-1.5 px-5 text-[11px] flex items-center gap-1.5 shadow-sm disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-95"
            >
              {isDiagnosing ? <ICONS.RefreshCw className="animate-spin" size={14} /> : <ICONS.BrainCircuit size={14} />}
              诊断简历
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 relative z-10">
          {/* Resume Selection Sidebar */}
          <div className="lg:col-span-3 space-y-2">
            <label className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant/30 px-1">简历库 ({resumes.length})</label>
            <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
              <AnimatePresence mode="popLayout">
                {resumes.length === 0 ? (
                  <div className="border border-dashed border-outline-variant/30 rounded-xl p-6 text-center">
                    <p className="text-[10px] font-bold text-on-surface-variant/40">暂无简历，请点击上方上传</p>
                  </div>
                ) : (
                  resumes.map((resume) => (
                    <motion.div
                      key={resume.id}
                      layout
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      onClick={() => setActiveResumeId(resume.id)}
                      className={`group relative p-3 rounded-xl border transition-all cursor-pointer ${
                        activeResumeId === resume.id 
                          ? 'bg-primary/5 border-primary/30 shadow-sm' 
                          : 'bg-white border-outline-variant/10 hover:border-outline-variant/30'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          resume.fileType === 'pdf' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'
                        }`}>
                          {resume.fileType === 'pdf' ? <ICONS.FileText size={16} /> : <ICONS.File size={16} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className={`text-[11px] font-black truncate ${activeResumeId === resume.id ? 'text-primary' : 'text-on-surface'}`}>
                            {resume.fileName}
                          </h4>
                          <p className="text-[9px] text-on-surface-variant/40 font-bold uppercase mt-0.5">
                            {new Date(resume.createdAt).toLocaleDateString()} · {resume.text.length} 字符
                          </p>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity relative z-30">
                          <button 
                            onClick={(e) => { e.stopPropagation(); setIsPreviewing(true); }}
                            className="w-8 h-8 flex items-center justify-center hover:bg-on-surface/5 rounded-lg text-on-surface-variant transition-colors bg-white/50 backdrop-blur-sm shadow-sm"
                            title="预览"
                          >
                            <ICONS.Eye size={14} />
                          </button>
                          <button 
                            onClick={(e) => handleRemoveResume(e, resume.id)}
                            className={`h-8 px-2 flex items-center justify-center rounded-lg transition-all border ${
                              deletingId === resume.id 
                                ? 'bg-error text-white border-error w-auto gap-1 scale-105 shadow-md z-40' 
                                : 'bg-white/50 border-transparent hover:bg-error/10 hover:text-error text-error/60'
                            }`}
                            title={deletingId === resume.id ? "再次点击确定删除" : "删除"}
                          >
                            <ICONS.Trash2 size={14} />
                            {deletingId === resume.id && <span className="text-[9px] font-black uppercase">确定？</span>}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-on-surface-variant/30 italic px-1 pt-2">
              <ICONS.ShieldCheck size={12} className="opacity-40" />
              <span>数据仅持久化于浏览器 localstorage</span>
            </div>
          </div>

          {/* Analysis Result Area */}
          <div className="lg:col-span-9">
            <div className={`h-full min-h-[340px] rounded-xl border transition-all duration-500 overflow-hidden ${
              diagnosis 
                ? 'bg-white shadow-sm border-outline-variant/10' 
                : 'bg-on-surface/[0.01] border-dashed border-outline-variant/20'
            }`}>
              {!diagnosis && !isDiagnosing && (
                <div className="h-full flex flex-col p-6 space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                        <ICONS.Pencil size={18} className="text-primary" />
                      </div>
                      <div>
                        <h4 className="text-[11px] font-black text-on-surface uppercase tracking-widest">
                          {activeResume ? `编辑：${activeResume.fileName}` : '直接开始诊断'}
                        </h4>
                        <p className="text-[9px] text-on-surface-variant/40 font-bold">
                          {activeResume ? '在下方编辑内容后点击右上角诊断' : '在下方粘贴文字或从左侧选择简历'}
                        </p>
                      </div>
                    </div>
                    {activeResume && (
                      <div className="text-[10px] font-bold text-on-surface-variant/40">
                         {activeResume.text.length} 字符
                      </div>
                    )}
                  </div>

                  <textarea 
                    className="flex-1 w-full bg-on-surface/[0.015] border border-outline-variant/10 rounded-xl p-6 text-sm leading-relaxed outline-none focus:ring-2 focus:ring-primary/10 transition-all resize-none placeholder:text-on-surface-variant/20"
                    placeholder="在此键入或粘贴简历内容..."
                    value={activeResume?.text || ''}
                    onChange={(e) => {
                      if (activeResume) {
                        handleResumeChange(e.target.value);
                      } else {
                        // Create a new resume on the fly if starting to type
                        const newId = 'draft-' + Date.now();
                        const newName = `新简历 ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                        setResumes([{
                          id: newId,
                          fileName: newName,
                          fileType: 'txt',
                          text: e.target.value,
                          createdAt: Date.now()
                        }, ...resumes]);
                        setActiveResumeId(newId);
                      }
                    }}
                  />
                  
                  {!activeResume && (
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.03]">
                      <ICONS.FileSearch size={200} />
                    </div>
                  )}
                </div>
              )}
              
              {isDiagnosing && (
                <div className="h-full flex flex-col items-center justify-center p-8 space-y-6">
                  <div className="relative">
                    <motion.div 
                      animate={{ scale: [1, 1.05, 1], rotate: [0, 180, 360] }} 
                      transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                      className="w-16 h-16 border-2 border-primary/10 border-t-primary rounded-full"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <ICONS.Sparkles size={20} className="text-primary animate-pulse" />
                    </div>
                  </div>
                  <p className="text-[11px] font-bold text-on-surface-variant/40 uppercase tracking-widest animate-pulse">深度研读报告生成中...</p>
                </div>
              )}

              {diagnosis && !isDiagnosing && (
                <div className="h-full flex flex-col">
                  {/* Score & Key Info */}
                  <div className="p-6 border-b border-outline-variant/5 bg-on-surface/[0.01] flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="relative w-12 h-12 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle cx="24" cy="24" r="21" fill="transparent" stroke="currentColor" strokeWidth="3" className="text-primary/10" />
                          <circle cx="24" cy="24" r="21" fill="transparent" stroke="currentColor" strokeWidth="3" strokeDasharray={2 * Math.PI * 21} strokeDashoffset={2 * Math.PI * 21 * (1 - diagnosis.score / 100)} className="text-primary transition-all duration-1000" />
                        </svg>
                        <span className="absolute text-sm font-black text-primary">{diagnosis.score}</span>
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-on-surface">竞争力评估</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[9px] font-black uppercase text-secondary bg-secondary/10 px-1.5 py-0.5 rounded">估值</span>
                          <span className="text-[11px] font-bold text-on-surface-variant font-mono">
                            {diagnosis.marketValue?.replace(/(\d+)\s*km/gi, '$1k')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                    {/* Strengths & Weaknesses (Horizontal on large) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <h5 className="text-[9px] font-black uppercase tracking-[0.2em] text-secondary flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-secondary"></div>
                          核心优势
                        </h5>
                        <div className="space-y-2">
                          {diagnosis.strengths.map((s: string, i: number) => (
                            <div key={i} className="flex gap-2 text-[11px] leading-relaxed text-on-surface-variant bg-secondary/[0.02] p-3 rounded-lg border border-secondary/5">
                              <ICONS.CheckCircle2 size={12} className="text-secondary shrink-0 mt-0.5" />
                              {s}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-3">
                        <h5 className="text-[9px] font-black uppercase tracking-[0.2em] text-error flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-error"></div>
                          薄弱环节
                        </h5>
                        <div className="space-y-2">
                          {diagnosis.weaknesses.map((w: string, i: number) => (
                            <div key={i} className="flex gap-2 text-[11px] leading-relaxed text-on-surface-variant bg-error/[0.02] p-3 rounded-lg border border-error/5">
                              <ICONS.AlertTriangle size={12} className="text-error shrink-0 mt-0.5" />
                              {w}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Compact suggestions */}
                    <div className="space-y-3 pt-4 border-t border-outline-variant/10">
                      <h5 className="text-[9px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-1.5">
                        <ICONS.Zap size={12} className="fill-primary" />
                        高优先级修改建议
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {diagnosis.suggestions.map((s: string, i: number) => (
                          <div key={i} className="flex items-start gap-2.5 p-3 bg-on-surface/[0.015] border border-outline-variant/10 rounded-lg hover:border-primary/20 transition-all">
                             <div className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center text-[9px] font-black text-primary shrink-0 mt-0.5">{i+1}</div>
                             <p className="text-[11px] text-on-surface-variant leading-relaxed font-medium">{s}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>


      {/* Career Metrics Section (Condensed) */}
      <section className="bg-white p-4 rounded-2xl border border-outline-variant/10 shadow-sm">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <ReportMetric label="投递总数" value={totalApps} change="已录入记录" trend="neutral" />
          <ReportMetric label="面试转化" value={`${interviewRate}%`} change={`${interviewingCount} 场面试`} trend={interviewRate > 20 ? 'up' : 'neutral'} />
          <ReportMetric label="核心意向" value={offerCount} change="斩获录用" trend={offerCount > 0 ? 'up' : 'neutral'} />
          <ReportMetric label="平均匹配度" value={avgMatch} change="AI 智能评估" trend="neutral" />
        </div>
      </section>


      {/* Resume Content Preview Overlay */}
      <AnimatePresence>
        {isPreviewing && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-on-surface/40 backdrop-blur-sm"
            onClick={() => setIsPreviewing(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-3xl max-h-[80vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 border-b border-outline-variant/10 flex justify-between items-center bg-surface-container-low">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-xl shadow-sm">
                    <ICONS.FileText className="text-primary" size={20} />
                  </div>
                  <div>
                    <h3 className="text-on-surface font-black text-sm">{activeResume?.fileName || '简历内容预览'}</h3>
                    <p className="text-[10px] text-on-surface-variant/60 font-bold uppercase tracking-widest text-left">精准提取版本 · 支持即时微调</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsPreviewing(false)}
                  className="p-2 hover:bg-on-surface/5 rounded-full transition-colors"
                >
                  <ICONS.Plus className="rotate-45" size={24} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-8">
                <textarea 
                  className="w-full h-full min-h-[400px] outline-none text-sm leading-relaxed text-on-surface font-medium resize-none text-left"
                  value={activeResume?.text || ''}
                  onChange={e => handleResumeChange(e.target.value)}
                  placeholder="编辑您的简历内容..."
                />
              </div>

              <div className="p-6 border-t border-outline-variant/10 bg-white flex justify-between items-center">
                <div className="text-[10px] font-bold text-on-surface-variant/40">
                  修改将自动保存到本地缓存
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setIsPreviewing(false)}
                    className="px-6 py-2.5 text-xs font-bold text-on-surface-variant hover:bg-surface-container rounded-xl transition-colors"
                  >
                    完成编辑
                  </button>
                  <button 
                    onClick={() => {
                      setIsPreviewing(false);
                      handleDiagnose();
                    }}
                    className="btn-primary px-8 py-2.5 text-xs flex items-center gap-2 shadow-lg shadow-primary/20"
                  >
                    <ICONS.BrainCircuit size={16} /> 保存并开始诊断
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ReportMetric({ label, value, change, trend }: any) {
  return (
    <div className="text-center md:text-left space-y-1.5 p-4 rounded-xl hover:bg-surface-container-low/50 transition-colors">
      <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-70">{label}</p>
      <p className="text-3xl font-black text-on-surface">{value}</p>
      <p className={`text-[10px] font-black uppercase ${trend === 'up' ? 'text-secondary' : 'text-on-surface-variant'}`}>{change}</p>
    </div>
  );
}
