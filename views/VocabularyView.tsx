
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
  Info
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
    if (currentIndex < words.length - 1) { setCurrentIndex(currentIndex + 1); } else { setIsFinished(true); }
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
      <div className="h-full flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-indigo-600" size={48} />
        <p className="text-slate-500 font-black uppercase tracking-widest text-xs">正在根据 0 基础定制系统化词库...</p>
      </div>
    );
  }

  if (isFinished && !reviewMode) {
    return (
      <div className="max-w-4xl mx-auto py-12 animate-in zoom-in-95 duration-500">
        <div className="bg-white rounded-[3rem] shadow-2xl p-12 text-center border border-slate-100 overflow-hidden relative">
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-24 h-24 bg-amber-100 rounded-3xl flex items-center justify-center text-amber-600 mb-8 shadow-inner"><Trophy size={48} /></div>
            <h2 className="text-4xl font-black text-slate-800 mb-4 tracking-tighter">本组词汇学习达成！</h2>
            <p className="text-slate-500 mb-10 max-w-md mx-auto leading-relaxed">太棒了！AI 导师建议您在 <span className="text-indigo-600 font-bold">20分钟</span> 之后进行第一次艾宾浩斯复习。主页已标记“待复习”。</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-lg mb-10">
              <button onClick={startReview} className="flex items-center justify-center gap-3 py-5 rounded-2xl bg-indigo-600 text-white font-black hover:bg-indigo-700 shadow-xl active:scale-95"><RefreshCw size={20} /> 进入即时互动复习</button>
              <button onClick={fetchWords} className="flex items-center justify-center gap-3 py-5 rounded-2xl bg-white border-2 border-slate-100 text-slate-700 font-black hover:bg-slate-50 active:scale-95"><BookOpen size={20} /> 学习下一组词汇</button>
            </div>
            <div className="w-full border-t border-slate-100 pt-8 mt-4">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">推荐后续学习</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { module: LearningModule.SPEAKING, icon: <Mic2 size={18} />, label: '口语练习' },
                  { module: LearningModule.WRITING, icon: <PenTool size={18} />, label: '写作训练' },
                  { module: LearningModule.DASHBOARD, icon: <ArrowRight size={18} />, label: '查看进度' }
                ].map((item, idx) => (
                  <button key={idx} onClick={() => onNavigate && onNavigate(item.module)} className="flex flex-col items-center gap-2 p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:border-indigo-200 transition-all group">
                    <div className="text-slate-400 group-hover:text-indigo-600 transition-colors">{item.icon}</div>
                    <span className="text-xs font-bold text-slate-600">{item.label}</span>
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
      <div className="max-w-2xl mx-auto py-12">
        <div className="bg-white rounded-[2.5rem] shadow-xl p-10 border border-slate-100 text-center relative overflow-hidden">
          <div className="mb-6 flex justify-between items-center text-xs font-black uppercase tracking-widest text-slate-400"><span>互动复习模式</span><span>{currentIndex + 1} / {words.length}</span></div>
          <div className="mb-8 flex flex-col items-center">
            {currentWord.imageUrl && <img src={currentWord.imageUrl} className="w-32 h-32 rounded-3xl mb-4 shadow-lg border border-slate-100 object-cover" />}
            <h2 className="text-4xl font-black text-slate-800 mb-2">{currentWord.translation}</h2>
            <p className="text-slate-400 italic">请拼写出对应的英文单词</p>
          </div>
          <div className="relative group">
            <input autoFocus value={userInput} onChange={(e) => setUserInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && checkReview()} placeholder="Type word here..." className={`w-full bg-slate-50 border-2 rounded-2xl p-6 text-center text-2xl font-black outline-none transition-all ${reviewFeedback === 'correct' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : reviewFeedback === 'wrong' ? 'border-rose-500 bg-rose-50 shake text-rose-700' : 'border-slate-100 focus:border-indigo-600 focus:bg-white'}`} />
            {reviewFeedback === 'correct' && <Check className="absolute right-6 top-1/2 -translate-y-1/2 text-emerald-500" size={32} />}
          </div>
          {showHint && (
            <div className="mt-6 p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-center gap-3 animate-in slide-in-from-top-4">
              <AlertCircle size={20} className="text-amber-500 shrink-0" />
              <div className="text-left">
                <p className="text-xs font-black text-amber-700 uppercase">导师提示 (错误次数过多)</p>
                <p className="text-sm text-amber-900 font-bold">正确拼写是: <span className="underline decoration-amber-400 underline-offset-4">{currentWord.word}</span></p>
              </div>
            </div>
          )}
          <div className="mt-10 flex gap-4">
            <button onClick={() => { setReviewMode(false); setIsFinished(true); }} className="flex-1 py-4 text-slate-400 font-bold hover:text-slate-600 transition-all">退出复习</button>
            <button onClick={checkReview} className="flex-[2] py-4 bg-slate-900 text-white font-black rounded-xl hover:bg-slate-800 transition-all shadow-lg active:scale-95">提交答案</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6 animate-in fade-in duration-500 pb-10">
      <div className="flex items-center justify-between bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-100 p-3 rounded-2xl text-indigo-600 shadow-sm"><BookOpen size={24} /></div>
          <div>
            <h1 className="text-xl font-black text-slate-800">系统词汇积累</h1>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">任务进度: {currentIndex + 1} / {words.length}</p>
          </div>
        </div>
        <button onClick={fetchWords} className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:text-slate-600 transition-all"><RefreshCw size={18} /></button>
      </div>

      {currentWord && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-[3rem] shadow-xl p-12 border border-slate-100 relative overflow-hidden group text-center">
              <div className="mb-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase inline-block">{currentWord.pos}</div>
              <h2 className="text-7xl font-black text-slate-800 mb-2 tracking-tighter">{currentWord.word}</h2>
              <div className="flex items-center justify-center gap-4 text-slate-300 mb-8 font-mono text-2xl">
                <span>/{currentWord.phonetic}/</span>
                <button onClick={() => playPronunciation(currentWord.word)} disabled={isPlaying} className={`p-5 rounded-2xl shadow-xl transition-all ${isPlaying ? 'bg-indigo-600 text-white animate-pulse' : 'bg-white text-indigo-600 border border-indigo-50 hover:scale-105 active:scale-95'}`}><Volume2 size={24} /></button>
              </div>
              
              <div className="w-full relative mb-10 overflow-hidden rounded-[2.5rem] bg-slate-50 border border-slate-100 min-h-[256px] flex items-center justify-center group">
                {loadingImage ? (
                  <div className="flex flex-col items-center gap-2"><Loader2 className="animate-spin text-slate-300" /><span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">AI 绘图中...</span></div>
                ) : currentWord.imageUrl ? (
                  <img src={currentWord.imageUrl} className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-700" />
                ) : (
                  <Sparkles size={64} className="text-indigo-100" />
                )}
                <div className="absolute bottom-4 left-4 flex items-center gap-2">
                  <span className="px-3 py-1 bg-white/80 backdrop-blur-md rounded-lg text-[9px] font-black text-slate-500 uppercase">记忆辅助图</span>
                </div>
              </div>

              <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 text-left mb-10">
                <p className="text-4xl font-black text-slate-800 mb-4">{currentWord.translation}</p>
                <div className="flex gap-3">
                  <Quote size={20} className="text-indigo-200 shrink-0" />
                  <p className="text-xl italic text-slate-500 leading-relaxed font-medium">"{currentWord.example}"</p>
                </div>
              </div>
              <div className="flex gap-4">
                <button disabled={currentIndex === 0} onClick={() => setCurrentIndex(currentIndex - 1)} className="p-5 rounded-2xl border border-slate-100 text-slate-300 hover:text-slate-600 disabled:opacity-20 transition-all"><ChevronLeft size={24} /></button>
                <button onClick={handleNext} className="flex-1 py-5 rounded-2xl bg-slate-900 text-white font-black text-lg hover:bg-indigo-700 shadow-xl transition-all">{currentIndex === words.length - 1 ? '我记住了，完成学习' : '我记住了，下一个'} <ChevronRight size={20} className="inline ml-1" /></button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
              <div className="flex bg-slate-50/50 p-2 gap-2">
                {[
                  { id: 'systematic', label: '变形体系', icon: <GitBranch size={16} /> },
                  { id: 'memory', label: '拓展关联', icon: <Search size={16} /> },
                  { id: 'info', label: '剖析记忆', icon: <Layers size={16} /> }
                ].map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === tab.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>{tab.icon} {tab.label}</button>
                ))}
              </div>

              <div className="p-8 space-y-6 overflow-y-auto max-h-[700px]">
                {activeTab === 'systematic' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-2">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><GitBranch size={14} /> 变形分析 (Forms)</h4>
                    <div className="space-y-6">
                      {currentWord.forms?.map((f, i) => (
                        <div key={i} className="bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100/50 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3"><span className="font-black text-lg text-indigo-700">{f.form}</span><button onClick={() => playPronunciation(f.form)} className="p-1 text-indigo-400 hover:text-indigo-600"><Volume2 size={12} /></button></div>
                            <span className="text-[10px] font-bold text-indigo-400 bg-white px-2 py-0.5 rounded-full">{f.pos}</span>
                          </div>
                          <div className="text-xs text-slate-400 font-mono">/{f.phonetic}/ • <span className="font-bold text-slate-700">{f.meaning}</span></div>
                          <p className="text-xs text-slate-500 italic bg-white/60 p-3 rounded-xl">"{f.example}"</p>
                          <div className="text-[10px] text-indigo-400 leading-relaxed italic"><span className="font-black">变形逻辑:</span> {f.derivationReason}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {activeTab === 'memory' && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-right-2">
                    <section className="space-y-4">
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Search size={14} /> 核心关联词 (Syn/Ant)</h4>
                      <div className="space-y-4">
                        {currentWord.relatedWords?.synonym?.map((s, i) => (
                          <div key={i} className="bg-emerald-50/30 p-4 rounded-xl border border-emerald-100/50">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2"><span className="font-bold text-emerald-700">{s.word}</span><button onClick={() => playPronunciation(s.word)} className="text-emerald-300"><Volume2 size={10} /></button></div>
                              <span className="text-[9px] font-black text-emerald-400 uppercase">Synonym</span>
                            </div>
                            <p className="text-xs text-slate-600"><span className="font-mono text-[10px] opacity-60">/{s.phonetic}/</span> {s.meaning}</p>
                            <p className="text-[10px] text-slate-400 italic mt-1">"{s.example}"</p>
                          </div>
                        ))}
                      </div>
                    </section>
                    <section className="space-y-4">
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Link size={14} /> 场景搭配 (Phrases)</h4>
                      <div className="space-y-3">
                        {currentWord.phrases?.map((p, i) => (
                          <div key={i} className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                             <h5 className="font-black text-slate-700 text-sm mb-1">{p.phrase}</h5>
                             <p className="text-xs text-indigo-600 font-bold mb-1">{p.translation}</p>
                             <p className="text-[10px] text-slate-400 italic leading-tight">"{p.example}"</p>
                          </div>
                        ))}
                      </div>
                    </section>
                  </div>
                )}

                {activeTab === 'info' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-2">
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-6">
                       <div><span className="text-[10px] font-black text-slate-400 uppercase block mb-2">词根词缀剖析</span><div className="flex gap-2"><span className="bg-white px-3 py-1.5 rounded-xl text-sm font-bold border border-slate-100">{currentWord.roots}</span><span className="text-slate-300 self-center">+</span><span className="bg-white px-3 py-1.5 rounded-xl text-sm font-bold border border-slate-100">{currentWord.affixes}</span></div></div>
                       <div><span className="text-[10px] font-black text-slate-400 uppercase block mb-2">语源故事</span><p className="text-xs text-slate-500 italic leading-relaxed">{currentWord.etymology}</p></div>
                       <div className="bg-amber-50 p-4 rounded-xl border border-amber-100"><span className="text-[10px] font-black text-amber-600 uppercase block mb-1">记忆窍门</span><p className="text-xs text-amber-900 leading-relaxed font-bold">{currentWord.mnemonic}</p></div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-slate-900 p-8 rounded-[2rem] text-white shadow-xl space-y-6">
              <div className="flex items-center justify-between"><span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">学习进度周期</span><Calendar size={16} className="text-indigo-400" /></div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold"><span>当前记忆强度</span><span className="text-indigo-400">{Math.round(((currentIndex + 1) / words.length) * 100)}%</span></div>
                <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden"><div className="h-full bg-indigo-500 transition-all duration-1000" style={{ width: `${((currentIndex + 1) / words.length) * 100}%` }} /></div>
                <p className="text-[10px] text-slate-500 mt-2 italic">系统已锁定今日学习词组。建议学习 5 个词后立即进入互动复现模式。</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VocabularyView;
