import { Brain, Facebook, Twitter, Instagram, Github, Mail, Phone, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-dark/50 py-12 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <Brain className="h-8 w-8 text-primary shadow-primary/20" />
              <span className="font-display text-xl font-bold tracking-tight">
                Omni<span className="text-primary">Mind</span>
              </span>
            </Link>
            <p className="text-sm text-gray-400">
              "Empowering Minds with Infinite AI Possibilities." Our mission is to bridge the gap between human creativity and artificial intelligence.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-gray-400 hover:text-primary transition-colors"><Facebook className="h-5 w-5" /></a>
              <a href="#" className="text-gray-400 hover:text-primary transition-colors"><Twitter className="h-5 w-5" /></a>
              <a href="#" className="text-gray-400 hover:text-primary transition-colors"><Instagram className="h-5 w-5" /></a>
              <a href="#" className="text-gray-400 hover:text-primary transition-colors"><Github className="h-5 w-5" /></a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="mb-6 font-display text-sm font-bold uppercase tracking-widest text-white">Platform</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li><Link to="/" className="hover:text-primary transition-colors">Home</Link></li>
              <li><Link to="/about" className="hover:text-primary transition-colors">About Us</Link></li>
              <li><Link to="/services" className="hover:text-primary transition-colors">AI Services</Link></li>
              <li><Link to="/blog" className="hover:text-primary transition-colors">Latest News</Link></li>
              <li><Link to="/how-to-use" className="hover:text-primary transition-colors">User Guide</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="mb-6 font-display text-sm font-bold uppercase tracking-widest text-white">Support</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li><Link to="/contact" className="hover:text-primary transition-colors">Contact Us</Link></li>
              <li><Link to="/help" className="hover:text-primary transition-colors">Help Center</Link></li>
              <li><Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
              <li><Link to="/faq" className="hover:text-primary transition-colors">FAQs</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="mb-6 font-display text-sm font-bold uppercase tracking-widest text-white">Contact</h4>
            <ul className="space-y-4 text-sm text-gray-400">
              <li className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-primary" />
                <span>omnimind@gmail.com</span>
              </li>
              <li className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-primary" />
                <span>+91 9382731364</span>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary" />
                <span>Operating Remotely (Available 24/7)</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-white/5 pt-8 text-center text-xs text-gray-500">
          <p>© {new Date().getFullYear()} OmniMind AI. All rights reserved. Designed for the Future.</p>
        </div>
      </div>
    </footer>
  );
}
