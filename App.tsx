
import React, { useState } from 'react';
import { 
  BookOpen, 
  Mic2, 
  PenTool, 
  LayoutDashboard, 
  GraduationCap, 
  Trophy, 
  Menu, 
  X,
  Sparkles
} from 'lucide-react';
import { LearningModule } from './types';
import DashboardView from './views/DashboardView';
import VocabularyView from './views/VocabularyView';
import SpeakingView from './views/SpeakingView';
import WritingView from './views/WritingView';
import ExamPrepView from './views/ExamPrepView';

const App: React.FC = () => {
  const [activeModule, setActiveModule] = useState<LearningModule>(LearningModule.DASHBOARD);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

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
      case LearningModule.CAMBRIDGE:
        return <ExamPrepView type={activeModule as 'ielts' | 'cambridge'} />;
      default:
        return <DashboardView onNavigate={setActiveModule} />;
    }
  };

  const menuItems = [
    { id: LearningModule.DASHBOARD, label: '我的主页', icon: <LayoutDashboard size={20} /> },
    { id: LearningModule.VOCABULARY, label: '系统单词', icon: <BookOpen size={20} /> },
    { id: LearningModule.SPEAKING, label: 'AI 口语', icon: <Mic2 size={20} /> },
    { id: LearningModule.WRITING, label: '智能写作', icon: <PenTool size={20} /> },
    { id: LearningModule.IELTS, label: '雅思专区', icon: <GraduationCap size={20} /> },
    { id: LearningModule.CAMBRIDGE, label: '剑桥考级', icon: <Trophy size={20} /> },
  ];

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans selection:bg-indigo-100">
      <aside 
        className={`${
          isSidebarOpen ? 'w-64' : 'w-20'
        } bg-white border-r border-slate-200 transition-all duration-300 flex flex-col z-50`}
      >
        <div className="p-6 flex items-center gap-3 border-b border-slate-100">
          <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-200">
            <Sparkles size={24} />
          </div>
          {isSidebarOpen && <span className="font-black text-xl tracking-tighter">LinguistAI</span>}
        </div>

        <nav className="flex-1 py-4 overflow-y-auto overflow-x-hidden">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveModule(item.id)}
              className={`w-full flex items-center gap-4 px-6 py-4 transition-all relative ${
                activeModule === item.id 
                  ? 'text-indigo-600' 
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
              }`}
            >
              {activeModule === item.id && (
                <div className="absolute left-0 top-1 bottom-1 w-1 bg-indigo-600 rounded-r-full" />
              )}
              <div className="shrink-0">{item.icon}</div>
              {isSidebarOpen && <span className="font-bold whitespace-nowrap text-sm">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button 
            onClick={toggleSidebar}
            className="w-full flex items-center justify-center p-3 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0 z-40">
          <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
            {menuItems.find(m => m.id === activeModule)?.label}
          </h2>
          <div className="flex items-center gap-4">
            <div className="bg-amber-50 text-amber-700 px-4 py-1.5 rounded-xl text-[10px] font-black border border-amber-100 uppercase tracking-widest">
              Level 0 • Foundation
            </div>
            <img 
              src="https://picsum.photos/seed/linguist/40/40" 
              alt="Profile" 
              className="w-10 h-10 rounded-2xl border-2 border-slate-100 shadow-sm"
            />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 scroll-smooth bg-slate-50/50">
          {renderModule()}
        </div>
      </main>
    </div>
  );
};

export default App;
