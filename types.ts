
export enum LearningModule {
  DASHBOARD = 'dashboard',
  VOCABULARY = 'vocabulary',
  GRAMMAR = 'grammar',
  SPEAKING = 'speaking',
  WRITING = 'writing',
  IELTS = 'ielts',
  CAMBRIDGE = 'cambridge',
  ROADMAP = 'roadmap'
}

export interface WordForm {
  form: string;
  phonetic: string;
  pos: string;
  meaning: string;
  example: string;
  derivationReason: string;
}

export interface RelatedWordEntry {
  word: string;
  phonetic: string;
  meaning: string;
  example: string;
}

export interface PhraseEntry {
  phrase: string;
  translation: string;
  example: string;
}

export interface VocabularyWord {
  word: string;
  phonetic: string;
  pos: string;
  translation: string;
  example: string;
  level: string;
  roots?: string;
  affixes?: string;
  etymology?: string;
  mnemonic?: string;
  memoryTip?: string;
  phrases?: PhraseEntry[];
  forms?: WordForm[];
  relatedWords?: { synonym: RelatedWordEntry[]; antonym: RelatedWordEntry[] };
  visualPrompt?: string;
  imageUrl?: string;
}

export interface GrammarLesson {
  title: string;
  concept: string; // The core rule explained simply in Chinese
  analogy: string; // A Chinese-friendly analogy
  rules: { title: string; content: string }[];
  examples: { english: string; chinese: string; note: string }[];
}

export interface GrammarQuiz {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface WritingAnalysis {
  score: number;
  feedback: string;
  corrections: { original: string; suggested: string; reason: string }[];
}

export interface RoadmapStep {
  stage: string;
  goal: string;
  focus: string[];
  status: 'completed' | 'current' | 'locked';
}
