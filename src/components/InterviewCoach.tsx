import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, MessageSquare, Loader2, ArrowRight, User, Bot, CheckCircle, Save, Mic, MicOff, Volume2, Info, Lightbulb, BookOpen, Shield, AlertCircle } from 'lucide-react';
import { generateInterviewQuestions, getInterviewFeedback, getRoleInsights, textToSpeech } from '../services/geminiService';
import Markdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';

interface Question {
  text: string;
  answer: string;
  feedback: string | null;
  isEvaluating: boolean;
}

export default function InterviewCoach() {
  const [role, setRole] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(-1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [roleInsights, setRoleInsights] = useState<string | null>(null);
  const [isFetchingInsights, setIsFetchingInsights] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [questions, currentIdx]);

  // Voice Interaction Setup
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map(result => result.transcript)
          .join('');
        setUserAnswer(transcript);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }
  }, []);

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
    } else {
      setUserAnswer('');
      recognitionRef.current?.start();
      setIsRecording(true);
    }
  };

  const handleSpeakText = async (text: string) => {
    if (!voiceEnabled) return;
    setIsSpeaking(true);
    
    try {
      const cleanText = text.replace(/[#*`]/g, '').trim();
      if (!cleanText) return;

      // Extract the first sentence for "Instant Start"
      const sentenceMatch = cleanText.match(/[^.!?]+[.!?]+/);
      const firstSentence = sentenceMatch ? sentenceMatch[0] : cleanText;
      const remainingText = sentenceMatch ? cleanText.slice(firstSentence.length).trim() : '';
      
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

      // First call: Priority Sentence
      const firstAudio = await textToSpeech(firstSentence);
      if (firstAudio) {
        await playNeuralAudio(firstAudio, audioContext);
      }

      // Second call: Remaining Text (in one go to save quota)
      if (remainingText) {
        const remainingAudio = await textToSpeech(remainingText);
        if (remainingAudio) {
          await playNeuralAudio(remainingAudio, audioContext);
        }
      }

      audioContext.close();
    } catch (e: any) {
      console.warn('Speech Synthesis Limitation:', e);
      if (e.message?.includes('429') || e.message?.includes('quota')) {
        setQuotaExceeded(true);
        setTimeout(() => setQuotaExceeded(false), 10000); // Hide after 10s
      }
    } finally {
      setIsSpeaking(false);
    }
  };

  const playNeuralAudio = async (base64Audio: string, audioContext: AudioContext) => {
    const binaryString = atob(base64Audio);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    const floatData = new Float32Array(bytes.length / 2);
    const dataView = new DataView(bytes.buffer);
    
    for (let i = 0; i < floatData.length; i++) {
      const pcm16 = dataView.getInt16(i * 2, true);
      floatData[i] = pcm16 / 32768;
    }
    
    const audioBuffer = audioContext.createBuffer(1, floatData.length, 24000);
    audioBuffer.getChannelData(0).set(floatData);
    
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    
    return new Promise<void>((resolve) => {
      source.onended = () => resolve();
      source.start();
    });
  };

  const handleStartSession = async () => {
    if (!role.trim()) return;
    setIsGenerating(true);
    setIsFetchingInsights(true);
    try {
      const [qTexts, insights] = await Promise.all([
        generateInterviewQuestions(role, resumeText),
        getRoleInsights(role)
      ]);
      
      const newQuestions = qTexts.map((text: string) => ({
        text,
        answer: '',
        feedback: null,
        isEvaluating: false
      }));
      setQuestions(newQuestions);
      setRoleInsights(insights);
      setCurrentIdx(0);
      
      // Auto-speak the first question if voice is on
      if (voiceEnabled && newQuestions.length > 0) {
        setTimeout(() => handleSpeakText(newQuestions[0].text), 1000);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsGenerating(false);
      setIsFetchingInsights(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!userAnswer.trim()) return;
    
    if (isRecording) {
      recognitionRef.current?.stop();
    }

    const updated = [...questions];
    updated[currentIdx].answer = userAnswer;
    updated[currentIdx].isEvaluating = true;
    setQuestions(updated);
    setUserAnswer('');

    try {
      const feedback = await getInterviewFeedback(questions[currentIdx].text, userAnswer, role);
      const final = [...questions];
      final[currentIdx].feedback = feedback || 'No feedback received.';
      final[currentIdx].isEvaluating = false;
      setQuestions(final);
      
      // Auto-speak feedback if voice is on
      if (voiceEnabled && feedback) {
        handleSpeakText(feedback.replace(/[#*`]/g, ''));
      }
    } catch (error) {
      const final = [...questions];
      final[currentIdx].feedback = 'Error getting feedback.';
      final[currentIdx].isEvaluating = false;
      setQuestions(final);
    }
  };

  if (currentIdx === -1) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 space-y-12" id="setup-interview">
        <div className="text-center space-y-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-500/10 text-indigo-400 rounded-3xl mb-4 border border-indigo-500/20 shadow-2xl shadow-indigo-500/10">
            <MessageSquare size={40} />
          </div>
          <h2 className="text-5xl font-bold font-display tracking-tight text-white leading-tight">Simulation Lab</h2>
          <p className="text-[#71717A] text-xl font-medium">Calibrate your performance with high-fidelity behavioral modeling.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-[#111114] p-10 rounded-[2.5rem] shadow-2xl shadow-black/50 border border-white/5 space-y-8 h-fit">
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-[#52525B] uppercase tracking-widest ml-1">Target_Position</label>
              <input 
                id="role-input"
                type="text"
                placeholder="e.g. Lead System Architect"
                className="w-full px-5 py-4 bg-[#18181B] border border-white/5 rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none text-[#FAFAFA] placeholder-[#3F3F46]"
                value={role}
                onChange={e => setRole(e.target.value)}
              />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-[#52525B] uppercase tracking-widest ml-1">Candidate_Context</label>
              <textarea 
                id="resume-context"
                placeholder="Paste relevant experience metadata for tailored simulation..."
                className="w-full h-40 px-5 py-4 bg-[#18181B] border border-white/5 rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none resize-none text-[#FAFAFA] placeholder-[#3F3F46] leading-relaxed"
                value={resumeText}
                onChange={e => setResumeText(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                <div className="flex items-center gap-3">
                  <Volume2 size={18} className="text-indigo-400" />
                  <div>
                    <div className="text-[10px] font-bold text-white uppercase tracking-widest">AI Voice Synthesis</div>
                    <div className="text-[9px] text-[#52525B] uppercase font-bold tracking-widest mt-0.5">Narrate Questions & Feedback</div>
                  </div>
                </div>
                <button 
                  onClick={() => setVoiceEnabled(!voiceEnabled)}
                  className={`w-12 h-6 rounded-full transition-all relative ${voiceEnabled ? 'bg-indigo-600' : 'bg-[#27272A]'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${voiceEnabled ? 'right-1' : 'left-1'}`} />
                </button>
              </div>

              <AnimatePresence>
                {quotaExceeded && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-3"
                  >
                    <AlertCircle size={14} className="text-amber-400 shrink-0 mt-0.5" />
                    <div className="text-[9px] font-bold text-amber-200 uppercase tracking-widest leading-relaxed">
                      AI Voice Quota Exceeded. The system is temporarily reverting to text-only mode to conserve neural bandwidth. Please wait a few moments.
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              id="start-session"
              onClick={handleStartSession}
              disabled={isGenerating || !role.trim()}
              className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-indigo-500 transition-all disabled:opacity-20 shadow-xl shadow-indigo-600/20"
            >
              {isGenerating ? <Loader2 className="animate-spin" /> : <Play size={14} fill="currentColor" />}
              Initiate Simulation
            </button>
          </div>

          <div className="bg-[#111114] p-10 rounded-[2.5rem] border border-dashed border-white/10 flex flex-col items-center justify-center text-center space-y-6">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-[#3F3F46]">
              <Lightbulb size={32} />
            </div>
            <div className="space-y-2">
              <h4 className="text-white font-bold tracking-tight">Role Specific Preparation</h4>
              <p className="text-[#52525B] text-sm leading-relaxed max-w-xs">
                Once initialized, our neural engine will provide deep-dive insights and industry-specific facts for your target role.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIdx];

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-120px)] flex gap-8 p-4 md:p-8 overflow-hidden" id="interview-chat-container">
      {/* Sidebar: Role Mastery */}
      <div className="hidden lg:flex flex-col w-80 shrink-0 space-y-6 overflow-y-auto pr-2 scrollbar-hide">
        <div className="bg-[#111114] p-6 rounded-[2rem] border border-white/5 shadow-2xl">
          <div className="flex items-center gap-2 mb-6 text-indigo-400 font-bold text-[10px] uppercase tracking-widest">
            <Shield size={14} /> Role_Mastery_Insights
          </div>
          <div className="markdown-body prose-xs prose-invert overflow-y-auto max-h-[60vh]">
            {isFetchingInsights ? (
              <div className="py-20 flex flex-col items-center gap-4 text-[#3F3F46]">
                <Loader2 size={32} className="animate-spin" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Fetching_Data...</span>
              </div>
            ) : roleInsights ? (
              <Markdown>{roleInsights}</Markdown>
            ) : (
              <p className="text-[#3F3F46] italic">No insights available for this session.</p>
            )}
          </div>
        </div>
        
        <div className="bg-emerald-500/5 p-6 rounded-[2rem] border border-emerald-500/10">
          <div className="flex items-center gap-2 mb-3 text-emerald-400 font-bold text-[10px] uppercase tracking-widest">
            <Info size={14} /> System_Pro_Tip
          </div>
          <p className="text-[11px] text-[#A1A1AA] leading-relaxed">
            Use the STAR method (Situation, Task, Action, Result) for behavioral questions to maximize score yield.
          </p>
        </div>
      </div>

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Session Progress */}
        <div className="flex items-center justify-between mb-8 px-2">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setCurrentIdx(-1)}
              className="text-[#52525B] hover:text-[#A1A1AA] flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-colors"
            >
              <RotateCcw size={14} /> Abort_Mission
            </button>
            <div className="h-4 w-px bg-white/5" />
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white uppercase tracking-widest">{role}</span>
              {isSpeaking && (
                <div className="flex items-center gap-1">
                  {[...Array(4)].map((_, i) => (
                    <motion.div 
                      key={i}
                      animate={{ height: [4, 12, 4] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }}
                      className="w-1 bg-indigo-500 rounded-full"
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-4 py-1.5 rounded-full border border-indigo-500/20 uppercase tracking-widest">
            Node {currentIdx + 1} // {questions.length}
          </div>
        </div>

        {/* Chat Area */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto space-y-10 pr-4 pb-8 scrollbar-hide"
          id="chat-messages"
        >
          <AnimatePresence initial={false}>
            {questions.slice(0, currentIdx + 1).map((q, i) => (
              <React.Fragment key={i}>
                {/* AI Question */}
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-start gap-5 max-w-[90%]"
                >
                  <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center shrink-0 text-[#A1A1AA]">
                    <Bot size={24} />
                  </div>
                  <div className="group relative bg-[#111114] p-6 rounded-3xl rounded-tl-none border border-white/5 text-[#D4D4D8] shadow-xl shadow-black/20">
                    <p className="font-medium text-lg leading-relaxed">{q.text}</p>
                    <button 
                      onClick={() => handleSpeakText(q.text)}
                      className="absolute -right-12 top-2 p-2 text-[#3F3F46] hover:text-indigo-400 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Volume2 size={16} />
                    </button>
                  </div>
                </motion.div>

                {/* User Answer */}
                {q.answer && (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-start gap-5 max-w-[90%] self-end flex-row-reverse"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shrink-0 text-white shadow-lg shadow-indigo-600/30">
                      <User size={24} />
                    </div>
                    <div className="bg-indigo-600 p-6 rounded-3xl rounded-tr-none shadow-xl text-white">
                      <p className="font-medium leading-relaxed">{q.answer}</p>
                    </div>
                  </motion.div>
                )}

                {/* AI Feedback */}
                {q.isEvaluating && (
                  <div className="flex items-center gap-3 ml-16 text-[10px] text-indigo-400 font-bold uppercase tracking-widest">
                    <Loader2 size={14} className="animate-spin text-indigo-400" />
                    Analyzing_response_output...
                  </div>
                )}
                
                {q.feedback && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="ml-16 p-8 bg-[#18181B]/50 rounded-[2rem] border border-white/5 relative group"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-2 text-emerald-400 font-bold text-[10px] uppercase tracking-widest">
                        <CheckCircle size={14} /> Evaluation_Report
                      </div>
                      <button 
                        onClick={() => handleSpeakText(q.feedback?.replace(/[#*`]/g, '') || '')}
                        className="p-2 text-[#3F3F46] hover:text-emerald-400 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Volume2 size={16} />
                      </button>
                    </div>
                    <div className="markdown-body prose-sm prose-invert">
                      <Markdown>{q.feedback}</Markdown>
                    </div>
                    {i === currentIdx && currentIdx < questions.length - 1 && (
                      <button
                        id="next-question"
                        onClick={() => {
                          setCurrentIdx(prev => prev + 1);
                          if (voiceEnabled) {
                            setTimeout(() => handleSpeakText(questions[currentIdx + 1].text), 1000);
                          }
                        }}
                        className="mt-8 px-6 py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20"
                      >
                        Process Next Node <ArrowRight size={14} />
                      </button>
                    )}
                    {i === currentIdx && currentIdx === questions.length - 1 && (
                      <div className="mt-8 flex flex-col gap-6">
                        <div className="bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-2xl text-emerald-400 text-xs font-bold uppercase tracking-widest">
                          SIMULATION_SEQUENCE_COMPLETE // 100% SUCCESS
                        </div>
                        <button
                          onClick={() => setCurrentIdx(-1)}
                          className="px-8 py-4 bg-[#27272A] text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-[#3F3F46] transition-all"
                        >
                          Initiate New Protocol
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </React.Fragment>
            ))}
          </AnimatePresence>
        </div>

        {/* Input Area */}
        {currentQuestion && !currentQuestion.answer && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="pt-6 border-t border-white/5 bg-[#09090B] -mx-4 px-4 sticky bottom-0"
          >
            <div className="max-w-4xl mx-auto space-y-4">
              <div className="relative">
                <textarea
                  id="answer-input"
                  className="w-full h-32 pl-6 pr-20 py-6 rounded-2xl bg-[#111114] border border-white/5 focus:ring-2 focus:ring-indigo-500 transition-all shadow-2xl shadow-black/20 outline-none resize-none text-[#FAFAFA] placeholder-[#3F3F46] leading-relaxed"
                  placeholder={isRecording ? "Listening to uplink..." : "Transmit your response..."}
                  value={userAnswer}
                  onChange={e => setUserAnswer(e.target.value)}
                />
                <button 
                  onClick={toggleRecording}
                  className={`absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-xl flex items-center justify-center transition-all ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-white/5 text-[#3F3F46] hover:text-white hover:bg-white/10'}`}
                >
                  {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
                </button>
              </div>
              <div className="flex items-center justify-between pb-6">
                <div className="flex items-center gap-4">
                  <p className="text-[10px] text-[#52525B] font-bold uppercase tracking-widest">Star_Method_Advised</p>
                  {isRecording && (
                    <div className="flex items-center gap-2">
                       <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                       <span className="text-[10px] text-red-500 font-bold uppercase tracking-widest">Recording</span>
                    </div>
                  )}
                </div>
                <button
                  id="submit-answer"
                  onClick={handleSubmitAnswer}
                  disabled={!userAnswer.trim()}
                  className="px-10 py-4 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest flex items-center gap-3 hover:bg-indigo-500 transition-all disabled:opacity-20 shadow-xl shadow-indigo-600/20"
                >
                  Transmit Response
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
