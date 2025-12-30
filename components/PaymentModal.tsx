
import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  Zap, 
  Info, 
  ArrowRight, 
  MessageCircle, 
  Copy, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  Crown, 
  Globe, 
  GraduationCap, 
  FileUser, 
  Trophy,
  Star,
  Gift
} from 'lucide-react';
import { logger } from '../services/logger';

interface PaymentModalProps {
  onClose: () => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ onClose }) => {
  const [copied, setCopied] = useState(false);
  const wechatId = '13776635859';
  
  // 获取最新定价配置
  const pricing = logger.getPricingConfig();
  const discountedPrice = Math.round(pricing.originalAnnualPrice * pricing.discountRate);
  const discountPercent = Math.round((1 - pricing.discountRate) * 100);

  const handleCopy = () => {
    navigator.clipboard.writeText(wechatId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const proFeatures = [
    { 
      icon: <Sparkles className="text-amber-400" />, 
      title: "24/7 随身 AI 导师", 
      desc: "随时随地开启沉浸式语音/文字对话，专业口语陪练。" 
    },
    { 
      icon: <GraduationCap className="text-indigo-400" />, 
      title: "全等级课程大纲", 
      desc: "覆盖 A0 基础到雅思 8.0/剑桥 C2，系统化进阶路径。" 
    },
    { 
      icon: <Globe className="text-emerald-400" />, 
      title: "全球职业透视", 
      desc: "实时获取 2024-2025 全球高薪职缺与工签动态。" 
    },
    { 
      icon: <FileUser className="text-rose-400" />, 
      title: "简历定制与投递指导", 
      desc: "根据个人能力动态生成 1:1 欧美标准职场简历。" 
    },
    { 
      icon: <Zap className="text-blue-400" />, 
      title: "无限量 AI 解析次数", 
      desc: "解除每日时长限制，深度使用所有高阶语义分析工具。" 
    }
  ];

  return (
    <div className="fixed inset-0 z-[300] bg-slate-900/90 backdrop-blur-2xl flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="max-w-4xl w-full bg-white rounded-[4rem] shadow-[0_40px_100px_-15px_rgba(0,0,0,0.4)] overflow-hidden relative animate-slide-up flex flex-col md:flex-row">
        <button 
          onClick={onClose}
          className="absolute top-8 right-8 p-3 bg-slate-100 hover:bg-slate-200 text-slate-400 rounded-full transition-all active:scale-90 z-20"
        >
          <X size={20} />
        </button>

        {/* Left: Value Proposition */}
        <div className="md:w-3/5 p-12 bg-gradient-to-br from-slate-900 via-indigo-950 to-indigo-900 text-white space-y-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-5 -rotate-12 translate-x-20 -translate-y-20"><Crown size={400} /></div>
          
          <div className="relative z-10 space-y-4">
            <div className="inline-flex items-center gap-2 bg-amber-400/10 px-4 py-1.5 rounded-full border border-amber-400/20 text-amber-400">
              <Star size={14} fill="currentColor" />
              <span className="text-[10px] font-black uppercase tracking-widest">Premium Member Benefits</span>
            </div>
            <h2 className="text-4xl font-black tracking-tighter leading-tight">
              投资您的<br/>
              <span className="text-indigo-400">全球化竞争能力</span>
            </h2>
            <p className="text-slate-400 font-medium text-sm leading-relaxed max-w-sm">
              不仅仅是学习，更是为您打开通往全球高薪职场的大门。加入 Pro 会员，开启全量进化。
            </p>
          </div>

          <div className="relative z-10 space-y-6">
            {proFeatures.map((f, i) => (
              <div key={i} className="flex gap-5 group">
                <div className="shrink-0 p-3 bg-white/5 rounded-2xl border border-white/10 group-hover:bg-white/10 transition-colors">
                  {f.icon}
                </div>
                <div>
                  <h4 className="font-black text-sm text-slate-100 mb-1">{f.title}</h4>
                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="relative z-10 pt-4 flex items-center gap-4">
            <div className="flex -space-x-3">
               {[1,2,3,4].map(i => <div key={i} className={`w-8 h-8 rounded-full border-2 border-slate-900 bg-slate-700 flex items-center justify-center text-[10px] font-bold`}>{String.fromCharCode(64+i)}</div>)}
            </div>
            <p className="text-[10px] text-slate-500 font-bold">已有 12,000+ 学员正在使用 Pro 进阶</p>
          </div>
        </div>

        {/* Right: Pricing & Payment */}
        <div className="md:w-2/5 p-12 flex flex-col justify-center text-center space-y-10 bg-white relative">
          <div className="space-y-4">
             <div className="bg-indigo-50 w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto text-indigo-600 mb-2 shadow-inner">
               <Trophy size={40} />
             </div>
             <h3 className="text-2xl font-black text-slate-800 tracking-tight">年度权益激活</h3>
          </div>

          <div className="space-y-4">
            {/* Price Option: Pro Annual */}
            <div className="p-8 rounded-[2.5rem] bg-slate-50 border-4 border-indigo-600 relative shadow-2xl shadow-indigo-100 scale-105 group">
               <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] font-black px-5 py-1.5 rounded-full uppercase tracking-widest shadow-lg flex items-center gap-2">
                 <Gift size={12} /> 推广特惠 {discountPercent}% OFF
               </div>
               <div className="text-slate-500 text-[10px] font-black uppercase mb-1">PRO Ultimate Annual</div>
               
               <div className="flex flex-col items-center gap-1 mb-2">
                 <div className="text-slate-300 line-through text-sm font-bold">原价 ¥{pricing.originalAnnualPrice}</div>
                 <div className="flex items-baseline justify-center gap-1">
                   <span className="text-4xl font-black text-slate-900">¥{discountedPrice}</span>
                   <span className="text-xs font-bold text-slate-400">/ 365 Days</span>
                 </div>
               </div>
               
               <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                 平均每月仅需 ¥{Math.round(discountedPrice / 12)}。包含全量 AI 获取权限。
               </p>
            </div>

            {/* Price Option: Starter Pack */}
            <div className="p-6 rounded-[2.5rem] border-2 border-slate-100 bg-white hover:border-indigo-200 transition-all group">
               <div className="flex justify-between items-center mb-1">
                 <span className="text-lg font-black text-slate-800 tracking-tighter">¥5 <span className="text-xs font-bold text-slate-400">/ 2 Days</span></span>
                 <span className="text-[8px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded-lg">Trial Pack</span>
               </div>
               <p className="text-[9px] text-slate-400 font-medium text-left">支持购买续期，短期冲刺首选。</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-slate-900 p-6 rounded-[2rem] border border-slate-800 space-y-4 relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:scale-110 transition-transform"><MessageCircle size={80} /></div>
               <div className="text-center relative z-10">
                 <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">加教务微信 · 人工极速开通</p>
                 <div className="text-2xl font-black text-indigo-400 tracking-tighter mb-4">{wechatId}</div>
                 <button 
                  onClick={handleCopy}
                  className={`w-full py-4 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all active:scale-95 ${
                    copied ? 'bg-emerald-600 text-white' : 'bg-white text-slate-900 hover:bg-indigo-50'
                  }`}
                 >
                   {copied ? <CheckCircle2 size={18} /> : <Copy size={18} />} {copied ? '已复制 ID' : '复制微信号'}
                 </button>
               </div>
            </div>
            
            <div className="flex items-center justify-center gap-2 opacity-40">
              <ShieldCheck size={14} />
              <span className="text-[8px] font-bold uppercase tracking-widest">Secure & encrypted payment process</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
