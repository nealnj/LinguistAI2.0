
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { logger } from "./logger";
import { LearningModule } from "../types";

const FLASH_TXT = 'gemini-3-flash-preview'; 
const PRO_TXT = 'gemini-3-pro-preview';
const IMAGE_GEN = 'gemini-2.5-flash-image';
const TTS_MODEL = 'gemini-2.5-flash-preview-tts';

async function aiCall<T>(fn: (ai: GoogleGenAI) => Promise<T>, retries = 3): Promise<T> {
  const apiKey = process.env.API_KEY;
  const ai = new GoogleGenAI({ apiKey });
  try {
    return await fn(ai);
  } catch (error: any) {
    const msg = String(error.message || error).toLowerCase();
    // 针对 500、429、XHR 错误以及 RPC 超时（code 6）进行指数退避重试
    const shouldRetry = msg.includes('429') || 
                        msg.includes('500') || 
                        msg.includes('xhr') || 
                        msg.includes('timeout') || 
                        msg.includes('deadline') ||
                        msg.includes('code: 6');

    if (shouldRetry && retries > 0) {
      const waitTime = (4 - retries) * 2000; // 2s, 4s, 6s
      await new Promise(r => setTimeout(r, waitTime));
      return aiCall(fn, retries - 1);
    }
    throw error;
  }
}

const safeParse = (jsonStr: string, fallback: any) => {
  try {
    const cleaned = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();
    const data = JSON.parse(cleaned);
    return data || fallback;
  } catch {
    return fallback;
  }
};

export const generateGlobalInsights = async (country: string) => {
  return aiCall(async (ai) => {
    const response = await ai.models.generateContent({
      model: PRO_TXT,
      contents: `ACT AS A SENIOR GLOBAL TALENT STRATEGIST. 
      Country: ${country}. 
      Task: Provide market data AND 4 REAL job openings (active in 2024-2025) for expats or English speakers.
      Focus: Accuracy and real-time validity. Use googleSearch for company names and titles.
      Format: JSON. Bilingual (English & Chinese) content for all text fields.`,
      config: { 
        responseMimeType: "application/json", 
        tools: [{ googleSearch: {} }],
        thinkingConfig: { thinkingBudget: 0 }, // 禁用思考以降低搜索任务的总体耗时
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            market: { 
              type: Type.OBJECT,
              properties: { 
                salary_cn: { type: Type.STRING }, 
                salary_en: { type: Type.STRING }, 
                trend_2yr_desc: { type: Type.STRING } 
              },
              required: ['salary_cn', 'salary_en', 'trend_2yr_desc']
            },
            jobs: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  company: { type: Type.STRING }, companyCN: { type: Type.STRING },
                  title: { type: Type.STRING }, titleCN: { type: Type.STRING },
                  location: { type: Type.STRING }, 
                  salary: { type: Type.STRING },
                  requirements: { type: Type.ARRAY, items: { type: Type.STRING } },
                  desc: { type: Type.STRING }, descCN: { type: Type.STRING },
                  url: { type: Type.STRING }
                },
                required: ['id', 'company', 'title', 'desc']
              }
            },
            visa_info: { type: Type.STRING },
            pro_tips: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ['market', 'jobs', 'visa_info']
        }
      }
    });
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const data = safeParse(response.text, { market: {}, jobs: [], visa_info: "", pro_tips: [] });
    return { ...data, sources };
  });
};

export const chatWithCareerAdvisor = async (country: string, message: string, history: any[]) => {
  return aiCall(async (ai) => {
    const formattedHistory = history.map(h => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.text}`).join('\n');
    const response = await ai.models.generateContent({
      model: PRO_TXT,
      contents: `ACT AS AN INTERNATIONAL CAREER CONSULTANT specializing in ${country}. 
      Context: User is exploring global careers.
      Current Query: ${message}
      Previous Dialogue: ${formattedHistory}
      Capability: You can access real-time data via googleSearch for visa policies, company culture, or cost of living.
      Requirement: Be specific, professional, and provide bilingual responses.`,
      config: { 
        tools: [{ googleSearch: {} }],
        thinkingConfig: { thinkingBudget: 0 }
      }
    });
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    return { text: response.text || "", sources };
  });
};

export const generatePersonalizedResume = async (progress: any, targetMarket: string, specialization: string) => {
  return aiCall(async (ai) => {
    const response = await ai.models.generateContent({
      model: FLASH_TXT,
      contents: `ACT AS A PROFESSIONAL RESUME WRITER. 
      Generate a professional English resume (CV) based on the user's learning progress and current specialization.
      User Progress: ${JSON.stringify(progress)}.
      Target Market: ${targetMarket}.
      Specialization: ${specialization}.
      The resume should highlight language proficiency levels and academic ranks achieved in the LinguistAI platform.
      Format: Clean, professional text CV.`,
      config: { thinkingConfig: { thinkingBudget: 0 } }
    });
    return response.text || "";
  });
};

export const generateCoverLetter = async (job: any, progress: any) => {
  return aiCall(async (ai) => {
    const response = await ai.models.generateContent({
      model: FLASH_TXT,
      contents: `ACT AS A PROFESSIONAL COPYWRITER. Generate a high-converting English Cover Letter.
      Job: ${JSON.stringify(job)}. 
      Candidate Background (LinguistAI Progress): ${JSON.stringify(progress)}.
      Structure: Strong hook, evidence of skills based on learning level, and professional closing.`,
      config: { thinkingConfig: { thinkingBudget: 0 } }
    });
    return response.text || "";
  });
};

export const generateVocabularySyllabus = async (specialization: string) => {
  return aiCall(async (ai) => {
    const response = await ai.models.generateContent({
      model: FLASH_TXT,
      contents: `Generate a 6-unit vocabulary syllabus for: ${specialization}. Bilingual.`,
      config: {
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 0 },
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              title: { type: Type.STRING },
              titleCN: { type: Type.STRING },
              description: { type: Type.STRING },
              descriptionCN: { type: Type.STRING },
              theme: { type: Type.STRING }
            },
            required: ['id', 'title', 'titleCN', 'description', 'descriptionCN', 'theme']
          }
        }
      }
    });
    return safeParse(response.text, []);
  });
};

export const generateVocabulary = async (unitTheme: string, specialization: string = 'General English') => {
  return aiCall(async (ai) => {
    const response = await ai.models.generateContent({
      model: FLASH_TXT,
      contents: `Generate 5 vocabulary words for ${unitTheme}. Include phonetics, translations, scenes, and visual prompts for AI generation.`,
      config: { 
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 0 },
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              word: { type: Type.STRING },
              phonetic: { type: Type.STRING },
              translation: { type: Type.STRING },
              pos: { type: Type.STRING },
              frequency: { type: Type.STRING },
              coreObject: { type: Type.STRING },
              coreObjectCN: { type: Type.STRING },
              sceneTitle: { type: Type.STRING },
              sceneTitleCN: { type: Type.STRING },
              sceneDescription: { type: Type.STRING },
              sceneDescriptionCN: { type: Type.STRING },
              example: { type: Type.STRING },
              exampleTranslation: { type: Type.STRING },
              mnemonic: { type: Type.STRING },
              mnemonicCN: { type: Type.STRING },
              roots: { type: Type.STRING },
              rootsCN: { type: Type.STRING },
              visualPrompt: { type: Type.STRING },
              associations: {
                type: Type.OBJECT,
                properties: {
                  synonyms: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { word: { type: Type.STRING }, translation: { type: Type.STRING } } } },
                  antonyms: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { word: { type: Type.STRING }, translation: { type: Type.STRING } } } },
                  derivatives: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { word: { type: Type.STRING }, pos: { type: Type.STRING }, meaning: { type: Type.STRING } } } }
                }
              }
            }
          }
        }
      }
    });
    return safeParse(response.text, []);
  });
};

export const generateImage = async (prompt: string) => {
  return aiCall(async (ai) => {
    const response = await ai.models.generateContent({
      model: IMAGE_GEN,
      contents: { parts: [{ text: `High quality, clean background art: ${prompt}` }] }
    });
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
    return null;
  });
};

export const getSpeechAudio = async (text: string) => {
  return aiCall(async (ai) => {
    const response = await ai.models.generateContent({
      model: TTS_MODEL,
      contents: [{ parts: [{ text: `Natural speed: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } }
      }
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
  });
};

export const generateGrammarLesson = async (topic: string) => {
  return aiCall(async (ai) => {
    const response = await ai.models.generateContent({
      model: FLASH_TXT,
      contents: `Create grammar lesson for ${topic}. JSON with title, concept, analogy, structureBreakdown, rules.`,
      config: { 
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 0 }
      }
    });
    return safeParse(response.text, { title: topic, concept: "", analogy: "", structureBreakdown: [], rules: [] });
  });
};

export const generateLearningPlan = async (goal: string) => {
  return aiCall(async (ai) => {
    const response = await ai.models.generateContent({
      model: FLASH_TXT,
      contents: `Create a professional English learning roadmap for the goal: ${goal}. Return an array of stages.`,
      config: { 
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 0 },
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              stage: { type: Type.STRING, description: "Name of the learning stage" },
              focus: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of key focus areas" }
            },
            required: ['stage', 'focus']
          }
        }
      }
    });
    return safeParse(response.text, []);
  });
};

export const generateReadingArticle = async (category: string, progress: any) => {
  return aiCall(async (ai) => {
    const response = await ai.models.generateContent({
      model: FLASH_TXT,
      contents: `Bilingual reading for ${category}, level ${progress.currentLevel}. JSON format.`,
      config: { 
        responseMimeType: "application/json", 
        tools: [{ googleSearch: {} }],
        thinkingConfig: { thinkingBudget: 0 }
      }
    });
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    return { ...safeParse(response.text, {}), sources };
  });
};

export const analyzeWriting = async (text: string) => {
  return aiCall(async (ai) => {
    const response = await ai.models.generateContent({
      model: PRO_TXT,
      contents: `Analyze this IELTS writing task and provide a score (0-90 where 90 is Band 9.0), feedback, and specific corrections.
      Text to analyze: ${text}
      Format: JSON with score, feedback, corrections.`,
      config: { 
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 0 }
      }
    });
    return safeParse(response.text, { score: 0, feedback: "", corrections: [] });
  });
};

export const generateMentorAdvice = async (module: string, userMsg?: string) => {
  return aiCall(async (ai) => {
    const prompt = userMsg ? userMsg : `Give expert advice for module: ${module}.`;
    const response = await ai.models.generateContent({ 
      model: FLASH_TXT, 
      contents: prompt,
      config: { thinkingConfig: { thinkingBudget: 0 } }
    });
    return { advice: response.text || "", actionableTip: "" };
  });
};

export const generateReviewQuiz = async (notes: any[]) => {
  return aiCall(async (ai) => {
    const response = await ai.models.generateContent({
      model: FLASH_TXT,
      contents: `Quiz based on: ${JSON.stringify(notes)}.`,
      config: { 
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 0 }
      }
    });
    return safeParse(response.text, []);
  });
};

export const getExamTips = async (type: string) => {
  return aiCall(async (ai) => {
    const response = await ai.models.generateContent({ 
      model: FLASH_TXT, 
      contents: `Strategies for ${type} exam.`,
      config: { thinkingConfig: { thinkingBudget: 0 } }
    });
    return response.text || "";
  });
};

export const analyzeVisionItem = async (topic: string, type: string) => {
  return aiCall(async (ai) => {
    const response = await ai.models.generateContent({
      model: FLASH_TXT,
      contents: `Deep analysis of ${topic}. Bilingual.`,
      config: { 
        responseMimeType: "application/json", 
        tools: [{ googleSearch: {} }],
        thinkingConfig: { thinkingBudget: 0 }
      }
    });
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    return { ...safeParse(response.text, {}), sources };
  });
};

export const generateVisionTrends = async () => {
  return aiCall(async (ai) => {
    const response = await ai.models.generateContent({
      model: FLASH_TXT,
      contents: `Real-time news and music trends. JSON format.`,
      config: { 
        responseMimeType: "application/json", 
        tools: [{ googleSearch: {} }],
        thinkingConfig: { thinkingBudget: 0 }
      }
    });
    return safeParse(response.text, { news: [], songs: [], movies: [] });
  });
};

export const generateGrammarQuiz = async (topic: string) => {
  return aiCall(async (ai) => {
    const response = await ai.models.generateContent({
      model: FLASH_TXT,
      contents: `3 quiz for ${topic}. JSON format.`,
      config: { 
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 0 }
      }
    });
    return safeParse(response.text, []);
  });
};

export const generateHealingStrategy = async (feedbacks: any[]) => {
  return aiCall(async (ai) => {
    const response = await ai.models.generateContent({
      model: PRO_TXT,
      contents: `Fix system issues based on: ${JSON.stringify(feedbacks)}.`,
      config: { 
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 0 }
      }
    });
    return safeParse(response.text, { rules: [] });
  });
};
