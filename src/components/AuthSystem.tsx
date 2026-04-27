import React, { useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail, 
  signOut,
  signInWithPopup
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from '../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { LogIn, UserPlus, Key, Mail, Lock, Loader2, LogOut, CheckCircle, ShieldCheck, Github, Chrome } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function AuthSystem() {
  const [mode, setMode] = useState<'login' | 'register' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  
  const { user } = useAuth();

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Check if profile exists, if not create it
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        await setDoc(docRef, {
          username: user.email?.split('@')[0] || `user_${user.uid.slice(0, 5)}`,
          displayName: user.displayName || 'Anonymous Professional',
          email: user.email,
          avatarUrl: user.photoURL || '',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
      } else if (mode === 'register') {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // Create initial profile
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          username: username || email.split('@')[0],
          displayName: displayName || username || 'New User',
          email: email,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else if (mode === 'reset') {
        await sendPasswordResetEmail(auth, email);
        setMessage('Password reset email sent. Check your inbox.');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (user) {
    return (
      <div className="bg-[#111114] p-6 rounded-2xl border border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 flex items-center justify-center text-indigo-400">
            <ShieldCheck size={20} />
          </div>
          <div>
            <div className="text-xs font-bold text-white uppercase tracking-widest">Active_Session</div>
            <div className="text-[10px] text-[#A1A1AA] uppercase tracking-widest">{user.email}</div>
          </div>
        </div>
        <button 
          onClick={() => signOut(auth)}
          className="px-4 py-2 bg-[#18181B] hover:bg-[#27272A] text-[10px] font-bold text-white uppercase tracking-widest rounded-lg border border-white/5 transition-all flex items-center gap-2"
        >
          <LogOut size={12} /> Terminate
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto py-12 px-4" id="auth-container">
      <div className="bg-[#111114] p-10 rounded-[2.5rem] border border-white/5 shadow-2xl shadow-black/50 space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-500/10 text-indigo-400 rounded-3xl mb-2 border border-indigo-500/20 shadow-xl shadow-indigo-500/10">
            {mode === 'login' ? <LogIn size={28} /> : mode === 'register' ? <UserPlus size={28} /> : <Key size={28} />}
          </div>
          <h2 className="text-3xl font-bold font-display text-white tracking-tight">
            {mode === 'login' ? 'CareerCoach_Login' : mode === 'register' ? 'CareerCoach_Registry' : 'Reset_Protocol'}
          </h2>
          <p className="text-[11px] text-[#71717A] font-bold uppercase tracking-[0.2em]">Secure Authentication Gateway</p>
        </div>

        <form onSubmit={handleAuth} className="space-y-6">
          <div className="space-y-4">
            {mode !== 'reset' && (
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full py-4 bg-white text-black rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-slate-200 transition-all shadow-xl shadow-white/5 disabled:opacity-20"
              >
                <Chrome size={16} />
                Continue with Google
              </button>
            )}

            {mode !== 'reset' && (
              <div className="flex items-center gap-4 py-2">
                <div className="h-px bg-white/5 flex-1" />
                <span className="text-[10px] font-bold text-[#3F3F46] uppercase tracking-widest">OR</span>
                <div className="h-px bg-white/5 flex-1" />
              </div>
            )}
            {mode === 'register' && (
              <>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[#52525B] uppercase tracking-widest ml-1">Username</label>
                  <div className="relative">
                    <input 
                      type="text"
                      className="w-full pl-10 pr-4 py-3 bg-[#18181B] border border-white/5 rounded-xl focus:ring-1 focus:ring-indigo-500 outline-none text-[#FAFAFA] placeholder-[#3F3F46] text-sm"
                      placeholder="User_ID_00x"
                      required
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                    />
                  </div>
                </div>
              </>
            )}
            
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-[#52525B] uppercase tracking-widest ml-1">Secure_Email</label>
              <div className="relative">
                <input 
                  type="email"
                  className="w-full pl-10 pr-4 py-3 bg-[#18181B] border border-white/5 rounded-xl focus:ring-1 focus:ring-indigo-500 outline-none text-[#FAFAFA] placeholder-[#3F3F46] text-sm"
                  placeholder="name@nexus.core"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[#3F3F46]" size={16} />
              </div>
            </div>

            {mode !== 'reset' && (
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#52525B] uppercase tracking-widest ml-1">Access_Code</label>
                <div className="relative">
                  <input 
                    type="password"
                    className="w-full pl-10 pr-4 py-3 bg-[#18181B] border border-white/5 rounded-xl focus:ring-1 focus:ring-indigo-500 outline-none text-[#FAFAFA] placeholder-[#3F3F46] text-sm"
                    placeholder="••••••••"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#3F3F46]" size={16} />
                </div>
              </div>
            )}
          </div>

          {error && <div className="text-[10px] text-red-400 font-bold uppercase tracking-widest bg-red-400/5 p-3 rounded-lg border border-red-400/10">Error: {error}</div>}
          {message && <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest bg-emerald-400/5 p-3 rounded-lg border border-emerald-400/10">Message: {message}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/20 disabled:opacity-20"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : mode === 'login' ? 'Authorize' : mode === 'register' ? 'Register' : 'Reset'}
          </button>
        </form>

        <div className="flex flex-col gap-3 text-center">
          <button 
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null); }}
            className="text-[10px] text-[#A1A1AA] hover:text-white font-bold uppercase tracking-widest transition-colors"
          >
            {mode === 'login' ? 'Create New Uplink' : 'Return to Authorization'}
          </button>
          {mode === 'login' && (
            <button 
              onClick={() => { setMode('reset'); setError(null); }}
              className="text-[10px] text-[#52525B] hover:text-white font-bold uppercase tracking-widest transition-colors underline underline-offset-4"
            >
              Lost Access Code?
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
