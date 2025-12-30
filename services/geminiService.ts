
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
    // 自动重试逻辑 (处理 429 限流)
    if (msg.includes('429') && retries > 0) {
      await new Promise(r => setTimeout(r, 3000));
      return aiCall(fn, retries - 1);
    }
    throw error;
  }
}

/**
 * 结构化数据保护：确保返回的对象永远包含基础数组
 */
const safeParse = (jsonStr: string, fallback: any) => {
  try {
    // Remove potential markdown code block markers
    const cleaned = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();
    const data = JSON.parse(cleaned);
    return Array.isArray(fallback) ? (Array.isArray(data) ? data : fallback) : { ...fallback, ...data };
  } catch {
    return fallback;
  }
};

// Fix: Implement generateGlobalInsights with Google Search grounding
export const generateGlobalInsights = async (country: string) => {
  const fallback = {
    market: { salary: "N/A", pct: "0%", history: [] },
    demand: [],
    news: [],
    visa: [],
    sources: []
  };

  return aiCall(async (ai) => {
    try {
      const response = await ai.models.generateContent({
        model: PRO_TXT,
        contents: `Latest career insights for ${country} in 2024/2025. Include salary trends, high demand roles, news, and visa updates. Return JSON.`,
        config: { 
          responseMimeType: "application/json",
          tools: [{ googleSearch: {} }] 
        }
      });
      // Always extract search sources for grounding as per guidelines
      const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const parsed = safeParse(response.text, fallback);
      return { ...parsed, sources };
    } catch {
      const res = await ai.models.generateContent({
        model: FLASH_TXT,
        contents: `Simulate high-quality career insights for ${country} 2024. Return JSON matching: {market: {salary, pct, history:[]}, demand: [], news: [], visa: []}`,
        config: { responseMimeType: "application/json" }
      });
      return safeParse(res.text, fallback);
    }
  });
};

// Fix: Added missing learning plan generation
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

// Fix: Added missing review quiz generation based on user notes
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

// Fix: Added missing vocabulary generation
export const generateVocabulary = async (level: string) => {
  return aiCall(async (ai) => {
    const response = await ai.models.generateContent({
      model: FLASH_TXT,
      contents: `Generate 5 academic vocabulary words for ${level} level. Return JSON array of VocabularyWord objects (word, phonetic, translation, pos, example, exampleTranslation, exampleStructure: {sentenceType, analysis: {subject, verb, object, others}, explanation}, mnemonic, visualPrompt, forms: [], relatedWords: {synonym: []}).`,
      config: { responseMimeType: "application/json" }
    });
    return safeParse(response.text, []);
  });
};

// Fix: Added missing Text-to-Speech audio generation
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

// Fix: Added missing image generation for vocabulary visuals
export const generateImage = async (prompt: string) => {
  return aiCall(async (ai) => {
    const response = await ai.models.generateContent({
      model: IMAGE_GEN,
      contents: { parts: [{ text: `A clear, educational, high-quality visual representation of: ${prompt}. Minimalistic, white background.` }] },
      config: { imageConfig: { aspectRatio: "1:1" } }
    });
    
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  });
};

// Fix: Added missing writing analysis logic
export const analyzeWriting = async (text: string) => {
  return aiCall(async (ai) => {
    const response = await ai.models.generateContent({
      model: PRO_TXT,
      contents: `Analyze this English writing for IELTS standards: "${text}". Provide score (0-90), feedback, and specific corrections. Return JSON {score, feedback, corrections: [{original, suggested, reason}]}.`,
      config: { responseMimeType: "application/json" }
    });
    return safeParse(response.text, { score: 0, feedback: "Error analyzing text.", corrections: [] });
  });
};

// Fix: Added missing exam tips generation
export const getExamTips = async (type: string) => {
  return aiCall(async (ai) => {
    const response = await ai.models.generateContent({
      model: FLASH_TXT,
      contents: `Provide 5 practical, advanced tips for the ${type} exam. Focus on high-scoring strategies.`,
    });
    return response.text || "No tips available at the moment.";
  });
};

// Fix: Added missing grammar lesson generation
export const generateGrammarLesson = async (topic: string) => {
  return aiCall(async (ai) => {
    const response = await ai.models.generateContent({
      model: FLASH_TXT,
      contents: `Create a deep-dive grammar lesson for "${topic}". Include concept, intuitive analogy, structureBreakdown: [{sentence, sentenceType, analysis: {subject, verb, object, others}, explanation, collocationTip}], and 3 key rules. Return JSON.`,
      config: { responseMimeType: "application/json" }
    });
    return safeParse(response.text, { title: topic, concept: "", analogy: "", structureBreakdown: [], rules: [] });
  });
};

// Fix: Added missing grammar quiz generation
export const generateGrammarQuiz = async (topic: string) => {
  return aiCall(async (ai) => {
    const response = await ai.models.generateContent({
      model: FLASH_TXT,
      contents: `Create 3 challenging grammar quiz questions for "${topic}". Return JSON array of {question, options:[], correctAnswer: index, detailedAnalysis: {logic, structure, collocations}}.`,
      config: { responseMimeType: "application/json" }
    });
    return safeParse(response.text, []);
  });
};

// Fix: Added missing reading article generation
export const generateReadingArticle = async (category: string, progress: any) => {
  return aiCall(async (ai) => {
    const response = await ai.models.generateContent({
      model: FLASH_TXT,
      contents: `Generate a professional reading article about ${category} for someone at Level ${progress.currentLevel}. Include title, chineseTitle, content (approx 200 words), curriculumGoal, 3 keyWords: {word, meaning}, and 3 questions: {question, options, answer, explanation}. Return JSON.`,
      config: { responseMimeType: "application/json" }
    });
    return safeParse(response.text, { title: "Error", content: "", questions: [] });
  });
};

// Fix: Added missing mentor advice generation
export const generateMentorAdvice = async (module: string, userMsg?: string) => {
  return aiCall(async (ai) => {
    const prompt = userMsg 
      ? `As an AI English Mentor for the ${module} module, answer the student: "${userMsg}". Be encouraging and professional.`
      : `Provide a quick piece of advice and one actionable tip for a student currently learning in the ${module} module. Return JSON {advice, actionableTip}.`;
    
    const response = await ai.models.generateContent({
      model: FLASH_TXT,
      contents: prompt,
      config: userMsg ? {} : { responseMimeType: "application/json" }
    });
    
    if (userMsg) return { advice: response.text || "I'm here to help!", actionableTip: "" };
    return safeParse(response.text, { advice: "Keep going!", actionableTip: "Practice makes perfect." });
  });
};

// Fix: Added missing global vision trends generation
export const generateVisionTrends = async () => {
  return aiCall(async (ai) => {
    const response = await ai.models.generateContent({
      model: PRO_TXT,
      contents: `Scan global news, music charts, and film trends for today. Provide 3 trending items each for news (t_en, t_cn, s_en, s_cn, keywords: []), songs (name_en, name_cn, artist, lyrics_clip_en, lyrics_clip_cn), and movies (title_en, title_cn, accent, desc_en, desc_cn). Return JSON.`,
      config: { 
        responseMimeType: "application/json",
        tools: [{ googleSearch: {} }]
      }
    });
    return safeParse(response.text, { news: [], songs: [], movies: [] });
  });
};

// Fix: Added missing vision item analysis
export const analyzeVisionItem = async (topic: string, type: string) => {
  return aiCall(async (ai) => {
    const response = await ai.models.generateContent({
      model: PRO_TXT,
      contents: `Deeply analyze the following ${type}: "${topic}". Create a high-quality educational article_en and article_cn. Extract 5 vocab: {w, t, e}, 2 structures: {s, logic}, 3 collocations: {phrase, meaning, usage}, and 3 expressions: {exp, meaning, context}. Return JSON.`,
      config: { responseMimeType: "application/json" }
    });
    return safeParse(response.text, { article_en: "", article_cn: "", vocab: [], structures: [], collocations: [], expressions: [] });
  });
};
