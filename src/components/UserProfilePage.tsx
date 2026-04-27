import React, { useState, useEffect } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'motion/react';
import { User, Camera, Save, Loader2, Shield } from 'lucide-react';

export default function UserProfilePage() {
  const { user, profile, refreshProfile } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [bio, setBio] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || '');
      setAvatarUrl(profile.avatarUrl || '');
      setBio(profile.bio || '');
    }
  }, [profile]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsSaving(true);
    setMessage(null);
    try {
      const docRef = doc(db, 'users', user.uid);
      await updateDoc(docRef, {
        displayName,
        avatarUrl,
        bio,
        updatedAt: serverTimestamp(),
      });
      await refreshProfile();
      setMessage({ type: 'success', text: 'Profile synchronization complete.' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-[#52525B]">
        <Shield size={64} opacity={0.1} />
        <p className="mt-4 uppercase font-bold tracking-[0.3em] text-xs">Authorization Required</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-12 space-y-12">
      <header className="space-y-4">
        <div className="w-20 h-20 bg-indigo-600/10 border border-indigo-500/20 rounded-[2rem] flex items-center justify-center text-indigo-400">
           {avatarUrl ? (
             <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover rounded-[2rem]" />
           ) : (
             <User size={32} />
           )}
        </div>
        <div>
          <h2 className="text-4xl font-bold font-display text-white tracking-tight">Identity_Management</h2>
          <p className="text-[#71717A] text-lg font-medium mt-1">Status: Logged in as <span className="text-indigo-400">{profile?.username}</span></p>
        </div>
      </header>

      <form onSubmit={handleUpdateProfile} className="bg-[#111114] p-10 rounded-[2.5rem] border border-white/5 shadow-2xl shadow-black/50 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <label className="text-[10px] font-bold text-[#52525B] uppercase tracking-widest ml-1">Display_Alias</label>
            <input 
              type="text"
              className="w-full px-5 py-4 bg-[#18181B] border border-white/5 rounded-2xl focus:ring-1 focus:ring-indigo-500 outline-none text-[#FAFAFA] placeholder-[#3F3F46] text-sm"
              placeholder="Your Name"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
            />
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-bold text-[#52525B] uppercase tracking-widest ml-1">Avatar_Source_URL</label>
            <div className="relative">
              <input 
                type="text"
                className="w-full pl-12 pr-5 py-4 bg-[#18181B] border border-white/5 rounded-2xl focus:ring-1 focus:ring-indigo-500 outline-none text-[#FAFAFA] placeholder-[#3F3F46] text-sm"
                placeholder="https://..."
                value={avatarUrl}
                onChange={e => setAvatarUrl(e.target.value)}
              />
              <Camera className="absolute left-4 top-1/2 -translate-y-1/2 text-[#3F3F46]" size={18} />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-[10px] font-bold text-[#52525B] uppercase tracking-widest ml-1">Bio_Metadata</label>
          <textarea 
            className="w-full h-32 px-5 py-4 bg-[#18181B] border border-white/5 rounded-2xl focus:ring-1 focus:ring-indigo-500 outline-none text-[#FAFAFA] placeholder-[#3F3F46] text-sm resize-none leading-relaxed"
            placeholder="Tell us about yourself..."
            value={bio}
            onChange={e => setBio(e.target.value)}
          />
        </div>

        {message && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`text-[10px] font-bold uppercase tracking-widest p-4 rounded-xl border ${
              message.type === 'success' ? 'bg-emerald-400/5 text-emerald-400 border-emerald-400/20' : 'bg-red-400/5 text-red-400 border-red-400/20'
            }`}
          >
            {message.type === 'success' ? 'SUCCESS: ' : 'CRITICAL_ERROR: '} {message.text}
          </motion.div>
        )}

        <button
          type="submit"
          disabled={isSaving}
          className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/20 disabled:opacity-20"
        >
          {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Synchronize Identity
        </button>
      </form>
    </div>
  );
}
