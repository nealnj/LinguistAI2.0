
import React, { useState, useEffect, useCallback } from 'react';
import { generateGlobalInsights } from '../services/geminiService';
import { 
  Globe, 
  Map, 
  ArrowUpRight, 
  TrendingUp, 
  TrendingDown,
  Activity,
  Zap, 
  Compass, 
  ChevronRight,
  DollarSign,
  ExternalLink,
  Newspaper,
  Calendar,
  Key,
  AlertTriangle,
  History,
  Info,
  CheckCircle2,
  RefreshCcw,
  FileText
} from 'lucide-react';

const TOP_COUNTRIES = [
  { name: 'Canada', emoji: '🇨🇦', cn: '加拿大' },
  { name: 'Australia', emoji: '🇦🇺', cn: '澳大利亚' },
  { name: 'Japan', emoji: '🇯🇵', cn: '日本' },
  { name: 'UK', emoji: '🇬🇧', cn: '英国' },
  { name: 'USA', emoji: '🇺🇸', cn: '美国' },
  { name: 'Singapore', emoji: '🇸🇬', cn: '新加坡' },
  { name: 'Taiwan', emoji: '🇹🇼', cn: '台湾' },
  { name: 'South Korea', emoji: '🇰🇷', cn: '韩国' }
];

const GlobalCareerView: React.FC = () => {
  const [selectedCountry, setSelectedCountry] = useState(TOP_COUNTRIES[0].name);
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await generateGlobalInsights(selectedCountry);
      // 深度检查核心字段是否存在，防止白屏
      if (data && data.market) {
        setInsights(data);
      } else {
        throw new Error('INCOMPLETE_DATA');
      }
    } catch (e: any) {
      console.error("Fetch Error:", e);
      setError('数据获取失败。可能是由于数据结构异常或 API 暂时受限，请尝试切换国家。');
    } finally {
      setLoading(false);
    }
  }, [selectedCountry]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 动态计算增长趋势
  const isPositiveTrend = insights?.market?.pct ? !insights.market.pct.includes('-') : true;

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-20 animate-in fade-in duration-700">
      <div className="bg-slate-900 rounded-[3.5rem] p-10 md:p-12 text-white relative overflow-hidden shadow-2xl">
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-12">
          <div className="space-y-6 max-w-2xl text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start gap-3">
              <div className="bg-white/10 px-4 py-1.5 rounded-full backdrop-blur-md text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 border border-white/5">
                <Compass size={14} className="text-indigo-400" /> 实时趋势 REAL-TIME RADAR
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl font-black tracking-tighter leading-tight">
              洞察 <span className="text-indigo-400">{TOP_COUNTRIES.find(c => c.name === selectedCountry)?.cn} {selectedCountry}</span> 职业版图
            </h1>
          </div>
          <div className="flex flex-wrap justify-center bg-white/5 p-3 rounded-[2.5rem] border border-white/10 backdrop-blur-xl gap-2 max-w-xl">
            {TOP_COUNTRIES.map(c => (
              <button 
                key={c.name} 
                onClick={() => setSelectedCountry(c.name)}
                className={`px-6 py-3 rounded-2xl transition-all font-black text-sm whitespace-nowrap ${selectedCountry === c.name ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-400 hover:text-white'}`}
              >
                {c.emoji} {c.cn}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-[4rem] p-32 border border-slate-100 flex flex-col items-center justify-center gap-8 shadow-sm">
           <div className="relative">
             <div className="w-24 h-24 border-8 border-indigo-50 border-t-indigo-600 rounded-full animate-spin"></div>
             <Activity className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-400" size={48} />
           </div>
           <p className="text-slate-800 font-black text-2xl tracking-tight animate-pulse text-center">
             正在通过 Google 检索 2024-2025 真实数据...<br/>
             <span className="text-slate-400 text-sm font-bold mt-2 block">Retrieving Real-time Market Data...</span>
           </p>
        </div>
      ) : error ? (
        <div className="bg-white rounded-[4rem] p-24 border border-slate-100 flex flex-col items-center justify-center gap-6 shadow-sm text-center">
          <div className="bg-rose-100 p-6 rounded-full text-rose-600">
            <AlertTriangle size={48} />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">数据获取遇到问题</h3>
            <p className="text-slate-500 font-medium">{error}</p>
          </div>
          <button 
            onClick={fetchData}
            className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg hover:bg-slate-900 transition-all shadow-xl shadow-indigo-100 flex items-center gap-2"
          >
            <RefreshCcw size={20} /> 点击重试
          </button>
        </div>
      ) : insights && insights.market && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 space-y-10">
            {/* 薪资趋势可视化 */}
            <section className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm space-y-12">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-3 mb-1">
                    <DollarSign size={18} className="text-emerald-500" /> 2024-2025 薪资走势 SALARY TRENDS
                  </h4>
                  <p className="text-2xl font-black text-slate-900">
                    典型年薪 Typical Salary: <span className="text-indigo-600">{insights.market.salary || 'N/A'}</span>
                  </p>
                </div>
                <div className={`flex flex-col items-end gap-1 px-6 py-3 rounded-2xl font-black text-sm border-2 transition-colors ${isPositiveTrend ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-rose-50 border-rose-100 text-rose-600'}`}>
                  <div className="flex items-center gap-2">
                    {isPositiveTrend ? <TrendingUp size={20}/> : <TrendingDown size={20}/>}
                    同期增长 {insights.market.pct || '0%'}
                  </div>
                  <span className="text-[9px] opacity-60 uppercase tracking-widest">Year-on-Year Growth</span>
                </div>
              </div>

              {/* 趋势图 - 防御性修复 Math.max */}
              <div className="flex items-end justify-between h-56 px-4 border-b border-slate-100 pb-4 gap-3">
                 {(insights.market.history || []).map((h: any, i: number) => {
                   const maxVal = Math.max(...(insights.market.history?.map((x: any) => x.v) || [100]));
                   const barHeight = maxVal > 0 ? (h.v / maxVal) * 100 : 0;
                   return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-3 group">
                        <div className="w-full bg-slate-50 rounded-t-2xl group-hover:bg-indigo-600 transition-all relative" style={{ height: `${barHeight}%` }}>
                          <div className="absolute -top-14 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[11px] px-4 py-2 rounded-2xl font-black whitespace-nowrap shadow-2xl z-20">
                            ${h.v}k
                          </div>
                        </div>
                        <div className="flex flex-col items-center">
                          <span className="text-[11px] font-black text-slate-800">{h.m_cn}</span>
                          <span className="text-[9px] font-bold text-slate-300 uppercase">{h.m_en}</span>
                        </div>
                    </div>
                   );
                 })}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
                {(insights.market.demand || []).map((d: any, i: number) => (
                  <div key={i} className="p-8 bg-slate-50 rounded-[3rem] border border-slate-100 space-y-5 hover:bg-white hover:shadow-2xl transition-all group border-l-8 border-l-transparent hover:border-l-indigo-600">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-black text-slate-800 text-xl block leading-tight">{d.cat_cn}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{d.cat_en}</span>
                      </div>
                      <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-white px-3 py-1.5 rounded-xl shadow-sm border border-slate-100">热度 {d.lv}/10</span>
                    </div>
                    <div className="h-2 bg-white rounded-full overflow-hidden border border-slate-100">
                       <div className="h-full bg-indigo-500" style={{ width: `${d.lv * 10}%` }} />
                    </div>
                    <p className="text-sm text-slate-500 font-bold leading-relaxed italic">
                      “{d.rate_cn}”
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* 新闻与政策 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               <section className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-10">
                  <div className="flex items-center gap-3">
                    <div className="bg-indigo-50 p-2 rounded-xl text-indigo-600"><FileText size={20}/></div>
                    <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                      最新动态 LATEST UPDATES
                    </h4>
                  </div>
                  <div className="space-y-10">
                    {(insights.news || []).map((n: any, i: number) => (
                      <a 
                        key={i} 
                        href={n.url || '#'} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="block space-y-3 group hover:bg-slate-50 p-4 -mx-4 rounded-3xl transition-all"
                      >
                         <div className="space-y-1">
                           <div className="font-black text-slate-900 text-xl leading-snug group-hover:text-indigo-600 transition-colors">{n.t_cn}</div>
                           <div className="text-sm font-bold text-slate-400 leading-snug italic">{n.t_en}</div>
                         </div>
                         <div className="flex flex-col gap-1">
                           <div className="text-xs text-slate-500 font-bold">{n.source_cn} / {n.source_en}</div>
                           <div className="text-[10px] text-slate-300 font-black tracking-widest uppercase">{n.d}</div>
                         </div>
                         <div className="pt-2 flex items-center gap-2 text-[10px] font-black text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity">
                            阅读详情 READ MORE <ArrowUpRight size={14} />
                         </div>
                      </a>
                    ))}
                  </div>
               </section>

               <section className="bg-slate-900 p-10 rounded-[3.5rem] text-white shadow-2xl space-y-10">
                  <div className="flex items-center gap-3">
                    <div className="bg-white/10 p-2 rounded-xl text-indigo-400"><Key size={20}/></div>
                    <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest">
                      签证政策 VISA & POLICY
                    </h4>
                  </div>
                  <div className="space-y-6">
                    {(insights.visa || []).map((v: any, i: number) => (
                      <div key={i} className="p-8 bg-white/5 rounded-[2.5rem] border border-white/10 space-y-6 hover:bg-white/10 transition-all">
                         <div className="flex justify-between items-start gap-4">
                           <div className="space-y-1">
                             <div className="font-black text-indigo-400 text-lg leading-tight">{v.type_cn}</div>
                             <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{v.type_en}</div>
                           </div>
                           <span className="text-[10px] text-slate-500 font-black shrink-0">{v.date}</span>
                         </div>
                         <div className="space-y-2">
                           <p className="text-sm text-slate-300 font-bold leading-relaxed">{v.change_cn}</p>
                           <p className="text-[11px] text-slate-500 font-medium italic leading-relaxed border-l border-white/10 pl-3">{v.change_en}</p>
                         </div>
                      </div>
                    ))}
                  </div>
               </section>
            </div>
          </div>

          {/* 侧边栏 */}
          <div className="lg:col-span-4 space-y-10">
            <section className="bg-white p-10 rounded-[4rem] border border-slate-100 shadow-sm space-y-8">
               <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
                 <Globe className="text-indigo-600" size={24} /> 信息源 Sources
               </h3>
               <div className="space-y-4">
                 {(insights.sources || []).map((s: any, i: number) => (
                   <a 
                    key={i} 
                    href={s.u || '#'} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex items-center justify-between p-6 bg-slate-50 rounded-[2rem] border border-slate-100 group hover:border-indigo-200 hover:bg-white transition-all shadow-sm"
                   >
                     <div className="overflow-hidden space-y-1">
                       <div className="text-sm font-black text-slate-800 truncate">{s.t_cn}</div>
                       <div className="text-[9px] text-slate-400 font-bold truncate uppercase">{s.t_en}</div>
                     </div>
                     <ExternalLink size={16} className="text-slate-300 group-hover:text-indigo-500 shrink-0" />
                   </a>
                 ))}
               </div>
            </section>

            <div className="bg-indigo-600 p-12 rounded-[4rem] text-white shadow-2xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform"><Zap size={150} /></div>
               <h3 className="text-2xl font-black mb-6 relative z-10 flex items-center gap-4">
                 <History size={24} className="text-indigo-200" /> AI 投递建议
               </h3>
               <div className="space-y-6 relative z-10">
                  <div className="bg-white/10 p-8 rounded-[2.5rem] border border-white/10 text-sm leading-relaxed italic text-indigo-50 font-medium">
                    “根据最新的 {selectedCountry} 签证变动与薪资涨幅，当前是投递 {insights.market.demand?.[0]?.cat_cn || '热门'} 岗位的黄金期。建议在简历中突出对于 {selectedCountry} 本地化合规的理解，并重点关注政策中提到的语言等级要求。”
                  </div>
                  <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-indigo-200">
                    <CheckCircle2 size={16} className="text-emerald-400" /> 已根据 2024-2025 官方指南校准
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GlobalCareerView;
