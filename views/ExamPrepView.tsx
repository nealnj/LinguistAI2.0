
import React, { useState, useEffect } from 'react';
import { getExamTips } from '../services/geminiService';
import { Award, GraduationCap, Target, ArrowRight, Sparkles } from 'lucide-react';

interface ExamPrepViewProps {
  type: 'ielts' | 'cambridge';
}

const ExamPrepView: React.FC<ExamPrepViewProps> = ({ type }) => {
  const [tips, setTips] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTips = async () => {
      setLoading(true);
      const data = await getExamTips(type.toUpperCase());
      setTips(data);
      setLoading(false);
    };
    fetchTips();
  }, [type]);

  const examInfo = {
    ielts: {
      title: '雅思考试 (IELTS)',
      subtitle: '全球最受欢迎的留学及移民类英语水平测试',
      sections: ['Listening (40m)', 'Reading (60m)', 'Writing (60m)', 'Speaking (11-14m)'],
      color: 'indigo'
    },
    cambridge: {
      title: '剑桥英语考级 (Cambridge)',
      subtitle: '涵盖 A2 Key, B1 Preliminary, B2 First, C1 Advanced, C2 Proficiency',
      sections: ['Reading & Use of English', 'Writing', 'Listening', 'Speaking'],
      color: 'emerald'
    }
  };

  const currentInfo = type === 'ielts' ? examInfo.ielts : examInfo.cambridge;

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-500">
      <div className={`p-10 rounded-3xl bg-${currentInfo.color}-600 text-white shadow-xl relative overflow-hidden`}>
        <div className="relative z-10 space-y-4">
          <div className="bg-white/20 w-fit p-3 rounded-2xl backdrop-blur-md">
            {type === 'ielts' ? <GraduationCap size={32} /> : <Award size={32} />}
          </div>
          <h1 className="text-4xl font-black">{currentInfo.title}</h1>
          <p className="text-indigo-100 max-w-xl">{currentInfo.subtitle}</p>
        </div>
        <div className="absolute top-0 right-0 p-10 opacity-10">
          {type === 'ielts' ? <GraduationCap size={200} /> : <Award size={200} />}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Target className="text-rose-500" />
              备考核心模块
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentInfo.sections.map((sec, i) => (
                <div key={i} className="group p-6 rounded-2xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50 transition-all flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="bg-white p-3 rounded-xl shadow-sm text-slate-700 group-hover:text-indigo-600 font-bold">
                      0{i+1}
                    </div>
                    <span className="font-bold text-slate-700 group-hover:text-indigo-900">{sec}</span>
                  </div>
                  <ArrowRight size={18} className="text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Sparkles className="text-amber-500" />
              AI 备考锦囊
            </h3>
            <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed">
              {loading ? (
                <div className="space-y-4">
                  <div className="h-4 bg-slate-100 rounded-full w-3/4 animate-pulse"></div>
                  <div className="h-4 bg-slate-100 rounded-full w-full animate-pulse"></div>
                  <div className="h-4 bg-slate-100 rounded-full w-2/3 animate-pulse"></div>
                </div>
              ) : (
                <div className="bg-slate-50 p-6 rounded-2xl whitespace-pre-wrap italic">
                  {tips}
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="space-y-6">
           <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-lg relative overflow-hidden group">
             <div className="relative z-10">
               <h4 className="text-emerald-400 font-bold mb-2 uppercase text-xs tracking-widest">Next Step</h4>
               <h3 className="text-xl font-bold mb-4">全真模拟测试</h3>
               <p className="text-slate-400 text-sm mb-6">进行一次完整的全仿真 AI 模拟考试，获取详细的分析报告。</p>
               <button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-4 rounded-xl font-bold transition-colors">
                 立即开始测试
               </button>
             </div>
             <div className="absolute -bottom-10 -right-10 opacity-10 group-hover:scale-110 transition-transform">
               <Target size={160} />
             </div>
           </div>

           <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
             <h4 className="font-bold text-slate-800 mb-6">备考进度统计</h4>
             <div className="space-y-6">
               {[
                 { label: '词汇掌握', val: 75 },
                 { label: '听力模拟', val: 40 },
                 { label: '阅读训练', val: 90 },
                 { label: '写作批改', val: 15 },
               ].map((stat, i) => (
                 <div key={i} className="space-y-2">
                   <div className="flex justify-between text-xs font-bold uppercase">
                     <span className="text-slate-500">{stat.label}</span>
                     <span className="text-indigo-600">{stat.val}%</span>
                   </div>
                   <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                     <div 
                      className="h-full bg-indigo-600 rounded-full" 
                      style={{ width: `${stat.val}%` }}
                     />
                   </div>
                 </div>
               ))}
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ExamPrepView;
