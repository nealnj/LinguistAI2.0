
import React, { useState } from 'react';
import { Sparkles, Phone, Lock, ArrowRight, UserCheck, ShieldCheck, Crown, Clock, Check, Zap, X } from 'lucide-react';
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
    // 先显示权益选择框
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
                 <UserCheck size={12} /> 独立数据加密存储
               </span>
            </div>
          </form>
        </div>

        <p className="text-center mt-10 text-slate-400 text-xs leading-relaxed max-w-xs mx-auto">
          注册即表示同意《用户服务协议》与《隐私政策》，您的学习数据将安全加密于个人终端。
        </p>
      </div>

      {/* 权益选择弹窗 */}
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
                <p className="text-slate-500 font-medium">系统检测到您是正在进阶的 Learner，请为接下来的学习选择模式：</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 方案 1: 免费试用 */}
                <div className="p-8 rounded-[2.5rem] border-2 border-slate-100 bg-slate-50 flex flex-col justify-between hover:border-slate-200 transition-all">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-slate-400 font-black text-[10px] uppercase tracking-widest">
                      <Clock size={14} /> 基础版
                    </div>
                    <h3 className="text-2xl font-black text-slate-800">每日免费试用</h3>
                    <ul className="space-y-3 pt-4">
                      <li className="flex items-center gap-2 text-xs font-bold text-slate-600"><Check size={14} className="text-emerald-500" /> 每日 30 分钟免费额度</li>
                      <li className="flex items-center gap-2 text-xs font-bold text-slate-600"><Check size={14} className="text-emerald-500" /> 基础 AI 导师建议</li>
                      <li className="flex items-center gap-2 text-xs font-bold text-slate-600"><Check size={14} className="text-emerald-500" /> 学习进度永久保存</li>
                    </ul>
                  </div>
                  <button 
                    onClick={() => handleChoice(false)}
                    className="mt-10 w-full py-4 bg-white border-2 border-slate-200 text-slate-600 rounded-2xl font-black text-sm hover:bg-slate-100 transition-all"
                  >
                    先试用看看
                  </button>
                </div>

                {/* 方案 2: Pro 版 */}
                <div className="p-8 rounded-[2.5rem] border-2 border-indigo-600 bg-indigo-50 flex flex-col justify-between relative overflow-hidden ring-4 ring-indigo-50">
                  <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[8px] font-black px-4 py-1.5 uppercase tracking-widest rounded-bl-2xl">
                    Most Value
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-indigo-600 font-black text-[10px] uppercase tracking-widest">
                      <Crown size={14} /> 专业版 (PRO)
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-indigo-950 tracking-tighter">¥5</span>
                      <span className="text-xs font-bold text-indigo-400">/ 月度</span>
                    </div>
                    <ul className="space-y-3 pt-4">
                      <li className="flex items-center gap-2 text-xs font-bold text-indigo-900"><Check size={14} className="text-indigo-600" /> 无限学习时长，不限次数</li>
                      <li className="flex items-center gap-2 text-xs font-bold text-indigo-900"><Check size={14} className="text-indigo-600" /> 深度行业英语定制内容</li>
                      <li className="flex items-center gap-2 text-xs font-bold text-indigo-900"><Check size={14} className="text-indigo-600" /> 优先响应 AI 导师对话</li>
                    </ul>
                  </div>
                  <button 
                    onClick={() => handleChoice(true)}
                    className="mt-10 w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm hover:bg-indigo-700 shadow-xl shadow-indigo-200 transition-all flex items-center justify-center gap-2"
                  >
                    立即充值升级 <ArrowRight size={16} />
                  </button>
                </div>
              </div>

              <p className="text-center text-[10px] text-slate-400 font-medium">
                * 每天均有 30 分钟免费时长，超出后需付费使用。
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginView;
