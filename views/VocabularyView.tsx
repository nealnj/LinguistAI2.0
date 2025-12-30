
import React, { useState, useEffect, useRef } from 'react';
import { generateVocabulary, getSpeechAudio, generateImage } from '../services/geminiService';
import { VocabularyWord, LearningModule } from '../types';
import { 
  Loader2, 
  RefreshCw, 
  Volume2, 
  Check, 
  Sparkles, 
  ChevronRight,
  ChevronLeft,
  Puzzle,
  Zap,
  GitBranch,
  Search,
  BookOpen,
  ArrowRight,
  AlertCircle,
  Quote,
  Info,
  Stars,
  Layout,
  Layers,
  Calendar
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
  const [isPlaying, setIsPlaying] = useState<string | null>(null);
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
      const newWords = await generateVocabulary('Academic Core');
      if (newWords && newWords.length > 0) {
        setWords(newWords);
        setCurrentIndex(0);
      } else {
        throw new Error("No data returned from AI");
      }
    } catch (error) { 
      console.error(error); 
    } finally { 
      setLoading(false); 
    }
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

  const playPronunciation = async (textToPlay: string) => {
    if (isPlaying === textToPlay) return;
    setIsPlaying(textToPlay);
    try {
      if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const ctx = audioContextRef.current;
      let buffer = audioCache[textToPlay];
      if (!buffer) {
        const base64Audio = await getSpeechAudio(textToPlay);
        if (base64Audio) {
          buffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
          setAudioCache(prev => ({ ...prev, [textToPlay]: buffer }));
        }
      }
      if (buffer) {
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.onended = () => setIsPlaying(null);
        source.start();
      } else { setIsPlaying(null); }
    } catch (error) { setIsPlaying(null); }
  };

  const handleNext = () => {
    if (currentIndex < words.length - 1) { 
      setCurrentIndex(currentIndex + 1); 
      setUserInput(''); 
      setShowHint(false); 
      setFailCount(0); 
    } else { 
      setIsFinished(true); 
      setReviewMode(true);
      setCurrentIndex(0);
    }
  };

  const checkReview = () => {
    const currentWord = words[currentIndex];
    if (!currentWord) return;
    const isCorrect = userInput.toLowerCase().trim() === currentWord.word.toLowerCase().trim();
    if (isCorrect) {
      setReviewFeedback('correct');
      setTimeout(() => {
        setReviewFeedback(null);
        if (currentIndex < words.length - 1) {
          setCurrentIndex(currentIndex + 1);
          setUserInput('');
          setShowHint(false);
          setFailCount(0);
        } else {
          setIsFinished(true);
          setReviewMode(false);
          onNavigate?.(LearningModule.DASHBOARD);
        }
      }, 1500);
    } else {
      setReviewFeedback('wrong');
      setFailCount(f => f + 1);
      if (failCount >= 1) setShowHint(true);
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
        <p className="text-slate-500 font-black uppercase tracking-widest text-sm text-center">
          正在同步全球词源库...<br/>
          <span className="text-[10px] opacity-60">BUILDING ACADEMIC ONTOLOGY</span>
        </p>
      </div>
    );
  }

  const currentWord = words[currentIndex];

  if (reviewMode && currentWord) {
    return (
      <div className="max-w-2xl mx-auto py-12 animate-slide-up">
        <div className="bg-white rounded-[3.5rem] shadow-2xl p-12 border border-slate-100 text-center relative overflow-hidden">
          <div className="mb-8 flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
            <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" /> 交互巩固模式</span>
            <span>Word {currentIndex + 1} / {words.length}</span>
          </div>
          <div className="mb-10 flex flex-col items-center">
            {currentWord.imageUrl && <div className="w-40 h-40 rounded-[2.5rem] mb-6 shadow-2xl border-4 border-white overflow-hidden"><img src={currentWord.imageUrl} className="w-full h-full object-cover" /></div>}
            <h2 className="text-5xl font-black text-slate-800 mb-3 tracking-tighter">{currentWord.translation}</h2>
            <p className="text-slate-400 font-medium italic">输入英文单词以激活长期记忆</p>
          </div>
          <div className="relative group">
            <input autoFocus value={userInput} onChange={(e) => setUserInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && checkReview()} placeholder="Type the word..." className={`w-full bg-slate-50 border-4 rounded-[2rem] p-8 text-center text-4xl font-black outline-none transition-all ${reviewFeedback === 'correct' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : reviewFeedback === 'wrong' ? 'border-rose-500 bg-rose-50 shake text-rose-700' : 'border-slate-100 focus:border-indigo-600 focus:bg-white focus:shadow-2xl'}`} />
            {reviewFeedback === 'correct' && <div className="absolute right-8 top-1/2 -translate-y-1/2 text-emerald-500 animate-float"><Check size={48} /></div>}
          </div>
          {showHint && (
            <div className="mt-8 p-6 bg-amber-50 rounded-[2rem] border-2 border-amber-200 flex items-center gap-4 animate-slide-up">
              <div className="bg-amber-400 text-white p-3 rounded-2xl shadow-lg animate-float"><AlertCircle size={28} /></div>
              <div className="text-left">
                <p className="text-xs font-black text-amber-700 uppercase tracking-widest mb-1">AI 拼写协助</p>
                <p className="text-xl text-amber-900 font-black tracking-tight">正确拼写: <span className="bg-white px-3 py-1 rounded-xl shadow-sm border border-amber-100">{currentWord.word}</span></p>
              </div>
            </div>
          )}
          <div className="mt-12 flex gap-4">
            <button onClick={() => { setReviewMode(false); }} className="flex-1 py-5 text-slate-400 font-black hover:text-slate-600 transition-all uppercase tracking-widest text-xs">重新学习</button>
            <button onClick={checkReview} className="flex-[3] py-5 bg-indigo-600 text-white font-black rounded-[1.5rem] hover:bg-indigo-700 shadow-xl shadow-indigo-200 transition-all active:scale-95 text-lg">验证拼写</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-8 animate-in fade-in duration-700 pb-20">
      <div className="flex items-center justify-between bg-white px-10 py-6 rounded-3xl border border-slate-100 shadow-sm animate-slide-up">
        <div className="flex items-center gap-6">
          <div className="bg-indigo-600 p-4 rounded-[1.5rem] text-white shadow-xl animate-float"><BookOpen size={28} /></div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tighter">词汇实验室 (Vocab Lab)</h1>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500" /> 当前进度: {currentIndex + 1} / {words.length}
            </p>
          </div>
        </div>
        <button onClick={fetchWords} className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:text-slate-800 hover:bg-slate-100 transition-all active:rotate-180 duration-500"><RefreshCw size={20} /></button>
      </div>

      {currentWord && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 space-y-8 animate-slide-up delay-100">
            <div className="bg-white rounded-[4rem] shadow-2xl p-16 border border-slate-100 relative group text-center">
              <div className="mb-4 flex items-center justify-center gap-3">
                <span className="px-4 py-2 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase shadow-sm border border-indigo-100">{currentWord.pos || 'N/A'}</span>
                <span className="px-4 py-2 rounded-full bg-slate-50 text-slate-400 text-[10px] font-black uppercase shadow-sm">Academic Core</span>
              </div>
              
              <h2 className="text-8xl font-black text-slate-800 mb-2 tracking-tighter group-hover:scale-105 transition-transform duration-700">{currentWord.word}</h2>
              <p className="text-4xl font-black text-indigo-600 mb-6 tracking-tight">{currentWord.translation}</p>
              
              <div className="flex items-center justify-center gap-6 text-slate-300 mb-12 font-mono text-3xl">
                <span className="italic font-medium text-slate-500 bg-slate-50 px-6 py-3 rounded-2xl border border-slate-100 shadow-inner">
                  {currentWord.phonetic || '/.../'}
                </span>
                <button onClick={() => playPronunciation(currentWord.word)} className={`p-6 rounded-[2rem] shadow-2xl transition-all ${isPlaying === currentWord.word ? 'bg-indigo-600 text-white animate-pulse' : 'bg-white text-indigo-600 border border-indigo-50 hover:scale-110 active:scale-90 hover:shadow-indigo-100'}`}><Volume2 size={32} /></button>
              </div>
              
              <div className="w-full relative mb-12 overflow-hidden rounded-[3.5rem] bg-slate-50 border border-slate-100 min-h-[350px] flex items-center justify-center hover-subtle-zoom cursor-crosshair shadow-inner">
                {loadingImage ? (
                  <div className="flex flex-col items-center gap-4"><Loader2 className="animate-spin text-indigo-300" size={48} /><span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">正在联觉绘图记忆辅助...</span></div>
                ) : currentWord.imageUrl ? (
                  <img src={currentWord.imageUrl} className="w-full h-[400px] object-cover transition-all duration-1000" />
                ) : (
                  <Sparkles size={80} className="text-indigo-100 animate-float" />
                )}
                <div className="absolute top-6 left-6 flex items-center gap-3">
                  <div className="px-4 py-2 bg-white/90 backdrop-blur-md rounded-2xl text-[10px] font-black text-slate-800 uppercase shadow-xl flex items-center gap-2 border border-white/50"><Stars size={12} className="text-amber-400" /> 视觉关联锚点</div>
                </div>
              </div>

              <div className="bg-slate-50 p-10 rounded-[3rem] border border-slate-100 text-left mb-12 relative overflow-hidden space-y-8">
                <div className="space-y-4 relative z-10">
                   <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-lg"><Info size={16} /></div>
                      <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">学术语境 (Context)</h4>
                   </div>
                   <div className="space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <p className="text-3xl italic text-slate-800 leading-tight font-black">"{currentWord.example}"</p>
                        <button onClick={() => playPronunciation(currentWord.example)} className={`shrink-0 p-4 rounded-2xl transition-all shadow-md ${isPlaying === currentWord.example ? 'bg-indigo-600 text-white' : 'bg-white text-slate-300'}`}><Volume2 size={24} /></button>
                      </div>
                      <p className="text-xl text-slate-500 font-bold border-l-4 border-indigo-200 pl-4">{currentWord.exampleTranslation}</p>
                   </div>
                </div>

                {currentWord.exampleStructure && (
                  <div className="bg-white/80 backdrop-blur-sm p-8 rounded-[2.5rem] border border-slate-200/50 space-y-6 shadow-sm">
                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest"><Layout size={14} /> 句法路径透视 (Syntactic Mapping)</h5>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                          <span className="text-[8px] font-black text-blue-500 uppercase block mb-1">Subject</span>
                          <span className="text-sm font-black text-blue-900">{currentWord.exampleStructure.analysis.subject}</span>
                        </div>
                        <div className="p-4 bg-rose-50/50 rounded-2xl border border-rose-100">
                          <span className="text-[8px] font-black text-rose-500 uppercase block mb-1">Verb</span>
                          <span className="text-sm font-black text-rose-900">{currentWord.exampleStructure.analysis.verb}</span>
                        </div>
                        <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                          <span className="text-[8px] font-black text-emerald-500 uppercase block mb-1">Object</span>
                          <span className="text-sm font-black text-emerald-900">{currentWord.exampleStructure.analysis.object || '-'}</span>
                        </div>
                        <div className="p-4 bg-slate-100/50 rounded-2xl border border-slate-200">
                          <span className="text-[8px] font-black text-slate-400 uppercase block mb-1">Others</span>
                          <span className="text-sm font-black text-slate-600">{currentWord.exampleStructure.analysis.others || '-'}</span>
                        </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-6">
                <button disabled={currentIndex === 0} onClick={() => setCurrentIndex(currentIndex - 1)} className="p-7 rounded-[2rem] border border-slate-100 text-slate-300 hover:text-slate-800 hover:bg-slate-50 disabled:opacity-20 transition-all active:scale-95"><ChevronLeft size={32} /></button>
                <button onClick={handleNext} className="flex-1 py-7 rounded-[2rem] bg-slate-900 text-white font-black text-xl hover:bg-indigo-700 shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-4">{currentIndex === words.length - 1 ? '开始复现练习' : '下一词'} <ChevronRight size={28} /></button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-8 animate-slide-up delay-200">
            <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden flex flex-col min-h-[500px]">
              <div className="flex bg-slate-50/50 p-3 gap-3">
                {[
                  { id: 'systematic', label: '变形体系', icon: <GitBranch size={18} /> },
                  { id: 'memory', label: '拓展网络', icon: <Search size={18} /> },
                  { id: 'info', label: '结构解构', icon: <Layers size={18} /> }
                ].map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl text-[10px] font-black uppercase transition-all ${activeTab === tab.id ? 'bg-white text-indigo-600 shadow-xl border border-indigo-50' : 'text-slate-400 hover:text-slate-600'}`}>{tab.icon} {tab.label}</button>
                ))}
              </div>

              <div className="p-10 space-y-8 overflow-y-auto max-h-[800px] scrollbar-hide">
                {activeTab === 'systematic' && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3"><GitBranch size={16} /> 形态逻辑分析 (Morphology)</h4>
                    {currentWord.forms && currentWord.forms.length > 0 ? (
                      currentWord.forms.map((f, i) => (
                        <div key={i} className="bg-indigo-50/30 p-8 rounded-[2.5rem] border border-indigo-100/50 space-y-4 hover:bg-indigo-50/50 transition-colors group">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <span className="font-black text-2xl text-indigo-700 tracking-tight">{f.form}</span>
                              <button onClick={() => playPronunciation(f.form)} className={`p-2 rounded-xl transition-all ${isPlaying === f.form ? 'text-indigo-600 animate-pulse' : 'text-indigo-400'}`}><Volume2 size={16} /></button>
                            </div>
                            <span className="text-[10px] font-black text-indigo-400 bg-white px-3 py-1 rounded-full shadow-sm">{f.pos}</span>
                          </div>
                          <div className="text-sm text-slate-500 font-mono italic">{f.phonetic || '/.../'} • <span className="font-black text-slate-800 not-italic">{f.meaning}</span></div>
                          <p className="text-sm text-slate-500 italic bg-white/60 p-4 rounded-2xl border border-indigo-50 pr-10 relative">"{f.example}"<button onClick={() => playPronunciation(f.example)} className="absolute right-3 top-4 text-slate-300 hover:text-indigo-500"><Volume2 size={14}/></button></p>
                          <div className="text-[11px] text-indigo-500 leading-relaxed font-bold italic"><span className="font-black text-indigo-700 mr-2">演化规律:</span> {f.derivationReason}</div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-100 space-y-4">
                        <Zap className="text-indigo-300 mx-auto" size={32} />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">词汇系谱解构完成，暂无额外衍生形态</p>
                      </div>
                    )}
                  </div>
                )}
                
                {activeTab === 'memory' && (
                  <div className="space-y-10 animate-in fade-in slide-in-from-right-4">
                    <section className="space-y-6">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3"><Search size={16} /> 语义关联云 (Semantic Cloud)</h4>
                      <div className="grid grid-cols-1 gap-4">
                        {currentWord.relatedWords?.synonym?.length ? currentWord.relatedWords.synonym.map((s, i) => (
                          <div key={i} className="bg-emerald-50/30 p-6 rounded-[2rem] border border-emerald-100/50 group hover:bg-emerald-50/50 transition-colors">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-3">
                                <span className="font-black text-lg text-emerald-800">{s.word}</span>
                                <button onClick={() => playPronunciation(s.word)} className={`${isPlaying === s.word ? 'text-emerald-600' : 'text-emerald-400'}`}><Volume2 size={14} /></button>
                              </div>
                              <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest bg-white px-3 py-1 rounded-full shadow-sm">Synonym</span>
                            </div>
                            <p className="text-sm text-slate-600"><span className="font-mono text-[11px] opacity-60 mr-2">{s.phonetic}</span> {s.meaning}</p>
                            <p className="text-[11px] text-slate-400 italic mt-2">"{s.example}"</p>
                          </div>
                        )) : (
                          <div className="text-center py-10 opacity-30 italic text-xs">正在分析关联语义...</div>
                        )}
                      </div>
                    </section>
                  </div>
                )}

                {activeTab === 'info' && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
                    <div className="bg-slate-50 p-10 rounded-[3rem] border border-slate-100 space-y-10 relative">
                       <div className="absolute top-6 right-6 text-indigo-100"><Info size={80} /></div>
                       <div className="relative z-10">
                         <span className="text-[10px] font-black text-slate-400 uppercase block mb-4 tracking-[0.3em]">词根词缀透视 (Roots & Affixes)</span>
                         <div className="flex flex-wrap gap-4">
                           <div className="bg-white px-5 py-3 rounded-2xl text-lg font-black border border-slate-100 shadow-sm flex items-center gap-2"><span className="text-indigo-600 text-[10px]">ROOT</span> {currentWord.roots || 'N/A'}</div>
                           <div className="text-slate-300 self-center text-2xl">+</div>
                           <div className="bg-white px-5 py-3 rounded-2xl text-lg font-black border border-slate-100 shadow-sm flex items-center gap-2"><span className="text-purple-600 text-[10px]">AFFIX</span> {currentWord.affixes || 'N/A'}</div>
                         </div>
                       </div>
                       <div className="relative z-10 bg-amber-50 p-8 rounded-[2.5rem] border-2 border-amber-100 shadow-xl animate-float">
                         <span className="text-[10px] font-black text-amber-600 uppercase block mb-3 tracking-[0.3em] flex items-center gap-2"><Puzzle size={14} /> 逻辑助记锚点</span>
                         <p className="text-lg text-amber-900 leading-tight font-black">{currentWord.mnemonic}</p>
                         <p className="text-xs text-amber-700/60 mt-4 italic font-bold">"{currentWord.memoryTip || 'Connect logic with visualization.'}"</p>
                       </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-slate-900 p-10 rounded-[3rem] text-white shadow-2xl space-y-8 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform duration-1000"><Zap size={150} /></div>
              <div className="flex items-center justify-between relative z-10">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">AI 实时认知载荷</span>
                <Calendar size={20} className="text-indigo-400 animate-pulse" />
              </div>
              <div className="space-y-4 relative z-10">
                <div className="flex justify-between text-sm font-black"><span>记忆固化程度</span><span className="text-indigo-400">{Math.round(((currentIndex + 1) / words.length) * 100)}%</span></div>
                <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden border border-white/5"><div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-1000 shadow-[0_0_15px_rgba(99,102,241,0.5)]" style={{ width: `${((currentIndex + 1) / words.length) * 100}%` }} /></div>
                <p className="text-[11px] text-slate-500 mt-4 italic leading-relaxed">系统正在动态记录您的交互行为，完成全组核心词汇后将触发强化反馈。</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VocabularyView;
