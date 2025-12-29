
import React, { useState, useEffect, useRef } from 'react';
import { generateVocabulary, getSpeechAudio, generateImage } from '../services/geminiService';
import { VocabularyWord, LearningModule } from '../types';
import { 
  Loader2, 
  RefreshCw, 
  Volume2, 
  Check, 
  Sparkles, 
  History, 
  Layers, 
  Lightbulb,
  ChevronRight,
  ChevronLeft,
  Puzzle,
  Zap,
  Link,
  GitBranch,
  Search,
  Calendar,
  Trophy,
  Mic2,
  PenTool,
  BookOpen,
  ArrowRight,
  AlertCircle,
  Quote,
  Eye,
  Info,
  Stars
} from 'lucide-react';

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

const VocabularyView: React.FC<{ onNavigate?: (module: LearningModule) => void }> = ({ onNavigate }) => {
  const [words, setWords] = useState<VocabularyWord[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTab, setActiveTab] = useState<'systematic' | 'memory' | 'info'>('systematic');
  const [audioCache, setAudioCache] = useState<Record<string, AudioBuffer>>({});
  const [isFinished, setIsFinished] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [reviewFeedback, setReviewFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [failCount, setFailCount] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [loadingImage, setLoadingImage] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);

  const fetchWords = async () => {
    setLoading(true);
    setAudioCache({});
    setIsFinished(false);
    setReviewMode(false);
    setFailCount(0);
    setShowHint(false);
    try {
      const newWords = await generateVocabulary('A1 Beginner');
      setWords(newWords);
      setCurrentIndex(0);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  useEffect(() => { fetchWords(); }, []);

  useEffect(() => {
    const current = words[currentIndex];
    if (current && !current.imageUrl && !loadingImage) {
      const fetchVisuals = async () => {
        setLoadingImage(true);
        try {
          const url = await generateImage(current.visualPrompt || current.word);
          if (url) {
            setWords(prev => {
              const updated = [...prev];
              updated[currentIndex] = { ...updated[currentIndex], imageUrl: url };
              return updated;
            });
          }
        } catch (e) { console.error(e); } finally { setLoadingImage(false); }
      };
      fetchVisuals();
    }
    const wordsToFetch = words.slice(currentIndex, currentIndex + 2);
    wordsToFetch.forEach(w => {
      if (w?.word && !audioCache[w.word]) prefetchAudio(w.word);
    });
  }, [currentIndex, words]);

  const prefetchAudio = async (word: string) => {
    try {
      if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const ctx = audioContextRef.current;
      const base64Audio = await getSpeechAudio(word);
      if (base64Audio) {
        const buffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
        setAudioCache(prev => ({ ...prev, [word]: buffer }));
      }
    } catch (e) { console.error(e); }
  };

  const playPronunciation = async (word: string) => {
    if (isPlaying) return;
    setIsPlaying(true);
    try {
      if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const ctx = audioContextRef.current;
      let buffer = audioCache[word];
      if (!buffer) {
        const base64Audio = await getSpeechAudio(word);
        if (base64Audio) {
          buffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
          setAudioCache(prev => ({ ...prev, [word]: buffer }));
        }
      }
      if (buffer) {
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.onended = () => setIsPlaying(false);
        source.start();
      } else { setIsPlaying(false); }
    } catch (error) { setIsPlaying(false); }
  };

  const handleNext = () => {
    if (currentIndex < words.length - 1) { setCurrentIndex(currentIndex + 1); setUserInput(''); setShowHint(false); setFailCount(0); } else { setIsFinished(true); }
  };

  const startReview = () => {
    setReviewMode(true);
    setCurrentIndex(0);
    setUserInput('');
    setReviewFeedback(null);
    setFailCount(0);
    setShowHint(false);
  };

  const checkReview = () => {
    const target = reviewMode ? words[currentIndex].word.toLowerCase() : '';
    if (userInput.toLowerCase().trim() === target) {
      setReviewFeedback('correct');
      playPronunciation(words[currentIndex].word);
      setTimeout(() => {
        if (currentIndex < words.length - 1) {
          setCurrentIndex(currentIndex + 1);
          setUserInput('');
          setReviewFeedback(null);
          setFailCount(0);
          setShowHint(false);
        } else {
          setReviewMode(false);
          setIsFinished(true);
        }
      }, 800);
    } else {
      setReviewFeedback('wrong');
      const newFailCount = failCount + 1;
      setFailCount(newFailCount);
      if (newFailCount >= 3) setShowHint(true);
      setTimeout(() => setReviewFeedback(null), 1000);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-6 animate-pulse">
        <div className="relative">
          <Loader2 className="animate-spin text-indigo-600" size={64} />
          <Stars className="absolute -top-2 -right-2 text-amber-400 animate-float" size={24} />
        </div>
        <p className="text-slate-500 font-black uppercase tracking-widest text-sm">正在构建 4K 全真视觉词库...</p>
      </div>
    );
  }

  if (isFinished && !reviewMode) {
    return (
      <div className="max-w-4xl mx-auto py-12 animate-slide-up">
        <div className="bg-white rounded-[4rem] shadow-2xl p-16 text-center border border-slate-100 overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-amber-500" />
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-28 h-28 bg-amber-50 rounded-[2.5rem] flex items-center justify-center text-amber-500 mb-8 shadow-inner animate-float"><Trophy size={56} /></div>
            <h2 className="text-5xl font-black text-slate-800 mb-4 tracking-tighter">本单元通关！</h2>
            <p className="text-slate-500 mb-12 max-w-lg mx-auto text-lg leading-relaxed">系统已将今日词组存入您的长期记忆队列。第一次复习将在 <span className="text-indigo-600 font-black underline decoration-indigo-200 underline-offset-8">20分钟后</span> 开启。</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-xl mb-12">
              <button onClick={startReview} className="flex items-center justify-center gap-3 py-6 rounded-[2rem] bg-slate-900 text-white font-black text-lg hover:bg-slate-800 shadow-2xl transition-all active:scale-95 group"><RefreshCw size={24} className="group-hover:rotate-180 transition-transform duration-700" /> 立即互动复现</button>
              <button onClick={fetchWords} className="flex items-center justify-center gap-3 py-6 rounded-[2rem] bg-white border-2 border-slate-100 text-slate-700 font-black text-lg hover:bg-slate-50 shadow-sm active:scale-95"><BookOpen size={24} /> 继续学习新词</button>
            </div>
            <div className="w-full border-t border-slate-50 pt-12 mt-4">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-10">AI 推荐后续路径</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { module: LearningModule.SPEAKING, icon: <Mic2 size={24} />, label: '口语实战' },
                  { module: LearningModule.WRITING, icon: <PenTool size={24} />, label: '写作润色' },
                  { module: LearningModule.ROADMAP, icon: <ArrowRight size={24} />, label: '阶段路径' }
                ].map((item, idx) => (
                  <button key={idx} onClick={() => onNavigate && onNavigate(item.module)} className="flex flex-col items-center gap-4 p-8 rounded-[2.5rem] bg-slate-50 border border-slate-100 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all group animate-slide-up delay-100">
                    <div className="text-slate-300 group-hover:text-indigo-600 transition-colors group-hover:animate-float">{item.icon}</div>
                    <span className="text-xs font-black text-slate-500 group-hover:text-slate-800 uppercase tracking-widest">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentWord = words[currentIndex];

  if (reviewMode && currentWord) {
    return (
      <div className="max-w-2xl mx-auto py-12 animate-slide-up">
        <div className="bg-white rounded-[3.5rem] shadow-2xl p-12 border border-slate-100 text-center relative overflow-hidden">
          <div className="mb-8 flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
            <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" /> 互动复现模式</span>
            <span>Step {currentIndex + 1} / {words.length}</span>
          </div>
          <div className="mb-10 flex flex-col items-center">
            {currentWord.imageUrl && <div className="hover-subtle-zoom w-40 h-40 rounded-[2.5rem] mb-6 shadow-2xl border-4 border-white overflow-hidden"><img src={currentWord.imageUrl} className="w-full h-full object-cover" /></div>}
            <h2 className="text-5xl font-black text-slate-800 mb-3 tracking-tighter">{currentWord.translation}</h2>
            <p className="text-slate-400 font-medium italic">输入英文单词以加强神经连接</p>
          </div>
          <div className="relative group">
            <input autoFocus value={userInput} onChange={(e) => setUserInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && checkReview()} placeholder="Type word..." className={`w-full bg-slate-50 border-4 rounded-[2rem] p-8 text-center text-4xl font-black outline-none transition-all ${reviewFeedback === 'correct' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : reviewFeedback === 'wrong' ? 'border-rose-500 bg-rose-50 shake text-rose-700' : 'border-slate-100 focus:border-indigo-600 focus:bg-white focus:shadow-2xl'}`} />
            {reviewFeedback === 'correct' && <div className="absolute right-8 top-1/2 -translate-y-1/2 text-emerald-500 animate-float"><Check size={48} /></div>}
          </div>
          {showHint && (
            <div className="mt-8 p-6 bg-amber-50 rounded-[2rem] border-2 border-amber-200 flex items-center gap-4 animate-slide-up">
              <div className="bg-amber-400 text-white p-3 rounded-2xl shadow-lg animate-float"><AlertCircle size={28} /></div>
              <div className="text-left">
                <p className="text-xs font-black text-amber-700 uppercase tracking-widest mb-1">AI 记忆协助</p>
                <p className="text-xl text-amber-900 font-black tracking-tight">正确拼写: <span className="bg-white px-3 py-1 rounded-xl shadow-sm border border-amber-100">{currentWord.word}</span></p>
              </div>
            </div>
          )}
          <div className="mt-12 flex gap-4">
            <button onClick={() => { setReviewMode(false); setIsFinished(true); }} className="flex-1 py-5 text-slate-400 font-black hover:text-slate-600 transition-all uppercase tracking-widest text-xs">退出</button>
            <button onClick={checkReview} className="flex-[3] py-5 bg-indigo-600 text-white font-black rounded-[1.5rem] hover:bg-indigo-700 shadow-xl shadow-indigo-200 transition-all active:scale-95 text-lg">验证答案</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-8 animate-in fade-in duration-700 pb-20">
      <div className="flex items-center justify-between bg-white px-10 py-8 rounded-[3rem] border border-slate-100 shadow-sm animate-slide-up">
        <div className="flex items-center gap-6">
          <div className="bg-indigo-600 p-4 rounded-[1.5rem] text-white shadow-xl animate-float"><BookOpen size={28} /></div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tighter">系统词汇深度积累</h1>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500" /> 当前任务: {currentIndex + 1} / {words.length}
            </p>
          </div>
        </div>
        <button onClick={fetchWords} className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:text-slate-800 hover:bg-slate-100 transition-all active:rotate-180 duration-500"><RefreshCw size={20} /></button>
      </div>

      {currentWord && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 space-y-8 animate-slide-up delay-100">
            <div className="bg-white rounded-[4rem] shadow-2xl p-16 border border-slate-100 relative overflow-hidden group text-center">
              <div className="mb-4 px-4 py-2 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase inline-block shadow-sm">{currentWord.pos}</div>
              <h2 className="text-8xl font-black text-slate-800 mb-4 tracking-tighter group-hover:scale-105 transition-transform duration-700">{currentWord.word}</h2>
              <div className="flex items-center justify-center gap-6 text-slate-300 mb-12 font-mono text-3xl">
                <span className="italic opacity-80">/{currentWord.phonetic}/</span>
                <button onClick={() => playPronunciation(currentWord.word)} disabled={isPlaying} className={`p-6 rounded-[2rem] shadow-2xl transition-all ${isPlaying ? 'bg-indigo-600 text-white animate-pulse' : 'bg-white text-indigo-600 border border-indigo-50 hover:scale-110 active:scale-90 hover:shadow-indigo-100'}`}><Volume2 size={32} /></button>
              </div>
              
              <div className="w-full relative mb-12 overflow-hidden rounded-[3.5rem] bg-slate-50 border border-slate-100 min-h-[350px] flex items-center justify-center hover-subtle-zoom cursor-crosshair">
                {loadingImage ? (
                  <div className="flex flex-col items-center gap-4"><Loader2 className="animate-spin text-indigo-300" size={48} /><span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">正在生成 8K 真实记忆锚点...</span></div>
                ) : currentWord.imageUrl ? (
                  <img src={currentWord.imageUrl} className="w-full h-[400px] object-cover transition-all duration-1000" />
                ) : (
                  <Sparkles size={80} className="text-indigo-100 animate-float" />
                )}
                <div className="absolute top-6 left-6 flex items-center gap-3">
                  <div className="px-4 py-2 bg-white/90 backdrop-blur-md rounded-2xl text-[10px] font-black text-slate-800 uppercase shadow-xl flex items-center gap-2 border border-white/50"><Stars size={12} className="text-amber-400" /> 真实视觉记忆锚点</div>
                </div>
              </div>

              <div className="bg-slate-50 p-10 rounded-[3rem] border border-slate-100 text-left mb-12 relative overflow-hidden">
                <div className="absolute -top-10 -right-10 text-slate-100/50"><Quote size={150} /></div>
                <p className="text-5xl font-black text-slate-800 mb-6 tracking-tight relative z-10">{currentWord.translation}</p>
                <div className="flex gap-4 relative z-10">
                  <Quote size={28} className="text-indigo-200 shrink-0" />
                  <p className="text-2xl italic text-slate-500 leading-relaxed font-medium">"{currentWord.example}"</p>
                </div>
              </div>
              <div className="flex gap-6">
                <button disabled={currentIndex === 0} onClick={() => setCurrentIndex(currentIndex - 1)} className="p-7 rounded-[2rem] border border-slate-100 text-slate-300 hover:text-slate-800 hover:bg-slate-50 disabled:opacity-20 transition-all active:scale-95"><ChevronLeft size={32} /></button>
                <button onClick={handleNext} className="flex-1 py-7 rounded-[2rem] bg-slate-900 text-white font-black text-xl hover:bg-indigo-700 shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-4">{currentIndex === words.length - 1 ? '全组达成，进入复习' : '我记住了，继续进阶'} <ChevronRight size={28} /></button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-8 animate-slide-up delay-200">
            <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden flex flex-col">
              <div className="flex bg-slate-50/50 p-3 gap-3">
                {[
                  { id: 'systematic', label: '变形体系', icon: <GitBranch size={18} /> },
                  { id: 'memory', label: '拓展关联', icon: <Search size={18} /> },
                  { id: 'info', label: '结构剖析', icon: <Layers size={18} /> }
                ].map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl text-[10px] font-black uppercase transition-all ${activeTab === tab.id ? 'bg-white text-indigo-600 shadow-xl scale-105 border border-indigo-50' : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'}`}>{tab.icon} {tab.label}</button>
                ))}
              </div>

              <div className="p-10 space-y-8 overflow-y-auto max-h-[800px] scrollbar-hide">
                {activeTab === 'systematic' && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3"><GitBranch size={16} /> 变形逻辑深度分析</h4>
                    <div className="space-y-8">
                      {currentWord.forms?.map((f, i) => (
                        <div key={i} className="bg-indigo-50/30 p-8 rounded-[2.5rem] border border-indigo-100/50 space-y-4 hover:bg-indigo-50/50 transition-colors group">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4"><span className="font-black text-2xl text-indigo-700 tracking-tight">{f.form}</span><button onClick={() => playPronunciation(f.form)} className="p-2 rounded-xl bg-white shadow-md text-indigo-400 hover:text-indigo-600 hover:scale-110 active:scale-90 transition-all"><Volume2 size={16} /></button></div>
                            <span className="text-[10px] font-black text-indigo-400 bg-white px-3 py-1 rounded-full shadow-sm">{f.pos}</span>
                          </div>
                          <div className="text-sm text-slate-400 font-mono tracking-wide">/{f.phonetic}/ • <span className="font-black text-slate-800">{f.meaning}</span></div>
                          <p className="text-sm text-slate-500 italic bg-white/60 p-5 rounded-2xl border border-indigo-50 shadow-inner">"{f.example}"</p>
                          <div className="text-[11px] text-indigo-500 leading-relaxed font-bold bg-white/40 px-5 py-3 rounded-2xl border border-indigo-50/50 italic"><span className="font-black text-indigo-700 mr-2">变形依据:</span> {f.derivationReason}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {activeTab === 'memory' && (
                  <div className="space-y-10 animate-in fade-in slide-in-from-right-4">
                    <section className="space-y-6">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3"><Search size={16} /> 核心关联词网络</h4>
                      <div className="grid grid-cols-1 gap-4">
                        {currentWord.relatedWords?.synonym?.map((s, i) => (
                          <div key={i} className="bg-emerald-50/30 p-6 rounded-[2rem] border border-emerald-100/50 group hover:bg-emerald-50/50 transition-colors">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-3"><span className="font-black text-lg text-emerald-800">{s.word}</span><button onClick={() => playPronunciation(s.word)} className="text-emerald-400 hover:scale-110 transition-all"><Volume2 size={14} /></button></div>
                              <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest bg-white px-3 py-1 rounded-full">Synonym</span>
                            </div>
                            <p className="text-sm text-slate-600"><span className="font-mono text-[11px] opacity-60 mr-2">/{s.phonetic}/</span> {s.meaning}</p>
                            <p className="text-[11px] text-slate-400 italic mt-2 bg-white/30 p-2 rounded-lg leading-relaxed">"{s.example}"</p>
                          </div>
                        ))}
                      </div>
                    </section>
                    <section className="space-y-6">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3"><Link size={16} /> 高频固定搭配</h4>
                      <div className="grid grid-cols-1 gap-4">
                        {currentWord.phrases?.map((p, i) => (
                          <div key={i} className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 hover:shadow-inner transition-shadow">
                             <h5 className="font-black text-slate-800 text-lg mb-1 tracking-tight">{p.phrase}</h5>
                             <p className="text-xs text-indigo-600 font-black mb-3">{p.translation}</p>
                             <div className="text-[11px] text-slate-400 italic leading-relaxed bg-white/50 p-3 rounded-xl">"{p.example}"</div>
                          </div>
                        ))}
                      </div>
                    </section>
                  </div>
                )}

                {activeTab === 'info' && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
                    <div className="bg-slate-50 p-10 rounded-[3rem] border border-slate-100 space-y-10 relative">
                       <div className="absolute top-6 right-6 text-indigo-100"><Info size={80} /></div>
                       <div className="relative z-10">
                         <span className="text-[10px] font-black text-slate-400 uppercase block mb-4 tracking-[0.3em]">词根词缀透视</span>
                         <div className="flex flex-wrap gap-4">
                           <div className="bg-white px-5 py-3 rounded-2xl text-lg font-black border border-slate-100 shadow-sm flex items-center gap-2"><span className="text-indigo-600 text-[10px]">ROOT</span> {currentWord.roots}</div>
                           <div className="text-slate-300 self-center text-2xl">+</div>
                           <div className="bg-white px-5 py-3 rounded-2xl text-lg font-black border border-slate-100 shadow-sm flex items-center gap-2"><span className="text-purple-600 text-[10px]">AFFIX</span> {currentWord.affixes}</div>
                         </div>
                       </div>
                       <div className="relative z-10">
                         <span className="text-[10px] font-black text-slate-400 uppercase block mb-4 tracking-[0.3em]">语源脉络</span>
                         <p className="text-sm text-slate-500 italic leading-relaxed font-medium bg-white/50 p-6 rounded-3xl border border-slate-100">{currentWord.etymology}</p>
                       </div>
                       <div className="relative z-10 bg-amber-50 p-8 rounded-[2.5rem] border-2 border-amber-100 shadow-xl animate-float">
                         <span className="text-[10px] font-black text-amber-600 uppercase block mb-3 tracking-[0.3em] flex items-center gap-2"><Puzzle size={14} /> 记忆锚点</span>
                         <p className="text-lg text-amber-900 leading-tight font-black">{currentWord.mnemonic}</p>
                         <p className="text-xs text-amber-700/60 mt-4 italic font-bold">"{currentWord.memoryTip}"</p>
                       </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-slate-900 p-10 rounded-[3rem] text-white shadow-2xl space-y-8 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform duration-1000"><Zap size={150} /></div>
              <div className="flex items-center justify-between relative z-10">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">AI 学习引擎监控</span>
                <Calendar size={20} className="text-indigo-400 animate-pulse" />
              </div>
              <div className="space-y-4 relative z-10">
                <div className="flex justify-between text-sm font-black"><span>当前记忆负载</span><span className="text-indigo-400">{Math.round(((currentIndex + 1) / words.length) * 100)}%</span></div>
                <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden border border-white/5"><div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-1000 shadow-[0_0_15px_rgba(99,102,241,0.5)]" style={{ width: `${((currentIndex + 1) / words.length) * 100}%` }} /></div>
                <p className="text-[11px] text-slate-500 mt-4 italic leading-relaxed font-medium">系统已针对您的 0 基础定制化该词组。完成全组 5 个词后，建议立即通过“互动复现”加深皮层映射。</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VocabularyView;