/**
 * コードの言語を自動判定
 */
export function detectLanguage(code: string): 'javascript' | 'typescript' | 'python' | 'json' {
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

  // JSON特有のパターンをチェック
  const jsonPatterns = [
    /^\s*\{/, // 開始が{
    /\}\s*$/, // 終了が}
    /"\w+":\s*[{["\d]/, // "key": value形式
    /"\w+":\s*null/, // null値
    /"\w+":\s*(true|false)/, // boolean値
  ];

  let tsScore = 0;
  let jsScore = 0;
  let pyScore = 0;
  let jsonScore = 0;

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

  // JSONパターンのマッチング
  jsonPatterns.forEach((pattern) => {
    if (pattern.test(code)) {
      jsonScore += 1;
    }
  });

  // JSONバリデーション（パース可能かチェック）
  try {
    JSON.parse(code.trim());
    jsonScore += 3; // JSONとしてパース可能なら大幅加点
  } catch {
    // パースできない場合はスコアを下げる
    jsonScore = Math.max(0, jsonScore - 2);
  }

  // スコアに基づいて判定
  if (jsonScore >= 3) {
    return 'json';
  } else if (pyScore > jsScore && pyScore > tsScore) {
    return 'python';
  } else if (tsScore > jsScore) {
    return 'typescript';
  } else {
    return 'javascript';
  }
}
