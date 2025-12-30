
import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Mic2, 
  PenTool, 
  LayoutDashboard, 
  GraduationCap, 
  Trophy, 
  Menu, 
  X,
  Sparkles,
  Zap,
  Stars,
  Brain,
  BookMarked,
  Clock,
  LogOut,
  User as UserIcon,
  Crown,
  ChevronRight,
  ShieldAlert,
  Settings
} from 'lucide-react';
import { LearningModule, User } from './types';
import DashboardView from './views/DashboardView';
import VocabularyView from './views/VocabularyView';
import SpeakingView from './views/SpeakingView';
import WritingView from './views/WritingView';
import ExamPrepView from './views/ExamPrepView';
import GrammarView from './views/GrammarView';
import ReadingView from './views/ReadingView';
import ProgressView from './views/ProgressView';
import AdminView from './views/AdminView';
import AIMentor from './components/AIMentor';
import LoginView from './views/LoginView';
import PaymentModal from './components/PaymentModal';
import { logger, ADMIN_PHONE } from './services/logger';

const NAG_INTERVAL = 120000; // 2 minutes

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(logger.getCurrentUser());
  const [activeModule, setActiveModule] = useState<LearningModule>(LearningModule.DASHBOARD);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showPayment, setShowPayment] = useState(false);
  const [usageStats, setUsageStats] = useState(logger.checkSubscription());

  // Timer logic to track usage and nag un-pro users
  useEffect(() => {
    if (!currentUser || usageStats.isBanned) return;
    
    const usageInterval = setInterval(() => {
      logger.updateUserUsage(60); 
      const status = logger.checkSubscription();
      setUsageStats(status);
      
      if (!status.isPro && status.remainingFreeSecs <= 0) {
        setShowPayment(true);
      }
    }, 60000);

    const nagInterval = setInterval(() => {
      const status = logger.checkSubscription();
      if (!status.isPro) {
        setShowPayment(true);
      }
    }, NAG_INTERVAL);

    return () => {
      clearInterval(usageInterval);
      clearInterval(nagInterval);
    };
  }, [currentUser, usageStats.isPro, usageStats.isBanned]);

  const handleLoginSuccess = (autoShowPayment?: boolean) => {
    const user = logger.getCurrentUser();
    setCurrentUser(user);
    const status = logger.checkSubscription();
    setUsageStats(status);
    if (autoShowPayment && !status.isPro) {
      setShowPayment(true);
    }
  };

  const handleLogout = () => {
    logger.logout();
    setCurrentUser(null);
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const renderModule = () => {
    if (usageStats.isBanned) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center animate-in fade-in">
          <div className="bg-rose-100 p-8 rounded-full text-rose-600 mb-6 shadow-xl animate-bounce">
            <ShieldAlert size={64} />
          </div>
          <h1 className="text-4xl font-black text-slate-800 mb-4 tracking-tighter">账号已被禁用</h1>
          <p className="text-slate-500 max-w-md">您的账号因违反使用条款已被锁定。如有疑问，请联系系统管理员 13776635859 处理。</p>
          <button onClick={handleLogout} className="mt-8 px-8 py-3 bg-slate-900 text-white rounded-2xl font-black">登出系统</button>
        </div>
      );
    }

    switch (activeModule) {
      case LearningModule.DASHBOARD:
        return <DashboardView onNavigate={setActiveModule} />;
      case LearningModule.VOCABULARY:
        return <VocabularyView onNavigate={setActiveModule} />;
      case LearningModule.GRAMMAR:
        return <GrammarView />;
      case LearningModule.SPEAKING:
        return <SpeakingView />;
      case LearningModule.WRITING:
        return <WritingView />;
      case LearningModule.READING:
        return <ReadingView />;
      case LearningModule.ANALYSIS:
        return <ProgressView />;
      case LearningModule.IELTS:
      case LearningModule.CAMBRIDGE:
        return <ExamPrepView type={activeModule as 'ielts' | 'cambridge'} />;
      case LearningModule.ADMIN:
        return <AdminView />;
      default:
        return <DashboardView onNavigate={setActiveModule} />;
    }
  };

  const menuItems = [
    { id: LearningModule.DASHBOARD, label: '我的主页', icon: <LayoutDashboard size={20} /> },
    { id: LearningModule.ANALYSIS, label: '能力评估', icon: <Brain size={20} /> },
    { id: LearningModule.VOCABULARY, label: '系统单词', icon: <BookOpen size={20} /> },
    { id: LearningModule.GRAMMAR, label: '语法实验室', icon: <Stars size={20} /> },
    { id: LearningModule.READING, label: '深度阅读', icon: <BookMarked size={20} /> },
    { id: LearningModule.SPEAKING, label: 'AI 口语', icon: <Mic2 size={20} /> },
    { id: LearningModule.WRITING, label: '智能写作', icon: <PenTool size={20} /> },
    { id: LearningModule.IELTS, label: '雅思专区', icon: <GraduationCap size={20} /> },
    { id: LearningModule.CAMBRIDGE, label: '剑桥考级', icon: <Trophy size={20} /> },
  ];

  if (currentUser?.phone === ADMIN_PHONE) {
    menuItems.push({ id: LearningModule.ADMIN, label: '系统管理', icon: <Settings size={20} /> });
  }

  if (!currentUser) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans selection:bg-indigo-100">
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-slate-200 transition-all duration-300 flex flex-col z-50 shadow-sm`}>
        <div className="p-6 flex items-center gap-3 border-b border-slate-100">
          <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-200">
            <Sparkles size={24} />
          </div>
          {isSidebarOpen && <span className="font-black text-xl tracking-tighter">LinguistAI</span>}
        </div>

        <nav className="flex-1 py-4 overflow-y-auto overflow-x-hidden scrollbar-hide">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveModule(item.id)}
              className={`w-full flex items-center gap-4 px-6 py-4 transition-all relative group ${
                activeModule === item.id ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
              }`}
            >
              {activeModule === item.id && <div className="absolute left-0 top-1 bottom-1 w-1 bg-indigo-600 rounded-r-full" />}
              <div className={`shrink-0 transition-transform group-active:scale-90`}>{item.icon}</div>
              {isSidebarOpen && <span className="font-bold whitespace-nowrap text-sm">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100 space-y-2">
          {isSidebarOpen && (
            <div className="px-3 py-4 bg-slate-50 rounded-2xl mb-2">
               <button onClick={() => setShowPayment(true)} className="flex items-center gap-3 mb-3 w-full text-left hover:bg-white p-2 rounded-xl transition-all group border border-transparent hover:border-slate-100 hover:shadow-sm">
                 <div className="relative">
                   <img src={`https://picsum.photos/seed/${currentUser.phone}/40/40`} className="w-8 h-8 rounded-full shadow-sm" alt="User" />
                   {usageStats.isPro ? <div className="absolute -bottom-0.5 -right-0.5 bg-indigo-500 w-2.5 h-2.5 rounded-full border-2 border-white flex items-center justify-center"><Crown size={6} className="text-white" /></div> : <div className="absolute -bottom-0.5 -right-0.5 bg-amber-500 w-2.5 h-2.5 rounded-full border-2 border-white" />}
                 </div>
                 <div className="overflow-hidden flex-1">
                   <div className="text-[10px] font-black text-slate-800 truncate">{currentUser.phone}</div>
                   <div className={`text-[8px] font-bold uppercase tracking-widest ${usageStats.isPro ? 'text-indigo-600' : 'text-amber-600'}`}>
                     {usageStats.isPro ? 'Pro Member' : 'Free Trial'}
                   </div>
                 </div>
                 <ChevronRight size={12} className="text-slate-300" />
               </button>
               <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest">
                 <LogOut size={14} /> 退出登录
               </button>
            </div>
          )}
          <button onClick={toggleSidebar} className="w-full flex items-center justify-center p-3 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors">
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0 z-40">
          <div className="flex items-center gap-6">
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
              {menuItems.find(m => m.id === activeModule)?.label}
            </h2>
            <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-full border border-slate-100 shadow-inner">
               <Clock size={14} className={usageStats.isPro ? 'text-indigo-600' : 'text-amber-500'} />
               {usageStats.isPro ? (
                 <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1"><Crown size={12} /> 无限时长会员</span>
               ) : (
                 <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">免费剩余:</span>
                    <span className="text-[10px] font-black text-amber-600">{Math.floor(usageStats.remainingFreeSecs / 60)} 分钟</span>
                    <div className="w-16 h-1 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500" style={{ width: `${(usageStats.remainingFreeSecs / 1800) * 100}%` }} />
                    </div>
                 </div>
               )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            {!usageStats.isPro && (
              <button onClick={() => setShowPayment(true)} className="bg-amber-100 text-amber-700 px-4 py-2 rounded-xl text-[10px] font-black border border-amber-200 uppercase tracking-widest flex items-center gap-2">
                <Crown size={14} /> 升级 Pro (¥5/月)
              </button>
            )}
            <div className="bg-indigo-50 text-indigo-700 px-4 py-1.5 rounded-xl text-[10px] font-black border border-indigo-100 uppercase tracking-widest">Linguist Prime</div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 scroll-smooth bg-slate-50/50 relative">
          {renderModule()}
          {!usageStats.isBanned && <AIMentor activeModule={activeModule} />}
        </div>
      </main>

      {showPayment && !usageStats.isBanned && <PaymentModal onClose={() => setShowPayment(false)} />}
    </div>
  );
};

export default App;
