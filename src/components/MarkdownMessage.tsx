import React from 'react';
import ReactMarkdown from 'react-markdown';
import { cn } from '../lib/utils';
import CodeBlock from './shared/CodeBlock';


interface MarkdownMessageProps {
  content: string;
  isUser?: boolean;
}

export const MarkdownMessage: React.FC<MarkdownMessageProps> = ({
  content,
  isUser = false,
}) => {
  return (
    <div
      className={cn(
        "p-4 md:p-5 rounded-2xl text-sm md:text-base leading-relaxed shadow-inner",
        isUser
          ? "bg-primary text-white rounded-tr-none"
          : "bg-white/[0.03] border border-white/5 text-gray-300 rounded-tl-none"
      )}
    >
      <ReactMarkdown
        components={{
          h1: ({ node, ...props }) => (
            <h1
              className="text-lg md:text-xl font-bold mt-4 mb-3 text-white"
              {...props}
            />
          ),
          h2: ({ node, ...props }) => (
            <h2
              className="text-base md:text-lg font-bold mt-3 mb-2 text-gray-100"
              {...props}
            />
          ),
          h3: ({ node, ...props }) => (
            <h3
              className="text-sm md:text-base font-semibold mt-2 mb-1 text-gray-200"
              {...props}
            />
          ),
          p: ({ node, ...props }) => (
            <p className="mb-3 whitespace-pre-wrap" {...props} />
          ),
          ul: ({ node, ...props }) => (
            <ul
              className="list-disc list-inside mb-3 space-y-1 ml-2"
              {...props}
            />
          ),
          ol: ({ node, ...props }) => (
            <ol
              className="list-decimal list-inside mb-3 space-y-1 ml-2"
              {...props}
            />
          ),
          li: ({ node, ...props }) => (
            <li className="ml-2" {...props} />
          ),
          strong: ({ node, ...props }) => (
            <strong className="font-bold text-gray-100" {...props} />
          ),
          em: ({ node, ...props }) => (
            <em className="italic text-gray-200" {...props} />
          ),
          code: ({ node, inline, className, children, ...props }: any) => {
            const match = /language-([a-z0-9_-]+)/i.exec(className || '');
            const language = match?.[1];
            const rawCode = String(children).replace(/^\n|\n$/g, '');
            const isInlineCode =
              inline === true || (!className && !rawCode.includes('\n'));

            if (isInlineCode) {
              return (
                <code
                  className="bg-black/30 px-1.5 py-0.5 rounded text-gray-100 font-mono text-xs md:text-sm"
                  {...props}
                >
                  {children}
                </code>
              );
            }

            return <CodeBlock code={rawCode} language={language} />;
          },
          pre: ({ children }) => <>{children}</>,
          blockquote: ({ node, ...props }) => (
            <blockquote
              className="border-l-4 border-primary/50 pl-4 italic text-gray-400 my-3"
              {...props}
            />
          ),
          a: ({ node, ...props }) => (
            <a
              className="text-primary hover:text-primary/80 underline"
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            />
          ),
          hr: ({ node, ...props }) => (
            <hr className="my-4 border-white/10" {...props} />
          ),
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto my-3">
              <table
                className="border-collapse border border-white/10 text-xs md:text-sm"
                {...props}
              />
            </div>
          ),
          thead: ({ node, ...props }) => (
            <thead className="bg-white/5" {...props} />
          ),
          th: ({ node, ...props }) => (
            <th
              className="border border-white/10 px-2 py-1 text-left font-semibold"
              {...props}
            />
          ),
          td: ({ node, ...props }) => (
            <td
              className="border border-white/10 px-2 py-1"
              {...props}
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

