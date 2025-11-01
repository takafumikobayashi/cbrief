# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

**cbrief（コードブリーフ）** は、AI生成や外部委託されたコードを非エンジニアが理解・判断できるように、業務言語で要約・リスク診断・修正案を提示するツールです。

- **対象ユーザー**: 企業・NPOの非エンジニア部門（情報シス/企画/現場責任者）
- **コア機能**: コード貼付 → 分析 → 要約/リスク/修正案/次アクションを自動生成
- **技術スタック**: Next.js (frontend), Express (backend), Gemini 1.5 Flash (LLM)
- **MVP方針**: 完全無保存、JS/TS/Python対応、静的解析とLLM説明の二重根拠

## 開発コマンド

### セットアップ

```bash
# 依存関係のインストール
pnpm install

# 環境変数の設定
cp .env.example .env
# .envを編集してGEMINI_API_KEYを設定
```

### 開発サーバー起動

```bash
# 全パッケージ同時起動（フロントエンド + バックエンド）
pnpm dev

# 個別起動
pnpm --filter @cbrief/frontend dev  # http://localhost:3000
pnpm --filter @cbrief/backend dev   # http://localhost:3001
```

### ビルドとテスト

```bash
# 全パッケージビルド（依存関係を自動解決）
pnpm build

# テスト（バックエンドのみ）
pnpm --filter @cbrief/backend test

# リント（全パッケージ）
pnpm lint

# リント + 自動修正
pnpm lint:fix

# コードフォーマット（Prettier）
pnpm format

# フォーマットチェック（CIで使用）
pnpm format:check

# クリーン
pnpm clean
```

## プロジェクト構造

### Monorepo構成

```bash
cbrief/
├── apps/
│   ├── frontend/          # Next.js アプリケーション
│   └── backend/           # Express API サーバー
├── packages/
│   └── shared/            # 共通型定義・JSONスキーマ
└── policies/              # RAG用ポリシーファイル（将来実装）
```

- **pnpm workspaces** でモノレポ管理
- **Turborepo** で依存関係を考慮した並列ビルド・キャッシュ
- `@cbrief/shared` パッケージで型定義を共有（frontend ⇔ backend間で型安全）

### アーキテクチャ

```bash
[ブラウザ] → [Next.js Frontend] → [Express Backend] → [解析ワーカー] → [LLM]
                                         ↓
                                   [JSONスキーマ検証]
```

**フロントエンド (apps/frontend):**

- Next.js 14 + Tailwind CSS
- シンプルな1ページUI（入力エリア + タブ表示）
- PRD §7: 14pt以上のフォント、非エンジニア向けアクセシビリティ重視

**バックエンド (apps/backend):**

- Express + TypeScript
- `/api/analyze` エンドポイント（POST）
- 実装済み（Sprint 1完了）:
  1. 言語判定 (`utils/languageDetector.ts`)
  2. 静的解析 (`utils/staticAnalysis.ts`) - Semgrep/Bandit/Secrets
  3. LLM整形 (`utils/geminiClient.ts`) - Gemini 2.0 Flash Lite
  4. JSONスキーマ検証 (`@cbrief/shared`)
  5. ポリシーローダー (`utils/policyLoader.ts`)
- 注意: AST抽出 (`utils/astExtractor.ts`) は一時的に無効化中（web-tree-sitter設定が必要）

**共通パッケージ (packages/shared):**

- TypeScript型定義（`types.ts`）
- JSONスキーマ（`schema.ts`）
- PRD §9の仕様に準拠

### API仕様

**POST /api/analyze:**

Request:

```json
{
  "languageHint": "auto|javascript|typescript|python",
  "content": "<解析対象コード>",
  "policies": ["logging.md"], // 将来実装
  "save": false // MVPでは常にfalse
}
```

Response:

```json
{
  "summary": {
    /* 要約情報 */
  },
  "risks": [
    /* リスク一覧 */
  ],
  "fixes": [
    /* 修正案 */
  ],
  "next_actions": [
    /* 次アクション */
  ],
  "artifacts": { "markdown": "..." }
}
```

詳細は `packages/shared/src/types.ts` と PRD §8を参照。

## コード品質

### ESLintとPrettier

プロジェクト全体でESLintとPrettierによる静的チェックと自動フォーマットを設定済み。

**設定ファイル:**

- `.eslintrc.json` - ルートESLint設定
- `.prettierrc.json` - Prettier設定
- 各パッケージに個別の `.eslintrc.json` を配置

**VSCode統合:**

- `.vscode/settings.json` - 保存時に自動フォーマット有効
- `.vscode/extensions.json` - 推奨拡張機能リスト

**ルール:**

- TypeScript: `@typescript-eslint/recommended`
- フロントエンド: Next.js ESLint設定 + Prettier
- バックエンド: Node.js推奨設定 + Prettier
- unused varsは警告レベル（`_`プレフィックスで無視可能）

**コミット前チェック（推奨）:**

```bash
pnpm lint:fix && pnpm format
```

## 開発ガイドライン

### 型定義の変更

`packages/shared/src/types.ts` を変更した場合:

1. フロントエンドとバックエンドの両方に自動反映される
2. TypeScriptの型チェックで不整合を検出
3. PRD §9のJSONスキーマと整合性を保つこと

### 静的解析ルール（Sprint 1以降）

PRD §10のマッピング定義に従う:

- **High**: Semgrep `security.*`, Secrets検出、`eval()`等
- **Medium**: 入力検証不備、弱い暗号、例外無処理
- **Low**: 命名、コメント、軽微なLint

各リスクには必ず `evidence` フィールド（ルールID/行番号/抜粋）を付与。

### LLMプロンプト設計

PRD §12に基づく:

- 非エンジニア向けに業務言語で説明
- 断定を避け、根拠を列挙
- 出力は必ずJSONスキーマに準拠
- 語調: 比喩は短く、専門用語は脚注

**重要な実装ノート**:

- システムプロンプトで必須フィールド（`summary`, `risks`, `next_actions`, `artifacts`）を明示
- カスタムフィールドの追加を禁止（例: `説明`, `構造` 等の日本語フィールド名）
- JSON抽出は `json` フェンス内またはプレーンJSON両方に対応
- スキーマ違反時は詳細エラーログを出力（開発環境のみ）

### 非機能要件

- **応答時間**: 3000行でP50≤12s, P95≤25s（NFR-001）
- **セキュリティ**: デフォルト無保存、TLS 1.2+（NFR-003）
- **プライバシー**: PII検出でマスク提案（NFR-004）

## 主要コンポーネント

### バックエンド解析パイプライン

解析は以下の順序で実行されます（`apps/backend/src/api/analyze.ts`）:

1. **言語判定**: `detectLanguage()` - コード内容から言語を自動判定
2. **ポリシー読み込み**: `loadPolicies()` - `policies/`ディレクトリから社内ポリシーを読み込み
3. **AST抽出**: 現在無効化中（`web-tree-sitter`設定が必要）
4. **静的解析**: `runStaticAnalysis()` - 以下のツールを言語に応じて実行:
   - Semgrep（全言語対応）
   - Bandit（Pythonのみ）
   - Secrets検出（正規表現ベース）
5. **LLM整形**: `formatWithGemini()` - Gemini 2.0 Flash Liteで業務言語に翻訳
6. **レスポンス返却**: 型安全な `AnalyzeResponse` オブジェクト

### 静的解析の実装詳細 (`utils/staticAnalysis.ts`)

- **一時ファイル管理**: コードを一時ファイルに書き込み、解析後に自動削除
- **Finding型への統一**: 各ツールの出力を共通の `Finding` 型にマッピング
- **エラーハンドリング**: ツール実行失敗時も部分的な結果を返す
- **重大度マッピング**: 各ツールの重大度レベルを `HIGH/MEDIUM/LOW` に正規化

### Gemini LLM統合 (`utils/geminiClient.ts`)

- **モデル**: `gemini-2.0-flash-lite` を使用
- **プロンプト設計**: システムプロンプトでJSONスキーマ厳守を強制
- **フォールバック**: API key未設定時やエラー時は静的解析結果のみで基本レスポンスを生成
- **デバッグログ**: 開発環境でのみ詳細ログを出力（本番環境でユーザーコード漏洩を防止）
- **VibeCordingサポート**: `next_actions` に次にAIに投げるべきプロンプト案を含める

## Sprint計画

### Sprint 0（完了）

- ✅ プロジェクト構造初期化
- ✅ UI骨組み
- ✅ `/analyze` モックエンドポイント
- ✅ JSONスキーマ定義

### Sprint 1（完了）

- ✅ Semgrep/Bandit/Secrets統合
- ✅ Gemini 2.0 Flash Lite連携
- ✅ LLM整形ロジック実装
- ✅ Markdown出力
- ✅ ポリシーローダー

### Sprint 2（予定）

- [ ] AST抽出の有効化（web-tree-sitter設定）
- [ ] PDF出力機能
- [ ] Jira出力（CSV or REST）
- [ ] ユーザーテスト
- [ ] プロンプト調整

## 環境変数

`.env.example` を参照:

- `GEMINI_API_KEY`: Gemini API キー（必須 - 未設定時はフォールバックレスポンスを返す）
- `PORT`: バックエンドポート（デフォルト: 3001）
- `NEXT_PUBLIC_API_URL`: フロントエンドからのAPI URL
- `NODE_ENV`: 環境（`development` の場合、詳細なデバッグログを出力）

## デバッグとトラブルシューティング

### バックエンドのデバッグログ

開発環境（`NODE_ENV=development`）では、以下の詳細ログが出力されます:

- Gemini API keyの存在確認（値自体はログに出力しない）
- 言語判定結果
- 静的解析の実行コマンドと結果
- Geminiへのリクエスト内容（プロンプトの最初の500文字）
- Geminiからのレスポンス（最初の1000文字）
- JSONスキーマ検証の詳細

**重要**: 本番環境では、ユーザーコードやAPIキーが誤ってログに含まれないよう、デバッグログは無効化されます。

### よくある問題

**1. Semgrepが結果を返さない**:

- Semgrepは `--config=auto` で実行され、セキュリティルールのみを適用
- 問題がない場合は空の結果配列を返す（これは正常動作）
- デバッグログで `findings count` を確認

**2. Gemini APIエラー**:

- API key未設定: フォールバックレスポンスを自動生成
- レート制限: エラーログに表示され、フォールバックに切り替え
- JSONスキーマ違反: 必須フィールドやカスタムフィールドに関する詳細エラーを確認

**3. AST抽出が無効**:

- `web-tree-sitter`のWASMファイルパス設定が必要
- 現在は意図的に無効化中（`apps/backend/src/api/analyze.ts:46`）
- AST抽出なしでも解析は実行可能

### テストの実行

```bash
# バックエンドのユニットテスト
pnpm --filter @cbrief/backend test

# 特定のテストファイルのみ実行
cd apps/backend
pnpm test -- languageDetector.test.ts

# カバレッジ付きで実行
cd apps/backend
pnpm test -- --coverage
```

## デプロイ

### 本番環境構成

```bash
フロントエンド: Vercel（無料枠）
バックエンド: Render（無料枠 → $7/月）
```

### クイックデプロイ

**バックエンド（Render）:**

```bash
# 1. render.yaml を使用したBlueprint デプロイ
# https://dashboard.render.com/ > New > Blueprint

# 2. GitHubリポジトリを接続

# 3. 環境変数を設定
# GEMINI_API_KEY: <your-api-key>
```

**フロントエンド（Vercel）:**

```bash
# 1. Vercel CLIでデプロイ
npm install -g vercel
cd apps/frontend
vercel

# 2. 環境変数を設定
vercel env add NEXT_PUBLIC_API_URL
# 入力: https://cbrief-api.onrender.com

# 3. 本番デプロイ
vercel --prod
```

### Dockerイメージ構成

`apps/backend/Dockerfile` は以下を含む統合イメージ:

- Node.js 20
- Python 3
- Semgrep（静的解析）
- Bandit（Python解析）

**ローカルでのDockerテスト:**

```bash
# ビルド
cd apps/backend
docker build -t cbrief-backend -f Dockerfile ../..

# 実行
docker run -p 3001:3001 \
  -e GEMINI_API_KEY=your_key \
  cbrief-backend
```

詳細は `DEPLOY.md` を参照。

## 参考資料

- **PRD**: `./cbrief_prd_v_0.md` - 製品要件定義書
- **JSONスキーマ**: `packages/shared/src/schema.ts` - API仕様
- **型定義**: `packages/shared/src/types.ts` - TypeScript型
- **デプロイガイド**: `./DEPLOY.md` - 本番環境デプロイ手順
