# cbrief（コードブリーフ）

AI生成や外部委託されたコードを非エンジニアが理解・判断できるように、業務言語で要約・リスク診断・修正案を提示するツールです。

## 特徴

- 📋 **業務言語での要約**: 非エンジニアにも理解できる平易な言葉で説明
- 🔍 **リスク診断**: 静的解析とLLMの二重根拠によるリスク検出
- 💡 **修正案提示**: 最小差分と自然言語での修正方法
- ✅ **次アクション**: 優先度・工数付きのタスクリスト
- 🔒 **プライバシー重視**: デフォルト無保存、セキュア設計

## クイックスタート

```bash
# 依存関係のインストール
pnpm install

# 環境変数の設定
cp .env.example .env
# .envを編集してGEMINI_API_KEYを設定

# 開発サーバー起動（フロントエンド + バックエンド）
pnpm dev
```

- フロントエンド: [http://localhost:3000]
- バックエンド: [http://localhost:3001]

## 技術スタック

- **フロントエンド**: Next.js 14 + Tailwind CSS
- **バックエンド**: Node.js + Express
- **LLM**: Gemini 1.5 Flash
- **Monorepo**: pnpm workspaces + Turborepo
- **コード品質**: ESLint + Prettier（保存時自動フォーマット）
- **対応言語**: JavaScript, TypeScript, Python（MVP）

## 開発コマンド

```bash
pnpm dev          # 開発サーバー起動
pnpm build        # ビルド
pnpm lint         # リント
pnpm lint:fix     # リント + 自動修正
pnpm format       # コードフォーマット
pnpm format:check # フォーマットチェック
pnpm clean        # クリーンアップ
```

## プロジェクト構造

```bash
cbrief/
├── apps/
│   ├── frontend/    # Next.jsアプリケーション
│   └── backend/     # Express APIサーバー
├── packages/
│   └── shared/      # 共通型定義・スキーマ
└── policies/        # RAG用ポリシーファイル（将来実装）
```

## ドキュメント

- [PRD](./cbrief_prd_v_0.md) - 製品要件定義書
- [CLAUDE.md](./CLAUDE.md) - 開発ガイド（Claude Code向け）
- [DEPLOY.md](./DEPLOY.md) - デプロイガイド（Vercel + Render）

## ライセンス

Private（非公開プロジェクト）
