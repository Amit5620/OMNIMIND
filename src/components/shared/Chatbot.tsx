import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bot,
  MessageSquare,
  X,
  Send,
  Copy,
  Check,
  Code2,
  Wand2,
  Bug,
  Shuffle,
  FlaskConical,
  Search,
  SquareArrowOutUpRight,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { chatAPI, type CodingRequest } from '../../lib/api';
import CodeBlock from './CodeBlock';
import ReactMarkdown from 'react-markdown';

type Role = 'user' | 'assistant';

type ChatMessage = {
  id: string;
  role: Role;
  content: string;
};

type ParsedCodeBlock = {
  language?: string;
  code: string;
  start: number;
  end: number;
};

function makeId() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function parseFencedCodeBlocks(text: string): ParsedCodeBlock[] {
  // Matches fenced code blocks with optional language and flexible line endings.
  const re = /```([^\s`]*)\s*\r?\n([\s\S]*?)```/g;
  const blocks: ParsedCodeBlock[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    blocks.push({
      language: m[1] ? m[1].trim() : undefined,
      code: m[2] ?? '',
      start: m.index,
      end: re.lastIndex,
    });
  }
  return blocks;
}

function splitByFences(text: string): Array<{ type: 'text'; value: string } | { type: 'code'; value: ParsedCodeBlock }> {
  const blocks = parseFencedCodeBlocks(text);
  if (!blocks.length) return [{ type: 'text', value: text }];

  const out: Array<{ type: 'text'; value: string } | { type: 'code'; value: ParsedCodeBlock }> = [];
  let cursor = 0;
  for (const b of blocks) {
    if (b.start > cursor) out.push({ type: 'text', value: text.slice(cursor, b.start) });
    out.push({ type: 'code', value: b });
    cursor = b.end;
  }
  if (cursor < text.length) out.push({ type: 'text', value: text.slice(cursor) });
  return out;
}

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: makeId(),
      role: 'assistant',
      content:
        'Hi! I’m your OmniMind Coding Assistant.\n\nAsk anything about code, refactors, bugs, architecture, or write tests. I’ll return code in fenced blocks with copy buttons.',
    },
  ]);
  const [input, setInput] = useState('');

  const [strictMode, setStrictMode] = useState(true);
  const [minimalDiffs, setMinimalDiffs] = useState(true);

  const scrollRef = useRef<HTMLDivElement | null>(null);

  const [userId, setUserId] = useState<string>('anonymous');
  useEffect(() => {
    // Lightweight: derive uid from localStorage if available; otherwise backend will reject coding endpoint.
    // Workspace already uses FirebaseProvider; we keep this widget resilient without importing auth.
    try {
      const v = localStorage.getItem('uid');
      if (v) setUserId(v);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isOpen]);

  const assistantPromptPrefix = useMemo(() => {
    const parts: string[] = [];
    parts.push('You are OmniMind Coding Assistant (code-only UX).');
    parts.push('For implementation, data structure, algorithm, and write-code requests, use sections: Definition, Code, Sample Test Cases, Explanation, Time Complexity, Space Complexity, and Notes.');
    parts.push('Never leave the Code section empty. Put complete runnable code in fenced markdown code blocks with accurate language identifiers.');
    parts.push('Include at least three sample test cases with inputs and expected outputs for algorithm and implementation requests.');
    parts.push('Never output UI words such as Copy, code Copy, or code-block toolbar labels as answer text.');
    parts.push('Do not use custom placeholder tokens like codeCopy or other non-standard markup.');
    parts.push('Use only standard markdown formatting and fenced code blocks.');
    if (strictMode) parts.push('Follow strict best practices and correctness first.');
    if (minimalDiffs) parts.push('Prefer minimal diffs: change only what is necessary.');
    parts.push('Add brief reasoning and assumptions (short).');
    parts.push('When you include multiple code blocks, label them with accurate language identifiers.');
    return parts.join('\n');
  }, [strictMode, minimalDiffs]);

  const send = async (overrideText?: string) => {
    const contentToSend = (overrideText ?? input).trim();
    if (!contentToSend) return;
    if (isLoading) return;

    const userMsg: ChatMessage = { id: makeId(), role: 'user', content: contentToSend };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const assistantMsgId = makeId();

    // Optimistic placeholder
    setMessages((prev) => [
      ...prev,
      { id: assistantMsgId, role: 'assistant', content: 'Thinking…' },
    ]);

    try {
      const req: CodingRequest = {
        message: `${assistantPromptPrefix}\n\nUser request:\n${contentToSend}`,
        user_id: userId,
        language: 'python',
      };

      const res = await chatAPI.coding(req);

      setMessages((prev) => prev.map((m) => (m.id === assistantMsgId ? { ...m, content: res.response } : m)));
    } catch (e: any) {
      const detail = e?.message ? String(e.message) : 'Coding endpoint unavailable.';
      setMessages((prev) => prev.map((m) => (m.id === assistantMsgId ? { ...m, content: `Coding chat failed.\n\n${detail}` } : m)));
    } finally {
      setIsLoading(false);
    }
  };

  const quickAction = (kind: 'explain' | 'refactor' | 'bug' | 'tests' | 'optimize') => {
    const base = input.trim() ? input.trim() : 'my current code and goal';
    switch (kind) {
      case 'explain':
        return send(`Explain this code: ${base}. Include a quick architecture overview.`);
      case 'refactor':
        return send(`Refactor this code for clarity, maintainability, and performance. Keep behavior the same: ${base}.`);
      case 'bug':
        return send(`Find bugs / edge cases in this code and propose fixes: ${base}. Provide corrected code in fenced blocks.`);
      case 'tests':
        return send(`Write tests for this code. Use best practices for the language/framework you choose. ${base}`);
      case 'optimize':
        return send(`Optimize this code for speed and/or memory. Explain tradeoffs. ${base}`);
    }
  };

  const copyAllToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  };

  const MessageRenderer = ({ msg }: { msg: ChatMessage }) => {
    const parts = splitByFences(msg.content);
    return (
      <div className={cn('rounded-2xl text-sm md:text-base leading-relaxed shadow-inner', msg.role === 'user'
        ? 'bg-primary text-white rounded-tr-none'
        : 'bg-white/[0.03] border border-white/5 text-gray-300 rounded-tl-none')}
      >
        <div className="p-4 md:p-5 space-y-3">
          {msg.role === 'assistant' && (
            <div className="flex items-center justify-end">
              <CopyAllButton text={msg.content} />
            </div>
          )}

          {parts.map((p, idx) => {
            if (p.type === 'code') {
              return <div key={`${msg.id}_code_${idx}`}><CodeBlock code={p.value.code} language={p.value.language} /></div>;
            }

            return (
              <ReactMarkdown
                key={`${msg.id}_text_${idx}`}
                components={{
                  code: ({ inline, className, children, ...props }: any) => {
                    const rawCode = String(children).replace(/^\n|\n$/g, '');
                    const isInlineCode =
                      inline === true || (!className && !rawCode.includes('\n'));

                    if (isInlineCode) {
                      return (
                        <code className="bg-black/30 px-1.5 py-0.5 rounded text-gray-100 font-mono text-xs" {...props}>
                          {children}
                        </code>
                      );
                    }
                    return null;
                  },
                  pre: ({ children }) => <>{children}</>,
                }}
              >
                {p.value}
              </ReactMarkdown>
            );
          })}
        </div>
      </div>
    );
  };

  const CopyAllButton = ({ text }: { text: string }) => {
    const [copied, setCopied] = useState(false);
    return (
      <button
        type="button"
        onClick={async () => {
          const ok = await copyAllToClipboard(text);
          if (ok) {
            setCopied(true);
            setTimeout(() => setCopied(false), 1200);
          }
        }}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-[12px] font-bold border border-white/10 bg-white/5 hover:bg-white/10 transition-all"
      >
        {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
        {copied ? 'Copied' : 'Copy all'}
      </button>
    );
  };

  return (
    <div className="fixed bottom-6 right-6 z-[60]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="mb-4 h-[560px] w-[410px] overflow-hidden rounded-2xl border border-white/10 bg-dark/95 shadow-2xl backdrop-blur-xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between bg-primary/20 p-4 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                <div className="leading-tight">
                  <span className="font-display font-bold block">OmniCoding</span>
                  <span className="text-[11px] text-gray-300 block">Claude Code-style coding chat</span>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Controls */}
            <div className="p-3 border-b border-white/5 bg-dark">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => quickAction('explain')}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-[12px] font-bold border border-white/10 bg-white/5 hover:bg-white/10 transition-all disabled:opacity-60"
                >
                  <Wand2 className="h-4 w-4 text-primary" /> Explain
                </button>
                <button
                  type="button"
                  onClick={() => quickAction('refactor')}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-[12px] font-bold border border-white/10 bg-white/5 hover:bg-white/10 transition-all disabled:opacity-60"
                >
                  <Shuffle className="h-4 w-4 text-primary" /> Refactor
                </button>
                <button
                  type="button"
                  onClick={() => quickAction('bug')}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-[12px] font-bold border border-white/10 bg-white/5 hover:bg-white/10 transition-all disabled:opacity-60"
                >
                  <Bug className="h-4 w-4 text-primary" /> Find bug
                </button>
                <button
                  type="button"
                  onClick={() => quickAction('tests')}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-[12px] font-bold border border-white/10 bg-white/5 hover:bg-white/10 transition-all disabled:opacity-60"
                >
                  <FlaskConical className="h-4 w-4 text-primary" /> Tests
                </button>
                <button
                  type="button"
                  onClick={() => quickAction('optimize')}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-[12px] font-bold border border-white/10 bg-white/5 hover:bg-white/10 transition-all disabled:opacity-60"
                >
                  <Search className="h-4 w-4 text-primary" /> Optimize
                </button>

                <div className="flex items-center gap-2 px-2 ml-auto">
                  <label className="flex items-center gap-2 text-[11px] text-gray-300 select-none">
                    <input
                      type="checkbox"
                      checked={strictMode}
                      onChange={(e) => setStrictMode(e.target.checked)}
                      className="accent-primary"
                      disabled={isLoading}
                    />
                    Strict
                  </label>
                  <label className="flex items-center gap-2 text-[11px] text-gray-300 select-none">
                    <input
                      type="checkbox"
                      checked={minimalDiffs}
                      onChange={(e) => setMinimalDiffs(e.target.checked)}
                      className="accent-primary"
                      disabled={isLoading}
                    />
                    Minimal diffs
                  </label>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={cn('flex gap-4', m.role === 'user' ? 'flex-row-reverse' : 'flex-row')}
                >
                  <div
                    className={cn(
                      'flex-shrink-0 h-8 w-8 rounded-xl flex items-center justify-center border',
                      m.role === 'user'
                        ? 'border-primary/20 bg-primary/10 text-primary'
                        : 'border-white/10 bg-white/5 text-gray-400'
                    )}
                  >
                    {m.role === 'user' ? (
                      <MessageSquare className="h-5 w-5" />
                    ) : (
                      <Bot className="h-5 w-5" />
                    )}
                  </div>

                  <div className={cn('flex-1', m.role === 'user' ? 'text-right' : 'text-left')}>
                    <MessageRenderer msg={m} />
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-4 items-center animate-pulse">
                  <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-500">
                    <Bot className="h-5 w-5" />
                  </div>
                  <div className="flex gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary/50 animate-bounce" />
                    <div className="h-2 w-2 rounded-full bg-primary/50 animate-bounce [animation-delay:0.2s]" />
                    <div className="h-2 w-2 rounded-full bg-primary/50 animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-white/5 bg-dark">
              <div className="space-y-2">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                  placeholder="Ask for code… (Enter to send, Shift+Enter for newline)"
                  className="w-full bg-white/5 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary border border-transparent focus:border-primary/50 resize-none min-h-[44px] max-h-[140px]"
                  rows={2}
                />
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-[11px] text-gray-500">
                    <Code2 className="h-4 w-4 text-primary" />
                    <span>Copy code blocks & generate code instantly.</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => send()}
                    disabled={!input.trim() || isLoading}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-xs font-black transition-all hover:scale-[1.02] disabled:opacity-60'
                    )}
                  >
                    <Send className="h-4 w-4" /> Send
                    <SquareArrowOutUpRight className="h-4 w-4 opacity-80" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen((v) => !v)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/30"
        aria-label="Toggle coding assistant"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
      </motion.button>
    </div>
  );
}
