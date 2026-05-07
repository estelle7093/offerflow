import React, { useState } from 'react';
import { Application, ICONS } from '../constants';
import { motion } from 'motion/react';

interface ApplicationsViewProps {
  applications: Application[];
  onSelectApp: (id: string) => void;
  onDeleteApp: (id: string) => void;
  initialFilter?: 'all' | 'applied' | 'test' | 'interviewing' | 'offer' | 'rejected';
}

export default function ApplicationsView({ applications, onSelectApp, onDeleteApp, initialFilter = 'all' }: ApplicationsViewProps) {
  const [filter, setFilter] = useState<'all' | 'applied' | 'test' | 'interviewing' | 'offer' | 'rejected'>(initialFilter);
  const [search, setSearch] = useState('');

  const filteredApps = applications.filter(app => {
    const matchesFilter = filter === 'all' || app.status === filter;
    const matchesSearch = app.company.toLowerCase().includes(search.toLowerCase()) || 
                         app.role.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const stats = {
    applied: applications.filter(a => a.status === 'applied').length,
    test: applications.filter(a => a.status === 'test').length,
    interviewing: applications.filter(a => a.status === 'interviewing').length,
    offer: applications.filter(a => a.status === 'offer').length,
    rejected: applications.filter(a => a.status === 'rejected').length
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-on-surface">投递总览</h1>
        <p className="text-on-surface-variant mt-2">追踪您的职业进阶之路，当前共有 {applications.length} 个活跃申请。</p>
      </header>

      {/* Stats Summary - Responsive Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 md:gap-4">
        <SummaryStat 
          icon={<ICONS.Inbox size={20} />} 
          value={applications.length.toString()} 
          label="全部申请" 
          color="bg-on-surface/5 text-on-surface border-on-surface/10" 
          active={filter === 'all'}
          onClick={() => setFilter('all')}
        />
        <SummaryStat 
          icon={<ICONS.Briefcase size={20} />} 
          value={stats.applied.toString()} 
          label="筛选简历中" 
          color="bg-primary/10 text-primary border-primary/20" 
          active={filter === 'applied'}
          onClick={() => setFilter('applied')}
        />
        <SummaryStat 
          icon={<ICONS.FileText size={20} />} 
          value={stats.test.toString()} 
          label="笔试中" 
          color="bg-indigo-100 text-indigo-700 border-indigo-200" 
          active={filter === 'test'}
          onClick={() => setFilter('test')}
        />
        <SummaryStat 
          icon={<ICONS.MessageSquareQuote size={20} />} 
          value={stats.interviewing.toString()} 
          label="面试中" 
          color="bg-tertiary/10 text-tertiary border-tertiary/20" 
          active={filter === 'interviewing'}
          onClick={() => setFilter('interviewing')}
        />
        <SummaryStat 
          icon={<ICONS.Star size={20} />} 
          value={stats.offer.toString()} 
          label="已收录 Offer" 
          color="bg-secondary/10 text-secondary border-secondary/20" 
          active={filter === 'offer'}
          onClick={() => setFilter('offer')}
        />
        <SummaryStat 
          icon={<ICONS.AlertCircle size={20} />} 
          value={stats.rejected.toString()} 
          label="已终止" 
          color="bg-error/10 text-error border-error/20" 
          active={filter === 'rejected'}
          onClick={() => setFilter('rejected')}
        />
      </div>

      {/* Search and Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-lg">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-outline-variant">
            <ICONS.Search size={18} />
          </div>
          <input 
            type="text" 
            placeholder="搜索公司、职位或地点..." 
            className="w-full pl-12 pr-4 py-3 bg-white rounded-2xl border border-outline-variant/30 shadow-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-sm font-medium text-on-surface"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Applications List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-20">
        {filteredApps.length > 0 ? filteredApps.map((app, idx) => (
          <ApplicationCard 
            key={app.id} 
            app={app} 
            featured={idx === 0 && filter === 'all' && !search} 
            onClick={() => onSelectApp(app.id)} 
            onDelete={() => onDeleteApp(app.id)}
          />
        )) : (
          <div className="lg:col-span-12 py-20 text-center glass-card rounded-3xl">
            <div className="w-16 h-16 bg-surface-container rounded-full flex items-center justify-center mx-auto mb-4 text-outline/30">
              <ICONS.Inbox size={32} />
            </div>
            <p className="text-on-surface-variant font-medium">没找到符合条件的投递记录</p>
            <button 
              onClick={() => { setFilter('all'); setSearch(''); }}
              className="mt-4 text-primary font-bold text-sm hover:underline"
            >
              消除所有筛选条件
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryStat({ icon, value, label, color, active, onClick }: any) {
  return (
    <div 
      onClick={onClick}
      className={`flex flex-col md:flex-row items-center md:items-center gap-3 md:gap-5 px-4 py-4 md:px-6 md:py-5 rounded-2xl md:rounded-3xl transition-all cursor-pointer border-2 ${active ? 'bg-white border-primary shadow-xl -translate-y-1' : 'bg-white border-transparent shadow-sm hover:border-primary/20 hover:shadow-md'} group active:scale-95`}
    >
      <div className={`w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 ${color}`}>
        {icon}
      </div>
      <div className="text-center md:text-left overflow-hidden">
        <p className="text-[9px] md:text-[10px] font-black text-on-surface-variant opacity-60 uppercase tracking-widest leading-none mb-1 md:mb-1.5 truncate">
          {label}
        </p>
        <p className={`text-xl md:text-3xl font-black tracking-tighter leading-none ${active ? 'text-primary' : 'text-on-surface'}`}>
          {value}
        </p>
      </div>
    </div>
  );
}

interface ApplicationCardProps {
  app: Application;
  featured: boolean;
  onClick: () => void;
  onDelete: () => void;
  key?: string | number;
}

function ApplicationCard({ app, featured, onClick, onDelete }: ApplicationCardProps) {
  const statusColors: any = {
    applied: 'bg-surface-container text-on-surface-variant',
    interviewing: 'bg-tertiary-container/10 text-tertiary',
    offer: 'bg-secondary-container/20 text-secondary',
    test: 'bg-indigo-50 text-primary',
    rejected: 'bg-error-container/10 text-error'
  };

  const progressPercent = app.status === 'offer' ? 100 : app.status === 'interviewing' ? 75 : app.status === 'test' ? 50 : app.status === 'applied' ? 25 : 0;

  if (featured) {
    return (
      <div 
        onClick={onClick}
        className="lg:col-span-12 interactive-card rounded-2xl p-6 md:p-8 border-t-4 border-primary relative overflow-hidden cursor-pointer group"
      >
        <div className="flex flex-col md:flex-row justify-between items-start gap-6 relative z-10">
          <div className="flex gap-6 min-w-0">
            <div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center overflow-hidden border border-outline-variant/10 shrink-0">
              <img src={app.logoUrl} alt={app.company} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <div className="min-w-0">
              <h3 className="text-2xl font-bold text-on-surface mb-1 group-hover:text-primary transition-colors truncate">{app.company} - {app.role}</h3>
              <p className="text-on-surface-variant text-sm font-medium">{app.location} · {app.updatedAt}更新</p>
            </div>
          </div>
          <div className="flex items-center gap-3 self-end md:self-auto">
            <span className={`px-4 py-1.5 rounded-full text-xs font-bold ${statusColors[app.status]}`}>
              {app.stage}
            </span>
            <button 
              type="button"
              title="删除记录"
              onClick={(e) => { 
                e.stopPropagation(); 
                console.log('Deleting featured app:', app.id);
                onDelete(); 
              }}
              className="p-2.5 text-outline hover:text-error hover:bg-error/10 rounded-full transition-all"
            >
              <ICONS.Trash2 size={18} />
            </button>
          </div>
        </div>

        {/* Progress Stepper */}
        <div className="mt-12 relative px-4">
          <div className="absolute top-[19px] left-4 right-4 h-1 bg-surface-container-low rounded-full">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 1 }}
              className={`h-full ${app.status === 'rejected' ? 'bg-error' : 'bg-primary'} rounded-full`}
            />
          </div>
          <div className="relative flex justify-between">
            <Step label="筛选简历" active={progressPercent >= 25} completed={progressPercent > 25} icon={<ICONS.CheckCircle2 />} />
            <Step label="笔试" active={progressPercent >= 50} completed={progressPercent > 50} icon={<ICONS.FileText />} />
            <Step label="面试" active={progressPercent >= 75} completed={progressPercent > 75} icon={<ICONS.MessageSquareQuote />} />
            <Step label="获录取" active={progressPercent >= 100} completed={progressPercent > 100} icon={<ICONS.Star />} />
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between border-t border-outline-variant/10 pt-4">
          <div className="flex items-center gap-2 text-on-surface-variant text-xs">
            <ICONS.Clock size={14} />
            <span>最近更新：{app.stage} ({app.updatedAt})</span>
          </div>
          <button className="text-primary font-bold text-sm hover:underline flex items-center gap-1">
            查看详情 <ICONS.ChevronRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      onClick={onClick}
      className="lg:col-span-6 interactive-card rounded-xl p-6 cursor-pointer group"
    >
      <div className="flex justify-between items-start mb-6">
        <div className="flex gap-4 min-w-0">
          <div className="w-12 h-12 rounded-xl bg-surface-container-low border border-outline-variant/10 overflow-hidden shrink-0">
            <img src={app.logoUrl} alt={app.company} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>
          <div className="min-w-0">
            <h4 className="font-bold text-on-surface truncate group-hover:text-primary transition-colors">{app.role}</h4>
            <p className="text-on-surface-variant text-[10px] font-bold uppercase tracking-wide truncate">{app.company}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${statusColors[app.status]}`}>
            {app.status === 'offer' ? '意向书' : app.stage}
          </span>
          <button 
            type="button"
            title="删除记录"
            onClick={(e) => { 
              e.stopPropagation(); 
              console.log('Deleting app:', app.id);
              onDelete(); 
            }}
            className="p-1.5 text-outline/50 hover:text-error hover:bg-error/10 rounded-full transition-all"
          >
            <ICONS.Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4 py-2">
        <div className="flex-1 h-2 bg-surface-container rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            className={`h-full ${app.status === 'rejected' ? 'bg-error/40' : 'bg-primary'} rounded-full`}
          />
        </div>
        <span className={`text-[10px] font-bold ${app.status === 'rejected' ? 'text-error' : 'text-primary'}`}>{progressPercent}%</span>
      </div>
      
      <div className="flex justify-between text-[9px] font-bold text-outline uppercase tracking-tighter mt-1 opacity-50">
        <span>筛选</span>
        <span>笔试</span>
        <span>初试</span>
        <span>复试</span>
        <span>Offer</span>
      </div>
    </div>
  );
}

function Step({ label, active, completed, icon }: any) {
  return (
    <div className={`flex flex-col items-center gap-2 group ${!active && 'opacity-30'}`}>
      <div className={`w-10 h-10 rounded-full flex items-center justify-center z-10 transition-all duration-300 ${completed ? 'bg-secondary text-white' : active ? 'bg-primary text-white ring-4 ring-background' : 'bg-surface-container text-on-surface-variant'}`}>
        {completed ? <ICONS.CheckCircle2 size={18} /> : icon ? React.cloneElement(icon, { size: 18 }) : null}
      </div>
      <span className={`text-[10px] font-bold tracking-tighter uppercase ${completed ? 'text-secondary' : active ? 'text-primary' : 'text-on-surface-variant'}`}>{label}</span>
    </div>
  );
}
