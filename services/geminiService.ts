
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
    console.error(`[Secure Context Error]: ${sanitizedMsg}`);

    // 处理 403 权限问题，可能是 Search Grounding 未开启或模型不受限
    if (msg.includes('403') || msg.includes('permission denied')) {
       throw new Error('AUTH_FORBIDDEN_OR_TOOL_UNAVAILABLE');
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
 * 深度解析 Vision 内容 - 升级为 PRO 模型以确保 Search 稳定性
 */
export const analyzeVisionItem = async (topic: string, type: 'news' | 'song' | 'movie') => {
  return aiCall(async (ai) => {
    const prompt = `Perform a deep web search and pedagogical analysis for: "${topic}" (${type}). Generate a master-level English lesson in JSON format for B2 learners. Ensure the content is real, current, and educational.`;
    const response = await ai.models.generateContent({
      model: PRO_TXT,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        tools: [{ googleSearch: {} }],
        responseSchema: {
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
        }
      }
    });
    return JSON.parse(response.text || '{}');
  });
};

/**
 * 实时全球趋势发现 - 升级为 PRO 模型以确保 Search 稳定性
 */
export const generateVisionTrends = async () => {
  const vKey = 'vision_trends_v1';
  const cached = cache.get(vKey);
  if (cached) return cached;

  return aiCall(async (ai) => {
    const prompt = `Search the live web (2024-2025) and identify 3 trending items for News, 3 for Billboard/Global Songs, and 3 for Movies. Output BILINGUAL JSON. Focus on items with high educational value for English learners.`;
    const response = await ai.models.generateContent({
      model: PRO_TXT,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        tools: [{ googleSearch: {} }],
        responseSchema: {
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
        }
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
