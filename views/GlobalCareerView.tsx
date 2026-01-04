
import React, { useState, useEffect, useRef } from 'react';
import { generateGlobalInsights, chatWithCareerAdvisor, generateCoverLetter } from '../services/geminiService';
import { 
  Globe, MapPin, Briefcase, ExternalLink, AlertCircle, BarChart3, Target, Link, Heart, 
  Coins, Info, ShieldCheck, Zap, Activity, TrendingUp, History, TrendingDown,
  MessageSquare, Send, Loader2, FileCheck, CheckCircle2, ChevronRight, X, Sparkles,
  Search, BookOpen, Compass, RefreshCw, Star, ArrowUpRight
} from 'lucide-react';
import { logger } from '../services/logger';

const COUNTRIES = [
  { id: 'Taiwan', label: '台湾 (Taiwan)', flag: '🇹🇼', tags: ['低成本', '极高友好'] },
  { id: 'Japan', label: '日本 (Japan)', flag: '🇯🇵', tags: ['机会多', '文化近'] },
  { id: 'Germany', label: '德国 (Germany)', flag: '🇩🇪', tags: ['工签松', '高社会保障'] },
  { id: 'Singapore', label: '新加坡 (Singapore)', flag: '🇸🇬', tags: ['双语枢纽', '高薪'] },
  { id: 'Canada', label: '加拿大 (Canada)', flag: '🇨🇦', tags: ['移民稳', '包容性'] },
  { id: 'USA', label: '美国 (USA)', flag: '🇺🇸', tags: ['高天花板', '竞争大'] }
];

const GlobalCareerView: React.FC = () => {
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0].id);
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 职位投递状态
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [applying, setApplying] = useState(false);
  const [appliedJobs, setAppliedJobs] = useState<string[]>([]);
  const [coverLetter, setCoverLetter] = useState<string | null>(null);

  // AI 顾问状态
  const [showAdvisor, setShowAdvisor] = useState(false);
  const [advisorMsg, setAdvisorMsg] = useState('');
  const [advisorHistory, setAdvisorHistory] = useState<{role: 'ai'|'user', text: string, sources?: any[]}[]>([]);
  const [advisorLoading, setAdvisorLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const fetchInsights = async (retryCount = 0) => {
    setLoading(true);
    setError(null);
    try {
      const data = await generateGlobalInsights(selectedCountry);
      setInsights(data);
    } catch (e: any) {
      if (retryCount < 1) {
        setTimeout(() => fetchInsights(retryCount + 1), 2000);
      } else {
        setError("实时数据链路由于请求过载或网络波动暂时中断，请稍后重试。");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInsights(); }, [selectedCountry]);
  useEffect(() => { if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: 'smooth' }); }, [advisorHistory]);

  const handleApply = async (job: any) => {
    setSelectedJob(job);
    setApplying(true);
    setCoverLetter(null);
    try {
      const letter = await generateCoverLetter(job, logger.getMasterProgress());
      setCoverLetter(letter);
    } catch (e) { 
      console.error(e); 
      setCoverLetter("AI 生成 Cover Letter 失败，请尝试重新生成。");
    } finally { setApplying(false); }
  };

  const confirmApply = () => {
    if (selectedJob) {
      setAppliedJobs(prev => [...prev, selectedJob.id]);
      setSelectedJob(null);
    }
  };

  const handleAdvisorSend = async (quickMsg?: string) => {
    const msg = quickMsg || advisorMsg;
    if (!msg.trim() || advisorLoading) return;
    
    setAdvisorMsg('');
    setAdvisorHistory(prev => [...prev, { role: 'user', text: msg }]);
    setAdvisorLoading(true);
    try {
      const res = await chatWithCareerAdvisor(selectedCountry, msg, advisorHistory);
      setAdvisorHistory(prev => [...prev, { role: 'ai', text: res.text, sources: res.sources }]);
    } catch (e) {
      setAdvisorHistory(prev => [...prev, { role: 'ai', text: "对不起，AI 顾问由于 API 连接超时暂时断开。建议您重试。" }]);
    } finally { setAdvisorLoading(false); }
  };

  const jobs = insights?.jobs || [];
  const visaInfo = insights?.visa_info || "";
  const proTips = insights?.pro_tips || [];

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700 pb-32 relative">
      {/* 顶部 Banner */}
      <div className="bg-slate-900 rounded-[3.5rem] p-12 text-white relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-110 transition-transform"><Globe size={300} /></div>
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-12">
          <div className="space-y-6 max-w-2xl text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start gap-3">
              <div className="bg-indigo-500/20 px-4 py-1.5 rounded-full backdrop-blur-md text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 border border-indigo-500/30 text-indigo-400">
                <Compass size={14} /> Intelligence Engine Enabled
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl font-black tracking-tighter leading-tight">
              {selectedCountry} 职场导航 <br/>
              <span className="text-indigo-400 text-4xl md:text-5xl">实时职位与 AI 求职决策</span>
            </h1>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {COUNTRIES.map(c => (
              <button 
                key={c.id} 
                onClick={() => setSelectedCountry(c.id)}
                className={`px-5 py-5 rounded-[2.5rem] flex flex-col gap-1 transition-all border text-left group ${
                  selectedCountry === c.id ? 'bg-white text-slate-900 shadow-xl border-white scale-105' : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">{c.flag}</span>
                  <span className="font-black text-[10px] truncate uppercase tracking-widest">{c.id}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="h-96 flex flex-col items-center justify-center gap-6">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
            <Activity className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-400 animate-pulse" />
          </div>
          <p className="text-slate-500 font-black uppercase tracking-widest text-sm animate-pulse text-center">正在联网检索 {selectedCountry} 的实时职位与签证政策...</p>
        </div>
      ) : error ? (
        <div className="h-96 bg-white rounded-[3rem] border border-slate-100 flex flex-col items-center justify-center gap-6 text-center px-10">
          <div className="p-5 bg-rose-50 rounded-full text-rose-500 shadow-inner"><AlertCircle size={40}/></div>
          <div className="space-y-2">
            <p className="text-slate-800 font-black text-xl">数据同步遇到挑战</p>
            <p className="text-slate-400 text-sm max-w-md">{error}</p>
          </div>
          <button onClick={() => fetchInsights()} className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg hover:bg-indigo-700 flex items-center gap-2"><RefreshCw size={18}/> 重新连接实时数据</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* 左侧：职位列表与市场数据 */}
          <div className="lg:col-span-8 space-y-12">
            <section className="space-y-8">
              <div className="flex items-center justify-between">
                <h3 className="text-3xl font-black text-slate-800 flex items-center gap-4">
                  <Briefcase className="text-indigo-600" /> 全球活跃职缺 (Active Openings)
                </h3>
                <div className="flex items-center gap-2">
                   <div className="bg-emerald-50 text-emerald-600 px-4 py-1 rounded-full text-[10px] font-black border border-emerald-100 flex items-center gap-1.5"><CheckCircle2 size={12}/> AI 匹配已就绪</div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {jobs.map((job: any) => (
                  <div key={job.id} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group flex flex-col md:flex-row justify-between gap-8 relative overflow-hidden">
                    <div className="space-y-5 flex-1">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-3">
                          <h4 className="text-2xl font-black text-slate-800 group-hover:text-indigo-600 transition-colors">{job.title}</h4>
                          <span className="text-xs font-bold text-slate-400">({job.titleCN || '招聘中'})</span>
                        </div>
                        <div className="flex items-center gap-6 text-sm font-bold text-slate-500 uppercase tracking-widest">
                          <span className="flex items-center gap-1.5 text-indigo-600"><MapPin size={16}/> {job.company}</span>
                          <span className="flex items-center gap-1.5"><Coins size={16}/> {job.salary || 'Competitive'}</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {(job.requirements || []).map((req: string, i: number) => (
                          <span key={i} className="px-3 py-1 bg-slate-50 text-slate-500 rounded-lg text-[10px] font-black border border-slate-100">{req}</span>
                        ))}
                      </div>

                      <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-2">
                         <p className="text-xs text-slate-600 font-medium leading-relaxed italic">"{job.desc}"</p>
                         {job.descCN && <p className="text-[10px] text-slate-400 font-bold">{job.descCN}</p>}
                      </div>
                    </div>

                    <div className="flex flex-col justify-center gap-4 md:w-56 shrink-0">
                      {appliedJobs.includes(job.id) ? (
                        <div className="py-5 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center gap-3 font-black text-sm border-2 border-emerald-100 shadow-inner">
                          <CheckCircle2 size={20} /> 投递成功
                        </div>
                      ) : (
                        <button 
                          onClick={() => handleApply(job)}
                          className="py-5 bg-slate-900 text-white rounded-2xl font-black text-sm hover:bg-indigo-600 transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3 group/btn"
                        >
                          投递并适配求职信 <FileCheck size={20} className="group-hover/btn:rotate-12 transition-transform" />
                        </button>
                      )}
                      <button 
                        onClick={() => handleAdvisorSend(`Tell me more about ${job.company} and its office culture in ${selectedCountry}.`)}
                        className="py-3 bg-white text-slate-500 border border-slate-100 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:border-indigo-600 hover:text-indigo-600 transition-all flex items-center justify-center gap-2"
                      >
                         <Search size={14}/> 公司背景背调
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* 签证与市场提示 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <section className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-6">
                 <h4 className="text-lg font-black text-slate-800 flex items-center gap-3"><ShieldCheck className="text-emerald-500"/> 最新签证情报 (Visa Policy)</h4>
                 <div className="p-6 bg-emerald-50/50 rounded-2xl border border-emerald-100 text-sm text-slate-600 leading-[2] font-medium italic">
                    {visaInfo || "AI 正在分析该国 2025 年针对专业人士的工签配额与打分标准..."}
                 </div>
               </section>
               <section className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-6">
                 <h4 className="text-lg font-black text-slate-800 flex items-center gap-3"><Star className="text-amber-500"/> 求职策略锦囊 (Pro Tips)</h4>
                 <div className="space-y-4">
                    {proTips.map((tip: string, i: number) => (
                      <div key={i} className="flex gap-3">
                        <div className="shrink-0 w-6 h-6 rounded-full bg-slate-900 text-white text-[10px] font-black flex items-center justify-center">{i+1}</div>
                        <p className="text-xs text-slate-500 font-bold leading-relaxed">{tip}</p>
                      </div>
                    ))}
                 </div>
               </section>
            </div>
          </div>

          {/* 右侧：AI 职业顾问 */}
          <div className="lg:col-span-4 space-y-10">
            <section className={`bg-white rounded-[3.5rem] border border-slate-100 shadow-2xl flex flex-col transition-all duration-500 ${showAdvisor ? 'h-[750px]' : 'h-72 overflow-hidden'}`}>
              <header className="p-8 bg-indigo-600 text-white flex items-center justify-between shadow-lg relative">
                <div className="absolute -top-10 -right-10 opacity-10 rotate-12"><MessageSquare size={150}/></div>
                <div className="flex items-center gap-4 relative z-10">
                  <div className="bg-white/20 p-2.5 rounded-2xl backdrop-blur-md shadow-inner animate-pulse"><Sparkles size={20} /></div>
                  <div className="flex flex-col">
                    <span className="font-black text-sm tracking-tight uppercase tracking-widest">Career Genius AI</span>
                    <span className="text-[9px] font-black uppercase opacity-70 flex items-center gap-1"><Zap size={10} className="text-amber-400"/> Google Search Grounding On</span>
                  </div>
                </div>
                {!showAdvisor ? (
                  <button onClick={() => setShowAdvisor(true)} className="p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-all"><ChevronRight size={20} /></button>
                ) : (
                  <button onClick={() => setShowAdvisor(false)} className="p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-all"><X size={20} /></button>
                )}
              </header>

              {showAdvisor ? (
                <>
                  <div className="flex-1 p-6 space-y-6 overflow-y-auto custom-scrollbar bg-slate-50/50">
                    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 text-xs text-slate-700 leading-relaxed shadow-sm">
                      <span className="font-black text-indigo-600 block mb-2 underline decoration-indigo-100">Consultant Entry:</span>
                      我是你的 <b>{selectedCountry}</b> 职业专家。你可以询问我有关面试礼仪、具体公司的市场口碑，或最新的数字游民签证政策。
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                       <button onClick={() => handleAdvisorSend("What are the most in-demand skills for tech expats here in 2025?")} className="p-4 bg-white rounded-2xl border border-slate-100 text-[10px] font-black text-slate-400 hover:text-indigo-600 hover:border-indigo-600 transition-all text-left shadow-sm">查询 2025 紧缺技能</button>
                       <button onClick={() => handleAdvisorSend("Explain the interview culture and etiquette in this country.")} className="p-4 bg-white rounded-2xl border border-slate-100 text-[10px] font-black text-slate-400 hover:text-indigo-600 hover:border-indigo-600 transition-all text-left shadow-sm">当地面试礼仪背调</button>
                    </div>

                    {advisorHistory.map((h, i) => (
                      <div key={i} className={`flex ${h.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in`}>
                        <div className={`max-w-[90%] p-5 rounded-[2rem] text-xs leading-relaxed shadow-sm ${h.role === 'user' ? 'bg-slate-900 text-white font-bold rounded-tr-none' : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'}`}>
                          {h.text}
                          {h.sources && h.sources.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-2">
                              <span className="text-[8px] font-black text-slate-300 w-full mb-1">DATA CITATIONS:</span>
                              {h.sources.slice(0, 3).map((s, j) => (
                                <a key={j} href={s.web?.uri} target="_blank" className="bg-slate-50 px-2 py-1 rounded text-[8px] font-black text-indigo-400 hover:bg-indigo-50 flex items-center gap-1 truncate max-w-[120px]">
                                  <Link size={8}/> {s.web?.title}
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {advisorLoading && <div className="flex justify-start animate-pulse"><div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm"><Loader2 className="animate-spin text-indigo-400" size={18} /></div></div>}
                    <div ref={chatEndRef} />
                  </div>
                  <div className="p-5 bg-white border-t border-slate-100">
                    <div className="relative group">
                      <input 
                        value={advisorMsg} 
                        onChange={(e) => setAdvisorMsg(e.target.value)} 
                        onKeyDown={(e) => e.key === 'Enter' && handleAdvisorSend()}
                        placeholder="向 AI 导师询问职场决策建议..." 
                        className="w-full bg-slate-50 border-2 border-slate-50 focus:border-indigo-600 focus:bg-white rounded-2xl py-5 pl-7 pr-16 outline-none font-bold text-xs transition-all shadow-inner" 
                      />
                      <button onClick={() => handleAdvisorSend()} disabled={advisorLoading} className="absolute right-3 top-1/2 -translate-y-1/2 p-3.5 bg-indigo-600 text-white rounded-xl shadow-lg active:scale-95 transition-transform"><Send size={18}/></button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-10 space-y-6">
                   <p className="text-xs text-slate-500 font-bold leading-relaxed italic border-l-4 border-indigo-100 pl-4">“正在监控该国 2024-2025 职场变迁趋势。AI 助手已就绪，随时回答您的全球化发展疑问。”</p>
                   <button onClick={() => setShowAdvisor(true)} className="w-full py-5 bg-indigo-50 text-indigo-600 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-indigo-100 transition-all shadow-sm flex items-center justify-center gap-3">进入联网职场咨询 <ArrowUpRight size={18}/></button>
                </div>
              )}
            </section>

            <section className="bg-slate-900 p-12 rounded-[3.5rem] text-white shadow-xl space-y-8 relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-1000"><TrendingUp size={150} /></div>
               <h3 className="text-xl font-black flex items-center gap-3 relative z-10"><BarChart3 size={24} className="text-emerald-400" /> 职场竞争力雷达</h3>
               <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/10 space-y-6 relative z-10 shadow-inner">
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] font-black uppercase text-indigo-200 tracking-widest">当地中位年薪 (Est. 2025)</span>
                    <span className="text-3xl font-black text-white">{insights?.market?.salary_cn || '数据同步中...'}</span>
                  </div>
                  <div className="h-px bg-white/10 w-full" />
                  <p className="text-[11px] text-slate-400 italic leading-relaxed font-medium">“{insights?.market?.trend_2yr_desc || 'AI 正在分析该市场的通胀、技能短缺以及跨国企业布局...' }”</p>
               </div>
            </section>
          </div>
        </div>
      )}

      {/* 投递预览弹窗 (Cover Letter) */}
      {selectedJob && (
        <div className="fixed inset-0 z-[400] bg-slate-900/95 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="max-w-3xl w-full bg-white rounded-[4rem] shadow-2xl overflow-hidden relative animate-slide-up flex flex-col h-[85vh]">
              <button onClick={() => setSelectedJob(null)} className="absolute top-10 right-10 p-3.5 bg-slate-100 rounded-full hover:bg-slate-200 transition-all z-20"><X size={24}/></button>
              
              <div className="p-14 pb-8 border-b border-slate-100">
                 <div className="flex items-center gap-5">
                    <div className="bg-indigo-600 p-4 rounded-[1.5rem] text-white shadow-2xl"><FileCheck size={28} /></div>
                    <div>
                      <h3 className="text-3xl font-black text-slate-800">简历适配与智能投递</h3>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Applying to {selectedJob.company} • {selectedJob.title}</p>
                    </div>
                 </div>
              </div>

              <div className="flex-1 overflow-y-auto p-14 space-y-10 custom-scrollbar">
                 <div className="space-y-6">
                    <div className="flex items-center justify-between">
                       <h4 className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.3em] flex items-center gap-2">AI 深度定制 Cover Letter <Sparkles size={14}/></h4>
                       <span className="text-[10px] font-black text-slate-300 bg-slate-50 px-3 py-1 rounded-full border">根据学习进度自动生成</span>
                    </div>
                    <div className="p-12 bg-slate-50 rounded-[3rem] border-2 border-slate-100 shadow-inner relative group min-h-[300px]">
                       {applying ? (
                         <div className="absolute inset-0 flex flex-col items-center justify-center gap-8 bg-white/50 backdrop-blur-sm z-10 rounded-[3rem]">
                            <div className="relative">
                               <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                               <Zap className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-amber-500 animate-pulse" size={20}/>
                            </div>
                            <p className="text-sm font-black text-slate-400 uppercase tracking-widest animate-pulse">正在提取您的学习等级并构建职业逻辑...</p>
                         </div>
                       ) : (
                         <div className="prose prose-slate max-w-none text-sm text-slate-700 font-medium leading-[2.2] whitespace-pre-wrap italic">
                            {coverLetter || "正在重构内容..."}
                         </div>
                       )}
                    </div>
                 </div>
              </div>

              <div className="p-14 pt-8 bg-slate-50 border-t border-slate-100 flex flex-col items-center gap-8">
                 <div className="flex items-center gap-3 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                    <ShieldCheck size={18} className="text-emerald-500" /> 您的核心竞争力已通过加密通道同步至全球人才库
                 </div>
                 <button 
                  onClick={confirmApply}
                  className="w-full py-7 bg-slate-900 text-white rounded-3xl font-black text-2xl hover:bg-indigo-600 transition-all shadow-2xl active:scale-95 flex items-center justify-center gap-5 group/submit"
                 >
                    确认正式投递职位 <CheckCircle2 size={32} className="group-hover/submit:scale-110 transition-transform"/>
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default GlobalCareerView;
