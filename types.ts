
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
  ADMIN = 'admin'
}

export interface User {
  phone: string;
  password?: string;
  name: string;
  regDate: number;
  subExpiry: number; // Timestamp
  dailyUsage: { [date: string]: number }; // seconds used per date
  isBanned?: boolean;
  lastLoginDate?: string; // YYYY-MM-DD
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

export interface GrammarLesson {
  title: string;
  concept: string; 
  analogy: string; 
  rules: { title: string; content: string }[];
  examples: { english: string; chinese: string; note: string }[];
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
}

export interface VocabularyWord {
  word: string;
  phonetic: string;
  translation: string;
  pos: string; // Part of Speech
  example: string;
  exampleTranslation: string; // NEW: Example Chinese translation
  exampleStructure: { // NEW: Deep breakdown for the main example
    sentenceType: string;
    analysis: {
      subject: string;
      verb: string;
      object: string;
      others: string;
    };
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

export interface GrammarQuiz {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  detailedAnalysis: {
    logic: string;
    structure: string;
    collocations: string;
  };
}

export interface ReadingProgress { category: string; currentLevel: number; difficulty: 'beginner' | 'intermediate' | 'advanced'; completedArticles: string[]; }
export interface UserNote { id: string; text: string; context: string; timestamp: number; module: LearningModule; tag?: 'vocabulary' | 'note'; reviewCount: number; lastReviewTimestamp?: number; }
export interface UserLogEntry { timestamp: number; module: LearningModule; action: 'learn' | 'mistake' | 'unknown_word' | 'complete' | 'note_added' | 'ai_chat'; detail: any; }
export interface WritingAnalysis { score: number; feedback: string; corrections: { original: string; suggested: string; reason: string }[]; }
export interface ReadingArticle { title: string; chineseTitle: string; content: string; curriculumGoal: string; keyWords: { word: string; meaning: string; }[]; questions: { question: string; options: string[]; answer: number; explanation: string; }[]; }
