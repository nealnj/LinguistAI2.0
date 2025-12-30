
import { GoogleGenAI, Type, Modality } from "@google/genai";

const FLASH_TXT = 'gemini-3-flash-preview'; 
const PRO_TXT = 'gemini-3-pro-preview';
const IMAGE_GEN = 'gemini-2.5-flash-image';
const TTS_MODEL = 'gemini-2.5-flash-preview-tts';

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
    if (Array.isArray(fallback) && !Array.isArray(data)) return fallback;
    if (typeof fallback === 'object' && fallback !== null && !Array.isArray(fallback)) {
      return { ...fallback, ...data };
    }
    return data;
  } catch {
    return fallback;
  }
};

/**
 * 全球职业洞察：云端爬虫 + 中英对照
 * 实时性：抓取 2024-2025 签证、薪资、区域对比
 * 精准性：提供 Source Link 和 难度/成本/友好度量化指标
 */
export const generateGlobalInsights = async (country: string) => {
  const fallback = { market: {}, regions: [], demand: [], news: [], visa: [], sources: [] };
  return aiCall(async (ai) => {
    const response = await ai.models.generateContent({
      model: FLASH_TXT,
      contents: `ACT AS AN ADVANCED WEB SCRAPER. 
      Crawl the latest 2024-2025 career data for "${country}".
      1. COMPARE main cities/regions (e.g., Tokyo vs Osaka).
      2. BILINGUAL: All fields in both English and Chinese.
      3. FACTUAL: Find direct reference links.
      
      Return JSON: {
        market: {salary_en, salary_cn, pct, trend}, 
        regions: [{name_en, name_cn, description_en, description_cn, difficulty, cost, friendliness, proTip_cn, source_link}],
        demand: [{title_en, title_cn, growth, source_link}], 
        news: [{title_en, title_cn, summary_en, summary_cn, date, source_link}], 
        visa: [{title_en, title_cn, description_en, description_cn, source_link}]
      }`,
      config: { 
        responseMimeType: "application/json",
        tools: [{ googleSearch: {} }] 
      }
    });
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    return { ...safeParse(response.text, fallback), sources };
  });
};

/**
 * 系统化单词生成：学术级精准性
 * 分析词根词缀、SVO 结构、记忆锚点
 */
export const generateVocabulary = async (level: string) => {
  return aiCall(async (ai) => {
    const response = await ai.models.generateContent({
      model: FLASH_TXT,
      contents: `Generate 5 academic vocabulary words for ${level}. 
      PRECISION REQUIREMENT:
      1. SVO ANALYSIS: Break down example sentence structure.
      2. ETYMOLOGY: Roots and affixes.
      3. MNEMONIC: Logic-based memory tip.
      Return JSON array of VocabularyWord objects.`,
      config: { responseMimeType: "application/json" }
    });
    return safeParse(response.text, []);
  });
};

/**
 * 寰宇视野趋势：实时热点爬虫
 * 抓取当日全球最火新闻、金曲、影视
 */
export const generateVisionTrends = async () => {
  return aiCall(async (ai) => {
    const response = await ai.models.generateContent({
      model: FLASH_TXT,
      contents: `ACT AS A TREND SCRAPER. Search top global items TODAY (2024-2025).
      Categories: 1. Breaking News, 2. Global Music Hits, 3. New Movie/Series.
      Return JSON: {news:[], songs:[], movies:[]}. All bilingual.`,
      config: { 
        responseMimeType: "application/json",
        tools: [{ googleSearch: {} }]
      }
    });
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    return { ...safeParse(response.text, { news: [], songs: [], movies: [] }), sources };
  });
};

/**
 * 行业演化阅读：实时性 + 教学性
 * 抓取最新行业新闻并转化为指定等级的阅读教材
 */
export const generateReadingArticle = async (category: string, progress: any) => {
  return aiCall(async (ai) => {
    const response = await ai.models.generateContent({
      model: FLASH_TXT,
      contents: `Crawl the most recent news in ${category} (2024-2025). 
      Convert it into a bilingual educational article for Level ${progress.currentLevel}.
      Include 3 reading comprehension questions with logic analysis. JSON.`,
      config: { 
        responseMimeType: "application/json",
        tools: [{ googleSearch: {} }]
      }
    });
    return safeParse(response.text, { title: "", chineseTitle: "", content: "", questions: [] });
  });
};

export const analyzeVisionItem = async (topic: string, type: string) => {
  return aiCall(async (ai) => {
    const response = await ai.models.generateContent({
      model: FLASH_TXT,
      contents: `Deep crawl and analyze ${type}: "${topic}" for English learners. 
      Analyze vocabulary, structure, and cultural context. Return JSON.`,
      config: { 
        responseMimeType: "application/json",
        tools: [{ googleSearch: {} }]
      }
    });
    return safeParse(response.text, { article_en: "", article_cn: "", vocab: [], structures: [] });
  });
};

export const getSpeechAudio = async (text: string) => {
  return aiCall(async (ai) => {
    const response = await ai.models.generateContent({
      model: TTS_MODEL,
      contents: [{ parts: [{ text: `Say clearly: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } }
      }
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
  });
};

export const generateImage = async (prompt: string) => {
  return aiCall(async (ai) => {
    const response = await ai.models.generateContent({
      model: IMAGE_GEN,
      contents: { parts: [{ text: `High quality conceptual image for: ${prompt}` }] }
    });
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
    return null;
  });
};

export const generateGrammarLesson = async (topic: string) => {
  return aiCall(async (ai) => {
    const response = await ai.models.generateContent({
      model: FLASH_TXT,
      contents: `Create a precision grammar lesson for "${topic}" with SVO breakdown and analogies. JSON.`,
      config: { responseMimeType: "application/json" }
    });
    return safeParse(response.text, { title: topic, concept: "", analogy: "", structureBreakdown: [] });
  });
};

export const analyzeWriting = async (text: string) => {
  return aiCall(async (ai) => {
    const response = await ai.models.generateContent({
      model: FLASH_TXT,
      contents: `Analyze writing precision: "${text}". Score 0-9. JSON feedback.`,
      config: { responseMimeType: "application/json" }
    });
    return safeParse(response.text, { score: 0, feedback: "", corrections: [] });
  });
};

export const generateLearningPlan = async (goal: string) => {
  return aiCall(async (ai) => {
    const response = await ai.models.generateContent({
      model: FLASH_TXT,
      contents: `Strategic roadmap for: ${goal}. JSON steps.`,
      config: { responseMimeType: "application/json" }
    });
    return safeParse(response.text, []);
  });
};

export const generateMentorAdvice = async (module: string, userMsg?: string) => {
  return aiCall(async (ai) => {
    const prompt = userMsg ? `User asks: ${userMsg}` : `Expert advice for ${module}.`;
    const response = await ai.models.generateContent({
      model: FLASH_TXT,
      contents: prompt,
      config: userMsg ? {} : { responseMimeType: "application/json" }
    });
    if (userMsg) return { advice: response.text || "", actionableTip: "" };
    return safeParse(response.text, { advice: "", actionableTip: "" });
  });
};

export const generateReviewQuiz = async (notes: any[]) => {
  return aiCall(async (ai) => {
    const response = await ai.models.generateContent({
      model: FLASH_TXT,
      contents: `Memory quiz for: ${JSON.stringify(notes)}. JSON.`,
      config: { responseMimeType: "application/json" }
    });
    return safeParse(response.text, []);
  });
};

export const getExamTips = async (type: string) => {
  return aiCall(async (ai) => {
    const response = await ai.models.generateContent({
      model: FLASH_TXT,
      contents: `Bilingual strategies for ${type} exam.`,
    });
    return response.text || "";
  });
};

export const generateGrammarQuiz = async (topic: string) => {
  return aiCall(async (ai) => {
    const response = await ai.models.generateContent({
      model: FLASH_TXT,
      contents: `3 precision grammar quiz questions for ${topic}. JSON.`,
      config: { responseMimeType: "application/json" }
    });
    return safeParse(response.text, []);
  });
};
