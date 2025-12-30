
import React, { useState, useRef } from 'react';
import { generateGrammarLesson, generateGrammarQuiz, getSpeechAudio } from '../services/geminiService';
import { GrammarLesson, GrammarQuiz } from '../types';
import { 
  Loader2, 
  BookOpen, 
  Lightbulb, 
  CheckCircle2, 
  ChevronRight, 
  ArrowLeft,
  Stars,
  Play,
  HelpCircle,
  Puzzle,
  Zap,
  Layout,
  Trophy,
  Volume2,
  Layers,
  Search,
  BookMarked,
  Info,
  Quote
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

const GrammarView: React.FC = () => {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [lesson, setLesson] = useState<GrammarLesson | null>(null);
  const [quizzes, setQuizzes] = useState<GrammarQuiz[]>([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'topics' | 'lesson' | 'quiz'>('topics');
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isPlaying, setIsPlaying] = useState<string | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);

  const playText = async (text: string) => {
    if (isPlaying === text) return;
    setIsPlaying(text);
    try {
      if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const ctx = audioContextRef.current;
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

  const startLesson = async (topicId: string) => {
    setSelectedTopic(topicId);
    setLoading(true);
    setView('lesson');
    try {
      const topicTitle = GRAMMAR_TOPICS.find(t => t.id === topicId)?.title || topicId;
      const data = await generateGrammarLesson(topicTitle);
      if (data && data.structureBreakdown) {
        setLesson(data);
      } else {
        throw new Error("Invalid lesson data");
      }
    } catch (e) {
      console.error(e);
      setView('topics');
    } finally {
      setLoading(false);
    }
  };

  const startQuiz = async () => {
    if (!selectedTopic) return;
    setLoading(true);
    setView('quiz');
    setQuizIndex(0);
    setQuizScore(0);
    setQuizFinished(false);
    setSelectedOption(null);
    setShowExplanation(false);
    try {
      const topicTitle = GRAMMAR_TOPICS.find(t => t.id === selectedTopic)?.title || selectedTopic;
      const data = await generateGrammarQuiz(topicTitle);
      if (data && data.length > 0) {
        setQuizzes(data);
      } else {
        throw new Error("No quiz data");
      }
    } catch (e) {
      console.error(e);
      setView('lesson');
    } finally {
      setLoading(false);
    }
  };

  const handleQuizAnswer = (optionIdx: number) => {
    if (selectedOption !== null) return;
    setSelectedOption(optionIdx);
    if (optionIdx === quizzes[quizIndex]?.correctAnswer) setQuizScore(prev => prev + 1);
    setShowExplanation(true);
  };

  const nextQuiz = () => {
    if (quizIndex < (quizzes?.length || 0) - 1) {
      setQuizIndex(prev => prev + 1);
      setSelectedOption(null);
      setShowExplanation(false);
    } else {
      setQuizFinished(true);
    }
  };

  const GRAMMAR_TOPICS = [
    { id: 'sentence-structure', title: '句子基本结构', description: '解构英语句子的底层逻辑', level: 'Level 1' },
    { id: 'tenses-overview', title: '时态宇宙', description: '时空逻辑在动词中的映射', level: 'Level 1' },
    { id: 'passive-voice', title: '被动语态', description: '动作承受者的表达艺术', level: 'Level 2' },
    { id: 'clauses', title: '从句的嵌套艺术', description: '逻辑链条的无限延伸', level: 'Level 3' }
  ];

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-6">
        <div className="relative">
          <Loader2 className="animate-spin text-indigo-600" size={64} />
          <Stars className="absolute -top-2 -right-2 text-amber-400 animate-float" size={24} />
        </div>
        <p className="text-slate-500 font-black uppercase tracking-widest text-sm animate-pulse text-center">
          AI 导师正在编研逻辑讲义...<br/>
          <span className="text-[10px] opacity-60">SYNTACTIC LOGIC GENERATION</span>
        </p>
      </div>
    );
  }

  if (view === 'topics') {
    return (
      <div className="max-w-6xl mx-auto space-y-12 pb-20 animate-slide-up">
        <header className="space-y-4">
          <div className="bg-indigo-600 w-fit p-3 rounded-2xl text-white shadow-xl mb-4"><Zap size={32} /></div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tighter">语法实验室 (Grammar Lab)</h1>
          <p className="text-slate-500 max-w-2xl text-lg leading-relaxed font-medium">
            我们不仅仅教授规则，更旨在重构您的双语逻辑映射。
          </p>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {GRAMMAR_TOPICS.map((topic) => (
            <button key={topic.id} onClick={() => startLesson(topic.id)} className="group bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:border-indigo-200 transition-all text-left relative overflow-hidden flex flex-col h-full active:scale-95">
              <div className="mb-6 flex justify-between items-start">
                <div className="bg-slate-50 p-4 rounded-2xl text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors"><BookOpen size={24} /></div>
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{topic.level}</span>
              </div>
              <h3 className="text-xl font-black text-slate-800 mb-2 group-hover:text-indigo-600 transition-colors">{topic.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-8 font-bold">{topic.description}</p>
              <div className="mt-auto flex items-center gap-2 text-xs font-black text-indigo-600 uppercase tracking-widest">进入深度解构 <ChevronRight size={14} /></div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (view === 'lesson' && lesson) {
    return (
      <div className="max-w-5xl mx-auto space-y-8 animate-slide-up pb-20">
        <button onClick={() => setView('topics')} className="flex items-center gap-2 text-slate-400 hover:text-slate-800 font-black text-xs uppercase tracking-widest transition-all"><ArrowLeft size={16} /> 返回路径</button>
        <div className="bg-white rounded-[3.5rem] shadow-2xl p-12 border border-slate-100 space-y-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none -rotate-12 translate-x-12 -translate-y-12"><Layers size={300} /></div>
          <header className="space-y-6 relative z-10">
            <h2 className="text-5xl font-black text-slate-800 tracking-tighter">{lesson.title}</h2>
            <div className="p-10 bg-indigo-50/50 rounded-[3rem] border border-indigo-100 space-y-4">
               <div className="flex items-center gap-3"><Info className="text-indigo-600" size={20} /><h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">核心哲学 (The Logic)</h4></div>
               <p className="text-xl text-slate-800 leading-relaxed font-black">{lesson.concept}</p>
            </div>
            <div className="p-10 bg-amber-50 rounded-[3rem] border border-amber-100 relative group">
               <div className="flex items-center gap-3 mb-4"><Puzzle className="text-amber-500" size={20} /><h4 className="text-[10px] font-black text-amber-600 uppercase tracking-[0.2em]">形象化类比 (Analogy)</h4></div>
               <p className="text-xl text-amber-900 font-black leading-tight italic">"{lesson.analogy}"</p>
            </div>
          </header>

          <section className="space-y-8">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3"><Layers size={18} className="text-indigo-600" /> 句法逻辑透视 (Syntactic Mapping)</h4>
            <div className="space-y-8">
              {lesson.structureBreakdown.map((item, idx) => (
                <div key={idx} className="bg-slate-50 p-10 rounded-[3rem] border border-slate-100 space-y-8 hover:bg-white hover:shadow-xl transition-all duration-500 group">
                  <div className="space-y-3">
                    <div className="inline-flex px-4 py-1.5 bg-indigo-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest mb-2 shadow-lg">{item.sentenceType}</div>
                    <div className="text-3xl font-black text-slate-800 mb-4 tracking-tight leading-tight">{item.sentence}</div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                    {Object.entries(item.analysis).map(([key, val]) => (
                      <div key={key} className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm">
                        <div className="text-[9px] font-black text-indigo-400 uppercase mb-2 tracking-widest">{key}</div>
                        <div className="font-black text-slate-800 text-lg">{val as string || '-'}</div>
                      </div>
                    ))}
                  </div>
                  <div className="pt-4 border-t border-slate-200/50 space-y-4">
                     <p className="text-sm text-slate-600 leading-relaxed italic"><span className="font-black text-indigo-600 mr-2">导师分析:</span> {item.explanation}</p>
                     {item.collocationTip && <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 text-xs text-emerald-800 font-bold flex items-center gap-2"><BookMarked size={14}/> {item.collocationTip}</div>}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {lesson.rules.map((rule, idx) => (
              <div key={idx} className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all">
                <h5 className="font-black text-xl text-slate-800 mb-4 flex items-center gap-4"><div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black shadow-lg">0{idx+1}</div>{rule.title}</h5>
                <p className="text-slate-600 leading-relaxed font-bold">{rule.content}</p>
              </div>
            ))}
          </div>
          <button onClick={startQuiz} className="w-full py-8 bg-slate-900 text-white rounded-[2.5rem] font-black text-2xl hover:bg-indigo-600 transition-all flex items-center justify-center gap-6 shadow-2xl active:scale-95 group">进入逻辑实验室测验 <Zap size={32} className="group-hover:animate-pulse" /></button>
        </div>
      </div>
    );
  }

  if (view === 'quiz' && quizzes.length > 0) {
    if (quizFinished) {
      return (
        <div className="max-w-2xl mx-auto py-12 animate-slide-up">
          <div className="bg-white rounded-[4rem] shadow-2xl p-16 text-center border border-slate-100 relative overflow-hidden">
             <div className="w-24 h-24 bg-emerald-50 rounded-[2rem] flex items-center justify-center text-emerald-500 mx-auto mb-8 shadow-inner animate-float"><Trophy size={48} /></div>
             <h2 className="text-4xl font-black text-slate-800 mb-2 tracking-tighter">评估任务达成！</h2>
             <p className="text-slate-500 mb-10 font-bold text-lg">您的语法逻辑掌握度: <span className="text-indigo-600 text-2xl font-black">{Math.round((quizScore / quizzes.length) * 100)}%</span></p>
             <div className="flex gap-4">
               <button onClick={() => setView('topics')} className="flex-1 py-5 rounded-2xl border-2 border-slate-100 font-black text-slate-600 hover:bg-slate-50 transition-all">返回列表</button>
               <button onClick={startQuiz} className="flex-1 py-5 rounded-2xl bg-slate-900 text-white font-black hover:bg-indigo-600 transition-all shadow-xl">再次强化</button>
             </div>
          </div>
        </div>
      );
    }

    const currentQuiz = quizzes[quizIndex];
    return (
      <div className="max-w-4xl mx-auto py-12 space-y-8 animate-slide-up">
        <div className="bg-white rounded-[3rem] shadow-2xl p-12 border border-slate-100 space-y-10 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Logic Quest • {quizIndex + 1} / {quizzes.length}</span>
            <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-indigo-500 transition-all" style={{ width: `${((quizIndex + 1) / quizzes.length) * 100}%` }} /></div>
          </div>
          <div className="text-center space-y-6">
            <h3 className="text-3xl font-black text-slate-800 leading-tight">{currentQuiz.question}</h3>
            <button onClick={() => playText(currentQuiz.question)} className="p-4 bg-slate-50 rounded-2xl text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all shadow-sm active:scale-90"><Volume2 size={32} /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {currentQuiz.options.map((option, idx) => (
              <button key={idx} onClick={() => handleQuizAnswer(idx)} className={`w-full p-8 rounded-[2rem] border-4 text-left transition-all font-black text-lg flex items-center justify-between group ${selectedOption === null ? 'border-slate-50 bg-slate-50/50 hover:border-indigo-600 hover:bg-white hover:shadow-xl' : idx === currentQuiz.correctAnswer ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : idx === selectedOption ? 'border-rose-500 bg-rose-50 text-rose-700' : 'border-slate-50 opacity-50'}`}>
                <div className="flex items-center gap-6"><div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${selectedOption === null ? 'bg-indigo-100 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white' : 'bg-white/50'}`}>{String.fromCharCode(65 + idx)}</div>{option}</div>
                {selectedOption !== null && idx === currentQuiz.correctAnswer && <CheckCircle2 size={24} className="text-emerald-500" />}
              </button>
            ))}
          </div>
          {showExplanation && (
            <div className="animate-slide-up space-y-8 pt-10 border-t-2 border-slate-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="p-8 bg-indigo-50 rounded-[2.5rem] border-2 border-indigo-100 space-y-4">
                  <h5 className="flex items-center gap-3 text-indigo-700 font-black text-[10px] uppercase tracking-widest"><Search size={16} /> 逻辑深挖 (Logical Analysis)</h5>
                  <p className="text-sm text-indigo-950 leading-relaxed font-bold">{currentQuiz.detailedAnalysis.logic}</p>
                </div>
                <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white space-y-4">
                  <h5 className="flex items-center gap-3 text-indigo-400 font-black text-[10px] uppercase tracking-widest"><Layers size={16} /> 句法结构 (Syntactic Map)</h5>
                  <p className="font-mono text-xs leading-relaxed text-slate-300">{currentQuiz.detailedAnalysis.structure}</p>
                </div>
              </div>
              <button onClick={nextQuiz} className="w-full py-6 bg-indigo-600 text-white rounded-[2rem] font-black hover:bg-indigo-700 transition-all flex items-center justify-center gap-4 shadow-2xl text-xl">继续探索 <ChevronRight size={24}/></button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
};

export default GrammarView;
