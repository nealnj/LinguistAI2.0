
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
  Radar,
  Link
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
      setError('无法获取当前全球趋势。AI 已降级为静态内容。请检查网络或稍后刷新。');
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
        <h3 className="text-3xl font-black text-slate-800 tracking-tighter">AI 爬虫正在检索全球动态...</h3>
        <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px]">CRAWLING REAL-TIME DATA FROM MULTIPLE GLOBAL SOURCES</p>
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
             <p className="text-slate-800 font-black text-2xl tracking-tight">AI 正在进行内容爬取与逻辑解构...</p>
             <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-600 animate-[shimmer_2s_infinite] w-full origin-left" />
             </div>
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
          <div className="lg:col-span-7 space-y-10">
            <section className="bg-white p-12 md:p-16 rounded-[4rem] border border-slate-100 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                 {selectedItem.type === 'news' ? <Newspaper size={300} /> : selectedItem.type === 'song' ? <Music size={300} /> : <Film size={300} />}
              </div>
              <header className="space-y-6 mb-12 relative z-10">
                <div className="bg-indigo-600 text-white px-5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest w-fit shadow-lg shadow-indigo-100 flex items-center gap-2">
                  <Zap size={14} className="text-amber-400" /> Crawler Insight
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
          </div>

          <div className="lg:col-span-5 space-y-10">
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
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-20 animate-in fade-in duration-700">
      <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 rounded-[3.5rem] p-12 text-white relative overflow-hidden shadow-2xl">
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-12">
          <div className="space-y-6 max-w-2xl text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start gap-3">
              <div className="bg-white/10 px-4 py-1.5 rounded-full backdrop-blur-md text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 border border-white/5">
                <Sparkles size={14} className="text-amber-400" /> AI 实时抓取视野
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl font-black tracking-tighter leading-tight">
              寰宇视野 <br/>
              <span className="text-indigo-400">实时爬取全球趋势</span>
            </h1>
            <p className="text-slate-400 font-medium text-lg leading-relaxed">
              跳出教科书！系统已为您连接全球数据源，实时爬取最热门的新闻、乐曲与影视，打造极致新鲜的学材。
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 min-w-[320px]">
            {['news', 'songs', 'movies'].map(tab => (
              <button 
                key={tab} 
                onClick={() => setActiveTab(tab as any)}
                className={`px-6 py-4 rounded-2xl flex items-center gap-4 font-black text-sm transition-all border ${activeTab === tab ? 'bg-white text-slate-900 shadow-xl border-white' : 'bg-white/5 text-slate-400 border-white/5'}`}
              >
                {tab === 'news' ? <Newspaper size={20}/> : tab === 'songs' ? <Headphones size={20}/> : <Tv size={20}/>}
                {tab.toUpperCase()} TRENDS
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="min-h-[400px]">
        {loading ? renderScanningState() : (
          <div className="space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {trends?.[activeTab === 'songs' ? 'songs' : activeTab === 'movies' ? 'movies' : 'news']?.map((item: any, i: number) => (
                <div key={i} className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm hover:shadow-2xl transition-all group flex flex-col h-full animate-in zoom-in-95">
                  <div className="flex-1 space-y-6">
                    <h3 className="text-2xl font-black text-slate-800 leading-tight group-hover:text-indigo-600 transition-colors">
                      {item.t_en || item.name_en || item.title_en}
                    </h3>
                    <p className="text-sm text-slate-500 italic leading-relaxed">
                      {item.s_en || item.desc_en || (item.artist + " - Hot Track")}
                    </p>
                  </div>
                  <button 
                    onClick={() => handleDeepDive(item, activeTab === 'news' ? 'news' : activeTab === 'songs' ? 'song' : 'movie')}
                    className="mt-8 py-5 w-full bg-slate-900 text-white rounded-2xl font-black text-sm hover:bg-indigo-600 transition-all shadow-lg active:scale-95"
                  >
                    实时爬取深度解构 <ArrowUpRight size={16} />
                  </button>
                </div>
              ))}
            </div>

            {/* 爬取来源列表 */}
            {trends?.sources?.length > 0 && (
              <section className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 space-y-6">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Link size={14} /> 爬虫抓取源 CRAWLER SOURCES</h4>
                <div className="flex flex-wrap gap-4">
                  {trends.sources.map((source: any, i: number) => (
                    <a key={i} href={source.web?.uri} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-white rounded-xl border border-slate-200 text-[10px] font-bold text-indigo-600 hover:shadow-md transition-all flex items-center gap-2">
                      <ExternalLink size={12} /> {source.web?.title || 'Data Source'}
                    </a>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VisionView;
