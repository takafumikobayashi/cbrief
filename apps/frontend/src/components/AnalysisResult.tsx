'use client';

import { useState } from 'react';
import type { AnalyzeResponse } from '@cbrief/shared';
import { CodeBlock } from './CodeBlock';

type Tab = 'summary' | 'risks' | 'fixes' | 'actions';

interface Props {
  result: AnalyzeResponse;
}

export function AnalysisResult({ result }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('summary');

  const tabs: { id: Tab; label: string }[] = [
    { id: 'summary', label: '要約' },
    { id: 'risks', label: 'リスク' },
    { id: 'fixes', label: '修正案' },
    { id: 'actions', label: '次アクション' },
  ];

  const downloadMarkdown = () => {
    const blob = new Blob([result.artifacts.markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'code-analysis-report.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      {/* タブナビゲーション */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-4">
        <nav className="flex space-x-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-primary-600 text-primary-600 dark:border-primary-500 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* タブコンテンツ */}
      <div className="overflow-y-auto max-h-[600px]">
        {activeTab === 'summary' && <SummaryTab result={result} />}
        {activeTab === 'risks' && <RisksTab result={result} />}
        {activeTab === 'fixes' && <FixesTab result={result} />}
        {activeTab === 'actions' && <ActionsTab result={result} />}
      </div>

      {/* エクスポート */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={downloadMarkdown}
          className="bg-secondary-600 dark:bg-secondary-700 text-white px-4 py-2 rounded-md hover:bg-secondary-700 dark:hover:bg-secondary-800 text-sm transition-colors font-medium"
        >
          📄 Markdownでダウンロード
        </button>
      </div>
    </div>
  );
}

function SummaryTab({ result }: Props) {
  const { summary } = result;
  return (
    <div className="space-y-4">
      <Section title="目的">
        <p>{summary.purpose}</p>
      </Section>

      <Section title="入出力">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300 mb-1">入力</h4>
            <ul className="list-disc list-inside text-sm">
              {summary.io.inputs.map((input, i) => (
                <li key={i}>{input}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300 mb-1">出力</h4>
            <ul className="list-disc list-inside text-sm">
              {summary.io.outputs.map((output, i) => (
                <li key={i}>{output}</li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      <Section title="データの機微性">
        <div className="flex gap-2">
          {summary.data_sensitivity.map((level, i) => (
            <span
              key={i}
              className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded text-sm"
            >
              {level}
            </span>
          ))}
        </div>
      </Section>

      {summary.side_effects.length > 0 && (
        <Section title="副作用">
          <ul className="list-disc list-inside text-sm">
            {summary.side_effects.map((effect, i) => (
              <li key={i}>{effect}</li>
            ))}
          </ul>
        </Section>
      )}

      {summary.ops_requirements.length > 0 && (
        <Section title="運用要件">
          <ul className="list-disc list-inside text-sm">
            {summary.ops_requirements.map((req, i) => (
              <li key={i}>{req}</li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}

function RisksTab({ result }: Props) {
  const severityColors = {
    High: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 border-red-200 dark:border-red-700',
    Medium:
      'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 border-yellow-200 dark:border-yellow-700',
    Low: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-700',
  };

  return (
    <div className="space-y-4">
      {result.risks.map((risk, i) => (
        <div key={i} className={`border rounded-lg p-4 ${severityColors[risk.severity]}`}>
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold">{risk.risk}</h3>
            <span className="text-xs font-medium px-2 py-1 rounded bg-white dark:bg-gray-800">
              優先度 {risk.priority}
            </span>
          </div>

          <div className="text-sm mb-3">
            <strong>根拠:</strong> {risk.evidence.rule} ({risk.evidence.file}:{risk.evidence.line})
            <div className="mt-1">
              <CodeBlock code={risk.evidence.excerpt} className="!my-0 text-xs" />
            </div>
          </div>

          <div className="text-sm mb-2">
            <strong>修正方法:</strong> {risk.fix}
          </div>

          <div className="text-xs">
            工数: <span className="font-medium">{risk.effort}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function FixesTab({ result }: Props) {
  return (
    <div className="space-y-4">
      {result.fixes.map((fix, i) => (
        <div key={i} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h3 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">{fix.title}</h3>
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">{fix.explanation}</p>
          <CodeBlock code={fix.diff} language="diff" className="text-xs" />
        </div>
      ))}
    </div>
  );
}

function ActionsTab({ result }: Props) {
  return (
    <div className="space-y-3">
      {result.next_actions.map((action, i) => (
        <div key={i} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-start justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">{action.title}</h3>
            <span className="text-xs font-medium px-2 py-1 rounded bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200">
              優先度 {action.priority}
            </span>
          </div>
          <div className="mt-2 text-sm text-gray-600 dark:text-gray-400 flex gap-4">
            <span>工数: {action.effort}</span>
            {action.owner && <span>担当: {action.owner}</span>}
            {action.duedate && <span>期限: {action.duedate}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">{title}</h3>
      <div className="text-sm text-gray-700 dark:text-gray-300">{children}</div>
    </div>
  );
}
