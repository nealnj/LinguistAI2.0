
import React, { useState, useEffect, useCallback } from 'react';
import { generateVisionTrends, analyzeVisionItem } from '../services/geminiService';
import { 
  Newspaper, 
  Music, 
  Film, 
  Sparkles, 
  ExternalLink, 
  Zap, 
  RefreshCcw, 
  Activity, 
  ChevronRight, 
  ArrowUpRight,
  TrendingUp,
  Globe,
  Headphones,
  Tv,
  Info,
  CheckCircle2,
  Bookmark,
  AlertTriangle,
  Radio,
  ArrowLeft,
  BookOpen,
  Search,
  MessageSquare,
  Layers,
  Layout,
  Star,
  Loader2,
  Scan,
  Radar
} from 'lucide-react';

const VisionView: React.FC = () => {
  const [trends, setTrends] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'news' | 'songs' | 'movies'>('news');
  
  // 深度解析相关状态
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await generateVisionTrends();
      // 验证数据完整性
      if (data && (data.news?.length || data.songs?.length || data.movies?.length)) {
        setTrends(data);
      } else {
        throw new Error("EMPTY_DATA");
      }
    } catch (e: any) {
      console.error("Vision Fetch Error:", e);
      setError('无法获取当前全球趋势。可能是由于网络限制或搜索 API 暂时不可用。');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDeepDive = async (item: any, type: 'news' | 'song' | 'movie') => {
    const topic = type === 'news' ? item.t_en : type === 'song' ? `${item.name_en} by ${item.artist}` : item.title_en;
    setSelectedItem({ ...item, type });
    setAnalyzing(true);
    setAnalysis(null);
    try {
      const data = await analyzeVisionItem(topic, type);
      if (data && data.article_en) {
        setAnalysis(data);
      } else {
        throw new Error("EMPTY_DATA");
      }
    } catch (e) {
      console.error("Analysis Error:", e);
      setError("深度解析失败，请检查网络连接或稍后重试。");
      setSelectedItem(null);
    } finally {
      setAnalyzing(false);
    }
  };

  const closeAnalysis = () => {
    setSelectedItem(null);
    setAnalysis(null);
  };

  // 渲染扫描动画 (局部)
  const renderScanningState = () => (
    <div className="w-full bg-white rounded-[4rem] p-32 border border-slate-100 flex flex-col items-center justify-center gap-8 shadow-sm animate-in fade-in duration-500">
      <div className="relative">
         <div className="w-32 h-32 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
         <Radar className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-400 animate-pulse" size={48} />
         <div className="absolute -inset-8 border border-indigo-100 rounded-full animate-ping opacity-20" />
      </div>
      <div className="text-center space-y-3">
        <h3 className="text-3xl font-black text-slate-800 tracking-tighter">正在扫描全球脉动...</h3>
        <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px]">AI IS CONNECTING TO GLOBAL SOURCES IN REAL-TIME</p>
      </div>
    </div>
  );

  // 深度解析解析中状态
  if (selectedItem && analyzing) {
    return (
      <div className="max-w-7xl mx-auto space-y-10 pb-20 animate-in slide-in-from-right duration-500">
        <button onClick={closeAnalysis} className="flex items-center gap-3 text-slate-400 hover:text-slate-800 font-black text-xs uppercase tracking-[0.2em] transition-all group">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> 返回趋势发现
        </button>
        <div className="bg-white rounded-[4rem] p-32 border border-slate-100 flex flex-col items-center justify-center gap-8 shadow-sm">
           <div className="relative">
             <div className="w-24 h-24 border-8 border-indigo-50 border-t-indigo-600 rounded-full animate-spin"></div>
             <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-400" />
           </div>
           <div className="text-center space-y-4 max-w-md">
             <p className="text-slate-800 font-black text-2xl tracking-tight">AI 正在进行“四维逻辑”深度拆解...</p>
             <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-600 animate-[shimmer_2s_infinite] w-full origin-left" />
             </div>
             <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest leading-relaxed">
               Step 1: Contextual Search <br/>
               Step 2: Vocabulary Extraction <br/>
               Step 3: Syntactic Mapping
             </p>
           </div>
        </div>
      </div>
    );
  }

  // 深度解析完成视图
  if (selectedItem && analysis) {
    return (
      <div className="max-w-7xl mx-auto space-y-10 pb-20 animate-in slide-in-from-right duration-500">
        <button onClick={closeAnalysis} className="flex items-center gap-3 text-slate-400 hover:text-slate-800 font-black text-xs uppercase tracking-[0.2em] transition-all group">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> 返回趋势发现
        </button>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* 左侧：文章内容 */}
          <div className="lg:col-span-7 space-y-10">
            <section className="bg-white p-12 md:p-16 rounded-[4rem] border border-slate-100 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                 {selectedItem.type === 'news' ? <Newspaper size={300} /> : selectedItem.type === 'song' ? <Music size={300} /> : <Film size={300} />}
              </div>
              <header className="space-y-6 mb-12 relative z-10">
                <div className="bg-indigo-600 text-white px-5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest w-fit shadow-lg shadow-indigo-100 flex items-center gap-2">
                  <Zap size={14} className="text-amber-400" /> AI Masterpiece Learning
                </div>
                <h1 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tighter leading-tight">
                  {selectedItem.t_en || selectedItem.name_en || selectedItem.title_en}
                </h1>
              </header>

              <div className="space-y-12 relative z-10">
                <div className="prose prose-slate max-w-none">
                  <p className="text-2xl text-slate-700 leading-[2] font-medium selection:bg-indigo-100 whitespace-pre-line first-letter:text-7xl first-letter:font-black first-letter:mr-3 first-letter:float-left first-letter:text-indigo-600">
                    {analysis.article_en}
                  </p>
                </div>
                <div className="p-10 bg-slate-50 rounded-[3rem] border border-slate-100 border-l-8 border-l-indigo-600">
                  <p className="text-lg text-slate-500 font-bold leading-relaxed italic">
                    “{analysis.article_cn}”
                  </p>
                </div>
              </div>
            </section>

            {/* 高级句式剖析 */}
            <section className="space-y-8">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3">
                <Layers size={18} className="text-indigo-600" /> 高级句式透视 ADVANCED STRUCTURES
              </h3>
              <div className="grid grid-cols-1 gap-6">
                {analysis.structures?.map((s: any, i: number) => (
                  <div key={i} className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-xl space-y-6 group">
                     <div className="flex justify-between items-center">
                       <span className="bg-indigo-500 text-[10px] font-black px-4 py-1 rounded-full uppercase">Structure {i+1}</span>
                       <Star className="text-amber-400" size={16} />
                     </div>
                     <p className="text-xl font-black italic">"{s.s}"</p>
                     <div className="p-6 bg-white/5 rounded-2xl border border-white/10 space-y-3">
                       <p className="text-xs text-indigo-300 font-black flex items-center gap-2"><Layout size={14}/> 逻辑详解 LOGIC</p>
                       <p className="text-sm text-slate-400 font-medium leading-relaxed">{s.logic}</p>
                     </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* 右侧：拆解项 */}
          <div className="lg:col-span-5 space-y-10">
            {/* 核心词汇 */}
            <section className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-8">
              <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
                <BookOpen className="text-indigo-600" /> 核心词汇 Vocabulary
              </h3>
              <div className="space-y-4">
                {analysis.vocab?.map((v: any, i: number) => (
                  <div key={i} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-indigo-100 hover:bg-white transition-all">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-lg font-black text-slate-800 group-hover:text-indigo-600">{v.w}</span>
                      <span className="text-[10px] font-black text-slate-300 uppercase">{v.t}</span>
                    </div>
                    <p className="text-xs text-slate-400 italic">Example: {v.e}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* 地道搭配与常用表述 */}
            <section className="bg-indigo-50 p-10 rounded-[3.5rem] border border-indigo-100 space-y-8 shadow-sm">
              <h3 className="text-xl font-black text-indigo-900 flex items-center gap-3">
                <TrendingUp className="text-indigo-600" /> 语感加成 Boosters
              </h3>
              <div className="space-y-6">
                {analysis.collocations?.map((c: any, i: number) => (
                  <div key={i} className="space-y-2">
                     <div className="flex items-center gap-3">
                       <div className="w-2 h-2 rounded-full bg-indigo-500" />
                       <span className="font-black text-indigo-950 text-sm">{c.phrase}</span>
                     </div>
                     <div className="ml-5 p-4 bg-white/50 rounded-xl text-xs text-indigo-600 font-bold leading-relaxed border border-indigo-100/50">
                       {c.meaning} | <span className="opacity-60 italic">{c.usage}</span>
                     </div>
                  </div>
                ))}
              </div>
              <div className="pt-6 border-t border-indigo-200/50 space-y-6">
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">常用职业表述 Common Expressions</p>
                {analysis.expressions?.map((e: any, i: number) => (
                  <div key={i} className="bg-white p-6 rounded-[2rem] border border-indigo-100 shadow-sm space-y-2">
                    <span className="text-sm font-black text-slate-800 block">“{e.exp}”</span>
                    <p className="text-[11px] text-slate-500 font-medium">{e.meaning}</p>
                    <div className="text-[9px] text-indigo-400 font-black uppercase tracking-widest">Context: {e.context}</div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-20 animate-in fade-in duration-700">
      {/* 顶部横幅 */}
      <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 rounded-[3.5rem] p-12 text-white relative overflow-hidden shadow-2xl">
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-12">
          <div className="space-y-6 max-w-2xl text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start gap-3">
              <div className="bg-white/10 px-4 py-1.5 rounded-full backdrop-blur-md text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 border border-white/5">
                <Sparkles size={14} className="text-amber-400" /> 实时全球趋势 AI VISION
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl font-black tracking-tighter leading-tight">
              AI 寰宇视野 <br/>
              <span className="text-indigo-400">洞悉全球最热学材</span>
            </h1>
            <p className="text-slate-400 font-medium text-lg leading-relaxed">
              跳出教科书！实时追踪并 **深度解析** 当前最具影响力的英文资讯、歌曲和光影世界，不再只是看，而是学会。
            </p>
          </div>
          <div className="flex flex-col bg-white/5 p-8 rounded-[3rem] border border-white/10 backdrop-blur-xl space-y-6 min-w-[320px]">
             <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
               <span>当前扫描状态</span>
               <span className={`flex items-center gap-1 transition-colors ${loading ? 'text-amber-400' : 'text-emerald-400'}`}>
                 {loading ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12}/>}
                 {loading ? '全网同步中...' : '实时同步中'}
               </span>
             </div>
             <div className="grid grid-cols-1 gap-3">
               <button 
                 onClick={() => setActiveTab('news')}
                 className={`px-6 py-4 rounded-2xl flex items-center gap-4 font-black text-sm transition-all ${activeTab === 'news' ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-400 hover:text-white'}`}
               >
                 <Newspaper size={20}/> 全球资讯 NEWS
               </button>
               <button 
                 onClick={() => setActiveTab('songs')}
                 className={`px-6 py-4 rounded-2xl flex items-center gap-4 font-black text-sm transition-all ${activeTab === 'songs' ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-400 hover:text-white'}`}
               >
                 <Headphones size={20}/> 流行乐曲 SONGS
               </button>
               <button 
                 onClick={() => setActiveTab('movies')}
                 className={`px-6 py-4 rounded-2xl flex items-center gap-4 font-black text-sm transition-all ${activeTab === 'movies' ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-400 hover:text-white'}`}
               >
                 <Tv size={20}/> 光影影视 MOVIES
               </button>
             </div>
          </div>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="min-h-[600px] relative">
        {loading ? (
          renderScanningState()
        ) : error ? (
          <div className="bg-white rounded-[4rem] p-24 border border-slate-100 text-center space-y-6 shadow-sm animate-in zoom-in-95 duration-500">
             <div className="bg-rose-100 w-20 h-20 rounded-full flex items-center justify-center text-rose-600 mx-auto">
               <AlertTriangle size={40} />
             </div>
             <p className="text-slate-800 font-black text-xl">{error}</p>
             <button onClick={fetchData} className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black flex items-center gap-2 mx-auto hover:bg-slate-900 transition-all shadow-xl shadow-indigo-100"><RefreshCcw size={20}/> 重试扫描</button>
          </div>
        ) : trends ? (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {activeTab === 'news' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {trends.news?.map((n: any, i: number) => (
                  <div key={i} className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm hover:shadow-2xl transition-all group relative overflow-hidden flex flex-col h-full animate-in zoom-in-95" style={{ animationDelay: `${i * 100}ms` }}>
                    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform"><Newspaper size={120} /></div>
                    <div className="relative z-10 flex-1 space-y-6">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Global Headline</span>
                        <TrendingUp size={16} className="text-emerald-500" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-slate-800 leading-tight mb-2 group-hover:text-indigo-600 transition-colors">{n.t_en}</h3>
                        <h4 className="text-lg font-bold text-slate-400 italic">{n.t_cn}</h4>
                      </div>
                      <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 space-y-3">
                        <p className="text-sm text-slate-600 leading-relaxed font-medium">{n.s_en}</p>
                        <p className="text-xs text-slate-400 border-t border-slate-200/50 pt-3">{n.s_cn}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                         {n.keywords?.map((k: string, j: number) => (
                           <span key={j} className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded-lg border border-indigo-100">#{k}</span>
                         ))}
                      </div>
                    </div>
                    <button 
                      onClick={() => handleDeepDive(n, 'news')}
                      className="mt-8 py-5 w-full bg-slate-900 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-indigo-600 transition-all shadow-lg active:scale-95"
                    >
                      AI 深度解析 DEEP DIVE <ArrowUpRight size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'songs' && (
               <div className="space-y-8">
                 {trends.songs?.map((s: any, i: number) => (
                   <div key={i} className="bg-white rounded-[4rem] p-12 border border-slate-100 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-12 group animate-in slide-in-from-left-8" style={{ animationDelay: `${i * 150}ms` }}>
                     <div className="lg:col-span-4 flex flex-col justify-center text-center lg:text-left space-y-6">
                        <div className="bg-rose-50 w-24 h-24 rounded-[2.5rem] flex items-center justify-center text-rose-600 mx-auto lg:mx-0 shadow-lg group-hover:rotate-12 transition-transform">
                          <Music size={48} />
                        </div>
                        <div>
                          <h3 className="text-4xl font-black text-slate-800 tracking-tighter">{s.name_en}</h3>
                          <p className="text-xl font-bold text-rose-500">{s.name_cn}</p>
                          <p className="text-slate-400 font-black uppercase text-[10px] tracking-[0.3em] mt-3">{s.artist}</p>
                        </div>
                     </div>
                     <div className="lg:col-span-8 space-y-8 flex flex-col">
                        <div className="p-10 bg-slate-900 rounded-[3rem] text-white relative overflow-hidden flex-1">
                           <div className="absolute top-0 right-0 p-8 opacity-10"><TrendingUp size={100} /></div>
                           <h5 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-6">核心歌词剖析 (LYRICS CLIP)</h5>
                           <p className="text-2xl font-black leading-tight italic mb-4">“{s.lyrics_clip_en}”</p>
                           <p className="text-sm text-slate-400 border-l-4 border-indigo-500 pl-4">{s.lyrics_clip_cn}</p>
                        </div>
                        <button 
                          onClick={() => handleDeepDive(s, 'song')}
                          className="w-full py-6 bg-indigo-600 text-white rounded-3xl font-black text-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95"
                        >
                          <Headphones size={24} /> 开启沉浸式歌曲解析
                        </button>
                     </div>
                   </div>
                 ))}
               </div>
            )}

            {activeTab === 'movies' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {trends.movies?.map((m: any, i: number) => (
                  <div key={i} className="bg-white rounded-[4rem] p-12 border border-slate-100 shadow-sm hover:shadow-2xl transition-all space-y-8 flex flex-col animate-in slide-in-from-right-8" style={{ animationDelay: `${i * 200}ms` }}>
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <h3 className="text-4xl font-black text-slate-800 tracking-tighter">{m.title_en}</h3>
                        <h4 className="text-xl font-bold text-indigo-600 italic">{m.title_cn}</h4>
                      </div>
                      <div className="px-5 py-2 bg-slate-900 text-white rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                         <Radio size={14} className="text-indigo-400" /> {m.accent} Accent
                      </div>
                    </div>
                    <div className="p-8 bg-slate-50 rounded-[3rem] border border-slate-100 flex-1 space-y-4">
                      <p className="text-slate-700 font-medium leading-relaxed italic">“{m.desc_en}”</p>
                      <p className="text-xs text-slate-400 border-t border-slate-200/50 pt-4 leading-relaxed">{m.desc_cn}</p>
                    </div>
                    <button 
                      onClick={() => handleDeepDive(m, 'movie')}
                      className="w-full py-6 bg-slate-900 text-white rounded-3xl font-black text-lg hover:bg-indigo-600 transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95"
                    >
                      <Tv size={24} /> 开启影评学案解析
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-[4rem] p-24 border border-slate-100 text-center space-y-6 shadow-sm">
             <div className="bg-indigo-50 w-20 h-20 rounded-full flex items-center justify-center text-indigo-600 mx-auto">
               <Search size={40} />
             </div>
             <p className="text-slate-800 font-black text-xl">暂无趋势数据，请点击刷新</p>
             <button onClick={fetchData} className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black flex items-center gap-2 mx-auto"><RefreshCcw size={20}/> 刷新数据</button>
          </div>
        )}
      </div>

      {/* 底部备注 */}
      <div className="bg-slate-50 p-10 rounded-[3rem] border border-slate-100 text-center space-y-4">
        <div className="flex items-center justify-center gap-3 text-slate-400 font-black text-[10px] uppercase tracking-widest">
           <Info size={18} /> 智能学案生成说明
        </div>
        <p className="text-xs text-slate-500 max-w-2xl mx-auto font-medium leading-relaxed italic">
          AI VISION 不再只是简单的链接聚合。当我们点击“深度解析”时，AI 会实时检索并构建一份基于该话题的“大师级学案”，涵盖从单词到高阶句式的全方位讲解。数据每 6 小时同步一次，确保学习素材永远新鲜。
        </p>
      </div>
    </div>
  );
};

export default VisionView;
