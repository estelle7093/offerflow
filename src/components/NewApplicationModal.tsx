import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ICONS, Application } from '../constants';

interface NewApplicationModalProps {
  onClose: () => void;
  onSubmit: (app: Partial<Application>) => void;
  activities: any[];
  onAddActivity: (activity: any) => void;
}

export default function NewApplicationModal({ onClose, onSubmit, activities, onAddActivity }: NewApplicationModalProps) {
  const [formData, setFormData] = useState({
    company: '',
    role: '',
    location: '',
    salary: '',
    jdSummary: '',
    status: 'applied' as Application['status'],
    appliedDate: new Date().toISOString().split('T')[0]
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const appId = Math.random().toString(36).substr(2, 9);
    
    onSubmit({
      id: appId,
      ...formData,
      stage: formData.status === 'applied' ? '筛选简历中' : formData.status === 'test' ? '笔试中' : '面试中',
      updatedAt: '刚刚',
      logoUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.company)}&background=random`,
      aiMatchingScore: 0,
      timeline: {
        applied: formData.appliedDate
      }
    });

    // Add to schedule
    const newActivity = {
      id: Math.random().toString(36).substr(2, 9),
      title: `${formData.company} - 已投递`,
      date: formData.appliedDate,
      time: '09:00',
      type: 'other' as const,
      location: formData.location || '在线投递',
      applicationId: appId,
      isCompleted: true
    };
    onAddActivity(newActivity);
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
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
          <h3 className="text-on-surface">添加新求职申请</h3>
          <button onClick={onClose} className="p-2 hover:bg-surface-container rounded-full transition-colors">
            <ICONS.Plus className="rotate-45" size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-2">公司名称</label>
              <input 
                required
                placeholder="例如：Google"
                className="w-full px-4 py-3 rounded-xl border border-outline-variant/30 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm"
                value={formData.company}
                onChange={e => setFormData({ ...formData, company: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-2">职位名称</label>
              <input 
                required
                placeholder="例如：产品经理"
                className="w-full px-4 py-3 rounded-xl border border-outline-variant/30 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm"
                value={formData.role}
                onChange={e => setFormData({ ...formData, role: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-2">工作地点</label>
              <input 
                placeholder="例如：北京"
                className="w-full px-4 py-3 rounded-xl border border-outline-variant/30 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm"
                value={formData.location}
                onChange={e => setFormData({ ...formData, location: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-2">薪资期望</label>
              <input 
                placeholder="例如：30k-50k"
                className="w-full px-4 py-3 rounded-xl border border-outline-variant/30 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm"
                value={formData.salary}
                onChange={e => setFormData({ ...formData, salary: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-2">投递日期</label>
              <input 
                type="date"
                required
                className="w-full px-4 py-3 rounded-xl border border-outline-variant/30 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm"
                value={formData.appliedDate}
                onChange={e => setFormData({ ...formData, appliedDate: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-2">当前状态</label>
              <div className="flex flex-wrap gap-2">
                {(['applied', 'interviewing', 'test', 'offer'] as const).map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setFormData({ ...formData, status: s })}
                    className={`px-3 py-2 rounded-xl text-[11px] font-bold transition-all border ${
                      formData.status === s 
                        ? 'bg-primary text-white border-primary shadow-md' 
                        : 'bg-white text-on-surface-variant border-outline-variant/30 hover:border-primary/50'
                    }`}
                  >
                    {s === 'applied' ? '筛选中' : s === 'interviewing' ? '面试中' : s === 'test' ? '笔试中' : '获录取'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-2">职位描述 (JD) - 用于AI备战</label>
            <textarea 
              rows={3}
              placeholder="粘贴职位要求，AI将为您生成面试策略"
              className="w-full px-4 py-3 rounded-xl border border-outline-variant/30 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm resize-none"
              value={formData.jdSummary}
              onChange={e => setFormData({ ...formData, jdSummary: e.target.value })}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 px-6 py-4 rounded-2xl bg-surface-container-low text-on-surface-variant font-bold text-sm border border-outline-variant/30 hover:bg-surface-container transition-all active:scale-95 whitespace-nowrap flex items-center justify-center"
            >
              取消
            </button>
            <button 
              type="submit" 
              className="flex-[2] btn-primary py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-primary/20 whitespace-nowrap"
            >
              <ICONS.Plus size={20} /> 完成并开始追踪
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
