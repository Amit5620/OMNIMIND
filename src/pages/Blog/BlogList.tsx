import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Calendar, User, ArrowRight, Sparkles, Tag, Clock } from 'lucide-react';
import { blogs } from './blogs';

export default function BlogList() {
  return (
    <div className="pb-24 pt-20 container mx-auto px-4 space-y-16">
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <motion.div 
           initial={{ opacity: 0, scale: 0.9 }}
           animate={{ opacity: 1, scale: 1 }}
           className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-xs font-bold text-primary uppercase tracking-widest"
        >
          <Sparkles className="h-3 w-3" /> News & Insights
        </motion.div>
        <h1 className="text-4xl md:text-6xl font-display font-black tracking-tight">OmniMind <span className="text-primary italic">Journal</span></h1>
        <p className="text-gray-400">Deep dives into the world of AI, product updates, and futuristic thinking.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {blogs.map((blog, i) => (
          <motion.article 
            key={blog.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="glass-card overflow-hidden group hover:bg-white/[0.05] transition-all border-white/5 hover:border-white/10"
          >
            <div className="aspect-video relative overflow-hidden">
               <img 
                 src={blog.image} 
                 alt={blog.title} 
                 className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
                 referrerPolicy="no-referrer"
               />
               <div className="absolute inset-0 bg-gradient-to-t from-dark via-transparent to-transparent opacity-60" />
               <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                 {blog.tags?.slice(0, 2).map(tag => (
                   <span key={tag} className="px-2 py-1 bg-primary/20 backdrop-blur-sm text-primary text-xs font-bold rounded-full border border-primary/30">
                     {tag}
                   </span>
                 ))}
               </div>
               <div className="absolute bottom-4 left-4 right-4">
                 <div className="flex items-center gap-4 text-xs text-white/80 font-bold uppercase tracking-wider">
                   <span className="flex items-center gap-1 bg-black/20 backdrop-blur-sm px-2 py-1 rounded-full">
                     <Calendar className="h-3 w-3" /> {blog.date}
                   </span>
                   <span className="flex items-center gap-1 bg-black/20 backdrop-blur-sm px-2 py-1 rounded-full">
                     <User className="h-3 w-3" /> {blog.author}
                   </span>
                 </div>
               </div>
            </div>
            <div className="p-6 space-y-4">
               <h3 className="text-xl font-bold group-hover:text-primary transition-colors line-clamp-2 leading-tight">{blog.title}</h3>
               <p className="text-gray-400 text-sm line-clamp-3 leading-relaxed">{blog.excerpt}</p>
               <div className="flex items-center justify-between">
                 <div className="flex items-center gap-2 text-xs text-gray-500">
                   <Clock className="h-3 w-3" />
                   <span>{Math.ceil(blog.content.split(' ').length / 200)} min read</span>
                 </div>
                 <Link 
                  to={`/blog/${blog.id}`} 
                  className="inline-flex items-center gap-2 text-sm font-bold text-white group-hover:gap-3 transition-all hover:text-primary"
                 >
                   Read Evolution <ArrowRight className="h-4 w-4 text-primary" />
                 </Link>
               </div>
            </div>
          </motion.article>
        ))}
      </div>
    </div>
  );
}
