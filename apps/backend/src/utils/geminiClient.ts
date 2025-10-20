import { GoogleGenerativeAI } from '@google/generative-ai';
import type { AnalyzeResponse, Risk } from '@cbrief/shared';
import type { StaticAnalysisResult } from './staticAnalysis';
import type { ASTExtractionResult } from './astExtractor';

/**
 * Gemini APIを使用して静的解析結果を業務言語に整形
 */
export async function formatWithGemini(
  code: string,
  staticAnalysisResults: StaticAnalysisResult[],
  astData: ASTExtractionResult,
  policyContent: string,
  language: string
): Promise<AnalyzeResponse> {
  // Initialize Google Generative AI with API key from environment
  const apiKey = process.env.GEMINI_API_KEY || '';
  console.log(
    `[DEBUG] Gemini API Key in formatWithGemini - length: ${apiKey.length}, starts with: ${apiKey.substring(0, 10)}...`
  );

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-lite',
    generationConfig: {
      maxOutputTokens: 8192, // Increase token limit for longer responses
      temperature: 0.2, // Lower temperature for more consistent JSON output
    },
  });

  // システムプロンプト - 極めて簡潔な出力を強制
  const systemPrompt = `あなたは非エンジニア向けのコードレビュアーです。
技術用語を避け、業務言語で説明してください。
出力は必ず指定されたJSON形式で返してください。

【重要な制約】
- 各説明文は最大50文字以内に収めてください
- 配列の要素数は最大3個まで
- 冗長な説明は一切不要です
- JSONは必ず完全な形式で出力してください
- JSONファイルの場合は、設定内容や構造を業務言語で説明してください`;

  // 静的解析結果を整形（最大3件まで）
  const findingsText = staticAnalysisResults
    .flatMap((result) => result.findings)
    .slice(0, 3)
    .map((finding) => {
      return `- ${finding.severity}: ${finding.message.substring(0, 100)}`;
    })
    .join('\n');

  // AST情報を整形
  const astText = `
関数: ${astData.functions.slice(0, 3).join(', ') || 'なし'}
クラス: ${astData.classes.slice(0, 3).join(', ') || 'なし'}
ライブラリ: ${astData.imports.slice(0, 3).join(', ') || 'なし'}
`;

  // ポリシー情報を整形
  const policyText = policyContent ? `\n\nポリシー: ${policyContent.substring(0, 200)}` : '';

  // ユーザープロンプト - 簡潔さを最優先
  const userPrompt = `コード解析結果をJSON形式で出力してください。

言語: ${language}

コード:
\`\`\`
${code.substring(0, 3000)} ${code.length > 3000 ? '...' : ''}
\`\`\`

構造:
${astText}

検出問題:
${findingsText || 'なし'}
${policyText}

以下のJSON形式で出力（各フィールドは簡潔に）:
{
  "summary": {
    "purpose": "目的を100文字程度でこのコードが何をするものか、非エンジニアでもわかるように作りや役割を明確に説明",
    "io": {
      "inputs": ["入力1", "入力2"],
      "outputs": ["出力1"]
    },
    "data_sensitivity": ["機密データ1"],
    "side_effects": ["副作用1"],
    "ops_requirements": ["運用要件1"]
  },
  "risks": [
    {
      "risk": "リスク説明(50文字以内)",
      "severity": "High|Medium|Low",
      "evidence": {
        "rule": "ルール名",
        "file": "ファイル",
        "line": 行番号,
        "excerpt": "コード抜粋"
      },
      "fix": "修正案(50文字以内)",
      "effort": "S|M|L",
      "priority": 1
    }
  ],
  "next_actions": [
    {
      "title": "アクション(30文字以内)",
      "prompt": "AIに投げるプロンプト案(100文字以内)"
    }
  ],
  "artifacts": {
    "markdown": ""
  }
}

【next_actionsの注意】
- このツールはVibeCording（AIとの対話型開発）をサポートします
- next_actionsには、ユーザーが次にAIに投げるべきプロンプト案を含めてください
- promptは具体的で、そのままAIに投げられる形式にしてください`;

  try {
    const result = await model.generateContent([{ text: systemPrompt }, { text: userPrompt }]);

    const response = result.response;
    const text = response.text();

    console.log(`[DEBUG] Gemini raw response (first 1000 chars): ${text.substring(0, 1000)}`);

    // JSON部分を抽出（```json ... ``` の中身を取得）
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (!jsonMatch) {
      // Fallback: try to find JSON object without markdown fence
      const jsonOnlyMatch = text.match(/{[\s\S]*}/);
      if (!jsonOnlyMatch) {
        throw new Error('Gemini response does not contain valid JSON');
      }
      const jsonText = jsonOnlyMatch[0];
      console.log(
        `[DEBUG] Extracted JSON without fence (first 500 chars): ${jsonText.substring(0, 500)}`
      );
      const analyzedData = JSON.parse(jsonText);
      return {
        ...analyzedData,
        detectedLanguage: language as 'javascript' | 'typescript' | 'python',
      };
    }

    const jsonText = jsonMatch[1];
    console.log(`[DEBUG] Extracted JSON (first 500 chars): ${jsonText.substring(0, 500)}`);

    // Try to parse JSON with better error handling
    let analyzedData: AnalyzeResponse;
    try {
      analyzedData = JSON.parse(jsonText);
    } catch (parseError) {
      // If JSON parse fails, log the error and re-throw
      console.error('[DEBUG] JSON parse failed:', parseError);
      console.error(
        '[DEBUG] Problematic JSON (last 500 chars):',
        jsonText.substring(Math.max(0, jsonText.length - 500))
      );
      throw new Error(`Failed to parse Gemini response: ${parseError}`);
    }

    return {
      ...analyzedData,
      detectedLanguage: language as 'javascript' | 'typescript' | 'python' | 'json',
    };
  } catch (error) {
    console.error('Gemini API error:', error);

    // エラー時のフォールバック: 静的解析結果から基本的なレスポンスを生成
    return createFallbackResponse(code, staticAnalysisResults, astData, policyContent, language);
  }
}

/**
 * Gemini APIエラー時のフォールバックレスポンスを生成
 */
function createFallbackResponse(
  code: string,
  staticAnalysisResults: StaticAnalysisResult[],
  astData: ASTExtractionResult,
  policyContent: string, // policyContentを引数に追加
  language: string
): AnalyzeResponse {
  const allFindings = staticAnalysisResults.flatMap((result) => result.findings);

  const risks: Risk[] = allFindings.map((finding) => ({
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
    effort: 'M',
    priority: finding.severity === 'HIGH' ? 1 : finding.severity === 'MEDIUM' ? 2 : 3,
  }));

  const policyWarning = policyContent
    ? '社内ポリシーが適用されていますが、詳細分析にはGemini APIキーが必要です。'
    : '詳細な分析にはGemini APIキーが必要です';

  return {
    detectedLanguage: language as 'javascript' | 'typescript' | 'python' | 'json',
    summary: {
      purpose: `${language}で書かれたコードの解析結果です。主な関数: ${astData.functions.join(', ')}`,
      io: {
        inputs: [policyWarning],
        outputs: ['解析結果'],
      },
      data_sensitivity: [],
      side_effects: [],
      ops_requirements: [],
      scope_limits: ['Gemini APIが利用できないため、詳細な分析は行えませんでした。'],
    },
    risks,
    next_actions: [
      {
        title: 'Gemini APIキーを設定',
        prompt: 'Gemini APIキーを設定して、より詳細なコード分析を有効にしてください。',
      },
    ],
    artifacts: {
      markdown: `# コード解析レポート\n\n## 検出された問題\n\n${risks.map((r) => `- ${r.risk}`).join('\n')}`,
    },
  };
}
