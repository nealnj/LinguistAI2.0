
import React, { useState, useEffect, useRef } from 'react';
import { generateVocabulary, getSpeechAudio, generateImage } from '../services/geminiService';
import { VocabularyWord, LearningModule } from '../types';
import { 
  Loader2, RefreshCw, Volume2, Check, Sparkles, ChevronRight, ChevronLeft, Puzzle, Zap, GitBranch, Search, BookOpen, AlertCircle, Info, Stars, Layout, Layers, Calendar, AlertTriangle 
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
  const [words, setWords] = useState<VocabularyWord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'systematic' | 'memory' | 'info'>('systematic');
  const [audioCache, setAudioCache] = useState<Record<string, AudioBuffer>>({});
  const [reviewMode, setReviewMode] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [reviewFeedback, setReviewFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [loadingImage, setLoadingImage] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);

  const fetchWords = async () => {
    setLoading(true); setError(null); setAudioCache({}); setReviewMode(false);
    try {
      const newWords = await generateVocabulary('Academic Core');
      if (newWords?.length > 0) { setWords(newWords); setCurrentIndex(0); }
      else setError("AI 导师同步失败，请重试。");
    } catch (e: any) { setError(e.message || "词源库同步中断。"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchWords(); }, []);

  useEffect(() => {
    const current = words[currentIndex];
    if (current && !current.imageUrl && !loadingImage) {
      (async () => {
        setLoadingImage(true);
        try {
          const url = await generateImage(current.visualPrompt || current.word);
          if (url) setWords(prev => {
            const updated = [...prev];
            updated[currentIndex] = { ...updated[currentIndex], imageUrl: url };
            return updated;
          });
        } catch (e) {} finally { setLoadingImage(false); }
      })();
    }
  }, [currentIndex, words]);

  const playPronunciation = async (text: string) => {
    if (isPlaying === text) return;
    setIsPlaying(text);
    try {
      if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const ctx = audioContextRef.current;
      let buffer = audioCache[text];
      if (!buffer) {
        const base64 = await getSpeechAudio(text);
        if (base64) {
          buffer = await decodeAudioData(decode(base64), ctx, 24000, 1);
          setAudioCache(prev => ({ ...prev, [text]: buffer }));
        }
      }
      if (buffer) {
        const source = ctx.createBufferSource();
        source.buffer = buffer; source.connect(ctx.destination);
        source.onended = () => setIsPlaying(null);
        source.start();
      } else setIsPlaying(null);
    } catch (e) { setIsPlaying(null); }
  };

  const handleNext = () => {
    if (currentIndex < words.length - 1) { setCurrentIndex(currentIndex + 1); setUserInput(''); }
    else setReviewMode(true);
  };

  const checkReview = () => {
    const currentWord = words[currentIndex];
    if (!currentWord) return;
    if (userInput.toLowerCase().trim() === currentWord.word.toLowerCase().trim()) {
      setReviewFeedback('correct');
      setTimeout(() => {
        setReviewFeedback(null);
        if (currentIndex < words.length - 1) { setCurrentIndex(currentIndex + 1); setUserInput(''); }
        else { setReviewMode(false); onNavigate?.(LearningModule.DASHBOARD); }
      }, 1000);
    } else {
      setReviewFeedback('wrong');
      setTimeout(() => setReviewFeedback(null), 1000);
    }
  };

  if (loading) return (
    <div className="h-full flex flex-col items-center justify-center gap-6 px-4">
      <Loader2 className="animate-spin text-indigo-600" size={48} />
      <p className="text-slate-500 font-black uppercase tracking-widest text-[10px] text-center">同步全球词源库...</p>
    </div>
  );

  if (error && words.length === 0) return (
    <div className="h-full flex flex-col items-center justify-center gap-6 p-6">
      <AlertTriangle className="text-rose-500" size={48} />
      <p className="text-slate-500 text-sm text-center">{error}</p>
      <button onClick={fetchWords} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold">重新同步</button>
    </div>
  );

  const currentWord = words[currentIndex];

  if (reviewMode && currentWord) return (
    <div className="max-w-xl mx-auto py-8 lg:py-12 px-4 animate-slide-up">
      <div className="bg-white rounded-[2.5rem] lg:rounded-[3.5rem] shadow-2xl p-8 lg:p-12 border border-slate-100 text-center space-y-8">
        <h2 className="text-3xl lg:text-5xl font-black text-slate-800 tracking-tighter">{currentWord.translation}</h2>
        <input autoFocus value={userInput} onChange={(e) => setUserInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && checkReview()} placeholder="输入英文单词..." className={`w-full bg-slate-50 border-4 rounded-2xl p-6 text-center text-2xl lg:text-4xl font-black outline-none transition-all ${reviewFeedback === 'correct' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : reviewFeedback === 'wrong' ? 'border-rose-500 bg-rose-50 text-rose-700' : 'border-slate-100 focus:border-indigo-600'}`} />
        <button onClick={checkReview} className="w-full py-5 bg-indigo-600 text-white font-black rounded-2xl shadow-xl">验证拼写</button>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 lg:gap-8 animate-in fade-in duration-700 pb-20">
      <div className="bg-white px-6 lg:px-10 py-4 lg:py-6 rounded-2xl lg:rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3 lg:gap-6">
          <div className="bg-indigo-600 p-2 lg:p-4 rounded-xl text-white shadow-lg"><BookOpen size={20} /></div>
          <div>
            <h1 className="text-sm lg:text-2xl font-black text-slate-800">词汇实验室</h1>
            <p className="text-slate-400 text-[8px] lg:text-[10px] font-black uppercase tracking-widest">Progress: {currentIndex + 1}/{words.length}</p>
          </div>
        </div>
        <button onClick={fetchWords} className="p-2 text-slate-400 hover:text-slate-800"><RefreshCw size={18} /></button>
      </div>

      {currentWord && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          <div className="lg:col-span-7 space-y-6 lg:space-y-8">
            <div className="bg-white rounded-[2.5rem] lg:rounded-[4rem] shadow-xl p-8 lg:p-16 border border-slate-100 text-center space-y-6">
              <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[8px] lg:text-[10px] font-black rounded-full uppercase">{currentWord.pos}</span>
              <h2 className="text-5xl lg:text-8xl font-black text-slate-800 tracking-tighter">{currentWord.word}</h2>
              <p className="text-2xl lg:text-4xl font-black text-indigo-600">{currentWord.translation}</p>
              
              <div className="flex items-center justify-center gap-4">
                <span className="italic font-medium text-slate-500 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">{currentWord.phonetic}</span>
                <button onClick={() => playPronunciation(currentWord.word)} className="p-4 bg-indigo-600 text-white rounded-2xl shadow-lg active:scale-90"><Volume2 size={24} /></button>
              </div>

              {currentWord.imageUrl && <div className="rounded-[2rem] overflow-hidden shadow-inner border border-slate-50 min-h-[200px] lg:min-h-[400px]"><img src={currentWord.imageUrl} className="w-full h-auto object-cover" alt="visual mnemonic" /></div>}

              <div className="bg-slate-50 p-6 lg:p-10 rounded-[2rem] lg:rounded-[3rem] text-left space-y-4">
                <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">学术语境</h4>
                <p className="text-xl lg:text-2xl italic text-slate-800 font-black">"{currentWord.example}"</p>
                <p className="text-slate-500 font-bold">{currentWord.exampleTranslation}</p>
              </div>

              <div className="flex gap-4">
                <button disabled={currentIndex === 0} onClick={() => setCurrentIndex(currentIndex - 1)} className="p-5 lg:p-7 rounded-2xl lg:rounded-[2rem] border border-slate-100 text-slate-300 disabled:opacity-20"><ChevronLeft size={24} /></button>
                <button onClick={handleNext} className="flex-1 py-5 lg:py-7 rounded-2xl lg:rounded-[2rem] bg-slate-900 text-white font-black text-lg lg:text-xl shadow-2xl flex items-center justify-center gap-3">{currentIndex === words.length - 1 ? '复现练习' : '下一词'} <ChevronRight size={24} /></button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-6 lg:space-y-8">
            <div className="bg-white rounded-[2rem] lg:rounded-[3rem] shadow-lg overflow-hidden flex flex-col border border-slate-100">
              <div className="flex bg-slate-50/50 p-2 gap-2">
                {['systematic', 'memory', 'info'].map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab as any)} className={`flex-1 py-3 lg:py-4 rounded-xl text-[8px] lg:text-[10px] font-black uppercase transition-all ${activeTab === tab ? 'bg-white text-indigo-600 shadow-md border border-indigo-50' : 'text-slate-400'}`}>
                    {tab === 'systematic' ? '形态' : tab === 'memory' ? '关联' : '词根'}
                  </button>
                ))}
              </div>
              <div className="p-6 lg:p-10 space-y-6 max-h-[400px] lg:max-h-[600px] overflow-y-auto scrollbar-hide">
                {activeTab === 'systematic' && currentWord.forms?.map((f, i) => (
                  <div key={i} className="bg-indigo-50/30 p-6 rounded-2xl border border-indigo-100/50 space-y-3">
                    <div className="flex justify-between font-black">
                      <span className="text-lg lg:text-xl text-indigo-700">{f.form}</span>
                      <span className="text-[8px] lg:text-[10px] text-indigo-400 uppercase bg-white px-2 py-1 rounded-full">{f.pos}</span>
                    </div>
                    <p className="text-xs lg:text-sm text-slate-800 font-bold">{f.meaning}</p>
                    <p className="text-[10px] text-slate-500 italic">"{f.example}"</p>
                  </div>
                ))}
                {activeTab === 'info' && (
                  <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100 space-y-4">
                    <span className="text-[8px] lg:text-[10px] font-black text-amber-600 uppercase tracking-widest">逻辑助记</span>
                    <p className="text-sm lg:text-lg text-amber-900 font-black leading-tight">{currentWord.mnemonic}</p>
                    <div className="pt-4 border-t border-amber-100 flex gap-4">
                      <div className="bg-white px-3 py-1 rounded-lg text-xs font-black"><span className="text-indigo-600">根:</span> {currentWord.roots}</div>
                      <div className="bg-white px-3 py-1 rounded-lg text-xs font-black"><span className="text-purple-600">缀:</span> {currentWord.affixes}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VocabularyView;
