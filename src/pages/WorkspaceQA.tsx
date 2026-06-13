import { motion } from 'motion/react';
import { useState } from 'react';
import { Youtube, Globe, FileText, Send } from 'lucide-react';

export default function WorkspaceQA() {
  const [tool, setTool] = useState<'youtube' | 'web' | 'document'>('youtube');
  const [url, setUrl] = useState('');
  const [fileText, setFileText] = useState('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);

  const onAsk = async () => {
    setLoading(true);
    try {
      // NOTE: This UI is a placeholder. Full integration requires backend endpoints + api.ts + original Workspace UI.
      setAnswer('QA endpoints are not wired in this placeholder UI yet.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 text-white">
      <div className="flex gap-3 mb-4">
        <button className="px-3 py-2 rounded bg-white/10" onClick={() => setTool('youtube')}>
          <Youtube className="inline h-4 w-4 mr-2" />YouTube
        </button>
        <button className="px-3 py-2 rounded bg-white/10" onClick={() => setTool('web')}>
          <Globe className="inline h-4 w-4 mr-2" />Website
        </button>
        <button className="px-3 py-2 rounded bg-white/10" onClick={() => setTool('document')}>
          <FileText className="inline h-4 w-4 mr-2" />Document
        </button>
      </div>

      {(tool === 'youtube' || tool === 'web') && (
        <input
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 mb-3 text-sm"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder={tool === 'youtube' ? 'Paste YouTube URL' : 'Paste Website URL'}
        />
      )}

      {tool === 'document' && (
        <textarea
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 mb-3 text-sm min-h-[150px]"
          value={fileText}
          onChange={(e) => setFileText(e.target.value)}
          placeholder="Paste document text here"
        />
      )}

      <textarea
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 mb-3 text-sm min-h-[80px]"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Ask a question about the summarized content"
      />

      <button
        className="bg-primary text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2"
        disabled={loading || !question.trim()}
        onClick={onAsk}
      >
        <Send className="h-4 w-4" /> {loading ? 'Thinking...' : 'Ask'}
      </button>

      <motion.div className="mt-4 p-4 rounded-xl bg-white/[0.03] border border-white/5 whitespace-pre-wrap" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        {answer || 'Answer will appear here...'}
      </motion.div>
    </div>
  );
}

