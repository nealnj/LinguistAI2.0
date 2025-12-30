
import React, { useState, useEffect } from 'react';
import { logger } from '../services/logger';
import { User, UserLogEntry, UserFeedback, HealingRule, LearningModule } from '../types';
import { 
  Users, Search, ShieldAlert, Unlock, Clock, Ban, CheckCircle2, MessageSquare, ChevronRight, TrendingUp, Brain, ShieldCheck, Crown, Loader2, Settings, Activity, Zap, Coins, Percent, Save, Tag, AlertTriangle, Bug, Wand2, Power, Trash2
} from 'lucide-react';
import { generateHealingStrategy } from '../services/geminiService';

const AdminView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'pricing' | 'healing'>('users');
  const [users, setUsers] = useState<User[]>(logger.getAllUsers());
  const [analytics, setAnalytics] = useState(logger.getAnalytics());
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [pricing, setPricing] = useState(logger.getPricingConfig());
  const [isSavingPricing, setIsSavingPricing] = useState(false);

  // 自愈系统状态
  const [feedbacks, setFeedbacks] = useState<UserFeedback[]>(logger.getAllFeedbacks());
  const [healingRules, setHealingRules] = useState<HealingRule[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const refreshData = () => {
    setUsers(logger.getAllUsers());
    setAnalytics(logger.getAnalytics());
    setFeedbacks(logger.getAllFeedbacks());
    setHealingRules(JSON.parse(localStorage.getItem('linguist_ai_healing_rules') || '[]'));
  };

  useEffect(() => { refreshData(); }, []);

  const handleTogglePro = (user: User) => {
    const isPro = user.subExpiry > Date.now();
    logger.updateUserStatus(user.phone, { subExpiry: isPro ? 0 : Date.now() + 365 * 24 * 3600 * 1000 });
    refreshData();
  };

  const handleToggleBan = (user: User) => {
    logger.updateUserStatus(user.phone, { isBanned: !user.isBanned });
    refreshData();
  };

  const handleHealingAnalysis = async () => {
    if (feedbacks.length === 0) return;
    setIsAnalyzing(true);
    try {
      const strategy = await generateHealingStrategy(feedbacks);
      if (strategy.rules) {
        strategy.rules.forEach((r: any) => {
          logger.addHealingRule({
            description: r.description,
            targetModule: r.targetModule,
            systemInstructionAddon: r.systemInstructionAddon,
            active: false
          });
        });
        refreshData();
      }
    } catch (e) {
      alert("AI 修复策略生成失败。");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const deleteFeedback = (id: string) => { logger.deleteFeedback(id); refreshData(); };
  const toggleRule = (id: string) => { logger.toggleRule(id); refreshData(); };

  const filteredUsers = users.filter(u => u.phone.includes(searchTerm));

  const renderAvatar = (phone: string, size: string = 'w-10 h-10') => {
    const colors = ['bg-indigo-500', 'bg-emerald-500', 'bg-violet-500', 'bg-amber-500', 'bg-rose-500'];
    return <div className={`${size} rounded-2xl flex items-center justify-center text-white font-black shadow-sm ${colors[parseInt(phone.slice(-1)) % 5]} border-2 border-white`}>{phone.charAt(0)}</div>;
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-10 animate-in fade-in duration-700 pb-20">
      <header className="bg-slate-900 p-12 rounded-[4rem] text-white shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-1000"><ShieldCheck size={400} /></div>
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-end gap-12">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-md border border-white/10"><Settings size={28} className="text-indigo-400" /></div>
              <div className="bg-indigo-600/30 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-indigo-400">Control Center v1.1</div>
            </div>
            <h1 className="text-5xl font-black tracking-tighter">系统管理与 AI 自愈中心</h1>
          </div>
          <div className="grid grid-cols-3 gap-6">
            {[ { label: 'Users', value: analytics.total, icon: <Users size={18} /> }, { label: 'DAU', value: analytics.dau, icon: <Activity size={18} /> }, { label: 'Rules', value: healingRules.length, icon: <Zap size={18} /> } ].map((stat, i) => (
              <div key={i} className="bg-white/5 border border-white/5 p-8 rounded-[2.5rem] text-center min-w-[140px]">
                <div className="text-indigo-400 mb-2 flex justify-center">{stat.icon}</div>
                <div className="text-3xl font-black">{stat.value}</div>
                <div className="text-[9px] font-black uppercase tracking-widest text-slate-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </header>

      <div className="flex gap-4 bg-white p-3 rounded-[2.5rem] border border-slate-100 shadow-sm w-fit mx-auto">
        <button onClick={() => setActiveTab('users')} className={`px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'users' ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-400 hover:bg-slate-50'}`}>用户管理</button>
        <button onClick={() => setActiveTab('pricing')} className={`px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'pricing' ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-400 hover:bg-slate-50'}`}>定价策略</button>
        <button onClick={() => setActiveTab('healing')} className={`px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'healing' ? 'bg-rose-600 text-white shadow-xl' : 'text-slate-400 hover:bg-slate-50'}`}>自愈中心</button>
      </div>

      <div className="animate-slide-up">
        {activeTab === 'users' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-8 bg-white rounded-[3.5rem] p-12 border border-slate-100 shadow-xl space-y-10">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-black text-slate-800">用户目录</h3>
                <div className="relative"><Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} /><input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="检索..." className="bg-slate-50 border-2 border-slate-50 focus:border-indigo-600 rounded-2xl py-4 pl-14 pr-8 outline-none text-sm w-80 shadow-inner font-bold" /></div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead><tr className="text-left border-b border-slate-100"><th className="pb-8 text-[11px] font-black text-slate-400 uppercase tracking-widest px-4">标识</th><th className="pb-8 text-[11px] font-black text-slate-400 uppercase tracking-widest px-4">权限</th><th className="pb-8 text-[11px] font-black text-slate-400 uppercase tracking-widest px-4 text-right">管理</th></tr></thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredUsers.map(user => (
                      <tr key={user.phone} className="group hover:bg-slate-50/50">
                        <td className="py-6 px-4 flex items-center gap-4">{renderAvatar(user.phone)} <span className="font-black text-slate-800">{user.phone}</span></td>
                        <td className="py-6 px-4">
                          {user.isBanned ? <span className="px-3 py-1 bg-rose-100 text-rose-600 rounded-lg text-[10px] font-black">BANNED</span> : (user.subExpiry > Date.now() ? <span className="px-3 py-1 bg-indigo-100 text-indigo-600 rounded-lg text-[10px] font-black uppercase">Pro Member</span> : <span className="px-3 py-1 bg-slate-100 text-slate-400 rounded-lg text-[10px] font-black uppercase">Trial</span>)}
                        </td>
                        <td className="py-6 px-4 text-right flex justify-end gap-2">
                           <button onClick={() => handleTogglePro(user)} className="p-3 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all"><Crown size={18} /></button>
                           <button onClick={() => handleToggleBan(user)} className="p-3 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all"><Ban size={18} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="lg:col-span-4 bg-slate-900 rounded-[3.5rem] p-10 text-white shadow-xl h-fit">
              <h3 className="text-xl font-black mb-6">系统活动概览</h3>
              <div className="space-y-4">
                <div className="p-6 bg-white/5 rounded-3xl border border-white/10"><div className="text-[10px] text-slate-500 uppercase mb-1">活跃订阅占比</div><div className="text-3xl font-black text-indigo-400">{Math.round((users.filter(u => u.subExpiry > Date.now()).length / (users.length || 1)) * 100)}%</div></div>
                <div className="p-6 bg-white/5 rounded-3xl border border-white/10 italic text-xs text-slate-400 leading-relaxed">“系统当前运行稳定，AI 响应平均延迟：1.8s。建议关注自愈中心的异常反馈。”</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'pricing' && (
          <section className="bg-white rounded-[3.5rem] p-12 border border-slate-100 shadow-xl max-w-2xl mx-auto space-y-10">
            <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3"><Tag className="text-indigo-600" /> 定价策略配置</h3>
            <div className="grid grid-cols-1 gap-8">
              <div className="space-y-4"><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">原始年度价格 (CNY)</label><input type="number" value={pricing.originalAnnualPrice} onChange={(e) => setPricing({...pricing, originalAnnualPrice: Number(e.target.value)})} className="w-full bg-slate-50 border-2 rounded-2xl py-5 px-6 outline-none font-black text-xl" /></div>
              <div className="space-y-4"><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">推广折扣率 (0-1)</label><input type="number" step="0.1" value={pricing.discountRate} onChange={(e) => setPricing({...pricing, discountRate: Number(e.target.value)})} className="w-full bg-slate-50 border-2 rounded-2xl py-5 px-6 outline-none font-black text-xl" /></div>
            </div>
            <button onClick={() => { setIsSavingPricing(true); logger.updatePricingConfig(pricing); setTimeout(() => setIsSavingPricing(false), 800); }} disabled={isSavingPricing} className="w-full py-6 bg-indigo-600 text-white rounded-3xl font-black text-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 shadow-xl">{isSavingPricing ? <Loader2 className="animate-spin" /> : <Save />} 保存全局配置</button>
          </section>
        )}

        {activeTab === 'healing' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* 用户反馈区 */}
            <div className="lg:col-span-6 bg-white rounded-[3.5rem] p-12 border border-slate-100 shadow-xl space-y-10">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3"><Bug className="text-rose-500" /> 待处理问题集</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active User Reports</p>
                </div>
                {feedbacks.length > 0 && (
                  <button onClick={handleHealingAnalysis} disabled={isAnalyzing} className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg">
                    {isAnalyzing ? <Loader2 className="animate-spin" size={14} /> : <Wand2 size={14} />} AI 问题聚类并生成策略
                  </button>
                )}
              </div>

              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {feedbacks.length > 0 ? feedbacks.slice().reverse().map(f => (
                  <div key={f.id} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 group relative">
                    <button onClick={() => deleteFeedback(f.id)} className="absolute top-6 right-6 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16} /></button>
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${f.issueType === 'accuracy' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>{f.issueType}</span>
                      <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">{new Date(f.timestamp).toLocaleString()}</span>
                    </div>
                    <p className="text-sm font-bold text-slate-700 leading-relaxed mb-4">“{f.content}”</p>
                    <div className="bg-white/50 p-3 rounded-xl border border-slate-200 text-[10px] text-slate-400 italic">Context: {f.module} 模块异常</div>
                  </div>
                )) : (
                  <div className="text-center py-20 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
                    <CheckCircle2 size={48} className="text-emerald-500/30 mx-auto mb-4" />
                    <p className="font-bold text-slate-400">当前没有待处理的问题反馈</p>
                  </div>
                )}
              </div>
            </div>

            {/* AI 修复策略区 */}
            <div className="lg:col-span-6 bg-slate-900 rounded-[3.5rem] p-12 text-white shadow-2xl space-y-10">
              <div className="space-y-1">
                <h3 className="text-2xl font-black flex items-center gap-3 text-indigo-400"><Zap /> AI 自愈补丁库</h3>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Healing Rules</p>
              </div>

              <div className="space-y-6">
                {healingRules.length > 0 ? healingRules.map(rule => (
                  <div key={rule.id} className={`p-8 rounded-[2.5rem] border-2 transition-all ${rule.active ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-white/5 bg-white/5'}`}>
                    <div className="flex justify-between items-start mb-6">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-indigo-600 text-white rounded text-[8px] font-black uppercase">PATCH</span>
                          <span className="text-[10px] font-black text-slate-500 uppercase">Module: {rule.targetModule}</span>
                        </div>
                        <h4 className="font-black text-lg text-slate-200">{rule.description}</h4>
                      </div>
                      <button onClick={() => toggleRule(rule.id)} className={`p-4 rounded-2xl transition-all ${rule.active ? 'bg-emerald-500 text-white' : 'bg-white/10 text-slate-400 hover:bg-white/20'}`}>
                        <Power size={20} />
                      </button>
                    </div>
                    <div className="bg-black/20 p-6 rounded-2xl border border-white/5 font-mono text-[10px] text-indigo-300 leading-relaxed">
                      {rule.systemInstructionAddon}
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-20 opacity-30 italic font-bold">尚未生成任何自愈策略</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminView;
