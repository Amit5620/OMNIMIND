import React, { useMemo, useState } from 'react';
import { Copy, Check, Code2 } from 'lucide-react';

function normalizeCodeFenceLanguage(lang?: string) {
  const v = (lang || '').trim();
  return v ? v : 'code';
}

export type CodeBlockProps = {
  code: string;
  language?: string;
};

export default function CodeBlock({ code, language }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const langLabel = useMemo(
    () => normalizeCodeFenceLanguage(language),
    [language]
  );

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // no-op
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/30">
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/5 bg-white/[0.02]">
        <div className="flex items-center gap-2 min-w-0">
          <Code2 className="h-4 w-4 text-primary" />
          <span className="text-[11px] font-black uppercase tracking-widest text-gray-300 truncate">
            {langLabel}
          </span>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-[12px] font-bold border border-white/10 bg-white/5 hover:bg-white/10 transition-all"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 text-green-400" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              Copy
            </>
          )}
        </button>
      </div>

      <pre className="m-0 p-4 overflow-x-auto text-xs md:text-sm text-gray-100 font-mono leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

