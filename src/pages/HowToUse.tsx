import { motion } from 'framer-motion';
import { BookOpen, MessageSquare, FileText, Globe, PlayCircle, Rocket, Zap, Check, Sparkles, PenTool, Image, Languages, BarChart3, Users, Calendar, Settings, Shield } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../lib/utils';

const guides = [
  {
    id: 'get-started',
    title: 'Getting Started',
    icon: Rocket,
    steps: [
      { t: 'Create Your Account', d: 'Sign up for free and create your personalized OmniMind profile.' },
      { t: 'Verify Your Email', d: 'Check your inbox for a verification link to activate your account.' },
      { t: 'Set Up Your Workspace', d: 'Customize your dashboard and explore the main features.' }
    ],
    bestPractices: "Start with a strong password and enable two-factor authentication for security."
  },
  {
    id: 'chat',
    title: 'AI Chat Assistant',
    icon: MessageSquare,
    steps: [
      { t: 'Access the Chat', d: 'Navigate to the Chat section from your dashboard.' },
      { t: 'Type Your Query', d: 'Ask questions, request help, or describe tasks in natural language.' },
      { t: 'Get Instant Responses', d: 'Receive intelligent answers, suggestions, and solutions.' }
    ],
    tips: [
      'Be specific about what you need',
      'Use follow-up questions to refine answers',
      'Experiment with different phrasings'
    ],
    bestPractices: "The more context you provide, the better the AI can assist you."
  },
  {
    id: 'workspace',
    title: 'Workspace Management',
    icon: Settings,
    steps: [
      { t: 'Create a New Workspace', d: 'Click "New Workspace" and give it a descriptive name.' },
      { t: 'Upload Files', d: 'Drag and drop documents, images, or data files into your workspace.' },
      { t: 'Organize Content', d: 'Use folders and tags to keep your projects organized.' }
    ],
    tips: [
      'Use workspaces for different projects',
      'Upload related files together for better AI context',
      'Regularly clean up unused files'
    ],
    bestPractices: "Keep your workspace focused on specific goals for maximum efficiency."
  },
  {
    id: 'summarization',
    title: 'Content Summarization',
    icon: FileText,
    steps: [
      { t: 'Select the Tool', d: 'Go to Services > Summarization.' },
      { t: 'Input Your Content', d: 'Paste text, upload a document, or provide a URL.' },
      { t: 'Generate Summary', d: 'Choose summary length and get a concise overview.' }
    ],
    tips: [
      'Use for long articles or reports',
      'Try different summary lengths',
      'Combine with translation for multilingual content'
    ],
    bestPractices: "Clear, well-structured input text produces the best summaries."
  },
  {
    id: 'translation',
    title: 'Language Translation',
    icon: Languages,
    steps: [
      { t: 'Choose Translation Service', d: 'Navigate to Services > Translation.' },
      { t: 'Enter Text or Upload', d: 'Input the text you want to translate.' },
      { t: 'Select Languages', d: 'Pick source and target languages, then translate.' }
    ],
    tips: [
      'Supports over 100 languages',
      'Maintains context and tone',
      'Use for documents or real-time chat'
    ],
    bestPractices: "Provide context for technical or specialized terminology."
  },
  {
    id: 'image-service',
    title: 'Image Generation & Editing',
    icon: Image,
    steps: [
      { t: 'Access Image Tools', d: 'Go to Services > Image Generation.' },
      { t: 'Describe Your Image', d: 'Write a detailed prompt for what you want to create.' },
      { t: 'Generate & Edit', d: 'Create images and use editing tools to refine them.' }
    ],
    tips: [
      'Be descriptive in your prompts',
      'Use style references (e.g., "in the style of Picasso")',
      'Experiment with variations'
    ],
    bestPractices: "Detailed prompts with specific styles yield better results."
  },
  {
    id: 'blog',
    title: 'Blog Management',
    icon: PenTool,
    steps: [
      { t: 'Access Blog Section', d: 'Navigate to the Blog area from your dashboard.' },
      { t: 'Create New Post', d: 'Click "New Post" and start writing or use AI assistance.' },
      { t: 'Publish & Manage', d: 'Edit, publish, and manage your blog posts.' }
    ],
    tips: [
      'Use AI to generate blog ideas',
      'Incorporate images and media',
      'Schedule posts for optimal timing'
    ],
    bestPractices: "Regular blogging builds audience and improves SEO."
  },
  {
    id: 'analytics',
    title: 'Analytics & Insights',
    icon: BarChart3,
    steps: [
      { t: 'View Dashboard', d: 'Check your main dashboard for usage statistics.' },
      { t: 'Analyze Performance', d: 'Review how your content and tools are performing.' },
      { t: 'Optimize Usage', d: 'Use insights to improve your workflow and productivity.' }
    ],
    tips: [
      'Monitor your most used features',
      'Track time saved with AI tools',
      'Set goals for content creation'
    ],
    bestPractices: "Regular review of analytics helps maximize tool benefits."
  }
];

export default function HowToUse() {
  const [activeGuide, setActiveGuide] = useState(guides[0].id);
  const currentGuide = guides.find(g => g.id === activeGuide)!;

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-64px)] mt-16 bg-dark overflow-hidden">
      {/* Sidebar navigation */}
      <aside className="w-full md:w-80 border-r border-white/5 bg-white/[0.01] p-6 space-y-8 overflow-y-auto">
        <div className="space-y-4">
          <div className="px-2">
             <h2 className="text-xl font-display font-bold flex items-center gap-2">
               <BookOpen className="h-5 w-5 text-primary" /> Training Manual
             </h2>
             <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mt-1">Operational Protocol v4.0</p>
          </div>
          <div className="space-y-1">
            {guides.map(g => (
              <button
                key={g.id}
                onClick={() => setActiveGuide(g.id)}
                className={cn(
                  "w-full flex items-center gap-3 p-4 rounded-2xl text-sm font-bold transition-all text-left",
                  activeGuide === g.id ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-gray-500 hover:bg-white/5 hover:text-gray-300"
                )}
              >
                <g.icon className="h-4 w-4" /> {g.title}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-primary/5 border border-primary/10 space-y-4">
           <div className="h-1 bg-primary w-8 rounded-full" />
           <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Efficiency Goal</p>
           <p className="text-sm italic text-gray-300 leading-relaxed">"Mastery of the interface results in a 400% increase in cognitive throughput."</p>
        </div>
      </aside>

      {/* Content area */}
      <main className="flex-1 overflow-y-auto p-8 md:p-16 lg:p-24 space-y-16">
        <motion.div 
          key={activeGuide}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="max-w-4xl space-y-16"
        >
           <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-black text-primary uppercase tracking-widest">Operational Guide</div>
              <h1 className="text-5xl md:text-7xl font-display font-black leading-tight tracking-tighter">{currentGuide.title}</h1>
              <p className="text-gray-500 text-xl font-light">Deep dive into the {currentGuide.title.toLowerCase()} protocol architecture.</p>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {currentGuide.steps.map((step, i) => (
                <div key={i} className="glass-card p-8 space-y-6 relative overflow-hidden group hover:border-primary/20 transition-all">
                  <div className="absolute top-0 right-0 p-4 font-display font-black text-5xl text-white/5 group-hover:text-primary/10 transition-colors">0{i+1}</div>
                  <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center">
                     <Check className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div className="space-y-2">
                     <h4 className="text-lg font-black tracking-tight">{step.t}</h4>
                     <p className="text-sm text-gray-500 leading-relaxed">{step.d}</p>
                  </div>
                </div>
              ))}
           </div>

           {currentGuide.tips && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                 <div className="glass-card p-10 space-y-6 border-blue-500/10 bg-blue-500/5">
                    <h3 className="text-xl font-bold flex items-center gap-3"><Sparkles className="h-5 w-5 text-blue-500" /> Expert Tips</h3>
                    <ul className="space-y-4">
                       {currentGuide.tips.map((tip, i) => (
                         <li key={i} className="flex gap-3 text-sm text-gray-400">
                            <span className="text-blue-500 font-bold">•</span> {tip}
                         </li>
                       ))}
                    </ul>
                 </div>
                 <div className="glass-card p-10 space-y-6 border-primary/10 bg-primary/5">
                    <div className="flex items-center gap-4">
                       <PlayCircle className="h-6 w-6 text-primary animate-pulse" />
                       <h2 className="text-xl font-display font-bold uppercase tracking-widest">Best Practice</h2>
                    </div>
                    <p className="text-gray-400 font-sans italic leading-relaxed">
                      "{currentGuide.bestPractices}"
                    </p>
                 </div>
              </div>
           )}

           {!currentGuide.tips && (
              <div className="p-10 glass-card bg-primary/5 border-primary/20 space-y-6">
                 <div className="flex items-center gap-4">
                    <PlayCircle className="h-6 w-6 text-primary animate-pulse" />
                    <h2 className="text-xl font-display font-bold uppercase tracking-widest text-primary">Best Practice Protocol</h2>
                 </div>
                 <p className="text-gray-400 font-sans italic leading-relaxed text-xl">
                   "{currentGuide.bestPractices}"
                 </p>
              </div>
           )}

           {/* How It Helps Section */}
           <motion.div 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.2 }}
             className="glass-card p-12 bg-gradient-to-r from-blue-500/5 to-purple-500/5 border-blue-500/20 space-y-8"
           >
              <h3 className="text-3xl font-display font-black text-center">How OmniMind Makes Life Easier</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {[
                   { icon: Zap, title: 'Saves Time', desc: 'Automate hours of research, writing, and editing with AI assistance.' },
                   { icon: Users, title: 'Boosts Productivity', desc: 'Unified platform eliminates switching between multiple tools and apps.' },
                   { icon: Sparkles, title: 'Enhances Creativity', desc: 'AI-generated ideas and content help overcome creative blocks.' },
                   { icon: Globe, title: 'Breaks Language Barriers', desc: 'Instant translation makes global communication effortless.' },
                   { icon: Image, title: 'Visual Content Creation', desc: 'Generate stunning images and graphics without design skills.' },
                   { icon: PenTool, title: 'Content Management', desc: 'Organize and publish blog posts with integrated writing tools.' }
                 ].map((benefit, i) => (
                   <div key={i} className="text-center space-y-4 p-6 rounded-2xl bg-white/5 hover:bg-white/10 transition-all">
                      <benefit.icon className="h-8 w-8 text-primary mx-auto" />
                      <h4 className="text-lg font-bold">{benefit.title}</h4>
                      <p className="text-sm text-gray-400 leading-relaxed">{benefit.desc}</p>
                   </div>
                 ))}
              </div>
           </motion.div>

           {/* Blog Benefits Section */}
           {currentGuide.id === 'blog' && (
             <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.3 }}
               className="glass-card p-12 bg-gradient-to-r from-green-500/5 to-emerald-500/5 border-green-500/20 space-y-8"
             >
                <h3 className="text-3xl font-display font-black text-center flex items-center justify-center gap-3">
                   <PenTool className="h-8 w-8 text-green-500" /> Blog Benefits
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-4">
                      <h4 className="text-xl font-bold text-green-500">For Content Creators:</h4>
                      <ul className="space-y-2 text-gray-400">
                         <li>• Generate blog post ideas instantly</li>
                         <li>• AI-assisted writing for faster content creation</li>
                         <li>• SEO optimization suggestions</li>
                         <li>• Automated social media sharing</li>
                      </ul>
                   </div>
                   <div className="space-y-4">
                      <h4 className="text-xl font-bold text-green-500">For Businesses:</h4>
                      <ul className="space-y-2 text-gray-400">
                         <li>• Build thought leadership and authority</li>
                         <li>• Increase website traffic and engagement</li>
                         <li>• Content repurposing for multiple platforms</li>
                         <li>• Analytics to track reader interests</li>
                      </ul>
                   </div>
                </div>
             </motion.div>
           )}

           <div className="glass-card p-12 bg-emerald-500/5 border-emerald-500/20 text-center space-y-6">
              <h3 className="text-2xl font-black">Strategic Benefits</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                 {[
                   { t: 'Saves Time', d: '90% efficiency gain' },
                   { t: 'Productivity', d: 'Unified workflow' },
                   { t: 'Creativity', d: 'AI-assisted generation' },
                   { t: 'Complexity', d: 'Zero friction' }
                 ].map((b, i) => (
                   <div key={i} className="space-y-1">
                      <p className="text-sm font-bold text-white leading-tight">{b.t}</p>
                      <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest">{b.d}</p>
                   </div>
                 ))}
              </div>
           </div>
        </motion.div>
      </main>
    </div>
  );
}

