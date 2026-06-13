import { motion } from 'motion/react';
import { Brain, Zap, Sparkles, Shield, ArrowRight, MessageSquare, FileText, Image as ImageIcon, Globe, Code, Layers, Quote, Cpu, Network } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import { useAuth } from '../components/FirebaseProvider';

const stats = [
  { label: 'Active Users', value: '500K+', icon: Globe },
  { label: 'AI Models', value: '25+', icon: Brain },
  { label: 'Neural Tokens', value: '1.2B', icon: Zap },
  { label: 'Safety Index', value: '99.9%', icon: Shield },
];

export default function Home() {
  const { user, profile } = useAuth();
  
  const userName = profile?.fullName?.split(' ')[0] || user?.displayName?.split(' ')[0] || 'Explorer';

  return (
    <div className="flex flex-col gap-24 pb-24 overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
        {/* Animated Background Effect */}
        <div className="absolute inset-0 z-0">
           <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
           <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-secondary/10 rounded-full blur-[100px] animate-bounce" style={{ animationDuration: '8s' }} />
           <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-150 contrast-150" />
           <div className="absolute inset-0 bg-gradient-to-b from-transparent via-dark/50 to-dark" />
        </div>

        <div className="container mx-auto px-4 relative z-10 text-center space-y-12">
          {user && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-3 px-6 py-2 bg-white/5 border border-white/10 rounded-full text-primary font-black text-xs uppercase tracking-[0.3em] backdrop-blur-xl"
            >
              <Sparkles className="h-4 w-4 animate-glow" /> Matrix Link Established: {userName}
            </motion.div>
          )}

          <div className="space-y-8 max-w-5xl mx-auto">
            <motion.h1 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-7xl md:text-9xl font-display font-black tracking-tighter leading-[0.85] text-white"
            >
              OmniMind <br/> 
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-blue-500 italic">Intelligence</span> <br/>
              <span className="text-3xl md:text-5xl tracking-widest uppercase font-light text-white/30">Beyond Boundaries</span>
            </motion.h1>
            
            <motion.div
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               transition={{ delay: 0.3 }}
               className="space-y-4"
            >
               <h3 className="text-xl md:text-2xl font-bold text-gray-300">Where Human Creativity Meets Artificial Intelligence</h3>
               <p className="text-gray-500 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
                 OmniMind is a unified AI intelligence platform designed to amplify human potential. It combines advanced AI capabilities into a seamless environment where ideas evolve into solutions instantly.
               </p>
            </motion.div>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-6"
          >
            <Link to={user ? "/workspace" : "/register"} className="group relative px-10 py-5 bg-primary rounded-2xl font-black text-xl shadow-[0_0_40px_rgba(168,85,247,0.4)] hover:shadow-[0_0_60px_rgba(168,85,247,0.6)] hover:scale-105 transition-all flex items-center gap-4 border border-white/10 overflow-hidden">
              <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
              <span className="relative z-10 flex items-center gap-3">Start Exploring <ArrowRight className="h-6 w-6 transition-transform group-hover:translate-x-2" /></span>
            </Link>
            <Link to="/workspace" className="group px-10 py-5 bg-white/5 border border-white/10 rounded-2xl font-bold hover:bg-white/10 transition-all flex items-center gap-3 backdrop-blur-md">
               <MessageSquare className="h-5 w-5 text-primary" /> Try AI Chat
            </Link>
          </motion.div>

          {/* Floating Neural Visual */}
          <div className="pt-20 opacity-30 select-none">
             <Network className="h-24 w-24 mx-auto text-primary animate-pulse blur-[1px]" />
          </div>
        </div>
      </section>

      {/* Future of AI Section */}
      <section className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
           <motion.div 
             initial={{ opacity: 0, x: -50 }}
             whileInView={{ opacity: 1, x: 0 }}
             className="space-y-8"
           >
              <div className="inline-block px-4 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-black uppercase tracking-widest">Future Paradigm</div>
              <h2 className="text-4xl md:text-6xl font-display font-black leading-tight">The Future is <br/> <span className="text-blue-500">Collaborative</span></h2>
              <p className="text-gray-400 text-lg leading-relaxed">
                The future is not about humans versus AI—it is about collaboration. OmniMind represents a new paradigm where artificial intelligence enhances decision-making, creativity, and productivity. From solving complex problems to generating innovative ideas, AI becomes your cognitive partner.
              </p>
              <div className="flex items-center gap-6 pt-4">
                 <div className="flex -space-x-3">
                    {[1,2,3,4].map(i => (
                       <div key={i} className="h-10 w-10 rounded-full border-2 border-dark bg-gray-800 flex items-center justify-center text-[10px] font-bold">U{i}</div>
                    ))}
                 </div>
                 <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Bridging the Neural Gap</p>
              </div>
           </motion.div>
           <div className="relative group">
              <div className="absolute inset-0 bg-primary/20 rounded-[60px] blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="glass-card aspect-square rounded-[60px] border-white/5 flex items-center justify-center relative z-10 overflow-hidden bg-gradient-to-br from-white/5 to-transparent">
                 <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-[400px] w-[400px] rounded-full border border-primary/20 animate-[spin_20s_linear_infinite]" />
                    <div className="absolute h-[300px] w-[300px] rounded-full border border-secondary/20 animate-[spin_15s_linear_infinite_reverse]" />
                 </div>
                 <Brain className="h-48 w-48 text-primary shadow-[0_0_50px_rgba(168,85,247,0.5)]" />
                 {/* Hologram labels */}
                 <div className="absolute top-1/4 right-10 bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/10 animate-float">
                    <p className="text-[10px] font-bold text-primary uppercase">Neural Sync</p>
                    <p className="text-xs">99.8% Efficiency</p>
                 </div>
              </div>
           </div>
        </div>
      </section>

      {/* Core Capabilities */}
      <section className="container mx-auto px-4 space-y-16">
        <div className="text-center space-y-4">
          <h2 className="text-4xl md:text-7xl font-display font-black tracking-tight uppercase italic">Core <span className="text-primary not-italic">Capabilities</span></h2>
          <p className="text-gray-500 max-w-2xl mx-auto font-medium">Modular intelligence designed to scale with your ambitions.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
           {[
             { title: 'AI Chat', desc: 'Intelligent conversation and complex reasoning.', icon: MessageSquare, color: 'text-blue-500' },
             { title: 'Multimodal AI', desc: 'Seamlessly process text, images, and documents.', icon: Layers, color: 'text-purple-500' },
             { title: 'Intelligent Automation', desc: 'Streamline workflows with autonomous agents.', icon: Cpu, color: 'text-emerald-500' },
             { title: 'Creative Generation', desc: 'Transform concepts into stunning visual assets.', icon: Sparkles, color: 'text-amber-500' }
           ].map((capability, i) => (
             <motion.div
               key={i}
               initial={{ opacity: 0, y: 20 }}
               whileInView={{ opacity: 1, y: 0 }}
               whileHover={{ y: -10, scale: 1.02 }}
               viewport={{ once: true }}
               className="glass-card p-10 space-y-6 border-white/5 hover:border-primary/30 transition-all group cursor-default"
             >
                <div className={cn("h-16 w-16 bg-white/5 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110", capability.color)}>
                   <capability.icon className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-black">{capability.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{capability.desc}</p>
             </motion.div>
           ))}
        </div>
      </section>

      {/* AI Prompt Showcase */}
      <section className="bg-white/[0.02] border-y border-white/5 py-32">
         <div className="container mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-10">
               <div className="space-y-4">
                  <h2 className="text-4xl md:text-5xl font-display font-black">Neural <span className="text-primary">Directives</span></h2>
                  <p className="text-gray-500">Sample prompts to trigger high-level intelligence output.</p>
               </div>
               <div className="space-y-4">
                  {[
                    "Summarize this research paper into key insights",
                    "Generate a startup idea using AI",
                    "Explain this code and optimize it",
                    "Create a futuristic UI design concept",
                    "Translate this into multiple languages"
                  ].map((prompt, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="p-5 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between group hover:bg-primary/10 hover:border-primary/20 transition-all cursor-pointer"
                    >
                       <p className="text-sm font-medium text-gray-300 italic group-hover:text-white">"{prompt}"</p>
                       <ArrowRight className="h-4 w-4 text-gray-600 group-hover:text-primary transition-transform group-hover:translate-x-1" />
                    </motion.div>
                  ))}
               </div>
            </div>
            <div className="relative">
               <div className="glass-card p-1 aspect-video rounded-3xl border-white/10 shadow-2xl overflow-hidden bg-dark">
                  <div className="h-full w-full bg-[#0a0a0a] rounded-[22px] flex flex-col">
                     <div className="p-4 border-b border-white/5 flex gap-2">
                        <div className="h-3 w-3 rounded-full bg-red-500/20" />
                        <div className="h-3 w-3 rounded-full bg-yellow-500/20" />
                        <div className="h-3 w-3 rounded-full bg-green-500/20" />
                     </div>
                     <div className="p-8 space-y-4 font-mono text-xs overflow-hidden">
                        <p className="text-primary tracking-widest">OMNIMIND_COMMAND_CENTER v4.0</p>
                        <p className="text-gray-500 animate-pulse">Initializing neural layer...</p>
                        <p className="text-white">&gt; Analyzing research paper 45B...</p>
                        <p className="text-gray-400">Result: Key insights extracted. 85% time reduction in reading confirmed.</p>
                        <p className="text-emerald-500">&gt; Status: Optimization Complete.</p>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* Platform Insights (Stats) */}
      <section className="container mx-auto px-4">
        <div className="text-center mb-16">
           <h2 className="text-2xl font-display font-black uppercase tracking-[0.4em] text-gray-500">Platform Insights</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { label: 'Active Neural Nodes', value: '500K+', target: 92, color: 'text-primary' },
            { label: 'Queries Processed', value: '1.2B+', target: 85, color: 'text-blue-500' },
            { label: 'AI Accuracy Rating', value: '99.9%', target: 99.9, color: 'text-emerald-500' }
          ].map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="glass-card p-10 space-y-6 border-white/5 text-center group"
            >
              <div className="text-5xl font-display font-black tracking-tighter group-hover:scale-110 transition-transform">{stat.value}</div>
              <div className="text-xs text-gray-600 uppercase tracking-widest font-black">{stat.label}</div>
              {/* Glowing progress indicator */}
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden shadow-inner">
                 <motion.div 
                    initial={{ width: 0 }}
                    whileInView={{ width: `${stat.target}%` }}
                    transition={{ duration: 2, ease: "easeOut" }}
                    className={cn("h-full bg-current shadow-[0_0_15px_currentColor]", stat.color)}
                 />
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Why OmniMind */}
      <section className="container mx-auto px-4 space-y-16 py-20 bg-primary/5 rounded-[60px] border border-primary/10">
         <h2 className="text-4xl text-center font-display font-black tracking-widest uppercase">Why OmniMind?</h2>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { t: 'Unified AI Ecosystem', d: 'All your favorite models and tools in one seamless dashboard.' },
              { t: 'Faster Workflows', d: 'Reduce friction between ideation and execution with lightning speed.' },
              { t: 'Smarter Decisions', d: 'Data-driven insights powered by the latest frontier intelligence.' },
              { t: 'Future-Ready Platform', d: 'Scaling with the rapid evolution of technology every single day.' }
            ].map((item, i) => (
              <div key={i} className="space-y-4 px-6">
                 <div className="h-8 w-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs">{i+1}</div>
                 <h4 className="text-xl font-bold">{item.t}</h4>
                 <p className="text-gray-500 text-sm leading-relaxed">{item.d}</p>
              </div>
            ))}
         </div>
      </section>

      {/* Final CTA */}
      <section className="pb-32 container mx-auto px-4">
         <motion.div 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="glass-card p-16 md:p-32 rounded-[80px] border-white/5 text-center space-y-12 relative overflow-hidden"
         >
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-blue-500/10" />
            <h2 className="text-4xl md:text-7xl font-display font-black leading-tight max-w-4xl mx-auto relative z-10">Step into the Future of <br/> <span className="text-primary italic">Intelligence</span></h2>
            <Link to="/register" className="relative z-10 inline-flex group items-center gap-4 bg-white text-dark px-12 py-6 rounded-3xl font-black text-2xl hover:scale-105 transition-all shadow-[0_0_50px_rgba(255,255,255,0.2)]">
               Go Beyond <ArrowRight className="h-8 w-8 text-primary transition-transform group-hover:translate-x-2" />
            </Link>
         </motion.div>
      </section>
    </div>
  );
}

