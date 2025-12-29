
import React, { useState, useEffect } from 'react';
import { generateGrammarLesson, generateGrammarQuiz } from '../services/geminiService';
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
  Trophy
} from 'lucide-react';

const GRAMMAR_TOPICS = [
  { id: 'sentence-structure', title: '句子基本结构', description: '揭秘英语句子的"主谓宾"逻辑', level: 'Level 1' },
  { id: 'tenses-overview', title: '时态宇宙', description: '过去、现在与未来的时空逻辑', level: 'Level 1' },
  { id: 'passive-voice', title: '被动语态', description: '动作承受者的主场秀', level: 'Level 2' },
  { id: 'clauses', title: '从句大爆发', description: '定语、状语与宾语从句的嵌套艺术', level: 'Level 3' },
  { id: 'infinitives', title: '非谓语动词', description: '动词的华丽变身', level: 'Level 3' }
];

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

  const startLesson = async (topicId: string) => {
    setSelectedTopic(topicId);
    setLoading(true);
    setView('lesson');
    try {
      const topic = GRAMMAR_TOPICS.find(t => t.id === topicId)?.title || topicId;
      const data = await generateGrammarLesson(topic);
      setLesson(data);
    } catch (e) {
      console.error(e);
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
      const topic = GRAMMAR_TOPICS.find(t => t.id === selectedTopic)?.title || selectedTopic;
      const data = await generateGrammarQuiz(topic);
      setQuizzes(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleQuizAnswer = (optionIdx: number) => {
    if (selectedOption !== null) return;
    setSelectedOption(optionIdx);
    if (optionIdx === quizzes[quizIndex].correctAnswer) {
      setQuizScore(prev => prev + 1);
    }
    setShowExplanation(true);
  };

  const nextQuiz = () => {
    if (quizIndex < quizzes.length - 1) {
      setQuizIndex(prev => prev + 1);
      setSelectedOption(null);
      setShowExplanation(false);
    } else {
      setQuizFinished(true);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-6">
        <div className="relative">
          <Loader2 className="animate-spin text-indigo-600" size={64} />
          <Stars className="absolute -top-2 -right-2 text-amber-400 animate-float" size={24} />
        </div>
        <p className="text-slate-500 font-black uppercase tracking-widest text-sm animate-pulse">正在解析语法逻辑...</p>
      </div>
    );
  }

  if (view === 'topics') {
    return (
      <div className="max-w-6xl mx-auto space-y-12 pb-20 animate-slide-up">
        <header className="space-y-4">
          <div className="bg-indigo-600 w-fit p-3 rounded-2xl text-white shadow-xl mb-4"><Zap size={32} /></div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tighter">语法实验室 (Grammar Lab)</h1>
          <p className="text-slate-500 max-w-2xl text-lg leading-relaxed">
            告别死记硬背！我们用中国人最容易理解的方式，系统拆解英语底层逻辑。
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {GRAMMAR_TOPICS.map((topic, idx) => (
            <button 
              key={topic.id}
              onClick={() => startLesson(topic.id)}
              className="group bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:border-indigo-200 transition-all text-left relative overflow-hidden flex flex-col h-full active:scale-95 animate-slide-up"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <div className="mb-6 flex justify-between items-start">
                <div className="bg-slate-50 p-4 rounded-2xl text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                  <BookOpen size={24} />
                </div>
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{topic.level}</span>
              </div>
              <h3 className="text-xl font-black text-slate-800 mb-2 group-hover:text-indigo-600 transition-colors">{topic.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-8">{topic.description}</p>
              <div className="mt-auto flex items-center gap-2 text-xs font-black text-indigo-600 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                开始探索 <ChevronRight size={14} />
              </div>
              <div className="absolute -bottom-6 -right-6 text-slate-50 opacity-10 group-hover:scale-125 transition-transform"><Layout size={120} /></div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (view === 'lesson' && lesson) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 animate-slide-up pb-20">
        <button 
          onClick={() => setView('topics')}
          className="flex items-center gap-2 text-slate-400 hover:text-slate-800 font-black text-xs uppercase tracking-widest transition-all"
        >
          <ArrowLeft size={16} /> 返回列表
        </button>

        <div className="bg-white rounded-[3.5rem] shadow-2xl p-12 border border-slate-100 space-y-12">
          <header className="space-y-4">
            <h2 className="text-4xl font-black text-slate-800 tracking-tighter">{lesson.title}</h2>
            <div className="p-8 bg-indigo-50 rounded-[2.5rem] border-2 border-indigo-100 relative overflow-hidden">
               <div className="absolute top-4 right-6 text-indigo-200"><Lightbulb size={60} /></div>
               <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-4">核心逻辑 (Concept)</h4>
               <p className="text-lg text-indigo-900 leading-relaxed font-bold relative z-10">{lesson.concept}</p>
            </div>
          </header>

          <div className="space-y-8">
            <section className="bg-amber-50 p-8 rounded-[2.5rem] border-2 border-amber-100 shadow-xl animate-float">
               <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                 <Puzzle size={16} /> 直觉类比 (Analogy)
               </h4>
               <p className="text-lg text-amber-900 font-black leading-tight italic">"{lesson.analogy}"</p>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {lesson.rules.map((rule, idx) => (
                <div key={idx} className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 hover:bg-white hover:shadow-xl transition-all">
                  <h5 className="font-black text-slate-800 mb-3 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-[10px]">{idx + 1}</div>
                    {rule.title}
                  </h5>
                  <p className="text-sm text-slate-600 leading-relaxed">{rule.content}</p>
                </div>
              ))}
            </div>
          </div>

          <section className="space-y-6">
             <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">实战演示 (Examples)</h4>
             <div className="space-y-4">
               {lesson.examples.map((ex, idx) => (
                 <div key={idx} className="bg-white border-2 border-slate-50 p-6 rounded-2xl flex flex-col gap-3 group hover:border-indigo-100 transition-all">
                    <div className="flex justify-between items-center">
                      <span className="text-xl font-black text-slate-800 group-hover:text-indigo-600 transition-colors">{ex.english}</span>
                      <Play size={16} className="text-slate-300" />
                    </div>
                    <p className="text-sm text-slate-500 font-bold">{ex.chinese}</p>
                    <div className="text-[10px] font-black text-indigo-400 bg-indigo-50/50 px-3 py-1.5 rounded-xl self-start italic tracking-tight">
                      笔记: {ex.note}
                    </div>
                 </div>
               ))}
             </div>
          </section>

          <button 
            onClick={startQuiz}
            className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black text-xl hover:bg-indigo-600 shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-4"
          >
            我懂了，去闯关 <Zap size={24} />
          </button>
        </div>
      </div>
    );
  }

  if (view === 'quiz') {
    if (quizFinished) {
      return (
        <div className="max-w-2xl mx-auto py-12 animate-slide-up">
          <div className="bg-white rounded-[4rem] shadow-2xl p-16 text-center border border-slate-100">
             <div className="w-24 h-24 bg-emerald-50 rounded-[2rem] flex items-center justify-center text-emerald-500 mx-auto mb-8 shadow-inner animate-float">
               <Trophy size={48} />
             </div>
             <h2 className="text-4xl font-black text-slate-800 mb-2">实验室通关！</h2>
             <p className="text-slate-500 mb-10">你的理解程度达到了 {Math.round((quizScore / quizzes.length) * 100)}%</p>
             <div className="flex gap-4">
               <button onClick={() => setView('topics')} className="flex-1 py-5 rounded-2xl border-2 border-slate-100 font-black text-slate-600 hover:bg-slate-50 transition-all">返回实验室</button>
               <button onClick={startQuiz} className="flex-1 py-5 rounded-2xl bg-slate-900 text-white font-black hover:bg-indigo-600 shadow-xl transition-all">重新挑战</button>
             </div>
          </div>
        </div>
      );
    }

    const currentQuiz = quizzes[quizIndex];
    if (!currentQuiz) return null;

    return (
      <div className="max-w-3xl mx-auto py-12 space-y-8 animate-slide-up">
        <div className="flex justify-between items-center px-8">
           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">挑战进度: {quizIndex + 1} / {quizzes.length}</span>
           <div className="flex gap-1">
             {quizzes.map((_, i) => (
               <div key={i} className={`h-1 w-8 rounded-full transition-all ${i <= quizIndex ? 'bg-indigo-600' : 'bg-slate-200'}`} />
             ))}
           </div>
        </div>

        <div className="bg-white rounded-[3rem] shadow-2xl p-12 border border-slate-100 space-y-10 text-center">
          <div className="space-y-4">
            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mx-auto animate-float">
              <HelpCircle size={32} />
            </div>
            <h3 className="text-2xl font-black text-slate-800 leading-tight">{currentQuiz.question}</h3>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {currentQuiz.options.map((option, idx) => (
              <button 
                key={idx}
                onClick={() => handleQuizAnswer(idx)}
                className={`w-full p-6 rounded-2xl border-2 text-left transition-all font-bold flex items-center justify-between group active:scale-95 ${
                  selectedOption === null 
                    ? 'border-slate-100 hover:border-indigo-600 hover:bg-indigo-50' 
                    : idx === currentQuiz.correctAnswer 
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700' 
                      : idx === selectedOption 
                        ? 'border-rose-500 bg-rose-50 text-rose-700 shake' 
                        : 'border-slate-50 text-slate-300 opacity-50'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-[10px] transition-colors ${
                    selectedOption === null ? 'bg-slate-100 group-hover:bg-indigo-600 group-hover:text-white' : 'bg-white'
                  }`}>
                    {String.fromCharCode(65 + idx)}
                  </div>
                  {option}
                </div>
                {selectedOption !== null && idx === currentQuiz.correctAnswer && <CheckCircle2 size={24} className="text-emerald-500" />}
              </button>
            ))}
          </div>

          {showExplanation && (
            <div className="animate-slide-up p-8 bg-indigo-50 rounded-[2rem] border border-indigo-100 text-left space-y-4">
              <div className="flex items-center gap-2 text-indigo-600 font-black text-[10px] uppercase">
                <Lightbulb size={16} /> 实验室解析
              </div>
              <p className="text-indigo-900 leading-relaxed font-medium">{currentQuiz.explanation}</p>
              <button 
                onClick={nextQuiz}
                className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black hover:bg-indigo-700 shadow-xl transition-all flex items-center justify-center gap-2"
              >
                进入下一题 <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
};

export default GrammarView;
