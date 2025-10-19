import { GoogleGenerativeAI } from '@google/generative-ai';
import type { AnalyzeResponse } from '@cbrief/shared';
import type { StaticAnalysisResult } from './staticAnalysis';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

/**
 * Gemini APIを使用して静的解析結果を業務言語に整形
 */
export async function formatWithGemini(
  code: string,
  staticAnalysisResults: StaticAnalysisResult[],
  language: string
): Promise<AnalyzeResponse> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  // システムプロンプト
  const systemPrompt = `あなたは非エンジニア向けのコードレビュアーです。
技術用語を避け、業務言語で説明してください。
断定を避け、根拠を列挙してください。
出力は必ず指定されたJSON形式で返してください。`;

  // 静的解析結果を整形
  const findingsText = staticAnalysisResults
    .flatMap((result) => result.findings)
    .map((finding) => {
      return `- ツール: ${finding.rule}\n  重大度: ${finding.severity}\n  行: ${finding.line}\n  メッセージ: ${finding.message}\n  コード: ${finding.excerpt}`;
    })
    .join('\n\n');

  // ユーザープロンプト
  const userPrompt = `以下のコードを解析し、業務言語で説明してください。

プログラミング言語: ${language}

コード:
\`\`\`
${code.substring(0, 5000)} ${code.length > 5000 ? '...(省略)' : ''}
\`\`\`

静的解析ツールで検出された問題:
${findingsText || 'なし'}

以下のJSON形式で回答してください:
{
  "summary": {
    "purpose": "このコードの目的を業務言語で説明",
    "io": {
      "inputs": ["入力データ1", "入力データ2"],
      "outputs": ["出力データ1", "出力データ2"]
    },
    "data_sensitivity": ["個人情報", "機密情報"],
    "side_effects": ["外部APIへの送信", "データベース更新"],
    "ops_requirements": ["定期実行が必要", "エラー監視が必要"]
  },
  "risks": [
    {
      "risk": "リスクの説明（業務言語）",
      "severity": "High|Medium|Low",
      "evidence": {
        "rule": "検出ルール名",
        "file": "ファイル名",
        "line": 行番号,
        "excerpt": "該当コード"
      },
      "fix": "修正方法の説明（業務言語）",
      "effort": "S|M|L",
      "priority": 1
    }
  ],
  "fixes": [
    {
      "title": "修正案のタイトル",
      "explanation": "修正の説明（業務言語）",
      "diff": "修正前後の差分"
    }
  ],
  "next_actions": [
    {
      "title": "次のアクション",
      "effort": "S|M|L",
      "priority": 1,
      "owner": "担当者（任意）",
      "duedate": "期限（任意）"
    }
  ],
  "artifacts": {
    "markdown": "Markdown形式のレポート"
  }
}`;

  try {
    const result = await model.generateContent([{ text: systemPrompt }, { text: userPrompt }]);

    const response = result.response;
    const text = response.text();

    // JSON部分を抽出（```json ... ``` の中身を取得）
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/{[\s\S]*}/);
    if (!jsonMatch) {
      throw new Error('Gemini response does not contain valid JSON');
    }

    const jsonText = jsonMatch[1] || jsonMatch[0];
    const analyzedData: AnalyzeResponse = JSON.parse(jsonText);

    return analyzedData;
  } catch (error) {
    console.error('Gemini API error:', error);

    // エラー時のフォールバック: 静的解析結果から基本的なレスポンスを生成
    return createFallbackResponse(code, staticAnalysisResults, language);
  }
}

/**
 * Gemini APIエラー時のフォールバックレスポンスを生成
 */
function createFallbackResponse(
  code: string,
  staticAnalysisResults: StaticAnalysisResult[],
  language: string
): AnalyzeResponse {
  const allFindings = staticAnalysisResults.flatMap((result) => result.findings);

  const risks = allFindings.map((finding) => ({
    risk: finding.message,
    severity:
      finding.severity === 'HIGH' ? 'High' : finding.severity === 'MEDIUM' ? 'Medium' : 'Low',
    evidence: {
      rule: finding.rule,
      file: finding.file,
      line: finding.line,
      excerpt: finding.excerpt,
    },
    fix: '詳細な修正案についてはエンジニアに相談してください',
    effort: 'M' as const,
    priority: finding.severity === 'HIGH' ? 1 : finding.severity === 'MEDIUM' ? 2 : 3,
  }));

  return {
    summary: {
      purpose: `${language}で書かれたコードの解析結果です`,
      io: {
        inputs: ['詳細な分析にはGemini APIキーが必要です'],
        outputs: ['解析結果'],
      },
      data_sensitivity: [],
      side_effects: [],
      ops_requirements: [],
    },
    risks,
    fixes: [],
    next_actions: [
      {
        title: 'Gemini APIキーを設定して詳細な分析を有効化',
        effort: 'S',
        priority: 1,
      },
    ],
    artifacts: {
      markdown: `# コード解析レポート\n\n## 検出された問題\n\n${risks.map((r) => `- ${r.risk}`).join('\n')}`,
    },
  };
}
