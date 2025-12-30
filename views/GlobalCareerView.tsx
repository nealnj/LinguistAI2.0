
import React, { useState, useEffect } from 'react';
import { generateGlobalInsights } from '../services/geminiService';
import { 
  Globe, 
  TrendingUp, 
  MapPin, 
  Briefcase, 
  ShieldCheck, 
  ExternalLink, 
  Loader2, 
  AlertCircle,
  BarChart3,
  DollarSign,
  PieChart,
  Target,
  Search
} from 'lucide-react';

const COUNTRIES = [
  { id: 'USA', label: 'United States', flag: '🇺🇸' },
  { id: 'UK', label: 'United Kingdom', flag: '🇬🇧' },
  { id: 'Australia', label: 'Australia', flag: '🇦🇺' },
  { id: 'Singapore', label: 'Singapore', flag: '🇸🇬' },
  { id: 'Germany', label: 'Germany', flag: '🇩🇪' },
  { id: 'Canada', label: 'Canada', flag: '🇨🇦' }
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
      setError("Failed to load career insights. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, [selectedCountry]);

  // Handle errors and safety checks
  const marketHistory = insights?.market?.history || [];
  const demandList = insights?.demand || [];
  const newsList = insights?.news || [];
  const visaList = insights?.visa || [];
  const sourceList = insights?.sources || [];

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700 pb-20">
      <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 rounded-[3.5rem] p-12 text-white relative overflow-hidden shadow-2xl">
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-12">
          <div className="space-y-6 max-w-2xl">
            <div className="flex items-center gap-3">
              <div className="bg-white/10 px-4 py-1.5 rounded-full backdrop-blur-md text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 border border-white/5">
                <Globe size={14} className="text-indigo-400" /> Global Talent Mobility
              </div>
            </div>
            <h1 className="text-5xl font-black tracking-tighter leading-tight">全球职业发展趋势</h1>
            <p className="text-slate-400 font-medium text-lg leading-relaxed">
              实时追踪全球各大主流就业市场的薪资波动、热门岗位需求及签证政策，为您的职业全球化提供决策支持。
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {COUNTRIES.map(c => (
              <button 
                key={c.id} 
                onClick={() => setSelectedCountry(c.id)}
                className={`px-6 py-4 rounded-2xl flex items-center gap-3 font-black text-xs transition-all border ${
                  selectedCountry === c.id ? 'bg-white text-slate-900 shadow-xl border-white' : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10'
                }`}
              >
                <span>{c.flag}</span> {c.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="h-96 flex flex-col items-center justify-center gap-6">
          <Loader2 className="animate-spin text-indigo-600" size={48} />
          <p className="text-slate-500 font-black uppercase tracking-widest text-sm animate-pulse">正在从全球数据源同步实时洞察...</p>
        </div>
      ) : error ? (
        <div className="bg-white rounded-[3rem] p-20 border border-slate-100 text-center space-y-4 shadow-sm">
          <AlertCircle className="text-rose-500 mx-auto" size={48} />
          <p className="text-slate-800 font-black text-xl">{error}</p>
          <button onClick={fetchInsights} className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold">重试</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-8 space-y-10">
            {/* Market Overview */}
            <section className="bg-white p-12 rounded-[3rem] border border-slate-100 shadow-sm space-y-10">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3"><TrendingUp className="text-indigo-600" /> 市场概况 Market Overview</h3>
                <div className="px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest">Live Updates</div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 space-y-4">
                  <div className="flex items-center gap-3 text-slate-400 font-black text-[10px] uppercase tracking-widest"><DollarSign size={14}/> 平均年起薪 (Median)</div>
                  <div className="text-5xl font-black text-slate-900 tracking-tighter">{insights?.market?.salary || 'N/A'}</div>
                  <div className={`flex items-center gap-2 text-sm font-bold ${insights?.market?.pct?.startsWith('+') ? 'text-emerald-500' : 'text-slate-400'}`}>
                    <TrendingUp size={16} /> 较去年同期 {insights?.market?.pct || '0%'}
                  </div>
                </div>
                <div className="space-y-6 flex flex-col justify-center">
                  <p className="text-slate-500 leading-relaxed font-medium italic">“当前的宏观经济环境导致在该地区对复合型人才的需求激增，特别是具备 AI 应用能力的专业人士。”</p>
                  <div className="flex gap-2">
                    {marketHistory.map((h: any, i: number) => (
                      <div key={i} className="flex-1 h-20 bg-indigo-50 rounded-xl relative group">
                        <div className="absolute bottom-0 left-0 right-0 bg-indigo-500 rounded-xl transition-all" style={{ height: `${h.value}%` }} />
                        <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[8px] font-black text-slate-400 opacity-0 group-hover:opacity-100">{h.year}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* High Demand Roles */}
            <section className="bg-white p-12 rounded-[3rem] border border-slate-100 shadow-sm space-y-8">
              <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3"><Target className="text-rose-500" /> 高需求职位 In-Demand Roles</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {demandList.map((role: any, i: number) => (
                  <div key={i} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between group hover:border-indigo-200 hover:bg-indigo-50 transition-all">
                    <div className="space-y-1">
                      <div className="font-black text-slate-800 text-lg group-hover:text-indigo-600">{role.title}</div>
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{role.growth} Growth Rate</div>
                    </div>
                    <Briefcase className="text-slate-200 group-hover:text-indigo-400 transition-colors" size={24} />
                  </div>
                ))}
              </div>
            </section>

            {/* News grounding */}
            {sourceList.length > 0 && (
              <section className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 space-y-6">
                 <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Search size={14} /> 数据源与参考 Grounding Sources</h4>
                 <div className="flex flex-wrap gap-4">
                   {sourceList.map((source: any, i: number) => (
                     <a 
                       key={i} 
                       href={source.web?.uri} 
                       target="_blank" 
                       rel="noopener noreferrer"
                       className="px-4 py-2 bg-white rounded-xl border border-slate-200 text-[10px] font-bold text-indigo-600 hover:shadow-md transition-all flex items-center gap-2"
                     >
                       <ExternalLink size={12} /> {source.web?.title || 'External Source'}
                     </a>
                   ))}
                 </div>
              </section>
            )}
          </div>

          <div className="lg:col-span-4 space-y-10">
            {/* Policy Updates */}
            <section className="bg-indigo-600 p-10 rounded-[3rem] text-white shadow-xl space-y-8 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform"><ShieldCheck size={120} /></div>
              <h3 className="text-xl font-black flex items-center gap-3 relative z-10"><MapPin size={24} /> 签证与移民政策</h3>
              <div className="space-y-4 relative z-10">
                {visaList.map((v: any, i: number) => (
                  <div key={i} className="p-6 bg-white/10 rounded-2xl border border-white/10 space-y-2">
                    <div className="font-black text-sm">{v.title}</div>
                    <p className="text-[11px] text-indigo-200 leading-relaxed italic">{v.description}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Local News */}
            <section className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-8">
              <h3 className="text-xl font-black text-slate-800 flex items-center gap-3"><BarChart3 className="text-amber-500" /> 职场资讯</h3>
              <div className="space-y-6">
                {newsList.map((n: any, i: number) => (
                  <div key={i} className="space-y-2">
                    <div className="text-sm font-black text-slate-800 leading-snug">{n.title}</div>
                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">{n.summary}</p>
                    <div className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest">{n.date}</div>
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
