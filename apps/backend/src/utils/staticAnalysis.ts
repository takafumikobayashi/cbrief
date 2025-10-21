import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

const execAsync = promisify(exec);

export interface StaticAnalysisResult {
  tool: 'semgrep' | 'bandit' | 'secrets';
  findings: Finding[];
}

export interface Finding {
  rule: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  file: string;
  line: number;
  message: string;
  excerpt: string;
}

/**
 * 一時ファイルを作成してコードを書き込む
 */
async function createTempFile(content: string, extension: string): Promise<string> {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'cbrief-'));
  const tempFile = path.join(tempDir, `code${extension}`);
  await fs.writeFile(tempFile, content, 'utf-8');
  return tempFile;
}

/**
 * 一時ディレクトリとファイルを削除
 */
async function cleanupTempFile(filePath: string): Promise<void> {
  const tempDir = path.dirname(filePath);
  await fs.rm(tempDir, { recursive: true, force: true });
}

/**
 * Semgrepを実行してセキュリティ問題を検出
 */
export async function runSemgrep(
  code: string,
  language: 'javascript' | 'typescript' | 'python'
): Promise<StaticAnalysisResult> {
  const extensionMap = {
    javascript: '.js',
    typescript: '.ts',
    python: '.py',
  };

  const tempFile = await createTempFile(code, extensionMap[language]);

  try {
    // Semgrep実行（autoモード：言語とセキュリティルールを自動選択）
    const command = `semgrep --config=auto --json --quiet "${tempFile}"`;
    // Debug logging (development only - do not log user code in production)
    if (process.env.NODE_ENV === 'development') {
      console.log(`Executing Semgrep: ${command}`);
    }

    const { stdout } = await execAsync(command, {
      maxBuffer: 10 * 1024 * 1024,
    });

    if (process.env.NODE_ENV === 'development') {
      console.log(`Semgrep raw output (first 500 chars): ${stdout.substring(0, 500)}`);
    }

    const result = JSON.parse(stdout);
    if (process.env.NODE_ENV === 'development') {
      console.log(`Semgrep parsed result - results count: ${result.results?.length || 0}`);
      console.log(`Semgrep parsed result - errors count: ${result.errors?.length || 0}`);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const findings: Finding[] = result.results.map((r: any) => {
      // Semgrepの重大度をマッピング
      let severity: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
      if (r.extra?.severity === 'ERROR' || r.extra?.metadata?.impact === 'HIGH') {
        severity = 'HIGH';
      } else if (r.extra?.severity === 'WARNING' || r.extra?.metadata?.impact === 'MEDIUM') {
        severity = 'MEDIUM';
      }

      return {
        rule: r.check_id || 'unknown',
        severity,
        file: path.basename(tempFile),
        line: r.start?.line || 0,
        message: r.extra?.message || r.check_id,
        excerpt: r.extra?.lines || code.split('\n')[r.start?.line - 1] || '',
      };
    });

    if (process.env.NODE_ENV === 'development') {
      console.log(`Semgrep final findings count: ${findings.length}`);
      if (findings.length > 0) {
        console.log(`First finding: ${JSON.stringify(findings[0], null, 2)}`);
      }
    }

    return {
      tool: 'semgrep',
      findings,
    };
  } catch (error: unknown) {
    // Semgrepがエラーを返した場合でも、部分的な結果があれば返す
    const err = error as { stdout?: string; stderr?: string };
    if (process.env.NODE_ENV === 'development') {
      console.error(`Semgrep execution failed: ${err.stderr || 'Unknown error'}`);
    }

    if (err.stdout) {
      try {
        const result = JSON.parse(err.stdout);
        return {
          tool: 'semgrep',
          findings: result.results || [],
        };
      } catch (jsonError) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to parse Semgrep JSON output on error:', jsonError);
        }
      }
    }

    return {
      tool: 'semgrep',
      findings: [],
    };
  } finally {
    await cleanupTempFile(tempFile);
  }
}

/**
 * Banditを実行してPythonのセキュリティ問題を検出
 */
export async function runBandit(code: string): Promise<StaticAnalysisResult> {
  const tempFile = await createTempFile(code, '.py');

  try {
    // -r は不要（ディレクトリ用のオプション）。単一ファイルを直接指定
    const { stdout } = await execAsync(`bandit -f json "${tempFile}"`, {
      maxBuffer: 10 * 1024 * 1024,
    });

    const result = JSON.parse(stdout);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const findings: Finding[] = result.results.map((r: any) => {
      // Banditの重大度をマッピング
      let severity: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
      if (r.issue_severity === 'HIGH') {
        severity = 'HIGH';
      } else if (r.issue_severity === 'MEDIUM') {
        severity = 'MEDIUM';
      }

      return {
        rule: r.test_id || 'unknown',
        severity,
        file: path.basename(tempFile),
        line: r.line_number || 0,
        message: r.issue_text || '',
        excerpt: r.code || '',
      };
    });

    return {
      tool: 'bandit',
      findings,
    };
  } catch (error: unknown) {
    // Banditがエラーを返した場合
    const err = error as { stdout?: string };
    if (err.stdout) {
      try {
        const result = JSON.parse(err.stdout);
        return {
          tool: 'bandit',
          findings: result.results || [],
        };
      } catch {
        // JSON解析失敗
      }
    }

    return {
      tool: 'bandit',
      findings: [],
    };
  } finally {
    await cleanupTempFile(tempFile);
  }
}

/**
 * シークレット検出（簡易版）
 * 将来的にはgitleaksやtruffleHogを統合
 */
export async function detectSecrets(code: string): Promise<StaticAnalysisResult> {
  const findings: Finding[] = [];

  // シンプルな正規表現パターンでシークレットを検出
  const patterns = [
    {
      name: 'AWS Access Key',
      pattern: /AKIA[0-9A-Z]{16}/g,
      severity: 'HIGH' as const,
    },
    {
      name: 'Generic API Key',
      pattern: /['"]?api[_-]?key['"]?\s*[:=]\s*['"]([a-zA-Z0-9_-]{20,})['"]?/gi,
      severity: 'HIGH' as const,
    },
    {
      name: 'GitHub Token',
      pattern: /ghp_[a-zA-Z0-9]{36}/g,
      severity: 'HIGH' as const,
    },
    {
      name: 'Private Key',
      pattern: /-----BEGIN\s+(RSA\s+)?PRIVATE\s+KEY-----/g,
      severity: 'HIGH' as const,
    },
  ];

  const lines = code.split('\n');

  patterns.forEach((pattern) => {
    lines.forEach((line, index) => {
      const matches = Array.from(line.matchAll(pattern.pattern));
      matches.forEach(() => {
        findings.push({
          rule: `secret-detection-${pattern.name.toLowerCase().replace(/\s+/g, '-')}`,
          severity: pattern.severity,
          file: 'code',
          line: index + 1,
          message: `Potential ${pattern.name} detected`,
          excerpt: line,
        });
      });
    });
  });

  return {
    tool: 'secrets',
    findings,
  };
}

/**
 * 言語に応じた静的解析を実行
 */
export async function runStaticAnalysis(
  code: string,
  language: 'javascript' | 'typescript' | 'python'
): Promise<StaticAnalysisResult[]> {
  const results: StaticAnalysisResult[] = [];

  // Semgrepは全言語対応
  results.push(await runSemgrep(code, language));

  // Banditはpythonのみ
  if (language === 'python') {
    results.push(await runBandit(code));
  }

  // シークレット検出は全言語共通
  results.push(await detectSecrets(code));

  return results;
}
