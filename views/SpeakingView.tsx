
import React, { useState, useRef } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { Mic, MicOff, Info, BarChart3, RotateCcw } from 'lucide-react';

// Decoding logic for raw PCM streams as per Gemini Live guidelines
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const SpeakingView: React.FC = () => {
  const [messages, setMessages] = useState<{ role: 'ai' | 'user'; text: string }[]>([
    { role: 'ai', text: 'Hello! I am your IELTS Speaking examiner. Today we will practice Part 1. Can you tell me about your hometown?' }
  ]);
  const [sessionActive, setSessionActive] = useState(false);
  const nextStartTimeRef = useRef(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sessionPromiseRef = useRef<any>(null);

  const startPractice = async () => {
    if (sessionActive) return;
    
    // Always use process.env.API_KEY directly and create fresh instance
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    audioContextRef.current = outputAudioContext;

    const sessionPromise = ai.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-09-2025',
      callbacks: {
        onopen: () => {
          setSessionActive(true);
        },
        onmessage: async (message: any) => {
          const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
          if (base64Audio) {
            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContext.currentTime);
            const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContext, 24000, 1);
            const source = outputAudioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(outputAudioContext.destination);
            source.start(nextStartTimeRef.current);
            nextStartTimeRef.current += audioBuffer.duration;
          }

          if (message.serverContent?.outputTranscription) {
             const text = message.serverContent.outputTranscription.text;
             setMessages(prev => [...prev, { role: 'ai', text }]);
          }
        },
        onerror: (e) => console.error("Session error:", e),
        onclose: () => setSessionActive(false),
      },
      config: {
        responseModalities: [Modality.AUDIO],
        outputAudioTranscription: {},
        systemInstruction: "You are a professional IELTS Speaking Examiner. Conduct a Part 1 interview. Speak clearly, provide occasional feedback on grammar and pronunciation when the user pauses, and keep the tone formal but encouraging."
      }
    });

    sessionPromiseRef.current = sessionPromise;
  };

  const stopPractice = () => {
    setSessionActive(false);
  };

  return (
    <div className="max-w-4xl mx-auto h-full flex flex-col gap-6">
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 rounded-3xl p-8 text-white shadow-xl flex items-center justify-between">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">1对1 雅思口语陪练</h2>
          <p className="text-indigo-100 text-sm">当前模式: Part 1 - 基础问答</p>
        </div>
        <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-md flex items-center gap-4">
           <div className="flex flex-col items-end">
             <span className="text-xs uppercase font-bold text-indigo-200">Session Time</span>
             <span className="font-mono text-xl">04:25</span>
           </div>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
        {/* Chat History */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'ai' ? 'justify-start' : 'justify-end'}`}>
              <div className={`max-w-[80%] p-4 rounded-2xl ${
                msg.role === 'ai' 
                  ? 'bg-slate-50 text-slate-700 rounded-tl-none border border-slate-100' 
                  : 'bg-indigo-600 text-white rounded-tr-none'
              }`}>
                <p className="text-sm leading-relaxed">{msg.text}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex flex-col items-center gap-4">
          <div className="flex items-center gap-6">
            <button className="p-4 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-slate-600 transition-colors">
              <RotateCcw size={24} />
            </button>
            <button 
              onClick={sessionActive ? stopPractice : startPractice}
              className={`p-8 rounded-full shadow-2xl transition-all active:scale-95 ${
                sessionActive 
                  ? 'bg-rose-500 text-white animate-pulse' 
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              {sessionActive ? <MicOff size={32} /> : <Mic size={32} />}
            </button>
            <button className="p-4 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-slate-600 transition-colors">
              <BarChart3 size={24} />
            </button>
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            {sessionActive ? '正在倾听您的回答...' : '点击开始口语对话练习'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center gap-3">
          <div className="bg-emerald-500 text-white p-2 rounded-lg"><Info size={16} /></div>
          <p className="text-xs text-emerald-800 font-medium">Tip: Try to expand your answers with 'because' or 'for example'.</p>
        </div>
        <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex items-center gap-3">
          <div className="bg-amber-500 text-white p-2 rounded-lg"><Info size={16} /></div>
          <p className="text-xs text-amber-800 font-medium">Vocabulary: Use 'vibrant' instead of 'busy' for your city.</p>
        </div>
        <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl flex items-center gap-3">
          <div className="bg-indigo-500 text-white p-2 rounded-lg"><Info size={16} /></div>
          <p className="text-xs text-indigo-800 font-medium">Score: Current fluency is matching Band 7.0.</p>
        </div>
      </div>
    </div>
  );
};

export default SpeakingView;
