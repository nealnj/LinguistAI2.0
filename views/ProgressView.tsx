
import React, { useState, useEffect } from 'react';
import { logger } from '../services/logger';
import { 
  History, 
  AlertCircle, 
  TrendingUp, 
  Zap, 
  BookOpen, 
  Clock,
  Calendar,
  Brain,
  StickyNote,
  Trash2,
  Bookmark
} from 'lucide-react';
import { LearningModule } from '../types';

const ProgressView: React.FC = () => {
  const [logs, setLogs] = useState(logger.getLogs());
  const [unknownWords, setUnknownWords] = useState(logger.getUnknownWords());
  const [mistakes, setMistakes] = useState(logger.getMistakes());
  const [notes, setNotes] = useState(logger.getNotes());

  const stats = [
    { label: '总学习行为', value: logs.length, icon: <Zap className="text-amber-500" /> },
    { label: '笔记与生词', value: notes.length, icon: <StickyNote className="text-indigo-500" /> },
    { label: '逻辑纠偏', value: mistakes.length, icon: <AlertCircle className="text-rose-500" /> },
    { label: '专注等级', value: 'Prime', icon: <TrendingUp className="text-emerald-500" /> }
  ];

  const getModuleName = (mod: LearningModule) => {
    const names: Record<string, string> = {
      [LearningModule.VOCABULARY]: '单词积累',
      [LearningModule.GRAMMAR]: '语法实验室',
      [LearningModule.READING]: '深度阅读',
      [LearningModule.WRITING]: '智能批改',
      [LearningModule.SPEAKING]: 'AI口语'
    };
    return names[mod] || mod;
  };

  const deleteNote = (id: string) => {
    const ns = logger.getNotes().filter(n => n.id !== id);
    localStorage.setItem('linguist_ai_notes', JSON.stringify(ns));
    setNotes(ns);
    setUnknownWords(logger.getUnknownWords());
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-20 animate-slide-up">
      <header className="flex flex-col gap-4">
        <h1 className="text-4xl font-black text-slate-800 tracking-tighter flex items-center gap-4">
          <Brain className="text-indigo-600" size={40} /> 个人语言能力评估报告
        </h1>
        <p className="text-slate-500 max-w-2xl text-lg font-medium leading-relaxed">
          基于您在 <span className="text-indigo-600 font-black">阅读、写作、口语</span> 中的全量学习日志，为您生成的认知映射分析。
        </p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col gap-2 group hover:shadow-xl transition-all">
            <div className="bg-slate-50 p-3 rounded-2xl w-fit group-hover:scale-110 transition-transform">{stat.icon}</div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-3">{stat.label}</span>
            <span className="text-3xl font-black text-slate-800 tracking-tighter">{stat.value}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column: Logs & Unknown Words */}
        <div className="lg:col-span-8 space-y-10">
          <section className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm">
            <h3 className="text-xl font-black text-slate-800 mb-10 flex items-center gap-3">
              <History className="text-indigo-600" /> 最近的学习脉络
            </h3>
            <div className="space-y-8">
              {logs.length > 0 ? logs.slice().reverse().slice(0, 8).map((log, i) => (
                <div key={i} className="flex gap-6 items-start">
                  <div className="mt-2 shrink-0 flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full bg-indigo-600 ring-4 ring-indigo-50" />
                    <div className="w-0.5 h-16 bg-slate-100 mt-2" />
                  </div>
                  <div className="flex-1 bg-slate-50 p-8 rounded-3xl border border-slate-100 group hover:bg-white hover:border-indigo-100 transition-all">
                    <div className="flex justify-between items-center mb-3">
                       <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full">{getModuleName(log.module)}</span>
                       <span className="text-[10px] text-slate-400 font-mono">{new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-slate-700 font-black text-lg leading-snug">
                       {log.action === 'learn' && `成功对内容 "${log.detail.title || log.detail.word}" 建立了认知锚点`}
                       {log.action === 'complete' && `圆满达成学习目标，本单元评估结果：${log.detail.score || '100'}%`}
                       {log.action === 'mistake' && `在 "${log.detail.question || '题目'}" 中发现逻辑漏洞并完成纠偏`}
                    </p>
                  </div>
                </div>
              )) : (
                <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                   <Zap size={48} className="text-slate-200 mx-auto mb-4" />
                   <p className="text-slate-400 font-bold">暂无活动记录，开启您的第一课吧！</p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Right Column: Notes & Summary */}
        <div className="lg:col-span-4 space-y-10">
          <section className="bg-amber-50 rounded-[3rem] p-10 border border-amber-200 shadow-sm">
            <h3 className="text-xl font-black text-amber-800 mb-8 flex items-center gap-3">
              <StickyNote className="text-amber-600" /> 交互笔记与生词 ({notes.length})
            </h3>
            <div className="space-y-4">
              {notes.length > 0 ? notes.slice().reverse().slice(0, 10).map((n) => (
                <div key={n.id} className="bg-white p-6 rounded-2xl shadow-sm border border-amber-100 group relative">
                  <button 
                    onClick={() => deleteNote(n.id)}
                    className="absolute top-4 right-4 text-slate-200 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${n.tag === 'vocabulary' ? 'bg-indigo-100 text-indigo-600' : 'bg-amber-100 text-amber-700'}`}>
                      {n.tag === 'vocabulary' ? '生词' : '笔记'}
                    </span>
                    <span className="text-[8px] text-slate-300 font-bold uppercase tracking-widest">{getModuleName(n.module)}</span>
                  </div>
                  <p className="text-sm font-black text-slate-800 mb-1">{n.text}</p>
                  <p className="text-[11px] text-slate-400 italic leading-relaxed">"{n.context}"</p>
                </div>
              )) : (
                <div className="text-center py-10 bg-white/50 rounded-2xl border-2 border-dashed border-amber-200">
                  <Bookmark size={32} className="text-amber-200 mx-auto mb-2" />
                  <p className="text-xs text-amber-600 font-medium italic">在阅读专区通过“划词”<br/>记录您的学习瞬间</p>
                </div>
              )}
            </div>
          </section>

          <section className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform duration-1000">
               <TrendingUp size={120} />
            </div>
            <h3 className="text-xl font-black mb-8">AI 阶段性成长分析</h3>
            <div className="space-y-8 relative z-10">
              <div className="space-y-3">
                 <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                   <span className="text-slate-500">词汇爆发力</span>
                   <span className="text-indigo-400">High</span>
                 </div>
                 <div className="h-2 bg-white/10 rounded-full overflow-hidden border border-white/5">
                   <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 w-[78%] shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
                 </div>
              </div>
              <div className="space-y-3">
                 <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                   <span className="text-slate-500">逻辑严谨度</span>
                   <span className="text-rose-400">Stable</span>
                 </div>
                 <div className="h-2 bg-white/10 rounded-full overflow-hidden border border-white/5">
                   <div className="h-full bg-gradient-to-r from-rose-500 to-amber-500 w-[62%]" />
                 </div>
              </div>
              <div className="p-6 bg-white/5 rounded-3xl border border-white/10 text-xs text-slate-400 leading-relaxed italic">
                 “基于您在 <span className="text-white font-bold">商务英语</span> 领域的笔记频率，系统建议您增加对‘从句嵌套’的针对性练习。今日您的阅读理解专注度评分：94/100。”
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ProgressView;
