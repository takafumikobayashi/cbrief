import { Router } from 'express';
import type { AnalyzeRequest } from '@cbrief/shared';
import { detectLanguage } from '../utils/languageDetector';
import { runStaticAnalysis } from '../utils/staticAnalysis';
import { formatWithGemini } from '../utils/geminiClient';

export const analyzeRouter = Router();

/**
 * POST /api/analyze
 * コード解析エンドポイント（Sprint 1: 実装版）
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

    // 1. 言語判定
    let language: 'javascript' | 'typescript' | 'python';
    if (request.languageHint === 'auto') {
      language = detectLanguage(request.content);
    } else {
      language = request.languageHint as 'javascript' | 'typescript' | 'python';
    }

    console.log(`Detected language: ${language}`);

    // 2. 静的解析（Semgrep/Bandit/Secrets）
    const staticAnalysisResults = await runStaticAnalysis(request.content, language);

    console.log(
      `Static analysis complete. Found ${staticAnalysisResults.flatMap((r) => r.findings).length} issues`
    );

    // 3. LLM整形（Gemini 1.5 Flash）
    const response = await formatWithGemini(request.content, staticAnalysisResults, language);

    // 4. JSONスキーマ検証は既存のsharedパッケージで実施済み

    res.json(response);
  } catch (error) {
    console.error('Analysis error:', error);

    res.status(500).json({
      error: 'Analysis failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});
