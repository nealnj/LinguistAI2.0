
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

export interface JobOpening {
  id: string;
  company: string;
  companyCN: string;
  title: string;
  titleCN: string;
  location: string;
  locationCN: string;
  salaryRange: string;
  salaryRangeCN: string;
  requirements: string[];
  requirementsCN: string[];
  description: string;
  descriptionCN: string;
  sourceUrl?: string;
  isHot: boolean;
}

export interface VocabularyWord {
  word: string;
  phonetic: string;
  translation: string;
  pos: string;
  frequency: string;
  coreObject: string;
  coreObjectCN: string;
  sceneTitle: string;
  sceneTitleCN: string;
  sceneDescription: string;
  sceneDescriptionCN: string;
  associations: {
    synonyms: { word: string; translation: string }[];
    antonyms: { word: string; translation: string }[];
    derivatives: { word: string; pos: string; meaning: string }[];
  };
  example: string;
  exampleTranslation: string;
  mnemonic: string;
  mnemonicCN: string;
  roots: string;
  rootsCN: string;
  visualPrompt: string;
  imageUrl?: string;
}

export interface VocabularyUnit { id: string; title: string; titleCN: string; description: string; descriptionCN: string; theme: string; status: 'locked' | 'current' | 'completed'; }
export interface UserFeedback { id: string; phone: string; module: LearningModule; issueType: 'accuracy' | 'experience' | 'logic' | 'technical'; content: string; contextData: any; timestamp: number; status: 'pending' | 'analyzed' | 'applied'; }
export interface HealingRule { id: string; description: string; targetModule: LearningModule | 'all'; systemInstructionAddon: string; createdAt: number; active: boolean; }
export interface User { phone: string; password?: string; name: string; regDate: number; subExpiry: number; dailyUsage: { [date: string]: number }; isBanned?: boolean; lastLoginDate?: string; freePassExpiry?: number; }
export interface MasterProgress { overallLevel: number; academicRank: string; skills: { vocabulary: number; grammar: number; reading: number; speaking: number; writing: number; }; specialization: 'AI & Future Tech' | 'Global Finance' | 'Green Tech' | 'Bio-Medicine' | 'Digital Marketing' | 'Smart Manufacturing' | 'General English'; }
export interface ReadingArticle { title: string; chineseTitle: string; content: string; curriculumGoal: string; keyWords: { word: string; meaning: string; }[]; questions: { question: string; options: string[]; answer: number; explanation: string; }[]; }
export interface GrammarLesson { title: string; concept: string; analogy: string; structureBreakdown: any[]; rules: any[]; }
export interface GrammarQuiz { question: string; options: string[]; correctAnswer: number; detailedAnalysis: any; }
export interface WritingAnalysis { score: number; feedback: string; corrections: any[]; }
export interface UserNote { id: string; text: string; context: string; timestamp: number; module: LearningModule; tag?: 'vocabulary' | 'note'; reviewCount: number; lastReviewTimestamp?: number; }
export interface UserLogEntry { timestamp: number; module: LearningModule; action: 'learn' | 'mistake' | 'unknown_word' | 'complete' | 'note_added' | 'ai_chat'; detail: any; }
export interface RoadmapStep { stage: string; focus: string[]; status: 'locked' | 'current' | 'completed'; }
export interface ReadingProgress { category: string; currentLevel: number; difficulty: string; completedArticles: string[]; }
