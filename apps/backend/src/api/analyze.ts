import { Router } from 'express';
import type { AnalyzeRequest, AnalyzeResponse } from '@cbrief/shared';

export const analyzeRouter = Router();

/**
 * POST /api/analyze
 * コード解析エンドポイント（Sprint 0ではモックレスポンス）
 */
analyzeRouter.post('/analyze', async (req, res) => {
  try {
    const request: AnalyzeRequest = req.body;

    // バリデーション
    if (!request.content) {
      return res.status(400).json({ error: 'content is required' });
    }

    if (request.content.length > 300000) {
      return res.status(400).json({ error: 'content exceeds 300KB limit' });
    }

    // TODO: Sprint 1で実装
    // 1. 言語判定
    // 2. 静的解析（Semgrep/ESLint/Bandit/Secrets）
    // 3. LLM整形（Gemini 1.5 Flash）
    // 4. JSONスキーマ検証

    // モックレスポンス
    const mockResponse: AnalyzeResponse = {
      summary: {
        purpose: 'APIに認証ヘッダー付きでリクエストを送信するコードです。',
        io: {
          inputs: ['APIエンドポイントURL'],
          outputs: ['HTTPレスポンス'],
        },
        data_sensitivity: ['Credentials'],
        side_effects: ['外部APIへのHTTPリクエスト送信'],
        ops_requirements: ['APIキーの定期的なローテーション'],
        scope_limits: ['エラーハンドリングが未実装'],
      },
      risks: [
        {
          risk: 'ハードコードされたAPIトークン',
          severity: 'High',
          evidence: {
            rule: 'semgrep.secret.generic',
            file: 'snippet',
            line: 2,
            excerpt: "headers: { 'Authorization': 'Bearer sk-***' }",
          },
          fix: '環境変数に移動し、定期的にキーをローテーションしてください',
          effort: 'S',
          priority: 1,
        },
      ],
      fixes: [
        {
          title: 'APIトークンを環境変数に移動',
          diff: `- headers: { 'Authorization': 'Bearer sk-12345' }
+ headers: { 'Authorization': \`Bearer \${process.env.API_TOKEN}\` }`,
          explanation:
            'ハードコードされたトークンを環境変数から読み込むように変更します。これにより、トークンの漏洩リスクを軽減できます。',
        },
      ],
      next_actions: [
        {
          title: 'APIトークンをローテーション',
          priority: 1,
          effort: 'S',
        },
        {
          title: 'エラーハンドリングの実装',
          priority: 2,
          effort: 'M',
        },
      ],
      artifacts: {
        markdown: generateMarkdownReport(),
      },
    };

    res.json(mockResponse);
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: 'Analysis failed' });
  }
});

function generateMarkdownReport(): string {
  return `# コード診断レポート

## 要約
APIに認証ヘッダー付きでリクエストを送信するコードです。

## 検出されたリスク

### 🔴 High: ハードコードされたAPIトークン
- **根拠**: semgrep.secret.generic (snippet:2)
- **修正方法**: 環境変数に移動し、定期的にキーをローテーションしてください
- **工数**: S
- **優先度**: 1

## 推奨される修正

### APIトークンを環境変数に移動
\`\`\`diff
- headers: { 'Authorization': 'Bearer sk-12345' }
+ headers: { 'Authorization': \\\`Bearer \\\${process.env.API_TOKEN}\\\` }
\`\`\`

ハードコードされたトークンを環境変数から読み込むように変更します。

## 次のアクション
1. APIトークンをローテーション (優先度: 1, 工数: S)
2. エラーハンドリングの実装 (優先度: 2, 工数: M)
`;
}
