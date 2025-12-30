
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
  AlertTriangle
} from 'lucide-react';
import { generateMentorAdvice } from '../services/geminiService';
import { LearningModule } from '../types';

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
        if (e.message?.includes('429')) {
          setError('导师目前太忙了 (API 频率限制)，请稍后再问。');
        } else {
          setError('连接导师失败。');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchAdvice();
    // Reset chat history when module changes
    setChatHistory([]);
    setChatMode(false);
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
    setError(null);
    try {
      const data = await generateMentorAdvice(activeModule, userMsg);
      setChatHistory(prev => [...prev, { role: 'ai', text: data.advice }]);
    } catch (e: any) {
      console.error(e);
      const msg = e.message?.includes('429') 
        ? '发送过快，请稍等片刻...' 
        : '导师暂时无法回答，请重试。';
      setChatHistory(prev => [...prev, { role: 'ai', text: msg }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`fixed bottom-8 right-8 z-[100] transition-all duration-500 ${isOpen ? 'w-[400px]' : 'w-20'}`}>
      {isOpen ? (
        <div className="bg-white rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.2)] border border-slate-100 flex flex-col overflow-hidden animate-slide-up h-[600px]">
          {/* Header */}
          <div className="p-6 bg-indigo-600 text-white flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
                <Sparkles size={20} />
              </div>
              <div>
                <h4 className="font-black text-sm tracking-tight">Linguist AI Mentor</h4>
                <div className="flex items-center gap-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${error ? 'bg-amber-400' : 'bg-emerald-400'} animate-pulse`} />
                  <span className="text-[9px] font-bold uppercase tracking-widest opacity-70">Study Buddy Online</span>
                </div>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-white/10 rounded-xl transition-colors"
            >
              <ChevronDown size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-hidden flex flex-col bg-slate-50/50">
            {!chatMode ? (
              <div className="p-8 space-y-8 animate-in fade-in duration-500">
                <div className="flex justify-center py-4">
                  <div className="bg-indigo-100 p-6 rounded-[2.5rem] shadow-inner">
                    <BrainCircuit size={48} className="text-indigo-600 animate-float" />
                  </div>
                </div>
                
                <div className="space-y-6">
                  {error && (
                    <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center gap-3 text-amber-800 text-xs font-bold">
                      <AlertTriangle size={18} />
                      {error}
                    </div>
                  )}

                  <div className="space-y-2">
                    <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest flex items-center gap-2">
                      <Lightbulb size={12} /> Personalized Advice
                    </span>
                    {loading && !advice ? (
                      <div className="space-y-3">
                        <div className="h-4 bg-slate-200 rounded-full w-full animate-pulse" />
                        <div className="h-4 bg-slate-200 rounded-full w-3/4 animate-pulse" />
                      </div>
                    ) : (
                      <p className="text-slate-700 font-bold leading-relaxed italic">
                        "{advice?.advice || '继续保持，卓越就在前方！'}"
                      </p>
                    )}
                  </div>

                  <div className="bg-white p-6 rounded-3xl border border-indigo-100 shadow-sm space-y-3">
                    <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Mentor Action</span>
                    <p className="text-sm text-slate-600 font-medium">
                      {advice?.actionableTip || '点击下方按钮与我开始对话。'}
                    </p>
                  </div>
                </div>

                <div className="pt-4">
                  <button 
                    onClick={() => setChatMode(true)}
                    className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-3 hover:bg-indigo-600 transition-all shadow-xl active:scale-95 group"
                  >
                    有问题问我？ <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col h-full">
                <div 
                  ref={scrollRef}
                  className="flex-1 p-6 space-y-4 overflow-y-auto scrollbar-hide"
                >
                  <div className="flex justify-start">
                    <div className="max-w-[85%] bg-white p-4 rounded-2xl rounded-tl-none border border-slate-100 text-sm text-slate-700 shadow-sm">
                      针对 <b>{activeModule}</b> 模块，你想深入了解什么？不管是语法疑问还是学习技巧，我都在。
                    </div>
                  </div>
                  {chatHistory.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] p-4 rounded-2xl text-sm ${
                        msg.role === 'user' 
                          ? 'bg-indigo-600 text-white rounded-tr-none' 
                          : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  {loading && (
                    <div className="flex justify-start animate-pulse">
                      <div className="bg-white p-4 rounded-2xl border border-slate-100">
                        <Loader2 className="animate-spin text-indigo-400" size={16} />
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-4 bg-white border-t border-slate-100">
                  <div className="relative group">
                    <input 
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Ask your mentor..."
                      className="w-full bg-slate-50 border-2 border-slate-50 focus:border-indigo-600 rounded-2xl py-4 pl-6 pr-14 outline-none transition-all font-medium text-sm"
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
          
          <div className="p-4 bg-slate-100 border-t border-slate-200 flex justify-center">
             <button 
              onClick={() => setChatMode(!chatMode)}
              className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors"
             >
               {chatMode ? 'Switch to Insights' : 'Open Direct Chat'}
             </button>
          </div>
        </div>
      ) : (
        <button 
          onClick={() => setIsOpen(true)}
          className="group relative w-20 h-20 bg-indigo-600 text-white rounded-[2rem] shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all animate-float"
        >
          <div className={`absolute -top-1 -right-1 w-6 h-6 ${error ? 'bg-amber-500' : 'bg-emerald-500'} rounded-full border-4 border-slate-50 z-10`} />
          <MessageSquare size={32} />
          <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 rounded-[2rem] transition-opacity" />
          <span className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-black px-3 py-1.5 rounded-xl opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap">
            Personal Mentor
          </span>
        </button>
      )}
    </div>
  );
};

export default AIMentor;
