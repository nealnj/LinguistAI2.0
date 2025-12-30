
import { UserLogEntry, LearningModule, UserNote, ReadingProgress, MasterProgress, User } from '../types';

const USERS_KEY = 'linguist_ai_users_registry';
const CURRENT_USER_SESSION = 'linguist_ai_active_session';
export const ADMIN_PHONE = '13776635859';

const getUKey = (base: string) => {
  const userJson = localStorage.getItem(CURRENT_USER_SESSION);
  if (!userJson) return `${base}_guest`;
  const user = JSON.parse(userJson) as User;
  return `${base}_${user.phone}`;
};

export const logger = {
  registerOrLogin: (phone: string, password?: string): User => {
    const users: User[] = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    let user = users.find(u => u.phone === phone);
    const today = new Date().toISOString().split('T')[0];
    
    if (!user) {
      user = {
        phone,
        password,
        name: `Learner_${phone.slice(-4)}`,
        regDate: Date.now(),
        subExpiry: 0,
        dailyUsage: {},
        isBanned: false,
        lastLoginDate: today
      };
      users.push(user);
    } else {
      user.lastLoginDate = today;
      const idx = users.findIndex(u => u.phone === phone);
      users[idx] = user;
    }
    
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    localStorage.setItem(CURRENT_USER_SESSION, JSON.stringify(user));
    return user;
  },

  getCurrentUser: (): User | null => {
    const data = localStorage.getItem(CURRENT_USER_SESSION);
    return data ? JSON.parse(data) : null;
  },

  logout: () => {
    localStorage.removeItem(CURRENT_USER_SESSION);
  },

  updateUserUsage: (seconds: number) => {
    const user = logger.getCurrentUser();
    if (!user) return;
    
    const today = new Date().toISOString().split('T')[0];
    user.dailyUsage[today] = (user.dailyUsage[today] || 0) + seconds;
    
    localStorage.setItem(CURRENT_USER_SESSION, JSON.stringify(user));
    const users: User[] = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const idx = users.findIndex(u => u.phone === user.phone);
    if (idx !== -1) {
      users[idx] = user;
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }
  },

  checkSubscription: (): { isPro: boolean; remainingFreeSecs: number; isBanned: boolean } => {
    const user = logger.getCurrentUser();
    if (!user) return { isPro: false, remainingFreeSecs: 0, isBanned: false };
    
    const isPro = user.subExpiry > Date.now();
    const today = new Date().toISOString().split('T')[0];
    const usedToday = user.dailyUsage[today] || 0;
    const freeLimit = 30 * 60;
    
    return {
      isPro,
      remainingFreeSecs: Math.max(0, freeLimit - usedToday),
      isBanned: !!user.isBanned
    };
  },

  // Admin Features
  getAllUsers: (): User[] => JSON.parse(localStorage.getItem(USERS_KEY) || '[]'),
  
  updateUserStatus: (phone: string, updates: Partial<User>) => {
    const users: User[] = logger.getAllUsers();
    const idx = users.findIndex(u => u.phone === phone);
    if (idx !== -1) {
      users[idx] = { ...users[idx], ...updates };
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
      
      // Update active session if it's the current user
      const current = logger.getCurrentUser();
      if (current && current.phone === phone) {
        localStorage.setItem(CURRENT_USER_SESSION, JSON.stringify(users[idx]));
      }
    }
  },

  getAnalytics: () => {
    const users = logger.getAllUsers();
    const today = new Date().toISOString().split('T')[0];
    const thisMonth = today.substring(0, 7);
    
    const dau = users.filter(u => u.lastLoginDate === today).length;
    const mau = users.filter(u => u.lastLoginDate?.startsWith(thisMonth)).length;
    
    return { total: users.length, dau, mau };
  },

  getUserLogs: (phone: string): UserLogEntry[] => {
    return JSON.parse(localStorage.getItem(`logs_${phone}`) || '[]');
  },

  logAction: (module: LearningModule, action: UserLogEntry['action'], detail: any) => {
    const user = logger.getCurrentUser();
    if (!user) return;
    const key = `logs_${user.phone}`;
    const logs: UserLogEntry[] = JSON.parse(localStorage.getItem(key) || '[]');
    logs.push({ timestamp: Date.now(), module, action, detail });
    localStorage.setItem(key, JSON.stringify(logs));
    
    if (action === 'complete' || action === 'learn') {
      logger.advanceMasterSkill(module);
    }
  },

  getMasterProgress: (): MasterProgress => {
    const key = getUKey('master');
    const data = localStorage.getItem(key);
    if (!data) {
      const initial: MasterProgress = {
        overallLevel: 1,
        academicRank: 'Novice Learner',
        skills: { vocabulary: 1, grammar: 1, reading: 1, speaking: 1, writing: 1 },
        specialization: 'General English'
      };
      localStorage.setItem(key, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(data);
  },

  advanceMasterSkill: (module: LearningModule) => {
    const progress = logger.getMasterProgress();
    const skillMap: Record<string, keyof MasterProgress['skills']> = {
      [LearningModule.VOCABULARY]: 'vocabulary',
      [LearningModule.GRAMMAR]: 'grammar',
      [LearningModule.READING]: 'reading',
      [LearningModule.SPEAKING]: 'speaking',
      [LearningModule.WRITING]: 'writing'
    };

    const skill = skillMap[module];
    if (skill) {
      progress.skills[skill] += 1;
      const totalPoints = Object.values(progress.skills).reduce((a, b) => a + b, 0);
      progress.overallLevel = Math.floor(totalPoints / 5) + 1;
      localStorage.setItem(getUKey('master'), JSON.stringify(progress));
    }
  },

  setSpecialization: (spec: MasterProgress['specialization']) => {
    const progress = logger.getMasterProgress();
    progress.specialization = spec;
    localStorage.setItem(getUKey('master'), JSON.stringify(progress));
  },

  addNote: (note: Omit<UserNote, 'id' | 'timestamp' | 'reviewCount'>) => {
    const key = getUKey('notes');
    const notes: UserNote[] = JSON.parse(localStorage.getItem(key) || '[]');
    const newNote: UserNote = {
      ...note,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      reviewCount: 0
    };
    notes.push(newNote);
    localStorage.setItem(key, JSON.stringify(notes));
  },

  updateNoteReview: (id: string) => {
    const key = getUKey('notes');
    const notes: UserNote[] = JSON.parse(localStorage.getItem(key) || '[]');
    const idx = notes.findIndex(n => n.id === id);
    if (idx !== -1) {
      notes[idx].reviewCount += 1;
      notes[idx].lastReviewTimestamp = Date.now();
      localStorage.setItem(key, JSON.stringify(notes));
    }
  },

  getNotes: (): UserNote[] => JSON.parse(localStorage.getItem(getUKey('notes')) || '[]'),
  getLogs: (): UserLogEntry[] => JSON.parse(localStorage.getItem(getUKey(`logs`)) || '[]'),
  /**
   * Filter user logs to return only actions of type 'mistake'
   */
  getMistakes: (): UserLogEntry[] => {
    const logs = logger.getLogs();
    return logs.filter(l => l.action === 'mistake');
  },
  getReadingProgress: (category: string): ReadingProgress => {
    const key = getUKey('reading_progress');
    const allProgress: ReadingProgress[] = JSON.parse(localStorage.getItem(key) || '[]');
    let progress = allProgress.find(p => p.category === category);
    if (!progress) progress = { category, currentLevel: 1, difficulty: 'beginner', completedArticles: [] };
    return progress;
  },

  updateReadingProgress: (category: string, articleTitle: string) => {
    const key = getUKey('reading_progress');
    const allProgress: ReadingProgress[] = JSON.parse(localStorage.getItem(key) || '[]');
    let idx = allProgress.findIndex(p => p.category === category);
    if (idx === -1) {
      allProgress.push({ category, currentLevel: 1, difficulty: 'beginner', completedArticles: [articleTitle] });
    } else if (!allProgress[idx].completedArticles.includes(articleTitle)) {
      allProgress[idx].completedArticles.push(articleTitle);
      if (allProgress[idx].completedArticles.length % 3 === 0 && allProgress[idx].currentLevel < 10) {
        allProgress[idx].currentLevel += 1;
      }
    }
    localStorage.setItem(key, JSON.stringify(allProgress));
  },

  getUnknownWords: (): string[] => {
    const notes = logger.getNotes();
    return [...new Set(notes.filter(n => n.tag === 'vocabulary').map(n => n.text))];
  }
};
