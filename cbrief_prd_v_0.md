# 逆引きコード診断MVP PRD v0.1（Draft）

作成: 2025-10-19 / 作成者: みけ（他力code）

---

## 0. 要約（1ページ）

**目的**: AI生成/外部委託コードを非エンジニアにも理解できる業務言語に翻訳し、リスクと対応案を即時提示する。 **対象**: 企業・NPOの非エンジニア部門（情報シス/企画/現場責任者）。 **コア機能**: コード貼付→［分析］→「要約/リスク/修正案/次アクション」を自動生成。静的解析とLLM説明の二重根拠。既定で無保存。 **初期対応**: JS/TS、Python。 **成功KPI**: 10分以内に把握、重大リスク見落とし率<5%（手動比）、次アクション着手率>70%。

---

## 1. 背景と課題

- バイブコーディングや生成AIにより「コードを書く人」が増加。一方で**非エンジニア部門がコードの意味と安全性を判断できない**。
- セキュリティ実装漏れ、保守性/継続性の欠如、ライセンスリスク等が顕在化。
- 既存ツールはエンジニア向けUI/出力が中心で、\*\*意思決定に必要な“業務言語の要約”\*\*が不足。

**仮説**: 非エンジニアが理解可能な1枚サマリ＋優先度付きリスク＆対応で、現場の判断速度と品質が向上する。

---

## 2. スコープ

### In（MVP）

- 入力: ソースコードを直接Web画面にペースト（.js/.ts/.py）。（v0.2で単一ファイルアップロード追加予定）
- 解析: 言語判定→AST抽出→静的解析（Semgrep/ESLint/Secrets検出）→LLM整形→JSONスキーマ検証。
- 出力:
  - 1枚サマリ（業務言語）
  - リスク一覧（重大度・根拠・修正案・概算工数・優先度）
  - やさしい修正案（自然文＋最小差分）
  - 次アクション（チェックリスト/Jira雛形）
- エクスポート: Markdown / PDF / Jiraタスク（CSV or REST）
- ポリシー注入: `/policies/*.md` をRAGで反映（例: パスワード方針、ログ/監査、命名規約）
- 既定: **無保存**（オプトイン保存）

### Out（MVP外）

- リポジトリ丸ごと解析、複数ファイル/依存解決、実行時解析、SCA（依存脆弱性DB連携）
- 社内SSO/権限管理、MCP/エージェント連携（将来）
- 多言語（Java等）対応、Power Automate JSON対応、CI/CD自動ゲート

---

## 3. ペルソナ / JTBD

- **非エンジニア責任者**: 「このコード、何をする？危なくない？直すならどこ？」
- **情報シス/PMO**: 「導入判断/委託範囲/優先度を決めたい」
- **NPO事務局**: 「個人情報の扱いと運用コストが心配」

JTBD: *理解→リスク把握→意思決定→アクション* を1セッションで完結。

---

## 4. ユーザーフロー（MVP）

1. Webでコードをペースト
2. 「保存しない」トグル確認→［分析］
3. 結果タブ表示
   - 要約（業務向け）
   - リスク（重大度×根拠×対応）
   - 修正案（差分）
   - 次アクション（担当/期日/難易度）
4. エクスポート（MD/PDF/Jira）

---

## 5. 機能要件（Functional Requirements）

**FR-001 入力**: 10,000行/300KB程度まで（MVPの目安）。 **FR-002 言語判定**: 拡張子/先頭トークン/JSONスキーマで自動。 **FR-003 AST抽出**: tree-sitterにより関数/クラス/呼出関係/外部I/Oを抽出。 **FR-004 静的解析**:

- JS/TS: ESLint（基本規約＋セキュリティプラグイン）、Semgrep（javascript, security, xss, command-injection等のルールセット）
- Python: Bandit、Semgrep（python, security）
- Secrets: APIキー/秘密の正規表現検出（軽量設定）

**FR-005 LLM整形**: 解析結果＋ポリシーRAGをプロンプト入力→要約/リスク/修正案 JSONを生成。 **FR-006 二重根拠**: 各リスク項目に「静的解析の証跡」を必須添付（ファイル名/行/ルールID/抜粋）。 **FR-007 重大度**: High/Medium/Low（定義は§10）。 **FR-008 修正案**: 最小差分（Unified diff/疑似diff可）＋自然文説明。 **FR-009 次アクション**: issue雛形（title/desc/owner/priority/effort/duedate[空欄]）。 **FR-010 エクスポート**: HTML→PDF、Markdown、Jira（CSV or REST） **FR-011 ポリシー注入**: `/policies/*.md` を差分優先でマージ（版管理はGit前提）。 **FR-012 ログ**: 既定はメタデータのみ（処理時間/成功可否/言語/行数）。コード本文は既定で破棄。

---

### 入力方式の比較と方針（MVP）

- **ペースト（推奨 / v0.1）**: 即時・無保存・小規模コード向け。拡張子不明時は言語自動判定。クリップボード制限や巨大ファイルには不向き。
- **単一ファイルアップロード（v0.2）**: ドラッグ&ドロップで便利、**ファイル名/拡張子/エンコーディングを保持**、300KBまで。**保存は既定OFF**、解析後即削除。対象は `text/*` と `.js/.ts/.py` のみ（ZIPやバイナリ不可）。
- **実装方針**: v0.1はペーストのみ → v0.2でファイルアップロードを追加し、バックエンドは両入力を同一解析パイプラインに統合。

## 6. 非機能要件（NFR）

- **NFR-001 応答時間**: 3000行/1ファイルでP50≤12s, P95≤25s（クラウド実行、キャッシュ無）
- **NFR-002 可用性**: MVPは単AZ/低冗長（β段階）。
- **NFR-003 セキュリティ**:
  - デフォルト無保存、TLS 1.2+、静止データは保存時のみKMS
  - 実行サンドボックス（ファイル実行不可、ネット遮断）
- **NFR-004 プライバシー**: PII検出でマスク提案、外部送信なし（LLMは選択式：ローカル/クラウド）
- **NFR-005 監査**: 生成レポートに根拠セクションを付与（ルールID/行番号/抜粋）

---

## 7. UI仕様（MVP）

- 画面: 単一ページ（3カラム/タブ）
  - 上部: 入力エリア、無保存トグル、［分析］ボタン
  - 中央: タブ（要約｜リスク｜修正案｜次アクション）
  - 右側: エクスポート、ポリシー適用状況
- アクセシビリティ: 14pt以上、用語には脚注（ホバーで説明）

---

## 8. API仕様（MVP）

### POST /analyze

**Request (JSON)**

```json
{
  "languageHint": "auto|javascript|typescript|python",
  "content": "<pasted code>",
  "policies": ["logging.md", "password-policy.md"],
  "save": false
}
```

**Response (JSON)**

```json
{
  "summary": {
    "purpose": "...",
    "io": {"inputs": ["..."], "outputs": ["..."]},
    "data_sensitivity": ["PII", "credentials"],
    "side_effects": ["Writes to S3 bucket '...'"] ,
    "ops_requirements": ["Daily key rotation"],
    "scope_limits": ["No input validation for ..."]
  },
  "risks": [
    {
      "risk": "Hard-coded API key",
      "severity": "High",
      "evidence": {
        "rule": "semgrep.secret.generic",
        "file": "snippet",
        "line": 42,
        "excerpt": "const key='sk-...';"
      },
      "fix": "Read from env var and rotate key",
      "effort": "S",
      "priority": 1
    }
  ],
  "fixes": [
    {
      "title": "Move secret to env",
      "diff": "- const key='sk-...';\n+ const key=process.env.API_KEY;",
      "explanation": "..."
    }
  ],
  "next_actions": [
    {"title": "Rotate API key", "owner": "", "priority": 1, "effort": "S"}
  ],
  "artifacts": {"markdown": "# レポート..."}
}
```

---

## 9. 出力JSONスキーマ（抜粋）

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "required": ["summary", "risks"],
  "properties": {
    "summary": {
      "type": "object",
      "required": ["purpose", "io", "data_sensitivity"],
      "properties": {
        "purpose": {"type": "string", "maxLength": 1000},
        "io": {
          "type": "object",
          "properties": {
            "inputs": {"type": "array", "items": {"type": "string"}},
            "outputs": {"type": "array", "items": {"type": "string"}}
          }
        },
        "data_sensitivity": {"type": "array", "items": {"enum": ["None","PII","Credentials","Payment","Health","Other"]}},
        "side_effects": {"type": "array", "items": {"type": "string"}},
        "ops_requirements": {"type": "array", "items": {"type": "string"}},
        "scope_limits": {"type": "array", "items": {"type": "string"}}
      }
    },
    "risks": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["risk","severity","evidence","fix","priority"],
        "properties": {
          "risk": {"type": "string"},
          "severity": {"enum": ["High","Medium","Low"]},
          "evidence": {
            "type": "object",
            "properties": {
              "rule": {"type": "string"},
              "file": {"type": "string"},
              "line": {"type": "integer"},
              "excerpt": {"type": "string"}
            }
          },
          "fix": {"type": "string"},
          "effort": {"enum": ["S","M","L"]},
          "priority": {"type": "integer", "minimum": 1}
        }
      }
    }
  }
}
```

---

## 10. 重大度定義とマッピング

- **High**: 機密漏えい/リモート実行/認証欠如/直SQL/外部送信/PII無防備
- **Medium**: 入力検証不備/弱い暗号/ログ過多/例外無処理/冪等性欠如
- **Low**: 命名/コメント/軽微なLint/警告

**マッピング例**

- Semgrep `security.*`, `xss.*`, `command-injection.*` → High
- Secrets検出（APIキー/トークン） → High
- ESLint `no-eval`, `no-inner-html` → Medium〜High（文脈で昇格）
- Pythonで `subprocess.run(..., shell=True)` の使用検出→Medium〜High（文脈で昇格）

---

## 11. Power Automate/Low-code 解析（将来）

- v1以降で対応（kintone/Power Automate/Power Apps など）。
- MVPは**ソースコード（JS/TS/Python）のみ**対象。
- 顧客の利用状況を見て優先度を再評価する。

---

## 12. プロンプト設計（骨子）

### System

- 「非エンジニア向けに、業務言語で、断定を避け**根拠を列挙**。出力は**必ず指定JSON**。」

### User（入力）

- AST/解析結果/ルール/ポリシーRAGの要点

### Assistant（フォーマット拘束）

- JSONスキーマを埋め込み、検証失敗時は自己リトライ1回

**語調**: 比喩は短く、専門用語は脚注。過度な自信表現禁止。

---

## 13. アーキテクチャ（MVP）

- **フロント**: Next.js + Tailwind（シンプル1ページ）
- **API**: Node/Express（/analyze）
- **解析ワーカー**: sandbox（Semgrep/ESLint/Secrets）→ LLM → Schema Validate → レポート
- **ストレージ**: 既定無保存。保存フラグ時のみS3（KMS）。

---

## 14. 運用・ログ

- 収集: 処理時間、言語、行数、ルールヒット数、失敗事象
- PII対策: コード本文ログ禁止、抜粋は3行まで・マスク

---

## 15. メトリクス/KPI

- TTI（解析完了まで）
- 重大リスク見落とし率（ゴールドセット比較）
- 非エンジニア理解到達時間（ユーザテスト）
- 次アクション着手率/エクスポート率

---

## 16. リスクと緩和

- 誤検知/過検知→ 二重根拠＋レベル調整UI、フィードバックで学習
- LLM逸脱→ JSON拘束＋温度低＋再生成1回
- 機微データ→ 既定無保存、即時破棄、マスク

---

## 17. ロードマップ（2週間×2）

**Sprint 0（2日）**: UI骨組み、/analyzeモック、JSONスキーマ **Sprint 1（1週）**: Semgrep/ESLint/Bandit/Secrets統合、LLM整形、Markdown/PDF出力 **Sprint 2（1週）**: ポリシーRAG、Jira出力、ユーザテスト→プロンプト調整

---

## 18. テスト/受入基準（抜粋）

- 300行JSサンプルでP95≤8s/正しくHigh1件以上検出
- `eval()` を含むとMedium以上に分類、根拠にルールID/行番号
- Pythonで subprocess.run(..., shell=True) 使用検出→Medium〜High（文脈で昇格）
- JSONスキーマ常に検証OK（バリデータ導入）
- エクスポート（PDF/MD/Jira CSV）成功

---

## 19. 法務/ライセンス

- 解析対象コードの取扱い同意画面（第三者著作物/機微の扱い）
- ルールセット（Semgrep等）のライセンス表記

---

## 20. オープン課題

- 依存脆弱性（SCA）連携の優先度/範囲
- ローカルLLM選択肢（社内運用向け）
- 多言語拡張とルール整備
- MCP/エージェント連携のAPIデザイン

---

## 付録A: サンプル入力と出力（短縮）

**入力（JS）**

```js
fetch('https://api.example.com', {
  headers: { 'Authorization': 'Bearer sk-12345' }
})
```

**期待されるリスク例**

```json
{
  "risk": "Hard-coded token in header",
  "severity": "High",
  "evidence": {"rule":"semgrep.secret.generic","line":2,"excerpt":"Bearer sk-***"},
  "fix": "環境変数に退避、キー回転、送信先ドメインの固定化",
  "effort": "S",
  "priority": 1
}
```

