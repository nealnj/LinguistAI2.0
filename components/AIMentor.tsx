
import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  MessageSquare, 
  X, 
  Send, 
  Loader2, 
  ChevronDown,
  ChevronUp,
  BrainCircuit,
  Lightbulb,
  ArrowRight,
  AlertTriangle,
  FileText,
  Copy,
  CheckCircle2,
  FileUp,
  Globe,
  Info,
  ChevronRight
} from 'lucide-react';
import { generateMentorAdvice, generatePersonalizedResume } from '../services/geminiService';
import { LearningModule } from '../types';
import { logger } from '../services/logger';

interface AIMentorProps {
  activeModule: LearningModule;
}

const AIMentor: React.FC<AIMentorProps> = ({ activeModule }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [advice, setAdvice] = useState<{ advice: string; actionableTip: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chatMode, setChatMode] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: 'ai' | 'user'; text: string }[]>([]);
  
  const [isGeneratingResume, setIsGeneratingResume] = useState(false);
  const [generatedResume, setGeneratedResume] = useState<string | null>(null);
  const [showResumeView, setShowResumeView] = useState(false);
  const [copied, setCopied] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchAdvice = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await generateMentorAdvice(activeModule);
        setAdvice(data);
      } catch (e: any) {
        console.error(e);
        setError(e.message?.includes('429') ? '导师目前太忙了 (频率限制)。' : '连接导师失败。');
      } finally {
        setLoading(false);
      }
    };
    fetchAdvice();
    setChatHistory([]);
    setChatMode(false);
    setShowResumeView(false);
  }, [activeModule]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const handleSendMessage = async () => {
    if (!userInput.trim()) return;
    const userMsg = userInput;
    setUserInput('');
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);
    try {
      const data = await generateMentorAdvice(activeModule, userMsg);
      setChatHistory(prev => [...prev, { role: 'ai', text: data.advice }]);
    } catch (e: any) {
      setChatHistory(prev => [...prev, { role: 'ai', text: '抱歉，导师暂时无法回应。' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateResume = async () => {
    setIsGeneratingResume(true);
    setShowResumeView(true);
    setGeneratedResume(null);
    try {
      const progress = logger.getMasterProgress();
      const targetCountry = "Target Market (2025)"; 
      const resume = await generatePersonalizedResume(progress, targetCountry, progress.specialization);
      setGeneratedResume(resume);
    } catch (e) {
      setError("简历生成失败，请重试。");
      setShowResumeView(false);
    } finally {
      setIsGeneratingResume(false);
    }
  };

  const copyToClipboard = () => {
    if (generatedResume) {
      navigator.clipboard.writeText(generatedResume);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className={`fixed bottom-8 right-8 z-[100] transition-all duration-500 ${isOpen ? (showResumeView ? 'w-[600px]' : 'w-[400px]') : 'w-20'}`}>
      {isOpen ? (
        <div className="bg-white rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.2)] border border-slate-100 flex flex-col overflow-hidden animate-slide-up h-[650px]">
          <div className="p-6 bg-indigo-600 text-white flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
                <Sparkles size={20} />
              </div>
              <div>
                <h4 className="font-black text-sm tracking-tight">AI 职业导师 (Mentor)</h4>
                <div className="flex items-center gap-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${error ? 'bg-amber-400' : 'bg-emerald-400'} animate-pulse`} />
                  <span className="text-[9px] font-bold uppercase tracking-widest opacity-70">
                    {activeModule === LearningModule.GLOBAL_CAREER ? 'Global Career Expert' : 'Study Buddy Online'}
                  </span>
                </div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors"><ChevronDown size={20} /></button>
          </div>

          <div className="flex-1 overflow-hidden flex flex-col bg-slate-50/50">
            {showResumeView ? (
              <div className="flex-1 flex flex-col p-8 space-y-6 overflow-hidden">
                <div className="flex justify-between items-center">
                   <h3 className="text-xl font-black text-slate-800 flex items-center gap-3"><FileText className="text-indigo-600" /> 1:1 国际准简历预览</h3>
                   <button onClick={() => setShowResumeView(false)} className="text-slate-400 hover:text-slate-600 font-bold text-xs">返回导师对话</button>
                </div>
                
                <div className="flex-1 bg-white rounded-3xl border border-slate-200 overflow-y-auto p-8 shadow-inner custom-scrollbar">
                  {isGeneratingResume ? (
                    <div className="h-full flex flex-col items-center justify-center gap-4 text-slate-400">
                      <div className="relative">
                        <Loader2 className="animate-spin text-indigo-600" size={48} />
                        <Globe className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-300 animate-pulse" size={20} />
                      </div>
                      <p className="font-black text-sm uppercase tracking-widest animate-pulse">正在获取实时 JD 并构建能力模型...</p>
                    </div>
                  ) : generatedResume ? (
                    <div className="prose prose-slate prose-sm max-w-none">
                      <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 text-[10px] text-indigo-600 font-bold mb-6 flex items-center gap-2">
                        <Info size={14} /> 简历已根据您的 Level {logger.getMasterProgress().overallLevel} 技能点与 2025 行业趋势完成定制。
                      </div>
                      <div className="whitespace-pre-wrap font-sans text-slate-700 leading-relaxed text-xs">
                        {generatedResume}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-20 opacity-30 italic">简历数据解析异常，请重试。</div>
                  )}
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={copyToClipboard}
                    disabled={!generatedResume}
                    className={`flex-1 py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-3 transition-all ${copied ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-white hover:bg-indigo-600'}`}
                  >
                    {copied ? <CheckCircle2 size={18} /> : <Copy size={18} />} {copied ? '已复制 Markdown' : '复制简历内容'}
                  </button>
                </div>
              </div>
            ) : !chatMode ? (
              <div className="p-8 space-y-8 animate-in fade-in duration-500 overflow-y-auto custom-scrollbar">
                <div className="flex justify-center py-2">
                  <div className="bg-indigo-100 p-6 rounded-[2.5rem] shadow-inner">
                    <BrainCircuit size={48} className="text-indigo-600 animate-float" />
                  </div>
                </div>
                
                <div className="space-y-6">
                  {activeModule === LearningModule.GLOBAL_CAREER && (
                    <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-6 rounded-[2rem] text-white shadow-xl space-y-4 animate-in slide-in-from-top-4">
                       <div className="flex items-center gap-3">
                         <div className="p-2 bg-white/20 rounded-xl"><FileUp size={20} /></div>
                         <h5 className="font-black text-xs uppercase tracking-widest">Premium Career Tool</h5>
                       </div>
                       <p className="text-[11px] font-medium leading-relaxed opacity-90">
                         检测到您正在查看全球职业发展。我可以基于您当前的 **{logger.getMasterProgress().specialization}** 进度，为您定制一份符合 2025 国际标准的求职简历。
                       </p>
                       <button 
                        onClick={handleGenerateResume}
                        className="w-full py-3 bg-white text-indigo-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-50 transition-all active:scale-95 shadow-lg"
                       >
                         立即生成个性化简历 <ChevronRight size={14} className="inline ml-1" />
                       </button>
                    </div>
                  )}

                  <div className="space-y-2">
                    <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest flex items-center gap-2">
                      <Lightbulb size={12} /> 实时学习建议
                    </span>
                    {loading && !advice ? (
                      <div className="space-y-3 opacity-30"><div className="h-4 bg-slate-200 rounded-full w-full animate-pulse" /><div className="h-4 bg-slate-200 rounded-full w-3/4 animate-pulse" /></div>
                    ) : (
                      <p className="text-slate-700 font-bold leading-relaxed italic text-sm">
                        "{advice?.advice || '坚持系统化学习，这是通往全球竞争力的唯一捷径。'}"
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-2">
                  <button 
                    onClick={() => setChatMode(true)}
                    className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-3 hover:bg-indigo-600 transition-all shadow-xl"
                  >
                    有问题问我？ <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col h-full">
                <div ref={scrollRef} className="flex-1 p-6 space-y-4 overflow-y-auto custom-scrollbar">
                  <div className="flex justify-start">
                    <div className="max-w-[85%] bg-white p-4 rounded-2xl rounded-tl-none border border-slate-100 text-xs text-slate-700 shadow-sm leading-relaxed">
                      我是你的职业与学术导师。在 <b>{activeModule}</b> 方面，有什么我可以帮你的？
                    </div>
                  </div>
                  {chatHistory.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] p-4 rounded-2xl text-xs leading-relaxed ${
                        msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  {loading && (
                    <div className="flex justify-start animate-pulse"><div className="bg-white p-4 rounded-2xl border border-slate-100"><Loader2 className="animate-spin text-indigo-400" size={16} /></div></div>
                  )}
                </div>

                <div className="p-4 bg-white border-t border-slate-100">
                  <div className="relative group">
                    <input 
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="咨询导师..."
                      className="w-full bg-slate-50 border-2 border-slate-50 focus:border-indigo-600 rounded-2xl py-4 pl-6 pr-14 outline-none transition-all font-medium text-xs"
                    />
                    <button 
                      onClick={handleSendMessage}
                      disabled={loading || !userInput.trim()}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-30 active:scale-90 shadow-lg"
                    >
                      <Send size={18} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <button onClick={() => setIsOpen(true)} className="group relative w-20 h-20 bg-indigo-600 text-white rounded-[2rem] shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all animate-float">
          <div className={`absolute -top-1 -right-1 w-6 h-6 ${error ? 'bg-amber-500' : 'bg-emerald-500'} rounded-full border-4 border-slate-50 z-10`} />
          <MessageSquare size={32} />
          <span className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-black px-3 py-1.5 rounded-xl opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap">Personal Mentor</span>
        </button>
      )}
    </div>
  );
};

export default AIMentor;
