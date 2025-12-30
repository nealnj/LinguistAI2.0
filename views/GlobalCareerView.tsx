
import React, { useState, useEffect } from 'react';
import { generateGlobalInsights } from '../services/geminiService';
import { 
  Globe, 
  MapPin, 
  Briefcase, 
  ExternalLink, 
  AlertCircle,
  BarChart3,
  Target,
  Link,
  Heart,
  Coins,
  Info,
  ShieldCheck,
  Zap,
  Activity,
  TrendingUp,
  History,
  TrendingDown
} from 'lucide-react';

const COUNTRIES = [
  { id: 'Taiwan', label: '台湾 (Taiwan)', flag: '🇹🇼', tags: ['低生活成本', '极高友好度'] },
  { id: 'Japan', label: '日本 (Japan)', flag: '🇯🇵', tags: ['机会极多', '文化相近'] },
  { id: 'Germany', label: '德国 (Germany)', flag: '🇩🇪', tags: ['工签宽松', '社会公平'] },
  { id: 'Singapore', label: '新加坡 (Singapore)', flag: '🇸🇬', tags: ['双语无碍', '全球枢纽'] },
  { id: 'Canada', label: '加拿大 (Canada)', flag: '🇨🇦', tags: ['移民首选', '多元包容'] },
  { id: 'USA', label: '美国 (USA)', flag: '🇺🇸', tags: ['最高天花板', '竞争激烈'] }
];

const GlobalCareerView: React.FC = () => {
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0].id);
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await generateGlobalInsights(selectedCountry);
      setInsights(data);
    } catch (e) {
      setError("实时数据链路由于请求过载暂时中断，请尝试重试。");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, [selectedCountry]);

  const regions = insights?.regions || [];
  const demandList = insights?.demand || [];
  const visaList = insights?.visa || [];
  const newsList = insights?.news || [];
  const sourceList = insights?.sources || [];
  const evolution = insights?.evolution || [];

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700 pb-20">
      <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 rounded-[3.5rem] p-12 text-white relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-110 transition-transform"><Globe size={300} /></div>
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-12">
          <div className="space-y-6 max-w-2xl text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start gap-3">
              <div className="bg-emerald-500/20 px-4 py-1.5 rounded-full backdrop-blur-md text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 border border-emerald-500/30 text-emerald-400">
                <Activity size={14} /> Live Sync Active
              </div>
              <div className="bg-white/10 px-4 py-1.5 rounded-full backdrop-blur-md text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 border border-white/5">
                <History size={14} className="text-amber-400" /> 24-Month Trend Sync
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl font-black tracking-tighter leading-tight">
              {selectedCountry} 职场版图 <br/>
              <span className="text-indigo-400">实时获取全球演化趋势</span>
            </h1>
            <p className="text-slate-400 font-medium text-lg leading-relaxed">
              同步 2023-2025 全球找工趋势变化。通过智能检索技术，透视 {selectedCountry} 的<br/>
              <span className="text-white font-bold underline decoration-indigo-500 underline-offset-4">职业占比位移、薪酬动能与最新的工签动态</span>。
            </p>
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
                <div className="flex gap-1 overflow-hidden">
                   <span className={`text-[7px] px-1 py-0.5 rounded font-black uppercase ${selectedCountry === c.id ? 'bg-indigo-100 text-indigo-600' : 'bg-white/10 text-slate-500'}`}>{c.tags[0]}</span>
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
          <p className="text-slate-500 font-black uppercase tracking-widest text-sm animate-pulse">正在精细化追溯 {selectedCountry} 过去 24 个月的市场演化...</p>
        </div>
      ) : error ? (
        <div className="bg-white rounded-[3rem] p-20 border border-slate-100 text-center space-y-4 shadow-sm">
          <AlertCircle className="text-rose-500 mx-auto" size={48} />
          <p className="text-slate-800 font-black text-xl">{error}</p>
          <button onClick={fetchInsights} className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold">重新获取</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-8 space-y-10">
            <section className="bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-10 overflow-hidden relative">
              <div className="absolute -top-10 -right-10 opacity-5 pointer-events-none"><TrendingUp size={200} /></div>
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                    <History className="text-indigo-600" /> 职业版图演化 (2023-2025 Evolution)
                  </h3>
                  <p className="text-slate-400 text-xs font-bold mt-1">对比过去 24 个月不同行业的市场需求权重变化</p>
                </div>
                <div className="px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest">2-Year Shift Map</div>
              </div>

              <div className="space-y-6 relative z-10">
                {evolution.length > 0 ? evolution.map((ev: any, i: number) => {
                  const isPositive = !String(ev.shift_pct).includes('-');
                  return (
                    <div key={i} className="space-y-3 p-6 bg-slate-50 rounded-3xl border border-slate-100 group hover:bg-white transition-all hover:shadow-lg">
                      <div className="flex justify-between items-center">
                        <span className="font-black text-slate-700">{ev.sector_cn}</span>
                        <div className={`flex items-center gap-1 font-black text-sm ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                          {ev.shift_pct}
                        </div>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-1000 ${isPositive ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]'}`} 
                          style={{ width: `${Math.abs(parseFloat(ev.shift_pct)) * 3}%` }} 
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 font-bold italic">“{ev.reason_cn}”</p>
                    </div>
                  );
                }) : (
                  <div className="text-center py-10 opacity-30 italic">演化趋势数据正在生成...</div>
                )}
              </div>
            </section>

            <section className="bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-10">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                    <MapPin className="text-indigo-600" /> 区域动力学对比 (Regional Pulse)
                  </h3>
                  <p className="text-slate-400 text-xs font-bold mt-1">对比内部核心城市的找工门槛与生活品质</p>
                </div>
                <div className="px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest">Intra-Country Analysis</div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {regions.map((region: any, i: number) => (
                  <div key={i} className="p-8 bg-slate-50 rounded-[3rem] border border-slate-100 space-y-6 hover:bg-white hover:shadow-2xl hover:border-indigo-100 transition-all group relative">
                    {region.source_link && (
                      <a href={region.source_link} target="_blank" rel="noopener noreferrer" className="absolute top-8 right-8 p-3 bg-white text-slate-300 hover:text-indigo-600 rounded-2xl shadow-sm transition-all">
                        <ExternalLink size={18} />
                      </a>
                    )}
                    <div className="space-y-2">
                      <div className="flex items-baseline gap-3">
                        <h4 className="text-2xl font-black text-slate-800 group-hover:text-indigo-600 transition-colors">{region.name_cn}</h4>
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{region.name_en}</span>
                      </div>
                      <p className="text-[11px] font-bold text-slate-500 leading-relaxed border-l-4 border-indigo-100 pl-4">{region.description_cn}</p>
                      <p className="text-[10px] text-slate-300 italic leading-relaxed pl-5">{region.description_en}</p>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="flex flex-col items-center p-4 bg-white rounded-2xl border border-slate-100">
                         <Briefcase size={16} className="text-blue-500 mb-2" />
                         <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest text-center">找工难度</span>
                         <span className="font-black text-slate-800 text-sm">{region.difficulty}/10</span>
                      </div>
                      <div className="flex flex-col items-center p-4 bg-white rounded-2xl border border-slate-100">
                         <Coins size={16} className="text-amber-500 mb-2" />
                         <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest text-center">成本等级</span>
                         <span className="font-black text-slate-800 text-sm">{region.cost}/10</span>
                      </div>
                      <div className="flex flex-col items-center p-4 bg-white rounded-2xl border border-slate-100">
                         <Heart size={16} className="text-rose-500 mb-2" />
                         <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest text-center">友好度</span>
                         <span className="font-black text-slate-800 text-sm">{region.friendliness}/10</span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-200 space-y-2">
                       <div className="flex items-center gap-2 text-indigo-600 font-black text-[9px] uppercase tracking-widest">
                         <Info size={14} /> Expert Pro Tip / 专家建议
                       </div>
                       <div className="space-y-1">
                        <p className="text-[11px] text-slate-600 font-bold leading-relaxed italic">“{region.proTip_cn}”</p>
                        <p className="text-[9px] text-slate-400 leading-relaxed italic">“{region.proTip_en}”</p>
                       </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-8">
              <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3"><Target className="text-rose-500" /> 该国高需求职缺 (Top Vacancies)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {demandList.map((role: any, i: number) => (
                  <div key={i} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between group hover:border-indigo-200 hover:bg-indigo-50 transition-all">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <span className="font-black text-slate-800 text-lg group-hover:text-indigo-600">{role.title_cn}</span>
                        <span className="text-[10px] text-slate-400 font-black uppercase">{role.title_en}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">预估增长: {role.growth}</span>
                        {role.change_from_2023 && <span className="text-[8px] font-bold text-slate-400">vs 2023: {role.change_from_2023}</span>}
                      </div>
                    </div>
                    {role.source_link ? (
                      <a href={role.source_link} target="_blank" rel="noopener noreferrer" className="p-3 bg-white text-slate-300 group-hover:text-indigo-600 rounded-xl shadow-sm transition-all active:scale-95">
                        <ExternalLink size={20} />
                      </a>
                    ) : (
                      <Briefcase className="text-slate-200 group-hover:text-indigo-400 transition-colors" size={24} />
                    )}
                  </div>
                ))}
              </div>
            </section>

            {sourceList.length > 0 && (
              <section className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 space-y-4">
                 <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Link size={14} /> 实时获取审计 (Source Evidence)</h4>
                 <div className="flex flex-wrap gap-4">
                   {sourceList.map((source: any, i: number) => (
                     <a key={i} href={source.web?.uri} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-white rounded-xl border border-slate-200 text-[10px] font-bold text-indigo-600 hover:shadow-md transition-all flex items-center gap-2">
                       <ExternalLink size={12} /> {source.web?.title || 'External Source'}
                     </a>
                   ))}
                 </div>
              </section>
            )}
          </div>

          <div className="lg:col-span-4 space-y-10">
            <section className="bg-indigo-600 p-10 rounded-[3.5rem] text-white shadow-xl space-y-8 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform"><ShieldCheck size={120} /></div>
              <h3 className="text-xl font-black flex items-center gap-3 relative z-10"><Globe size={24} /> 国家概览 (Overview)</h3>
              <div className="bg-white/10 p-6 rounded-3xl space-y-4 relative z-10 border border-white/10">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-black uppercase text-indigo-200">中位年薪 / Median Salary (2025)</span>
                  <div className="flex justify-between items-baseline">
                    <span className="font-black text-2xl">{insights?.market?.salary_cn || '正在获取...'}</span>
                    <span className="text-[10px] font-bold text-indigo-300">{insights?.market?.salary_en || 'Sync error'}</span>
                  </div>
                </div>
                <div className="h-px bg-white/10" />
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase text-indigo-200 flex items-center gap-2"><TrendingUp size={12} /> 24月趋势总结</span>
                  <p className="text-[11px] leading-relaxed text-indigo-50 italic">“{insights?.market?.trend_2yr_desc || '正在分析中...' }”</p>
                  <p className="text-[9px] text-indigo-300 italic opacity-70">Synthesized from 2-year longitudinal data.</p>
                </div>
              </div>
            </section>

            <section className="bg-slate-900 p-10 rounded-[3.5rem] text-white shadow-xl space-y-8">
              <h3 className="text-xl font-black flex items-center gap-3"><Activity size={24} className="text-emerald-400" /> 最新居留/签证 (Live)</h3>
              <div className="space-y-4">
                {visaList.map((v: any, i: number) => (
                  <div key={i} className="p-6 bg-white/5 rounded-[2rem] border border-white/10 space-y-3 group hover:bg-white/10 transition-all">
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col">
                         <span className="font-black text-sm text-indigo-400 group-hover:text-white transition-colors">{v.title_cn}</span>
                         <span className="text-[9px] text-slate-500 uppercase font-black">{v.title_en}</span>
                      </div>
                      {v.source_link && (
                        <a href={v.source_link} target="_blank" rel="noopener noreferrer" className="p-2 text-slate-500 hover:text-indigo-400 transition-colors">
                          <ExternalLink size={16} />
                        </a>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 font-bold leading-relaxed">{v.description_cn}</p>
                    <p className="text-[9px] text-slate-500 leading-relaxed italic">{v.description_en}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  );
};

export default GlobalCareerView;
