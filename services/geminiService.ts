
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { logger } from "./logger";

const TEXT_MODEL = 'gemini-3-flash-preview';

const CACHE_TTL = {
  ROADMAP: 1000 * 60 * 60 * 24,
  LESSON: 1000 * 60 * 60 * 12,
  ARTICLE: 1000 * 60 * 60 * 2,
  VOCAB: 1000 * 60 * 30
};

const getCacheKey = (type: string, context: string = '') => {
  const user = logger.getCurrentUser();
  const level = logger.getMasterProgress().overallLevel;
  return `linguist_cache_${user?.phone}_${type}_${level}_${context}`;
};

const getFromCache = (key: string) => {
  const cached = localStorage.getItem(key);
  if (!cached) return null;
  const { data, timestamp, ttl } = JSON.parse(cached);
  if (Date.now() - timestamp > ttl) {
    localStorage.removeItem(key);
    return null;
  }
  return data;
};

const saveToCache = (key: string, data: any, ttl: number) => {
  localStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now(), ttl }));
};

async function callWithRetry<T>(fn: () => Promise<T>, retries = 2, delay = 2000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const errorMsg = error.message || "";
    if (errorMsg.includes('429') || errorMsg.includes('RESOURCE_EXHAUSTED')) {
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
        return callWithRetry(fn, retries - 1, delay * 2);
      }
    }
    throw error;
  }
}

const getLearningContext = () => {
  const progress = logger.getMasterProgress();
  return {
    level: progress.overallLevel,
    skills: progress.skills,
    spec: progress.specialization
  };
};

export const generateVocabulary = async (topic: string = 'General') => {
  const cacheKey = getCacheKey('vocab', topic);
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  return callWithRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const context = getLearningContext();
    
    const prompt = `You are an expert Lexicographer. Generate 5 high-impact vocabulary words. 
    Target Level: CEFR B2/C1. Topic: ${topic}. Focus Domain: ${context.spec}.
    
    REQUIRED JSON STRUCTURE FOR EACH WORD:
    - word: String
    - phonetic: IPA
    - translation: Chinese
    - pos: e.g. "Verb"
    - example: High-quality English sentence
    - exampleTranslation: Chinese translation of example
    - exampleStructure: { sentenceType, analysis: { subject, verb, object, others }, explanation: Chinese analysis }
    - mnemonic: Bilingual memory trick
    - forms: Array(2-3 items). EACH ITEM MUST BE FULLY POPULATED:
        { 
          form: "The derived word", 
          pos: "Part of speech", 
          phonetic: "IPA", 
          meaning: "Chinese meaning", 
          example: "Short English sentence using this form", 
          derivationReason: "Chinese explanation of the morphological change (e.g. adding -ly suffix for adverb)" 
        }
    - roots: Root/Prefix info
    - affixes: Suffix info
    - etymology: History in Chinese
    - visualPrompt: Image generation prompt
    
    MANDATORY: Do NOT leave "forms" empty. Provide at least 2 derived forms (noun, adj, or adv) for each word. 
    Ensure every sub-field in "forms" has high-quality content.`;

    const response = await ai.models.generateContent({
      model: TEXT_MODEL,
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    const result = JSON.parse(response.text || '[]');
    saveToCache(cacheKey, result, CACHE_TTL.VOCAB);
    return result;
  });
};

// ... Rest of the functions remain same
export const generateGrammarLesson = async (topic: string) => { const cacheKey = getCacheKey('grammar_lesson', topic); const cached = getFromCache(cacheKey); if (cached) return cached; return callWithRetry(async () => { const ai = new GoogleGenAI({ apiKey: process.env.API_KEY }); const context = getLearningContext(); const prompt = `Senior Linguist Topic: "${topic}". Level: ${context.skills.grammar}. Structure Breakdown needed. Return GrammarLesson JSON. Bilingual EN/CN.`; const response = await ai.models.generateContent({ model: TEXT_MODEL, contents: prompt, config: { responseMimeType: "application/json" } }); const result = JSON.parse(response.text || '{}'); saveToCache(cacheKey, result, CACHE_TTL.LESSON); return result; }); };
export const generateGrammarQuiz = async (topic: string) => { const cacheKey = getCacheKey('grammar_quiz', topic); const cached = getFromCache(cacheKey); if (cached) return cached; return callWithRetry(async () => { const ai = new GoogleGenAI({ apiKey: process.env.API_KEY }); const prompt = `Create 3 grammar quiz questions for: ${topic}. Detailed EN/CN reasoning required. Return JSON for GrammarQuiz[].`; const response = await ai.models.generateContent({ model: TEXT_MODEL, contents: prompt, config: { responseMimeType: "application/json" } }); const result = JSON.parse(response.text || '[]'); saveToCache(cacheKey, result, CACHE_TTL.LESSON); return result; }); };
export const generateLearningPlan = async (userGoal: string) => { const cacheKey = getCacheKey('roadmap', userGoal); const cached = getFromCache(cacheKey); if (cached) return cached; return callWithRetry(async () => { const ai = new GoogleGenAI({ apiKey: process.env.API_KEY }); const response = await ai.models.generateContent({ model: TEXT_MODEL, contents: `Roadmap for ${userGoal}. Level ${logger.getMasterProgress().overallLevel}. Return RoadmapStep[] JSON.`, config: { responseMimeType: "application/json" } }); const result = JSON.parse(response.text || '[]'); saveToCache(cacheKey, result, CACHE_TTL.ROADMAP); return result; }); };
export const generateReadingArticle = async (category: string, progress: any) => { const cacheKey = getCacheKey('reading_article', `${category}_${progress.currentLevel}`); const cached = getFromCache(category); if (cached) return cached; return callWithRetry(async () => { const ai = new GoogleGenAI({ apiKey: process.env.API_KEY }); const prompt = `Reading Article. Level ${progress.currentLevel}. Category: ${category}. Return ReadingArticle JSON.`; const response = await ai.models.generateContent({ model: TEXT_MODEL, contents: prompt, config: { responseMimeType: "application/json" } }); const result = JSON.parse(response.text || '{}'); saveToCache(cacheKey, result, CACHE_TTL.ARTICLE); return result; }); };
export const generateMentorAdvice = async (activeModule: string, userMessage?: string) => { const ai = new GoogleGenAI({ apiKey: process.env.API_KEY }); const context = getLearningContext(); const prompt = `You are "Linguist Pro". USER: Level ${context.level}. Module: ${activeModule}. ${userMessage ? `Question: ${userMessage}` : `Give proactive advice.`} Return JSON: { "advice": "string", "actionableTip": "string" }`; const response = await ai.models.generateContent({ model: TEXT_MODEL, contents: prompt, config: { responseMimeType: "application/json" } }); return JSON.parse(response.text || '{"advice": "Keep going!", "actionableTip": "Continue practicing."}'); };
export const getSpeechAudio = async (text: string) => { return callWithRetry(async () => { const ai = new GoogleGenAI({ apiKey: process.env.API_KEY }); const response = await ai.models.generateContent({ model: "gemini-2.5-flash-preview-tts", contents: [{ parts: [{ text: text }] }], config: { responseModalities: [Modality.AUDIO], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } }, }, }); return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data; }); };
export const generateReviewQuiz = async (notes: any[]) => { const ai = new GoogleGenAI({ apiKey: process.env.API_KEY }); const content = notes.map(n => n.text).join('\n'); const response = await ai.models.generateContent({ model: TEXT_MODEL, contents: `Quiz for notes:\n${content}`, config: { responseMimeType: "application/json" } }); return JSON.parse(response.text || '[]'); };
export const analyzeWriting = async (text: string) => { const ai = new GoogleGenAI({ apiKey: process.env.API_KEY }); const response = await ai.models.generateContent({ model: TEXT_MODEL, contents: `Analyze writing: ${text}`, config: { responseMimeType: "application/json" } }); return JSON.parse(response.text || '{"score": 0, "feedback": "", "corrections": []}'); };
export const getExamTips = async (examType: string) => { const ai = new GoogleGenAI({ apiKey: process.env.API_KEY }); const response = await ai.models.generateContent({ model: TEXT_MODEL, contents: `Tips for ${examType}` }); return response.text || ''; };
export const generateImage = async (prompt: string) => { return callWithRetry(async () => { const ai = new GoogleGenAI({ apiKey: process.env.API_KEY }); const response = await ai.models.generateContent({ model: 'gemini-2.5-flash-image', contents: { parts: [{ text: prompt }] }, config: { imageConfig: { aspectRatio: "1:1" } }, }); for (const part of response.candidates[0].content.parts) { if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`; } return null; }); };
