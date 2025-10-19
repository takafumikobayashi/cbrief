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
- 現在はモックレスポンス、Sprint 1で実装予定:
  1. 言語判定
  2. 静的解析（Semgrep/ESLint/Bandit/Secrets）
  3. LLM整形（Gemini 1.5 Flash）
  4. JSONスキーマ検証

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
  "policies": ["logging.md"],  // 将来実装
  "save": false                 // MVPでは常にfalse
}
```

Response:

```json
{
  "summary": { /* 要約情報 */ },
  "risks": [ /* リスク一覧 */ ],
  "fixes": [ /* 修正案 */ ],
  "next_actions": [ /* 次アクション */ ],
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

### LLMプロンプト設計（Sprint 1以降）

PRD §12に基づく:

- 非エンジニア向けに業務言語で説明
- 断定を避け、根拠を列挙
- 出力は必ずJSONスキーマに準拠
- 語調: 比喩は短く、専門用語は脚注

### 非機能要件

- **応答時間**: 3000行でP50≤12s, P95≤25s（NFR-001）
- **セキュリティ**: デフォルト無保存、TLS 1.2+（NFR-003）
- **プライバシー**: PII検出でマスク提案（NFR-004）

## Sprint計画

### Sprint 0（完了）

- ✅ プロジェクト構造初期化
- ✅ UI骨組み
- ✅ `/analyze` モックエンドポイント
- ✅ JSONスキーマ定義

### Sprint 1（1週間）

- [ ] Semgrep/ESLint/Bandit/Secrets統合
- [ ] Gemini 1.5 Flash連携
- [ ] LLM整形ロジック実装
- [ ] Markdown/PDF出力

### Sprint 2（1週間）

- [ ] ポリシーRAG（`policies/*.md`）
- [ ] Jira出力（CSV or REST）
- [ ] ユーザーテスト
- [ ] プロンプト調整

## 環境変数

`.env.example` を参照:

- `GEMINI_API_KEY`: Gemini API キー（必須）
- `PORT`: バックエンドポート（デフォルト: 3001）
- `NEXT_PUBLIC_API_URL`: フロントエンドからのAPI URL

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
