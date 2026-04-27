import React, { useState, useRef } from 'react';
import { FileText, Send, Loader2, CheckCircle2, Copy, Sparkles } from 'lucide-react';
import { generateResume } from '../services/geminiService';
import Markdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';

export default function ResumeGenerator() {
  const [role, setRole] = useState('');
  const [details, setDetails] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [resume, setResume] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const resumeRef = useRef<HTMLDivElement>(null);

  const handleGenerate = async () => {
    if (!role.trim() || !details.trim()) return;

    setIsGenerating(true);
    setResume(null);
    try {
      const result = await generateResume(role, details);
      setResume(result || '### Error\n\nFailed to generate resume. Please try again.');
      
      setTimeout(() => {
        resumeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (error: any) {
      console.error('Generation Error:', error);
      setResume(`### Generation Failed\n\n${error.message || 'Error communicating with the neural engine.'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (resume) {
      navigator.clipboard.writeText(resume);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-12 px-4 space-y-12" id="resume-generator-root">
      <header className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-500/10 text-indigo-400 rounded-3xl mb-4 border border-indigo-500/20 shadow-2xl shadow-indigo-500/10">
          <Sparkles size={32} />
        </div>
        <h2 className="text-5xl font-bold font-display tracking-tight text-white leading-tight">Resume Architect</h2>
        <p className="text-[#71717A] text-lg font-medium max-w-2xl mx-auto">Build a high-impact, industry-targeted resume using neural architecture.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#111114] p-8 rounded-[2.5rem] shadow-2xl border border-white/5 space-y-6">
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-[#52525B] uppercase tracking-widest ml-1">Target_Position</label>
              <input 
                type="text"
                placeholder="e.g. Senior Frontend Engineer"
                className="w-full px-5 py-4 bg-[#18181B] border border-white/5 rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none text-[#FAFAFA] placeholder-[#3F3F46]"
                value={role}
                onChange={e => setRole(e.target.value)}
              />
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-bold text-[#52525B] uppercase tracking-widest ml-1">Experience_&_Details</label>
              <textarea 
                placeholder="List your key roles, projects, skills, and achievements. Bullet points work best..."
                className="w-full h-64 px-5 py-4 bg-[#18181B] border border-white/5 rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all outline-none resize-none text-[#FAFAFA] placeholder-[#3F3F46] leading-relaxed"
                value={details}
                onChange={e => setDetails(e.target.value)}
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={isGenerating || !role.trim() || !details.trim()}
              className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-indigo-500 transition-all disabled:opacity-20 shadow-xl shadow-indigo-600/20"
            >
              {isGenerating ? <Loader2 className="animate-spin" /> : <Send size={14} />}
              Architect Resume
            </button>
          </div>
        </div>

        <div className="lg:col-span-7">
          <AnimatePresence mode="wait">
            {resume ? (
              <motion.div
                key="resume-result"
                ref={resumeRef}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-[#111114] rounded-[2.5rem] border border-white/5 p-8 shadow-2xl relative"
              >
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-[10px] uppercase tracking-widest">
                    <CheckCircle2 size={14} /> Resume_Generated
                  </div>
                  <button 
                    onClick={handleCopy}
                    className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-bold text-white uppercase tracking-widest transition-all"
                  >
                    {copied ? <CheckCircle2 size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    {copied ? 'Copied' : 'Copy_Raw'}
                  </button>
                </div>

                <div className="markdown-body prose prose-invert max-w-none prose-p:text-[#A1A1AA] prose-headings:text-white prose-li:text-[#A1A1AA]">
                  <Markdown>{resume}</Markdown>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="placeholder"
                className="h-full min-h-[400px] border-2 border-dashed border-white/5 rounded-[2.5rem] flex flex-col items-center justify-center text-center p-12 space-y-6"
              >
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center text-[#27272A]">
                  <FileText size={40} />
                </div>
                <div className="space-y-2">
                  <h4 className="text-white font-bold text-lg">Awaiting Input</h4>
                  <p className="text-[#52525B] max-w-xs mx-auto">Enter your role and background details to begin the neural architecture process.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
