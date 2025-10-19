# デプロイガイド

cbriefのフロントエンドとバックエンドをデプロイする手順です。

## 構成

```bash
フロントエンド: Vercel（無料枠）
バックエンド: Render（無料枠 → 有料$7/月）
```

---

## 1. バックエンド: Render

### 1-1. 事前準備

1. **Renderアカウント作成**
   - [https://render.com] でサインアップ
   - GitHubアカウント連携推奨

2. **Gemini APIキー取得**
   - [https://aistudio.google.com/app/apikey]
   - APIキーをコピー（後で使用）

### 1-2. デプロイ方法

#### 方法A: Blueprint（推奨）

```bash
# 1. GitHubにpush
git add .
git commit -m "Add Render deployment config"
git push origin main

# 2. Render Dashboardへ
# https://dashboard.render.com/

# 3. "New" > "Blueprint" を選択

# 4. GitHubリポジトリを接続

# 5. render.yaml を自動検出
# → "Apply" をクリック

# 6. 環境変数を設定
# GEMINI_API_KEY: <your-api-key>
```

#### 方法B: 手動作成

```bash
# 1. Render Dashboard
# https://dashboard.render.com/

# 2. "New" > "Web Service"

# 3. GitHubリポジトリを選択

# 4. 設定:
#    - Name: cbrief-api
#    - Region: Oregon（または Singapore）
#    - Branch: main
#    - Root Directory: （空欄）
#    - Environment: Docker
#    - Dockerfile Path: apps/backend/Dockerfile
#    - Docker Context: .
#    - Plan: Free

# 5. 環境変数:
#    - PORT: 3001
#    - NODE_ENV: production
#    - GEMINI_API_KEY: <your-api-key>

# 6. "Create Web Service"
```

### 1-3. デプロイ確認

```bash
# ヘルスチェック
curl https://cbrief-api.onrender.com/health

# レスポンス例:
# {"status":"ok","timestamp":"2025-10-19T..."}
```

### 1-4. 無料プランの制限

⚠️ **重要:**

- 15分間アクセスがないと自動スリープ
- スリープ後の初回アクセスは起動に30-50秒かかる
- 月間750時間まで（常時起動は不可）

**本番運用時:**

- Starter プラン（$7/月）へアップグレード推奨
- スリープなし、常時起動

---

## 2. フロントエンド: Vercel

### 2-1. 事前準備

1. **Vercelアカウント作成**
   - [https://vercel.com] でサインアップ
   - GitHubアカウント連携

2. **バックエンドURLを確認**
   - RenderでデプロイしたAPI URL
   - 例: `https://cbrief-api.onrender.com`

### 2-2. デプロイ方法

#### CLI方式（推奨）

```bash
# 1. Vercel CLIインストール
npm install -g vercel

# 2. ログイン
vercel login

# 3. フロントエンドディレクトリへ移動
cd apps/frontend

# 4. 初回デプロイ
vercel

# 質問に答える:
# - Setup and deploy? Yes
# - Which scope? (自分のアカウント選択)
# - Link to existing project? No
# - Project name? cbrief-frontend
# - In which directory? ./
# - Override settings? No

# 5. 環境変数を設定
vercel env add NEXT_PUBLIC_API_URL
# 入力: https://cbrief-api.onrender.com

# 6. 本番デプロイ
vercel --prod
```

#### Dashboard方式

```bash
# 1. Vercel Dashboard
# https://vercel.com/dashboard

# 2. "Add New" > "Project"

# 3. GitHubリポジトリをインポート

# 4. 設定:
#    - Framework Preset: Next.js
#    - Root Directory: apps/frontend
#    - Build Command: pnpm build
#    - Output Directory: .next
#    - Install Command: pnpm install

# 5. 環境変数:
#    - NEXT_PUBLIC_API_URL: https://cbrief-api.onrender.com

# 6. "Deploy"
```

### 2-3. デプロイ確認

デプロイ後、Vercelが生成したURL（例: `https://cbrief-frontend.vercel.app`）にアクセス。

---

## 3. カスタムドメイン設定

### 3-1. Vercel（フロントエンド）

```bash
# 1. Vercel Dashboard > Project Settings > Domains

# 2. カスタムドメインを追加
#    例: cbrief.yourdomain.com

# 3. DNSレコード設定
#    Type: CNAME
#    Name: cbrief
#    Value: cname.vercel-dns.com

# 4. SSL証明書は自動発行（数分）
```

### 3-2. Render（バックエンド）

```bash
# 1. Render Dashboard > Service > Settings > Custom Domain

# 2. カスタムドメインを追加
#    例: api.cbrief.yourdomain.com

# 3. DNSレコード設定
#    Type: CNAME
#    Name: api.cbrief
#    Value: <render-provided-value>

# 4. SSL証明書は自動発行
```

### 3-3. 環境変数更新

カスタムドメイン設定後、VercelのAPI URLを更新:

```bash
# Vercel Dashboard > Settings > Environment Variables
# NEXT_PUBLIC_API_URL を更新
# https://api.cbrief.yourdomain.com

# 再デプロイ（環境変数反映のため）
vercel --prod
```

---

## 4. 監視とログ

### Render

```bash
# ログ確認
Render Dashboard > Service > Logs

# メトリクス
Render Dashboard > Service > Metrics
```

### Vercel

```bash
# デプロイログ
Vercel Dashboard > Deployments > (デプロイ選択) > Build Logs

# ランタイムログ
Vercel Dashboard > Project > Logs
```

---

## 5. 本番運用へのアップグレード

### タイミング

以下の状況になったら有料プランへ:

1. **Render Free の制限に到達**
   - 月間750時間超過
   - スリープによる初回アクセス遅延が問題

2. **トラフィック増加**
   - Vercel無料枠100GB/月を超過見込み

### アップグレード手順

**Render:**

```bash
Dashboard > Service > Settings > Plan
→ Starter ($7/月) へアップグレード
```

**Vercel:**

```bash
Dashboard > Settings > Billing
→ Pro ($20/月) へアップグレード
```

---

## 6. トラブルシューティング

### バックエンドが起動しない

```bash
# Renderログを確認
# よくあるエラー:
# - Semgrepインストール失敗 → Dockerfileを確認
# - ポート設定ミス → 環境変数PORT=3001を確認
# - ビルド失敗 → pnpmバージョンを確認
```

### フロントエンドでAPI接続エラー

```bash
# 1. NEXT_PUBLIC_API_URL を確認
vercel env ls

# 2. CORSエラーの場合
# backend/src/index.ts の cors() 設定を確認

# 3. Renderがスリープ中
# 初回アクセス時は30-50秒待つ
```

### Dockerfile ビルドエラー

```bash
# ローカルでテスト
cd apps/backend
docker build -t cbrief-backend -f Dockerfile ../..

# イメージ確認
docker run -p 3001:3001 -e GEMINI_API_KEY=test cbrief-backend
```

---

## 付録: コスト試算

### MVP段階（無料枠）

```bash
Vercel Hobby: $0/月
Render Free: $0/月（スリープあり）
合計: $0/月
```

### 本番運用（小規模）

```bash
Vercel Hobby: $0/月（100GB以内）
Render Starter: $7/月
合計: $7/月
```

### 本番運用（中規模）

```bash
Vercel Pro: $20/月
Render Starter: $7/月
合計: $27/月
```

---

## 参考リンク

- Render Documentation: [https://render.com/docs]
- Vercel Documentation: [https://vercel.com/docs]
- Render Blueprint Spec: [https://render.com/docs/blueprint-spec]
- Vercel CLI Reference: [https://vercel.com/docs/cli]
