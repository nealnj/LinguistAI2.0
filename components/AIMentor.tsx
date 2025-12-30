
import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, MessageSquare, X, Send, Loader2, ChevronDown, BrainCircuit, Lightbulb, ArrowRight, FileText, Copy, CheckCircle2, FileUp, Globe, Info, ChevronRight, Bug, AlertTriangle
} from 'lucide-react';
import { generateMentorAdvice, generatePersonalizedResume } from '../services/geminiService';
import { LearningModule, UserFeedback } from '../types';
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
  
  // 反馈模式
  const [feedbackMode, setFeedbackMode] = useState(false);
  const [feedbackContent, setFeedbackContent] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);

  const [showResumeView, setShowResumeView] = useState(false);
  const [isGeneratingResume, setIsGeneratingResume] = useState(false);
  const [generatedResume, setGeneratedResume] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchAdvice = async () => {
      setLoading(true);
      try {
        const data = await generateMentorAdvice(activeModule);
        setAdvice(data);
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    fetchAdvice();
    setChatHistory([]); setChatMode(false); setShowResumeView(false); setFeedbackMode(false); setFeedbackSent(false);
  }, [activeModule]);

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [chatHistory]);

  const handleSendMessage = async () => {
    if (!userInput.trim()) return;
    const msg = userInput; setUserInput('');
    setChatHistory(prev => [...prev, { role: 'user', text: msg }]);
    setLoading(true);
    try {
      const data = await generateMentorAdvice(activeModule, msg);
      setChatHistory(prev => [...prev, { role: 'ai', text: data.advice }]);
    } catch (e) { setChatHistory(prev => [...prev, { role: 'ai', text: '导师忙碌中。' }]); } finally { setLoading(false); }
  };

  const handleSendFeedback = () => {
    if (!feedbackContent.trim()) return;
    logger.addFeedback({
      phone: logger.getCurrentUser()?.phone || 'guest',
      module: activeModule,
      issueType: 'experience',
      content: feedbackContent,
      contextData: { activeModule, timestamp: Date.now() }
    });
    setFeedbackSent(true);
    setTimeout(() => { setFeedbackMode(false); setFeedbackSent(false); setFeedbackContent(''); }, 2000);
  };

  const handleGenerateResume = async () => {
    setIsGeneratingResume(true); setShowResumeView(true);
    try {
      const resume = await generatePersonalizedResume(logger.getMasterProgress(), "Target Market (2025)", logger.getMasterProgress().specialization);
      setGeneratedResume(resume);
    } catch (e) { setError("生成失败。"); } finally { setIsGeneratingResume(false); }
  };

  return (
    <div className={`fixed bottom-8 right-8 z-[100] transition-all duration-500 ${isOpen ? (showResumeView ? 'w-[600px]' : 'w-[400px]') : 'w-20'}`}>
      {isOpen ? (
        <div className="bg-white rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.2)] border border-slate-100 flex flex-col overflow-hidden animate-slide-up h-[650px]">
          <div className="p-6 bg-indigo-600 text-white flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md"><Sparkles size={20} /></div>
              <div>
                <h4 className="font-black text-sm tracking-tight">AI 导师 & 智能客服</h4>
                <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /><span className="text-[9px] font-black uppercase tracking-widest opacity-70">Active Self-Healing Mode</span></div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors"><ChevronDown size={20} /></button>
          </div>

          <div className="flex-1 overflow-hidden flex flex-col bg-slate-50/50 relative">
            {feedbackMode ? (
              <div className="p-8 space-y-6 flex flex-col h-full animate-in fade-in">
                 <div className="flex justify-between items-center">
                   <h3 className="text-xl font-black text-slate-800 flex items-center gap-3"><Bug className="text-rose-500" /> 问题反馈</h3>
                   <button onClick={() => setFeedbackMode(false)} className="text-slate-400 font-bold text-xs">取消</button>
                 </div>
                 {feedbackSent ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
                      <div className="bg-emerald-100 p-6 rounded-full text-emerald-600 animate-bounce"><CheckCircle2 size={48} /></div>
                      <h4 className="text-xl font-black text-slate-800">反馈已提交！</h4>
                      <p className="text-xs text-slate-400 font-medium">AI 正在尝试在后台针对此问题<br/>生成全局优化策略...</p>
                    </div>
                 ) : (
                    <div className="flex-1 flex flex-col space-y-6">
                      <p className="text-xs text-slate-500 font-medium leading-relaxed">遇到了什么问题？例如：内容生硬、发音不准、翻译错误。AI 导师将学习您的反馈并实时修正生成逻辑。</p>
                      <textarea value={feedbackContent} onChange={(e) => setFeedbackContent(e.target.value)} placeholder="描述您遇到的问题..." className="flex-1 bg-white border-2 border-slate-100 rounded-3xl p-6 outline-none focus:border-indigo-600 transition-all font-medium text-sm resize-none shadow-inner" />
                      <button onClick={handleSendFeedback} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-sm hover:bg-indigo-600 transition-all shadow-xl">提交给自愈中心</button>
                    </div>
                 )}
              </div>
            ) : showResumeView ? (
              <div className="flex-1 flex flex-col p-8 space-y-6 overflow-hidden">
                <div className="flex justify-between items-center"><h3 className="text-xl font-black text-slate-800 flex items-center gap-3"><FileText className="text-indigo-600" /> 国际准简历预览</h3><button onClick={() => setShowResumeView(false)} className="text-slate-400 hover:text-slate-600 font-bold text-xs">返回</button></div>
                <div className="flex-1 bg-white rounded-3xl border border-slate-200 overflow-y-auto p-8 shadow-inner custom-scrollbar">
                  {isGeneratingResume ? <div className="h-full flex flex-col items-center justify-center gap-4 text-slate-400 animate-pulse"><Loader2 className="animate-spin text-indigo-600" size={48} /><p className="font-black text-sm uppercase tracking-widest">构建能力模型中...</p></div> : <div className="whitespace-pre-wrap font-sans text-slate-700 leading-relaxed text-xs">{generatedResume}</div>}
                </div>
                <button onClick={() => { navigator.clipboard.writeText(generatedResume!); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className={`w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-3 transition-all ${copied ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-white hover:bg-indigo-600'}`}>{copied ? <CheckCircle2 size={18} /> : <Copy size={18} />} {copied ? '已复制' : '复制简历'}</button>
              </div>
            ) : !chatMode ? (
              <div className="p-8 space-y-8 animate-in fade-in duration-500 overflow-y-auto custom-scrollbar">
                <div className="flex justify-center py-2"><div className="bg-indigo-100 p-6 rounded-[2.5rem] shadow-inner"><BrainCircuit size={48} className="text-indigo-600 animate-float" /></div></div>
                <div className="space-y-6">
                  {activeModule === LearningModule.GLOBAL_CAREER && <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-6 rounded-[2rem] text-white shadow-xl space-y-4"><div className="flex items-center gap-3"><div className="p-2 bg-white/20 rounded-xl"><FileUp size={20} /></div><h5 className="font-black text-xs uppercase tracking-widest">Premium Career Tool</h5></div><p className="text-[11px] font-medium leading-relaxed opacity-90">基于当前进度生成国际简历。</p><button onClick={handleGenerateResume} className="w-full py-3 bg-white text-indigo-600 rounded-xl font-black text-[10px] uppercase hover:bg-indigo-50 transition-all shadow-lg">立即生成 <ChevronRight size={14} className="inline ml-1" /></button></div>}
                  <div className="space-y-2"><span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest flex items-center gap-2"><Lightbulb size={12} /> 实时学习建议</span><p className="text-slate-700 font-bold leading-relaxed italic text-sm">"{advice?.advice || '坚持系统化学习，这是通往全球竞争力的捷径。'}"</p></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => setChatMode(true)} className="py-4 bg-slate-900 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-3 hover:bg-indigo-600 transition-all shadow-xl">提问 <MessageSquare size={18} /></button>
                  <button onClick={() => setFeedbackMode(true)} className="py-4 bg-rose-50 text-rose-600 rounded-2xl font-black text-sm flex items-center justify-center gap-3 hover:bg-rose-100 transition-all border border-rose-100">一键纠错 <Bug size={18} /></button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col h-full">
                <div ref={scrollRef} className="flex-1 p-6 space-y-4 overflow-y-auto custom-scrollbar">
                  <div className="flex justify-start"><div className="max-w-[85%] bg-white p-4 rounded-2xl border border-slate-100 text-xs text-slate-700 shadow-sm leading-relaxed">我是你的职业与学术导师。关于 <b>{activeModule}</b> 模块，有什么我可以帮你的？</div></div>
                  {chatHistory.map((msg, i) => <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[85%] p-4 rounded-2xl text-xs leading-relaxed ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'}`}>{msg.text}</div></div>)}
                  {loading && <div className="flex justify-start animate-pulse"><div className="bg-white p-4 rounded-2xl border border-slate-100"><Loader2 className="animate-spin text-indigo-400" size={16} /></div></div>}
                </div>
                <div className="p-4 bg-white border-t border-slate-100"><div className="relative group"><input value={userInput} onChange={(e) => setUserInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} placeholder="咨询导师..." className="w-full bg-slate-50 border-2 border-slate-50 focus:border-indigo-600 rounded-2xl py-4 pl-6 pr-14 outline-none font-medium text-xs transition-all" /><button onClick={handleSendMessage} disabled={loading || !userInput.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-30 shadow-lg"><Send size={18} /></button></div></div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <button onClick={() => setIsOpen(true)} className="group relative w-20 h-20 bg-indigo-600 text-white rounded-[2rem] shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all animate-float">
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-4 border-slate-50 z-10" />
          <MessageSquare size={32} />
          <span className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-black px-3 py-1.5 rounded-xl opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap">Mentor & Help</span>
        </button>
      )}
    </div>
  );
};

export default AIMentor;
