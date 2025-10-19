'use client';

import { useEffect, useRef } from 'react';
import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import python from 'highlight.js/lib/languages/python';
import diff from 'highlight.js/lib/languages/diff';

// 必要な言語を登録
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('python', python);
hljs.registerLanguage('diff', diff);

interface CodeBlockProps {
  code: string;
  language?: string;
  className?: string;
}

export function CodeBlock({ code, language, className = '' }: CodeBlockProps) {
  const codeRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (codeRef.current) {
      // 既存のハイライトをクリア
      codeRef.current.removeAttribute('data-highlighted');

      if (language) {
        // 言語指定がある場合
        try {
          const highlighted = hljs.highlight(code, { language }).value;
          codeRef.current.innerHTML = highlighted;
        } catch {
          // 言語が見つからない場合は自動判定
          hljs.highlightElement(codeRef.current);
        }
      } else {
        // 自動判定
        hljs.highlightElement(codeRef.current);
      }
    }
  }, [code, language]);

  return (
    <pre className={`github-code-block ${className}`}>
      <code ref={codeRef} className={language ? `language-${language}` : ''}>
        {code}
      </code>
    </pre>
  );
}
