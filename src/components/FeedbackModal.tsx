import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ICONS } from '../constants';
import { feedbackApi } from '../services/apiClient';

interface FeedbackModalProps {
  onClose: () => void;
}

export default function FeedbackModal({ onClose }: FeedbackModalProps) {
  const [activeTab, setActiveTab] = useState<'faq' | 'feedback'>('faq');
  const [feedbackType, setFeedbackType] = useState('bug');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const faqs = [
    {
      q: '如何导出我的面试数据？',
      a: '点击右上角的设置按钮，选择“导出数据”，即可下载包含所有公司投递详情的 CSV 格式表格。'
    },
    {
      q: '日程安排如何与职位详情联动？',
      a: '在职位详情页编辑“关键时间点”并保存后，系统会自动在日程中生成相应的提醒活动。'
    },
    {
      q: '如何修改我的个人头像？',
      a: '进入“个人中心”，点击头像区域即可上传本地图片作为新头像。'
    },
    {
      q: 'OCR 简历解析功能去哪了？',
      a: '为了保证数据隐私与解析精度，该功能目前正在进行算法升级，敬请期待。'
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    
    setIsSubmitting(true);
    try {
      await feedbackApi.submit(feedbackType, content);
      setIsSuccess(true);
      setContent('');
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 2000);
    } catch (err) {
      console.error('Submit feedback error:', err);
      alert('提交失败，请稍后再试');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div className="px-8 pt-8 pb-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-on-surface tracking-tight">帮助与反馈</h2>
            <p className="text-on-surface-variant text-xs opacity-60">我们非常重视您的每一条建议</p>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors"
          >
            <ICONS.X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-8 flex gap-4 border-b border-outline-variant/10">
          <button 
            onClick={() => setActiveTab('faq')}
            className={`pb-3 text-sm font-black transition-all relative ${activeTab === 'faq' ? 'text-primary' : 'text-on-surface-variant opacity-60 hover:opacity-100'}`}
          >
            常见问题
            {activeTab === 'faq' && <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
          </button>
          <button 
            onClick={() => setActiveTab('feedback')}
            className={`pb-3 text-sm font-black transition-all relative ${activeTab === 'feedback' ? 'text-primary' : 'text-on-surface-variant opacity-60 hover:opacity-100'}`}
          >
            提交反馈
            {activeTab === 'feedback' && <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <AnimatePresence mode="wait">
            {activeTab === 'faq' ? (
              <motion.div 
                key="faq"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-6"
              >
                {faqs.map((faq, i) => (
                  <div key={i} className="space-y-2">
                    <h4 className="flex items-start gap-3 text-sm font-black text-on-surface">
                      <span className="shrink-0 w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-[10px]">Q</span>
                      {faq.q}
                    </h4>
                    <div className="pl-9 text-xs text-on-surface-variant leading-relaxed opacity-70">
                      {faq.a}
                    </div>
                  </div>
                ))}
              </motion.div>
            ) : (
              <motion.form 
                key="feedback"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                onSubmit={handleSubmit}
                className="space-y-6"
              >
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-60">反馈类型</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: 'bug', label: '程序错误', icon: <ICONS.XCircle size={14} /> },
                      { id: 'feature', label: '功能建议', icon: <ICONS.PlusCircle size={14} /> },
                      { id: 'other', label: '其他反馈', icon: <ICONS.HelpCircle size={14} /> }
                    ].map(type => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setFeedbackType(type.id)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all border ${
                          feedbackType === type.id 
                            ? 'bg-primary text-white border-primary shadow-md' 
                            : 'bg-white text-on-surface-variant border-outline-variant/30 hover:border-primary/50'
                        }`}
                      >
                        {type.icon} {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-60">详细描述</label>
                  <textarea 
                    rows={5}
                    required
                    placeholder="请尽量详细描述您遇到的问题或建议的改进方案..."
                    className="w-full bg-surface-container-low px-5 py-4 rounded-3xl border border-outline-variant/30 text-sm font-bold text-on-surface outline-none focus:ring-2 focus:ring-primary transition-all placeholder:text-outline-variant/50 placeholder:font-normal"
                    value={content}
                    onChange={e => setContent(e.target.value)}
                  />
                </div>

                <button 
                  type="submit"
                  disabled={isSubmitting || isSuccess}
                  className={`w-full py-4 rounded-2xl font-black transition-all flex items-center justify-center gap-2 shadow-lg ${
                    isSuccess 
                      ? 'bg-success text-white' 
                      : 'bg-primary text-white hover:bg-primary-dark active:scale-[0.98] shadow-primary/20'
                  }`}
                >
                  {isSubmitting ? (
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
                  ) : isSuccess ? (
                    <><ICONS.Check size={20} /> 我们已收到您的反馈</>
                  ) : (
                    <><ICONS.Zap size={18} /> 发送反馈</>
                  )}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-8 py-4 bg-surface-container-low text-center">
          <p className="text-[10px] font-bold text-on-surface-variant opacity-40">常见问题无法解决？请联系开发者邮箱: support@offerflow.ai</p>
        </div>
      </motion.div>
    </div>
  );
}
