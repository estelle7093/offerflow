import React, { useState, useEffect } from 'react';
import { Application, ICONS } from '../constants';
import { motion, AnimatePresence } from 'motion/react';

interface Activity {
  id: string;
  title: string;
  time: string; // HH:mm
  endTime?: string;
  date: string; // YYYY-MM-DD
  type: 'interview' | 'test' | 'other';
  location?: string;
  isCompleted?: boolean;
  applicationId?: string;
}

interface ScheduleViewProps {
  applications: Application[];
  activities: Activity[];
  onAddActivity: (activity: Activity) => void;
  onUpdateActivity: (activity: Activity) => void;
  onDeleteActivity: (id: string) => void;
  onUpdateApplication: (updated: Partial<Application>) => void;
  onSelectEvent: (id: string) => void;
}

export default function ScheduleView({ applications, activities, onAddActivity, onUpdateActivity, onDeleteActivity, onUpdateApplication, onSelectEvent }: ScheduleViewProps) {
  const [currentViewDate, setCurrentViewDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);

  const handlePrevMonth = () => {
    setCurrentViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleYearChange = (year: number) => {
    setCurrentViewDate(prev => new Date(year, prev.getMonth(), 1));
  };

  const handleMonthChange = (month: number) => {
    setCurrentViewDate(prev => new Date(prev.getFullYear(), month, 1));
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowStr = tomorrowDate.toISOString().split('T')[0];

  const todayActivities = activities.filter(a => a.date === todayStr).sort((a, b) => a.time.localeCompare(b.time));
  const tomorrowActivities = activities.filter(a => a.date === tomorrowStr).sort((a, b) => a.time.localeCompare(b.time));
  const selectedDateActivities = activities.filter(a => a.date === selectedDate).sort((a, b) => a.time.localeCompare(b.time));

  const topToday = todayActivities.find(a => !a.isCompleted) || todayActivities[0];
  const topTomorrow = tomorrowActivities[0];

  const getDayOfWeek = (date: Date) => {
    const days = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    return days[date.getDay()];
  };

  const today = new Date();
  const dateStr = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日，${getDayOfWeek(today)}`;

  const selectedDateObj = new Date(selectedDate);
  const selectedDateLabel = selectedDate === todayStr ? "今天" : selectedDate === tomorrowStr ? "明天" : `${selectedDateObj.getMonth() + 1}月`;

  const handleToggleComplete = (id: string) => {
    const activity = activities.find(a => a.id === id);
    if (activity) {
      onUpdateActivity({ ...activity, isCompleted: !activity.isCompleted });
    }
  };

  const handleDeleteActivity = (id: string) => {
    onDeleteActivity(id);
  };

  const syncToApplication = (activity: Activity) => {
    if (activity.applicationId && activity.applicationId !== 'none') {
      const app = applications.find(a => a.id === activity.applicationId);
      if (app) {
        const timeline = { ...(app.timeline || { applied: '', test: '', interview: '', offer: '' }) };
        
        // Simple heuristic to match activity to timeline field
        const title = activity.title.toLowerCase();
        if (title.includes('面试')) timeline.interview = activity.date;
        else if (title.includes('笔试') || title.includes('测') || activity.type === 'test') timeline.test = activity.date;
        else if (title.includes('投递')) timeline.applied = activity.date;
        else if (title.includes('offer') || title.includes('录取')) timeline.offer = activity.date;

        onUpdateApplication({ id: app.id, timeline } as any);
      }
    }
  };

  const handleUpdateActivity = (updated: Activity) => {
    onUpdateActivity(updated);
    syncToApplication(updated);
    setEditingActivity(null);
  };

  const handleAddActivity = (newActivity: Activity) => {
    onAddActivity(newActivity);
    syncToApplication(newActivity);
    setShowAddModal(false);
  };

  return (
    <div className="space-y-10">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-on-surface">我的日程</h1>
          <p className="text-on-surface-variant mt-1">今天是 {dateStr}</p>
        </div>
        <div className="flex gap-3">
          <button className="p-3 rounded-xl bg-white border border-outline-variant/30 interactive-card">
            <ICONS.Search size={20} className="text-on-surface-variant" />
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <ICONS.Plus size={20} />
            <span>添加活动</span>
          </button>
        </div>
      </header>

      {/* Featured Events */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {topToday ? (
          <div className="relative overflow-hidden rounded-3xl p-8 bg-gradient-to-br from-primary to-primary-container text-white shadow-lg group">
            <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/10 rounded-full blur-3xl transition-transform duration-700 group-hover:scale-110"></div>
            <div className="flex justify-between items-start mb-10 relative z-10">
              <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-bold uppercase tracking-widest">今日优先级最高</span>
              <ICONS.Calendar size={24} className="opacity-80" />
            </div>
            <h3 className="text-white text-2xl mb-3 relative z-10">{topToday.title}</h3>
            <div className="flex items-center gap-6 text-white/80 text-sm mb-8 relative z-10">
              <div className="flex items-center gap-2"><ICONS.Clock size={16} /><span>{topToday.time}{topToday.endTime && ` - ${topToday.endTime}`}</span></div>
              <div className="flex items-center gap-2">
                {topToday.type === 'interview' ? <ICONS.Video size={16} /> : <ICONS.MapPin size={16} />}
                <span>{topToday.location}</span>
              </div>
            </div>
            <div className="flex gap-4 relative z-10">
              <button 
                onClick={() => handleToggleComplete(topToday.id)}
                className={`flex-1 ${topToday.isCompleted ? 'bg-white/20 text-white' : 'bg-white text-primary'} font-bold py-3.5 rounded-xl hover:opacity-90`}
              >
                {topToday.isCompleted ? '已完成' : '立即开始'}
              </button>
              <button className="p-3.5 bg-white/20 backdrop-blur-md rounded-xl hover:bg-white/30"><ICONS.Bell size={24} /></button>
            </div>
          </div>
        ) : (
          <div className="bg-surface-container rounded-3xl p-8 flex flex-col items-center justify-center text-on-surface-variant border-2 border-dashed border-outline-variant/30">
            <ICONS.Calendar size={48} className="opacity-20 mb-4" />
            <p className="text-sm font-medium">今日暂无活动</p>
          </div>
        )}

        {topTomorrow ? (
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-outline-variant/20 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-10">
                <span className="px-3 py-1 bg-tertiary/10 text-tertiary rounded-full text-[10px] font-bold uppercase tracking-widest">明日预告</span>
                <ICONS.AlertCircle size={24} className="text-tertiary" />
              </div>
              <h3 className="text-on-surface text-2xl mb-3">{topTomorrow.title}</h3>
              <div className="flex items-center gap-6 text-on-surface-variant text-sm">
                <div className="flex items-center gap-2"><ICONS.Clock size={16} /><span>{topTomorrow.time}{topTomorrow.endTime && ` - ${topTomorrow.endTime}`}</span></div>
                <div className="flex items-center gap-2">
                   {topTomorrow.type === 'test' ? <ICONS.FileText size={16} /> : <ICONS.MapPin size={16} />}
                   <span>{topTomorrow.location}</span>
                </div>
              </div>
            </div>
            <div className="mt-8 flex gap-4">
              <button className="flex-1 bg-surface-container-low text-primary border border-primary/20 font-bold py-3.5 rounded-xl hover:bg-primary/5">备赛室</button>
              <button className="px-6 py-3.5 border border-outline-variant/40 text-on-surface-variant font-bold rounded-xl hover:bg-surface-container-low transition-colors flex items-center gap-2"><ICONS.RefreshCw size={18} />日程同步</button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-outline-variant/20 flex flex-col items-center justify-center text-on-surface-variant">
            <ICONS.Zap size={48} className="opacity-20 mb-4" />
            <p className="text-sm font-medium">明天很轻松，加油！</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-4 glass-card rounded-3xl p-8">
          <div className="flex flex-col gap-4 mb-8">
            <div className="flex items-center justify-between">
              <h3 className="text-on-surface font-bold">日历视图</h3>
              <div className="flex gap-2">
                <button 
                  onClick={handlePrevMonth}
                  className="p-1.5 hover:bg-surface-container-low rounded-lg transition-colors"
                >
                  <ICONS.ChevronLeft size={20} />
                </button>
                <button 
                  onClick={handleNextMonth}
                  className="p-1.5 hover:bg-surface-container-low rounded-lg transition-colors"
                >
                  <ICONS.ChevronRight size={20} />
                </button>
              </div>
            </div>
            
            <div className="flex gap-2">
              <select 
                value={currentViewDate.getFullYear()}
                onChange={(e) => handleYearChange(parseInt(e.target.value))}
                className="flex-1 bg-surface-container-low text-on-surface text-xs font-bold py-2 px-3 rounded-xl border border-outline-variant/20 outline-none"
              >
                {Array.from({ length: 11 }, (_, i) => today.getFullYear() - 5 + i).map(y => (
                  <option key={y} value={y}>{y}年</option>
                ))}
              </select>
              <select 
                value={currentViewDate.getMonth()}
                onChange={(e) => handleMonthChange(parseInt(e.target.value))}
                className="flex-1 bg-surface-container-low text-on-surface text-xs font-bold py-2 px-3 rounded-xl border border-outline-variant/20 outline-none"
              >
                {Array.from({ length: 12 }, (_, i) => i).map(m => (
                  <option key={m} value={m}>{m + 1}月</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-7 text-center text-[10px] font-black text-outline uppercase tracking-widest mb-6">
            <span>日</span><span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span>
          </div>
          <div className="grid grid-cols-7 gap-y-3">
             {(() => {
               const firstDay = new Date(currentViewDate.getFullYear(), currentViewDate.getMonth(), 1).getDay();
               const daysInMonth = new Date(currentViewDate.getFullYear(), currentViewDate.getMonth() + 1, 0).getDate();
               const days = [];
               for (let i = 0; i < firstDay; i++) days.push(null);
               for (let i = 1; i <= daysInMonth; i++) days.push(i);
               
               return days.map((day, i) => {
                 if (day === null) return <div key={`empty-${i}`} className="w-10 h-10"></div>;
                 const isToday = day === today.getDate() && currentViewDate.getMonth() === today.getMonth() && currentViewDate.getFullYear() === today.getFullYear();
                 const dayStr = `${currentViewDate.getFullYear()}-${String(currentViewDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                 const isSelected = dayStr === selectedDate;
                 const hasInterview = activities.some(a => a.date === dayStr && a.type === 'interview');
                 const hasTest = activities.some(a => a.date === dayStr && a.type === 'test');
                 
                 return (
                   <div key={day} className="flex flex-col items-center">
                     <div 
                       onClick={() => setSelectedDate(dayStr)}
                       className={`w-10 h-10 flex items-center justify-center rounded-xl text-sm font-semibold relative transition-all duration-300 cursor-pointer ${isSelected ? 'bg-primary text-white shadow-md scale-110' : isToday ? 'text-primary bg-primary/10 border border-primary/20' : 'text-on-surface hover:bg-surface-container-low'}`}
                     >
                       {day}
                       {hasInterview && !isSelected && <div className="absolute bottom-1 w-1 h-1 bg-primary rounded-full"></div>}
                       {hasTest && !isSelected && <div className="absolute bottom-1 w-1 h-1 bg-tertiary rounded-full"></div>}
                     </div>
                   </div>
                 )
               });
             })()}
          </div>
          <div className="mt-10 space-y-4 border-t border-outline-variant/10 pt-6">
             <div className="flex items-center gap-3">
               <div className="w-2 h-2 rounded-full bg-primary"></div>
               <span className="text-xs font-semibold text-on-surface-variant">面试安排 ({activities.filter(a => a.type === 'interview').length})</span>
             </div>
             <div className="flex items-center gap-3">
               <div className="w-2 h-2 rounded-full bg-tertiary"></div>
               <span className="text-xs font-semibold text-on-surface-variant">笔试/测评 ({activities.filter(a => a.type === 'test').length})</span>
             </div>
          </div>
        </div>
        <div className="lg:col-span-8 glass-card rounded-3xl p-8">
          <h3 className="text-on-surface mb-10">详细时间轴</h3>
          <div className="relative pl-10">
            <div className="absolute left-4 top-0 bottom-0 w-px bg-outline-variant/20"></div>
            
            <TimelineGroup date={selectedDateLabel} day={selectedDateObj.getDate()} active>
              {selectedDateActivities.length > 0 ? selectedDateActivities.map(a => (
                <TimelineEvent 
                  key={a.id}
                  time={`${a.time}${a.endTime ? ` - ${a.endTime}` : ''}`} 
                  title={a.title} 
                  detail={a.location} 
                  color={a.type === 'interview' ? 'border-primary' : 'border-tertiary'} 
                  completed={a.isCompleted}
                  onToggle={() => handleToggleComplete(a.id)}
                  onEdit={() => setEditingActivity(a)}
                  onDelete={() => handleDeleteActivity(a.id)}
                />
              )) : <p className="text-xs text-outline italic">{selectedDateLabel}暂无安排</p>}
            </TimelineGroup>

            {selectedDate === todayStr && tomorrowActivities.length > 0 && (
              <TimelineGroup date="明天" day={tomorrowDate.getDate()}>
                 {tomorrowActivities.map(a => (
                  <TimelineEvent 
                    key={a.id}
                    time={`${a.time}${a.endTime ? ` - ${a.endTime}` : ''}`} 
                    title={a.title} 
                    detail={a.location} 
                    color={a.type === 'interview' ? 'border-primary' : 'border-tertiary'} 
                    completed={a.isCompleted}
                    onToggle={() => handleToggleComplete(a.id)}
                    onEdit={() => setEditingActivity(a)}
                    onDelete={() => handleDeleteActivity(a.id)}
                  />
                ))}
              </TimelineGroup>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showAddModal && (
          <ActivityModal 
            onClose={() => setShowAddModal(false)}
            onSave={handleAddActivity}
            applications={applications}
          />
        )}
        {editingActivity && (
          <ActivityModal 
            activity={editingActivity}
            onClose={() => setEditingActivity(null)}
            onSave={handleUpdateActivity}
            applications={applications}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function ActivityModal({ onClose, onSave, applications, activity }: { onClose: () => void, onSave: (a: Activity) => void, applications: Application[], activity?: Activity }) {
  const [formData, setFormData] = useState({
    applicationId: activity?.applicationId || '',
    title: activity?.title || '',
    date: activity?.date || new Date().toISOString().split('T')[0],
    time: activity?.time || '10:00',
    endTime: activity?.endTime || '11:00',
    type: activity?.type || 'interview' as Activity['type'],
    location: activity?.location || ''
  });

  const [customTitle, setCustomTitle] = useState(() => {
    if (activity?.applicationId && activity.applicationId !== 'none') {
      const parts = activity.title.split(' - ');
      return parts.length > 1 ? parts[parts.length - 1] : '';
    }
    return '';
  });

  const selectedApp = applications.find(a => a.id === formData.applicationId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let finalTitle = formData.title;
    if (formData.applicationId !== 'none' && selectedApp) {
      finalTitle = `${selectedApp.company} - ${customTitle || (formData.type === 'interview' ? '面试' : formData.type === 'test' ? '笔试' : '活动')}`;
    }

    onSave({
      id: activity?.id || Math.random().toString(36).substr(2, 9),
      ...formData,
      title: finalTitle,
      isCompleted: activity?.isCompleted || false
    });
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
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden p-8"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-on-surface">{activity ? '修改活动' : '安排新活动'}</h3>
          <button onClick={onClose} className="p-2 hover:bg-surface-container rounded-full transition-colors">
            <ICONS.Plus size={20} className="rotate-45" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-60">选择关联申请</label>
            <select 
              required
              className="w-full px-4 py-3 rounded-2xl border border-outline-variant/30 text-on-surface focus:ring-2 focus:ring-primary outline-none bg-surface-container-low font-bold"
              value={formData.applicationId}
              onChange={e => setFormData(p => ({ ...p, applicationId: e.target.value }))}
            >
              <option value="">-- 选择公司 --</option>
              {applications.map(app => (
                <option key={app.id} value={app.id}>{app.company} ({app.role})</option>
              ))}
              <option value="none">-- 手动输入 --</option>
            </select>
          </div>

          {formData.applicationId === 'none' ? (
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-60">活动标题</label>
              <input 
                required
                className="w-full px-4 py-3 rounded-2xl border border-outline-variant/30 text-on-surface focus:ring-2 focus:ring-primary outline-none font-bold"
                value={formData.title}
                onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
                placeholder="例如：某公司 - 沟通"
              />
            </div>
          ) : formData.applicationId ? (
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-60">环节说明</label>
              <input 
                className="w-full px-4 py-3 rounded-2xl border border-outline-variant/30 text-on-surface focus:ring-2 focus:ring-primary outline-none font-bold"
                value={customTitle}
                onChange={e => setCustomTitle(e.target.value)}
                placeholder="例如：二面、HR面、技术笔试"
              />
              <p className="text-[10px] text-on-surface-variant">完整预览：{selectedApp?.company} - {customTitle || '环节名称'}</p>
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-60">日程日期</label>
              <input 
                type="date"
                required
                className="w-full px-4 py-3 rounded-2xl border border-outline-variant/30 text-on-surface focus:ring-2 focus:ring-primary outline-none font-bold"
                value={formData.date}
                onChange={e => setFormData(p => ({ ...p, date: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-60">活动类型</label>
              <select 
                className="w-full px-4 py-3 rounded-2xl border border-outline-variant/30 text-on-surface focus:ring-2 focus:ring-primary outline-none font-bold bg-surface-container-low"
                value={formData.type}
                onChange={e => setFormData(p => ({ ...p, type: e.target.value as any }))}
              >
                <option value="interview">面试会谈</option>
                <option value="test">技术测评/笔试</option>
                <option value="other">其他活动</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-60">开始时间</label>
              <input 
                type="time"
                className="w-full px-4 py-3 rounded-2xl border border-outline-variant/30 text-on-surface focus:ring-2 focus:ring-primary outline-none font-bold"
                value={formData.time}
                onChange={e => setFormData(p => ({ ...p, time: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-60">预计时长</label>
              <select 
                className="w-full px-4 py-3 rounded-2xl border border-outline-variant/30 text-on-surface focus:ring-2 focus:ring-primary outline-none font-bold bg-surface-container-low"
                value={formData.endTime}
                onChange={e => setFormData(p => ({ ...p, endTime: e.target.value }))}
              >
                <option value="30m">30 分钟</option>
                <option value="1h">1 小时</option>
                <option value="1.5h">1.5 小时</option>
                <option value="2h">2 小时</option>
                <option value="3h">3 小时</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-60">地点 / 会议链接</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/40">
                <ICONS.MapPin size={16} />
              </div>
              <input 
                className="w-full pl-11 pr-4 py-3 rounded-2xl border border-outline-variant/30 text-on-surface focus:ring-2 focus:ring-primary outline-none font-bold"
                value={formData.location}
                onChange={e => setFormData(p => ({ ...p, location: e.target.value }))}
                placeholder="如：腾讯会议、钉钉、公司会议室"
              />
            </div>
          </div>

          <div className="flex gap-4 pt-6">
            <button type="button" onClick={onClose} className="flex-1 py-4 font-bold text-on-surface-variant hover:bg-surface-container rounded-2xl transition-all">取消</button>
            <button type="submit" className="flex-[2] btn-primary py-4 rounded-2xl shadow-xl shadow-primary/20">
              {activity ? '确认修改' : '保存到日程'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function TimelineGroup({ date, day, children, active }: any) {
  return (
    <div className="mb-12 relative">
      <div className={`absolute -left-[46px] top-0 w-11 h-11 rounded-full flex flex-col items-center justify-center border-2 z-10 transition-all duration-300 ${active ? 'bg-indigo-50 border-primary shadow-lg scale-110' : 'bg-white border-outline-variant/30'}`}>
        <span className={`text-[9px] font-black uppercase tracking-tighter ${active ? 'text-primary' : 'text-outline'}`}>{date}</span>
        <span className={`text-base font-bold leading-none ${active ? 'text-primary' : 'text-on-surface'}`}>{day}</span>
      </div>
      <div className="space-y-4 pt-1 transition-all duration-500 animate-in fade-in slide-in-from-left-4">{children}</div>
    </div>
  );
}

function TimelineEvent({ time, title, detail, color, completed, onToggle, onEdit, onDelete }: any) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ scale: 1.005 }}
      className={`relative p-5 rounded-2xl border border-outline-variant/10 shadow-sm bg-white overflow-hidden transition-all duration-300 ${completed ? 'bg-surface-container-low opacity-60' : 'hover:shadow-lg hover:border-primary/20'}`}
    >
      {/* Indicator Bar */}
      <div className={`absolute top-0 bottom-0 left-0 w-1.5 ${color}`}></div>
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 group/event">
        <div className="flex-1 flex gap-5 min-w-0" onClick={onToggle}>
          {/* Time & Type Block */}
          <div className="shrink-0 flex flex-col items-center justify-center bg-primary/5 px-4 py-2.5 rounded-2xl border border-primary/10 min-w-[80px]">
             <span className="text-xs font-black text-primary tracking-tighter">{time.split(' ')[0]}</span>
             <div className="h-0.5 w-3 bg-primary/20 my-1.5 rounded-full"></div>
             <span className="text-[10px] font-bold text-on-surface-variant">
               {time.includes('-') ? time.split('-')[1].trim() : '开始'}
             </span>
          </div>

          <div className="flex-1 min-w-0 pt-1">
            <h4 className={`text-base font-bold text-on-surface leading-snug transition-colors ${completed ? 'line-through opacity-50' : 'group-hover/event:text-primary'}`}>
              {title}
            </h4>
            <div className="flex items-center flex-wrap gap-x-4 gap-y-2 mt-2">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-on-surface-variant/70">
                <ICONS.MapPin size={12} className="text-primary/40" />
                <span className="truncate">{detail}</span>
              </div>
              {completed && (
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-secondary/10 rounded-full">
                  <ICONS.CheckCircle2 size={10} className="text-secondary" />
                  <span className="text-[10px] font-black text-secondary">已完成</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="shrink-0 flex items-center justify-end gap-2 pr-1 border-t border-outline-variant/5 md:border-t-0 pt-3 md:pt-0">
          {!completed && (
            <div className="flex items-center gap-1 opacity-0 group-hover/event:opacity-100 transition-opacity">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                className="w-10 h-10 flex items-center justify-center hover:bg-primary/10 rounded-full text-on-surface-variant hover:text-primary transition-all duration-300"
                title="编辑安排"
              >
                <ICONS.Pencil size={16} />
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="w-10 h-10 flex items-center justify-center hover:bg-error/10 rounded-full text-error/60 hover:text-error transition-all duration-300"
                title="撤销活动"
              >
                <ICONS.Trash2 size={16} />
              </button>
            </div>
          )}
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            className={`w-10 h-10 flex items-center justify-center rounded-full border transition-all duration-300 ${
              completed 
                ? 'bg-secondary border-secondary text-white' 
                : 'border-outline-variant/30 text-outline/30 hover:border-primary/50 hover:text-primary hover:bg-primary/5 shadow-sm'
            }`}
          >
            <ICONS.CheckCircle2 size={18} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

