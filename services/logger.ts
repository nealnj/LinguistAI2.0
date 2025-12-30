
import { UserLogEntry, LearningModule, UserNote, ReadingProgress, MasterProgress, User, UserFeedback, HealingRule } from '../types';

const USERS_KEY = 'linguist_ai_users_registry';
const CURRENT_USER_SESSION = 'linguist_ai_active_session';
const PRICING_CONFIG_KEY = 'linguist_ai_pricing_config';
const FEEDBACK_KEY = 'linguist_ai_feedbacks';
const HEALING_RULES_KEY = 'linguist_ai_healing_rules';

const ADMIN_PHONES = ["13776635859"];

export const logger = {
  isAdmin: async (phone?: string): Promise<boolean> => {
    const target = phone || logger.getCurrentUser()?.phone;
    if (!target) return false;
    return ADMIN_PHONES.includes(target);
  },

  // --- 反馈与自愈核心 ---
  addFeedback: (feedback: Omit<UserFeedback, 'id' | 'timestamp' | 'status'>) => {
    const feedbacks: UserFeedback[] = JSON.parse(localStorage.getItem(FEEDBACK_KEY) || '[]');
    const newEntry: UserFeedback = {
      ...feedback,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      status: 'pending'
    };
    feedbacks.push(newEntry);
    localStorage.setItem(FEEDBACK_KEY, JSON.stringify(feedbacks));
  },

  getAllFeedbacks: (): UserFeedback[] => JSON.parse(localStorage.getItem(FEEDBACK_KEY) || '[]'),

  addHealingRule: (rule: Omit<HealingRule, 'id' | 'createdAt'>) => {
    const rules: HealingRule[] = JSON.parse(localStorage.getItem(HEALING_RULES_KEY) || '[]');
    const newRule: HealingRule = {
      ...rule,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: Date.now()
    };
    rules.push(newRule);
    localStorage.setItem(HEALING_RULES_KEY, JSON.stringify(rules));
  },

  getAppliedRules: (module: LearningModule | 'all'): string => {
    const rules: HealingRule[] = JSON.parse(localStorage.getItem(HEALING_RULES_KEY) || '[]');
    return rules
      .filter(r => r.active && (r.targetModule === 'all' || r.targetModule === module))
      .map(r => r.systemInstructionAddon)
      .join('\n');
  },

  toggleRule: (id: string) => {
    const rules: HealingRule[] = JSON.parse(localStorage.getItem(HEALING_RULES_KEY) || '[]');
    const idx = rules.findIndex(r => r.id === id);
    if (idx !== -1) {
      rules[idx].active = !rules[idx].active;
      localStorage.setItem(HEALING_RULES_KEY, JSON.stringify(rules));
    }
  },

  deleteFeedback: (id: string) => {
    const feedbacks = logger.getAllFeedbacks().filter(f => f.id !== id);
    localStorage.setItem(FEEDBACK_KEY, JSON.stringify(feedbacks));
  },

  // --- 基础逻辑保持不变 ---
  getPricingConfig: () => {
    const data = localStorage.getItem(PRICING_CONFIG_KEY);
    return data ? JSON.parse(data) : { originalAnnualPrice: 2400, discountRate: 0.7 };
  },

  updatePricingConfig: (config: any) => localStorage.setItem(PRICING_CONFIG_KEY, JSON.stringify(config)),

  registerOrLogin: (phone: string, password?: string): User => {
    const users: User[] = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    let user = users.find(u => u.phone === phone);
    const today = new Date().toISOString().split('T')[0];
    if (!user) {
      user = { phone, password, name: `Learner_${phone.slice(-4)}`, regDate: Date.now(), subExpiry: 0, dailyUsage: {}, isBanned: false, lastLoginDate: today };
      users.push(user);
    } else {
      user.lastLoginDate = today;
      users[users.findIndex(u => u.phone === phone)] = user;
    }
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    localStorage.setItem(CURRENT_USER_SESSION, JSON.stringify(user));
    return user;
  },

  getCurrentUser: () => {
    const data = localStorage.getItem(CURRENT_USER_SESSION);
    return data ? JSON.parse(data) : null;
  },

  logout: () => localStorage.removeItem(CURRENT_USER_SESSION),

  updateUserUsage: (seconds: number) => {
    const user = logger.getCurrentUser();
    if (!user) return;
    const today = new Date().toISOString().split('T')[0];
    user.dailyUsage[today] = (user.dailyUsage[today] || 0) + seconds;
    localStorage.setItem(CURRENT_USER_SESSION, JSON.stringify(user));
    const users: User[] = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const idx = users.findIndex(u => u.phone === user.phone);
    if (idx !== -1) { users[idx] = user; localStorage.setItem(USERS_KEY, JSON.stringify(users)); }
  },

  checkSubscription: () => {
    const user = logger.getCurrentUser();
    if (!user) return { isPro: false, remainingFreeSecs: 0, isBanned: false, isPassActive: false, userType: 'new' };
    const now = Date.now();
    const isPro = user.subExpiry > now;
    const isPassActive = (user.freePassExpiry || 0) > now;
    const usedToday = user.dailyUsage[new Date().toISOString().split('T')[0]] || 0;
    let remaining = Math.max(0, 1800 - usedToday);
    if (isPassActive && !isPro) remaining = Math.floor(((user.freePassExpiry || 0) - now) / 1000);
    return { isPro, isPassActive, remainingFreeSecs: remaining, isBanned: !!user.isBanned, userType: ADMIN_PHONES.includes(user.phone) ? 'admin' : (user.subExpiry > now + 864000000 ? 'annual' : (user.subExpiry > now ? 'starter' : 'unpaid')) };
  },

  getAllUsers: (): User[] => JSON.parse(localStorage.getItem(USERS_KEY) || '[]'),
  updateUserStatus: (phone: string, updates: Partial<User>) => {
    const users = logger.getAllUsers();
    const idx = users.findIndex(u => u.phone === phone);
    if (idx !== -1) {
      users[idx] = { ...users[idx], ...updates };
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
      if (logger.getCurrentUser()?.phone === phone) localStorage.setItem(CURRENT_USER_SESSION, JSON.stringify(users[idx]));
    }
  },

  /**
   * Added missing authentication/promotion activation methods
   */
  activateFreePass: () => {
    const user = logger.getCurrentUser();
    if (!user) return;
    const expiry = Date.now() + 15 * 60 * 1000; // 15 minutes
    logger.updateUserStatus(user.phone, { freePassExpiry: expiry });
  },

  activateStarterPack: () => {
    const user = logger.getCurrentUser();
    if (!user) return;
    const expiry = Date.now() + 48 * 3600 * 1000; // 48 hours
    logger.updateUserStatus(user.phone, { subExpiry: expiry });
  },

  getAnalytics: () => {
    const users = logger.getAllUsers();
    const today = new Date().toISOString().split('T')[0];
    return { total: users.length, dau: users.filter(u => u.lastLoginDate === today).length, mau: users.filter(u => u.lastLoginDate?.startsWith(today.substring(0, 7))).length };
  },

  getUserLogs: (phone: string) => JSON.parse(localStorage.getItem(`logs_${phone}`) || '[]'),
  logAction: (module: LearningModule, action: string, detail: any) => {
    const user = logger.getCurrentUser();
    if (!user) return;
    const logs = JSON.parse(localStorage.getItem(`logs_${user.phone}`) || '[]');
    logs.push({ timestamp: Date.now(), module, action, detail });
    localStorage.setItem(`logs_${user.phone}`, JSON.stringify(logs));
    if (action === 'complete' || action === 'learn') logger.advanceMasterSkill(module);
  },

  getMasterProgress: (): MasterProgress => {
    const k = `master_${logger.getCurrentUser()?.phone || 'guest'}`;
    const d = localStorage.getItem(k);
    if (!d) return { overallLevel: 1, academicRank: 'Novice Learner', skills: { vocabulary: 1, grammar: 1, reading: 1, speaking: 1, writing: 1 }, specialization: 'General English' };
    return JSON.parse(d);
  },

  advanceMasterSkill: (module: LearningModule) => {
    const p = logger.getMasterProgress();
    const m: any = { [LearningModule.VOCABULARY]: 'vocabulary', [LearningModule.GRAMMAR]: 'grammar', [LearningModule.READING]: 'reading', [LearningModule.SPEAKING]: 'speaking', [LearningModule.WRITING]: 'writing' };
    if (m[module]) {
      p.skills[m[module] as keyof MasterProgress['skills']] += 1;
      p.overallLevel = Math.floor(Object.values(p.skills).reduce((a, b) => a + b, 0) / 5) + 1;
      localStorage.setItem(`master_${logger.getCurrentUser()?.phone}`, JSON.stringify(p));
    }
  },

  setSpecialization: (spec: any) => {
    const p = logger.getMasterProgress();
    p.specialization = spec;
    localStorage.setItem(`master_${logger.getCurrentUser()?.phone}`, JSON.stringify(p));
  },

  addNote: (n: any) => {
    const k = `notes_${logger.getCurrentUser()?.phone}`;
    const notes = JSON.parse(localStorage.getItem(k) || '[]');
    notes.push({ ...n, id: Math.random().toString(36).substr(2, 9), timestamp: Date.now(), reviewCount: 0 });
    localStorage.setItem(k, JSON.stringify(notes));
  },

  /**
   * Added missing note review update method
   */
  updateNoteReview: (id: string) => {
    const k = `notes_${logger.getCurrentUser()?.phone}`;
    const notes: UserNote[] = JSON.parse(localStorage.getItem(k) || '[]');
    const idx = notes.findIndex(n => n.id === id);
    if (idx !== -1) {
      notes[idx].reviewCount += 1;
      notes[idx].lastReviewTimestamp = Date.now();
      localStorage.setItem(k, JSON.stringify(notes));
    }
  },

  getNotes: () => JSON.parse(localStorage.getItem(`notes_${logger.getCurrentUser()?.phone}`) || '[]'),
  getLogs: () => JSON.parse(localStorage.getItem(`logs_${logger.getCurrentUser()?.phone}`) || '[]'),
  getMistakes: () => logger.getLogs().filter((l: any) => l.action === 'mistake'),
  getReadingProgress: (cat: string): ReadingProgress => {
    const p = JSON.parse(localStorage.getItem(`reading_progress_${logger.getCurrentUser()?.phone}`) || '[]');
    return p.find((x: any) => x.category === cat) || { category: cat, currentLevel: 1, difficulty: 'beginner', completedArticles: [] };
  },

  updateReadingProgress: (cat: string, title: string) => {
    const k = `reading_progress_${logger.getCurrentUser()?.phone}`;
    const p = JSON.parse(localStorage.getItem(k) || '[]');
    let idx = p.findIndex((x: any) => x.category === cat);
    if (idx === -1) p.push({ category: cat, currentLevel: 1, difficulty: 'beginner', completedArticles: [title] });
    else if (!p[idx].completedArticles.includes(title)) {
      p[idx].completedArticles.push(title);
      if (p[idx].completedArticles.length % 3 === 0) p[idx].currentLevel += 1;
    }
    localStorage.setItem(k, JSON.stringify(p));
  },

  getUnknownWords: () => [...new Set(logger.getNotes().filter((n: any) => n.tag === 'vocabulary').map((n: any) => n.text))]
};
