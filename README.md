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

### レート制限の設定（オプション）

レート制限機能を有効にするには、無料のRedisサービスをセットアップしてください：

**推奨: Upstash Redis（無料枠: 10,000リクエスト/日）**：

1. [Upstash](https://upstash.com/)でアカウント作成
2. Redisデータベースを作成
3. 接続情報を`.env`に追加：

```bash
REDIS_HOST=your-upstash-host.upstash.io
REDIS_PORT=6379
REDIS_PASSWORD=your-password
REDIS_TLS=true
RATE_LIMIT_MINUTE=10   # 1分あたり10リクエスト
RATE_LIMIT_DAILY=200   # 1日あたり200リクエスト
```

**注意**: Redisが未設定の場合、レート制限は無効化されますが、サービスは正常に動作します。

## Gemini API制限と処理能力

### 無料枠の制限（Gemini 2.0 Flash Lite）

- **30 RPM** (リクエスト/分)
- **1,000,000 TPM** (トークン/分)
- **200 RPD** (リクエスト/日) ← **実質的なボトルネック**

### 処理能力の試算

1リクエストあたり：

- 平均トークン: **約3,850トークン** (入力1,500 + 出力2,350)
- 対応コードサイズ: **100〜500行/ファイル**（最大300KB）

1日あたり（200リクエスト）：

| コードサイズ   | 1日の処理量 | 想定ユースケース                 |
| -------------- | ----------- | -------------------------------- |
| 100行/ファイル | 20,000行    | 中規模プロジェクトの定期チェック |
| 200行/ファイル | 40,000行    | 複数の中規模ファイル解析         |
| 500行/ファイル | 100,000行   | 大規模ファイルの詳細解析         |

### POC/公開時の推奨設定

```bash
RATE_LIMIT_MINUTE=10      # Gemini 30 RPMより余裕を持たせる
RATE_LIMIT_DAILY=200      # Gemini無料枠上限に合わせる
```

この設定で：

- ✅ Gemini APIの無料枠を超えない
- ✅ 20〜40人のPOCユーザーが1日5〜10回ずつ使用可能
- ✅ Upstash Redis無料枠（10,000リクエスト/日）も余裕あり

## 技術スタック

- **フロントエンド**: Next.js 14 + Tailwind CSS
- **バックエンド**: Node.js + Express
- **LLM**: Gemini 2.0 Flash Lite
- **Rate Limiting**: Redis (Upstash) + ioredis
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
