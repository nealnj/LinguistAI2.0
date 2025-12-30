
import React, { useState, useEffect } from 'react';
import { logger } from '../services/logger';
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
  Crown
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
    setUsers(logger.getAllUsers());
    setAnalytics(logger.getAnalytics());
    if (selectedUser) {
      const updated = logger.getAllUsers().find(u => u.phone === selectedUser.phone);
      setSelectedUser(updated || null);
    }
  };

  const renderAvatar = (phone: string, size: string = 'w-8 h-8', textSize: string = 'text-xs') => {
    const colors = ['bg-indigo-500', 'bg-emerald-500', 'bg-violet-500', 'bg-amber-500', 'bg-rose-500', 'bg-slate-500'];
    const lastDigit = parseInt(phone.slice(-1)) || 0;
    const colorClass = colors[lastDigit % colors.length];
    
    return (
      <div className={`${size} rounded-full flex items-center justify-center text-white font-black ${textSize} shadow-sm ${colorClass} border-2 border-white ring-1 ring-slate-100`}>
        {phone.charAt(0)}
      </div>
    );
  };

  const handleTogglePro = (user: User) => {
    const isPro = user.subExpiry > Date.now();
    const newExpiry = isPro ? 0 : Date.now() + 30 * 24 * 3600 * 1000;
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

  const generateFeedbackSummary = async () => {
    if (!selectedUser) return;
    setLoadingFeedback(true);
    try {
      const logs = logger.getUserLogs(selectedUser.phone);
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `分析以下用户的学习日志并总结其遇到的困难、反馈的问题和改进建议。
      用户：${selectedUser.phone}
      日志内容：${JSON.stringify(logs.slice(-20))}
      请用简洁的中文回答，包含：1. 主要学习痛点 2. 改进建议 3. 系统适配度。`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt
      });
      setFeedbackSummary(response.text || '暂无详细分析');
    } catch (e) {
      setFeedbackSummary('AI 分析失败，请稍后重试。');
    } finally {
      setLoadingFeedback(false);
    }
  };

  const filteredUsers = users.filter(u => u.phone.includes(searchTerm));

  return (
    <div className="max-w-[1600px] mx-auto space-y-10 animate-in fade-in pb-20">
      <header className="flex items-center justify-between bg-slate-900 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
        <div className="relative z-10 space-y-4">
          <div className="bg-white/10 w-fit p-3 rounded-2xl backdrop-blur-md">
            <Users size={32} className="text-indigo-400" />
          </div>
          <h1 className="text-4xl font-black tracking-tighter">后台管理中心 (Linguist Admin)</h1>
          <p className="text-slate-400 max-w-xl text-lg">实时监控用户动态、订阅状态及系统运营数据。</p>
        </div>
        <div className="relative z-10 grid grid-cols-3 gap-8">
          {[
            { label: '累计用户', value: analytics.total, icon: <Users size={20} /> },
            { label: '今日活跃 (DAU)', value: analytics.dau, icon: <TrendingUp size={20} /> },
            { label: '本月活跃 (MAU)', value: analytics.mau, icon: <BarChart3 size={20} /> }
          ].map((stat, i) => (
            <div key={i} className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-xl text-center">
              <div className="text-indigo-400 mb-2 flex justify-center">{stat.icon}</div>
              <div className="text-2xl font-black">{stat.value}</div>
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">{stat.label}</div>
            </div>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-xl space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-800 flex items-center gap-3"><Users className="text-indigo-600" /> 用户列表</h3>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="搜索手机号..." 
                  className="bg-slate-50 border border-slate-100 rounded-2xl py-3 pl-12 pr-6 outline-none focus:border-indigo-600 transition-all font-bold text-sm w-64"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-slate-100">
                    <th className="pb-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">用户手机</th>
                    <th className="pb-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">状态</th>
                    <th className="pb-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">今日用时</th>
                    <th className="pb-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">注册时间</th>
                    <th className="pb-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">操作</th>
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
                        <td className="py-6">
                          <div className="flex items-center gap-3">
                            {renderAvatar(user.phone)}
                            <span className="font-black text-slate-800">{user.phone}</span>
                            {isAdmin && <ShieldCheck size={14} className="text-indigo-600" />}
                          </div>
                        </td>
                        <td className="py-6">
                          <div className="flex items-center gap-2">
                            {user.isBanned ? (
                              <span className="flex items-center gap-1 text-[10px] font-black text-rose-500 uppercase tracking-widest"><Ban size={12} /> Banned</span>
                            ) : isPro ? (
                              <span className="flex items-center gap-1 text-[10px] font-black text-indigo-600 uppercase tracking-widest"><Crown size={12} /> Pro Member</span>
                            ) : (
                              <span className="flex items-center gap-1 text-[10px] font-black text-slate-400 uppercase tracking-widest"><Clock size={12} /> Trial</span>
                            )}
                          </div>
                        </td>
                        <td className="py-6">
                          <div className="flex items-center gap-2">
                             <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className={`h-full ${used > 1800 ? 'bg-rose-500' : 'bg-indigo-500'}`} style={{ width: `${Math.min(100, (used / 1800) * 100)}%` }} />
                             </div>
                             <span className="text-[10px] font-black text-slate-500">{Math.floor(used / 60)}m</span>
                          </div>
                        </td>
                        <td className="py-6 text-[10px] font-bold text-slate-400 uppercase">{new Date(user.regDate).toLocaleDateString()}</td>
                        <td className="py-6">
                           <button onClick={() => inspectUser(user)} className="p-3 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm">
                             <Search size={16} />
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

        <div className="lg:col-span-4 space-y-8">
          <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-xl space-y-8 sticky top-8 min-h-[600px] flex flex-col">
            {selectedUser ? (
              <>
                <div className="flex items-center gap-6">
                  {renderAvatar(selectedUser.phone, 'w-16 h-16', 'text-xl')}
                  <div>
                    <h4 className="text-2xl font-black text-slate-800 tracking-tighter">{selectedUser.phone}</h4>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">用户详情与控制</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => handleTogglePro(selectedUser)}
                    className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 ${selectedUser.subExpiry > Date.now() ? 'border-rose-100 bg-rose-50 text-rose-600' : 'border-indigo-100 bg-indigo-50 text-indigo-600'}`}
                  >
                    {selectedUser.subExpiry > Date.now() ? <Unlock size={24} /> : <Crown size={24} />}
                    <span className="text-[10px] font-black uppercase tracking-widest">{selectedUser.subExpiry > Date.now() ? '取消 Pro' : '设为 Pro'}</span>
                  </button>
                  <button 
                    onClick={() => handleToggleBan(selectedUser)}
                    className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 ${selectedUser.isBanned ? 'border-emerald-100 bg-emerald-50 text-emerald-600' : 'border-rose-100 bg-rose-50 text-rose-600'}`}
                  >
                    {selectedUser.isBanned ? <CheckCircle2 size={24} /> : <Ban size={24} />}
                    <span className="text-[10px] font-black uppercase tracking-widest">{selectedUser.isBanned ? '解除封禁' : '封禁用户'}</span>
                  </button>
                  <button 
                    onClick={() => handleAddTime(selectedUser)}
                    className="col-span-2 p-6 rounded-3xl border-2 border-slate-100 bg-slate-50 text-slate-600 flex items-center justify-center gap-4 hover:bg-slate-100 transition-all font-black"
                  >
                    <Plus size={20} /> 增加 30 分钟免费时长
                  </button>
                </div>

                <div className="flex-1 space-y-6 pt-6 border-t border-slate-100 flex flex-col overflow-hidden">
                   <div className="flex items-center justify-between">
                     <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><MessageSquare size={14} /> AI 交互总结反馈</h5>
                     <button 
                       onClick={generateFeedbackSummary} 
                       disabled={loadingFeedback}
                       className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-all"
                     >
                       {loadingFeedback ? <Loader2 size={12} className="animate-spin" /> : <Brain size={12} />}
                     </button>
                   </div>
                   
                   <div className="flex-1 bg-slate-50 rounded-[2rem] p-6 text-sm text-slate-600 overflow-y-auto italic border border-slate-100">
                      {loadingFeedback ? (
                        <div className="flex flex-col items-center gap-3 py-10 opacity-50">
                           <Loader2 size={24} className="animate-spin" />
                           <span>AI 正在分析数万条历史数据...</span>
                        </div>
                      ) : feedbackSummary ? (
                        <div className="whitespace-pre-wrap leading-relaxed animate-in fade-in">{feedbackSummary}</div>
                      ) : (
                        <div className="text-center py-10 opacity-40">点击上方大脑图标<br/>通过 AI 总结用户近期学习痛点</div>
                      )}
                   </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center opacity-30 gap-6">
                <div className="p-8 border-4 border-dashed border-slate-200 rounded-full"><Users size={80} /></div>
                <p className="font-black text-xl tracking-tighter">请选择一个用户<br/>进行实时管理与分析</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminView;

// Dummy Loader component
const Loader2 = ({ size, className }: { size: number, className?: string }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);
