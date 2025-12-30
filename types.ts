
export enum LearningModule {
  DASHBOARD = 'dashboard',
  VOCABULARY = 'vocabulary',
  GRAMMAR = 'grammar',
  SPEAKING = 'speaking',
  WRITING = 'writing',
  READING = 'reading',
  ANALYSIS = 'analysis',
  IELTS = 'ielts',
  CAMBRIDGE = 'cambridge',
  ROADMAP = 'roadmap',
  PROFILE = 'profile',
  ADMIN = 'admin',
  GLOBAL_CAREER = 'global_career',
  VISION = 'vision'
}

export interface UserFeedback {
  id: string;
  phone: string;
  module: LearningModule;
  issueType: 'accuracy' | 'experience' | 'logic' | 'technical';
  content: string;
  contextData: any;
  timestamp: number;
  status: 'pending' | 'analyzed' | 'applied';
}

export interface HealingRule {
  id: string;
  description: string;
  targetModule: LearningModule | 'all';
  systemInstructionAddon: string; // 动态注入 Prompt 的内容
  createdAt: number;
  active: boolean;
}

export interface User {
  phone: string;
  password?: string;
  name: string;
  regDate: number;
  subExpiry: number;
  dailyUsage: { [date: string]: number };
  isBanned?: boolean;
  lastLoginDate?: string;
  freePassExpiry?: number;
}

// ... 其余保持不变
export interface MasterProgress {
  overallLevel: number;
  academicRank: string;
  skills: {
    vocabulary: number;
    grammar: number;
    reading: number;
    speaking: number;
    writing: number;
  };
  specialization: 'AI & Future Tech' | 'Global Finance' | 'Green Tech' | 'Bio-Medicine' | 'Digital Marketing' | 'Smart Manufacturing' | 'General English';
}

export interface VocabularyWord {
  word: string;
  phonetic: string;
  translation: string;
  pos: string;
  example: string;
  exampleTranslation: string;
  exampleStructure: {
    sentenceType: string;
    analysis: { subject: string; verb: string; object: string; others: string };
    explanation: string;
  };
  mnemonic: string;
  imageUrl?: string;
  visualPrompt?: string;
  forms?: { form: string; pos: string; phonetic: string; meaning: string; example: string; derivationReason: string }[];
  relatedWords?: { synonym: { word: string; phonetic: string; meaning: string; example: string }[] };
  roots?: string;
  affixes?: string;
  memoryTip?: string;
}

export interface ReadingArticle { title: string; chineseTitle: string; content: string; curriculumGoal: string; keyWords: { word: string; meaning: string; }[]; questions: { question: string; options: string[]; answer: number; explanation: string; }[]; }
export interface GrammarLesson { title: string; concept: string; analogy: string; structureBreakdown: any[]; rules: any[]; }
export interface GrammarQuiz { question: string; options: string[]; correctAnswer: number; detailedAnalysis: any; }
export interface WritingAnalysis { score: number; feedback: string; corrections: any[]; }
export interface UserNote { id: string; text: string; context: string; timestamp: number; module: LearningModule; tag?: 'vocabulary' | 'note'; reviewCount: number; lastReviewTimestamp?: number; }
export interface UserLogEntry { timestamp: number; module: LearningModule; action: 'learn' | 'mistake' | 'unknown_word' | 'complete' | 'note_added' | 'ai_chat'; detail: any; }

/**
 * Added missing types for roadmap and reading progress
 */
export interface RoadmapStep {
  stage: string;
  focus: string[];
  status: 'locked' | 'current' | 'completed';
}

export interface ReadingProgress {
  category: string;
  currentLevel: number;
  difficulty: string;
  completedArticles: string[];
}
