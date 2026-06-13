import { motion } from 'motion/react';
import { MessageSquare, FileSearch, Image as ImageIcon, Youtube, Globe, Languages, Code, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';

const categories = [
  {
    name: 'AI Assistant',
    tools: [
      {
        id: 'chat',
        title: 'Chat AI (Pro)',
        desc: 'Advanced conversational intelligence capable of complex reasoning and deep context analysis.',
        icon: MessageSquare,
        color: 'from-blue-500 to-indigo-500',
        available: true,
      },
      {
        id: 'coding',
        title: 'Coding AI',
        desc: 'Specifically tuned for solving, refactoring, and explaining complex architectural code problems.',
        icon: Code,
        color: 'from-indigo-500 to-purple-600',
        available: true,
      }
    ]
  },
  {
    name: 'Content Intelligence',
    tools: [
      {
        id: 'summarize',
        title: 'Document Summarizer',
        desc: 'Upload PDFs or Docs and get instant, readable summaries with extracted key insights.',
        icon: FileSearch,
        color: 'from-blue-400 to-cyan-500',
        available: true,
      },
      {
        id: 'web',
        title: 'Website Summarizer',
        desc: 'Fetch and condense full website content from any URL to save massive research time.',
        icon: Globe,
        color: 'from-emerald-500 to-teal-500',
        available: true,
      },
      {
        id: 'youtube',
        title: 'YouTube Summarizer',
        desc: 'Paste a video URL to receive a high-level transcription and structured core summary.',
        icon: Youtube,
        color: 'from-red-500 to-rose-600',
        available: true,
      }
    ]
  },
  {
    name: 'Creative AI',
    tools: [
      {
        id: 'generate',
        title: 'Image Generation',
        desc: 'Turn your imagination into high-resolution digital art using next-gen latent diffusion models.',
        icon: ImageIcon,
        color: 'from-pink-500 to-rose-500',
        available: true,
      }
    ]
  },
  {
    name: 'Utility Tools',
    tools: [
      {
        id: 'translate',
        title: 'Translation Core',
        desc: 'Translate large complexity text between 100+ languages with perfect local context retention.',
        icon: Languages,
        color: 'from-orange-500 to-yellow-500',
        available: true,
      }
    ]
  }
];

export default function Services() {
  return (
    <div className="pb-24 pt-20 max-w-4xl mx-auto px-4 space-y-24 text-center">
      <div className="max-w-4xl space-y-6">
        <motion.div
           initial={{ opacity: 0, scale: 0.9 }}
           animate={{ opacity: 1, scale: 1 }}
           className="inline-block p-1 px-4 rounded-full bg-primary/10 border border-primary/20 text-xs font-black text-primary uppercase tracking-[0.4em] mb-4"
        >
          Neural Inventory
        </motion.div>
        <motion.h1 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-5xl md:text-8xl font-display font-black tracking-tighter leading-none"
        >
          Intelligence <span className="text-primary italic">Catalogue.</span>
        </motion.h1>
        <p className="text-gray-400 text-xl md:text-2xl font-light leading-relaxed max-w-2xl">
          Explore our collection of cutting-edge neural tools designed to enhance your digital throughput.
        </p>
      </div>

      <div className="space-y-32">
        {categories.map((category, catIdx) => (
          <div key={category.name} className="space-y-12">
            <div className="flex items-center gap-6">
               <h2 className="text-2xl md:text-3xl font-display font-black uppercase tracking-widest text-white/40">{category.name}</h2>
               <div className="h-px flex-1 bg-white/5" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto justify-items-center">
              {category.tools.map((tool, i) => (
                <motion.div 
                  key={tool.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="group relative p-[1px] rounded-[40px] bg-gradient-to-br from-white/5 to-white/10 hover:from-primary/20 hover:to-secondary/20 transition-all overflow-hidden shadow-2xl hover:shadow-3xl hover:shadow-primary/20 hover:-translate-y-2"
                >
                  <div className="relative h-full bg-gradient-to-b from-slate-900/50 to-black/80 p-10 rounded-[39px] space-y-8 flex flex-col justify-between hover:bg-transparent transition-all duration-500 group-hover:backdrop-blur-xl border border-white/10 hover:border-primary/30">
                    <div className="space-y-6">
                      <motion.div 
                        className={cn("inline-flex p-5 rounded-3xl bg-gradient-to-br text-white shadow-2xl group-hover:scale-110 transition-all duration-300", tool.color)}
                        whileHover={{ scale: 1.05, rotateY: 5 }}
                      >
                        <tool.icon className="h-10 w-10" />
                      </motion.div>
                      <div className="space-y-3">
                        <h3 className="text-3xl font-black">
                          {tool.title}
                        </h3>
                        <p className="text-gray-500 text-sm leading-relaxed font-medium">{tool.desc}</p>
                      </div>
                    </div>
                    
                          <Link 
                        to={tool.id === 'coding' ? `/workspace?tool=coding` : (tool.available ? `/workspace?tool=${tool.id}` : '#') }
                      className={cn(
                        "flex items-center justify-between w-full p-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all group-hover:shadow-xl",
                        tool.available 
                          ? "bg-gradient-to-r from-primary/90 to-secondary/90 text-white hover:from-primary hover:to-secondary hover:shadow-lg hover:shadow-primary/40 hover:scale-[1.02]" 
                          : "bg-white/10 border border-white/20 text-gray-400 cursor-not-allowed opacity-60"
                      )}
                    >
                      {tool.available ? 'Activate Protocol →' : 'Sync Pending'}
                      {tool.available && <ArrowUpRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />}
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom info section */}
      <div className="p-16 rounded-[80px] bg-gradient-to-tr from-dark to-primary/10 border border-white/5 flex flex-col lg:flex-row items-center justify-between gap-12 text-center lg:text-left">
         <div className="max-w-2xl space-y-6">
            <h2 className="text-4xl md:text-5xl font-display font-black leading-tight">Request Custom Neural <span className="text-primary italic">Architecture</span></h2>
            <p className="text-gray-400 text-lg">Our platform is constantly evolving. Suggest a feature or specific tool you'd like to see and our team will work on integrating it.</p>
         </div>
         <Link to="/contact" className="px-12 py-5 bg-white text-dark font-black rounded-3xl hover:scale-105 transition-all text-lg shadow-xl shrink-0">
           Submit Request
         </Link>
      </div>
    </div>
  );
}

