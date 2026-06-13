import { motion, AnimatePresence } from 'motion/react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Brain, Menu, X, User, Settings, LogOut, ChevronDown, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../../lib/utils';
import { useAuth } from '../FirebaseProvider';
import { auth } from '../../lib/firebase';
import { signOut } from 'firebase/auth';

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [isServicesOpen, setIsServicesOpen] = useState(false);
  const { user, profile, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
    { name: 'How to Use', path: '/how-to-use' },
    { name: 'Blog', path: '/blog' },
    { name: 'Contact', path: '/contact' },
  ];

  const services = [
    { name: 'AI Chat', path: '/workspace?tool=chat' },
    { name: 'Document Summarizer', path: '/workspace?tool=summarize' },
    { name: 'Image Generator', path: '/workspace?tool=generate' },
    { name: 'Website Summarizer', path: '/workspace?tool=web' },
    { name: 'AI Coding', path: '/workspace?tool=coding' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-dark/60 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2">
          <motion.div
            animate={{ rotate: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 4 }}
          >
            <Brain className="h-8 w-8 text-primary neon-glow" />
          </motion.div>
          <span className="font-display text-xl font-bold tracking-tight text-white">
            Omni<span className="text-primary">Mind</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                location.pathname === link.path ? "text-primary" : "text-gray-400"
              )}
            >
              {link.name}
            </Link>
          ))}
          
          <div 
            className="relative"
            onMouseEnter={() => setIsServicesOpen(true)}
            onMouseLeave={() => setIsServicesOpen(false)}
          >
            <Link 
              to="/services"
              className={cn(
                "flex items-center gap-1 text-sm font-medium transition-colors hover:text-primary",
                location.pathname === '/services' ? "text-primary" : "text-gray-400"
              )}
            >
              Services <ChevronDown className={cn("h-4 w-4 transition-transform", isServicesOpen && "rotate-180")} />
            </Link>
            <AnimatePresence>
              {isServicesOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute left-0 mt-2 w-56 rounded-xl border border-white/10 bg-dark/95 p-2 shadow-2xl backdrop-blur-xl"
                >
                  {services.map((service) => (
                    <Link
                      key={service.path}
                      to={service.path}
                      className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm text-gray-400 hover:bg-white/5 hover:text-primary transition-all"
                    >
                      <Sparkles className="h-3 w-3 opacity-50" />
                      {service.name}
                    </Link>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </nav>

        <div className="flex items-center gap-4">
          {!user ? (
            <div className="hidden items-center gap-2 md:flex">
              <Link
                to="/login"
                className="rounded-full px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/5"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="rounded-full bg-primary px-6 py-2 text-sm font-medium text-white shadow-lg shadow-primary/25 transition-all hover:scale-105 hover:bg-primary/90"
              >
                Register
              </Link>
            </div>
          ) : (
            <div className="relative group">
               <button className="flex items-center gap-2 rounded-full border border-white/10 p-1 pr-3 transition-colors hover:bg-white/5">
                <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold overflow-hidden">
                  {profile?.username?.[0]?.toUpperCase() || user.displayName?.[0] || 'U'}
                </div>
                <div className="hidden lg:block text-left">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-none mb-1">User Node</p>
                  <p className="text-xs font-bold text-white leading-none truncate max-w-[80px]">{profile?.username || user.displayName?.split(' ')[0]}</p>
                </div>
                <ChevronDown className="h-4 w-4 text-gray-400" />
               </button>
               <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-xl border border-white/10 bg-dark/95 p-2 shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                  <div className="px-3 py-2 mb-2 border-b border-white/5">
                    <p className="text-xs font-bold text-white truncate">{user.email}</p>
                    <p className="text-[10px] text-primary font-bold uppercase mt-1">{isAdmin ? 'Administrator' : 'Standard Node'}</p>
                  </div>
                  <Link to="/profile" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-400 hover:bg-white/5 hover:text-white transition-colors">
                    <User className="h-4 w-4" /> Profile Matrix
                  </Link>
                  <Link to="/workspace" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-400 hover:bg-white/5 hover:text-white transition-colors">
                    <Brain className="h-4 w-4" /> Workspace
                  </Link>
                  {isAdmin && (
                    <Link to="/admin/blog" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-purple-400 hover:bg-purple-400/10 transition-colors">
                      <Sparkles className="h-4 w-4" /> Admin Panel
                    </Link>
                  )}
                  <Link to="/settings" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-400 hover:bg-white/5 hover:text-white transition-colors">
                    <Settings className="h-4 w-4" /> Configurations
                  </Link>
                  <div className="my-1 border-t border-white/5" />
                  <button 
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-400 hover:bg-red-400/10 transition-colors"
                  >
                    <LogOut className="h-4 w-4" /> De-authenticate
                  </button>
               </div>
            </div>
          )}

          <button
            className="md:hidden"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="h-6 w-6 text-primary" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-white/10 bg-dark md:hidden overflow-hidden"
          >
            <div className="space-y-1 px-4 py-6">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className="block py-3 text-lg font-medium text-gray-400 hover:text-primary"
                  onClick={() => setIsOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
              <div className="py-3">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Neural Services</p>
                {services.map((service) => (
                  <Link
                    key={service.path}
                    to={service.path}
                    className="block py-2 text-gray-400 hover:text-primary"
                    onClick={() => setIsOpen(false)}
                  >
                    {service.name}
                  </Link>
                ))}
              </div>
              {!user ? (
                <div className="grid grid-cols-2 gap-4 pt-4">
                  <Link
                    to="/login"
                    className="flex items-center justify-center rounded-xl border border-white/10 py-3 text-sm font-medium hover:bg-white/5"
                    onClick={() => setIsOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="flex items-center justify-center rounded-xl bg-primary py-3 text-sm font-medium shadow-lg shadow-primary/25"
                    onClick={() => setIsOpen(false)}
                  >
                    Register
                  </Link>
                </div>
              ) : (
                <div className="pt-4 border-t border-white/5 space-y-2">
                   <Link
                      to="/profile"
                      className="block py-3 text-gray-400"
                      onClick={() => setIsOpen(false)}
                    >
                      My Profile
                    </Link>
                    <button 
                      onClick={() => { handleLogout(); setIsOpen(false); }}
                      className="block py-3 text-red-500 font-bold"
                    >
                      Logout
                    </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
