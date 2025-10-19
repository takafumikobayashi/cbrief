/**
 * コードの言語を自動判定
 */
export function detectLanguage(code: string): 'javascript' | 'typescript' | 'python' {
  // TypeScript特有のキーワード・構文をチェック
  const tsPatterns = [
    /\binterface\s+\w+/,
    /\btype\s+\w+\s*=/,
    /:\s*(string|number|boolean|any|unknown|never|void)\b/,
    /<\w+>/,
    /\bas\s+\w+/,
    /\bnamespace\s+/,
    /\benum\s+/,
  ];

  // JavaScript特有のキーワード・構文をチェック
  const jsPatterns = [
    /\b(const|let|var)\s+/,
    /\bfunction\s+/,
    /=>/,
    /\b(import|export)\s+/,
    /\brequire\(/,
    /\basync\s+/,
    /\bawait\s+/,
  ];

  // Python特有のキーワード・構文をチェック
  const pyPatterns = [
    /\bdef\s+\w+\(/,
    /\bclass\s+\w+:/,
    /\bimport\s+\w+/,
    /\bfrom\s+\w+\s+import\s+/,
    /\bif\s+__name__\s*==\s*['"']__main__['"']/,
    /\bprint\(/,
    /\bself\./,
    /:\s*$/m, // インデントベースの構文（行末コロン）
  ];

  let tsScore = 0;
  let jsScore = 0;
  let pyScore = 0;

  // TypeScriptパターンのマッチング
  tsPatterns.forEach((pattern) => {
    if (pattern.test(code)) {
      tsScore += 1;
    }
  });

  // JavaScriptパターンのマッチング
  jsPatterns.forEach((pattern) => {
    if (pattern.test(code)) {
      jsScore += 1;
    }
  });

  // Pythonパターンのマッチング
  pyPatterns.forEach((pattern) => {
    if (pattern.test(code)) {
      pyScore += 1;
    }
  });

  // スコアに基づいて判定
  if (pyScore > jsScore && pyScore > tsScore) {
    return 'python';
  } else if (tsScore > jsScore) {
    return 'typescript';
  } else {
    return 'javascript';
  }
}
