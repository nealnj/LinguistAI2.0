
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

/**
 * 安全解析 AI 返回的 JSON，并确保数组字段不为 null
 */
const safeParse = (jsonStr: string, fallback: any) => {
  try {
    const cleaned = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();
    const data = JSON.parse(cleaned);
    
    if (data && typeof data === 'object') {
      // 如果 fallback 是数组，确保 data 也是数组
      if (Array.isArray(fallback) && !Array.isArray(data)) return fallback;
      
      // 深度补全：如果 fallback 是对象，确保 key 存在且类型正确
      if (!Array.isArray(fallback) && typeof fallback === 'object') {
        Object.keys(fallback).forEach(key => {
          if (Array.isArray(fallback[key]) && !Array.isArray(data[key])) {
            data[key] = []; 
          }
        });
      }
    }
    return data;
  } catch {
    return fallback;
  }
};

/**
 * v1.0 词汇生成引擎：强制包含音标与形态学数据
 */
export const generateVocabulary = async (level: string) => {
  return aiCall(async (ai) => {
    const response = await ai.models.generateContent({
      model: FLASH_TXT,
      contents: `ACT AS AN ACADEMIC LINGUIST. Generate 5 core academic words for ${level}. 
      CRITICAL: You MUST provide accurate IPA phonetics with slashes, detailed morphological forms, and root analysis.`,
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
              pos: { type: Type.STRING },
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
            required: ['word', 'phonetic', 'translation', 'pos', 'example', 'exampleStructure', 'mnemonic', 'forms', 'relatedWords', 'roots', 'affixes']
          }
        }
      }
    });
    return safeParse(response.text, []);
  });
};

/**
 * v1.0 语法教学引擎：深度结构化解构
 */
export const generateGrammarLesson = async (topic: string) => {
  return aiCall(async (ai) => {
    const response = await ai.models.generateContent({
      model: FLASH_TXT,
      contents: `Create a professional, logic-driven grammar lesson for: "${topic}".`,
      config: { 
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            concept: { type: Type.STRING },
            analogy: { type: Type.STRING },
            structureBreakdown: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  sentence: { type: Type.STRING },
                  sentenceType: { type: Type.STRING },
                  analysis: {
                    type: Type.OBJECT,
                    properties: {
                      subject: { type: Type.STRING },
                      verb: { type: Type.STRING },
                      object: { type: Type.STRING },
                      others: { type: Type.STRING }
                    }
                  },
                  explanation: { type: Type.STRING },
                  collocationTip: { type: Type.STRING }
                },
                required: ['sentence', 'sentenceType', 'analysis', 'explanation']
              }
            },
            rules: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  content: { type: Type.STRING }
                },
                required: ['title', 'content']
              }
            }
          },
          required: ['title', 'concept', 'analogy', 'structureBreakdown', 'rules']
        }
      }
    });
    return safeParse(response.text, { title: topic, concept: "", analogy: "", structureBreakdown: [], rules: [] });
  });
};

export const generateGrammarQuiz = async (topic: string) => {
  return aiCall(async (ai) => {
    const response = await ai.models.generateContent({
      model: FLASH_TXT,
      contents: `Generate 3 logical grammar quiz questions for "${topic}".`,
      config: { 
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              correctAnswer: { type: Type.NUMBER },
              detailedAnalysis: {
                type: Type.OBJECT,
                properties: {
                  logic: { type: Type.STRING },
                  structure: { type: Type.STRING },
                  collocations: { type: Type.STRING }
                },
                required: ['logic', 'structure', 'collocations']
              }
            },
            required: ['question', 'options', 'correctAnswer', 'detailedAnalysis']
          }
        }
      }
    });
    return safeParse(response.text, []);
  });
};

export const generateGlobalInsights = async (country: string) => {
  const fallback = { market: {}, regions: [], demand: [], news: [], visa: [], evolution: [], sources: [] };
  return aiCall(async (ai) => {
    const response = await ai.models.generateContent({
      model: FLASH_TXT,
      contents: `ACT AS AN ADVANCED CAREER DATA ANALYST. Analyze TODAY'S market for "${country}".`,
      config: { 
        responseMimeType: "application/json",
        tools: [{ googleSearch: {} }] 
      }
    });
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    return { ...safeParse(response.text, fallback), sources };
  });
};

export const generateVisionTrends = async () => {
  return aiCall(async (ai) => {
    const response = await ai.models.generateContent({
      model: FLASH_TXT,
      contents: `Get real-time global news, music, movie trends (2024-2025).`,
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

export const analyzeWriting = async (text: string) => {
  return aiCall(async (ai) => {
    const response = await ai.models.generateContent({
      model: FLASH_TXT,
      contents: `Analyze writing standard against IELTS. JSON {score, feedback, corrections: [{original, suggested, reason}]}`,
      config: { responseMimeType: "application/json" }
    });
    return safeParse(response.text, { score: 0, feedback: "", corrections: [] });
  });
};

export const generateLearningPlan = async (goal: string) => {
  return aiCall(async (ai) => {
    const response = await ai.models.generateContent({
      model: FLASH_TXT,
      contents: `Strategic learning roadmap for: ${goal}. JSON list of steps.`,
      config: { responseMimeType: "application/json" }
    });
    return safeParse(response.text, []);
  });
};

export const generateMentorAdvice = async (module: string, userMsg?: string) => {
  return aiCall(async (ai) => {
    const prompt = userMsg ? `User asks: ${userMsg}` : `Expert advice for module: ${module}.`;
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
      contents: `Quiz based on these notes: ${JSON.stringify(notes)}. JSON.`,
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

export const generateReadingArticle = async (category: string, progress: any) => {
  return aiCall(async (ai) => {
    const response = await ai.models.generateContent({
      model: FLASH_TXT,
      contents: `Latest news article in ${category} for Level ${progress.currentLevel}. Bilingual.`,
      config: { 
        responseMimeType: "application/json",
        tools: [{ googleSearch: {} }]
      }
    });
    return safeParse(response.text, { title: "", chineseTitle: "", content: "", keyWords: [], questions: [] });
  });
};

export const analyzeVisionItem = async (topic: string, type: string) => {
  return aiCall(async (ai) => {
    const response = await ai.models.generateContent({
      model: FLASH_TXT,
      contents: `Deep analysis of ${type}: "${topic}". JSON {article_en, article_cn, vocab, structures}`,
      config: { 
        responseMimeType: "application/json",
        tools: [{ googleSearch: {} }]
      }
    });
    return safeParse(response.text, { article_en: "", article_cn: "", vocab: [], structures: [] });
  });
};

export const generatePersonalizedResume = async (progress: any, country: string, specialization: string) => {
  return aiCall(async (ai) => {
    const response = await ai.models.generateContent({
      model: PRO_TXT,
      contents: `ACT AS AN INTERNATIONAL CAREER CONSULTANT. Generate a professional English resume for: ${specialization}, Target: ${country}. Use learning data: ${JSON.stringify(progress)}`,
    });
    return response.text || "";
  });
};
