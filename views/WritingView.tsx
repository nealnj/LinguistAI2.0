
import React, { useState } from 'react';
import { analyzeWriting } from '../services/geminiService';
import { WritingAnalysis } from '../types';
import { Send, Loader2, CheckCircle2, AlertCircle, Sparkles, PenTool, ChevronRight } from 'lucide-react';

const WritingView: React.FC = () => {
  const [text, setText] = useState('');
  const [analysis, setAnalysis] = useState<WritingAnalysis | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const result = await analyzeWriting(text);
      setAnalysis(result);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-8 h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">写作智能批改</h1>
          <p className="text-slate-500">粘贴你的作文，AI 将按雅思考试标准进行评分与修正</p>
        </div>
        <div className="flex gap-2">
          <select className="bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none">
            <option>IELTS Academic Task 2</option>
            <option>IELTS Academic Task 1</option>
            <option>Cambridge First (FCE)</option>
            <option>Business Email</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1 overflow-hidden">
        {/* Input area */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col p-6 overflow-hidden">
          <div className="flex items-center justify-between mb-4">
             <span className="text-xs font-bold text-slate-400 uppercase">Input Text</span>
             <span className="text-xs font-medium text-slate-400">{text.split(/\s+/).filter(Boolean).length} Words</span>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Start writing or paste your essay here..."
            className="flex-1 w-full resize-none outline-none text-slate-700 leading-relaxed placeholder:text-slate-300"
          />
          <button 
            onClick={handleAnalyze}
            disabled={loading || !text}
            className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-200"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <><Send size={18} /> 开始批改</>}
          </button>
        </div>

        {/* Feedback area */}
        <div className="flex flex-col gap-6 overflow-y-auto pr-2">
          {!analysis && !loading && (
            <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl">
              <div className="bg-white p-4 rounded-2xl text-slate-300 mb-4 shadow-sm">
                <PenTool size={48} />
              </div>
              <h3 className="text-slate-600 font-bold mb-2">等待批改中</h3>
              <p className="text-slate-400 text-sm max-w-[250px]">输入文章并点击右侧按钮，获取深度语法、用词及逻辑分析</p>
            </div>
          )}

          {loading && (
            <div className="h-full flex flex-col items-center justify-center gap-4">
               <div className="relative">
                 <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                 <Sparkles size={24} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-amber-400" />
               </div>
               <p className="text-slate-500 font-medium">AI 正在深度扫描语法与逻辑...</p>
            </div>
          )}

          {analysis && (
            <div className="space-y-6 animate-in slide-in-from-right-8 duration-500">
              {/* Score Card */}
              <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
                <div>
                  <h4 className="text-slate-500 font-bold text-xs uppercase mb-1">Estimated Band Score</h4>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-extrabold text-indigo-600">{(analysis.score / 10).toFixed(1)}</span>
                    <span className="text-slate-400 font-bold">/ 9.0</span>
                  </div>
                </div>
                <div className="w-16 h-16 rounded-full border-4 border-emerald-500 flex items-center justify-center">
                  <CheckCircle2 className="text-emerald-500" size={32} />
                </div>
              </div>

              {/* Specific Corrections */}
              <div className="space-y-4">
                <h4 className="font-bold text-slate-800 flex items-center gap-2">
                  <AlertCircle size={18} className="text-rose-500" /> 修正建议
                </h4>
                {analysis.corrections?.length > 0 ? analysis.corrections.map((corr, i) => (
                  <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="line-through text-slate-400 bg-slate-50 px-2 py-0.5 rounded">{corr.original}</span>
                      <ChevronRight size={14} className="text-slate-300" />
                      <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">{corr.suggested}</span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed"><span className="font-bold">原因:</span> {corr.reason}</p>
                  </div>
                )) : (
                  <p className="text-sm text-emerald-600 font-medium bg-emerald-50 p-4 rounded-xl">未发现显著语法错误，继续保持！</p>
                )}
              </div>

              {/* General Feedback */}
              <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-2xl">
                 <h4 className="font-bold text-indigo-800 mb-2">导师点评</h4>
                 <p className="text-sm text-indigo-700 leading-relaxed">{analysis.feedback}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WritingView;
