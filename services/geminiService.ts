
import { GoogleGenAI, Type, Modality } from "@google/genai";

const FLASH_TXT = 'gemini-3-flash-preview'; 
const PRO_TXT = 'gemini-3-pro-preview';
const IMAGE_GEN = 'gemini-2.5-flash-image';
const TTS_MODEL = 'gemini-2.5-flash-preview-tts';

/**
 * 健壮的 AI 调用封装：具备自动降级、限流退避、结构保护
 */
async function aiCall<T>(fn: (ai: GoogleGenAI) => Promise<T>, retries = 2): Promise<T> {
  const apiKey = process.env.API_KEY;
  const ai = new GoogleGenAI({ apiKey });
  
  try {
    return await fn(ai);
  } catch (error: any) {
    const msg = error.message || "";
    if (msg.includes('429') && retries > 0) {
      await new Promise(r => setTimeout(r, 2000));
      return aiCall(fn, retries - 1);
    }
    throw error;
  }
}

const safeParse = (jsonStr: string, fallback: any) => {
  try {
    const cleaned = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();
    const data = JSON.parse(cleaned);
    return Array.isArray(fallback) ? (Array.isArray(data) ? data : fallback) : { ...fallback, ...data };
  } catch {
    return fallback;
  }
};

/**
 * 全球职业洞察：利用 Google Search 实时爬取最新市场数据
 */
export const generateGlobalInsights = async (country: string) => {
  const fallback = {
    market: { salary: "N/A", pct: "0%", history: [] },
    demand: [],
    news: [],
    visa: [],
    sources: []
  };

  return aiCall(async (ai) => {
    const response = await ai.models.generateContent({
      model: FLASH_TXT,
      contents: `ACT AS A CRAWLER. Search and extract the latest 2024-2025 career market data for ${country}. Focus on actual reported salaries and trending news. Return JSON: {market: {salary, pct, history:[{year, value}]}, demand: [{title, growth}], news: [{title, summary, date}], visa: [{title, description}]}`,
      config: { 
        responseMimeType: "application/json",
        tools: [{ googleSearch: {} }] 
      }
    });
    
    // 提取搜索来源（爬虫证据）
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const parsed = safeParse(response.text, fallback);
    return { ...parsed, sources };
  });
};

/**
 * 寰宇视野趋势：使用 Search 实时爬取新闻、音乐、电影趋势
 */
export const generateVisionTrends = async () => {
  const fallback = { news: [], songs: [], movies: [], sources: [] };
  return aiCall(async (ai) => {
    const response = await ai.models.generateContent({
      model: FLASH_TXT,
      contents: `ACT AS A DATA CRAWLER. Search the absolute top 3 trending global items TODAY for: 1. Latest World News, 2. Billboard/Music Chart Hits, 3. New Cinema/Movie Releases. Format the findings into educational segments. Return JSON: {news: [{t_en, t_cn, s_en, s_cn, keywords:[]}], songs: [{name_en, name_cn, artist, lyrics_clip_en, lyrics_clip_cn}], movies: [{title_en, title_cn, accent, desc_en, desc_cn}]}`,
      config: { 
        responseMimeType: "application/json",
        tools: [{ googleSearch: {} }]
      }
    });
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const parsed = safeParse(response.text, fallback);
    return { ...parsed, sources };
  });
};

export const analyzeVisionItem = async (topic: string, type: string) => {
  return aiCall(async (ai) => {
    const response = await ai.models.generateContent({
      model: FLASH_TXT,
      contents: `Search and deeply analyze ${type}: "${topic}". Create an educational long article in English (article_en) and Chinese (article_cn). Also extract vocabulary and structures. Return JSON: {article_en, article_cn, vocab: [{w,t,e}], structures: [{s,logic}], collocations: [{phrase,meaning,usage}], expressions: [{exp,meaning,context}]}`,
      config: { 
        responseMimeType: "application/json",
        tools: [{ googleSearch: {} }]
      }
    });
    return safeParse(response.text, { article_en: "", article_cn: "", vocab: [], structures: [], collocations: [], expressions: [] });
  });
};

export const generateLearningPlan = async (goal: string) => {
  return aiCall(async (ai) => {
    const response = await ai.models.generateContent({
      model: FLASH_TXT,
      contents: `Create a 5-step systematic learning roadmap for: ${goal}. Return as a JSON array of objects with {stage, focus: string[]}.`,
      config: { responseMimeType: "application/json" }
    });
    return safeParse(response.text, []);
  });
};

export const generateReviewQuiz = async (notes: any[]) => {
  return aiCall(async (ai) => {
    const response = await ai.models.generateContent({
      model: FLASH_TXT,
      contents: `Generate a multiple choice quiz (4 questions) based on these vocabulary notes: ${JSON.stringify(notes)}. Return JSON array of {question, options:[], answer: index, explanation}.`,
      config: { responseMimeType: "application/json" }
    });
    return safeParse(response.text, []);
  });
};

export const generateVocabulary = async (level: string) => {
  return aiCall(async (ai) => {
    const response = await ai.models.generateContent({
      model: FLASH_TXT,
      contents: `Generate 5 academic vocabulary words for ${level} level. Return JSON array of VocabularyWord objects.`,
      config: { responseMimeType: "application/json" }
    });
    return safeParse(response.text, []);
  });
};

export const getSpeechAudio = async (text: string) => {
  return aiCall(async (ai) => {
    const response = await ai.models.generateContent({
      model: TTS_MODEL,
      contents: [{ parts: [{ text: `Say clearly: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
        }
      }
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
  });
};

export const generateImage = async (prompt: string) => {
  return aiCall(async (ai) => {
    const response = await ai.models.generateContent({
      model: IMAGE_GEN,
      contents: { parts: [{ text: `A clear, educational, high-quality visual representation of: ${prompt}. Minimalistic, white background.` }] },
      config: { imageConfig: { aspectRatio: "1:1" } }
    });
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
    return null;
  });
};

export const analyzeWriting = async (text: string) => {
  return aiCall(async (ai) => {
    const response = await ai.models.generateContent({
      model: FLASH_TXT,
      contents: `Analyze this English writing for IELTS standards: "${text}". Return JSON {score, feedback, corrections: [{original, suggested, reason}]}.`,
      config: { responseMimeType: "application/json" }
    });
    return safeParse(response.text, { score: 0, feedback: "Error analyzing text.", corrections: [] });
  });
};

export const getExamTips = async (type: string) => {
  return aiCall(async (ai) => {
    const response = await ai.models.generateContent({
      model: FLASH_TXT,
      contents: `Provide 5 practical, advanced tips for the ${type} exam.`,
    });
    return response.text || "No tips available.";
  });
};

export const generateGrammarLesson = async (topic: string) => {
  return aiCall(async (ai) => {
    const response = await ai.models.generateContent({
      model: FLASH_TXT,
      contents: `Create a deep-dive grammar lesson for "${topic}". Return JSON.`,
      config: { responseMimeType: "application/json" }
    });
    return safeParse(response.text, { title: topic, concept: "", analogy: "", structureBreakdown: [], rules: [] });
  });
};

export const generateGrammarQuiz = async (topic: string) => {
  return aiCall(async (ai) => {
    const response = await ai.models.generateContent({
      model: FLASH_TXT,
      contents: `Create 3 challenging grammar quiz questions for "${topic}". Return JSON array.`,
      config: { responseMimeType: "application/json" }
    });
    return safeParse(response.text, []);
  });
};

export const generateReadingArticle = async (category: string, progress: any) => {
  return aiCall(async (ai) => {
    const response = await ai.models.generateContent({
      model: FLASH_TXT,
      contents: `Generate a reading article about ${category} for Level ${progress.currentLevel}. Return JSON.`,
      config: { responseMimeType: "application/json" }
    });
    return safeParse(response.text, { title: "Error", content: "", questions: [] });
  });
};

export const generateMentorAdvice = async (module: string, userMsg?: string) => {
  return aiCall(async (ai) => {
    const prompt = userMsg 
      ? `As an AI English Mentor for ${module}, answer: "${userMsg}".`
      : `Provide advice and a tip for ${module}. Return JSON {advice, actionableTip}.`;
    const response = await ai.models.generateContent({
      model: FLASH_TXT,
      contents: prompt,
      config: userMsg ? {} : { responseMimeType: "application/json" }
    });
    if (userMsg) return { advice: response.text || "I'm here to help!", actionableTip: "" };
    return safeParse(response.text, { advice: "Keep going!", actionableTip: "Practice makes perfect." });
  });
};
