import React, { useState } from 'react';
import { Application, ICONS } from '../constants';
import { motion, AnimatePresence } from 'motion/react';
import { aiApi } from '../services/apiClient';

interface Retrospective {
  id: string;
  round: string;
  date: string;
  rating: number;
  keeps: string[];
  problems: string[];
  takeaways: { title: string; desc: string }[];
  aiFeedback?: string[];
}

interface DetailsViewProps {
  application: Application;
  onBack: () => void;
  onUpdate: (updated: Partial<Application>) => void;
  activities: any[];
  onAddActivity: (activity: any) => void;
  onUpdateActivity: (activity: any) => void;
}

export default function DetailsView({ application, onBack, onUpdate, activities, onAddActivity, onUpdateActivity }: DetailsViewProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<any>(application.aiPrep || null);
  const [showAddRetro, setShowAddRetro] = useState(false);
  const [editingRetro, setEditingRetro] = useState<Retrospective | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    role: application.role,
    company: application.company,
    salary: application.salary,
    location: application.location,
    jdSummary: application.jdSummary,
    stage: application.stage,
    source: application.source || '',
    financing: application.financing || '',
    size: application.size || '',
    website: application.website || '',
    timeline: application.timeline || { applied: '', test: '', interview: '', offer: '' }
  });

  const retrospectives = application.retrospectives || [];

  const handleAiPrep = async () => {
    if (isAnalyzing) return;
    setIsAnalyzing(true);
    try {
      const result = await aiApi.interviewStrategy(
        application.role,
        application.company,
        application.jdSummary || ""
      );
      if (result) {
        setAiAnalysis(result);
        onUpdate({ aiPrep: result });
      } else {
        alert("AI 分析生成失败，请检查网络或 API 配置。");
      }
    } catch (error) {
      console.error("AI Prep Error:", error);
      alert("AI 分析发生错误，请稍后再试。");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const STAGES: Application['stage'][] = ['筛选简历中', '笔试中', '面试中', '终面', '获录取', '已终止'];

  const getStatusFromStage = (stage: string): Application['status'] => {
    if (stage === '筛选简历中') return 'applied';
    if (stage === '笔试中') return 'test';
    if (stage === '面试中' || stage === '终面') return 'interviewing';
    if (stage === '获录取') return 'offer';
    if (stage === '已终止') return 'rejected';
    return 'applied';
  };

  const handleNextStage = () => {
    const currentIndex = STAGES.indexOf(application.stage as any);
    
    // If current stage is not in our official list (like mock data "第 2/4 轮"),
    // find a logical next stage based on status
    if (currentIndex === -1) {
      let nextStage: Application['stage'];
      if (application.status === 'applied') nextStage = STAGES[1]; // -> test
      else if (application.status === 'test') nextStage = STAGES[2]; // -> interviewing
      else if (application.status === 'interviewing') nextStage = STAGES[3]; // -> final
      else nextStage = STAGES[0];
      
      onUpdate({ stage: nextStage, status: getStatusFromStage(nextStage) });
      return;
    }

    if (currentIndex < STAGES.length - 1) {
      const nextStage = STAGES[currentIndex + 1];
      onUpdate({ stage: nextStage, status: getStatusFromStage(nextStage) });
    }
  };

  const handlePrevStage = () => {
    const currentIndex = STAGES.indexOf(application.stage as any);
    
    if (currentIndex === -1) {
      let prevStage: Application['stage'];
      if (application.status === 'interviewing') prevStage = STAGES[1]; // -> test
      else if (application.status === 'test') prevStage = STAGES[0]; // -> applied
      else prevStage = STAGES[0];
      
      onUpdate({ stage: prevStage, status: getStatusFromStage(prevStage) });
      return;
    }

    if (currentIndex > 0) {
      const prevStage = STAGES[currentIndex - 1];
      onUpdate({ stage: prevStage, status: getStatusFromStage(prevStage) });
    }
  };

  const [showTerminateModal, setShowTerminateModal] = useState(false);
  const [terminateReason, setTerminateReason] = useState('');

  const handleTerminate = () => {
    onUpdate({ 
      status: 'rejected', 
      stage: terminateReason || '流程终止',
      updatedAt: '刚刚'
    });
    setShowTerminateModal(false);
  };

  const handleSaveEdit = async () => {
    onUpdate({
      ...editForm,
      status: getStatusFromStage(editForm.stage),
      timeline: editForm.timeline
    });

    // Auto-sync timeline to schedule
    const timelineKeys = [
      { key: 'applied', label: '已投递', type: 'other' },
      { key: 'test', label: '笔试', type: 'test' },
      { key: 'interview', label: '面试', type: 'interview' },
      { key: 'offer', label: '获得 Offer', type: 'other' }
    ];

    for (const { key, label, type } of timelineKeys) {
      const date = (editForm.timeline as any)[key];
      if (date) {
        const existing = activities.find(a => 
          a.applicationId === application.id && 
          (a.title.includes(label) || (type === a.type && a.title.includes(application.company)))
        );

        const activityData = {
          title: `${application.company} - ${label}`,
          date: date,
          time: '10:00',
          type: type as any,
          location: application.location || '待定',
          applicationId: application.id,
          isCompleted: false
        };

        if (existing) {
          await onUpdateActivity({ ...existing, ...activityData });
        } else {
          await onAddActivity(activityData);
        }
      }
    }

    setIsEditing(false);
  };

  const handleAddRetro = async (newRetro: Retrospective) => {
    // Initial UI update
    const updatedRetros = [newRetro, ...retrospectives];
    onUpdate({ retrospectives: updatedRetros });
    setShowAddRetro(false);

    // Fetch AI Feedback asynchronously via backend
    try {
      const feedback = await aiApi.retroFeedback(newRetro.keeps, newRetro.problems);
      if (feedback) {
        const finalRetros = updatedRetros.map(r => r.id === newRetro.id ? { ...r, aiFeedback: feedback } : r);
        onUpdate({ retrospectives: finalRetros });
      }
    } catch (err) {
      console.error('AI retro feedback error:', err);
    }
  };

  return (
    <div className="space-y-10">
      {/* Job Header Card */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl p-8 shadow-sm border-t-4 border-primary">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-outline-variant/10">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.1em] ${application.status === 'rejected' ? 'bg-error/10 text-error shadow-sm' : 'bg-primary/10 text-primary shadow-sm'}`}>
                    {application.status === 'rejected' ? '流程终止' : application.status === 'offer' ? '已收录 Offer' : application.stage}
                  </span>
                  <span className="text-on-surface-variant text-[10px] font-bold tracking-tight opacity-50">
                    最后更新 {application.updatedAt}
                  </span>
                </div>

                {isEditing ? (
                  <div className="flex flex-col gap-3">
                    <input 
                      className="text-3xl md:text-4xl font-black text-on-surface bg-surface-container-low px-4 py-2 rounded-2xl border border-outline-variant/20 focus:border-primary outline-none transition-all placeholder:text-outline-variant"
                      value={editForm.role}
                      onChange={e => setEditForm(prev => ({ ...prev, role: e.target.value }))}
                      placeholder="职位名称"
                    />
                    <input 
                      className="text-lg font-bold text-on-surface-variant/80 bg-surface-container-low px-4 py-1.5 rounded-xl border border-outline-variant/20 focus:border-primary outline-none transition-all placeholder:text-outline-variant/50"
                      value={editForm.company}
                      onChange={e => setEditForm(prev => ({ ...prev, company: e.target.value }))}
                      placeholder="公司名称"
                    />
                  </div>
                ) : (
                  <div>
                    <h1 className="text-4xl md:text-5xl font-black text-on-surface tracking-tight leading-tight mb-1">
                      {application.role}
                    </h1>
                    <p className="text-xl md:text-2xl font-bold text-on-surface-variant/80 tracking-tight">
                      {application.company}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {isEditing ? null : (
                  <>
                    <div className="flex items-center bg-surface-container-low p-1.5 rounded-2xl border border-outline-variant/30 shadow-sm">
                      <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={handlePrevStage}
                        disabled={application.stage === STAGES[0] || application.status === 'rejected'}
                        className="w-10 h-10 flex items-center justify-center bg-white hover:bg-surface-container-high rounded-xl transition-all text-on-surface-variant disabled:opacity-30 disabled:cursor-not-allowed shadow-sm border border-outline-variant/10 active:bg-surface-container-low"
                        title="退回前一阶段"
                      >
                        <ICONS.ChevronLeft size={18} />
                      </motion.button>
                      
                      <div className="px-5 flex flex-col items-center min-w-[110px]">
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-on-surface-variant/50 mb-0.5">当前阶段</span>
                        <AnimatePresence mode="wait">
                          <motion.span 
                            key={application.stage}
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 5 }}
                            className={`text-xs font-bold tracking-tight truncate max-w-[120px] ${application.status === 'rejected' ? 'text-error' : 'text-primary'}`}
                          >
                            {application.stage}
                          </motion.span>
                        </AnimatePresence>
                      </div>

                      <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={handleNextStage}
                        disabled={application.stage === STAGES[STAGES.length - 1] || application.status === 'rejected'}
                        className="w-10 h-10 flex items-center justify-center bg-primary text-white hover:bg-primary/90 rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-md shadow-primary/20 active:bg-primary-dark"
                        title="并入下一阶段"
                      >
                        <ICONS.ChevronRight size={18} />
                      </motion.button>
                    </div>

                    <div className="flex items-center gap-2">
                      {application.status !== 'rejected' ? (
                        <button 
                          onClick={() => setShowTerminateModal(true)}
                          className="h-10 px-4 flex items-center gap-2 rounded-xl bg-white border border-error/20 text-error hover:bg-error/5 transition-all text-xs font-bold group"
                        >
                          <ICONS.AlertCircle size={16} className="group-hover:rotate-12 transition-transform" />
                          <span>终止流程</span>
                        </button>
                      ) : (
                        <button 
                          onClick={() => onUpdate({ status: 'applied', stage: '筛选简历中' })}
                          className="h-10 px-4 flex items-center gap-2 rounded-xl bg-secondary/10 text-secondary hover:bg-secondary/20 transition-all text-xs font-bold"
                        >
                          <ICONS.RefreshCw size={16} />
                          <span>重新开启</span>
                        </button>
                      )}

                      <button 
                        onClick={() => setIsEditing(true)}
                        className="h-10 px-4 flex items-center gap-2 rounded-xl bg-surface-container text-on-surface-variant hover:bg-surface-container-high transition-all text-xs font-bold border border-outline-variant/20"
                      >
                        <ICONS.Pencil size={16} />
                        <span>编辑</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 py-10 border-y border-outline-variant/10">
              {isEditing ? (
                <>
                  <div className="md:col-span-4 grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 pb-4 border-b border-outline-variant/5">
                    <EditInfoItem 
                      label="投递日期" 
                      value={editForm.timeline?.applied || ''} 
                      onChange={v => setEditForm(p => ({ ...p, timeline: { ...p.timeline, applied: v } }))} 
                      type="date"
                    />
                    <EditInfoItem 
                      label="笔试日期" 
                      value={editForm.timeline?.test || ''} 
                      onChange={v => setEditForm(p => ({ ...p, timeline: { ...p.timeline, test: v } }))} 
                      type="date"
                    />
                    <EditInfoItem 
                      label="面试日期" 
                      value={editForm.timeline?.interview || ''} 
                      onChange={v => setEditForm(p => ({ ...p, timeline: { ...p.timeline, interview: v } }))} 
                      type="date"
                    />
                    <EditInfoItem 
                      label="Offer日期" 
                      value={editForm.timeline?.offer || ''} 
                      onChange={v => setEditForm(p => ({ ...p, timeline: { ...p.timeline, offer: v } }))} 
                      type="date"
                    />
                  </div>
                  <EditInfoItem 
                    label="薪资范围" 
                    value={editForm.salary} 
                    onChange={v => setEditForm(p => ({ ...p, salary: v }))} 
                  />
                  <EditInfoItem 
                    label="工作地点" 
                    value={editForm.location} 
                    onChange={v => setEditForm(p => ({ ...p, location: v }))} 
                  />
                  <EditInfoItem 
                    label="投递渠道" 
                    value={editForm.source} 
                    onChange={v => setEditForm(p => ({ ...p, source: v }))} 
                    placeholder="Boss, 官网等"
                  />
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-60">当前轮次</label>
                    <div className="relative">
                      <select 
                        className="w-full bg-surface-container-low px-4 py-3 rounded-2xl border border-outline-variant/20 text-sm font-bold text-on-surface appearance-none outline-none focus:ring-2 focus:ring-primary transition-all pr-10"
                        value={editForm.stage}
                        onChange={e => setEditForm(prev => ({ ...prev, stage: e.target.value as any }))}
                      >
                        {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant/50">
                        <ICONS.ChevronDown size={16} />
                      </div>
                    </div>
                  </div>
                  <EditInfoItem 
                    label="融资阶段" 
                    value={editForm.financing} 
                    onChange={v => setEditForm(p => ({ ...p, financing: v }))} 
                  />
                  <EditInfoItem 
                    label="人员规模" 
                    value={editForm.size} 
                    onChange={v => setEditForm(p => ({ ...p, size: v }))} 
                  />
                  <EditInfoItem 
                    label="公司官网" 
                    value={editForm.website} 
                    onChange={v => setEditForm(p => ({ ...p, website: v }))} 
                    className="md:col-span-2"
                  />
                </>
              ) : (
                <>
                  <InfoItem label="薪资范围" value={application.salary} icon={ICONS.Salary} />
                  <InfoItem label="地点" value={application.location} icon={ICONS.MapPin} />
                  <InfoItem label="投递渠道" value={application.source || '未填'} icon={ICONS.Briefcase} />
                  <InfoItem label="当前轮次" value={application.stage} icon={ICONS.Target} />
                </>
              )}
            </div>

            <div className="mt-8 flex flex-col md:flex-row md:items-center gap-8 py-6 border-b border-outline-variant/10">
              <div className="shrink-0 flex items-center gap-2">
                <ICONS.Clock size={16} className="text-primary" />
                <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">关键时间点</span>
              </div>
              <div className="flex flex-wrap gap-x-8 gap-y-4">
                <TimelinePoint label="已投递" date={application.timeline?.applied} />
                <TimelinePoint label="笔试" date={application.timeline?.test} />
                <TimelinePoint label="面试" date={application.timeline?.interview} />
                <TimelinePoint label="获得Offer" date={application.timeline?.offer} isHighlight={application.status === 'offer'} />
              </div>
            </div>

            <div className="mt-8">
              <h4 className="font-bold text-on-surface mb-3 flex items-center gap-2">
                <ICONS.FileText size={18} className="text-primary" /> 职位描述 (JD) 摘要
              </h4>
              {isEditing ? (
                <div className="space-y-4">
                  <textarea 
                    rows={6}
                    className="w-full text-on-surface-variant text-sm font-bold leading-relaxed bg-surface-container-low px-4 py-3 rounded-2xl outline-none focus:ring-2 focus:ring-primary border border-outline-variant/20 resize-none transition-all"
                    value={editForm.jdSummary}
                    onChange={e => setEditForm(prev => ({ ...prev, jdSummary: e.target.value }))}
                  />
                  <div className="flex justify-end gap-3 pt-2">
                    <button 
                      onClick={() => setIsEditing(false)}
                      className="px-8 py-3 rounded-xl bg-surface-container text-on-surface-variant font-bold hover:bg-surface-container-high transition-all border border-outline-variant/30 whitespace-nowrap"
                    >
                      取消
                    </button>
                    <button 
                      onClick={handleSaveEdit}
                      className="px-10 py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary-dark transition-all shadow-lg shadow-primary/25 flex items-center gap-2 whitespace-nowrap"
                    >
                      <ICONS.Check size={20} />
                      <span>保存修改</span>
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-on-surface-variant text-sm leading-relaxed leading-[1.7]">
                  {application.jdSummary}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Company Sidebar */}
        <aside className="space-y-6">
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-outline-variant/10 h-full">
            <h3 className="text-on-surface mb-6">企业信息</h3>
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 bg-surface-container-low rounded-2xl flex items-center justify-center p-2 border border-outline-variant/10">
                <img src={application.logoUrl} alt={application.company} className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="font-bold text-lg text-on-surface">{application.company}</p>
                <p className="text-on-surface-variant text-xs">全球领先的互联网科技公司</p>
              </div>
            </div>
            
            <div className="space-y-5 border-t border-outline-variant/10 pt-6">
              <SidebarItem label="融资阶段" value={application.financing || '未知'} />
              <SidebarItem label="人员规模" value={application.size || '未知'} />
              <SidebarItem label="公司官网" value={application.website || '未知'} isLink />
            </div>

            <div className="mt-10 p-4 bg-primary/5 rounded-xl flex items-start gap-3 border border-primary/10">
              <ICONS.AlertCircle size={20} className="text-primary shrink-0 mt-0.5" />
              <p className="text-[11px] text-primary/80 font-medium leading-tight">
                该单位近期在 AI 领域有 20+ 个活跃需求，竞争度较高，建议突出算法落地经验。
              </p>
            </div>
          </div>
        </aside>
      </section>

      {/* AI Interview Prep Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-on-surface">
            <ICONS.Sparkles className="text-tertiary" /> AI 面试备战
          </h2>
          {!isAnalyzing && (
            <button 
              onClick={handleAiPrep}
              className="flex items-center gap-2 text-primary font-bold text-sm bg-primary/10 px-4 py-2 rounded-full hover:bg-primary/15 transition-colors"
            >
              {aiAnalysis ? (
                <>
                  <ICONS.RefreshCw size={18} /> 重新生成报告
                </>
              ) : (
                <>
                  <ICONS.BrainCircuit size={18} /> 开始 AI 备战分析
                </>
              )}
            </button>
          )}
        </div>

        {isAnalyzing ? (
          <div className="bg-white rounded-2xl p-12 shadow-sm flex flex-col items-center justify-center space-y-6">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              className="text-primary"
            >
              <ICONS.RefreshCw size={48} />
            </motion.div>
            <p className="text-on-surface-variant font-medium animate-pulse">正在为您深度剖析面试策略...</p>
          </div>
        ) : aiAnalysis ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AiPrepCard title="核心能力匹配" icon={<ICONS.BarChart3 className="text-primary" />}>
              <ul className="space-y-4">
                {aiAnalysis.coreCompetencies.map((comp: any) => (
                  <li key={comp.name}>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-on-surface-variant text-xs font-bold uppercase">{comp.name}</span>
                      <span className="text-[10px] bg-secondary-container/20 text-secondary px-2 py-0.5 rounded font-black">{comp.score}% 匹配</span>
                    </div>
                    <div className="w-full h-1.5 bg-surface-container-low rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${comp.score}%` }}
                        transition={{ duration: 1 }}
                        className="h-full bg-secondary rounded-full"
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </AiPrepCard>

            <AiPrepCard title="预测面试考点与回复思路" icon={<ICONS.MessageSquareQuote className="text-tertiary" />}>
              <div className="space-y-6">
                {aiAnalysis.predictedQuestions.map((q: any, i: number) => (
                  <div key={i} className={`p-6 rounded-2xl ${i === currentQuestionIndex ? 'bg-tertiary/5 border-2 border-tertiary/20 shadow-md' : 'bg-surface-container-low border border-outline-variant/10'}`}>
                    <div className="flex justify-between items-start gap-4 mb-4">
                       <p className="text-base font-black text-on-surface leading-snug">"{q.question}"</p>
                       <button 
                         onClick={() => setCurrentQuestionIndex(i)}
                         className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest transition-colors ${i === currentQuestionIndex ? 'bg-tertiary text-white' : 'bg-white text-on-surface-variant hover:bg-tertiary/10'}`}
                       >
                         {i === currentQuestionIndex ? '解析中' : '查看解析'}
                       </button>
                    </div>
                    
                    {i === currentQuestionIndex && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="space-y-4 pt-4 border-t border-tertiary/10"
                      >
                        <div className="space-y-1">
                          <p className="text-[10px] font-black uppercase tracking-widest text-secondary">考察意图</p>
                          <p className="text-xs text-on-surface-variant font-medium leading-relaxed">{q.context}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-black uppercase tracking-widest text-primary">考点（核心能力）</p>
                          <p className="text-xs text-on-surface-variant font-medium leading-relaxed">{q.keyPoints}</p>
                        </div>
                        <div className="bg-white/50 p-4 rounded-xl border border-secondary/10">
                          <p className="text-[10px] font-black uppercase tracking-widest text-secondary mb-2 flex items-center gap-1">
                            <ICONS.Lightbulb size={12} /> 建议回复思路
                          </p>
                          <p className="text-xs text-on-surface-variant leading-relaxed">
                            {q.suggestedAnswer}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </div>
                ))}
              </div>
            </AiPrepCard>

            <div className="lg:col-span-1 space-y-6">
              <div className="bg-gradient-to-br from-primary to-primary-container rounded-2xl p-8 shadow-lg text-white">
                <h4 className="font-bold mb-4 flex items-center gap-2">
                  <ICONS.Target size={20} /> 核心应对策略
                </h4>
                <p className="text-sm text-on-primary-container leading-[1.8] mb-6">
                  {aiAnalysis.strategy}
                </p>
                <div className="bg-white/10 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <ICONS.AlertCircle size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest">避坑指南</span>
                  </div>
                  <p className="text-[11px] text-on-primary-container opacity-90 leading-relaxed">
                    {aiAnalysis.avoidPits}
                  </p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-outline-variant/10 shadow-sm space-y-4">
                <h4 className="text-xs font-black uppercase tracking-widest text-on-surface-variant">面试贴士</h4>
                <div className="flex items-start gap-3">
                  <ICONS.Zap size={18} className="text-secondary shrink-0 mt-0.5" />
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    记住：面试官不仅在听你的答案，还在观察你的思考逻辑和沟通风格。
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-surface-container-low/50 rounded-2xl p-12 border border-dashed border-outline-variant text-center space-y-4">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm">
              <ICONS.Sparkles className="text-primary/20" size={32} />
            </div>
            <p className="text-on-surface-variant font-medium">点击上方按钮，基于职位描述生成定制化的面试大模型分析</p>
          </div>
        )}

      </section>

      {/* Retrospective Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-on-surface">
            <ICONS.FileText className="text-primary" /> 面试复盘记录
          </h2>
          <button 
            onClick={() => setShowAddRetro(true)}
            className="flex items-center gap-2 text-primary font-bold text-sm bg-primary/10 px-4 py-2 rounded-full hover:bg-primary/15 transition-colors"
          >
            <ICONS.Plus size={18} /> 新增复盘
          </button>
        </div>

        <div className="space-y-6">
          {retrospectives.length > 0 ? retrospectives.map((retro) => (
            <div key={retro.id} className="bg-white rounded-2xl shadow-sm border border-outline-variant/10 overflow-hidden">
              <div className="bg-surface-container-low px-8 py-5 border-b border-outline-variant/10 flex justify-between items-center flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <span className="font-bold text-on-surface">{retro.round}</span>
                  <span className="text-outline text-xs tabular-nums">{retro.date}</span>
                  <button 
                    onClick={() => setEditingRetro(retro)}
                    className="p-1.5 hover:bg-surface-container rounded-lg transition-colors text-on-surface-variant"
                    title="修改复盘内容"
                  >
                    <ICONS.Pencil size={14} />
                  </button>
                </div>
                <div className="flex items-center gap-1 text-primary">
                  {[...Array(5)].map((_, i) => (
                    <ICONS.Star 
                      key={i} 
                      size={16} 
                      fill={i < Math.floor(retro.rating) ? "currentColor" : "none"} 
                      className={i < Math.floor(retro.rating) ? "text-primary" : "text-outline/20"}
                    />
                  ))}
                  <span className="ml-3 font-black text-sm">{retro.rating.toFixed(1)} / 5</span>
                </div>
              </div>
              
              <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                <div className="space-y-8">
                  <div>
                    <h5 className="text-[10px] font-black uppercase tracking-widest text-secondary mb-4 flex items-center gap-2">
                      <div className="w-1.5 h-4 bg-secondary rounded-full"></div> 亮点表现 (Keep)
                    </h5>
                    <div className="flex flex-wrap gap-2">
                      {retro.keeps.map((keep, i) => (
                        <Badge key={i} text={keep} color="bg-secondary/10 text-secondary" />
                      ))}
                    </div>
                  </div>
                  <div>
                    <h5 className="text-[10px] font-black uppercase tracking-widest text-error mb-4 flex items-center gap-2">
                      <div className="w-1.5 h-4 bg-error rounded-full"></div> 待改进点 (Problem)
                    </h5>
                    <ul className="text-on-surface-variant text-sm space-y-2 list-disc list-inside leading-relaxed opacity-80">
                      {retro.problems.map((prob, i) => (
                        <li key={i}>{prob}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <h5 className="text-[10px] font-black uppercase tracking-widest text-on-surface">AI 诊断建议</h5>
                  {retro.aiFeedback ? (
                    <div className="space-y-3">
                      {retro.aiFeedback.map((tip, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 bg-primary/5 rounded-xl border border-primary/10">
                          <ICONS.Sparkles size={14} className="text-primary mt-0.5 shrink-0" />
                          <p className="text-[11px] text-primary/80 font-medium leading-relaxed">{tip}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 flex flex-col items-center justify-center border border-dashed border-outline-variant/30 rounded-2xl opacity-40">
                      <ICONS.BrainCircuit size={24} className="animate-pulse mb-2 text-primary" />
                      <p className="text-[10px] font-bold">AI 正在深度诊断中...</p>
                    </div>
                  )}
                </div>
                
                <div className="bg-surface-container-low rounded-2xl p-6 space-y-6">
                  <h5 className="text-[10px] font-black uppercase tracking-widest text-on-surface">核心 Takeaways</h5>
                  <div className="space-y-4">
                    {retro.takeaways.map((task, i) => (
                      <TakeawayItem 
                        key={i}
                        title={task.title} 
                        desc={task.desc} 
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )) : (
            <div className="bg-surface-container-low/50 rounded-2xl p-16 border border-dashed border-outline-variant/30 text-center space-y-6">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm">
                <ICONS.FileText className="text-primary/20" size={36} />
              </div>
              <div className="max-w-xs mx-auto">
                <h4 className="text-on-surface font-bold text-lg mb-2">暂无复盘记录</h4>
                <p className="text-on-surface-variant text-sm leading-relaxed">
                  面试结束后及时记录表现和不足，系统将为你提供 AI 诊断并沉淀成长建议。
                </p>
              </div>
              <button 
                onClick={() => setShowAddRetro(true)}
                className="btn-primary px-8 py-3 rounded-xl shadow-lg shadow-primary/20"
              >
                记录第一场面试
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Add/Edit Retro Modal */}
      <AnimatePresence>
        {(showAddRetro || editingRetro) && (
          <NewRetroModal 
            initialData={editingRetro || undefined}
            onClose={() => { setShowAddRetro(false); setEditingRetro(null); }} 
            onSubmit={(retro) => {
              if (editingRetro) {
                 const updated = retrospectives.map(r => r.id === retro.id ? retro : r);
                 onUpdate({ retrospectives: updated });
                 setEditingRetro(null);
              } else {
                 handleAddRetro(retro);
              }
            }} 
          />
        )}
      </AnimatePresence>

      {/* Terminate Modal */}
      <AnimatePresence>
        {showTerminateModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTerminateModal(false)}
              className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 space-y-6"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-error/10 text-error rounded-full flex items-center justify-center mx-auto mb-4">
                  <ICONS.AlertCircle size={32} />
                </div>
                <h3 className="text-xl font-bold text-on-surface">确定要终止该职位流程吗？</h3>
                <p className="text-on-surface-variant text-sm mt-2">被终止的申请将进入“已结束”分类，你可以随时在所有投递中查看它。</p>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-2">终止原因 (可选)</label>
                <select 
                  className="w-full px-4 py-3 rounded-xl border border-outline-variant/30 focus:ring-2 focus:ring-primary outline-none text-sm"
                  value={terminateReason}
                  onChange={e => setTerminateReason(e.target.value)}
                >
                  <option value="">选择原因...</option>
                  <option value="流程终止：简历未过">简历未过</option>
                  <option value="流程终止：面试不通过">面试不通过</option>
                  <option value="流程终止：岗位关闭">岗位关闭</option>
                  <option value="流程终止：主动放弃">主动放弃</option>
                  <option value="流程终止：收到其他 Offer">收到其他 Offer</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setShowTerminateModal(false)}
                  className="flex-1 py-3 rounded-xl bg-surface-container text-on-surface-variant font-bold hover:bg-surface-container-high transition-colors"
                >
                  再想想
                </button>
                <button 
                  onClick={handleTerminate}
                  className="flex-1 py-3 rounded-xl bg-error text-white font-bold hover:bg-error/90 transition-shadow shadow-lg shadow-error/20"
                >
                  确认终止
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NewRetroModal({ onClose, onSubmit, initialData }: { onClose: () => void, onSubmit: (retro: Retrospective) => void, initialData?: Retrospective }) {
  const [round, setRound] = useState(initialData?.round || '');
  const [rating, setRating] = useState(initialData?.rating || 4);
  const [keeps, setKeeps] = useState(initialData?.keeps.join('\n') || '');
  const [problems, setProblems] = useState(initialData?.problems.join('\n') || '');
  const [takeaways, setTakeaways] = useState(initialData?.takeaways.map(t => `${t.title}:${t.desc}`).join('\n') || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newRetro: Retrospective = {
      ...initialData,
      id: initialData?.id || Math.random().toString(36).substr(2, 9),
      round,
      date: initialData?.date || new Date().toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }),
      rating,
      keeps: keeps.split('\n').filter(s => s.trim()),
      problems: problems.split('\n').filter(s => s.trim()),
      takeaways: takeaways.split('\n').filter(s => s.trim()).map(s => {
        const [title, ...desc] = s.includes(':') ? s.split(':') : s.split('：');
        return { title: (title || '新重点').trim(), desc: (desc.join(':') || '详细内容待补充').trim() };
      }),
      aiFeedback: initialData?.aiFeedback
    };
    onSubmit(newRetro);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-6 border-b border-outline-variant/10 flex justify-between items-center bg-surface-container-low">
          <h3 className="text-on-surface">{initialData ? '修改面试复盘' : '记录今日面试复盘'}</h3>
          <button onClick={onClose} className="p-2 hover:bg-surface-container rounded-full transition-colors">
            <ICONS.Plus className="rotate-45" size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-2">面试轮次</label>
            <input 
              required
              placeholder="例如：第二轮：技术面"
              className="w-full px-4 py-3 rounded-xl border border-outline-variant/30 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm text-on-surface"
              value={round}
              onChange={e => setRound(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-2">评分 ({rating}.0)</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(i => (
                <button 
                  key={i}
                  type="button"
                  onClick={() => setRating(i)}
                  className={`p-2 rounded-lg transition-all ${rating >= i ? 'text-primary' : 'text-outline/20'}`}
                >
                  <ICONS.Star fill={rating >= i ? 'currentColor' : 'none'} size={24} />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-2">亮点表现 (每行一个)</label>
            <textarea 
              rows={3}
              placeholder="哪些地方做得好？"
              className="w-full px-4 py-3 rounded-xl border border-outline-variant/30 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm resize-none text-on-surface"
              value={keeps}
              onChange={e => setKeeps(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-2">待改进点 (每行一个)</label>
            <textarea 
              rows={3}
              placeholder="哪些地方可以优化？"
              className="w-full px-4 py-3 rounded-xl border border-outline-variant/30 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm resize-none text-on-surface"
              value={problems}
              onChange={e => setProblems(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-2">核心收获 (建议格式 标题:内容)</label>
            <textarea 
              rows={3}
              placeholder="例如：准备重点:复习TCP协议"
              className="w-full px-4 py-3 rounded-xl border border-outline-variant/30 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm resize-none text-on-surface"
              value={takeaways}
              onChange={e => setTakeaways(e.target.value)}
            />
          </div>

          <button type="submit" className="w-full btn-primary py-4 rounded-2xl flex items-center justify-center gap-2 mt-4 shadow-lg shadow-primary/20">
            <ICONS.CheckCircle2 size={20} /> {initialData ? '保存修改' : '完成复盘并保存'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

function TimelinePoint({ label, date, isHighlight }: { label: string, date?: string, isHighlight?: boolean }) {
  if (!date) return (
    <div className="flex flex-col opacity-20">
      <span className="text-[9px] font-black uppercase tracking-wider text-on-surface-variant mb-0.5">{label}</span>
      <span className="text-xs font-bold text-on-surface-variant italic">未开始</span>
    </div>
  );
  
  return (
    <div className={`flex flex-col ${isHighlight ? 'scale-110 transition-transform' : ''}`}>
      <span className="text-[9px] font-black uppercase tracking-wider text-on-surface-variant opacity-60 mb-0.5">{label}</span>
      <span className={`text-xs font-black ${isHighlight ? 'text-primary drop-shadow-sm' : 'text-on-surface'}`}>{date}</span>
    </div>
  );
}

function EditInfoItem({ label, value, onChange, placeholder = "", className = "", type = "text" }: { label: string, value: string, onChange: (val: string) => void, placeholder?: string, className?: string, type?: string }) {
  return (
    <div className={`space-y-3 ${className}`}>
      <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-60 leading-none">
        {label}
      </label>
      <input 
        type={type}
        className="w-full bg-surface-container-low px-4 py-3 rounded-2xl border border-outline-variant/20 text-sm font-bold text-on-surface outline-none focus:ring-2 focus:ring-primary transition-all placeholder:text-outline-variant placeholder:font-normal"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

function InfoItem({ label, value, icon: Icon }: { label: string; value: string; icon?: any }) {
  // Logic to handle potential "km" instead of "k" typos in salary
  const formattedValue = label === '薪资范围' ? value.replace(/(\d+)\s*km/gi, '$1k') : value;

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 opacity-60">
        {Icon && <Icon size={12} className="text-on-surface-variant" />}
        <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">{label}</p>
      </div>
      <p className="text-lg font-bold text-on-surface tracking-tight truncate">{formattedValue}</p>
    </div>
  );
}

function SidebarItem({ label, value, isLink }: any) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-on-surface-variant text-xs font-medium">{label}</span>
      {isLink ? (
        <a href="#" className="text-primary text-xs font-bold hover:underline">{value}</a>
      ) : (
        <span className="text-on-surface text-xs font-bold">{value}</span>
      )}
    </div>
  );
}

function AiPrepCard({ title, icon, children }: any) {
  return (
    <div className="bg-white rounded-2xl p-8 shadow-sm border border-outline-variant/10">
      <h4 className="font-bold text-on-surface mb-6 flex items-center gap-2">
        {icon} {title}
      </h4>
      {children}
    </div>
  );
}

function Badge({ text, color }: { text: string, color: string, key?: React.Key }) {
  return (
    <span className={`px-3 py-1.5 rounded-lg text-[10px] font-bold whitespace-nowrap ${color}`}>
      {text}
    </span>
  );
}

function TakeawayItem({ title, desc }: any) {
  return (
    <div className="bg-white p-4 rounded-xl border border-outline-variant/10 shadow-sm">
      <p className="text-xs font-bold text-on-surface mb-1">{title}</p>
      <p className="text-[10px] text-on-surface-variant font-medium leading-relaxed opacity-75">{desc}</p>
    </div>
  );
}
