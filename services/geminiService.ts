
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
 * 简历生成引擎
 */
export const generatePersonalizedResume = async (userData: any, targetCountry: string, specialization: string) => {
  return aiCall(async (ai) => {
    const prompt = `ACT AS A SENIOR GLOBAL HEADHUNTER.
    Target: ${targetCountry} | Specialization: ${specialization}
    TASK: Generate a 1:1 Global Standard Resume (Markdown). Bilingual (EN/CN).`;

    const response = await ai.models.generateContent({
      model: FLASH_TXT,
      contents: prompt,
      config: { tools: [{ googleSearch: {} }] }
    });
    return response.text || "";
  });
};

/**
 * 全球职业洞察获取
 */
export const generateGlobalInsights = async (country: string) => {
  const fallback = { market: {}, regions: [], demand: [], news: [], visa: [], evolution: [], sources: [] };
  return aiCall(async (ai) => {
    const response = await ai.models.generateContent({
      model: FLASH_TXT,
      contents: `ACT AS AN ADVANCED CAREER DATA ANALYST. 
      Analyze TODAY'S market for "${country}".
      Return JSON: {
        market: {salary_en, salary_cn, trend_2yr_desc}, 
        evolution: [{sector_cn, shift_pct, reason_cn}],
        regions: [{name_en, name_cn, description_en, description_cn, difficulty, cost, friendliness, proTip_cn}],
        demand: [{title_en, title_cn, growth}], 
        news: [{title_en, title_cn, date}], 
        visa: [{title_en, title_cn, description_cn}]
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
 * 系统词汇生成：强制包含音标、派生词形态、词根词缀及句法剖析
 */
export const generateVocabulary = async (level: string) => {
  return aiCall(async (ai) => {
    const response = await ai.models.generateContent({
      model: FLASH_TXT,
      contents: `ACT AS AN ACADEMIC ETYMOLOGIST.
      TASK: Generate 5 HIGH-VALUE academic words for ${level}. 
      CRITICAL: You MUST provide accurate IPA phonetics, multiple morphological forms (derivatives), and structural analysis.`,
      config: { 
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              word: { type: Type.STRING },
              phonetic: { type: Type.STRING, description: 'Accurate IPA phonetic with slashes' },
              translation: { type: Type.STRING },
              pos: { type: Type.STRING, description: 'Part of speech' },
              example: { type: Type.STRING },
              exampleTranslation: { type: Type.STRING },
              exampleStructure: {
                type: Type.OBJECT,
                properties: {
                  sentenceType: { type: Type.STRING },
                  analysis: {
                    type: Type.OBJECT,
                    properties: {
                      subject: { type: Type.STRING },
                      verb: { type: Type.STRING },
                      object: { type: Type.STRING },
                      others: { type: Type.STRING }
                    },
                    required: ['subject', 'verb', 'object', 'others']
                  },
                  explanation: { type: Type.STRING }
                },
                required: ['sentenceType', 'analysis', 'explanation']
              },
              mnemonic: { type: Type.STRING },
              visualPrompt: { type: Type.STRING },
              forms: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    form: { type: Type.STRING },
                    pos: { type: Type.STRING },
                    phonetic: { type: Type.STRING },
                    meaning: { type: Type.STRING },
                    example: { type: Type.STRING },
                    derivationReason: { type: Type.STRING }
                  },
                  required: ['form', 'pos', 'phonetic', 'meaning', 'example', 'derivationReason']
                }
              },
              relatedWords: {
                type: Type.OBJECT,
                properties: {
                  synonym: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        word: { type: Type.STRING },
                        phonetic: { type: Type.STRING },
                        meaning: { type: Type.STRING },
                        example: { type: Type.STRING }
                      }
                    }
                  }
                }
              },
              roots: { type: Type.STRING },
              affixes: { type: Type.STRING },
              etymology: { type: Type.STRING },
              memoryTip: { type: Type.STRING }
            },
            required: ['word', 'phonetic', 'translation', 'pos', 'example', 'exampleStructure', 'mnemonic', 'forms', 'relatedWords']
          }
        }
      }
    });
    return safeParse(response.text, []);
  });
};

/**
 * 寰宇视野趋势获取
 */
export const generateVisionTrends = async () => {
  return aiCall(async (ai) => {
    const response = await ai.models.generateContent({
      model: FLASH_TXT,
      contents: `ACT AS A REAL-TIME GLOBAL TREND ANALYST. 
      Obtain the most popular items TODAY (2024-2025) across News, Music, and Movies.
      
      CRITICAL: You MUST use the following JSON structure and bilingual fields:
      {
        "news": [{"title_en": "...", "title_cn": "...", "desc_en": "...", "desc_cn": "..."}],
        "songs": [{"title_en": "...", "title_cn": "...", "desc_en": "...", "desc_cn": "...", "artist": "..."}],
        "movies": [{"title_en": "...", "title_cn": "...", "desc_en": "...", "desc_cn": "..."}]
      }
      
      Ensure all items are currently trending globally.`,
      config: { 
        responseMimeType: "application/json",
        tools: [{ googleSearch: {} }]
      }
    });
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const data = safeParse(response.text, { news: [], songs: [], movies: [] });
    return { ...data, sources };
  });
};

export const generateReadingArticle = async (category: string, progress: any) => {
  return aiCall(async (ai) => {
    const response = await ai.models.generateContent({
      model: FLASH_TXT,
      contents: `Obtain latest news in ${category} (2024-2025). Convert to bilingual article for Level ${progress.currentLevel}. JSON.`,
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
      contents: `Conduct deep analysis on ${type}: "${topic}". Return JSON: {article_en, article_cn, vocab: [{w, t, e}], structures: []}`,
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
      contents: `Create precision grammar lesson for "${topic}". JSON.`,
      config: { responseMimeType: "application/json" }
    });
    return safeParse(response.text, { title: topic, concept: "", analogy: "", structureBreakdown: [] });
  });
};

export const analyzeWriting = async (text: string) => {
  return aiCall(async (ai) => {
    const response = await ai.models.generateContent({
      model: FLASH_TXT,
      contents: `Analyze writing: "${text}". JSON.`,
      config: { responseMimeType: "application/json" }
    });
    return safeParse(response.text, { score: 0, feedback: "", corrections: [] });
  });
};

export const generateLearningPlan = async (goal: string) => {
  return aiCall(async (ai) => {
    const response = await ai.models.generateContent({
      model: FLASH_TXT,
      contents: `Strategic roadmap for: ${goal}. JSON.`,
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
