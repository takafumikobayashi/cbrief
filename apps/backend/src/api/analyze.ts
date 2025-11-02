import { Router } from 'express';
import type { AnalyzeRequest } from '@cbrief/shared';
import { detectLanguage } from '../utils/languageDetector';
import { runStaticAnalysis } from '../utils/staticAnalysis';
import { formatWithGemini } from '../utils/geminiClient';
// import { extractFromAST } from '../utils/astExtractor'; // Temporarily disabled
import { loadPolicies } from '../utils/policyLoader';
import { rateLimitMiddleware } from '../middleware/rateLimiter';

export const analyzeRouter = Router();

/**
 * POST /api/analyze
 * コード解析エンドポイント（Sprint 1: 実装版）
 * レート制限付き: 1分10回、1日200回
 */
analyzeRouter.post('/analyze', rateLimitMiddleware, async (req, res) => {
  try {
    const request: AnalyzeRequest = req.body;

    // バリデーション
    if (!request.content) {
      return res.status(400).json({ error: 'content is required' });
    }

    if (request.content.length > 300000) {
      return res.status(400).json({ error: 'content exceeds 300KB limit' });
    }

    // 1. 言語判定
    let language: 'javascript' | 'typescript' | 'python' | 'json';
    if (request.languageHint === 'auto') {
      language = detectLanguage(request.content);
    } else {
      language = request.languageHint as 'javascript' | 'typescript' | 'python' | 'json';
    }

    console.log(`Detected language: ${language}`);

    // 2. ポリシー読み込み
    const policyContent = await loadPolicies(request.policies || []);
    if (policyContent) {
      console.log('Loaded policies successfully.');
    }

    // 3. AST抽出（一時的に無効化 - web-tree-sitterの設定が必要）
    // TODO: web-tree-sitterの設定を修正してから有効化
    const astData = {
      functions: [],
      classes: [],
      imports: [],
      comments: [],
    };
    console.log('AST extraction temporarily disabled');

    // 4. 静的解析（Semgrep/Bandit/Secrets）
    // JSONの場合は静的解析をスキップ
    const staticAnalysisResults =
      language === 'json' ? [] : await runStaticAnalysis(request.content, language);

    console.log(
      `Static analysis complete. Found ${staticAnalysisResults.flatMap((r) => r.findings).length} issues`
    );

    // 5. LLM整形（Gemini 1.5 Flash）
    const response = await formatWithGemini(
      request.content,
      staticAnalysisResults,
      astData,
      policyContent,
      language
    );

    // 6. JSONスキーマ検証は既存のsharedパッケージで実施済み

    res.json(response);
  } catch (error) {
    console.error('Analysis error:', error);

    res.status(500).json({
      error: 'Analysis failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});
