import { motion, AnimatePresence } from 'motion/react';
import { Settings as SettingsIcon, Bell, Shield, Eye, Moon, Sun, Globe, Zap, LogOut, ChevronRight, Check, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';

export default function Settings() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('general');
  const [theme, setTheme] = useState('dark');
  const [notifications, setNotifications] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      navigate('/');
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const sections = [
    { id: 'general', label: 'Neural Core', icon: SettingsIcon, description: 'Basic workspace configurations' },
    { id: 'notifications', label: 'Neural Pulse', icon: Bell, description: 'Real-time sync alerts' },
    { id: 'security', label: 'Security Protocols', icon: Shield, description: 'Identity protection systems' },
    { id: 'appearance', label: 'Visual Interface', icon: Eye, description: 'Aesthetic recalibration' },
  ];

  return (
    <div className="pb-24 pt-20 container mx-auto px-4 max-w-6xl">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <aside className="w-full md:w-72 space-y-2">
          <div className="mb-8 px-4">
             <h2 className="text-2xl font-black font-display tracking-tight">Portal <span className="text-primary italic">Config</span></h2>
             <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mt-2">v1.2.0 Stable Build</p>
          </div>
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={cn(
                "w-full flex items-center justify-between p-4 rounded-2xl transition-all group",
                activeSection === s.id ? "bg-primary/10 border border-primary/20 text-white" : "text-gray-500 hover:bg-white/5 hover:text-gray-300"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-xl transition-all", activeSection === s.id ? "bg-primary text-white shadow-lg shadow-primary/30" : "bg-white/5")}>
                   <s.icon className="h-4 w-4" />
                </div>
                <div className="text-left">
                   <p className="text-sm font-bold leading-none mb-1">{s.label}</p>
                   <p className="text-[10px] opacity-60 leading-none">{s.description}</p>
                </div>
              </div>
              <ChevronRight className={cn("h-4 w-4 opacity-0 transition-all", activeSection === s.id && "opacity-100 translate-x-1")} />
            </button>
          ))}
          <div className="pt-4 border-t border-white/5 mt-4">
             <button 
                onClick={handleLogout}
                disabled={loading}
                className="w-full flex items-center gap-3 p-4 rounded-xl text-sm font-bold text-red-500 hover:bg-red-500/10 transition-all"
             >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
                {loading ? 'De-authenticating...' : 'De-authenticate Node'}
             </button>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="glass-card p-8 md:p-12 border-white/5 shadow-2xl h-full min-h-[500px]"
            >
              {activeSection === 'general' && (
                <div className="space-y-8">
                  <header className="border-b border-white/5 pb-6">
                    <h3 className="text-xl font-bold flex items-center gap-3"><Globe className="h-5 w-5 text-primary" /> Intelligence Region</h3>
                    <p className="text-sm text-gray-500 mt-2">Configure how OmniMind interacts with your local ecosystem.</p>
                  </header>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                      <div className="space-y-1">
                        <p className="text-sm font-bold">Automatic Localization</p>
                        <p className="text-xs text-gray-600">Sync interface with your geospatial coordinates.</p>
                      </div>
                      <div className="h-6 w-12 bg-primary rounded-full relative cursor-pointer shadow-inner">
                        <div className="absolute right-1 top-1 h-4 w-4 bg-white rounded-full shadow-lg" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                      <div className="space-y-1">
                        <p className="text-sm font-bold">Neural Cache</p>
                        <p className="text-xs text-gray-600">Store conversation memory on local substrate.</p>
                      </div>
                      <div className="h-6 w-12 bg-white/10 rounded-full relative cursor-pointer">
                        <div className="absolute left-1 top-1 h-4 w-4 bg-gray-500 rounded-full" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'appearance' && (
                <div className="space-y-8">
                  <header className="border-b border-white/5 pb-6">
                    <h3 className="text-xl font-bold flex items-center gap-3"><Zap className="h-5 w-5 text-amber-500" /> Interface Aesthetic</h3>
                    <p className="text-sm text-gray-500 mt-2">Choose your preferred visual synchronization mode.</p>
                  </header>
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => setTheme('dark')}
                      className={cn(
                        "p-6 rounded-2xl border-2 transition-all text-center space-y-4",
                        theme === 'dark' ? "border-primary bg-primary/10" : "border-white/5 bg-white/5 hover:bg-white/10"
                      )}
                    >
                      <Moon className={cn("h-10 w-10 mx-auto", theme === 'dark' ? "text-primary" : "text-gray-600")} />
                      <p className="text-sm font-bold uppercase tracking-widest">Dark Protocol</p>
                      {theme === 'dark' && <div className="h-2 w-2 bg-primary rounded-full mx-auto" />}
                    </button>
                    <button 
                      onClick={() => setTheme('light')}
                      className={cn(
                        "p-6 rounded-2xl border-2 transition-all text-center space-y-4 opacity-50 cursor-not-allowed",
                        theme === 'light' ? "border-primary bg-primary/10" : "border-white/5 bg-white/5"
                      )}
                    >
                      <Sun className="h-10 w-10 mx-auto text-gray-600" />
                      <p className="text-sm font-bold uppercase tracking-widest text-gray-600">Light Override</p>
                      <p className="text-[10px] text-gray-700">Restricted Utility</p>
                    </button>
                  </div>
                </div>
              )}

              {activeSection === 'notifications' && (
                <div className="space-y-8">
                  <header className="border-b border-white/5 pb-6">
                    <h3 className="text-xl font-bold flex items-center gap-3"><Bell className="h-5 w-5 text-rose-500" /> Neural Pulse Alerts</h3>
                    <p className="text-sm text-gray-500 mt-2">Manage how the system communicates critical events.</p>
                  </header>
                  <div className="space-y-4">
                    {[
                      { id: 'messages', label: 'Message Sync', desc: 'When AI generates a substantial insight' },
                      { id: 'security', label: 'Security Breaches', desc: 'Unauthorized access attempts from unknown nodes' },
                      { id: 'updates', label: 'Ecosystem Logs', desc: 'Major updates to the neural core architecture' }
                    ].map(item => (
                      <div key={item.id} className="flex items-center justify-between p-6 bg-white/5 rounded-2xl border border-white/5">
                        <div className="space-y-1">
                          <p className="text-sm font-bold">{item.label}</p>
                          <p className="text-[10px] text-gray-600 uppercase font-black">{item.desc}</p>
                        </div>
                        <div 
                          onClick={() => setNotifications(!notifications)}
                          className={cn(
                            "h-6 w-11 rounded-full relative cursor-pointer transition-all shadow-inner",
                            notifications ? "bg-emerald-500" : "bg-white/10"
                          )}
                        >
                          <div className={cn("absolute top-1 h-4 w-4 bg-white rounded-full shadow-lg transition-all", notifications ? "right-1" : "left-1")} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeSection === 'security' && (
                <div className="space-y-8 text-center py-12">
                   <Shield className="h-20 w-20 text-emerald-500 mx-auto opacity-30 blur-[1px]" />
                   <div className="space-y-2">
                      <h3 className="text-2xl font-black">Identity Shield Active</h3>
                      <p className="text-sm text-gray-500 max-w-md mx-auto">Your connection is currently protected by RSA-4096 Level encryption. No manual overrides necessary.</p>
                   </div>
                   <div className="flex justify-center gap-3 pt-6">
                      <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-black uppercase tracking-[0.2em] rounded-full">Secure Node</div>
                      <div className="px-4 py-2 bg-blue-500/10 border border-blue-500/20 text-blue-500 text-[10px] font-black uppercase tracking-[0.2em] rounded-full">Encrypted Pulse</div>
                   </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
