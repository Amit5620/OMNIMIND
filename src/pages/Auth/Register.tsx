import { motion } from 'motion/react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Brain, Mail, Lock, User, Calendar, Shield, Loader2, MailOpen } from 'lucide-react';
import { cn } from '../../lib/utils';
import { auth, db } from '../../lib/firebase';
import { createUserWithEmailAndPassword, updateProfile, sendEmailVerification, reload } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

export default function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    username: '',
    phoneNumber: '',
    dob: '',
    gender: '',
    password: '',
    confirmPassword: '',
    terms: false
  });

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.terms) {
      setError("Please accept the terms and conditions");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Create the user account
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      // Send verification email
      await sendEmailVerification(user);
      
      setSuccess(`Verification email sent to ${formData.email}. Check your inbox and click the verification link.`);
      setStep(2);
    } catch (err: any) {
      console.error('Registration error:', err);
      if (err.code === 'auth/email-already-in-use') {
        setError("This email is already registered. Try logging in or use a different email.");
      } else if (err.code === 'auth/invalid-email') {
        setError("Invalid email address. Please check and try again.");
      } else if (err.code === 'auth/weak-password') {
        setError("Password is too weak. Use at least 6 characters.");
      } else {
        setError(err.message || "Failed to create account. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!auth.currentUser) {
      setError("Session expired. Please register again.");
      setStep(1);
      return;
    }

    setLoading(true);
    try {
      await sendEmailVerification(auth.currentUser);
      setSuccess("Verification email resent! Check your inbox.");
    } catch (err: any) {
      setError(err.message || "Failed to resend verification email.");
    }
    setLoading(false);
  };

  const handleCheckVerification = async () => {
    if (!auth.currentUser) {
      setError("Session expired. Please register again.");
      setStep(1);
      return;
    }

    setLoading(true);
    try {
      // Reload user to get latest verification status
      await reload(auth.currentUser);
      
      if (auth.currentUser?.emailVerified) {
        // Update profile with name
        await updateProfile(auth.currentUser, {
          displayName: formData.fullName
        });

        // Create user document in Firestore
        await setDoc(doc(db, 'users', auth.currentUser.uid), {
          fullName: formData.fullName,
          email: formData.email,
          username: formData.username,
          phone: formData.phoneNumber,
          dob: formData.dob,
          gender: formData.gender,
          role: 'user',
          emailVerified: true,
          createdAt: new Date().toISOString()
        });

        navigate('/');
      } else {
        setError("Email not verified yet. Please check your inbox and click the verification link.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to verify. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen py-20 flex items-center justify-center container mx-auto px-4">
      <div className="w-full max-w-2xl relative">
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
            <h1 className="text-3xl font-display font-bold">Create Account</h1>
            <p className="text-gray-400">Join the intelligence network of the future.</p>
          </div>

          <form className="space-y-6" onSubmit={handleRegister}>
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl text-sm text-center">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-500/10 border border-green-500/20 text-green-500 p-4 rounded-xl text-sm text-center">
                {success}
              </div>
            )}

            {/* Step 1: Registration Form */}
            {step === 1 && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }} 
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input name="fullName" value={formData.fullName} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 focus:outline-none focus:border-primary transition-all text-white" placeholder="Amit Kumar" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input name="email" type="email" value={formData.email} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 focus:outline-none focus:border-primary transition-all text-white" placeholder="amit@example.com" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1">Username</label>
                    <input name="username" value={formData.username} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-4 focus:outline-none focus:border-primary transition-all text-white" placeholder="amitkumar" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1">Phone (Optional)</label>
                    <div className="relative">
                      <input name="phoneNumber" type="tel" value={formData.phoneNumber} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-4 focus:outline-none focus:border-primary transition-all text-white" placeholder="+91 9876543210" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1">Date of Birth</label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input name="dob" type="date" value={formData.dob} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 focus:outline-none focus:border-primary transition-all text-white" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1">Gender</label>
                    <select name="gender" value={formData.gender} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-6 focus:outline-none focus:border-primary transition-all text-white appearance-none">
                      <option value="">Select...</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input name="password" type="password" value={formData.password} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 focus:outline-none focus:border-primary transition-all text-white" placeholder="••••••••" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 focus:outline-none focus:border-primary transition-all text-white" placeholder="••••••••" />
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/10 group cursor-pointer" onClick={() => setFormData({...formData, terms: !formData.terms})}>
                  <div className={cn("h-5 w-5 rounded border-2 transition-all flex items-center justify-center", formData.terms ? "bg-primary border-primary" : "border-gray-600")}>
                    {formData.terms && <Shield className="h-3 w-3 text-white" />}
                  </div>
                  <span className="text-sm text-gray-400">I accept the <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link></span>
                </div>

                <button 
                  type="submit"
                  disabled={!formData.terms || loading}
                  className="w-full bg-primary py-4 rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-2 text-white"
                >
                  {loading && <Loader2 className="h-5 w-5 animate-spin" />}
                  {loading ? 'Creating Account...' : 'Create Account'}
                </button>
              </motion.div>
            )}

            {/* Step 2: Email Verification Pending */}
            {step === 2 && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }} 
                animate={{ opacity: 1, x: 0 }}
                className="space-y-8"
              >
                <div className="text-center space-y-4">
                  <div className="h-20 w-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
                    <MailOpen className="h-10 w-10 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold">Verify Your Email</h3>
                    <p className="text-sm text-gray-400">
                      We've sent a verification link to<br/>
                      <span className="text-primary font-bold">{formData.email}</span>
                    </p>
                  </div>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl">
                  <p className="text-sm text-blue-400 text-center">
                    <strong>Next Steps:</strong><br/>
                    1. Check your email inbox<br/>
                    2. Click the verification link<br/>
                    3. Come back and click "Verify & Continue"
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  <button 
                    type="button"
                    onClick={handleCheckVerification}
                    disabled={loading}
                    className="w-full bg-green-600 py-4 rounded-xl font-bold hover:scale-[1.02] transition-all flex items-center justify-center gap-2 text-white"
                  >
                    {loading && <Loader2 className="h-5 w-5 animate-spin" />}
                    {loading ? 'Checking...' : 'Verify & Continue'}
                  </button>
                  
                  <button 
                    type="button"
                    onClick={handleResendVerification}
                    disabled={loading}
                    className="w-full border border-white/10 py-3 rounded-xl font-bold hover:bg-white/5 transition-all text-gray-400"
                  >
                    Resend Verification Email
                  </button>
                </div>

                <div className="text-center">
                  <button 
                    type="button"
                    onClick={() => {
                      setStep(1);
                      setError(null);
                      setSuccess(null);
                    }}
                    className="text-sm text-gray-500 hover:text-primary transition-colors"
                  >
                    ← Back to Registration
                  </button>
                </div>
              </motion.div>
            )}

            <div className="text-center text-sm text-gray-500">
              Already have an account? <Link to="/login" className="text-primary hover:underline">Login</Link>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}