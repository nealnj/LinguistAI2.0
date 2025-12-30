
import { GoogleGenAI, Type, Modality } from "@google/genai";

// 模型常量
const FLASH_TXT = 'gemini-3-flash-preview'; 
const PRO_TXT = 'gemini-3-pro-preview';
const FLASH_IMG = 'gemini-2.5-flash-image';
const FLASH_TTS = 'gemini-2.5-flash-preview-tts';

/**
 * 核心安全调用封装 (Secure API Wrapper)
 * 1. 采用即时实例化：防止持久化对象被内存嗅探
 * 2. 严格错误过滤：确保错误信息中不携带敏感 Credential
 */
async function aiCall<T>(fn: (ai: GoogleGenAI) => Promise<T>, retries = 3): Promise<T> {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error('SECURE_CONTEXT_MISSING');

  const ai = new GoogleGenAI({ apiKey });
  
  try {
    return await fn(ai);
  } catch (error: any) {
    const msg = error.message || "";
    const sanitizedMsg = msg.replace(new RegExp(apiKey, 'g'), '***SECRET***');
    console.error(`[Secure Context Error]: ${sanitizedMsg}`);

    if (msg.includes('Requested entity was not found') || msg.includes('403') || msg.includes('API_KEY_INVALID')) {
       throw new Error('AUTH_INVALID');
    }
    
    if ((msg.includes('429') || msg.includes('500') || msg.includes('RESOURCE_EXHAUSTED')) && retries > 0) {
      const delay = (4 - retries) * 2000;
      await new Promise(r => setTimeout(r, delay));
      return aiCall(fn, retries - 1);
    }
    throw new Error(sanitizedMsg);
  }
}

const cache = {
  get: (key: string) => {
    const raw = localStorage.getItem(`la_c_v5_${key}`);
    if (!raw) return null;
    const { d, e } = JSON.parse(raw);
    return Date.now() < e ? d : null;
  },
  set: (key: string, d: any, h = 12) => {
    localStorage.setItem(`la_c_v5_${key}`, JSON.stringify({ d, e: Date.now() + h * 3600000 }));
  }
};

/**
 * 深度解析 Vision 内容
 */
export const analyzeVisionItem = async (topic: string, type: 'news' | 'song' | 'movie') => {
  return aiCall(async (ai) => {
    const prompt = `Search and analyze the specific content for: "${topic}" (${type}). Generate educational JSON {article_en, article_cn, vocab:[{w,t,e}], collocations:[{phrase,meaning,usage}], expressions:[{exp,meaning,context}], structures:[{s,logic}]}`;
    const response = await ai.models.generateContent({
      model: FLASH_TXT,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        tools: [{ googleSearch: {} }]
      }
    });
    return JSON.parse(response.text || '{}');
  });
};

/**
 * 实时全球趋势发现
 */
export const generateVisionTrends = async () => {
  const vKey = 'vision_trends_v1';
  const cached = cache.get(vKey);
  if (cached) return cached;

  return aiCall(async (ai) => {
    const prompt = `Search and identify 3 high-quality English trending items in News, Songs, Movies. Output BILINGUAL JSON.`;
    const response = await ai.models.generateContent({
      model: FLASH_TXT,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        tools: [{ googleSearch: {} }]
      }
    });
    const result = JSON.parse(response.text || '{}');
    cache.set(vKey, result, 6);
    return result;
  });
};

/**
 * 全球职业洞察
 */
export const generateGlobalInsights = async (country: string) => {
  const cKey = `ins_${country}_v2`;
  const cached = cache.get(cKey);
  if (cached) return cached;

  return aiCall(async (ai) => {
    const prompt = `Search 2024-2025 job market, immigration, and visa for ${country}. Output BILINGUAL JSON with news (including official URLs), visa policies, market trends, and salary history.`;
    const response = await ai.models.generateContent({
      model: PRO_TXT,
      contents: prompt,
      config: { 
        responseMimeType: "application/json",
        tools: [{ googleSearch: {} }] 
      }
    });
    const result = JSON.parse(response.text || '{}');
    cache.set(cKey, result); 
    return result;
  });
};

export const generateVocabulary = async (topic: string) => {
  return aiCall(async (ai) => {
    const res = await ai.models.generateContent({
      model: FLASH_TXT,
      contents: `Generate 5 vocabulary words for topic: ${topic}. Each word must have phonetic, translation, pos, example, exampleTranslation, exampleStructure(sentenceType, analysis{subject,verb,object,others}, explanation), mnemonic, visualPrompt, forms, relatedWords, roots, etymology, memoryTip. Output JSON array.`,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(res.text || '[]');
  });
};

export const generateImage = async (p: string) => {
  return aiCall(async (ai) => {
    const res = await ai.models.generateContent({
      model: FLASH_IMG,
      contents: { parts: [{ text: `High-quality educational 3D illustration for: ${p}` }] }
    });
    for (const part of res.candidates[0].content.parts) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
    return null;
  });
};

export const getSpeechAudio = async (text: string) => {
  return aiCall(async (ai) => {
    const res = await ai.models.generateContent({
      model: FLASH_TTS,
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } } }
      }
    });
    return res.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  });
};

export const analyzeWriting = async (text: string) => {
  return aiCall(async (ai) => {
    const res = await ai.models.generateContent({
      model: FLASH_TXT,
      contents: `Professional English correction for: "${text}". Provide score out of 90, detailed feedback, and array of corrections {original, suggested, reason}. Output JSON.`,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(res.text || '{}');
  });
};

export const generateGrammarLesson = async (topic: string) => {
  return aiCall(async (ai) => {
    const res = await ai.models.generateContent({
      model: FLASH_TXT,
      contents: `Detailed grammar lesson for: ${topic}. Include title, concept, analogy, structureBreakdown (sentence, sentenceType, analysis{subject,verb,object,others}, explanation, collocationTip), and rules[]. Output JSON.`,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(res.text || '{}');
  });
};

export const generateReadingArticle = async (category: string, progress: any) => {
  return aiCall(async (ai) => {
    const res = await ai.models.generateContent({
      model: FLASH_TXT,
      contents: `Educational reading article for category: ${category}, Level ${progress.currentLevel}. Include title, chineseTitle, content, curriculumGoal, keyWords[], and questions[]. Output JSON.`,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(res.text || '{}');
  });
};

export const generateMentorAdvice = async (mod: string, msg?: string) => {
  return aiCall(async (ai) => {
    const prompt = msg ? `As an AI mentor, answer this user question about ${mod}: "${msg}". Output JSON {advice, actionableTip}` : `Give a short motivational advice for ${mod} module. Output JSON {advice, actionableTip}`;
    const res = await ai.models.generateContent({
      model: FLASH_TXT,
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(res.text || '{}');
  });
};

export const generateLearningPlan = async (goal: string) => {
  return aiCall(async (ai) => {
    const res = await ai.models.generateContent({
      model: FLASH_TXT,
      contents: `Create a 5-stage systematic learning roadmap for goal: ${goal}. Output JSON array of {stage, focus:[]}.`,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(res.text || '[]');
  });
};

export const generateGrammarQuiz = async (topic: string) => {
  return aiCall(async (ai) => {
    const res = await ai.models.generateContent({
      model: FLASH_TXT,
      contents: `Generate 3 interactive grammar quiz questions for: ${topic}. Include question, options[], answer (index), and detailedAnalysis {logic, structure, collocations}. Output JSON array.`,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(res.text || '[]');
  });
};

export const generateReviewQuiz = async (notes: any[]) => {
  return aiCall(async (ai) => {
    const res = await ai.models.generateContent({
      model: FLASH_TXT,
      contents: `Based on these study notes: ${JSON.stringify(notes)}, generate a personalized review quiz. Output JSON array of {question, options:[], answer, explanation}.`,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(res.text || '[]');
  });
};

export const getExamTips = async (type: string) => {
  return aiCall(async (ai) => {
    const res = await ai.models.generateContent({
      model: FLASH_TXT,
      contents: `Provide 3 expert tips for the ${type} exam. Be concise and professional.`
    });
    return res.text || '';
  });
};
