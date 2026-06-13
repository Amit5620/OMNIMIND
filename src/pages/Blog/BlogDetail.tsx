import { motion } from 'motion/react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, User, Share2, Clock, Tag, Facebook, Twitter, Linkedin } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { blogs } from './blogs';

export default function BlogDetail() {
  const { id } = useParams();
  const blog = blogs.find(b => b.id === id);

  if (!blog) {
    return (
      <div className="pb-24 pt-20 container mx-auto px-4 text-center">
        <h1 className="text-4xl font-bold mb-4">Blog not found</h1>
        <Link to="/blog" className="text-primary hover:underline">Back to Blog List</Link>
      </div>
    );
  }

  const readingTime = Math.ceil(blog.content.split(' ').length / 200);

  return (
    <div className="pb-24 pt-20 container mx-auto px-4 max-w-4xl space-y-12">
      <Link to="/blog" className="inline-flex items-center gap-2 text-gray-500 hover:text-primary transition-colors text-sm font-bold uppercase tracking-widest">
         <ArrowLeft className="h-4 w-4" /> Back to Intelligence Feed
      </Link>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        {/* Article Header */}
        <div className="space-y-6">
           <div className="flex flex-wrap gap-2 mb-4">
             {blog.tags?.map(tag => (
               <span key={tag} className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-xs font-bold text-primary uppercase tracking-widest">
                 <Tag className="h-3 w-3" /> {tag}
               </span>
             ))}
           </div>
           <h1 className="text-4xl md:text-6xl font-display font-black leading-tight tracking-tight">{blog.title}</h1>
           <div className="flex flex-wrap items-center gap-8 text-sm text-gray-500 border-y border-white/5 py-6 font-bold uppercase tracking-wider">
              <div className="flex items-center gap-2"><User className="h-5 w-5 text-primary" /> {blog.author}</div>
              <div className="flex items-center gap-2"><Calendar className="h-5 w-5 text-primary" /> {blog.date}</div>
              <div className="flex items-center gap-2"><Clock className="h-5 w-5 text-primary" /> {readingTime} min read</div>
              <div className="flex items-center gap-4 ml-auto">
                <button className="flex items-center gap-2 hover:text-blue-400 transition-colors">
                  <Facebook className="h-5 w-5" />
                </button>
                <button className="flex items-center gap-2 hover:text-blue-300 transition-colors">
                  <Twitter className="h-5 w-5" />
                </button>
                <button className="flex items-center gap-2 hover:text-blue-500 transition-colors">
                  <Linkedin className="h-5 w-5" />
                </button>
                <button className="flex items-center gap-2 hover:text-primary transition-colors ml-2">
                  <Share2 className="h-5 w-5" /> Share
                </button>
              </div>
           </div>
        </div>

        {/* Featured Image */}
        <div className="aspect-video rounded-[40px] overflow-hidden border border-white/10 shadow-2xl">
           <img src={blog.image} alt={blog.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        </div>

        {/* Article Content */}
        <div className="glass-card p-8 md:p-16 prose prose-invert prose-purple max-w-none shadow-inner border-white/5">
           <div className="markdown-body">
             <ReactMarkdown
               remarkPlugins={[remarkMath]}
               rehypePlugins={[rehypeKatex]}
               components={{
                 h1: ({children}) => <h1 className="text-3xl font-bold mb-6 mt-8 first:mt-0">{children}</h1>,
                 h2: ({children}) => <h2 className="text-2xl font-bold mb-4 mt-8">{children}</h2>,
                 h3: ({children}) => <h3 className="text-xl font-bold mb-3 mt-6">{children}</h3>,
                 p: ({children}) => <p className="mb-4 leading-relaxed">{children}</p>,
                 blockquote: ({children}) => (
                   <blockquote className="border-l-4 border-primary pl-6 italic my-6 text-gray-300">
                     {children}
                   </blockquote>
                 ),
                 code: (props) => {
                   const { children, className, ...rest } = props;
                   const isInline = !className;
                   return isInline ? (
                     <code className="bg-gray-800 px-2 py-1 rounded text-sm font-mono" {...rest}>
                       {children}
                     </code>
                   ) : (
                     <code className="block bg-gray-800 p-4 rounded-lg text-sm font-mono overflow-x-auto my-4" {...rest}>
                       {children}
                     </code>
                   );
                 },
                 img: ({src, alt}) => (
                   <img src={src} alt={alt} className="rounded-lg shadow-lg my-8 max-w-full h-auto" />
                 )
               }}
             >
               {blog.content}
             </ReactMarkdown>
           </div>
        </div>

        {/* Article Footer */}
        <div className="border-t border-white/5 pt-8">
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div className="flex flex-wrap gap-2">
              {blog.tags?.map(tag => (
                <span key={tag} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-bold text-gray-300 uppercase tracking-widest">
                  #{tag}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">Share this article:</span>
              <div className="flex gap-2">
                <button className="p-2 rounded-full bg-white/5 hover:bg-blue-500/20 transition-colors">
                  <Facebook className="h-4 w-4" />
                </button>
                <button className="p-2 rounded-full bg-white/5 hover:bg-blue-400/20 transition-colors">
                  <Twitter className="h-4 w-4" />
                </button>
                <button className="p-2 rounded-full bg-white/5 hover:bg-blue-600/20 transition-colors">
                  <Linkedin className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
