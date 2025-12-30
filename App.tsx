
import React, { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, Mic2, PenTool, LayoutDashboard, GraduationCap, Trophy, Menu, X, Sparkles, Zap, Stars, Brain, BookMarked, Clock, LogOut, Crown, ChevronRight, Settings, Globe, Radio, Ticket
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
import GlobalCareerView from './views/GlobalCareerView';
import VisionView from './views/VisionView';
import AIMentor from './components/AIMentor';
import LoginView from './views/LoginView';
import PaymentModal from './components/PaymentModal';
import { logger } from './services/logger';

const formatSeconds = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(logger.getCurrentUser());
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeModule, setActiveModule] = useState<LearningModule>(LearningModule.DASHBOARD);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showPayment, setShowPayment] = useState(false);
  const [usageStats, setUsageStats] = useState(logger.checkSubscription());
  
  const pricing = logger.getPricingConfig();
  const paymentTriggeredRef = useRef(false);

  useEffect(() => {
    const checkAdmin = async () => {
      if (currentUser) {
        const adminStatus = await logger.isAdmin();
        setIsAdmin(adminStatus);
      }
    };
    checkAdmin();
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser || usageStats.isBanned) return;
    const usageInterval = setInterval(() => {
      const status = logger.checkSubscription();
      if (!status.isPro && status.userType !== 'admin') {
        logger.updateUserUsage(1); 
      }
      setUsageStats(status);
      if (status.remainingFreeSecs <= 0 && !status.isPro && !status.isPassActive) {
        if (!paymentTriggeredRef.current && !showPayment) {
          setShowPayment(true);
          paymentTriggeredRef.current = true;
        }
      } else {
        paymentTriggeredRef.current = false;
      }
    }, 1000);
    return () => clearInterval(usageInterval);
  }, [currentUser, usageStats.isPro, usageStats.isBanned, showPayment]);

  const handleLoginSuccess = (autoShowPayment?: boolean) => {
    const user = logger.getCurrentUser();
    setCurrentUser(user);
    const status = logger.checkSubscription();
    setUsageStats(status);
    if (autoShowPayment && !status.isPro && !status.isPassActive) {
      setShowPayment(true);
    }
  };

  const handleLogout = () => { 
    logger.logout(); 
    setCurrentUser(null); 
    setIsAdmin(false); 
  };

  if (!currentUser) return <LoginView onLoginSuccess={handleLoginSuccess} />;

  const menuItems = [
    { id: LearningModule.DASHBOARD, label: '我的主页', icon: <LayoutDashboard size={20} /> },
    { id: LearningModule.VISION, label: 'AI 寰宇视野', icon: <Radio size={20} /> },
    { id: LearningModule.GLOBAL_CAREER, label: '全球职业发展', icon: <Globe size={20} /> },
    { id: LearningModule.ANALYSIS, label: '能力评估', icon: <Brain size={20} /> },
    { id: LearningModule.VOCABULARY, label: '系统单词', icon: <BookOpen size={20} /> },
    { id: LearningModule.GRAMMAR, label: '语法实验室', icon: <Stars size={20} /> },
    { id: LearningModule.READING, label: '深度阅读', icon: <BookMarked size={20} /> },
    { id: LearningModule.SPEAKING, label: 'AI 口语', icon: <Mic2 size={20} /> },
    { id: LearningModule.WRITING, label: '智能批改', icon: <PenTool size={20} /> },
    { id: LearningModule.IELTS, label: '雅思专区', icon: <GraduationCap size={20} /> },
  ];

  if (isAdmin) menuItems.push({ id: LearningModule.ADMIN, label: '系统管理', icon: <Settings size={20} className="text-indigo-600" /> });

  const renderAvatar = (phone: string, size: string = 'w-8 h-8') => {
    const colors = ['bg-indigo-500', 'bg-emerald-500', 'bg-violet-500', 'bg-amber-500', 'bg-rose-500'];
    const lastDigit = parseInt(phone.slice(-1)) || 0;
    return (
      <div className={`${size} rounded-full flex items-center justify-center text-white font-black text-xs shadow-sm ${colors[lastDigit % 5]} border-2 border-white ring-1 ring-slate-100`}>
        {phone.charAt(0)}
      </div>
    );
  };

  const renderModule = () => {
    switch (activeModule) {
      case LearningModule.DASHBOARD:
        return <DashboardView onNavigate={setActiveModule} />;
      case LearningModule.VOCABULARY:
        return <VocabularyView onNavigate={setActiveModule} />;
      case LearningModule.SPEAKING:
        return <SpeakingView />;
      case LearningModule.WRITING:
        return <WritingView />;
      case LearningModule.IELTS:
        return <ExamPrepView type="ielts" />;
      case LearningModule.CAMBRIDGE:
        return <ExamPrepView type="cambridge" />;
      case LearningModule.GRAMMAR:
        return <GrammarView />;
      case LearningModule.READING:
        return <ReadingView />;
      case LearningModule.ANALYSIS:
        return <ProgressView />;
      case LearningModule.GLOBAL_CAREER:
        return <GlobalCareerView />;
      case LearningModule.VISION:
        return <VisionView />;
      case LearningModule.ADMIN:
        return <AdminView />;
      default:
        return <DashboardView onNavigate={setActiveModule} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans">
      <aside className={`bg-white border-r border-slate-200 transition-all duration-300 flex flex-col ${isSidebarOpen ? 'w-72' : 'w-20'}`}>
        <div className="p-6 flex items-center gap-3 border-b border-slate-100 overflow-hidden">
          <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg"><Sparkles size={24} /></div>
          {isSidebarOpen && <span className="font-black text-xl tracking-tighter">LinguistAI</span>}
        </div>
        <nav className="flex-1 py-4 overflow-y-auto overflow-x-hidden">
          {menuItems.map((item) => (
            <button key={item.id} onClick={() => setActiveModule(item.id)} className={`w-full flex items-center gap-4 px-6 py-4 transition-all relative group ${activeModule === item.id ? 'text-indigo-600 bg-indigo-50/50' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}>
              <div className="shrink-0">{item.icon}</div>
              {isSidebarOpen && <span className="font-bold text-sm truncate">{item.label}</span>}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-100 space-y-2">
          {isSidebarOpen && (
            <div className="px-3 py-4 bg-slate-50 rounded-2xl mb-2">
               <button onClick={() => setShowPayment(true)} className="flex items-center gap-3 mb-3 w-full text-left p-2 rounded-xl transition-all border border-transparent hover:border-slate-100">
                 <div className="relative shrink-0">{renderAvatar(currentUser.phone)}</div>
                 <div className="flex-1 overflow-hidden">
                   <div className="text-[10px] font-black text-slate-800 truncate">{currentUser.phone}</div>
                   <div className="text-[8px] font-bold uppercase tracking-widest text-indigo-400">PRO MEMBER</div>
                 </div>
               </button>
               <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest"><LogOut size={14} /> 退出登录</button>
            </div>
          )}
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="w-full flex items-center justify-center p-3 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors">{isSidebarOpen ? <X size={20} /> : <Menu size={20} />}</button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0 z-40">
          <div className="flex items-center gap-4">
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" /> {menuItems.find(m => m.id === activeModule)?.label}
            </h2>
          </div>
          <div className="flex items-center gap-6">
            {!usageStats.isPro && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border bg-amber-50 border-amber-100 text-amber-600">
                <Clock size={12} />
                <span className="text-[9px] font-black uppercase tracking-widest">{formatSeconds(usageStats.remainingFreeSecs)}</span>
              </div>
            )}
            {!usageStats.isPro && (
              <button onClick={() => setShowPayment(true)} className="bg-amber-100 text-amber-700 px-4 py-2 rounded-xl text-[10px] font-black border border-amber-200 uppercase tracking-widest flex items-center gap-2">
                <Crown size={12} /> 升级 PRO
              </button>
            )}
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
          {renderModule()}
          {!usageStats.isBanned && <AIMentor activeModule={activeModule} />}
        </div>
      </main>
      {showPayment && <PaymentModal onClose={() => setShowPayment(false)} />}
    </div>
  );
};

export default App;
