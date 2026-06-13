import { motion } from 'motion/react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Brain, Mail, Lock, Facebook, ArrowRight, Loader2 } from 'lucide-react';
import { auth, db } from '../../lib/firebase';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, FacebookAuthProvider, OAuthProvider } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

export default function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await signInWithEmailAndPassword(auth, formData.email, formData.password);
      navigate('/');
    } catch (err: any) {
      console.error(err);
      // Map Firebase error codes to user-friendly messages
      const errorMessages: Record<string, string> = {
        'auth/invalid-email': 'Invalid email address. Please check your email.',
        'auth/user-disabled': 'This account has been disabled. Contact support.',
        'auth/user-not-found': 'No account found with this email. Please register first.',
        'auth/wrong-password': 'Incorrect password. Please try again.',
        'auth/invalid-credential': 'Invalid email or password. Please check your credentials.',
        'auth/invalid-api-key': 'Authentication error. Please contact support.',
        'auth/network-request-failed': 'Network error. Check your internet connection.',
        'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
        'auth/popup-closed-by-user': 'Sign-in window closed. Please try again.',
        'auth/cancelled-popup-request': 'Only one popup allowed. Please try again.',
        'auth/unauthorized-domain': 'This domain is not authorized. Add localhost to Firebase.',
        'auth/configuration-not-found': 'Google sign-in not configured. Enable it in Firebase Console.',
      };
      
      const errorCode = err.code || '';
      setError(errorMessages[errorCode] || err.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (providerName: string) => {
    setLoading(true);
    setError(null);
    try {
      let provider;
      if (providerName === 'google') {
        provider = new GoogleAuthProvider();
        // Add Google-specific scopes
        provider.addScope('profile');
        provider.addScope('email');
      } else if (providerName === 'facebook') {
        provider = new FacebookAuthProvider();
        provider.addScope('email');
        provider.addScope('public_profile');
      } else {
        provider = new OAuthProvider('microsoft.com');
      }

      // Set custom parameters to force account selection
      provider.setCustomParameters({
        prompt: 'select_account'
      });

      const result = await signInWithPopup(auth, provider);
      console.log('Social login success:', result.user);
      
      // Ensure profile exists in Firestore
      await setDoc(doc(db, 'users', result.user.uid), {
        fullName: result.user.displayName,
        email: result.user.email,
        username: result.user.email?.split('@')[0],
        role: 'user',
        createdAt: new Date().toISOString()
      }, { merge: true });
      
      navigate('/');
    } catch (err: any) {
      console.error('Social login error:', err);
      // Map Firebase error codes to user-friendly messages
      const errorMessages: Record<string, string> = {
        'auth/popup-closed-by-user': 'Sign-in cancelled. Please try again.',
        'auth/cancelled-popup-request': 'Multiple popups blocked. Please allow popups.',
        'auth/unauthorized-domain': 'This domain is not authorized. Add localhost to Firebase Console → Authentication → Settings → Authorized domains.',
        'auth/configuration-not-found': 'Google sign-in is not enabled. Go to Firebase Console → Authentication → Sign-in method → Enable Google.',
        'auth/network-request-failed': 'Network error. Check your internet connection and try again.',
        'auth/too-many-requests': 'Too many requests. Please wait a moment and try again.',
        'auth/account-exists-with-different-credential': 'An account already exists with this email but using a different sign-in method. Try email/password login.',
        'auth/operation-not-allowed': 'This sign-in method is not enabled. Contact support.',
        'auth/credential-already-in-use': 'This credential is already linked to another account.',
      };
      
      const errorCode = err.code || '';
      setError(errorMessages[errorCode] || err.message || "Social authentication failed. Please try again or use email login.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-20 flex items-center justify-center container mx-auto px-4">
      <div className="w-full max-w-lg relative">
        <div className="absolute -top-20 -left-20 w-80 h-80 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-8 md:p-12 relative z-10 border-white/5"
        >
          <div className="text-center space-y-4 mb-10">
            <Link to="/" className="inline-flex items-center gap-2 mb-4">
              <Brain className="h-10 w-10 text-primary neon-glow" />
              <span className="font-display text-2xl font-bold tracking-tight">OmniMind</span>
            </Link>
            <h1 className="text-3xl font-display font-bold">Resync Access</h1>
            <p className="text-gray-400">Continue your journey with Infinite AI.</p>
          </div>

          <form className="space-y-6" onSubmit={handleLogin}>
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl text-sm text-center">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1">Email Connection</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input 
                  name="email"
                  type="email" 
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 focus:outline-none focus:border-primary transition-all text-white" 
                  placeholder="name@nexus.ai" 
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Access Password</label>
                <Link to="/forgot-password" title="Forgot Password" className="text-[10px] text-primary hover:underline">Forgot Protocol?</Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input 
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 focus:outline-none focus:border-primary transition-all text-white" 
                  placeholder="••••••••" 
                  required
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="group w-full bg-primary py-4 rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="h-5 w-5 animate-spin" />}
              {loading ? 'Validating...' : 'Access Matrix'} 
              {!loading && <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />}
            </button>
          </form>

          <div className="mt-10 space-y-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-dark px-2 text-gray-500 tracking-widest">Social Sync</span></div>
            </div>

            <div className="grid grid-cols-3 gap-4">
               <button 
                 onClick={() => handleSocialLogin('google')}
                 disabled={loading}
                 className="flex items-center justify-center py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors disabled:opacity-50"
               >
                  <svg className="h-5 w-5" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
               </button>
               <button 
                 onClick={() => handleSocialLogin('microsoft')}
                 disabled={loading}
                 className="flex items-center justify-center py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors disabled:opacity-50"
               >
                  <svg className="h-5 w-5" viewBox="0 0 23 23"><path fill="#f3f3f3" d="M0 0h11v11H0z"/><path fill="#f3f3f3" d="M12 0h11v11H12z"/><path fill="#f3f3f3" d="M0 12h11v11H0z"/><path fill="#f3f3f3" d="M12 12h11v11H12z"/></svg>
               </button>
               <button 
                 onClick={() => handleSocialLogin('facebook')}
                 disabled={loading}
                 className="flex items-center justify-center py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors disabled:opacity-50"
               >
                  <Facebook className="h-5 w-5 text-blue-500 fill-blue-500" />
               </button>
            </div>

            <p className="text-center text-sm text-gray-500">
              New node in the system? <Link to="/register" className="text-primary hover:underline">Register Identity</Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
