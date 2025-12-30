
import { GoogleGenAI, Type, Modality } from "@google/genai";

// 模型常量
const FLASH_TXT = 'gemini-3-flash-preview'; 
const PRO_TXT = 'gemini-3-pro-preview';
const FLASH_IMG = 'gemini-2.5-flash-image';
const FLASH_TTS = 'gemini-2.5-flash-preview-tts';

/**
 * 核心安全调用封装 (Secure API Wrapper)
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
    
    // 如果是工具不可用（权限问题），直接抛出特定错误供上层捕获降级
    if (msg.includes('403') || msg.includes('permission denied') || msg.includes('TOOL_UNAVAILABLE')) {
       throw new Error('TOOL_UNAVAILABLE');
    }

    if (msg.includes('Requested entity was not found') || msg.includes('API_KEY_INVALID')) {
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
 * 深度解析 Vision 内容 - 增强可用性
 */
export const analyzeVisionItem = async (topic: string, type: 'news' | 'song' | 'movie') => {
  const prompt = `Perform a deep pedagogical analysis for: "${topic}" (${type}). Generate a master-level English lesson in JSON format for B2 learners. Include real-world context, vocab, and structures.`;
  const schema = {
    type: Type.OBJECT,
    properties: {
      article_en: { type: Type.STRING, description: "Professional educational article about the topic (250+ words)" },
      article_cn: { type: Type.STRING },
      vocab: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            w: { type: Type.STRING },
            t: { type: Type.STRING },
            e: { type: Type.STRING }
          }
        }
      },
      collocations: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            phrase: { type: Type.STRING },
            meaning: { type: Type.STRING },
            usage: { type: Type.STRING }
          }
        }
      },
      expressions: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            exp: { type: Type.STRING },
            meaning: { type: Type.STRING },
            context: { type: Type.STRING }
          }
        }
      },
      structures: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            s: { type: Type.STRING },
            logic: { type: Type.STRING }
          }
        }
      }
    },
    required: ["article_en", "article_cn", "vocab", "collocations", "expressions", "structures"]
  };

  return aiCall(async (ai) => {
    try {
      // 尝试使用 Google Search 工具
      const response = await ai.models.generateContent({
        model: PRO_TXT,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          tools: [{ googleSearch: {} }],
          responseSchema: schema
        }
      });
      return JSON.parse(response.text || '{}');
    } catch (e) {
      console.warn("DeepDive Search Failed, falling back to internal knowledge.");
      // 降级策略：移除工具，使用模型自身知识
      const response = await ai.models.generateContent({
        model: FLASH_TXT,
        contents: prompt + " (Search currently unavailable, use your latest internal data to simulate accuracy)",
        config: {
          responseMimeType: "application/json",
          responseSchema: schema
        }
      });
      return JSON.parse(response.text || '{}');
    }
  });
};

/**
 * 实时全球趋势发现 - 彻底解决不可用问题
 */
export const generateVisionTrends = async () => {
  const vKey = 'vision_trends_v1';
  const cached = cache.get(vKey);
  if (cached) return cached;

  const prompt = `Identify 3 trending items for News, 3 for Global Songs, and 3 for Movies. Output BILINGUAL JSON. Focus on items with high educational value for English learners. Be specific to 2024-2025 context.`;
  const schema = {
    type: Type.OBJECT,
    properties: {
      news: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            t_en: { type: Type.STRING },
            t_cn: { type: Type.STRING },
            s_en: { type: Type.STRING },
            s_cn: { type: Type.STRING },
            keywords: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      },
      songs: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name_en: { type: Type.STRING },
            name_cn: { type: Type.STRING },
            artist: { type: Type.STRING },
            lyrics_clip_en: { type: Type.STRING },
            lyrics_clip_cn: { type: Type.STRING }
          }
        }
      },
      movies: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title_en: { type: Type.STRING },
            title_cn: { type: Type.STRING },
            desc_en: { type: Type.STRING },
            desc_cn: { type: Type.STRING },
            accent: { type: Type.STRING }
          }
        }
      }
    },
    required: ["news", "songs", "movies"]
  };

  return aiCall(async (ai) => {
    try {
      // 1. 优先尝试高精度搜索
      const response = await ai.models.generateContent({
        model: PRO_TXT,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          tools: [{ googleSearch: {} }],
          responseSchema: schema
        }
      });
      const result = JSON.parse(response.text || '{}');
      cache.set(vKey, result, 6);
      return result;
    } catch (e) {
      console.warn("Vision Trends Search Failed, falling back to simulation.");
      // 2. 核心补救措施：强制降级调用
      const response = await ai.models.generateContent({
        model: FLASH_TXT,
        contents: prompt + " (IMPORTANT: Search tool unavailable. Simulate the 2024-2025 trending landscape accurately from your latest knowledge)",
        config: {
          responseMimeType: "application/json",
          responseSchema: schema
        }
      });
      const result = JSON.parse(response.text || '{}');
      cache.set(vKey, result, 6);
      return result;
    }
  });
};

/**
 * 全球职业洞察 - 增加降级逻辑与结构保护
 */
export const generateGlobalInsights = async (country: string) => {
  const cKey = `ins_${country}_v2`;
  const cached = cache.get(cKey);
  if (cached) return cached;

  const prompt = `Provide 2024-2025 career and job market insights for ${country}. Output BILINGUAL JSON including market (salary, pct, history[{m_en, m_cn, v}]), demand([{cat_en, cat_cn, lv, rate_cn}]), news([{t_en, t_cn, source_en, source_cn, d, url}]), visa([{type_en, type_cn, change_en, change_cn, date}]), and sources([{t_en, t_cn, u}]). Ensure all arrays are populated even if estimated.`;
  
  return aiCall(async (ai) => {
    try {
      const response = await ai.models.generateContent({
        model: PRO_TXT,
        contents: prompt,
        config: { 
          responseMimeType: "application/json",
          tools: [{ googleSearch: {} }] 
        }
      });
      const result = JSON.parse(response.text || '{}');
      // 基础数据结构保护
      if (result && result.market) {
        cache.set(cKey, result); 
        return result;
      }
      throw new Error("EMPTY_DATA");
    } catch (e) {
      console.warn("Global Career Search Failed, falling back.");
      const response = await ai.models.generateContent({
        model: FLASH_TXT,
        contents: prompt + " (Note: Search tool unavailable. Provide accurate synthetic data based on current knowledge as of late 2024. Return FULL JSON structure.)",
        config: { responseMimeType: "application/json" }
      });
      const result = JSON.parse(response.text || '{}');
      cache.set(cKey, result); 
      return result;
    }
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
