import React, { useState, useRef } from 'react';
import { FileText, Send, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { analyzeResume, matchJobDescription } from '../services/geminiService';
import Markdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';

export default function ResumeAnalyzer() {
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [mode, setMode] = useState<'general' | 'match'>('general');

  const feedbackRef = useRef<HTMLDivElement>(null);

  const handleAnalyze = async () => {
    if (!resumeText.trim()) {
      setFeedback('Error: Resume content is required.');
      return;
    }
    if (mode === 'match' && !jobDescription.trim()) {
      setFeedback('Error: Job description is required for matching mode.');
      return;
    }

    setIsAnalyzing(true);
    setFeedback(null);
    try {
      console.log('Initiating AI Analysis...');
      const result = mode === 'general' 
        ? await analyzeResume(resumeText)
        : await matchJobDescription(resumeText, jobDescription);
      
      console.log('Analysis Complete');
      setFeedback(result || '### Protocol Exception\n\nThe model failed to return structured data. Please re-attempt the capture.');
      
      // Auto-scroll to results
      setTimeout(() => {
        feedbackRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (error: any) {
      console.error('Analysis Error:', error);
      const errorMessage = error.message || 'Error communicating with the neural engine.';
      setFeedback(`### Analysis Failed\n\n${errorMessage}\n\nPlease ensure your environment is correctly configured and try again.`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 p-4 md:p-12" id="resume-analyzer-section">
      <header className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
          Engine Active
        </div>
        <h2 className="text-4xl font-bold font-display tracking-tight text-white">System Optimization</h2>
        <p className="text-[#71717A] text-lg font-medium">Fine-tune your resume against general benchmarks or targeted roles.</p>
      </header>

      <div className="flex p-1 bg-[#18181B] border border-white/5 rounded-xl w-fit">
        <button 
          onClick={() => setMode('general')}
          className={`px-5 py-2 rounded-lg text-xs font-bold transition-all uppercase tracking-widest ${mode === 'general' ? 'bg-[#27272A] text-white shadow-lg' : 'text-[#52525B] hover:text-[#A1A1AA]'}`}
        >
          General
        </button>
        <button 
          onClick={() => setMode('match')}
          className={`px-5 py-2 rounded-lg text-xs font-bold transition-all uppercase tracking-widest ${mode === 'match' ? 'bg-[#27272A] text-white shadow-lg' : 'text-[#52525B] hover:text-[#A1A1AA]'}`}
        >
          Matcher
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-[#111114] rounded-3xl border border-white/5 overflow-hidden shadow-2xl shadow-black/50" id="input-container">
          <div className="px-6 py-4 bg-[#18181B] border-b border-white/5 text-[10px] font-bold text-[#52525B] uppercase tracking-widest flex justify-between items-center">
            <span>RESUME_CONTENT_DATA</span>
            <span className="text-[#3F3F46] font-mono">{resumeText.length > 0 ? `${resumeText.split(/\s+/).length} WDS` : 'EMPTY'}</span>
          </div>
          <textarea
            id="resume-input"
            className="w-full h-96 p-8 resize-none focus:outline-none text-[#D4D4D8] font-sans leading-relaxed bg-transparent placeholder-[#3F3F46]"
            placeholder="Paste raw text here..."
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
          />
        </div>

        {mode === 'match' && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-[#111114] rounded-3xl border border-white/5 overflow-hidden shadow-2xl shadow-black/50"
          >
            <div className="px-6 py-4 bg-[#18181B] border-b border-white/5 text-[10px] font-bold text-[#52525B] uppercase tracking-widest">TARGET_JD_PARAMETERS</div>
            <textarea
              id="jd-input"
              className="w-full h-96 p-8 resize-none focus:outline-none text-[#D4D4D8] font-sans leading-relaxed bg-transparent placeholder-[#3F3F46]"
              placeholder="Paste position requirements here..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
            />
          </motion.div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-end gap-6 pt-4">
        <button
          id="analyze-button"
          onClick={handleAnalyze}
          disabled={isAnalyzing || !resumeText.trim() || (mode === 'match' && !jobDescription.trim())}
          className="w-full sm:w-auto px-10 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all disabled:opacity-20 disabled:grayscale shadow-xl shadow-indigo-600/20"
        >
          {isAnalyzing ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Processing
            </>
          ) : (
            <>
              <Send size={16} />
              {mode === 'general' ? 'Run Analysis' : 'Verify Alignment'}
            </>
          )}
        </button>
      </div>

      <AnimatePresence>
        {feedback && (
          <motion.div
            ref={feedbackRef}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#111114] rounded-3xl border border-white/5 p-10 shadow-2xl shadow-black/80"
            id="feedback-result"
          >
            <div className="flex items-center gap-4 mb-8 pb-8 border-b border-white/5">
              <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center border border-emerald-500/20">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold font-display text-white">Analysis Output</h3>
                <p className="text-[10px] text-[#52525B] font-bold uppercase tracking-widest">Neural evaluation complete</p>
              </div>
            </div>
            <div className="markdown-body">
              <Markdown>{feedback}</Markdown>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
