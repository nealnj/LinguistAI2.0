
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  Award, 
  BookOpen, 
  Map, 
  CheckCircle2, 
  Lock, 
  ArrowRight,
  Sparkles,
  Zap,
  Clock,
  Calendar,
  RefreshCcw,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { LearningModule, RoadmapStep } from '../types';
import { generateLearningPlan } from '../services/geminiService';

interface DashboardViewProps {
  onNavigate: (module: LearningModule) => void;
}

const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const [roadmap, setRoadmap] = useState<RoadmapStep[]>([]);
  const [loadingRoadmap, setLoadingRoadmap] = useState(true);

  useEffect(() => {
    const fetchRoadmap = async () => {
      setLoadingRoadmap(true);
      try {
        const plan = await generateLearningPlan("成人雅思及母语级流利口语");
        if (Array.isArray(plan)) {
          setRoadmap(plan.map((p: any, i: number) => ({
            ...p,
            status: i === 0 ? 'current' : 'locked'
          })));
        }
      } catch (e) { console.error(e); } finally { setLoadingRoadmap(false); }
    };
    fetchRoadmap();
  }, []);

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      {/* Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-indigo-900 rounded-[3rem] p-12 text-white relative overflow-hidden shadow-2xl">
        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="flex items-center gap-3">
             <div className="bg-white/10 px-4 py-1 rounded-full backdrop-blur-md text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
               <Sparkles size={14} className="text-amber-400" /> AI 学习导师
             </div>
          </div>
          <h1 className="text-5xl font-black tracking-tighter leading-tight">掌握流利英语，<br/>从 0 到 1 的飞跃。</h1>
          <p className="text-slate-300 text-lg max-w-xl leading-relaxed">
            为您定制的雅思 7.5 进阶路径已开启。今日核心：掌握 5 个基础词汇及其复杂的变形体系。
          </p>
          <button 
            onClick={() => onNavigate(LearningModule.VOCABULARY)}
            className="bg-indigo-500 hover:bg-indigo-600 text-white px-10 py-5 rounded-2xl font-black transition-all shadow-xl shadow-indigo-500/20 flex items-center gap-3 group active:scale-95"
          >
            开启今日任务 <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
        <div className="absolute top-0 right-0 p-12 opacity-10 -rotate-12 translate-x-20 -translate-y-20">
          <Award size={400} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Roadmap */}
          <section className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-8">
               <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
                 <Map className="text-indigo-600" /> 系统化进阶路线
               </h3>
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">雅思/剑桥 全覆盖</span>
            </div>
            <div className="space-y-4">
               {loadingRoadmap ? [1,2,3].map(i => <div key={i} className="h-24 bg-slate-50 rounded-2xl animate-pulse" />) : 
                roadmap.map((step, i) => (
                  <div key={i} className={`p-6 rounded-2xl border flex items-center gap-6 transition-all ${step.status === 'current' ? 'border-indigo-100 bg-indigo-50/30 ring-2 ring-indigo-50' : 'opacity-40 border-slate-100 grayscale'}`}>
                     <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black ${step.status === 'current' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                        {i + 1}
                     </div>
                     <div className="flex-1">
                        <h4 className="font-black text-slate-800 text-lg">{step.stage}</h4>
                        <p className="text-sm text-slate-500">{step.goal}</p>
                     </div>
                     {step.status === 'locked' && <Lock size={18} className="text-slate-300" />}
                  </div>
                ))
               }
            </div>
          </section>
        </div>

        <div className="space-y-8">
          {/* Review Queue */}
          <section className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4">
               <div className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-8 flex items-center gap-3">
              <RefreshCcw className="text-amber-500" /> 复习队列 (Review)
            </h3>
            <div className="space-y-4">
              <div className="p-6 rounded-2xl bg-rose-50 border border-rose-100 group cursor-pointer hover:bg-rose-100 transition-all">
                <div className="flex justify-between items-center mb-2">
                   <div className="flex items-center gap-2">
                     <AlertCircle size={14} className="text-rose-600" />
                     <span className="text-xs font-black text-rose-700 uppercase">立即复现内容</span>
                   </div>
                   <Clock size={14} className="text-rose-400" />
                </div>
                <h4 className="font-bold text-slate-800 mb-1">本组学习词汇</h4>
                <p className="text-[10px] text-rose-600 font-bold uppercase tracking-tight">记忆强度: 35% • 待开启互动复习</p>
                <button 
                  onClick={() => onNavigate(LearningModule.VOCABULARY)}
                  className="mt-4 w-full py-3 bg-rose-600 text-white rounded-xl text-xs font-black hover:bg-rose-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-rose-200"
                >
                  进入复习模式 <ChevronRight size={14} />
                </button>
              </div>
              
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 opacity-60">
                 <div className="flex justify-between items-center mb-2">
                   <span className="text-xs font-black text-slate-400 uppercase">后续计划</span>
                 </div>
                 <h4 className="font-bold text-slate-400 mb-1 italic">语法深度训练</h4>
                 <p className="text-[10px] text-slate-400">系统将在词汇掌握后解锁</p>
              </div>
            </div>
          </section>

          {/* Quick Stats */}
          <section className="bg-slate-900 p-10 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
             <div className="relative z-10 flex flex-col gap-6">
               <div className="flex items-center justify-between">
                 <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">今日数据</h4>
                 <Zap className="text-indigo-400" size={20} />
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 p-4 rounded-xl border border-white/5 text-center">
                    <span className="text-[10px] text-slate-400 block mb-1 uppercase">已学</span>
                    <span className="text-2xl font-black">5 词</span>
                  </div>
                  <div className="bg-white/5 p-4 rounded-xl border border-white/5 text-center">
                    <span className="text-[10px] text-slate-400 block mb-1 uppercase">连胜</span>
                    <span className="text-2xl font-black">1 天</span>
                  </div>
               </div>
             </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
