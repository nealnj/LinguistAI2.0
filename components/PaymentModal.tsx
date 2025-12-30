
import React, { useState } from 'react';
import { X, ShieldCheck, Zap, Info, ArrowRight, MessageCircle, Copy, CheckCircle2, Clock, Sparkles } from 'lucide-react';

interface PaymentModalProps {
  onClose: () => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ onClose }) => {
  const [copied, setCopied] = useState(false);
  const wechatId = '13776635859';

  const handleCopy = () => {
    navigator.clipboard.writeText(wechatId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[300] bg-slate-900/80 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="max-w-2xl w-full bg-white rounded-[3.5rem] shadow-2xl overflow-hidden relative animate-slide-up">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 bg-slate-100 hover:bg-slate-200 text-slate-400 rounded-full transition-all active:scale-90 z-10"
        >
          <X size={20} />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Info Side */}
          <div className="p-10 bg-slate-900 text-white space-y-8 flex flex-col justify-center relative overflow-hidden">
            <div className="absolute top-0 left-0 p-8 opacity-5 -rotate-12"><Zap size={200} /></div>
            
            <div className="bg-white/10 w-fit p-3 rounded-2xl backdrop-blur-md relative z-10">
              <ShieldCheck size={28} className="text-indigo-400" />
            </div>
            
            <div className="space-y-3 relative z-10">
              <h2 className="text-3xl font-black tracking-tighter leading-tight">投资您的<br/>全球化能力</h2>
              <p className="text-slate-400 text-sm leading-relaxed font-medium">
                LinguistAI 采用阶梯灵活定价，确保每一位学习者都能以最低门槛接触顶级 AI 教学资源。
              </p>
            </div>
            
            <div className="space-y-4 relative z-10">
              {/* Option: Pro */}
              <div className="bg-white/5 p-5 rounded-2xl border border-white/10 space-y-2 group hover:bg-white/10 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="text-amber-400 font-black text-2xl tracking-tighter">¥200 <span className="text-[10px] text-slate-500">/ $28</span></div>
                  <span className="bg-indigo-600 text-white text-[8px] font-black px-2 py-1 rounded-lg">PRO 订阅</span>
                </div>
                <p className="text-[10px] text-slate-400 font-bold">全月 30 天无限次高频使用，适合备考及职场人士。</p>
              </div>

              {/* Option: Experience (Updated) */}
              <div className="bg-indigo-600 p-5 rounded-2xl border border-indigo-500 space-y-2 shadow-xl shadow-indigo-900/50">
                <div className="flex justify-between items-start">
                  <div className="text-white font-black text-2xl tracking-tighter">¥5 <span className="text-[10px] text-indigo-200">/ 2天</span></div>
                  <span className="bg-white text-indigo-600 text-[8px] font-black px-2 py-1 rounded-lg">体验价</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={12} className="text-indigo-200" />
                  <p className="text-[10px] text-indigo-100 font-bold italic">支持滚动购买，最长可连续使用 6 个月。</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Side */}
          <div className="p-10 text-center space-y-8 bg-white flex flex-col justify-center">
            <div className="space-y-2">
              <div className="bg-indigo-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto text-indigo-600 mb-2">
                <MessageCircle size={32} />
              </div>
              <h3 className="text-xl font-black text-slate-800 tracking-tight">添加教务微信激活</h3>
              <p className="text-xs text-slate-400 font-medium">人工审核充值，5分钟内开通</p>
            </div>

            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4 relative">
              <div className="text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">教务微信号</p>
                <div className="text-2xl font-black text-indigo-600 tracking-tighter mb-4">{wechatId}</div>
                <button 
                  onClick={handleCopy}
                  className={`w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all active:scale-95 ${
                    copied ? 'bg-emerald-500 text-white shadow-emerald-100' : 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-200'
                  } shadow-xl`}
                >
                  {copied ? <><CheckCircle2 size={18} /> 已复制 ID</> : <><Copy size={18} /> 复制微信号</>}
                </button>
              </div>
            </div>

            <div className="space-y-4 text-left">
               <div className="flex items-start gap-3 bg-amber-50 p-4 rounded-2xl border border-amber-100">
                 <div className="text-amber-500 mt-1"><Sparkles size={16} /></div>
                 <p className="text-[10px] text-amber-900 font-bold leading-relaxed">
                   添加好友时备注 <span className="text-slate-900 underline">“5元体验”</span> 或 <span className="text-slate-900 underline">“200订阅”</span>。您可以选择一次性充值 15 元解锁 6 天，以此类推。
                 </p>
               </div>
               
               <div className="pt-2">
                 <p className="text-[9px] text-slate-300 font-medium text-center">
                   支持微信 / 支付宝 / PayPal<br/>
                   人工在线：08:00 - 23:30
                 </p>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
