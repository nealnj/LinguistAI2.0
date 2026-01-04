
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Award, 
  Map, 
  Lock, 
  ArrowRight,
  Sparkles,
  Zap,
  Clock,
  RefreshCcw,
  ChevronRight,
  Brain,
  Search,
  CheckCircle2,
  BookOpen,
  Target,
  BarChart4,
  Loader2,
  X,
  AlertTriangle
} from 'lucide-react';
import { LearningModule, RoadmapStep, MasterProgress } from '../types';
import { generateLearningPlan, generateReviewQuiz } from '../services/geminiService';
import { logger } from '../services/logger';

interface DashboardViewProps {
  onNavigate: (module: LearningModule) => void;
}

const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const [roadmap, setRoadmap] = useState<RoadmapStep[]>([]);
  const [loadingRoadmap, setLoadingRoadmap] = useState(false);
  const [roadmapError, setRoadmapError] = useState<string | null>(null);
  const [reinforcementQuiz, setReinforcementQuiz] = useState<any[]>([]);
  const [loadingReview, setLoadingReview] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [reviewIdx, setReviewIdx] = useState(0);
  const [reviewAns, setReviewAns] = useState<number | null>(null);

  const masterProgress = logger.getMasterProgress();
  const notes = logger.getNotes();
  const recentNotes = useMemo(() => notes.slice(-5), [notes]);

  const fetchRoadmap = async () => {
    setLoadingRoadmap(true);
    setRoadmapError(null);
    try {
      const goal = `${masterProgress.specialization} Mastery & Academic Success`;
      const plan = await generateLearningPlan(goal);
      if (Array.isArray(plan)) {
        const processed = plan.map((p: any, i: number) => {
          let status: 'locked' | 'current' | 'completed' = 'locked';
          const stageLevel = (i + 1) * 5;
          if (masterProgress.overallLevel >= stageLevel) status = 'completed';
          else if (masterProgress.overallLevel >= stageLevel - 5) status = 'current';
          
          const focus = Array.isArray(p.focus) ? p.focus : (p.focus ? [String(p.focus)] : []);
          return { ...p, focus, status };
        });
        setRoadmap(processed);
      } else {
        throw new Error("Invalid roadmap format received.");
      }
    } catch (e: any) { 
      console.error("Roadmap Loading Failed", e);
      setRoadmapError("AI 导师暂时无法连接，路线图加载失败。建议检查网络或稍后重试。");
    } finally { 
      setLoadingRoadmap(false); 
    }
  };

  useEffect(() => {
    fetchRoadmap();
  }, [masterProgress.overallLevel, masterProgress.specialization]);

  const startReinforcement = async () => {
    if (recentNotes.length === 0) return;
    setLoadingReview(true);
    setShowReview(true);
    try {
      const quiz = await generateReviewQuiz(recentNotes);
      setReinforcementQuiz(Array.isArray(quiz) ? quiz : []);
    } catch (e) { 
      console.error(e); 
    } finally { 
      setLoadingReview(false); 
    }
  };

  const nextReview = () => {
    if (reviewIdx < reinforcementQuiz.length - 1) {
      setReviewIdx(i => i + 1);
      setReviewAns(null);
    } else {
      setShowReview(false);
      setReviewIdx(0);
      setReviewAns(null);
      recentNotes.forEach(n => logger.updateNoteReview(n.id));
    }
  };

  return (
    <div className="space-y-6 lg:space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-indigo-900 rounded-[2rem] lg:rounded-[3.5rem] p-8 lg:p-12 text-white relative overflow-hidden shadow-2xl">
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <div className="space-y-4 lg:space-y-6">
            <div className="flex flex-wrap items-center gap-2">
               <div className="bg-white/10 px-4 py-1.5 rounded-full backdrop-blur-md text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 border border-white/5">
                 <Sparkles size={14} className="text-amber-400" /> 系统化进度
               </div>
               <div className="bg-indigo-600/50 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-white/5">
                 {masterProgress.specialization}
               </div>
            </div>
            <h1 className="text-4xl lg:text-6xl font-black tracking-tighter leading-tight">{masterProgress.academicRank}</h1>
            <p className="text-slate-300 text-sm lg:text-lg max-w-md leading-relaxed font-medium">
              您的认知水平目前处于 <span className="text-white font-black">Level {masterProgress.overallLevel}</span>。
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
               <button onClick={() => onNavigate(LearningModule.READING)} className="bg-white text-slate-900 px-6 py-4 lg:px-8 lg:py-5 rounded-2xl font-black transition-all shadow-xl hover:bg-indigo-50 flex items-center justify-center gap-3 group active:scale-95">
                 下一关: 深度阅读 <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
               </button>
               <button onClick={startReinforcement} className="bg-white/10 hover:bg-white/20 text-white border border-white/10 px-6 py-4 lg:px-8 lg:py-5 rounded-2xl font-black transition-all flex items-center justify-center gap-3">
                 <RefreshCcw size={20} /> 记忆强化
               </button>
            </div>
          </div>

          <div className="bg-white/5 p-6 lg:p-8 rounded-3xl border border-white/10 backdrop-blur-xl space-y-6">
             <h3 className="text-[10px] lg:text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2"><BarChart4 size={16} /> 技能雷达 (Skill Mapping)</h3>
             <div className="space-y-4 lg:space-y-5">
               {Object.entries(masterProgress.skills).map(([skill, val]) => (
                 <div key={skill} className="space-y-2">
                    <div className="flex justify-between text-[8px] lg:text-[10px] font-black uppercase">
                      <span className="text-slate-500">{skill}</span>
                      <span className="text-indigo-400">Lvl {val}</span>
                    </div>
                    <div className="h-1 lg:h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" style={{ width: `${Math.min((val / 50) * 100, 100)}%` }} />
                    </div>
                 </div>
               ))}
             </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 p-12 opacity-5 -rotate-12 translate-x-20 -translate-y-20 hidden lg:block">
          <Award size={450} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10">
        <div className="lg:col-span-8 space-y-6 lg:space-y-10">
          {showReview && (
            <section className="bg-indigo-600 rounded-[2rem] lg:rounded-[3rem] p-6 lg:p-10 text-white shadow-2xl animate-slide-up relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-10"><Brain size={150} /></div>
               {loadingReview ? (
                 <div className="flex flex-col items-center gap-4 py-10">
                   <Loader2 size={40} className="animate-spin" />
                   <p className="font-black text-[10px] uppercase tracking-widest">同步记忆映射...</p>
                 </div>
               ) : (
                 <div className="space-y-6 lg:space-y-8 relative z-10">
                    <div className="flex justify-between items-center">
                       <h3 className="text-xl lg:text-2xl font-black flex items-center gap-3"><Zap size={24} /> 交互式回顾测验</h3>
                       <button onClick={() => setShowReview(false)} className="text-white/40 hover:text-white p-2"><X size={24} /></button>
                    </div>
                    {reinforcementQuiz.length > 0 ? (
                    <div className="bg-white/10 p-6 lg:p-8 rounded-3xl border border-white/10 space-y-6">
                       <p className="text-lg lg:text-xl font-bold leading-relaxed">{reinforcementQuiz[reviewIdx]?.question || "加载中..."}</p>
                       <div className="grid grid-cols-1 gap-3">
                          {reinforcementQuiz[reviewIdx]?.options?.map((opt: string, i: number) => (
                            <button 
                              key={i} 
                              onClick={() => setReviewAns(i)}
                              className={`p-4 lg:p-6 rounded-2xl text-left font-bold transition-all border-2 text-sm lg:text-base ${
                                reviewAns === null ? 'bg-white/5 border-transparent hover:bg-white/15' :
                                i === reinforcementQuiz[reviewIdx].answer ? 'bg-emerald-500 border-emerald-400 text-white' :
                                i === reviewAns ? 'bg-rose-500 border-rose-400 text-white' : 'bg-white/5 border-transparent opacity-50'
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                       </div>
                    </div>
                    ) : <p className="text-center py-10 opacity-60">未获取到测验题目，请重试。</p>}
                    {reviewAns !== null && (
                      <div className="animate-in fade-in slide-in-from-top-4">
                        <p className="text-indigo-200 text-xs italic mb-4">“{reinforcementQuiz[reviewIdx]?.explanation}”</p>
                        <button onClick={nextReview} className="w-full py-4 bg-white text-indigo-900 rounded-2xl font-black hover:bg-slate-50 transition-all text-base lg:text-lg">下一题</button>
                      </div>
                    )}
                 </div>
               )}
            </section>
          )}

          <section className="bg-white p-6 lg:p-12 rounded-[2rem] lg:rounded-[3.5rem] border border-slate-100 shadow-sm relative min-h-[400px]">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 lg:mb-12 gap-4">
               <div>
                  <h3 className="text-xl lg:text-2xl font-black text-slate-800 flex items-center gap-4">
                    <Map className="text-indigo-600" /> 系统化大纲 (Roadmap)
                  </h3>
                  <p className="text-slate-400 text-xs mt-1">基于当前等级 Lvl {masterProgress.overallLevel}</p>
               </div>
               <div className="flex flex-col items-end">
                  <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Next Milestone</span>
                  <span className="text-indigo-600 font-black text-sm lg:text-base">Level {Math.ceil((masterProgress.overallLevel + 0.1) / 5) * 5}</span>
               </div>
            </div>
            
            <div className="space-y-4 lg:space-y-6 relative">
               <div className="absolute left-[27px] lg:left-[31px] top-10 bottom-10 w-0.5 bg-slate-100 z-0" />
               
               {loadingRoadmap ? (
                  <div className="space-y-4">
                    {[1,2,3].map(i => (
                      <div key={i} className="h-24 lg:h-32 bg-slate-50 rounded-3xl animate-pulse flex items-center px-6 lg:px-8 gap-4 lg:gap-8">
                        <div className="w-12 h-12 lg:w-16 lg:h-16 bg-slate-100 rounded-2xl" />
                        <div className="flex-1 space-y-2">
                           <div className="h-4 bg-slate-100 rounded-full w-1/3" />
                           <div className="h-2 bg-slate-100 rounded-full w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
               ) : roadmapError ? (
                  <div className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-[2rem] border-2 border-dashed border-rose-100 gap-4">
                    <AlertTriangle className="text-rose-400" size={48} />
                    <p className="text-sm font-bold text-slate-500 text-center px-8">{roadmapError}</p>
                    <button onClick={fetchRoadmap} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg flex items-center gap-2">
                      <RefreshCcw size={14} /> 重新连接 AI
                    </button>
                  </div>
               ) : (
                roadmap.map((step, i) => (
                    <div key={i} className={`group relative z-10 p-5 lg:p-8 rounded-[1.5rem] lg:rounded-[2rem] border transition-all flex items-center gap-4 lg:gap-8 ${
                      step.status === 'completed' ? 'bg-slate-50 border-slate-100' : 
                      step.status === 'current' ? 'border-indigo-200 bg-white shadow-xl scale-[1.02]' : 
                      'opacity-40 border-slate-50 bg-white grayscale'
                    }`}>
                       <div className={`w-12 h-12 lg:w-16 lg:h-16 rounded-2xl flex items-center justify-center font-black text-base lg:text-xl shadow-lg transition-transform group-hover:scale-105 shrink-0 ${
                         step.status === 'completed' ? 'bg-emerald-500 text-white' : 
                         step.status === 'current' ? 'bg-indigo-600 text-white' : 
                         'bg-slate-100 text-slate-300'
                       }`}>
                          {step.status === 'completed' ? <CheckCircle2 size={20} /> : i + 1}
                       </div>
                       <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 lg:gap-3 mb-1">
                            <h4 className="font-black text-slate-800 text-sm lg:text-xl tracking-tight truncate">{step.stage}</h4>
                            {step.status === 'current' && <span className="px-2 py-0.5 bg-indigo-600 text-white text-[6px] lg:text-[8px] font-black rounded-full animate-pulse whitespace-nowrap">进行中</span>}
                          </div>
                          <div className="flex flex-wrap gap-1 lg:gap-2">
                             {(step.focus || []).map((f, j) => (
                               <span key={j} className="text-[6px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{f}</span>
                             ))}
                          </div>
                       </div>
                       {step.status === 'locked' && <Lock size={16} className="text-slate-200" />}
                       {step.status === 'current' && <button onClick={() => onNavigate(LearningModule.READING)} className="p-3 lg:p-4 bg-indigo-50 text-indigo-600 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all"><ArrowRight size={18} /></button>}
                    </div>
                  ))
               )}
            </div>
          </section>
        </div>

        <div className="lg:col-span-4 space-y-6 lg:space-y-10">
           <section className="bg-white p-6 lg:p-10 rounded-[2rem] lg:rounded-[3rem] border border-slate-100 shadow-sm space-y-6">
             <div className="flex items-center justify-between">
                <h3 className="text-lg lg:text-xl font-black text-slate-800 flex items-center gap-3"><Target className="text-amber-500" /> 记忆节点</h3>
                <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-[10px] font-black">{recentNotes.length}</span>
             </div>
             <div className="space-y-3 lg:space-y-4">
                {recentNotes.length > 0 ? recentNotes.map((note, i) => (
                  <div key={i} className="p-4 lg:p-5 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-indigo-100 transition-all">
                     <div className="flex justify-between items-center mb-1">
                       <span className="text-[8px] font-black text-indigo-500 uppercase tracking-widest">{note.tag === 'vocabulary' ? '核心词汇' : '逻辑笔记'}</span>
                       <span className="text-[8px] text-slate-300">Review {note.reviewCount || 0}</span>
                     </div>
                     <p className="text-xs lg:text-sm font-black text-slate-800 line-clamp-1">{note.text}</p>
                  </div>
                )) : (
                  <div className="text-center py-12 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-100">
                     <Search size={24} className="text-slate-200 mx-auto mb-2" />
                     <p className="text-[10px] text-slate-400 font-bold leading-relaxed px-4">在学习过程中划词<br/>节点将自动同步至此</p>
                  </div>
                )}
             </div>
             {recentNotes.length > 0 && (
               <button onClick={startReinforcement} className="w-full py-4 lg:py-5 bg-slate-900 text-white rounded-2xl font-black text-sm hover:bg-indigo-600 transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95">
                 记忆强化测验 <Zap size={16} />
               </button>
             )}
           </section>

           <section className="bg-slate-900 p-8 lg:p-10 rounded-[2rem] lg:rounded-[3rem] text-white shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform"><BookOpen size={150} /></div>
              <h3 className="text-lg lg:text-xl font-black mb-6 lg:mb-8 flex items-center gap-3"><Clock size={20} className="text-indigo-400" /> 今日状态</h3>
              <div className="space-y-6 lg:space-y-8 relative z-10">
                 <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="bg-white/5 p-4 lg:p-6 rounded-[1.5rem] lg:rounded-[2rem] border border-white/5">
                       <span className="text-[8px] lg:text-[10px] text-slate-500 block mb-2 uppercase tracking-widest">连贯度</span>
                       <span className="text-xl lg:text-3xl font-black text-emerald-400">92%</span>
                    </div>
                    <div className="bg-white/5 p-4 lg:p-6 rounded-[1.5rem] lg:rounded-[2rem] border border-white/5">
                       <span className="text-[8px] lg:text-[10px] text-slate-500 block mb-2 uppercase tracking-widest">速率</span>
                       <span className="text-xl lg:text-3xl font-black text-indigo-400">+2.4</span>
                    </div>
                 </div>
                 <div className="p-4 lg:p-6 bg-white/5 rounded-3xl border border-white/10 text-[10px] lg:text-xs text-slate-400 leading-relaxed italic">
                    “您的认知分析显示，对专业术语的掌握有所提升。系统建议加强听力理解。”
                 </div>
              </div>
           </section>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
