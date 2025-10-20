/**
 * 解析リクエストの型定義
 */
export interface AnalyzeRequest {
  /** 言語ヒント（auto: 自動判定） */
  languageHint: 'auto' | 'javascript' | 'typescript' | 'python';
  /** 解析対象のコード */
  content: string;
  /** 適用するポリシーファイル名のリスト */
  policies?: string[];
  /** 保存フラグ（MVPでは常にfalse） */
  save: boolean;
}

/**
 * データの機微性レベル
 */
export type DataSensitivity = 'None' | 'PII' | 'Credentials' | 'Payment' | 'Health' | 'Other';

/**
 * リスクの重大度
 */
export type Severity = 'High' | 'Medium' | 'Low';

/**
 * 作業工数の見積もり
 */
export type Effort = 'S' | 'M' | 'L';

/**
 * 要約情報
 */
export interface Summary {
  /** コードの目的（業務言語で説明） */
  purpose: string;
  /** 入出力の情報 */
  io: {
    inputs: string[];
    outputs: string[];
  };
  /** 扱うデータの機微性 */
  data_sensitivity: DataSensitivity[];
  /** 副作用（外部システムへの影響等） */
  side_effects: string[];
  /** 運用要件 */
  ops_requirements: string[];
  /** スコープの制限事項 */
  scope_limits: string[];
}

/**
 * リスクの根拠情報
 */
export interface Evidence {
  /** 静的解析ルールID */
  rule: string;
  /** ファイル名 */
  file: string;
  /** 行番号 */
  line: number;
  /** コード抜粋 */
  excerpt: string;
}

/**
 * 検出されたリスク
 */
export interface Risk {
  /** リスクの内容 */
  risk: string;
  /** 重大度 */
  severity: Severity;
  /** 根拠 */
  evidence: Evidence;
  /** 修正方法の説明 */
  fix: string;
  /** 修正工数 */
  effort: Effort;
  /** 優先度（1が最高） */
  priority: number;
}

/**
 * 次にとるべきアクション（VibeCording向けプロンプト提案）
 */
export interface NextAction {
  /** タスクのタイトル */
  title: string;
  /** AIに投げるプロンプト案 */
  prompt: string;
}

/**
 * 解析結果のレスポンス
 */
export interface AnalyzeResponse {
  /** 判定された言語 */
  detectedLanguage: 'javascript' | 'typescript' | 'python' | 'json';
  /** 要約情報 */
  summary: Summary;
  /** リスク一覧 */
  risks: Risk[];
  /** 次アクション一覧（VibeCording向けプロンプト提案） */
  next_actions: NextAction[];
  /** エクスポート用アーティファクト */
  artifacts: {
    /** Markdown形式のレポート */
    markdown: string;
  };
}
