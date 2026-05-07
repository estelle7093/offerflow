import React from 'react';
import { Application, ICONS } from '../constants';
import { motion } from 'motion/react';

interface OverviewProps {
  onNavigateToDetails: (id: string) => void;
  onAddApplication: () => void;
  onNavigateWithFilter: (filter: 'all' | 'applied' | 'test' | 'interviewing' | 'offer' | 'rejected') => void;
  applications: Application[];
  userName: string;
}

export default function OverviewView({ 
  onNavigateToDetails, 
  onAddApplication, 
  onNavigateWithFilter,
  applications,
  userName
}: OverviewProps) {
  const totalCount = applications.length;
  const interviewingCount = applications.filter(a => a.status === 'interviewing').length;
  const offerCount = applications.filter(a => a.status === 'offer').length;

  return (
    <div className="space-y-8 md:space-y-12 pb-10">
      {/* ... welcome section ... */}
      <section className="px-1">
        <h1 className="text-on-surface text-2xl md:text-3xl font-black">早上好，{userName}</h1>
        <p className="text-on-surface-variant text-sm mt-1 opacity-70">让每一个机会都尽在掌握</p>
      </section>

      {/* Quick Actions & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-spacing-gutter">
        {/* Quick Actions */}
        <div className="md:col-span-4 flex flex-col gap-4">
          <button 
            onClick={onAddApplication}
            className="flex items-center justify-between p-5 bg-primary-container text-white rounded-2xl shadow-lg shadow-primary/20 hover:shadow-xl transition-all active:scale-[0.98] group text-left relative overflow-hidden"
          >
            <div className="relative z-10">
              <h3 className="text-white text-lg mb-0.5">添加新申请</h3>
              <p className="text-on-primary-container text-[10px] uppercase font-bold tracking-wider opacity-70">手动录入职位详情</p>
            </div>
            <div className="relative z-10 w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <ICONS.Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
            </div>
          </button>
        </div>

        {/* Stats Card */}
        <div className="md:col-span-8 bg-white rounded-2xl p-6 md:p-8 border border-outline-variant/20 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[200px]">
          <div className="absolute -right-20 -top-20 w-60 h-60 bg-primary/5 rounded-full blur-3xl"></div>
          
          <div className="flex justify-between items-center mb-6 relative z-10">
            <h2 className="text-on-surface text-lg md:text-xl font-bold">生涯数据概览</h2>
            <span className="px-3 py-1 bg-secondary-container/20 text-secondary rounded-full text-[10px] font-black uppercase tracking-widest">
              数据已同步
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 md:gap-6 relative z-10">
            <StatItem 
              label="总投递" 
              value={totalCount.toString()} 
              color="text-primary" 
              onClick={() => onNavigateWithFilter('applied')}
            />
            <StatItem 
              label="面试中" 
              value={interviewingCount.toString()} 
              color="text-tertiary" 
              onClick={() => onNavigateWithFilter('interviewing')}
            />
            <StatItem 
              label="获得录取" 
              value={offerCount.toString()} 
              color="text-secondary" 
              onClick={() => onNavigateWithFilter('offer')}
            />
          </div>
        </div>
      </div>

      {/* Funnel Chart */}
      <section className="glass-card rounded-2xl p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5">
          <ICONS.BarChart3 size={120} />
        </div>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4 relative z-10">
          <div>
            <h2 className="text-on-surface flex items-center gap-2">
              <ICONS.Target className="text-primary" /> AI 转化漏斗分析
            </h2>
            <p className="text-on-surface-variant text-sm">基于你的求职行为全路径分析（最近 30 天）</p>
          </div>
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-xl">
              <span className="text-xs font-bold text-primary uppercase">面试转化率</span>
              <span className="text-xl font-black text-primary">
                {totalCount > 0 ? Math.round((applications.filter(a => ['interviewing', 'offer'].includes(a.status)).length / totalCount) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          {/* Visual Funnel */}
          <div className="lg:col-span-7 flex flex-col gap-3 py-4">
            {(() => {
              const screeningPassed = applications.filter(a => ['interviewing', 'offer', 'test', 'rejected'].includes(a.status) && (a.status !== 'applied' || a.stage.includes('通过'))).length;
              const interviewing = applications.filter(a => ['interviewing', 'offer'].includes(a.status)).length;
              const offerCount = applications.filter(a => a.status === 'offer').length;

                const funnelData = [
                  { label: '简历筛选', count: totalCount, color: 'bg-primary/20', icon: <ICONS.Briefcase size={14} /> },
                  { label: '笔试阶段', count: screeningPassed, color: 'bg-indigo-400/40', icon: <ICONS.FileText size={14} /> },
                  { label: '面试阶段', count: interviewing, color: 'bg-primary/60', icon: <ICONS.MessageSquareQuote size={14} /> },
                  { label: '录用意向', count: offerCount, color: 'bg-secondary', icon: <ICONS.Star size={14} /> }
                ];

                return funnelData.map((stage, idx) => {
                  const width = totalCount > 0 ? (stage.count / totalCount) * 100 : 0;
                  const prevCount = idx > 0 ? funnelData[idx-1].count : totalCount;
                  const passRate = idx > 0 && prevCount > 0 ? Math.round((stage.count / prevCount) * 100) : 100;

                  return (
                    <React.Fragment key={stage.label}>
                      {idx > 0 && (
                        <div className="flex items-center gap-3 ml-24 my-1 h-12">
                          <div className="h-full w-px bg-primary/20 border-l border-dashed ml-2"></div>
                          <div className="flex items-center gap-1.5 bg-primary/5 px-2.5 py-1 rounded-full border border-primary/20 shadow-sm whitespace-nowrap">
                            <ICONS.Zap size={10} className="text-amber-500 fill-amber-500 shrink-0" />
                            <span className="text-[9px] font-black text-[#3525cd] tracking-widest uppercase">
                              通过率 {passRate}%
                            </span>
                          </div>
                        </div>
                      )}
                      <div className="flex items-center gap-4">
                        <div className="w-24 text-right">
                          <span className="text-[10px] font-black text-[#3525cd] uppercase tracking-[0.1em] shrink-0 whitespace-nowrap">{stage.label}</span>
                        </div>
                        <div className="flex-1 h-14 relative bg-on-surface/[0.03] rounded-3xl overflow-hidden border border-outline-variant/10">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${width}%` }}
                            transition={{ duration: 1.2, delay: idx * 0.1, ease: "circOut" }}
                            className={`absolute inset-y-0 left-0 ${stage.color} flex items-center px-5 justify-between transition-all`}
                          >
                            <div className="flex items-center gap-3 text-[#3525cd] z-10 whitespace-nowrap">
                              <div className="w-8 h-8 rounded-xl bg-white/40 flex items-center justify-center backdrop-blur-sm border border-primary/10 shrink-0">
                                {stage.icon}
                              </div>
                              <div className="flex flex-col">
                                <span className="text-lg font-black tracking-tighter leading-none">{stage.count}</span>
                                <div className="text-[9px] font-black text-[#3525cd] opacity-70 uppercase tracking-widest mt-0.5 md:hidden">{stage.label}</div>
                              </div>
                            </div>
                            
                            {width > 25 && (
                              <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-white/40 backdrop-blur-sm rounded-full border border-primary/10 whitespace-nowrap ml-4">
                                <span className="text-[10px] font-black text-[#3525cd] uppercase tracking-widest leading-none">
                                  {totalCount > 0 ? Math.round((stage.count / totalCount) * 100) : 0}% 累计
                                </span>
                              </div>
                            )}
                          </motion.div>
                        </div>
                      </div>
                    </React.Fragment>
                  );
                });
            })()}
          </div>

          {/* AI Insight Side Panel */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-6 rounded-2xl bg-surface-container-low border border-outline-variant/30">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <ICONS.Sparkles size={16} />
                </div>
                <h4 className="text-sm font-bold text-on-surface">AI 改进建议</h4>
              </div>
              
              <div className="space-y-4">
                {(() => {
                  const screeningPassed = applications.filter(a => ['interviewing', 'offer', 'test'].includes(a.status)).length;
                  const interviewing = applications.filter(a => ['interviewing', 'offer'].includes(a.status)).length;
                  
                  if (totalCount === 0) return <p className="text-xs text-on-surface-variant italic">开始投递职位以获取 AI 分析洞察</p>;

                  const passRate = totalCount > 0 ? (screeningPassed / totalCount) : 0;
                  const interviewRate = screeningPassed > 0 ? (interviewing / screeningPassed) : 0;

                  return (
                    <>
                      {passRate < 0.6 ? (
                        <div className="flex gap-3">
                          <div className="mt-1 shrink-0"><ICONS.AlertCircle size={14} className="text-amber-500" /></div>
                          <div>
                            <p className="text-xs font-bold text-on-surface">简历通过率偏低</p>
                            <p className="text-[11px] text-on-surface-variant leading-relaxed">你的简历在初筛阶段损耗较大。建议使用“简历诊断”功能根据 JD 进行关键词优化。</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-3">
                          <div className="mt-1 shrink-0"><ICONS.CheckCircle2 size={14} className="text-secondary" /></div>
                          <div>
                            <p className="text-xs font-bold text-on-surface">简历质量极佳</p>
                            <p className="text-[11px] text-on-surface-variant leading-relaxed">你的简历通过率高于 60% 的同行，继续保持。可以尝试投递更高难度的职位。</p>
                          </div>
                        </div>
                      )}
                      
                      {interviewRate < 0.8 && screeningPassed > 0 && (
                        <div className="flex gap-3">
                          <div className="mt-1 shrink-0"><ICONS.Zap size={14} className="text-primary" /></div>
                          <div>
                            <p className="text-xs font-bold text-on-surface">面试机会转化效率</p>
                            <p className="text-[11px] text-on-surface-variant leading-relaxed">通过筛选后的面试转化比良好。建议在现有基础上增加投递基数或优化投递渠道。</p>
                          </div>
                        </div>
                      )}
                      <div className="flex gap-3 p-3 bg-secondary/5 rounded-xl border border-secondary/10">
                        <div className="mt-1 shrink-0"><ICONS.Lightbulb size={14} className="text-secondary" /></div>
                        <div>
                          <p className="text-xs font-bold text-secondary">渠道预测</p>
                          <p className="text-[11px] text-on-surface-variant leading-relaxed">根据近期数据，内推通过率比海投高出 42%。锁定下周 3 个内推机会可能有突破。</p>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Activity */}
      <section>
            <div className="flex justify-between items-end mb-6">
              <h2 className="text-on-surface">近期动态</h2>
              <button 
                onClick={() => onNavigateWithFilter('all')} 
                className="text-primary font-semibold text-sm hover:underline"
              >
                查看全部
              </button>
            </div>

        <div className="space-y-4">
          {applications.slice(0, 3).map((app) => (
            <ActivityCard 
              key={app.id}
              id={app.id}
              title={app.role} 
              company={`${app.company} · ${app.location}`} 
              status={app.stage} 
              statusColor={
                app.status === 'offer' ? 'bg-secondary/10 text-secondary' :
                app.status === 'interviewing' ? 'bg-tertiary/10 text-tertiary' :
                'bg-surface-container text-on-surface-variant'
              }
              time={app.updatedAt}
              subTime="最近更新"
              logoUrl={app.logoUrl}
              onClick={() => onNavigateToDetails(app.id)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function StatItem({ label, value, color, onClick }: { label: string, value: string, color: string, onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="text-center py-4 px-2 md:p-6 rounded-2xl bg-surface-container-low border border-outline-variant/30 flex flex-col items-center justify-center hover:bg-surface-container transition-all active:scale-95 group shadow-sm hover:shadow-md"
    >
      <span className="text-on-surface-variant text-[9px] md:text-[10px] uppercase font-black tracking-widest mb-2 group-hover:text-primary transition-colors opacity-60">{label}</span>
      <span className={`text-2xl md:text-4xl font-black tracking-tighter ${color}`}>{value}</span>
    </button>
  );
}

function ActivityCard({ id, title, company, status, statusColor, time, subTime, logoUrl, onClick }: any) {
  return (
    <div 
      onClick={onClick}
      className="bg-white p-5 rounded-2xl border border-outline-variant/20 flex items-center gap-5 hover:shadow-md transition-all cursor-pointer group active:scale-[0.99]"
    >
      <div className="w-12 h-12 rounded-xl bg-surface-container-low flex items-center justify-center shrink-0 border border-outline-variant/10 overflow-hidden">
        {logoUrl ? (
          <img src={logoUrl} alt={company} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        ) : (
          <ICONS.Briefcase className="text-primary opacity-40" size={24} />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start gap-2">
          <div className="truncate">
            <h4 className="font-bold text-on-surface truncate group-hover:text-primary transition-colors">{title}</h4>
            <p className="text-on-surface-variant text-xs truncate">{company}</p>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0 whitespace-nowrap ${statusColor}`}>
            {status}
          </span>
        </div>
      </div>
      <div className="hidden md:block text-right shrink-0">
        <span className="block text-sm font-bold text-on-surface">{time}</span>
        <span className="text-[10px] text-on-surface-variant font-medium">{subTime}</span>
      </div>
    </div>
  );
}
