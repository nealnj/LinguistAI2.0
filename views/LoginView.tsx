
import React, { useState } from 'react';
import { Sparkles, Phone, Lock, ArrowRight, UserCheck, ShieldCheck, Crown, Clock, Check, Zap, X, Ticket, GraduationCap, Globe, FileUser, AlertCircle, Gift } from 'lucide-react';
import { logger } from '../services/logger';

interface LoginViewProps {
  onLoginSuccess: (autoShowPayment?: boolean) => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [showChoiceModal, setShowChoiceModal] = useState(false);
  
  const pricing = logger.getPricingConfig();
  const discountedPrice = Math.round(pricing.originalAnnualPrice * pricing.discountRate);
  const discountRateLabel = Math.round(pricing.discountRate * 10);

  const validatePhone = (p: string) => /^1[3-9]\d{9}$/.test(p);

  const handleStartSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!phone) {
      setError('手机号码不能为空');
      return;
    }
    if (!validatePhone(phone)) {
      setError('请输入有效的 11 位手机号码');
      return;
    }
    setShowChoiceModal(true);
  };

  const handleChoice = (type: 'free' | 'pass' | 'starter') => {
    logger.registerOrLogin(phone, password);
    if (type === 'pass') {
      logger.activateFreePass();
    } else if (type === 'starter') {
      logger.activateStarterPack();
    }
    setShowChoiceModal(false);
    // 如果是普通登录（free），则成功后自动弹一次付费框引导
    onLoginSuccess(type === 'free'); 
  };

  const handlePhoneChange = (val: string) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 11);
    setPhone(cleaned);
    if (error) setError('');
  };

  return (
    <div className="fixed inset-0 z-[200] bg-slate-50 flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none" />
      
      <div className="max-w-md w-full animate-slide-up">
        <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100">
          <div className="bg-indigo-600 p-10 text-white text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12"><Sparkles size={120} /></div>
            <div className="bg-white/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-md">
              <ShieldCheck size={32} />
            </div>
            <h1 className="text-3xl font-black tracking-tighter mb-2">LinguistAI</h1>
            <p className="text-indigo-100 text-sm font-medium">开启您的系统化 AI 学习之旅</p>
          </div>

          <form onSubmit={handleStartSubmit} className="p-10 space-y-6">
            <div className="space-y-4">
              <div className="relative group">
                <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${error ? 'text-rose-500' : 'text-slate-400 group-focus-within:text-indigo-600'}`}>
                  <Phone size={20} />
                </div>
                <input 
                  type="tel" 
                  value={phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="请输入 11 位手机号" 
                  className={`w-full bg-slate-50 border-2 rounded-2xl py-4 pl-12 pr-6 outline-none transition-all font-bold text-slate-800 ${error ? 'border-rose-200 bg-rose-50 text-rose-900' : 'border-slate-50 focus:border-indigo-600'}`}
                  required
                />
              </div>

              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                  <Lock size={20} />
                </div>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码 (可选)" 
                  className="w-full bg-slate-50 border-2 border-slate-50 focus:border-indigo-600 rounded-2xl py-4 pl-12 pr-6 outline-none transition-all font-bold text-slate-800"
                />
              </div>
            </div>

            {error && (
              <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="text-rose-500 shrink-0" size={18} />
                <p className="text-xs font-black text-rose-600">{error}</p>
              </div>
            )}

            <button 
              type="submit"
              className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-lg hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200 active:scale-95 flex items-center justify-center gap-3 group"
            >
              {isRegistering ? '立即注册' : '登 录'} <ArrowRight className="group-hover:translate-x-1 transition-transform" />
            </button>

            <div className="flex items-center justify-between pt-4 border-t border-slate-50">
               <button 
                type="button"
                onClick={() => { setIsRegistering(!isRegistering); setError(''); }}
                className="text-xs font-black text-slate-400 hover:text-indigo-600 transition-colors uppercase tracking-widest"
               >
                 {isRegistering ? '已有账号？去登录' : '没有账号？自动注册'}
               </button>
               <span className="flex items-center gap-2 text-[10px] text-slate-300 font-bold uppercase tracking-widest">
                 <UserCheck size={12} /> 数据加密存储
               </span>
            </div>
          </form>
        </div>
      </div>

      {showChoiceModal && (
        <div className="fixed inset-0 z-[300] bg-slate-900/95 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300 overflow-y-auto">
          <div className="max-w-5xl w-full bg-white rounded-[4rem] shadow-2xl overflow-hidden relative animate-slide-up my-10">
            <button 
              onClick={() => setShowChoiceModal(false)}
              className="absolute top-8 right-8 p-3 bg-slate-100 hover:bg-slate-200 text-slate-400 rounded-full transition-all z-10"
            >
              <X size={20} />
            </button>

            <div className="p-10 md:p-16 space-y-12">
              <div className="text-center space-y-4">
                <div className="inline-flex bg-indigo-100 p-5 rounded-[2rem] text-indigo-600 mb-2">
                  <Zap size={36} />
                </div>
                <h2 className="text-4xl font-black text-slate-800 tracking-tighter">定制您的进化模式</h2>
                <p className="text-slate-500 font-medium text-lg">从此刻起，AI 导师将为您重构认知大纲</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* 选项 1: 极速通行证 */}
                <div className="p-8 rounded-[3rem] border-2 border-emerald-200 bg-emerald-50/20 flex flex-col justify-between hover:border-emerald-400 transition-all">
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 text-emerald-600 font-black text-[10px] uppercase tracking-widest">
                      <Ticket size={16} /> 极速通行证
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black text-slate-900 tracking-tighter">0元</span>
                      <span className="text-xs font-bold text-slate-400">/ 15m 深度体验</span>
                    </div>
                    <ul className="space-y-3">
                      <li className="flex items-center gap-3 text-[11px] font-bold text-slate-600"><Check size={14} className="text-emerald-500" /> 解锁所有高阶模块</li>
                      <li className="flex items-center gap-3 text-[11px] font-bold text-slate-600"><Check size={14} className="text-emerald-500" /> 1:1 感受 AI 导师能力</li>
                    </ul>
                  </div>
                  <button 
                    onClick={() => handleChoice('pass')}
                    className="mt-10 w-full py-5 bg-emerald-600 text-white rounded-2xl font-black text-sm hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
                  >
                    立即开启 15m 探索
                  </button>
                </div>

                {/* 选项 2: 阶梯成长包 (5元 48h) */}
                <div className="p-8 rounded-[3rem] border-2 border-indigo-100 bg-indigo-50/20 flex flex-col justify-between hover:border-indigo-300 transition-all">
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 text-indigo-600 font-black text-[10px] uppercase tracking-widest">
                      <Clock size={16} /> 阶梯成长包
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black text-slate-900 tracking-tighter">¥5</span>
                      <span className="text-xs font-bold text-slate-400">/ 48h 深度内化</span>
                    </div>
                    <ul className="space-y-3">
                      <li className="flex items-center gap-3 text-[11px] font-bold text-slate-600"><Check size={14} className="text-indigo-500" /> 48小时无限制语义分析</li>
                      <li className="flex items-center gap-3 text-[11px] font-bold text-slate-600"><Check size={14} className="text-indigo-500" /> 支持滚动购买与续期</li>
                    </ul>
                  </div>
                  <button 
                    onClick={() => handleChoice('starter')}
                    className="mt-10 w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-sm hover:bg-indigo-700 transition-all shadow-lg"
                  >
                    ¥5 立即开通
                  </button>
                </div>

                {/* 选项 3: 年度订阅 (年度 Pro) */}
                <div className="p-8 rounded-[3rem] border-4 border-indigo-600 bg-slate-900 text-white flex flex-col justify-between relative overflow-hidden shadow-2xl scale-105">
                  <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[9px] font-black px-6 py-2 uppercase tracking-widest rounded-bl-3xl flex items-center gap-2">
                    <Gift size={10} /> {discountRateLabel}折特惠
                  </div>
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 text-amber-400 font-black text-[10px] uppercase tracking-widest">
                      <Crown size={16} /> 尊享年度订阅
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-black text-white tracking-tighter">¥{discountedPrice}</span>
                        <span className="text-xs font-bold text-slate-500">/ 年度全量</span>
                      </div>
                    </div>
                    <div className="space-y-4 pt-2">
                      <div className="flex items-start gap-3">
                        <GraduationCap size={16} className="text-indigo-400 shrink-0 mt-0.5" />
                        <span className="text-[10px] font-bold text-slate-300">雅思/剑桥全量备考大纲</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <Globe size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                        <span className="text-[10px] font-bold text-slate-300">全球职业资讯实时获取</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <FileUser size={16} className="text-rose-400 shrink-0 mt-0.5" />
                        <span className="text-[10px] font-bold text-slate-300">1:1 欧美标准简历定制生成</span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleChoice('free')}
                    className="mt-10 w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-sm hover:bg-indigo-700 shadow-xl shadow-indigo-500/20 transition-all active:scale-95"
                  >
                    立即开启 Pro 进化
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-center gap-6 pt-4">
                <div className="flex items-center gap-2 text-slate-400">
                  <ShieldCheck size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">数据私有化加密</span>
                </div>
                <div className="w-px h-4 bg-slate-100" />
                <div className="flex items-center gap-2 text-slate-400">
                  <UserCheck size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">支持多端同步学习</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginView;
