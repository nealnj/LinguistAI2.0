
import React, { useState, useEffect, useRef } from 'react';
import { generateVocabulary, generateVocabularySyllabus, getSpeechAudio, generateImage } from '../services/geminiService';
import { VocabularyWord, VocabularyUnit, LearningModule } from '../types';
import { logger } from '../services/logger';
import { 
  Loader2, RefreshCw, Volume2, Check, Sparkles, ChevronRight, ChevronLeft, 
  Zap, GitBranch, Search, BookOpen, Stars, Layers, Target, Compass, Box, 
  Link as LinkIcon, Image as LucideImage, AlertTriangle, PlayCircle, Eye,
  Lock, Layout, Map, Activity, HelpCircle, EyeOff, BookMarked, ArrowLeft
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

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
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
  const [view, setView] = useState<'syllabus' | 'learning'>('syllabus');
  const [syllabus, setSyllabus] = useState<VocabularyUnit[]>([]);
  const [activeUnit, setActiveUnit] = useState<VocabularyUnit | null>(null);
  const [words, setWords] = useState<VocabularyWord[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState<string | null>(null);
  const [activeMode, setActiveMode] = useState<'immersive' | 'logic' | 'networks'>('immersive');
  const [loadingImage, setLoadingImage] = useState<Record<number, boolean>>({});
  
  const [showRecall, setShowRecall] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const masterProgress = logger.getMasterProgress();

  useEffect(() => {
    const fetchSyllabus = async () => {
      setLoading(true);
      try {
        const spec = masterProgress.specialization || 'General English';
        const data = await generateVocabularySyllabus(spec);
        if (Array.isArray(data)) {
          const processed = data.map((d, i) => ({ ...d, status: i === 0 ? 'current' : 'locked' as any }));
          setSyllabus(processed);
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchSyllabus();
  }, [masterProgress.specialization]);

  const startUnit = async (unit: VocabularyUnit) => {
    setLoading(true);
    setActiveUnit(unit);
    setView('learning');
    try {
      const data = await generateVocabulary(unit.theme, masterProgress.specialization);
      if (Array.isArray(data)) {
        setWords(data);
        setCurrentIndex(0);
        setShowRecall(false);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    const current = words[currentIndex];
    if (current && !current.imageUrl && !loadingImage[currentIndex]) {
      (async () => {
        setLoadingImage(prev => ({ ...prev, [currentIndex]: true }));
        try {
          const url = await generateImage(current.visualPrompt || current.coreObject);
          if (url) {
            setWords(prev => {
              const updated = [...prev];
              updated[currentIndex] = { ...updated[currentIndex], imageUrl: url };
              return updated;
            });
          }
        } catch (e) { console.error(e); } 
        finally { setLoadingImage(prev => ({ ...prev, [currentIndex]: false })); }
      })();
    }
  }, [currentIndex, words]);

  const playVoice = async (text: string) => {
    if (isPlaying === text) return;
    setIsPlaying(text);
    try {
      if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const ctx = audioContextRef.current;
      const base64 = await getSpeechAudio(text);
      if (base64) {
        const buffer = await decodeAudioData(decode(base64), ctx, 24000, 1);
        const source = ctx.createBufferSource();
        source.buffer = buffer; source.connect(ctx.destination);
        source.onended = () => setIsPlaying(null); source.start();
      } else setIsPlaying(null);
    } catch (e) { setIsPlaying(null); }
  };

  if (loading) return (
    <div className="h-[70vh] flex flex-col items-center justify-center gap-12 animate-in fade-in">
      <div className="relative">
        <div className="w-32 h-32 border-8 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
        <Compass className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-600 animate-pulse" size={48} />
      </div>
      <div className="text-center space-y-4">
        <p className="text-2xl font-black text-slate-800 tracking-tighter">AI 正在根据行业趋势编研词汇大纲...</p>
        <p className="text-slate-400 font-bold uppercase tracking-[0.3em] text-[10px]">SYNCING COGNITIVE PATH FOR {masterProgress.specialization}</p>
      </div>
    </div>
  );

  if (view === 'syllabus') {
    return (
      <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700 pb-20">
        <header className="bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-end gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none rotate-12"><Map size={250} /></div>
          <div className="space-y-6 relative z-10">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-600 p-3 rounded-2xl text-white shadow-xl"><Layout size={24} /></div>
              <div className="bg-indigo-50 px-4 py-1 rounded-full text-[10px] font-black text-indigo-600 uppercase tracking-widest border border-indigo-100">
                Syllabus • 词汇系统大纲
              </div>
            </div>
            <h1 className="text-5xl font-black text-slate-800 tracking-tighter">定制化学习计划 (Planned Units)</h1>
            <p className="text-slate-500 font-medium max-w-2xl text-lg">
              拒绝 A-Z 机械记忆。系统已为您自动匹配 <b>{masterProgress.specialization}</b> 行业最相关的演化词汇流，通过物象关联建立深度认知。
            </p>
          </div>
          <button className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-indigo-600 transition-all shadow-xl active:scale-95"><RefreshCw size={24} /></button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {syllabus.map((unit, i) => (
            <div 
              key={unit.id}
              onClick={() => unit.status !== 'locked' && startUnit(unit)}
              className={`group relative p-10 rounded-[3rem] border-4 transition-all flex flex-col h-full cursor-pointer ${
                unit.status === 'locked' ? 'opacity-40 grayscale border-slate-100 bg-white' : 
                unit.status === 'current' ? 'border-indigo-600 bg-indigo-50 shadow-[0_30px_60px_-15px_rgba(79,70,229,0.2)] scale-105' : 
                'border-slate-50 bg-white hover:border-indigo-200'
              }`}
            >
              <div className="flex justify-between items-start mb-10">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-lg transition-transform group-hover:scale-110 ${unit.status === 'current' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                  {unit.status === 'locked' ? <Lock size={20} /> : `0${i+1}`}
                </div>
              </div>
              <div className="space-y-4 flex-1">
                <div className="space-y-1">
                  <h3 className="text-2xl font-black text-slate-800 tracking-tight group-hover:text-indigo-600 transition-colors">{unit.title}</h3>
                  <p className="text-sm font-bold text-slate-400">{unit.titleCN}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-slate-500 leading-relaxed font-medium line-clamp-2">{unit.description}</p>
                  <p className="text-[11px] text-slate-400 italic font-medium">{unit.descriptionCN}</p>
                </div>
              </div>
              <div className="mt-10 flex items-center gap-3 text-xs font-black uppercase tracking-widest text-indigo-600">
                {unit.status === 'locked' ? '即将开启' : '立即解锁单元'} <ChevronRight size={16} className="group-hover:translate-x-2 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const currentWord = words[currentIndex];

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700 pb-20">
      <header className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-end gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none"><Stars size={200} /></div>
        <div className="space-y-4 relative z-10">
          <button onClick={() => setView('syllabus')} className="text-xs font-black text-slate-400 hover:text-indigo-600 transition-colors uppercase tracking-[0.2em] flex items-center gap-2 mb-2"><ArrowLeft size={16} /> 返回大纲 Syllabus</button>
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-3 rounded-2xl text-white shadow-xl"><Zap size={24} /></div>
            <div className="bg-indigo-50 px-4 py-1 rounded-full text-[10px] font-black text-indigo-600 uppercase tracking-widest border border-indigo-100">
              {activeUnit?.title} • {masterProgress.specialization}
            </div>
          </div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tighter">互动式物象实验室 (Interaction Lab)</h1>
        </div>
        <div className="flex gap-4 relative z-10">
          <div className="bg-slate-50 p-2 rounded-2xl flex gap-1 shadow-inner">
             {['immersive', 'networks', 'logic'].map(mode => (
               <button 
                key={mode} 
                onClick={() => setActiveMode(mode as any)}
                className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${activeMode === mode ? 'bg-white text-indigo-600 shadow-md scale-105' : 'text-slate-400 hover:text-slate-600'}`}
               >
                 {mode === 'immersive' ? '沉浸物象' : mode === 'networks' ? '关联节点' : '逻辑词根'}
               </button>
             ))}
          </div>
        </div>
      </header>

      {currentWord && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-8 space-y-10">
            <div className="bg-white rounded-[4rem] shadow-2xl p-16 border border-slate-100 relative group overflow-hidden">
               <div className="absolute top-0 right-0 p-12 bg-indigo-50/30 rounded-bl-[10rem] flex flex-col items-center">
                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">使用频率 (Weight)</span>
                  <span className="text-2xl font-black text-indigo-600">{currentWord.frequency}</span>
               </div>

               <div className="flex flex-col items-center text-center space-y-10 animate-slide-up">
                  <div className="space-y-4">
                    <span className="text-indigo-600 font-black uppercase tracking-widest text-xs bg-indigo-50 px-6 py-2 rounded-full border border-indigo-100 shadow-sm">{currentWord.pos}</span>
                    <h2 className="text-8xl lg:text-9xl font-black text-slate-800 tracking-tighter hover:scale-105 transition-transform duration-700 cursor-default animate-float">{currentWord.word}</h2>
                    
                    <div className="flex flex-col items-center gap-6 mt-6">
                      {showRecall ? (
                        <div className="animate-in zoom-in duration-300 flex flex-col items-center gap-2">
                          <p className="text-4xl font-black text-indigo-500">{currentWord.translation}</p>
                          <button onClick={() => setShowRecall(false)} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 flex items-center gap-2 mt-2"><EyeOff size={14}/> 隐藏释义 (Hide)</button>
                        </div>
                      ) : (
                        <button onClick={() => setShowRecall(true)} className="px-12 py-5 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] flex items-center gap-4 text-slate-400 hover:border-indigo-600 hover:text-indigo-600 transition-all font-black uppercase text-xs tracking-[0.2em] group shadow-sm">
                          <HelpCircle size={24} className="group-hover:rotate-12 transition-transform" /> 点击挑战记忆 (Recall)
                        </button>
                      )}

                      <div className="flex items-center justify-center gap-6">
                        <div className="flex items-center gap-3 italic font-medium text-slate-400 bg-slate-50 px-6 py-3 rounded-2xl border border-slate-100 text-xl tracking-wider">
                          {currentWord.phonetic}
                          <button onClick={() => playVoice(currentWord.word)} className="p-2 hover:bg-white rounded-lg transition-colors"><Volume2 size={18} /></button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="w-full h-px bg-slate-100 my-4 shadow-inner" />

                  {/* 模式一：沉浸物象 */}
                  {activeMode === 'immersive' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center animate-in fade-in zoom-in-95 duration-500 text-left">
                       <div className="rounded-[3rem] overflow-hidden shadow-2xl border-4 border-slate-50 relative aspect-square bg-slate-50 flex items-center justify-center group/img">
                          {loadingImage[currentIndex] ? (
                            <div className="flex flex-col items-center gap-4 text-slate-300 animate-pulse">
                              <Loader2 className="animate-spin" size={48} />
                              <span className="text-[10px] font-black uppercase tracking-widest">具象化核心物象中...</span>
                            </div>
                          ) : currentWord.imageUrl ? (
                            <>
                              <img src={currentWord.imageUrl} className="w-full h-full object-cover transition-transform duration-[12s] hover:scale-110" alt="core object" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                 <div className="bg-white text-slate-900 px-8 py-4 rounded-[2rem] font-black text-sm uppercase shadow-2xl flex flex-col items-center gap-1">
                                    <span className="flex items-center gap-2"><Eye size={18}/> {currentWord.coreObject}</span>
                                    <span className="text-[10px] text-slate-400">{currentWord.coreObjectCN}</span>
                                 </div>
                              </div>
                            </>
                          ) : <LucideImage size={64} className="text-slate-200" />}
                       </div>
                       <div className="space-y-8">
                          <div className="space-y-3">
                             <div className="flex items-center gap-3 text-indigo-600 font-black text-xs uppercase tracking-widest">
                                <Compass size={18} /> {currentWord.sceneTitle} <span className="text-slate-300">({currentWord.sceneTitleCN})</span>
                             </div>
                             <div className="space-y-2 border-l-8 border-indigo-100 pl-8">
                               <p className="text-xl text-slate-700 leading-relaxed font-bold italic">“{currentWord.sceneDescription}”</p>
                               <p className="text-sm text-slate-400 font-medium leading-relaxed">{currentWord.sceneDescriptionCN}</p>
                             </div>
                          </div>
                          <div className="p-10 bg-slate-900 rounded-[2.5rem] border border-slate-800 text-white space-y-6 shadow-2xl relative overflow-hidden group/card">
                             <div className="absolute top-0 right-0 p-8 opacity-10 group-hover/card:scale-110 transition-transform"><PlayCircle size={100} /></div>
                             <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2 relative z-10">场景应用例句</h4>
                             <div className="space-y-4 relative z-10">
                               <p className="text-2xl font-black leading-snug">"{currentWord.example}"</p>
                               <p className="text-sm font-bold text-slate-500 border-t border-white/10 pt-4">{currentWord.exampleTranslation}</p>
                             </div>
                             <button onClick={() => playVoice(currentWord.example)} className="absolute bottom-6 right-6 p-4 bg-white/10 rounded-2xl hover:bg-indigo-600 transition-all z-10 shadow-lg active:scale-90"><Volume2 size={24}/></button>
                          </div>
                       </div>
                    </div>
                  )}

                  {/* 模式二：关联节点 */}
                  {activeMode === 'networks' && (
                    <div className="w-full py-10 space-y-16 animate-in slide-in-from-bottom-4 duration-500">
                       <div className="flex flex-col items-center gap-4">
                          <div className="w-24 h-24 rounded-full bg-indigo-600 text-white flex items-center justify-center font-black text-2xl shadow-[0_0_50px_rgba(79,70,229,0.4)] ring-8 ring-indigo-50 animate-bounce">{currentWord.word}</div>
                          <div className="h-16 w-1 bg-gradient-to-b from-indigo-200 to-transparent shadow-lg" />
                       </div>
                       <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                          {[
                            { title: '反义逻辑', items: currentWord.associations.antonyms, icon: <AlertTriangle size={18} />, color: 'rose' },
                            { title: '派生演化', items: currentWord.associations.derivatives, icon: <GitBranch size={18} />, color: 'indigo' },
                            { title: '同义共鸣', items: currentWord.associations.synonyms, icon: <Zap size={18} />, color: 'emerald' }
                          ].map((group, idx) => (
                            <div key={idx} className="space-y-6">
                               <h5 className={`text-${group.color}-500 font-black text-xs uppercase tracking-[0.3em] flex items-center gap-3 justify-center`}>{group.icon} {group.title}</h5>
                               <div className="grid grid-cols-1 gap-4">
                                 {group.items.map((item: any, i: number) => (
                                   <div key={i} className={`p-6 bg-${group.color}-50 rounded-[2rem] border-2 border-${group.color}-100 text-${group.color}-800 font-black text-lg flex flex-col items-center hover:scale-110 transition-transform cursor-pointer group shadow-sm hover:shadow-xl`} onClick={() => playVoice(item.word)}>
                                     {item.word}
                                     <span className="text-[10px] font-bold opacity-60 mt-1">{item.translation || item.meaning}</span>
                                   </div>
                                 ))}
                               </div>
                            </div>
                          ))}
                       </div>
                    </div>
                  )}

                  {/* 模式三：逻辑词根 */}
                  {activeMode === 'logic' && (
                    <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-10 animate-in fade-in duration-500 text-left">
                       <div className="p-12 bg-amber-50 rounded-[3.5rem] border border-amber-100 space-y-6 relative overflow-hidden group hover:shadow-2xl transition-all">
                          <div className="absolute -bottom-10 -right-10 text-amber-200 opacity-20 rotate-12 transition-transform group-hover:scale-110"><Stars size={250} /></div>
                          <h4 className="text-amber-600 font-black text-xs uppercase tracking-[0.3em] flex items-center gap-3"><Zap size={20} /> 联想助记钩子 (Mnemonic)</h4>
                          <div className="space-y-4 relative z-10">
                            <p className="text-3xl font-black text-amber-900 leading-relaxed italic">“{currentWord.mnemonic}”</p>
                            <p className="text-sm font-bold text-amber-600/70 border-t border-amber-100 pt-4">{currentWord.mnemonicCN}</p>
                          </div>
                       </div>
                       <div className="p-12 bg-slate-900 rounded-[3.5rem] text-white space-y-6 relative overflow-hidden group hover:shadow-2xl transition-all">
                          <div className="absolute top-0 right-0 p-10 opacity-5 transition-transform group-hover:scale-110"><Layers size={200} /></div>
                          <h4 className="text-indigo-400 font-black text-xs uppercase tracking-[0.3em] flex items-center gap-3"><LinkIcon size={20} /> 词根透视与本源 (Roots)</h4>
                          <div className="space-y-4 relative z-10">
                            <p className="text-2xl font-bold leading-relaxed text-slate-300">{currentWord.roots}</p>
                            <p className="text-sm font-bold text-indigo-400/70 border-t border-white/10 pt-4">{currentWord.rootsCN}</p>
                          </div>
                          <button className="absolute bottom-10 right-10 p-4 bg-white/10 rounded-2xl hover:bg-indigo-600 transition-all z-10 shadow-lg active:scale-90"><Search size={24}/></button>
                       </div>
                    </div>
                  )}
               </div>

               <div className="mt-20 flex gap-6 pt-12 border-t border-slate-50">
                  <button 
                    disabled={currentIndex === 0} 
                    onClick={() => { setCurrentIndex(currentIndex - 1); setShowRecall(false); }}
                    className="p-8 rounded-[2.5rem] border-2 border-slate-100 text-slate-300 hover:bg-slate-50 hover:border-slate-200 disabled:opacity-20 transition-all flex items-center gap-4 font-black uppercase text-xs tracking-[0.2em]"
                  >
                    <ChevronLeft size={24} /> 上一个 (Prev)
                  </button>
                  <button 
                    onClick={() => {
                      if (currentIndex < words.length - 1) { setCurrentIndex(currentIndex + 1); setShowRecall(false); }
                      else setView('syllabus');
                    }}
                    className="flex-1 py-8 rounded-[2.5rem] bg-slate-900 text-white font-black text-2xl shadow-[0_20px_50px_-15px_rgba(15,23,42,0.4)] flex items-center justify-center gap-6 hover:bg-indigo-600 transition-all active:scale-95 group"
                  >
                    {currentIndex === words.length - 1 ? '单元认知达成' : '解锁下一个物象'} 
                    <ChevronRight size={32} className="group-hover:translate-x-3 transition-transform" />
                  </button>
               </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-10">
            <section className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-xl space-y-10">
              <div className="flex items-center justify-between">
                 <h3 className="text-xl font-black text-slate-800 flex items-center gap-3"><Box className="text-indigo-600" /> 单元认知库</h3>
                 <span className="text-[10px] font-black text-indigo-400 bg-indigo-50 px-3 py-1 rounded-full">{currentIndex + 1} / {words.length}</span>
              </div>
              <div className="space-y-4">
                 {words.map((w, i) => (
                   <div 
                    key={i} 
                    onClick={() => { setCurrentIndex(i); setShowRecall(false); }}
                    className={`p-6 rounded-[2rem] border-2 transition-all cursor-pointer flex items-center justify-between group ${currentIndex === i ? 'bg-indigo-600 border-indigo-600 shadow-xl' : 'bg-slate-50 border-transparent hover:bg-white hover:border-indigo-100'}`}
                   >
                     <div className="flex items-center gap-5">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black transition-all ${currentIndex === i ? 'bg-white text-indigo-600 shadow-lg scale-110 rotate-3' : 'bg-slate-200 text-slate-400'}`}>{i + 1}</div>
                        <div className="flex flex-col">
                           <span className={`font-black text-lg tracking-tight ${currentIndex === i ? 'text-white' : 'text-slate-800'}`}>{w.word}</span>
                           <span className={`text-[11px] font-bold ${currentIndex === i ? 'text-indigo-200' : 'text-slate-400'}`}>{w.translation}</span>
                        </div>
                     </div>
                     <ChevronRight size={20} className={`${currentIndex === i ? 'text-white' : 'text-slate-200 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all'}`} />
                   </div>
                 ))}
              </div>
            </section>

            <section className="bg-slate-900 p-12 rounded-[4rem] text-white shadow-xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform"><Target size={180} /></div>
               <div className="space-y-8 relative z-10">
                  <h3 className="text-xl font-black flex items-center gap-3"><Zap className="text-amber-400" /> 学习内化评估</h3>
                  <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/10 space-y-6">
                     <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-indigo-400">
                           <span>语义深度 Semantic Depth</span>
                           <span>{Math.round((currentIndex + 1) / words.length * 100)}%</span>
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden shadow-inner">
                           <div className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 transition-all duration-1000" style={{ width: `${(currentIndex + 1) / words.length * 100}%` }} />
                        </div>
                     </div>
                     <div className="space-y-2">
                        <p className="text-[11px] text-slate-400 leading-relaxed font-bold italic">“系统分析显示：您对 <span className="text-white">{currentWord.coreObject}</span> ({currentWord.coreObjectCN}) 的认知锚点已建立。建议下一步进入‘影子跟读’模块内化。”</p>
                     </div>
                  </div>
                  <button onClick={() => onNavigate?.(LearningModule.SPEAKING)} className="w-full py-5 bg-indigo-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl flex items-center justify-center gap-3">口语进阶 (Speaking Lab) <ChevronRight size={16}/></button>
               </div>
            </section>
          </div>
        </div>
      )}
    </div>
  );
};

export default VocabularyView;
