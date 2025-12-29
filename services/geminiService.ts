
import { GoogleGenAI, Type, Modality } from "@google/genai";

export const generateVocabulary = async (topic: string = 'beginner') => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Generate 5 systematic English vocabulary words for a ${topic} level learner. 
    For each word, provide:
    - word, phonetic, pos, translation, example, level
    - roots (词根), affixes (词缀), etymology (语源), mnemonic (形象记忆), memoryTip (学习技巧)
    - phrases: ARRAY of {phrase, translation, example}
    - forms: ARRAY of {form, phonetic, pos, meaning, example, derivationReason (why it changes this way)}
    - relatedWords: {synonym: ARRAY of {word, phonetic, meaning, example}, antonym: ARRAY of {word, phonetic, meaning, example}}
    - visualPrompt: A cinematic, ultra-realistic description for a mnemonic aid photo. Include lighting, texture, and a clear focal point.
    Return strictly in JSON format.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            word: { type: Type.STRING },
            phonetic: { type: Type.STRING },
            pos: { type: Type.STRING },
            translation: { type: Type.STRING },
            example: { type: Type.STRING },
            level: { type: Type.STRING },
            roots: { type: Type.STRING },
            affixes: { type: Type.STRING },
            etymology: { type: Type.STRING },
            mnemonic: { type: Type.STRING },
            memoryTip: { type: Type.STRING },
            phrases: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  phrase: { type: Type.STRING },
                  translation: { type: Type.STRING },
                  example: { type: Type.STRING }
                }
              }
            },
            forms: { 
              type: Type.ARRAY, 
              items: {
                type: Type.OBJECT,
                properties: {
                  form: { type: Type.STRING },
                  phonetic: { type: Type.STRING },
                  pos: { type: Type.STRING },
                  meaning: { type: Type.STRING },
                  example: { type: Type.STRING },
                  derivationReason: { type: Type.STRING }
                }
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
                },
                antonym: { 
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
            visualPrompt: { type: Type.STRING }
          },
          required: ["word", "phonetic", "pos", "translation", "example", "level", "roots", "affixes", "etymology", "mnemonic", "memoryTip", "phrases", "forms", "relatedWords", "visualPrompt"]
        }
      }
    }
  });
  return JSON.parse(response.text || '[]');
};

export const generateGrammarLesson = async (topic: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `As an English teacher for Chinese students, explain the grammar topic "${topic}". 
    Use a very systematic approach. Include:
    - title: Simplified Chinese name
    - concept: Simple Chinese explanation
    - analogy: A creative analogy that a Chinese speaker can relate to
    - rules: ARRAY of {title, content (Chinese)}
    - examples: ARRAY of {english, chinese, note}
    Return JSON.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          concept: { type: Type.STRING },
          analogy: { type: Type.STRING },
          rules: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                content: { type: Type.STRING }
              }
            }
          },
          examples: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                english: { type: Type.STRING },
                chinese: { type: Type.STRING },
                note: { type: Type.STRING }
              }
            }
          }
        }
      }
    }
  });
  return JSON.parse(response.text || '{}');
};

export const generateGrammarQuiz = async (topic: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Create 3 interactive grammar quiz questions for the topic: ${topic}. 
    Each should have a question, 4 options, and a detailed Chinese explanation. Return JSON.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            options: { type: Type.ARRAY, items: { type: Type.STRING } },
            correctAnswer: { type: Type.INTEGER },
            explanation: { type: Type.STRING }
          }
        }
      }
    }
  });
  return JSON.parse(response.text || '[]');
};

export const generateImage = async (prompt: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          text: `Professional high-quality realistic photography, 8k resolution, cinematic lighting, sharp focus, educational mnemonic context for: ${prompt}. Minimalistic studio setting, deep depth of field.`,
        },
      ],
    },
    config: {
      imageConfig: { aspectRatio: "1:1" }
    },
  });
  
  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return null;
};

export const getSpeechAudio = async (text: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' },
        },
      },
    },
  });
  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
};

export const generateLearningPlan = async (userGoal: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Create a systematic English learning roadmap for: ${userGoal}. Split into 5 stages. Return JSON.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            stage: { type: Type.STRING },
            goal: { type: Type.STRING },
            focus: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      }
    }
  });
  return JSON.parse(response.text || '[]');
};

export const analyzeWriting = async (text: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Analyze this English writing and provide score, feedback, and corrections: ${text}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.NUMBER },
          feedback: { type: Type.STRING },
          corrections: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                original: { type: Type.STRING },
                suggested: { type: Type.STRING },
                reason: { type: Type.STRING }
              }
            }
          }
        }
      }
    }
  });
  return JSON.parse(response.text || '{"score": 0, "feedback": "", "corrections": []}');
};

export const getExamTips = async (examType: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Provide 5 pro tips for the ${examType} exam.`,
  });
  return response.text || '';
};
