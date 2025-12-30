
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';
import { getSpeechAudio } from '../services/geminiService';
import { 
  Mic, 
  MicOff, 
  Info, 
  BarChart3, 
  RotateCcw, 
  Play, 
  Headphones, 
  Trophy, 
  Zap, 
  Volume2, 
  CheckCircle2, 
  ChevronRight, 
  Activity,
  MessageSquare,
  Sparkles,
  Award,
  AlertTriangle,
  Clock
} from 'lucide-react';

/**
 * Manually implement base64 encoding for raw bytes as per @google/genai guidelines.
 * This avoids potential stack size issues with String.fromCharCode(...bytes).
 */
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

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

const Star: React.FC<{ size: number, className?: string }> = ({ size, className }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const SHADOWING_SENTENCES = [
  { text: "The rapid advancement of artificial intelligence is reshaping the global job market.", level: "Professional", category: "Tech" },
  { text: "Sustainable development requires a balance between economic growth and environmental protection.", level: "Academic", category: "Environment" },
  { text: "Innovation is not just about new ideas, but about executing them successfully.", level: "Business", category: "Strategy" },
  { text: "In my opinion, the most significant benefit of urban living is the accessibility to cultural events.", level: "IELTS", category: "Hometown" }
];

const SpeakingView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'chat' | 'shadowing'>('chat');
  const [messages, setMessages] = useState<{ role: 'ai' | 'user'; text: string }[]>([
    { role: 'ai', text: 'Ready for a simulation? Choose Mock Interview or Shadowing to start.' }
  ]);
  const [sessionActive, setSessionActive] = useState(false);
  const [isPlaying, setIsPlaying] = useState<string | null>(null);
  const [currentShadowIdx, setCurrentShadowIdx] = useState(0);
  const [shadowScore, setShadowScore] = useState<number | null>(null);
  const [liveTranscription, setLiveTranscription] = useState('');
  const [sessionTimer, setSessionTimer] = useState(0);

  const nextStartTimeRef = useRef(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const activeSessionRef = useRef<any>(null);
  const inputNodeRef = useRef<ScriptProcessorNode | null>(null);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      stopPractice();
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  const playReference = async (text: string) => {
    if (isPlaying === text) return;
    setIsPlaying(text);
    try {
      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      const ctx = audioContextRef.current;
      const base64Audio = await getSpeechAudio(text);
      if (base64Audio) {
        const buffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.onended = () => setIsPlaying(null);
        source.start();
      } else { setIsPlaying(null); }
    } catch (e) {
      setIsPlaying(null);
    }
  };

  const startPractice = async () => {
    if (sessionActive) return;
    
    setLiveTranscription('');
    setSessionTimer(0);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    audioContextRef.current = outputAudioContext;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            setSessionActive(true);
            // 启动成本倒计时
            timerRef.current = setInterval(() => setSessionTimer(t => t + 1), 1000);
            
            const source = inputAudioContext.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
            inputNodeRef.current = scriptProcessor;
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) int16[i] = inputData[i] * 32768;
              const pcmData = new Uint8Array(int16.buffer);
              // CRITICAL: Use sessionPromise to ensure connection is resolved before sending data.
              sessionPromise.then(session => {
                session.sendRealtimeInput({ media: { data: encode(pcmData), mimeType: 'audio/pcm;rate=16000' } });
              });
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContext.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
              // Exact scheduling to avoid gaps in audio playback.
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContext.currentTime);
              const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContext, 24000, 1);
              const source = outputAudioContext.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outputAudioContext.destination);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
            }
            if (message.serverContent?.outputTranscription) {
              setLiveTranscription(prev => prev + message.serverContent.outputTranscription.text);
            }
            if (message.serverContent?.turnComplete) {
              if (activeTab === 'chat') {
                setMessages(prev => [...prev, { role: 'ai', text: liveTranscription }]);
                setLiveTranscription('');
              }
            }
          },
          onclose: () => {
             setSessionActive(false);
             clearInterval(timerRef.current);
          },
          onerror: () => setSessionActive(false)
        },
        config: {
          responseModalities: [Modality.AUDIO],
          outputAudioTranscription: {},
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
          systemInstruction: activeTab === 'chat' 
            ? "Silicon Valley Interviewer. Be concise and challenging."
            : "Precision Shadowing Coach."
        }
      });
      activeSessionRef.current = await sessionPromise;
    } catch (e) {
      console.error("Mic error:", e);
    }
  };

  const stopPractice = () => {
    if (inputNodeRef.current) inputNodeRef.current.disconnect();
    setSessionActive(false);
    clearInterval(timerRef.current);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20 animate-in fade-in duration-700">
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-indigo-900 rounded-[4rem] p-12 text-white relative overflow-hidden shadow-2xl">
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="bg-white/10 px-4 py-1.5 rounded-full backdrop-blur-md text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 border border-white/5">
                <Sparkles size={14} className="text-amber-400" /> Pro Lab
              </div>
              {sessionActive && (
                 <div className="bg-rose-500/20 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-rose-500/30 text-rose-400 flex items-center gap-2">
                   <Clock size={12} className="animate-pulse" /> 实时分析计费中: {sessionTimer}s
                 </div>
              )}
            </div>
            <h1 className="text-6xl font-black tracking-tighter leading-tight">
              打通“听得见”到<br/>
              <span className="text-indigo-400">“能交流”的最后一步</span>
            </h1>
            <p className="text-slate-400 font-medium max-w-md text-lg">
              对标硅谷职场/海外移民实战情境。实时监测你的每一次辅音爆破与语调起伏。
            </p>
          </div>

          <div className="bg-white/5 p-3 rounded-[3rem] backdrop-blur-xl border border-white/10 shadow-2xl">
             <div className="flex gap-2">
                <button onClick={() => { stopPractice(); setActiveTab('chat'); }} className={`flex-1 py-10 rounded-[2.5rem] flex flex-col items-center gap-4 transition-all ${activeTab === 'chat' ? 'bg-indigo-600 shadow-2xl scale-105' : 'hover:bg-white/5 text-slate-400'}`}>
                  <MessageSquare size={32} />
                  <span className="text-[10px] font-black uppercase tracking-widest">职场模拟面试</span>
                </button>
                <button onClick={() => { stopPractice(); setActiveTab('shadowing'); }} className={`flex-1 py-10 rounded-[2.5rem] flex flex-col items-center gap-4 transition-all ${activeTab === 'shadowing' ? 'bg-indigo-600 shadow-2xl scale-105' : 'hover:bg-white/5 text-slate-400'}`}>
                  <Headphones size={32} />
                  <span className="text-[10px] font-black uppercase tracking-widest">影子跟读实验</span>
                </button>
             </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8">
          {activeTab === 'chat' ? (
            <div className="bg-white rounded-[4rem] border border-slate-100 shadow-xl flex flex-col h-[750px] overflow-hidden">
               <div className="flex-1 p-12 overflow-y-auto space-y-8 scrollbar-hide">
                  {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'ai' ? 'justify-start' : 'justify-end'} animate-in fade-in slide-in-from-bottom-4`}>
                      <div className={`max-w-[80%] p-8 rounded-[2.5rem] text-sm leading-relaxed border ${
                        msg.role === 'ai' ? 'bg-slate-50 text-slate-700 rounded-tl-none border-slate-100' : 'bg-indigo-600 text-white rounded-tr-none border-indigo-500 font-bold'
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  {sessionActive && liveTranscription && (
                    <div className="flex justify-end animate-in fade-in">
                       <div className="max-w-[80%] p-8 rounded-[2.5rem] text-sm leading-relaxed bg-indigo-50 text-indigo-400 border border-indigo-100 italic rounded-tr-none">
                         {liveTranscription}...
                       </div>
                    </div>
                  )}
               </div>
               
               <div className="p-12 bg-slate-900 border-t border-slate-800 flex flex-col items-center gap-8">
                 <div className="flex items-center gap-10">
                    <button onClick={sessionActive ? stopPractice : startPractice} className={`p-12 rounded-full shadow-2xl transition-all active:scale-95 relative ${sessionActive ? 'bg-rose-500 text-white' : 'bg-indigo-600 text-white'}`}>
                      {sessionActive ? <MicOff size={48} /> : <Mic size={48} />}
                      {sessionActive && <div className="absolute -inset-4 bg-rose-500/20 rounded-full animate-ping pointer-events-none" />}
                    </button>
                 </div>
                 <div className="space-y-2 text-center">
                    <p className="text-[12px] font-black text-indigo-400 uppercase tracking-[0.4em] animate-pulse">
                      {sessionActive ? 'AI IS EVALUATING YOUR FLUENCY...' : 'CLICK TO ENTER PROFESSIONAL SIMULATION'}
                    </p>
                 </div>
               </div>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="bg-white rounded-[4rem] p-16 border border-slate-100 shadow-xl space-y-12 text-center relative overflow-hidden">
                <div className="space-y-6 relative z-10">
                  <div className="inline-flex px-6 py-2 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100 shadow-sm">
                    MASTER CORE SENTENCE
                  </div>
                  <h2 className="text-5xl font-black text-slate-800 tracking-tight leading-tight px-12">
                    "{SHADOWING_SENTENCES[currentShadowIdx].text}"
                  </h2>
                </div>
                <div className="flex items-center justify-center gap-8 relative z-10">
                   <button onClick={() => playReference(SHADOWING_SENTENCES[currentShadowIdx].text)} className={`flex items-center gap-4 px-10 py-6 rounded-[2rem] font-black text-lg transition-all shadow-xl ${isPlaying === SHADOWING_SENTENCES[currentShadowIdx].text ? 'bg-indigo-600 text-white animate-pulse' : 'bg-white text-indigo-600 border-2 border-indigo-100 hover:bg-indigo-50'}`}>
                     <Volume2 size={32} /> {isPlaying ? 'SENSEING...' : '真人朗读示范'}
                   </button>
                   <button onClick={sessionActive ? stopPractice : startPractice} className={`flex items-center gap-4 px-10 py-6 rounded-[2rem] font-black text-lg transition-all shadow-xl ${sessionActive ? 'bg-rose-500 text-white ring-4 ring-rose-100' : 'bg-slate-900 text-white hover:bg-slate-800'}`}>
                     {sessionActive ? <MicOff size={32} /> : <Mic size={32} />} 
                     {sessionActive ? '实时跟读中' : '开始挑战'}
                   </button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {SHADOWING_SENTENCES.map((s, i) => (
                  <button key={i} onClick={() => { setCurrentShadowIdx(i); setShadowScore(null); stopPractice(); }} className={`p-10 rounded-[3rem] border-4 text-left transition-all ${currentShadowIdx === i ? 'border-indigo-600 bg-indigo-50 shadow-2xl scale-[1.02]' : 'border-white bg-white hover:border-slate-100'}`}>
                    <p className={`text-lg font-black leading-relaxed ${currentShadowIdx === i ? 'text-slate-800' : 'text-slate-400'}`}>{s.text}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-4 space-y-10">
           <section className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-xl space-y-10">
             <h3 className="text-2xl font-black text-slate-800 flex items-center gap-4 italic underline decoration-indigo-200">
               <Trophy className="text-amber-500" /> Mastery Profile
             </h3>
             <div className="space-y-8">
                <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100">
                   <div className="flex justify-between text-[11px] font-black uppercase mb-4 tracking-widest">
                     <span className="text-slate-500">Fluency (流利度)</span>
                     <span className="text-indigo-600">Level 8.2</span>
                   </div>
                   <div className="h-3 bg-white rounded-full overflow-hidden border border-slate-200">
                     <div className="h-full bg-indigo-500" style={{ width: '82%' }} />
                   </div>
                </div>
                <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100">
                   <div className="flex justify-between text-[11px] font-black uppercase mb-4 tracking-widest">
                     <span className="text-slate-500">Intonation (语调)</span>
                     <span className="text-emerald-600">Level 7.4</span>
                   </div>
                   <div className="h-3 bg-white rounded-full overflow-hidden border border-slate-200">
                     <div className="h-full bg-emerald-500" style={{ width: '74%' }} />
                   </div>
                </div>
             </div>
           </section>

           <div className="bg-slate-900 p-12 rounded-[4rem] text-white shadow-2xl relative overflow-hidden group">
              <h3 className="text-2xl font-black mb-10 flex items-center gap-4"><Zap size={24} className="text-indigo-400" /> Coaching Insight</h3>
              <div className="space-y-8 relative z-10">
                 <div className="flex items-start gap-6 p-6 bg-white/5 rounded-3xl border border-white/10">
                    <AlertTriangle size={24} className="text-amber-400 shrink-0 mt-1" />
                    <p className="text-[12px] leading-relaxed italic text-slate-300 font-medium">
                      “建议：在面试模拟中，减少 'Um' 和 'Like' 的填充词，这能显著提升你给人的专业度印象。”
                    </p>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default SpeakingView;
