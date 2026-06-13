import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, ArrowLeft, Send, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { cn } from '../../lib/utils';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center pt-16 px-4 bg-dark relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-700" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <div className="glass-card p-10 space-y-10 border-white/5 bg-white/2 backdrop-blur-2xl">
          <div className="text-center space-y-4">
            <div className="inline-flex p-4 rounded-3xl bg-primary/10 text-primary mb-2">
              <Mail className="h-8 w-8" />
            </div>
            <h1 className="text-3xl font-display font-black tracking-tight uppercase">Nexus Recovery</h1>
            <p className="text-gray-500 text-sm">Initialize a secure gateway reset for your neural identity.</p>
          </div>

          {success ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-8 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-6"
            >
              <div className="flex justify-center">
                <Sparkles className="h-12 w-12 text-emerald-500 animate-bounce" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-emerald-500">Signal Transmitted</h3>
                <p className="text-sm text-gray-400">Please check your inbox for the recovery sequence instructions.</p>
              </div>
              <Link 
                to="/login"
                className="inline-flex items-center gap-2 text-primary font-black uppercase tracking-widest text-xs hover:gap-3 transition-all"
              >
                <ArrowLeft className="h-4 w-4" /> Return to Gateway
              </Link>
            </motion.div>
          ) : (
            <form onSubmit={handleReset} className="space-y-6">
              {error && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold text-center">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">Registered Neural Address</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-600 transition-colors group-focus-within:text-primary" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-gray-700 focus:border-primary/50 focus:bg-white/10 outline-none transition-all font-medium"
                    placeholder="nexus@omnimind.ia"
                  />
                </div>
              </div>

              <button
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/90 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-[0.2em] flex items-center justify-center gap-3"
              >
                {loading ? 'Transmitting...' : 'Send Reset Sequence'}
                {!loading && <Send className="h-4 w-4" />}
              </button>

              <div className="pt-6 border-t border-white/5 flex justify-center">
                <Link 
                  to="/login"
                  className="inline-flex items-center gap-2 text-gray-500 font-bold text-xs hover:text-white transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" /> Back to Authorization
                </Link>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
