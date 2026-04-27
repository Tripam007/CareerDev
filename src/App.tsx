import React, { useState } from 'react';
import { Briefcase, LayoutDashboard, MessageSquare, Sparkles, BookOpen, ChevronRight, GraduationCap, User, Shield, Loader2 } from 'lucide-react';
import ResumeAnalyzer from './components/ResumeAnalyzer';
import InterviewCoach from './components/InterviewCoach';
import AuthSystem from './components/AuthSystem';
import UserProfilePage from './components/UserProfilePage';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';

type Tab = 'dashboard' | 'analyzer' | 'interview' | 'auth' | 'profile';

function AppContent() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090B] flex items-center justify-center">
        <Loader2 className="animate-spin text-indigo-500" size={48} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#09090B] flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="flex items-center justify-center gap-3 mb-12">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-600/20">
              <Briefcase size={24} className="text-white" />
            </div>
            <span className="font-display font-bold text-4xl tracking-tight text-white">CareerCoach <span className="text-indigo-400">AI</span></span>
          </div>
          <AuthSystem />
          <p className="mt-8 text-center text-[#52525B] text-[10px] font-bold uppercase tracking-[0.3em]">Authorized Access Only // Secure Core</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090B] flex flex-col md:flex-row text-[#FAFAFA]">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-[#111114] border-b md:border-b-0 md:border-r border-white/5 p-6 flex flex-col gap-10 shrink-0 z-10 sticky top-0 h-auto md:h-screen">
        <div className="flex items-center gap-3 py-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Briefcase size={16} className="text-white" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight">CareerCoach <span className="text-indigo-400">AI</span></span>
        </div>

        <nav className="flex-1 space-y-1">
          <div className="px-4 py-2 text-[10px] uppercase tracking-widest text-[#52525B] font-bold">Solutions</div>
          <NavItem 
            icon={<LayoutDashboard size={18} />} 
            label="Overview" 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
          />
          <NavItem 
            icon={<Sparkles size={18} />} 
            label="Resume Logic" 
            active={activeTab === 'analyzer'} 
            onClick={() => setActiveTab('analyzer')} 
          />
          <NavItem 
            icon={<MessageSquare size={18} />} 
            label="Interview Lab" 
            active={activeTab === 'interview'} 
            onClick={() => setActiveTab('interview')} 
          />

          <div className="px-4 py-2 text-[10px] uppercase tracking-widest text-[#52525B] font-bold mt-4">Security</div>
          {user ? (
            <NavItem 
              icon={<User size={18} />} 
              label="Identity" 
              active={activeTab === 'profile'} 
              onClick={() => setActiveTab('profile')} 
            />
          ) : (
            <NavItem 
              icon={<Shield size={18} />} 
              label="Authorization" 
              active={activeTab === 'auth'} 
              onClick={() => setActiveTab('auth')} 
            />
          )}
        </nav>

        <div className="hidden md:block pt-6">
          <div className="bg-[#18181B] rounded-2xl p-4 border border-white/5 space-y-3">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-[10px] uppercase tracking-widest">
              <Sparkles size={12} /> System Status
            </div>
            <p className="text-[11px] text-[#71717A] leading-relaxed font-medium">Neural engine optimized for latest career frameworks.</p>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-8 md:p-12 max-w-6xl mx-auto space-y-16"
            >
              <header className="space-y-6 max-w-3xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
                  Professional Suite v3.1
                </div>
                <h1 className="text-6xl font-bold font-display tracking-tight text-white leading-[1.05]">
                  Architecting your <span className="text-indigo-500">professional future.</span>
                </h1>
                <p className="text-[#A1A1AA] text-xl leading-relaxed font-medium">
                  The mission-critical platform for high-performance career optimization and behavioral benchmarking.
                </p>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <DashboardCard 
                  icon={<Sparkles size={24} className="text-indigo-400" />}
                  title="Resume Analyzer"
                  description="Proprietary analysis of semantic structure, keyword density, and competitive indexing."
                  onClick={() => setActiveTab('analyzer')}
                  color="bg-indigo-600/10"
                  id="dashboard-resume-card"
                />
                <DashboardCard 
                  icon={<MessageSquare size={24} className="text-emerald-400" />}
                  title="Interview Coach"
                  description="Dynamic simulation engine for real-time behavioral evaluation and feedback loops."
                  onClick={() => setActiveTab('interview')}
                  color="bg-emerald-500/10"
                  id="dashboard-interview-card"
                />
              </div>

              <section className="bg-[#111114] rounded-[2.5rem] p-12 border border-white/5 overflow-hidden relative" id="cta-banner">
                <div className="relative z-10 space-y-8 max-w-xl">
                  <div className="flex items-center gap-4">
                    <div className="flex -space-x-3">
                      {[1,2,3].map(i => (
                        <div key={i} className="w-10 h-10 rounded-full bg-slate-800 border-2 border-[#111114]" />
                      ))}
                    </div>
                    <span className="text-xs font-bold text-[#71717A] uppercase tracking-widest">Trusted by 12,000+ professionals</span>
                  </div>
                  <h2 className="text-4xl font-bold font-display leading-tight">Elite preparation for modern roles.</h2>
                  <p className="text-[#A1A1AA] text-lg leading-relaxed">
                    Our AI models utilize the latest industry benchmarks to ensure your profile resonates with elite recruiters.
                  </p>
                  <button 
                    onClick={() => setActiveTab('interview')}
                    className="group bg-indigo-600 text-white px-8 py-4 rounded-xl font-bold flex items-center gap-3 hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/20"
                  >
                    Initiate Preparation <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
                {/* Decorative elements */}
                <div className="absolute -right-32 -bottom-32 w-[600px] h-[600px] bg-indigo-600/5 rounded-full blur-[120px]" />
                <div className="absolute top-1/2 right-12 -translate-y-1/2 opacity-[0.03]">
                  <BookOpen size={320} />
                </div>
              </section>
            </motion.div>
          )}

          {activeTab === 'analyzer' && (
            <motion.div 
              key="analyzer"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <ResumeAnalyzer />
            </motion.div>
          )}

          {activeTab === 'interview' && (
            <motion.div 
              key="interview"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <InterviewCoach />
            </motion.div>
          )}

          {activeTab === 'auth' && (
            <motion.div 
              key="auth"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <AuthSystem />
            </motion.div>
          )}

          {activeTab === 'profile' && (
            <motion.div 
              key="profile"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <UserProfilePage />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
        active 
          ? 'bg-[#27272A] text-white shadow-lg border border-white/5' 
          : 'text-[#52525B] hover:bg-white/5 hover:text-[#A1A1AA]'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function DashboardCard({ icon, title, description, onClick, color, id }: { icon: React.ReactNode, title: string, description: string, onClick: () => void, color: string, id: string }) {
  return (
    <button
      id={id}
      onClick={onClick}
      className="group text-left bg-[#111114] p-10 rounded-[2.5rem] border border-white/5 hover:border-indigo-500/50 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500 flex flex-col gap-8"
    >
      <div className={`w-16 h-16 rounded-2xl ${color} flex items-center justify-center group-hover:scale-110 transition-all duration-500`}>
        {icon}
      </div>
      <div className="space-y-3">
        <h3 className="text-3xl font-bold font-display text-white flex items-center gap-2">
          {title} <ChevronRight size={20} className="text-indigo-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all" />
        </h3>
        <p className="text-[#A1A1AA] leading-relaxed font-medium text-lg">{description}</p>
      </div>
    </button>
  );
}
