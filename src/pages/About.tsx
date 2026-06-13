import { motion } from 'framer-motion';
import { Target, Rocket, Lightbulb, Users, ShieldCheck, Heart, Brain, Shield } from 'lucide-react';

const sections = [
  {
    icon: Target,
    title: 'Our Vision',
    desc: 'At OmniMind, we believe that artificial intelligence should not just automate tasks, but amplify human intelligence. Our vision is a world where everyone has a dedicated AI companion that understands their goals and helps them achieve their peak potential.'
  },
  {
    icon: Rocket,
    title: 'Our Journey',
    desc: 'Started in 2026, OmniMind was born from the need for a unified AI ecosystem. We saw users jumping between dozens of tabs and tools—summarizers here, chat there, image gen elsewhere. We decided to build one platform to rule them all.'
  },
  {
    icon: Lightbulb,
    title: 'The Gap We Fill',
    desc: 'Most AI tools are fragmented. We fill the gap of "Contextual Intelligence." By allowing you to upload files, links, and documents into a single workspace, OmniMind remembers what you are working on, making every interaction smarter.'
  }
];

const benefits = [
  { title: "Efficiency", desc: "Save hours of manual research with our instant summarization tools." },
  { title: "Creativity", desc: "Break through writer's block with intelligent suggestions and art generation." },
  { title: "Accessibility", desc: "Complex technology made easy with a simple, futuristic chat interface." },
  { title: "Global Reach", desc: "Translate and understand content from any language in real-time." }
];export default function About() {
  return (
    <div className="pb-24 space-y-32">
      {/* Hero */}
      <section className="pt-32 text-center container mx-auto px-4 max-w-5xl space-y-8">
        <motion.div
           initial={{ opacity: 0, scale: 0.9 }}
           animate={{ opacity: 1, scale: 1 }}
           className="inline-block p-1 px-4 rounded-full bg-primary/10 border border-primary/20 text-xs font-black text-primary uppercase tracking-[0.4em] mb-4"
        >
          Neural Legacy
        </motion.div>
        <h1 className="text-5xl md:text-8xl font-display font-black tracking-tighter leading-none">Intelligence Without <span className="text-primary italic">Friction.</span></h1>
        <p className="text-gray-400 text-lg md:text-2xl max-w-3xl mx-auto leading-relaxed font-light">
          OmniMind is more than a platform—it is a cognitive partner designed to bridge the gap between human imagination and digital execution.
        </p>
      </section>

      {/* Vision & Journey Split */}
      <section className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-8">
         <motion.div 
           initial={{ opacity: 0, x: -20 }}
           whileInView={{ opacity: 1, x: 0 }}
           className="glass-card p-12 space-y-6 border-white/5 bg-gradient-to-br from-primary/5 to-transparent"
         >
            <h2 className="text-3xl font-display font-black flex items-center gap-3"><Target className="h-8 w-8 text-primary" /> Our Vision</h2>
            <p className="text-gray-400 leading-relaxed text-lg">
              OmniMind envisions a world where AI augments human intelligence rather than replacing it. The goal is to create tools that empower individuals to think faster, create better, and solve problems more efficiently. 
            </p>
         </motion.div>
         <motion.div 
           initial={{ opacity: 0, x: 20 }}
           whileInView={{ opacity: 1, x: 0 }}
           className="glass-card p-12 space-y-6 border-white/5 bg-gradient-to-br from-blue-500/5 to-transparent"
         >
            <h2 className="text-3xl font-display font-black flex items-center gap-3"><Rocket className="h-8 w-8 text-blue-500" /> Our Journey</h2>
            <p className="text-gray-400 leading-relaxed text-lg">
              OmniMind was born from the realization that AI tools are fragmented. Users switch between platforms, losing time and context. We set out to build a unified intelligence layer that integrates everything into one seamless experience.
            </p>
         </motion.div>
      </section>

      {/* The Problem Section */}
      <section className="container mx-auto px-4 py-20 bg-white/[0.02] border-y border-white/5">
         <div className="max-w-4xl mx-auto space-y-16">
            <div className="text-center space-y-4">
               <h2 className="text-4xl md:text-5xl font-display font-black uppercase text-red-500/50">The Fragmentation Barrier</h2>
               <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Why we had to build something different</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
               {[
                 { t: 'Fragmented AI tools', d: 'Dozens of tabs, disconnected contexts, and mental exhaustion.' },
                 { t: 'Inefficient workflows', d: 'Struggling to find the right prompt or tool for the specific task.' },
                 { t: 'Lack of integration', d: 'Your data lives in silos, never benefiting from cross-tool intelligence.' }
               ].map((p, i) => (
                 <div key={i} className="space-y-4">
                    <div className="h-1 bg-red-500/20 w-12 mx-auto" />
                    <h4 className="text-xl font-bold">{p.t}</h4>
                    <p className="text-sm text-gray-500 leading-relaxed">{p.d}</p>
                 </div>
               ))}
            </div>
         </div>
      </section>

      {/* Our Solution */}
      <section className="container mx-auto px-4 max-w-6xl">
         <div className="glass-card p-12 md:p-20 border-emerald-500/20 bg-emerald-500/5 flex flex-col md:flex-row gap-16 items-center">
            <div className="space-y-8 flex-1">
               <h2 className="text-4xl md:text-5xl font-display font-black">Our <span className="text-emerald-500 italic">Solution</span></h2>
               <p className="text-gray-400 text-lg">OmniMind provides a central nervous system for your digital workspace.</p>
               <ul className="space-y-4">
                  {[
                    "Unified AI interface with all major models",
                    "Seamless tool integration (summarizers, generators, coders)",
                    "Real-time intelligence based on your active context"
                  ].map((s, i) => (
                    <li key={i} className="flex items-center gap-4 text-gray-300 font-bold">
                       <ShieldCheck className="h-6 w-6 text-emerald-500" /> {s}
                    </li>
                  ))}
               </ul>
            </div>
            <div className="flex-1 text-center">
               <div className="relative inline-block">
                  <div className="absolute inset-0 bg-emerald-500/20 blur-3xl animate-pulse" />
                  <Brain className="h-48 w-48 text-emerald-500 relative z-10" />
               </div>
            </div>
         </div>
      </section>

      {/* How We Help */}
      <section className="container mx-auto px-4 py-20 space-y-16">
         <h2 className="text-4xl text-center font-display font-black tracking-widest uppercase italic">Neural <span className="text-primary not-italic">Augmentation</span></h2>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { t: 'Automate repetitive tasks', d: 'Free your mind from mundane formatting and basic data entry.' },
              { t: 'Enhance creativity', d: 'Use AI as a brainstorming partner to break through any block.' },
              { t: 'Provide instant insights', d: 'Analyze massive datasets or documents in seconds, not hours.' },
              { t: 'Reduce complexity', d: 'Transform complex problems into manageable step-by-step solutions.' }
            ].map((item, i) => (
              <div key={i} className="glass-card p-8 border-white/5 space-y-6 group hover:bg-white/5 transition-all">
                 <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <Heart className="h-5 w-5" />
                 </div>
                 <h4 className="text-xl font-bold leading-tight">{item.t}</h4>
                 <p className="text-gray-500 text-sm leading-relaxed">{item.d}</p>
              </div>
            ))}
         </div>
      </section>

      {/* Our Mission & Values */}
      <section className="container mx-auto px-4 py-20 space-y-16">
         <div className="text-center space-y-4">
            <h2 className="text-4xl md:text-6xl font-display font-black uppercase tracking-widest">Our <span className="text-primary italic">Mission</span></h2>
            <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Guiding principles that drive us</p>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Shield, title: 'Trust & Security', desc: 'We prioritize your data privacy and security above all else, ensuring every interaction is safe and confidential.' },
              { icon: Users, title: 'Accessibility', desc: 'AI should be for everyone. We make powerful technology simple and accessible to users of all skill levels.' },
              { icon: Heart, title: 'Human-Centric Design', desc: 'Our tools are designed to augment human capabilities, not replace them, fostering creativity and innovation.' }
            ].map((value, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="glass-card p-8 space-y-6 border-white/5 hover:border-primary/20 transition-all"
              >
                 <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <value.icon className="h-6 w-6" />
                 </div>
                 <h4 className="text-xl font-bold">{value.title}</h4>
                 <p className="text-gray-400 text-sm leading-relaxed">{value.desc}</p>
              </motion.div>
            ))}
         </div>
      </section>

      {/* Team Section */}
      <section className="container mx-auto px-4 py-20 bg-white/[0.02] border-y border-white/5">
         <div className="max-w-6xl mx-auto space-y-16">
            <div className="text-center space-y-4">
               <h2 className="text-4xl md:text-5xl font-display font-black">Meet the <span className="text-primary italic">Team</span></h2>
               <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">The minds behind OmniMind</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
               {[
                 { name: 'Alex Chen', role: 'CEO & Co-Founder', desc: 'Former AI researcher at Google, passionate about democratizing AI technology.' },
                 { name: 'Sarah Johnson', role: 'CTO & Co-Founder', desc: 'Ex-Microsoft engineer with 15+ years in scalable system architecture.' },
                 { name: 'Marcus Rodriguez', role: 'Head of AI', desc: 'PhD in Machine Learning, specializes in conversational AI and natural language processing.' },
                 { name: 'Emily Zhang', role: 'Product Designer', desc: 'Award-winning UX designer focused on intuitive AI interfaces.' },
                 { name: 'David Kim', role: 'Engineering Lead', desc: 'Full-stack developer with expertise in cloud infrastructure and security.' },
                 { name: 'Lisa Patel', role: 'Community Manager', desc: 'Ensures our platform meets user needs and fosters a supportive community.' }
               ].map((member, i) => (
                 <motion.div 
                   key={i}
                   initial={{ opacity: 0, scale: 0.9 }}
                   whileInView={{ opacity: 1, scale: 1 }}
                   transition={{ delay: i * 0.1 }}
                   className="glass-card p-8 space-y-4 text-center border-white/5"
                 >
                    <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary/20 to-blue-500/20 mx-auto flex items-center justify-center">
                       <Users className="h-10 w-10 text-primary" />
                    </div>
                    <h4 className="text-lg font-bold">{member.name}</h4>
                    <p className="text-primary text-sm font-semibold">{member.role}</p>
                    <p className="text-gray-400 text-xs leading-relaxed">{member.desc}</p>
                 </motion.div>
               ))}
            </div>
         </div>
      </section>

      {/* Technology Stack */}
      <section className="container mx-auto px-4 py-20 space-y-16">
         <div className="text-center space-y-4">
            <h2 className="text-4xl md:text-5xl font-display font-black">Powered by <span className="text-primary italic">Innovation</span></h2>
            <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Our technology foundation</p>
         </div>
         <div className="glass-card p-12 border-primary/20 bg-primary/5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
               {[
                 { name: 'Advanced AI Models', desc: 'Integration with leading AI providers like Groq, Gemini, and OpenAI' },
                 { name: 'Cloud Infrastructure', desc: 'Scalable, secure cloud architecture with Firebase and Cloudinary' },
                 { name: 'Real-time Processing', desc: 'Instant responses and live collaboration features' },
                 { name: 'Cross-platform Support', desc: 'Works seamlessly on all devices and browsers' }
               ].map((tech, i) => (
                 <div key={i} className="space-y-2">
                    <h4 className="text-lg font-bold">{tech.name}</h4>
                    <p className="text-gray-400 text-sm">{tech.desc}</p>
                 </div>
               ))}
            </div>
         </div>
      </section>

      {/* Company Statistics */}
      <section className="container mx-auto px-4 py-20 bg-gradient-to-r from-primary/5 to-blue-500/5 border-y border-white/5">
         <div className="max-w-6xl mx-auto space-y-16">
            <div className="text-center space-y-4">
               <h2 className="text-4xl md:text-6xl font-display font-black">By the <span className="text-primary italic">Numbers</span></h2>
               <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Our impact in the AI landscape</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
               {[
                 { number: '50K+', label: 'Active Users', desc: 'Professionals using OmniMind daily' },
                 { number: '10M+', label: 'AI Interactions', desc: 'Conversations processed monthly' },
                 { number: '99.9%', label: 'Uptime', desc: 'Reliable service availability' },
                 { number: '150+', label: 'Countries', desc: 'Global user base worldwide' }
               ].map((stat, i) => (
                 <motion.div 
                   key={i}
                   initial={{ opacity: 0, scale: 0.8 }}
                   whileInView={{ opacity: 1, scale: 1 }}
                   transition={{ delay: i * 0.1 }}
                   className="text-center space-y-4 p-8 glass-card border-white/5"
                 >
                    <div className="text-4xl md:text-6xl font-display font-black text-primary">{stat.number}</div>
                    <h4 className="text-xl font-bold">{stat.label}</h4>
                    <p className="text-gray-400 text-sm">{stat.desc}</p>
                 </motion.div>
               ))}
            </div>
         </div>
      </section>

      {/* User Testimonials */}
      <section className="container mx-auto px-4 py-20 space-y-16">
         <div className="text-center space-y-4">
            <h2 className="text-4xl md:text-5xl font-display font-black">What Our <span className="text-primary italic">Users Say</span></h2>
            <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Real experiences from real users</p>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { 
                name: 'Sarah Mitchell', 
                role: 'Content Creator', 
                quote: 'OmniMind has revolutionized how I create content. What used to take hours now takes minutes, and the quality is incredible.',
                avatar: 'SM'
              },
              { 
                name: 'Dr. James Chen', 
                role: 'Research Scientist', 
                quote: 'The summarization and translation features have been game-changers for my international research collaborations.',
                avatar: 'JC'
              },
              { 
                name: 'Maria Rodriguez', 
                role: 'Business Analyst', 
                quote: 'OmniMind helps me analyze complex datasets and generate insights that drive our company strategy forward.',
                avatar: 'MR'
              }
            ].map((testimonial, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="glass-card p-8 space-y-6 border-white/5"
              >
                 <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                       {testimonial.avatar}
                    </div>
                    <div>
                       <h4 className="font-bold">{testimonial.name}</h4>
                       <p className="text-primary text-sm">{testimonial.role}</p>
                    </div>
                 </div>
                 <blockquote className="text-gray-400 italic leading-relaxed">
                   "{testimonial.quote}"
                 </blockquote>
              </motion.div>
            ))}
         </div>
      </section>

      {/* Our Commitment */}
      <section className="container mx-auto px-4 py-20 bg-white/[0.02] border-y border-white/5">
         <div className="max-w-4xl mx-auto space-y-16">
            <div className="text-center space-y-4">
               <h2 className="text-4xl md:text-5xl font-display font-black">Our <span className="text-primary italic">Commitment</span></h2>
               <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Building the future of AI responsibly</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
               <motion.div 
                 initial={{ opacity: 0, x: -20 }}
                 whileInView={{ opacity: 1, x: 0 }}
                 className="space-y-6"
               >
                  <h3 className="text-2xl font-bold flex items-center gap-3">
                     <ShieldCheck className="h-8 w-8 text-green-500" />
                     Ethical AI Development
                  </h3>
                  <p className="text-gray-400 leading-relaxed">
                     We are committed to developing AI that is transparent, fair, and beneficial to humanity. 
                     Our models are trained on diverse datasets and regularly audited for bias and safety.
                  </p>
               </motion.div>
               <motion.div 
                 initial={{ opacity: 0, x: 20 }}
                 whileInView={{ opacity: 1, x: 0 }}
                 className="space-y-6"
               >
                  <h3 className="text-2xl font-bold flex items-center gap-3">
                     <Heart className="h-8 w-8 text-red-500" />
                     User Privacy First
                  </h3>
                  <p className="text-gray-400 leading-relaxed">
                     Your data belongs to you. We implement end-to-end encryption, never sell your information, 
                     and give you complete control over your data and AI interactions.
                  </p>
               </motion.div>
               <motion.div 
                 initial={{ opacity: 0, x: -20 }}
                 whileInView={{ opacity: 1, x: 0 }}
                 className="space-y-6"
               >
                  <h3 className="text-2xl font-bold flex items-center gap-3">
                     <Lightbulb className="h-8 w-8 text-yellow-500" />
                     Continuous Innovation
                  </h3>
                  <p className="text-gray-400 leading-relaxed">
                     AI technology evolves rapidly, and so do we. We continuously update our platform with 
                     the latest advancements while maintaining stability and reliability.
                  </p>
               </motion.div>
               <motion.div 
                 initial={{ opacity: 0, x: 20 }}
                 whileInView={{ opacity: 1, x: 0 }}
                 className="space-y-6"
               >
                  <h3 className="text-2xl font-bold flex items-center gap-3">
                     <Users className="h-8 w-8 text-blue-500" />
                     Community Driven
                  </h3>
                  <p className="text-gray-400 leading-relaxed">
                     We listen to our users and build features based on real needs. Our community of 
                     creators, researchers, and businesses helps shape the future of OmniMind.
                  </p>
               </motion.div>
            </div>
         </div>
      </section>

      {/* Roadmap */}
      <section className="container mx-auto px-4 pb-24">
         <div className="glass-card p-12 border-primary/20 bg-primary/5">
            <h3 className="text-3xl font-display font-black mb-12 flex items-center gap-4 italic uppercase">
               <Lightbulb className="h-8 w-8 text-yellow-500" /> Future Roadmap
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
               {[
                 { q: 'Q2 2026', t: 'Smarter AI memory', d: 'Long-term cross-session knowledge retention and personalized AI profiles.' },
                 { q: 'Q3 2026', t: 'Autonomous AI agents', d: 'AI agents that can perform web research and complex multi-step tasks independently.' },
                 { q: 'Q4 2026', t: 'Workflow automation', d: 'Direct integration with external productivity apps and APIs.' },
                 { q: '2027+', t: 'Personalized AI experiences', d: 'Models fine-tuned specifically to your thinking style and preferences.' }
               ].map((phase, i) => (
                 <div key={i} className="space-y-4">
                    <p className="text-xs font-black text-primary uppercase tracking-[0.2em]">{phase.q}</p>
                    <h5 className="text-lg font-bold">{phase.t}</h5>
                    <p className="text-sm text-gray-500 italic">"{phase.d}"</p>
                 </div>
               ))}
            </div>
         </div>
      </section>
    </div>
  );
}
