
import React, { useState } from 'react';
import { X, ShieldCheck, Zap, Info, ArrowRight, MessageCircle, Copy, CheckCircle2 } from 'lucide-react';

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
          <div className="p-10 bg-indigo-600 text-white space-y-8 flex flex-col justify-center">
            <div className="bg-white/10 w-fit p-3 rounded-2xl backdrop-blur-md">
              <ShieldCheck size={28} />
            </div>
            <div className="space-y-3">
              <h2 className="text-3xl font-black tracking-tighter leading-tight">升级 Pro<br/>解锁无限可能</h2>
              <p className="text-indigo-100 text-sm leading-relaxed font-medium">
                每日 30 分钟免费额度已用完。只需一顿早餐钱，即可解锁全天候 AI 导师辅导，彻底打破语言学习边界。
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10">
                <div className="text-amber-400 font-black text-2xl">¥5</div>
                <div className="flex-1">
                  <div className="text-[10px] font-black uppercase tracking-widest opacity-60">超值订阅方案</div>
                  <div className="text-xs font-bold">全月无限次学习 (30天)</div>
                </div>
              </div>
              <ul className="space-y-2">
                {['不限时长的 AI 对话', '深度行业词库解锁', '导出学习报告', '优先技术支持'].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-[10px] font-bold text-indigo-200">
                    <CheckCircle2 size={12} className="text-emerald-400" /> {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Contact Side */}
          <div className="p-10 text-center space-y-8 bg-white flex flex-col justify-center">
            <div className="space-y-2">
              <div className="bg-indigo-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto text-indigo-600 mb-2">
                <MessageCircle size={32} />
              </div>
              <h3 className="text-xl font-black text-slate-800 tracking-tight">添加导师微信激活</h3>
              <p className="text-xs text-slate-400 font-medium">由于系统维护，请联系教务人工处理</p>
            </div>

            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4 relative">
              <div className="text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">导师微信号 (同手机)</p>
                <div className="text-2xl font-black text-indigo-600 tracking-tighter mb-4">{wechatId}</div>
                <button 
                  onClick={handleCopy}
                  className={`w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all active:scale-95 ${
                    copied ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-white hover:bg-slate-800'
                  }`}
                >
                  {copied ? <><CheckCircle2 size={18} /> 已复制 ID</> : <><Copy size={18} /> 复制微信号</>}
                </button>
              </div>
            </div>

            <div className="space-y-4 text-left">
               <div className="flex items-start gap-3 bg-amber-50 p-4 rounded-2xl border border-amber-100">
                 <div className="text-amber-500 mt-1"><Info size={16} /></div>
                 <p className="text-[10px] text-amber-900 font-bold leading-relaxed">
                   添加好友时请备注：<span className="text-slate-900 underline">“学习充值”</span>。导师将在 5 分钟内为您手动开通 Pro 权限。
                 </p>
               </div>
               
               <div className="pt-2">
                 <p className="text-[9px] text-slate-300 font-medium text-center">
                   支持微信 / 支付宝 / 银行转账<br/>
                   人工服务时间：08:00 - 23:00
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
