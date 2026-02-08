'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { vs } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { useTheme } from 'next-themes';

interface MarkdownViewerProps {
  content: string;
}

export function MarkdownViewer({ content }: MarkdownViewerProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <div className="prose prose-slate dark:prose-invert max-w-none [&_strong]:text-gray-900 [&_strong]:dark:text-gray-100 [&_b]:text-gray-900 [&_b]:dark:text-gray-100">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // カスタムスタイリング
          h1: ({ ...props }) => (
            <h1
              className="text-4xl font-bold mt-12 mb-6 text-gray-900 dark:text-gray-100"
              {...props}
            />
          ),
          h2: ({ ...props }) => (
            <h2
              className="text-3xl font-semibold mt-10 mb-5 text-gray-900 dark:text-gray-100"
              {...props}
            />
          ),
          h3: ({ ...props }) => (
            <h3
              className="text-xl font-semibold mt-8 mb-4 text-gray-900 dark:text-gray-100"
              {...props}
            />
          ),
          p: ({ ...props }) => (
            <p
              className="my-4 text-sm text-gray-700 dark:text-gray-300 leading-relaxed"
              {...props}
            />
          ),
          ul: ({ ...props }) => (
            <ul
              className="list-disc list-inside my-4 space-y-2 text-sm text-gray-700 dark:text-gray-300"
              {...props}
            />
          ),
          ol: ({ ...props }) => (
            <ol
              className="list-decimal list-inside my-4 space-y-2 text-sm text-gray-700 dark:text-gray-300"
              {...props}
            />
          ),
          code: ({ className, children, ref: _ref, ...props }) => {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';
            const isInline = !match;

            if (isInline) {
              return (
                <code
                  className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-pink-600 dark:text-pink-400 font-mono text-sm"
                  {...props}
                >
                  {children}
                </code>
              );
            }

            return (
              <SyntaxHighlighter
                language={language}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                style={isDark ? (vscDarkPlus as any) : (vs as any)}
                customStyle={{
                  borderRadius: '0.5rem',
                  padding: '1rem',
                  fontSize: '0.9375rem',
                  margin: '1rem 0',
                }}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            );
          },
          pre: ({ children }) => {
            // SyntaxHighlighterが既にpreをレンダリングするのでスキップ
            return <>{children}</>;
          },
          blockquote: ({ ...props }) => (
            <blockquote
              className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 my-4 italic text-sm text-gray-600 dark:text-gray-400"
              {...props}
            />
          ),
          a: ({ ...props }) => (
            <a
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            />
          ),
          table: ({ ...props }) => (
            <div className="overflow-x-auto my-4">
              <table
                className="min-w-full border border-gray-300 dark:border-gray-600"
                {...props}
              />
            </div>
          ),
          th: ({ ...props }) => (
            <th
              className="px-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-left font-semibold text-sm text-gray-900 dark:text-gray-100"
              {...props}
            />
          ),
          td: ({ ...props }) => (
            <td
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-300"
              {...props}
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
