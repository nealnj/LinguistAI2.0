
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
  VISION = 'vision' // 新增：AI 寰宇视野（资讯、音乐、电影）
}

// ... 保持原有接口不变
export interface User {
  phone: string;
  password?: string;
  name: string;
  regDate: number;
  subExpiry: number;
  dailyUsage: { [date: string]: number };
  isBanned?: boolean;
  lastLoginDate?: string;
}

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

export interface RoadmapStep {
  stage: string;
  focus: string[];
  status: 'locked' | 'current' | 'completed';
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
  phrases?: { phrase: string; translation: string; example: string }[];
  roots?: string;
  affixes?: string;
  etymology?: string;
  memoryTip?: string;
}

export interface ReadingProgress {
  category: string;
  currentLevel: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  completedArticles: string[];
}

export interface GrammarLesson {
  title: string;
  concept: string;
  analogy: string;
  structureBreakdown: {
    sentence: string;
    sentenceType: string;
    analysis: {
      subject: string;
      verb: string;
      object: string;
      others: string;
    };
    explanation: string;
    collocationTip?: string;
  }[];
  rules: {
    title: string;
    content: string;
  }[];
}

export interface GrammarQuiz {
  question: string;
  options: string[];
  correctAnswer: number;
  detailedAnalysis: {
    logic: string;
    structure: string;
    collocations: string;
  };
}

export interface WritingAnalysis {
  score: number;
  feedback: string;
  corrections: {
    original: string;
    suggested: string;
    reason: string;
  }[];
}

export interface UserNote { id: string; text: string; context: string; timestamp: number; module: LearningModule; tag?: 'vocabulary' | 'note'; reviewCount: number; lastReviewTimestamp?: number; }
export interface UserLogEntry { timestamp: number; module: LearningModule; action: 'learn' | 'mistake' | 'unknown_word' | 'complete' | 'note_added' | 'ai_chat'; detail: any; }
export interface ReadingArticle { title: string; chineseTitle: string; content: string; curriculumGoal: string; keyWords: { word: string; meaning: string; }[]; questions: { question: string; options: string[]; answer: number; explanation: string; }[]; }
