'use client';

import { useState } from 'react';
import type { AnalyzeRequest, AnalyzeResponse } from '@cbrief/shared';
import { AnalysisResult } from '@/components/AnalysisResult';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function Home() {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState<'auto' | 'javascript' | 'typescript' | 'python'>('auto');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!code.trim()) {
      setError('コードを入力してください');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const request: AnalyzeRequest = {
        languageHint: language,
        content: code,
        policies: [],
        save: false, // MVPでは常にfalse
      };

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data: AnalyzeResponse = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '解析に失敗しました');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <main className="min-h-screen p-8 dark:bg-gray-900 transition-colors">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">cbrief</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              コードブリーフ - AI生成コードの診断ツール
            </p>
          </div>
          <ThemeToggle />
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 左側: 入力エリア */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
              コード入力
            </h2>

            <div className="mb-4">
              <label
                htmlFor="language"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                言語
              </label>
              <select
                id="language"
                value={language}
                onChange={(e) =>
                  setLanguage(e.target.value as 'auto' | 'javascript' | 'typescript' | 'python')
                }
                className="input"
              >
                <option value="auto">自動判定</option>
                <option value="javascript">JavaScript</option>
                <option value="typescript">TypeScript</option>
                <option value="python">Python</option>
              </select>
            </div>

            <div className="mb-4">
              <label
                htmlFor="code"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                コード（300KBまで）
              </label>
              <textarea
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="input h-96 font-mono text-sm resize-y"
                placeholder="解析したいコードを貼り付けてください..."
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input type="checkbox" id="save" disabled checked={false} className="mr-2" />
                <label htmlFor="save" className="text-sm text-gray-500 dark:text-gray-400">
                  保存する（MVP版では無効）
                </label>
              </div>

              <button onClick={handleAnalyze} disabled={isAnalyzing} className="btn-primary">
                {isAnalyzing ? '解析中...' : '分析'}
              </button>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-md text-red-700 dark:text-red-200">
                {error}
              </div>
            )}
          </div>

          {/* 右側: 結果表示 */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
              解析結果
            </h2>

            {!result ? (
              <div className="text-gray-500 dark:text-gray-400 text-center py-20">
                コードを入力して「分析」ボタンを押してください
              </div>
            ) : (
              <AnalysisResult result={result} />
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
