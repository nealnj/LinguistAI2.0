
import React, { useState, useEffect } from 'react';
import { logger, PricingConfig } from '../services/logger';
import { User, UserLogEntry } from '../types';
import { 
  Users, 
  BarChart3, 
  Search, 
  ShieldAlert, 
  Unlock, 
  Clock, 
  Plus, 
  Ban, 
  CheckCircle2, 
  MessageSquare,
  ChevronRight,
  TrendingUp,
  Brain,
  Filter,
  ShieldCheck,
  Crown,
  Loader2,
  Settings,
  Activity,
  Zap,
  LayoutDashboard,
  Coins,
  Percent,
  Save,
  Tag
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

const AdminView: React.FC = () => {
  const [users, setUsers] = useState<User[]>(logger.getAllUsers());
  const [analytics, setAnalytics] = useState(logger.getAnalytics());
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userLogs, setUserLogs] = useState<UserLogEntry[]>([]);
  const [feedbackSummary, setFeedbackSummary] = useState<string>('');
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [adminPhones, setAdminPhones] = useState<Set<string>>(new Set());
  
  // 定价配置状态
  const [pricing, setPricing] = useState<PricingConfig>(logger.getPricingConfig());
  const [isSavingPricing, setIsSavingPricing] = useState(false);

  useEffect(() => {
    const checkAdmins = async () => {
      const adminSet = new Set<string>();
      for (const user of users) {
        if (await logger.isAdmin(user.phone)) {
          adminSet.add(user.phone);
        }
      }
      setAdminPhones(adminSet);
    };
    checkAdmins();
  }, [users]);

  const refreshData = () => {
    const allUsers = logger.getAllUsers();
    setUsers(allUsers);
    setAnalytics(logger.getAnalytics());
    if (selectedUser) {
      const updated = allUsers.find(u => u.phone === selectedUser.phone);
      setSelectedUser(updated || null);
    }
  };

  const handleTogglePro = (user: User) => {
    const isPro = user.subExpiry > Date.now();
    const newExpiry = isPro ? 0 : Date.now() + 365 * 24 * 3600 * 1000; // 改为年度会员
    logger.updateUserStatus(user.phone, { subExpiry: newExpiry });
    refreshData();
  };

  const handleToggleBan = (user: User) => {
    logger.updateUserStatus(user.phone, { isBanned: !user.isBanned });
    refreshData();
  };

  const handleAddTime = (user: User) => {
    const today = new Date().toISOString().split('T')[0];
    const current = user.dailyUsage[today] || 0;
    logger.updateUserStatus(user.phone, { 
      dailyUsage: { ...user.dailyUsage, [today]: Math.max(0, current - 1800) } 
    });
    refreshData();
  };

  const inspectUser = (user: User) => {
    setSelectedUser(user);
    const logs = logger.getUserLogs(user.phone);
    setUserLogs(logs);
    setFeedbackSummary('');
  };

  const savePricing = () => {
    setIsSavingPricing(true);
    logger.updatePricingConfig(pricing);
    setTimeout(() => setIsSavingPricing(false), 800);
  };

  const generateFeedbackSummary = async () => {
    if (!selectedUser) return;
    setLoadingFeedback(true);
    try {
      const logs = logger.getUserLogs(selectedUser.phone);
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `ACT AS A SENIOR DATA ANALYST.
      Analyze the learning behavior of User: ${selectedUser.phone}.
      Recent Logs: ${JSON.stringify(logs.slice(-30))}
      
      TASK: Provide a concise summary in CHINESE including:
      1. Core learning focus (Reading, Writing, etc.).
      2. Major difficulties or recurring mistakes.
      3. Suggested teaching intervention.
      Return plain text.`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt
      });
      setFeedbackSummary(response.text || '暂无法同步分析');
    } catch (e) {
      setFeedbackSummary('AI 分析失败，连接异常。');
    } finally {
      setLoadingFeedback(false);
    }
  };

  const filteredUsers = users.filter(u => u.phone.includes(searchTerm));

  const renderAvatar = (phone: string, size: string = 'w-10 h-10', textSize: string = 'text-xs') => {
    const colors = ['bg-indigo-500', 'bg-emerald-500', 'bg-violet-500', 'bg-amber-500', 'bg-rose-500', 'bg-slate-500'];
    const lastDigit = parseInt(phone.slice(-1)) || 0;
    const colorClass = colors[lastDigit % colors.length];
    
    return (
      <div className={`${size} rounded-2xl flex items-center justify-center text-white font-black ${textSize} shadow-sm ${colorClass} border-2 border-white ring-4 ring-slate-50`}>
        {phone.charAt(0)}
      </div>
    );
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-10 animate-in fade-in duration-700 pb-20">
      <header className="bg-slate-900 p-12 rounded-[4rem] text-white shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-1000">
          <ShieldCheck size={400} />
        </div>
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-end gap-12">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-md border border-white/10">
                <Settings size={28} className="text-indigo-400 animate-spin-slow" />
              </div>
              <div className="bg-indigo-600/30 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-500/30 text-indigo-400">
                LinguistAI Control Center
              </div>
            </div>
            <h1 className="text-5xl font-black tracking-tighter">系统管理与全局控制</h1>
            <p className="text-slate-400 max-w-xl text-lg font-medium leading-relaxed">
              实时同步用户行为链路，动态配置系统定价策略与订阅权限分发。
            </p>
          </div>
          
          <div className="grid grid-cols-3 gap-6 w-full lg:w-auto">
            {[
              { label: 'Total Users', value: analytics.total, icon: <Users size={18} />, color: 'text-indigo-400' },
              { label: 'Daily Active', value: analytics.dau, icon: <Activity size={18} />, color: 'text-emerald-400' },
              { label: 'Monthly Active', value: analytics.mau, icon: <TrendingUp size={18} />, color: 'text-amber-400' }
            ].map((stat, i) => (
              <div key={i} className="bg-white/5 border border-white/5 p-8 rounded-[2.5rem] backdrop-blur-xl text-center min-w-[160px] hover:bg-white/10 transition-all">
                <div className={`${stat.color} mb-3 flex justify-center`}>{stat.icon}</div>
                <div className="text-3xl font-black mb-1">{stat.value}</div>
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        <div className="lg:col-span-8 space-y-10">
          {/* 定价配置面板 */}
          <section className="bg-white rounded-[3.5rem] p-12 border border-slate-100 shadow-xl space-y-8 animate-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                  <Tag className="text-indigo-600" /> 定价策略配置
                </h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Global Pricing Strategy</p>
              </div>
              <button 
                onClick={savePricing}
                disabled={isSavingPricing}
                className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-700 transition-all disabled:opacity-50"
              >
                {isSavingPricing ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                保存配置
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Coins size={14} /> 原始年度价格 (CNY)
                </label>
                <div className="relative group">
                  <input 
                    type="number"
                    value={pricing.originalAnnualPrice}
                    onChange={(e) => setPricing({...pricing, originalAnnualPrice: Number(e.target.value)})}
                    className="w-full bg-slate-50 border-2 border-slate-50 focus:border-indigo-600 rounded-2xl py-5 px-6 outline-none transition-all font-black text-slate-800 text-xl"
                  />
                  <span className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 font-bold">元/年</span>
                </div>
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Percent size={14} /> 推广折扣率 (0-1)
                </label>
                <div className="relative group">
                  <input 
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="1"
                    value={pricing.discountRate}
                    onChange={(e) => setPricing({...pricing, discountRate: Number(e.target.value)})}
                    className="w-full bg-slate-50 border-2 border-slate-50 focus:border-indigo-600 rounded-2xl py-5 px-6 outline-none transition-all font-black text-slate-800 text-xl"
                  />
                  <span className="absolute right-6 top-1/2 -translate-y-1/2 text-indigo-600 font-black">
                    {Math.round(pricing.discountRate * 10)} 折
                  </span>
                </div>
              </div>
            </div>

            <div className="p-6 bg-indigo-50 rounded-[2rem] flex items-center justify-between border border-indigo-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm">
                  <Zap size={20} />
                </div>
                <div>
                  <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">预览优惠价</div>
                  <div className="text-2xl font-black text-indigo-900">
                    ¥{Math.round(pricing.originalAnnualPrice * pricing.discountRate)}
                    <span className="text-sm font-bold text-indigo-400 ml-2">/ 年度会员</span>
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-indigo-500/60 font-medium italic max-w-[200px] text-right">
                修改将立即同步至所有用户的支付界面，建议在大促期间灵活调整折扣。
              </p>
            </div>
          </section>

          <div className="bg-white rounded-[3.5rem] p-12 border border-slate-100 shadow-xl space-y-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-1">
                <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                  <Users className="text-indigo-600" /> 用户目录
                </h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Member Registry</p>
              </div>
              <div className="relative group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={18} />
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="检索手机号或姓名..." 
                  className="bg-slate-50 border-2 border-slate-50 focus:border-indigo-600 rounded-2xl py-4 pl-14 pr-8 outline-none transition-all font-bold text-sm w-full md:w-80 shadow-inner"
                />
              </div>
            </div>

            <div className="overflow-x-auto scrollbar-hide">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-slate-100">
                    <th className="pb-8 text-[11px] font-black text-slate-400 uppercase tracking-widest px-4">标识</th>
                    <th className="pb-8 text-[11px] font-black text-slate-400 uppercase tracking-widest px-4">权限状态</th>
                    <th className="pb-8 text-[11px] font-black text-slate-400 uppercase tracking-widest px-4">今日负荷</th>
                    <th className="pb-8 text-[11px] font-black text-slate-400 uppercase tracking-widest px-4">入驻周期</th>
                    <th className="pb-8 text-[11px] font-black text-slate-400 uppercase tracking-widest px-4 text-right">分析</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredUsers.map((user) => {
                    const isPro = user.subExpiry > Date.now();
                    const isAdmin = adminPhones.has(user.phone);
                    const today = new Date().toISOString().split('T')[0];
                    const used = user.dailyUsage[today] || 0;
                    return (
                      <tr key={user.phone} className={`group hover:bg-slate-50/50 transition-all ${selectedUser?.phone === user.phone ? 'bg-indigo-50/30' : ''}`}>
                        <td className="py-8 px-4">
                          <div className="flex items-center gap-4">
                            {renderAvatar(user.phone)}
                            <div className="flex flex-col">
                              <span className="font-black text-slate-800 text-lg tracking-tight">{user.phone}</span>
                              {isAdmin && <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1"><ShieldCheck size={10} /> System Admin</span>}
                            </div>
                          </div>
                        </td>
                        <td className="py-8 px-4">
                          {user.isBanned ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-100 text-rose-600 rounded-lg text-[10px] font-black uppercase tracking-widest"><Ban size={12} /> Banned</span>
                          ) : isPro ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-100 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-widest"><Crown size={12} /> Pro Member</span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-[10px] font-black uppercase tracking-widest"><Clock size={12} /> Standard</span>
                          )}
                        </td>
                        <td className="py-8 px-4">
                          <div className="flex items-center gap-3">
                             <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                                <div className={`h-full transition-all duration-1000 ${used > 1800 ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]' : 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.4)]'}`} style={{ width: `${Math.min(100, (used / 1800) * 100)}%` }} />
                             </div>
                             <span className="text-[10px] font-black text-slate-500">{Math.floor(used / 60)}m</span>
                          </div>
                        </td>
                        <td className="py-8 px-4">
                          <span className="text-[11px] font-bold text-slate-400 uppercase">{new Date(user.regDate).toLocaleDateString()}</span>
                        </td>
                        <td className="py-8 px-4 text-right">
                           <button 
                            onClick={() => inspectUser(user)} 
                            className="p-4 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-indigo-600 hover:border-indigo-200 hover:shadow-lg transition-all active:scale-95"
                           >
                             <Search size={20} />
                           </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-8 sticky top-8">
          <div className="bg-white rounded-[3.5rem] p-10 border border-slate-100 shadow-xl space-y-10 flex flex-col min-h-[750px] overflow-hidden">
            {selectedUser ? (
              <div className="flex flex-col h-full space-y-10 animate-in slide-in-from-right duration-500">
                <div className="flex items-center gap-6">
                  {renderAvatar(selectedUser.phone, 'w-20 h-20', 'text-2xl')}
                  <div className="space-y-1">
                    <h4 className="text-3xl font-black text-slate-800 tracking-tighter leading-none">{selectedUser.phone}</h4>
                    <div className="flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Session Insight</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => handleTogglePro(selectedUser)}
                    className={`p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-4 group ${selectedUser.subExpiry > Date.now() ? 'border-rose-100 bg-rose-50 text-rose-600' : 'border-indigo-100 bg-indigo-50 text-indigo-600'}`}
                  >
                    <div className={`p-4 rounded-2xl ${selectedUser.subExpiry > Date.now() ? 'bg-rose-100' : 'bg-indigo-100'} group-hover:scale-110 transition-transform`}>
                      {selectedUser.subExpiry > Date.now() ? <Unlock size={24} /> : <Crown size={24} />}
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-center">
                      {selectedUser.subExpiry > Date.now() ? 'Remove PRO' : 'Grant PRO (Annual)'}
                    </span>
                  </button>
                  <button 
                    onClick={() => handleToggleBan(selectedUser)}
                    className={`p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-4 group ${selectedUser.isBanned ? 'border-emerald-100 bg-emerald-50 text-emerald-600' : 'border-rose-100 bg-rose-50 text-rose-600'}`}
                  >
                    <div className={`p-4 rounded-2xl ${selectedUser.isBanned ? 'bg-emerald-100' : 'bg-rose-100'} group-hover:scale-110 transition-transform`}>
                      {selectedUser.isBanned ? <CheckCircle2 size={24} /> : <Ban size={24} />}
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest">{selectedUser.isBanned ? 'Unlock Acct' : 'Ban Acct'}</span>
                  </button>
                  <button 
                    onClick={() => handleAddTime(selectedUser)}
                    className="col-span-2 p-6 rounded-[2rem] border-2 border-slate-100 bg-slate-50 text-slate-600 flex items-center justify-center gap-4 hover:bg-slate-100 hover:border-slate-200 transition-all font-black text-sm"
                  >
                    <Zap size={20} className="text-amber-500" /> Reset Daily Quota (+30m)
                  </button>
                </div>

                <div className="flex-1 flex flex-col space-y-6 pt-10 border-t border-slate-100 overflow-hidden">
                   <div className="flex items-center justify-between">
                     <div className="space-y-0.5">
                       <h5 className="text-[11px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-2"><Brain size={14} className="text-indigo-600" /> AI Behavior Analytics</h5>
                       <p className="text-[9px] font-bold text-slate-400">Powered by Gemini 3 Flash</p>
                     </div>
                     <button 
                       onClick={generateFeedbackSummary} 
                       disabled={loadingFeedback}
                       className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-lg active:scale-95"
                     >
                       {loadingFeedback ? <Loader2 size={16} className="animate-spin" /> : <TrendingUp size={16} />}
                     </button>
                   </div>
                   
                   <div className="flex-1 bg-slate-50 rounded-[2.5rem] p-8 text-xs text-slate-600 overflow-y-auto italic border border-slate-100 shadow-inner custom-scrollbar relative">
                      {loadingFeedback ? (
                        <div className="h-full flex flex-col items-center justify-center gap-4 opacity-50">
                           <Loader2 size={32} className="animate-spin text-indigo-400" />
                           <span className="font-black uppercase tracking-widest text-[9px]">Analyzing behavior patterns...</span>
                        </div>
                      ) : feedbackSummary ? (
                        <div className="whitespace-pre-wrap leading-relaxed animate-in fade-in space-y-4">
                          {feedbackSummary}
                          <div className="pt-4 border-t border-slate-200 flex items-center gap-2 text-indigo-600 not-italic font-black text-[9px] uppercase tracking-widest">
                            <CheckCircle2 size={12} /> Analysis Complete
                          </div>
                        </div>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center opacity-40 space-y-4">
                          <MessageSquare size={48} className="text-slate-300" />
                          <p className="font-bold leading-relaxed">
                            点击上方按钮<br/>
                            AI 将同步分析用户近期行为
                          </p>
                        </div>
                      )}
                   </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center opacity-30 gap-10">
                <div className="relative">
                  <div className="p-12 border-4 border-dashed border-slate-200 rounded-[3rem] animate-pulse">
                    <Users size={120} />
                  </div>
                  <div className="absolute -bottom-4 -right-4 p-4 bg-white rounded-2xl shadow-xl">
                    <Search size={32} className="text-indigo-600" />
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="font-black text-2xl tracking-tighter text-slate-800">未选择分析目标</p>
                  <p className="text-sm font-bold text-slate-500 max-w-[200px] mx-auto">请在左侧列表中点击搜索图标，开启行为同步分析。</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminView;
