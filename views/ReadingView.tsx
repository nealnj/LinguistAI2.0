
import React, { useState, useEffect, useRef } from 'react';
import { generateReadingArticle, getSpeechAudio } from '../services/geminiService';
import { ReadingArticle, LearningModule } from '../types';
import { logger } from '../services/logger';
import { 
  BookOpen, 
  Loader2, 
  ChevronRight, 
  Volume2, 
  HelpCircle, 
  CheckCircle2, 
  Sparkles,
  Search,
  BookMarked,
  Layers,
  Cpu,
  TrendingUp,
  Leaf,
  Dna,
  Globe,
  Settings,
  PenTool,
  BookmarkPlus,
  StickyNote,
  Trash2,
  ArrowRight,
  Trophy,
  Target,
  Zap,
  Link,
  ExternalLink,
  AlertTriangle
} from 'lucide-react';

const CATEGORIES = [
  { id: 'AI & Future Tech', label: '人工智能', icon: <Cpu size={18} />, color: 'indigo' },
  { id: 'Global Finance', label: '金融科技', icon: <TrendingUp size={18} />, color: 'emerald' },
  { id: 'Green Tech', label: '绿色科技/ESG', icon: <Leaf size={18} />, color: 'teal' },
  { id: 'Bio-Medicine', label: '生物医药', icon: <Dna size={18} />, color: 'rose' },
  { id: 'Digital Marketing', label: '数字营销', icon: <Globe size={18} />, color: 'amber' },
  { id: 'Smart Manufacturing', label: '智能制造', icon: <Settings size={18} />, color: 'slate' },
];

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const ReadingView: React.FC = () => {
  const [viewState, setViewState] = useState<'setup' | 'reading'>('setup');
  const [config, setConfig] = useState({ category: 'AI & Future Tech' });
  const [article, setArticle] = useState<(ReadingArticle & { sources?: any[] }) | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<string | null>(null);
  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [quizFinished, setQuizFinished] = useState(false);
  const [score, setScore] = useState(0);
  const [selection, setSelection] = useState<{ text: string; top: number; left: number } | null>(null);
  const [notes, setNotes] = useState(logger.getNotes().filter(n => n.module === LearningModule.READING));
  
  const progress = logger.getReadingProgress(config.category);
  const audioContextRef = useRef<AudioContext | null>(null);
  const articleRef = useRef<HTMLDivElement>(null);

  const fetchArticle = async () => {
    setLoading(true);
    setError(null);
    setViewState('reading');
    setQuizFinished(false);
    setSelectedAnswer(null);
    setQuizIndex(0);
    setScore(0);
    try {
      const data = await generateReadingArticle(config.category, progress);
      if (!data.content || data.content.length < 10) {
        throw new Error("AI 返回的文章内容不完整，请重新尝试生成。");
      }
      setArticle(data);
      logger.logAction(LearningModule.READING, 'learn', { title: data.title, category: config.category });
      logger.setSpecialization(config.category as any);
    } catch (e: any) { 
      console.error(e); 
      setError(e.message || "由于外部连接超时，无法获取当前题材。");
    } finally { 
      setLoading(false); 
    }
  };

  const handleTextSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.toString().trim().length > 0) {
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setSelection({
        text: sel.toString().trim(),
        top: rect.top + window.scrollY - 40,
        left: rect.left + rect.width / 2
      });
    } else {
      setSelection(null);
    }
  };

  const addWordToVocab = () => {
    if (!selection) return;
    logger.addNote({ text: selection.text, context: article?.title || 'Industry Article', module: LearningModule.READING, tag: 'vocabulary' });
    setNotes(logger.getNotes().filter(n => n.module === LearningModule.READING));
    setSelection(null);
    window.getSelection()?.removeAllRanges();
  };

  const addNote = () => {
    if (!selection) return;
    const comment = prompt('为这段内容添加笔记:');
    if (comment) {
      logger.addNote({ text: selection.text, context: comment, module: LearningModule.READING, tag: 'note' });
      setNotes(logger.getNotes().filter(n => n.module === LearningModule.READING));
    }
    setSelection(null);
    window.getSelection()?.removeAllRanges();
  };

  const playText = async (text: string) => {
    if (isPlaying === text || !text) return;
    setIsPlaying(text);
    try {
      if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') await ctx.resume();
      const base64Audio = await getSpeechAudio(text);
      if (base64Audio) {
        const buffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.onended = () => setIsPlaying(null);
        source.start();
      } else { setIsPlaying(null); }
    } catch (e) { setIsPlaying(null); }
  };

  const handleAnswer = (idx: number) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(idx);
    if (idx === article!.questions[quizIndex].answer) setScore(s => s + 1);
    else logger.logAction(LearningModule.READING, 'mistake', { question: article!.questions[quizIndex].question });
  };

  if (viewState === 'setup') {
    return (
      <div className="max-w-5xl mx-auto py-10 space-y-12 animate-slide-up">
        <div className="text-center space-y-4">
          <div className="bg-indigo-600 w-20 h-20 rounded-[2rem] flex items-center justify-center text-white mx-auto shadow-2xl animate-float"><BookMarked size={40} /></div>
          <h1 className="text-5xl font-black text-slate-800 tracking-tighter">行业演化阅读</h1>
          <p className="text-slate-500 text-lg max-w-2xl mx-auto">基于 AI 实时行业资讯。系统将根据选定行业动态生成具有职业深度的学习素材。</p>
        </div>
        <div className="bg-white rounded-[4rem] p-12 border border-slate-100 shadow-xl space-y-12">
          <section className="space-y-8">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3"><Zap size={16} className="text-amber-500" /> 选择你的职业进化路径</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {CATEGORIES.map(cat => (
                <button key={cat.id} onClick={() => setConfig({ category: cat.id })} className={`group relative p-8 rounded-[2.5rem] border-2 text-left transition-all ${config.category === cat.id ? 'border-indigo-600 bg-indigo-50 shadow-xl scale-105' : 'border-slate-50 hover:border-slate-200'}`}>
                  <div className="flex items-center gap-4 mb-5"><div className={`p-4 rounded-2xl ${config.category === cat.id ? 'bg-indigo-600 text-white rotate-6' : 'bg-slate-100 text-slate-400'}`}>{cat.icon}</div><div><div className="font-black text-slate-800 text-lg">{cat.label}</div><div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{cat.id}</div></div></div>
                </button>
              ))}
            </div>
          </section>
          <button onClick={fetchArticle} className="w-full py-8 bg-slate-900 text-white rounded-[2.5rem] font-black text-2xl hover:bg-indigo-600 shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-4">开启深度进阶阅读 <ArrowRight size={28} /></button>
        </div>
      </div>
    );
  }

  if (loading) return (
    <div className="h-full flex flex-col items-center justify-center gap-8 animate-in fade-in">
      <div className="relative"><div className="w-24 h-24 border-8 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div><Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-amber-400 animate-float" size={32} /></div>
      <div className="text-center space-y-3"><p className="text-slate-800 font-black text-2xl tracking-tight">AI 正在编研专刊...</p><p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">基于 {config.category} 的专属阅读</p></div>
    </div>
  );

  if (error) return (
    <div className="max-w-xl mx-auto py-20 text-center space-y-6">
       <div className="bg-rose-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto text-rose-500"><AlertTriangle size={40} /></div>
       <h3 className="text-2xl font-black text-slate-800">生成中断</h3>
       <p className="text-slate-500 font-medium">{error}</p>
       <button onClick={fetchArticle} className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl">重新生成</button>
       <button onClick={() => setViewState('setup')} className="block mx-auto text-slate-400 text-xs font-bold uppercase">返回选择行业</button>
    </div>
  );

  if (!article) return null;

  return (
    <div className="max-w-[1400px] mx-auto flex flex-col gap-10 pb-20 animate-in fade-in duration-700">
      <div className="flex items-center justify-between bg-white px-10 py-6 rounded-3xl border border-slate-100 shadow-sm">
        <button onClick={() => setViewState('setup')} className="text-xs font-black text-slate-400 hover:text-slate-800 flex items-center gap-2 uppercase tracking-widest"><ChevronRight size={18} className="rotate-180" /> 放弃当前阅读</button>
        <div className="flex items-center gap-6"><div className="flex flex-col items-end"><span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Industry Roadmap Goal</span><span className="text-xs font-bold text-indigo-600">{article.curriculumGoal || 'General Improvement'}</span></div><div className="w-px h-8 bg-slate-100" /><div className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest">Lvl {progress.currentLevel} - {config.category}</div></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start relative">
        <div className="lg:col-span-3 space-y-8 sticky top-8">
          <div className="bg-amber-50 rounded-[2.5rem] p-8 border border-amber-200 shadow-sm space-y-6">
            <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-[0.3em] flex items-center gap-2"><StickyNote size={14} /> 随堂笔记 ({notes.length})</h4>
            <div className="space-y-4 max-h-[600px] overflow-y-auto scrollbar-hide">
              {notes.slice().reverse().map(n => (
                <div key={n.id} className="bg-white p-5 rounded-2xl shadow-sm border border-amber-100 group"><p className="text-sm font-black text-slate-800 mb-1">{n.text}</p><p className="text-xs text-slate-500 italic leading-relaxed">{n.context}</p></div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-6 space-y-8">
          <div className="bg-white rounded-[3.5rem] shadow-2xl p-16 border border-slate-100 relative group" onMouseUp={handleTextSelection}>
            {selection && (
              <div className="absolute z-50 flex gap-2 bg-slate-900 p-2 rounded-2xl shadow-2xl animate-slide-up" style={{ top: selection.top - (articleRef.current?.offsetTop || 0) - 20, left: '50%', transform: 'translateX(-50%)' }}>
                <button onClick={addWordToVocab} className="flex items-center gap-2 px-4 py-2 hover:bg-indigo-600 text-white rounded-xl transition-all"><BookmarkPlus size={16} /> <span className="text-xs font-black">存为生词</span></button>
                <button onClick={addNote} className="flex items-center gap-2 px-4 py-2 hover:bg-amber-500 text-white rounded-xl transition-all"><StickyNote size={16} /> <span className="text-xs font-black">记心得</span></button>
              </div>
            )}
            
            <header className="mb-12 space-y-4">
              <h1 className="text-5xl font-black text-slate-800 tracking-tighter leading-tight">{article.title}</h1>
              <p className="text-slate-400 font-medium text-xl border-l-4 border-indigo-100 pl-6">{article.chineseTitle}</p>
            </header>

            <div className="prose prose-slate max-w-none" ref={articleRef}>
              <p className="text-2xl text-slate-700 leading-[2.1] font-medium selection:bg-indigo-100 whitespace-pre-line first-letter:text-7xl first-letter:font-black first-letter:mr-3 first-letter:float-left first-letter:text-indigo-600">
                {article.content}
              </p>
            </div>

            <div className="mt-16 pt-10 border-t border-slate-50 flex items-center justify-between flex-wrap gap-4">
              <button onClick={() => playText(article.content)} className={`flex items-center gap-3 px-10 py-5 rounded-2xl font-black transition-all shadow-xl ${isPlaying ? 'bg-indigo-600 text-white animate-pulse shadow-indigo-200' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}><Volume2 size={24} /> {isPlaying ? '沉浸听力中...' : '朗读全文'}</button>
            </div>

            {article.sources && article.sources.length > 0 && (
              <div className="mt-8 pt-6 border-t border-slate-50">
                 <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-4"><Link size={14} /> 引用来源 (Sources)</h4>
                 <div className="flex flex-wrap gap-3">
                   {article.sources.map((source: any, i: number) => (
                     <a key={i} href={source.web?.uri} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-100 text-[9px] font-bold text-indigo-600 hover:bg-white hover:shadow-sm transition-all flex items-center gap-2"><ExternalLink size={10} /> {source.web?.title || 'Source'}</a>
                   ))}
                 </div>
              </div>
            )}
          </div>

          <div className="bg-slate-900 rounded-[3.5rem] p-16 text-white shadow-2xl space-y-12">
            <div className="flex justify-between items-center"><h3 className="text-3xl font-black flex items-center gap-4"><div className="p-3 bg-indigo-500 rounded-2xl shadow-lg"><HelpCircle /></div> 行业认知检测</h3><div className="px-4 py-2 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-[0.3em]">Quest {quizIndex + 1} / {article.questions?.length || 0}</div></div>
            {!quizFinished ? (
              <div className="space-y-10 animate-in fade-in">
                <p className="text-2xl font-bold leading-relaxed">{article.questions?.[quizIndex]?.question}</p>
                <div className="grid grid-cols-1 gap-5">
                  {article.questions?.[quizIndex]?.options?.map((opt, i) => (
                    <button key={i} onClick={() => handleAnswer(i)} className={`p-8 rounded-[2rem] border-2 text-left transition-all font-bold flex items-center justify-between text-lg ${selectedAnswer === null ? 'border-white/10 hover:border-indigo-500 hover:bg-white/5' : i === article.questions[quizIndex].answer ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' : i === selectedAnswer ? 'border-rose-500 bg-rose-500/10 text-rose-400' : 'border-white/5 opacity-30 scale-95'}`}><div className="flex items-center gap-6"><div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${selectedAnswer === null ? 'bg-white/10' : 'bg-white/20'}`}>{String.fromCharCode(65 + i)}</div>{opt}</div></button>
                  ))}
                </div>
                {selectedAnswer !== null && (
                  <div className="p-10 bg-white/5 rounded-[2.5rem] border border-white/10 animate-slide-up space-y-6">
                    <p className="text-lg text-slate-300 leading-relaxed italic">“{article.questions?.[quizIndex]?.explanation}”</p>
                    <button onClick={() => { if (quizIndex < article.questions.length - 1) { setQuizIndex(quizIndex + 1); setSelectedAnswer(null); } else setQuizFinished(true); }} className="w-full py-5 bg-white text-slate-900 rounded-2xl font-black hover:bg-indigo-400 hover:text-white transition-all text-xl">继续</button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-16 space-y-10">
                <div className="w-32 h-32 bg-emerald-500 rounded-[3rem] flex items-center justify-center mx-auto shadow-[0_0_50px_rgba(16,185,129,0.3)]"><Trophy size={64} /></div>
                <h2 className="text-5xl font-black">挑战达成! 准确率 {Math.round((score / article.questions.length) * 100)}%</h2>
                <button onClick={() => { logger.updateReadingProgress(config.category, article.title); setViewState('setup'); }} className="px-12 py-6 bg-indigo-600 rounded-[2rem] font-black text-xl">记录进度并返回</button>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-3 space-y-8 sticky top-8">
          <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-xl space-y-10">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3"><BookMarked size={16} className="text-indigo-600" /> 行业核心术语</h4>
            <div className="space-y-6">
              {article.keyWords?.map((kw, i) => (
                <div key={i} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white hover:shadow-xl transition-all cursor-pointer" onClick={() => playText(kw.word)}><span className="text-xl font-black text-slate-800 tracking-tight block mb-2">{kw.word}</span><p className="text-sm text-slate-500 font-bold leading-relaxed">{kw.meaning}</p></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReadingView;
