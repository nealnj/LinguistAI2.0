
import React, { useState } from 'react';
import { Sparkles, Phone, Lock, ArrowRight, UserCheck, ShieldCheck, Crown, Clock, Check, Zap, X, Info } from 'lucide-react';
import { logger } from '../services/logger';

interface LoginViewProps {
  onLoginSuccess: (autoShowPayment?: boolean) => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [showChoiceModal, setShowChoiceModal] = useState(false);

  const handleStartSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 11) {
      alert('请输入正确的手机号码');
      return;
    }
    setShowChoiceModal(true);
  };

  const handleChoice = (isProChoice: boolean) => {
    logger.registerOrLogin(phone, password);
    setShowChoiceModal(false);
    onLoginSuccess(isProChoice);
  };

  return (
    <div className="fixed inset-0 z-[200] bg-slate-50 flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none" />
      
      <div className="max-w-md w-full animate-slide-up">
        <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100">
          <div className="bg-indigo-600 p-10 text-white text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12"><Sparkles size={120} /></div>
            <div className="bg-white/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-md">
              <ShieldCheck size={32} />
            </div>
            <h1 className="text-3xl font-black tracking-tighter mb-2">LinguistAI</h1>
            <p className="text-indigo-100 text-sm font-medium">开启您的系统化 AI 学习之旅</p>
          </div>

          <form onSubmit={handleStartSubmit} className="p-10 space-y-6">
            <div className="space-y-4">
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                  <Phone size={20} />
                </div>
                <input 
                  type="tel" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="请输入手机号" 
                  className="w-full bg-slate-50 border-2 border-slate-50 focus:border-indigo-600 rounded-2xl py-4 pl-12 pr-6 outline-none transition-all font-bold text-slate-800"
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

            <button 
              type="submit"
              className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-lg hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200 active:scale-95 flex items-center justify-center gap-3 group"
            >
              {isRegistering ? '立即注册' : '登 录'} <ArrowRight className="group-hover:translate-x-1 transition-transform" />
            </button>

            <div className="flex items-center justify-between pt-4 border-t border-slate-50">
               <button 
                type="button"
                onClick={() => setIsRegistering(!isRegistering)}
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
        <div className="fixed inset-0 z-[300] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="max-w-2xl w-full bg-white rounded-[3.5rem] shadow-2xl overflow-hidden relative animate-slide-up">
            <button 
              onClick={() => setShowChoiceModal(false)}
              className="absolute top-6 right-6 p-2 bg-slate-100 hover:bg-slate-200 text-slate-400 rounded-full transition-all z-10"
            >
              <X size={20} />
            </button>

            <div className="p-10 md:p-14 space-y-10">
              <div className="text-center space-y-4">
                <div className="inline-flex bg-indigo-100 p-4 rounded-3xl text-indigo-600 mb-2">
                  <Zap size={32} />
                </div>
                <h2 className="text-3xl font-black text-slate-800 tracking-tighter">请选择您的学习方案</h2>
                <p className="text-slate-500 font-medium">所有新用户均可享受灵活的阶梯式付费模式</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 方案 1: 体验套餐 (更新) */}
                <div className="p-8 rounded-[2.5rem] border-2 border-indigo-200 bg-indigo-50/30 flex flex-col justify-between hover:border-indigo-300 transition-all relative">
                  <div className="absolute top-4 right-4 text-indigo-500 animate-pulse"><Sparkles size={16}/></div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-indigo-600 font-black text-[10px] uppercase tracking-widest">
                      <Clock size={14} /> 阶梯体验套餐
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-slate-900 tracking-tighter">¥5</span>
                      <span className="text-xs font-bold text-slate-400">/ 2天全功能</span>
                    </div>
                    <div className="bg-indigo-600/10 p-3 rounded-xl border border-indigo-600/10 flex items-start gap-2">
                      <Info size={14} className="text-indigo-600 mt-0.5 shrink-0" />
                      <p className="text-[10px] text-indigo-700 font-bold leading-relaxed">
                        支持滚动续费，每 5 元延期 2 天，<span className="underline decoration-indigo-300">最长可连续体验 6 个月</span>。
                      </p>
                    </div>
                    <ul className="space-y-3 pt-2">
                      <li className="flex items-center gap-2 text-[11px] font-bold text-slate-600"><Check size={12} className="text-emerald-500" /> 2天全模块 100% 开放</li>
                      <li className="flex items-center gap-2 text-[11px] font-bold text-slate-600"><Check size={12} className="text-emerald-500" /> 解锁 AI 口语与职场分析</li>
                    </ul>
                  </div>
                  <button 
                    onClick={() => handleChoice(true)}
                    className="mt-10 w-full py-4 bg-white border-2 border-indigo-600 text-indigo-600 rounded-2xl font-black text-sm hover:bg-indigo-600 hover:text-white transition-all shadow-lg shadow-indigo-100"
                  >
                    ¥5 开启体验
                  </button>
                </div>

                {/* 方案 2: Pro 版 */}
                <div className="p-8 rounded-[2.5rem] border-2 border-slate-900 bg-slate-900 text-white flex flex-col justify-between relative overflow-hidden shadow-2xl">
                  <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[8px] font-black px-4 py-1.5 uppercase tracking-widest rounded-bl-2xl">
                    Ultimate Pro
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-indigo-400 font-black text-[10px] uppercase tracking-widest">
                      <Crown size={14} /> 尊享订阅 (Monthly)
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-white tracking-tighter">¥200</span>
                        <span className="text-xs font-bold text-slate-500">/ 月度</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-bold mt-1">等价 $28.00 USD</span>
                    </div>
                    <ul className="space-y-3 pt-4">
                      <li className="flex items-center gap-2 text-[11px] font-bold text-slate-300"><Check size={12} className="text-indigo-400" /> 无限学习时长与资源</li>
                      <li className="flex items-center gap-2 text-[11px] font-bold text-slate-300"><Check size={12} className="text-indigo-400" /> 优先响应高速 AI 导师</li>
                    </ul>
                  </div>
                  <button 
                    onClick={() => handleChoice(true)}
                    className="mt-10 w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm hover:bg-indigo-700 shadow-xl shadow-indigo-500/20 transition-all flex items-center justify-center gap-2"
                  >
                    立即订阅 Pro <ArrowRight size={16} />
                  </button>
                </div>
              </div>

              <p className="text-center text-[10px] text-slate-400 font-medium">
                * 您可以随时根据学习进度在 ¥5 体验价与 ¥200 月度订阅之间切换。
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginView;
