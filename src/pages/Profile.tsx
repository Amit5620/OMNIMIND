import { motion, AnimatePresence } from 'motion/react';
import { User, Mail, Shield, Smartphone, MapPin, Edit3, Camera, Activity, Calendar, Loader2, LayoutDashboard, MessageSquare, BookOpen, Settings as SettingsIcon, LogOut, Lock, Key } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../components/FirebaseProvider';
import { db, auth } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Link, useNavigate } from 'react-router-dom';
import { signOut, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { cn } from '../lib/utils';

export default function Profile() {
  const { user, profile, loading: authLoading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'info' | 'security' | 'activity'>('info');
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Security states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [securityStatus, setSecurityStatus] = useState({ type: '', message: '' });

  const [userData, setUserData] = useState({
    fullName: '',
    email: '',
    username: '',
    phone: '',
    dob: '',
    gender: '',
    location: '',
    bio: ''
  });

  useEffect(() => {
    if (profile) {
      setUserData({
        fullName: profile.fullName || '',
        email: profile.email || '',
        username: profile.username || '',
        phone: profile.phone || '',
        dob: profile.dob || '',
        gender: profile.gender || '',
        location: profile.location || 'Remote Workspace',
        bio: profile.bio || ''
      });
    } else if (user) {
      setUserData(prev => ({
        ...prev,
        fullName: user.displayName || '',
        email: user.email || ''
      }));
    }
  }, [profile, user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        fullName: userData.fullName,
        username: userData.username,
        phone: userData.phone,
        dob: userData.dob,
        gender: userData.gender,
        location: userData.location,
        bio: userData.bio,
        updatedAt: new Date().toISOString()
      });
      setIsEditing(false);
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !user.email) return;
    
    if (newPassword !== confirmPassword) {
      setSecurityStatus({ type: 'error', message: 'Nodes do not match: Passwords differ.' });
      return;
    }

    setSaving(true);
    setSecurityStatus({ type: '', message: '' });

    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      setSecurityStatus({ type: 'success', message: 'Neural gateway reset successful: Password updated.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setSecurityStatus({ type: 'error', message: err.message || 'Verification failure: Re-authentication failed.' });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen flex flex-col items-center justify-center space-y-4">
        <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Access Refused: Authorization Required</p>
        <Link to="/login" className="bg-primary px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-primary/20">Login Protocol</Link>
      </div>
    );
  }

  return (
    <div className="pb-24 pt-24 container mx-auto px-4 max-w-7xl space-y-16">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-12">
        <div className="space-y-6 text-center md:text-left flex-1">
          <motion.div
             initial={{ opacity: 0, scale: 0.9 }}
             animate={{ opacity: 1, scale: 1 }}
             className="inline-block px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-[10px] font-black text-primary uppercase tracking-[0.3em]"
          >
            Authenticated Identity
          </motion.div>
          <div className="space-y-2">
             <h1 className="text-5xl md:text-7xl font-display font-black tracking-tight leading-none">
               {userData.fullName || 'Neural Node'}
             </h1>
             <p className="text-gray-500 text-xl font-light">Account verified via {isAdmin ? 'Command Center' : 'OmniMind Nexus'}</p>
          </div>
        </div>
        
        <div className="flex flex-wrap justify-center gap-4 shrink-0">
          <button 
             onClick={handleLogout}
             className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-red-500/10 text-red-500 border border-red-500/20 font-black hover:bg-red-500/20 transition-all text-[10px] uppercase tracking-widest"
          >
             <LogOut className="h-4 w-4" /> Disconnect
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 h-full">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-3 space-y-8">
           <div className="glass-card p-10 text-center space-y-8 border-white/5 relative overflow-hidden group">
              <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative inline-block">
                 <div className="h-32 w-32 rounded-[40px] bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-5xl font-black text-white shadow-2xl relative z-10">
                   {userData.fullName ? userData.fullName[0] : 'U'}
                 </div>
                 <div className="absolute inset-0 bg-primary/20 blur-3xl animate-pulse scale-110" />
                 <div className="absolute -bottom-2 -right-2 h-10 w-10 bg-dark rounded-2xl border border-white/10 flex items-center justify-center z-20 shadow-xl cursor-not-allowed">
                    <Camera className="h-5 w-5 text-primary" />
                 </div>
              </div>
              <div className="space-y-1 relative z-10">
                 <h3 className="text-2xl font-black truncate">{userData.fullName || 'Anonymous'}</h3>
                 <p className="text-[10px] text-primary font-black uppercase tracking-[0.3em]">@{userData.username || 'matrix_user'}</p>
              </div>
           </div>

           <div className="glass-card p-4 space-y-1 border-white/5">
              {[
                { id: 'info', icon: User, label: 'Identity Pulse' },
                { id: 'security', icon: Lock, label: 'Security Firewall' },
                { id: 'activity', icon: Activity, label: 'System Logs' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    "flex items-center gap-4 p-4 w-full rounded-2xl transition-all font-black text-xs uppercase tracking-widest text-left",
                    activeTab === tab.id ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-gray-500 hover:bg-white/5 hover:text-gray-300"
                  )}
                >
                  <tab.icon className="h-4 w-4" /> {tab.label}
                </button>
              ))}
           </div>
        </div>

        {/* Dynamic Content Area */}
        <div className="lg:col-span-9">
           <AnimatePresence mode="wait">
              {activeTab === 'info' && (
                <motion.div 
                  key="info"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                   <div className="glass-card p-10 md:p-16 space-y-12 border-white/5 relative overflow-hidden">
                      <div className="flex items-center justify-between border-b border-white/5 pb-8 relative z-10">
                         <h3 className="text-xs font-black uppercase tracking-[0.5em] text-white/40">Neural Identity Credentials</h3>
                         <button 
                            onClick={isEditing ? handleSave : () => setIsEditing(true)}
                            disabled={saving}
                            className="flex items-center gap-2 px-6 py-2 rounded-xl bg-white text-dark font-black hover:scale-105 transition-all text-[10px] uppercase tracking-widest disabled:opacity-50"
                         >
                            {saving ? 'Syncing...' : isEditing ? 'Save Meta' : 'Recalibrate'}
                            {!saving && <Edit3 className="h-3 w-3" />}
                         </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 relative z-10">
                         <InfoItem 
                            label="Legal Entity" 
                            value={userData.fullName} 
                            isEditing={isEditing} 
                            onChange={v => setUserData({...userData, fullName: v})} 
                            icon={User}
                         />
                         <InfoItem label="Nexus Link" value={userData.email} isEditing={false} />
                         <InfoItem 
                            label="Comms Frequency" 
                            value={userData.phone} 
                            isEditing={isEditing} 
                            onChange={v => setUserData({...userData, phone: v})} 
                            icon={Smartphone}
                            placeholder="+91..."
                         />
                         <InfoItem 
                            label="Arrival Date" 
                            value={userData.dob} 
                            isEditing={isEditing} 
                            type="date"
                            onChange={v => setUserData({...userData, dob: v})} 
                            icon={Calendar}
                         />
                         <InfoItem 
                            label="Gender Node" 
                            value={userData.gender} 
                            isEditing={isEditing} 
                            onChange={v => setUserData({...userData, gender: v})} 
                            icon={Shield}
                            placeholder="Male / Female / Other"
                         />
                         <InfoItem 
                            label="Geolocation" 
                            value={userData.location} 
                            isEditing={isEditing} 
                            onChange={v => setUserData({...userData, location: v})} 
                            icon={MapPin}
                         />
                         <div className="md:col-span-2 space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-600 flex items-center gap-2">
                               <MessageSquare className="h-3 w-3" /> Digital Bio
                            </label>
                            {isEditing ? (
                               <textarea 
                                 rows={4}
                                 className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-sm text-white focus:border-primary focus:outline-none transition-all" 
                                 value={userData.bio} 
                                 onChange={e => setUserData({...userData, bio: e.target.value})} 
                                 placeholder="Initialize your cognitive brief..."
                               />
                            ) : (
                               <p className="text-gray-400 text-lg font-light italic leading-relaxed">
                                  {userData.bio || 'Neural node bio not initialized.'}
                               </p>
                            )}
                         </div>
                      </div>
                   </div>
                </motion.div>
              )}

              {activeTab === 'security' && (
                <motion.div 
                  key="security"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                   <div className="glass-card p-10 md:p-16 space-y-12 border-white/5">
                      <div className="border-b border-white/5 pb-8">
                         <h3 className="text-xs font-black uppercase tracking-[0.5em] text-white/40">Credential Firewall</h3>
                         <p className="text-gray-500 text-sm mt-4 font-medium italic">"Security is the bedrock of intelligence. Rotate your keys regularly."</p>
                      </div>

                      <form onSubmit={handleChangePassword} className="max-w-xl space-y-8">
                         {securityStatus.message && (
                            <div className={cn(
                              "p-6 rounded-2xl border text-xs font-black uppercase tracking-widest text-center",
                              securityStatus.type === 'error' ? "bg-red-500/10 border-red-500/20 text-red-500" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                            )}>
                               {securityStatus.message}
                            </div>
                         )}

                         <div className="space-y-6">
                            <SecurityInput 
                               label="Current Authentication Key" 
                               value={currentPassword} 
                               onChange={setCurrentPassword} 
                               placeholder="Authorize access..."
                            />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                               <SecurityInput 
                                  label="New Protocol Key" 
                                  value={newPassword} 
                                  onChange={setNewPassword} 
                                  placeholder="Initialize new node..."
                               />
                               <SecurityInput 
                                  label="Confirm Protocol Key" 
                                  value={confirmPassword} 
                                  onChange={setConfirmPassword} 
                                  placeholder="Validate sequence..."
                               />
                            </div>
                         </div>

                         <button 
                            type="submit"
                            disabled={saving}
                            className="w-full flex items-center justify-center gap-4 py-5 rounded-3xl bg-primary text-white font-black text-xs uppercase tracking-[0.3em] hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-primary/30 disabled:opacity-50"
                         >
                            {saving ? 'Processing Sequence...' : 'Update Neural Gate'}
                            {!saving && <Key className="h-4 w-4" />}
                         </button>
                      </form>
                   </div>
                </motion.div>
              )}

              {activeTab === 'activity' && (
                <motion.div 
                  key="activity"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                   <div className="glass-card p-10 md:p-16 border-white/5 space-y-12">
                      <div className="border-b border-white/5 pb-8">
                         <h3 className="text-xs font-black uppercase tracking-[0.5em] text-white/40">Event Stream Logs</h3>
                      </div>

                      <div className="space-y-6">
                         {[
                           { time: '18:32:05', event: 'Credential Recalibration', status: 'Success', loc: 'Global Server' },
                           { time: '14:05:22', event: 'Neural Workspace Sync', status: 'Processing', loc: 'Edge Node' },
                           { time: 'Yesterday', event: 'Cognitive Gateway Initialization', status: 'Complete', loc: 'Portal Beta' }
                         ].map((log, i) => (
                           <div key={i} className="flex items-center justify-between p-6 rounded-3xl bg-white/2 border border-white/5 hover:bg-white/5 transition-all group">
                              <div className="space-y-1">
                                 <p className="text-[10px] font-black text-primary uppercase tracking-widest">{log.time}</p>
                                 <h5 className="font-bold text-lg group-hover:text-primary transition-colors">{log.event}</h5>
                              </div>
                              <div className="text-right space-y-1">
                                 <div className="inline-block px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                                    {log.status}
                                 </div>
                                 <p className="text-[10px] text-gray-700 font-bold uppercase">{log.loc}</p>
                              </div>
                           </div>
                         ))}
                      </div>
                   </div>
                </motion.div>
              )}
           </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ label, value, isEditing, onChange, type = 'text', placeholder, icon: Icon }: any) {
  return (
    <div className="space-y-4">
      <label className="text-[10px] font-black uppercase tracking-widest text-gray-600 flex items-center gap-2 px-1">
        {Icon && <Icon className="h-3 w-3" />} {label}
      </label>
      {isEditing ? (
        <input 
          type={type}
          className="w-full bg-white/5 border border-white/10 [color-scheme:dark] rounded-2xl px-6 py-4 text-sm text-white focus:border-primary focus:bg-white/10 focus:outline-none transition-all font-medium" 
          value={value} 
          onChange={e => onChange(e.target.value)} 
          placeholder={placeholder}
        />
      ) : (
        <p className="font-black text-xl tracking-tight text-white/90 truncate bg-white/2 p-6 rounded-2xl border border-white/2 min-h-[72px] flex items-center">
          {value || 'Not Initialized'}
        </p>
      )}
    </div>
  );
}

function SecurityInput({ label, value, onChange, placeholder }: any) {
  return (
    <div className="space-y-4">
      <label className="text-[10px] font-black uppercase tracking-widest text-gray-600 px-1">{label}</label>
      <div className="relative group">
         <Lock className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-700 group-focus-within:text-primary transition-colors" />
         <input 
            type="password"
            className="w-full bg-white/5 border border-white/5 rounded-3xl py-5 pl-16 pr-6 text-sm text-white focus:border-primary/50 focus:bg-white/10 outline-none transition-all font-medium"
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
         />
      </div>
    </div>
  );
}

