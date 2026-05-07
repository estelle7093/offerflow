import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ICONS, ViewType, Application } from './constants';
import OverviewView from './components/OverviewView';
import ApplicationsView from './components/ApplicationsView';
import ScheduleView from './components/ScheduleView';
import DetailsView from './components/DetailsView';
import ProfileView from './components/ProfileView';
import NewApplicationModal from './components/NewApplicationModal';
import FeedbackModal from './components/FeedbackModal';
import AboutModal from './components/AboutModal';
import {
  authApi, profileApi, applicationsApi, activitiesApi,
} from './services/apiClient';
import { injectDemoData } from './utils/demoData';
import * as XLSX from 'xlsx';

export default function App() {
  const [activeTab, setActiveTab] = useState<ViewType>('overview');
  const [appFilter, setAppFilter] = useState<'all' | 'applied' | 'test' | 'interviewing' | 'offer' | 'rejected'>('all');
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginName, setLoginName] = useState('');

  const [applications, setApplications] = useState<Application[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [userAvatar, setUserAvatar] = useState('');
  const [userName, setUserName] = useState('新用户');
  const [activities, setActivities] = useState<any[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Check auth state on mount
  useEffect(() => {
    const checkAuth = async () => {
      const session = await authApi.getSession();
      if (session) {
        setIsLoggedIn(true);
      }
      setIsLoading(false);
    };
    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = authApi.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setIsLoggedIn(true);
      } else if (event === 'SIGNED_OUT') {
        setIsLoggedIn(false);
        setApplications([]);
        setActivities([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load data when logged in
  const loadData = useCallback(async () => {
    try {
      const [apps, acts, profile] = await Promise.all([
        applicationsApi.list(),
        activitiesApi.list(),
        profileApi.get(),
      ]);
      setApplications(apps);
      setActivities(acts);
      if (profile) {
        setUserName(profile.name || '新用户');
        setUserAvatar(profile.avatar_url || `https://api.dicebear.com/7.x/micah/svg?seed=${profile.id}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`);
      }
    } catch (err) {
      console.error('Load data error:', err);
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) loadData();
  }, [isLoggedIn, loadData]);

  // Scroll to top on view change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeTab, selectedAppId]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      await authApi.login(loginEmail, loginPassword);
      // Auth state change listener will set isLoggedIn
    } catch (err: any) {
      setAuthError(err.message || '登录失败');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      await authApi.register(loginEmail, loginPassword, loginName);
      // Auth state change listener will set isLoggedIn
    } catch (err: any) {
      setAuthError(err.message || '注册失败');
    }
  };

  const handleLogout = async () => {
    await authApi.logout();
    setShowSettings(false);
    setActiveTab('overview');
    setUserName('新用户');
  };

  const handleAvatarChange = async (newAvatar: string) => {
    setUserAvatar(newAvatar);
    try { await profileApi.update({ avatar_url: newAvatar }); } catch {}
  };

  const handleNameChange = (newName: string) => { setUserName(newName); };

  const handleExportData = () => {
    if (applications.length === 0) { alert('没有可导出的数据'); return; }
    const headers = ['公司名称', '职位', '当前阶段', '薪资/月', '工作地点', '投递日期', '笔试日期', '面试日期', 'Offer日期', '职位详情'];
    const rows = applications.map(app => [
      app.company, app.role, app.stage, app.salary || '未记录', app.location,
      app.timeline?.applied || '-', app.timeline?.test || '-',
      app.timeline?.interview || '-', app.timeline?.offer || '-',
      app.jdSummary?.replace(/[\r\n]/g, ' ') || ''
    ]);
    
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "求职进度");
    XLSX.writeFile(workbook, `OfferFlow_求职进度表_${new Date().toISOString().split('T')[0]}.xlsx`);
    
    setShowSettings(false);
  };

  React.useEffect(() => {
    // @ts-ignore
    window.injectDemoData = async () => {
      try {
        console.log('开始注入演示数据...');
        await injectDemoData();
        await loadData();
        console.log('注入成功！');
        alert('注入成功！演示数据已生成。');
      } catch (e: any) {
        console.error('注入失败:', e);
        alert('注入失败: ' + e.message);
      }
    };
  }, []);

  const [logoClicks, setLogoClicks] = useState(0);

  const handleLogoClick = () => {
    const newCount = logoClicks + 1;
    setLogoClicks(newCount);
    if (newCount >= 5) {
      setLogoClicks(0);
      // @ts-ignore
      if (window.injectDemoData) {
        if (window.confirm('检测到隐藏指令：是否注入演示数据？')) {
          // @ts-ignore
          window.injectDemoData();
        }
      }
    } else {
      setTimeout(() => setLogoClicks(0), 2000);
    }
  };

  const handleAddActivity = async (activity: any) => {
    try {
      const created = await activitiesApi.create(activity);
      setActivities(prev => [...prev, created]);
      return created;
    } catch (err) {
      console.error('Add activity error:', err);
      // Fallback for offline/error
      const fallback = { ...activity, id: Math.random().toString(36).substr(2, 9) };
      setActivities(prev => [...prev, fallback]);
      return fallback;
    }
  };

  const handleUpdateActivity = async (activity: any) => {
    setActivities(prev => prev.map(a => a.id === activity.id ? activity : a));
    try {
      await activitiesApi.update(activity.id, activity);
    } catch (err) {
      console.error('Update activity error:', err);
    }
  };

  const handleDeleteActivity = async (id: string) => {
    setActivities(prev => prev.filter(a => a.id !== id));
    try {
      await activitiesApi.delete(id);
    } catch (err) {
      console.error('Delete activity error:', err);
    }
  };

  const handleUpdateActivities = (newActivities: any[]) => { setActivities(newActivities); };

  const selectedApp = applications.find(app => app.id === selectedAppId);

  const handleAddApplication = async (newApp: Partial<Application>) => {
    try {
      const created = await applicationsApi.create({
        company: newApp.company || '未知公司',
        role: newApp.role || '未知职位',
        location: newApp.location || '远程',
        salary: newApp.salary || '面议',
        status: newApp.status || 'applied',
        stage: newApp.stage || '筛选简历中',
        logoUrl: newApp.logoUrl,
        jdSummary: newApp.jdSummary,
        aiMatchingScore: 0,
        timeline: newApp.timeline,
      });
      setApplications([created, ...applications]);
      setShowAddModal(false);
    } catch (err) {
      console.error('Add application error:', err);
      const app: Application = {
        id: newApp.id || Math.random().toString(36).substr(2, 9),
        company: newApp.company || '未知公司', role: newApp.role || '未知职位',
        location: newApp.location || '远程', salary: newApp.salary || '面议',
        status: newApp.status || 'applied', stage: newApp.stage || '筛选简历中',
        updatedAt: '刚刚', logoUrl: newApp.logoUrl, jdSummary: newApp.jdSummary,
        aiMatchingScore: 0, timeline: newApp.timeline,
      };
      setApplications([app, ...applications]);
      setShowAddModal(false);
    }
  };

  const handleUpdateApplication = async (updatedApp: Partial<Application>) => {
    const idToUpdate = selectedAppId || (applications.length > 0 ? applications[0].id : null);
    if (!idToUpdate) return;
    setApplications(prev => prev.map(app =>
      app.id === idToUpdate ? { ...app, ...updatedApp, updatedAt: '刚刚' } : app
    ));
    try { await applicationsApi.update(idToUpdate, updatedApp); } catch {}
  };

  const handleDeleteApplication = (id: string) => { setDeleteId(id); };

  const confirmDelete = async () => {
    if (deleteId) {
      setApplications(prev => prev.filter(app => app.id !== deleteId));
      if (selectedAppId === deleteId) setSelectedAppId(null);
      try { await applicationsApi.delete(deleteId); } catch {}
      setDeleteId(null);
    }
  };

  const renderView = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-32">
          <div className="text-center space-y-4">
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }} className="w-12 h-12 border-3 border-primary/20 border-t-primary rounded-full mx-auto" />
            <p className="text-on-surface-variant text-sm font-medium">正在加载数据...</p>
          </div>
        </div>
      );
    }
    switch (activeTab) {
      case 'overview':
        return <OverviewView onNavigateToDetails={(id) => { setSelectedAppId(id); setActiveTab('details'); }} onAddApplication={() => setShowAddModal(true)} applications={applications} onNavigateWithFilter={(filter) => { setAppFilter(filter); setActiveTab('applications'); }} userName={userName} />;
      case 'applications':
        return <ApplicationsView applications={applications} onSelectApp={(id) => { setSelectedAppId(id); setActiveTab('details'); }} onDeleteApp={handleDeleteApplication} initialFilter={appFilter} />;
      case 'schedule':
        return <ScheduleView 
          applications={applications} 
          activities={activities} 
          onAddActivity={handleAddActivity}
          onUpdateActivity={handleUpdateActivity}
          onDeleteActivity={handleDeleteActivity}
          onSelectEvent={(id) => { setSelectedAppId(id); setActiveTab('details'); }} 
          onUpdateApplication={handleUpdateApplication} 
        />;
      case 'details':
        return <DetailsView 
          application={selectedApp || applications[0]} 
          onBack={() => setActiveTab('overview')} 
          onUpdate={handleUpdateApplication} 
          activities={activities} 
          onAddActivity={handleAddActivity}
          onUpdateActivity={handleUpdateActivity}
        />;
      case 'profile':
        return <ProfileView applications={applications} userAvatar={userAvatar} onAvatarChange={handleAvatarChange} onNameChange={handleNameChange} />;
      default:
        return <OverviewView onNavigateToDetails={() => {}} onAddApplication={() => {}} onNavigateWithFilter={() => {}} applications={applications} userName={userName} />;
    }
  };

  if (!isLoggedIn && !isLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-6 font-sans">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl shadow-primary/5 p-10 border border-outline-variant/10 text-center">
          <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl shadow-primary/30">
            <ICONS.Zap size={40} className="text-white" />
          </div>
          <h1 className="text-3xl font-black text-on-surface mb-2 tracking-tight">欢迎使用 OfferFlow</h1>
          <p className="text-on-surface-variant opacity-60 mb-10">您的智能求职管理专家，让每一份努力都更有效率</p>
          {authError && <div className="mb-6 p-3 bg-error/10 text-error rounded-xl text-sm font-bold">{authError}</div>}
          <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-6">
            {isRegistering && (
              <div className="text-left space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-60 ml-4">您的姓名</label>
                <input type="text" value={loginName} onChange={e => setLoginName(e.target.value)} placeholder="例如：张小明" className="w-full h-14 bg-surface-container-low px-6 rounded-2xl border border-outline-variant/20 font-bold outline-none focus:ring-2 focus:ring-primary transition-all" />
              </div>
            )}
            <div className="text-left space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-60 ml-4">账号/邮箱</label>
              <input type="email" required value={loginEmail} onChange={e => setLoginEmail(e.target.value)} placeholder="your@email.com" className="w-full h-14 bg-surface-container-low px-6 rounded-2xl border border-outline-variant/20 font-bold outline-none focus:ring-2 focus:ring-primary transition-all" />
            </div>
            <div className="text-left space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-60 ml-4">密码</label>
              <input type="password" required value={loginPassword} onChange={e => setLoginPassword(e.target.value)} placeholder="至少 6 位密码" className="w-full h-14 bg-surface-container-low px-6 rounded-2xl border border-outline-variant/20 font-bold outline-none focus:ring-2 focus:ring-primary transition-all" />
            </div>
            <button type="submit" className="w-full h-16 bg-primary text-white rounded-2xl font-black text-lg shadow-xl shadow-primary/20 hover:bg-primary-dark transition-all active:scale-95 flex items-center justify-center gap-3 mb-4">
              {isRegistering ? '注 册' : '登 录'} <ICONS.ChevronRight size={24} />
            </button>
            <button type="button" onClick={() => { setIsRegistering(!isRegistering); setAuthError(''); }} className="w-full text-primary font-bold text-sm hover:underline transition-all py-2">
              {isRegistering ? '已有账号？返回登录' : '没有账号？立即注册'}
            </button>
          </form>
          <div className="mt-10 flex items-center justify-center gap-2 text-xs font-bold text-on-surface-variant opacity-40">
            <span>© 2026 OfferFlow AI</span>
            <span className="w-1 h-1 bg-on-surface-variant rounded-full" />
            <span>极简求职效率工具</span>
          </div>
        </motion.div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }} className="w-12 h-12 border-3 border-primary/20 border-t-primary rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-50 glass-card px-6 py-3 flex justify-between items-center border-b border-outline-variant/20">
        <div className="flex items-center gap-3 select-none cursor-pointer" onClick={handleLogoClick}>
           {activeTab === 'details' ? (
            <button onClick={(e) => { e.stopPropagation(); setActiveTab('overview'); }} className="p-2 hover:bg-surface-container-low rounded-full transition-colors">
              <ICONS.ArrowLeft size={20} className="text-on-surface-variant" />
            </button>
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white"><ICONS.Zap size={18} /></div>
          )}
          <span className="text-xl font-black text-primary tracking-tight">OfferFlow</span>
        </div>
        <div className="flex items-center gap-2 relative">
          <AnimatePresence>
            {showSettings && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowSettings(false)} />
                <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} className="absolute right-0 top-full mt-2 w-64 bg-white rounded-3xl shadow-2xl border border-outline-variant/30 py-4 z-50 overflow-hidden">
                  <div className="space-y-1">
                    <button onClick={() => { setShowAboutModal(true); setShowSettings(false); }} className="w-full px-5 py-3 flex items-center gap-3 hover:bg-surface-container-low transition-colors text-left group">
                      <div className="w-8 h-8 rounded-xl bg-error/5 flex items-center justify-center text-error group-hover:scale-110 transition-transform"><ICONS.Heart size={18} fill="currentColor" className="opacity-80" /></div>
                      <span className="text-sm font-bold text-on-surface">开发初衷</span>
                    </button>
                    <button onClick={() => { setActiveTab('profile'); setShowSettings(false); }} className="w-full px-5 py-3 flex items-center gap-3 hover:bg-surface-container-low transition-colors text-left">
                      <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary"><ICONS.User size={18} /></div>
                      <span className="text-sm font-bold text-on-surface">个人信息</span>
                    </button>
                    <button onClick={handleExportData} className="w-full px-5 py-3 flex items-center gap-3 hover:bg-surface-container-low transition-colors text-left">
                      <div className="w-8 h-8 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary"><ICONS.FileUp size={18} /></div>
                      <span className="text-sm font-bold text-on-surface">导出数据</span>
                    </button>
                    <button onClick={() => { setShowSettings(false); setShowFeedbackModal(true); }} className="w-full px-5 py-3 flex items-center gap-3 hover:bg-surface-container-low transition-colors text-left">
                      <div className="w-8 h-8 rounded-xl bg-on-surface-variant/10 flex items-center justify-center text-on-surface-variant"><ICONS.HelpCircle size={18} /></div>
                      <span className="text-sm font-bold text-on-surface">帮助与反馈</span>
                    </button>
                  </div>
                  <div className="h-px bg-outline-variant/10 mx-5 my-2" />
                  <button onClick={handleLogout} className="w-full px-5 py-3 flex items-center gap-3 hover:bg-error/10 transition-colors text-left group">
                    <div className="w-8 h-8 rounded-xl bg-error/10 flex items-center justify-center text-error group-hover:scale-110 transition-transform"><ICONS.LogOut size={18} /></div>
                    <span className="text-sm font-bold text-error">退出账号</span>
                  </button>
                  <div className="mt-4 px-5 text-center"><p className="text-[9px] font-bold text-on-surface-variant opacity-30">OfferFlow v2.0.0 · Supabase</p></div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
          <button onClick={() => setShowSettings(!showSettings)} className={`p-2.5 rounded-full transition-colors relative flex-shrink-0 ${showSettings ? 'bg-primary/10 text-primary' : 'hover:bg-surface-container-low text-on-surface-variant'}`}>
            <ICONS.Settings size={22} />
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-container-max mx-auto w-full px-margin-mobile md:px-margin-desktop py-8 pb-32">
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
            {renderView()}
          </motion.div>
        </AnimatePresence>
      </main>

      <nav className="fixed bottom-0 left-0 w-full z-50 glass-card px-4 pb-10 pt-3 flex justify-around items-center border-t border-outline-variant/20">
        <NavButton active={activeTab === 'overview'} icon={<ICONS.Overview size={24} />} label="总览" onClick={() => setActiveTab('overview')} />
        <NavButton active={activeTab === 'applications'} icon={<ICONS.Briefcase size={24} />} label="投递" onClick={() => setActiveTab('applications')} />
        <NavButton active={activeTab === 'schedule'} icon={<ICONS.Calendar size={24} />} label="日程" onClick={() => setActiveTab('schedule')} />
        <NavButton active={activeTab === 'details'} icon={<ICONS.FileSearch size={24} />} label="详情" onClick={() => setActiveTab('details')} />
        <NavButton active={activeTab === 'profile'} icon={<ICONS.User size={24} />} label="我的" onClick={() => setActiveTab('profile')} />
      </nav>

      <AnimatePresence>
        {showAddModal && <NewApplicationModal 
          onClose={() => setShowAddModal(false)} 
          onSubmit={handleAddApplication} 
          activities={activities} 
          onAddActivity={handleAddActivity} 
        />}
        {deleteId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDeleteId(null)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl relative z-10 text-center">
              <div className="w-16 h-16 bg-error/10 text-error rounded-full flex items-center justify-center mx-auto mb-6"><ICONS.Trash2 size={32} /></div>
              <h3 className="text-xl font-bold text-on-surface mb-2">确认删除？</h3>
              <p className="text-on-surface-variant text-sm mb-8 leading-relaxed">此操作将永久删除该投递记录，且无法撤销。</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteId(null)} className="flex-1 py-3 rounded-xl bg-surface-container text-on-surface-variant font-bold hover:bg-surface-container-high transition-colors">取消</button>
                <button onClick={confirmDelete} className="flex-1 py-3 rounded-xl bg-error text-on-error font-extrabold hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-error/30">确认删除</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>{showFeedbackModal && <FeedbackModal onClose={() => setShowFeedbackModal(false)} />}</AnimatePresence>
      <AnimatePresence>{showAboutModal && <AboutModal onClose={() => setShowAboutModal(false)} />}</AnimatePresence>
    </div>
  );
}

function NavButton({ active, icon, label, onClick }: { active: boolean, icon: React.ReactNode, label: string, onClick: () => void }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center justify-center transition-all duration-200 ${active ? 'text-primary' : 'text-on-surface-variant'}`}>
      <div className={`p-1.5 rounded-xl transition-colors ${active ? 'bg-primary/10' : 'hover:bg-surface-container-low'}`}>{icon}</div>
      <span className="text-[10px] font-medium mt-1 uppercase tracking-wider">{label}</span>
      {active && <motion.div layoutId="nav-indicator" className="w-1 h-1 bg-primary rounded-full mt-0.5" />}
    </button>
  );
}
