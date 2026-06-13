import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';
import { Pencil, Send, CheckCircle, Brain, Eye, Loader2, Trash2, ChevronLeft } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { db } from '../../lib/firebase';
import { collection, addDoc, query, orderBy, getDocs, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../../components/FirebaseProvider';
import { useNavigate, Link } from 'react-router-dom';

export default function AdminBlog() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [content, setContent] = useState('# The Future of AI\n\nStart your transmission here...');
  const [title, setTitle] = useState('');
  const [preview, setPreview] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [posts, setPosts] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate('/');
    }
  }, [isAdmin, authLoading, navigate]);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const q = query(collection(db, 'blogs'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const fetchedPosts = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPosts(fetchedPosts);
    } catch (err) {
      console.error("Fetch posts failed:", err);
    } finally {
      setLoadingPosts(false);
    }
  };

  const handlePublish = async () => {
    if (!title.trim() || !content.trim()) return;
    setPublishing(true);
    try {
      await addDoc(collection(db, 'blogs'), {
        title,
        content,
        authorId: user?.uid,
        authorName: user?.displayName || 'Admin',
        createdAt: serverTimestamp(),
        excerpt: content.substring(0, 150) + '...'
      });
      setTitle('');
      setContent('');
      setPreview(false);
      fetchPosts();
      alert("Transmission Broadcasted!");
    } catch (err) {
      console.error("Publish failed:", err);
      alert("Broadcast failed. Check console.");
    } finally {
      setPublishing(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to terminate this transmission?")) return;
    try {
      await deleteDoc(doc(db, 'blogs', id));
      fetchPosts();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  if (authLoading || !isAdmin) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="pb-24 pt-20 container mx-auto px-4 max-w-6xl space-y-12">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-white/5 pb-10">
        <div className="space-y-3">
          <Link to="/profile" className="inline-flex items-center gap-2 text-xs text-primary hover:underline mb-2">
            <ChevronLeft className="h-3 w-3" /> Back to Matrix
          </Link>
          <h1 className="text-4xl md:text-5xl font-display font-black flex items-center gap-4">
            <Brain className="h-10 w-10 text-primary neon-glow" /> 
            Admin <span className="text-primary italic">Publisher</span>
          </h1>
          <p className="text-gray-400">Broadcast your wisdom to the global node network.</p>
        </div>
        
        <div className="flex flex-wrap gap-4">
           <button 
             onClick={() => setPreview(!preview)}
             className="flex items-center gap-2 px-6 py-3 rounded-xl border border-white/10 text-xs font-bold hover:bg-white/5 bg-dark/40"
           >
             {preview ? <Pencil className="h-4 w-4 text-primary" /> : <Eye className="h-4 w-4 text-primary" />}
             {preview ? 'Editor' : 'Preview'}
           </button>
           <button 
             onClick={handlePublish}
             disabled={publishing || !title || !content}
             className="flex items-center gap-2 px-8 py-3 rounded-xl bg-primary text-white text-xs font-bold shadow-lg shadow-primary/30 hover:scale-105 transition-all disabled:opacity-50"
           >
             {publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
             {publishing ? 'Casting...' : 'Broadcast'}
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Editor Area */}
         <div className="lg:col-span-2 space-y-8">
            <div className="space-y-4">
               <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-2">Transmission Title</label>
               <input 
                 value={title}
                 onChange={(e) => setTitle(e.target.value)}
                 className="w-full bg-white/5 border border-white/10 rounded-2xl py-6 px-8 text-2xl font-display font-bold focus:outline-none focus:border-primary transition-all text-white placeholder:text-white/10" 
                 placeholder="Title of your insight..."
               />
            </div>

            {!preview ? (
               <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-2">Neural Markdown</label>
                  <textarea 
                     value={content}
                     onChange={(e) => setContent(e.target.value)}
                     className="w-full bg-white/5 border border-white/10 rounded-3xl p-8 min-h-[600px] font-mono text-sm leading-relaxed focus:outline-none focus:border-primary transition-all resize-none shadow-inner text-gray-300"
                     placeholder="# Start typing your transmission..."
                  />
               </div>
            ) : (
               <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-2">Visualizing Output</label>
                  <div className="glass-card p-12 min-h-[600px] border-primary/20 bg-primary/5">
                     <h1 className="text-4xl font-display font-black mb-8">{title || 'Untitled Transmission'}</h1>
                     <div className="prose prose-invert prose-purple max-w-none">
                        <div className="markdown-body">
                          <ReactMarkdown>{content}</ReactMarkdown>
                        </div>
                     </div>
                  </div>
               </div>
            )}
         </div>

         {/* Sidebar: Existing Posts */}
         <div className="lg:col-span-1 space-y-6">
            <div className="glass-card p-8 border-white/5 space-y-6">
               <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 border-b border-white/5 pb-4">Recent Broadcasts</h3>
               {loadingPosts ? (
                 <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
               ) : posts.length === 0 ? (
                 <p className="text-gray-600 text-xs italic text-center p-8">No transmissions found.</p>
               ) : (
                 <div className="space-y-4">
                   {posts.map(post => (
                     <div key={post.id} className="p-4 rounded-xl bg-white/5 border border-white/5 group hover:border-primary/30 transition-all">
                        <div className="flex justify-between items-start gap-2 mb-2">
                           <h4 className="text-xs font-bold truncate line-clamp-1">{post.title}</h4>
                           <button 
                             onClick={() => handleDelete(post.id)}
                             className="text-gray-600 hover:text-red-500 transition-colors p-1"
                           >
                             <Trash2 className="h-3 w-3" />
                           </button>
                        </div>
                        <p className="text-[10px] text-gray-500 line-clamp-2 leading-relaxed">{post.excerpt}</p>
                     </div>
                   ))}
                 </div>
               )}
            </div>

            <div className="glass-card p-6 border-emerald-500/20 bg-emerald-500/5 text-center">
               <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                  <CheckCircle className="h-3 w-3" /> Secure Publishing Active
               </p>
            </div>
         </div>
      </div>
    </div>
  );
}
