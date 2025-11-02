# API仕様

cbriefのREST API仕様です。（将来提供予定）

## エンドポイント

### POST /api/analyze

コードを解析して、セキュリティリスクと修正案を取得します。

**リクエスト:**

```json
{
  "languageHint": "auto" | "javascript" | "typescript" | "python",
  "content": "解析対象のコード",
  "policies": ["ポリシーファイル名（オプション）"],
  "save": false
}
```

**パラメータ:**

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| `languageHint` | string | Yes | 言語ヒント（`auto`, `javascript`, `typescript`, `python`） |
| `content` | string | Yes | 解析対象のコード（最大300KB） |
| `policies` | string[] | No | 適用するポリシーファイルのリスト |
| `save` | boolean | No | 解析結果を保存するか（MVPでは常に`false`） |

**レスポンス:**

```json
{
  "summary": {
    "detected_language": "javascript",
    "loc": 150,
    "complexity": "medium",
    "purpose": "ユーザー認証システム"
  },
  "risks": [
    {
      "id": "risk-001",
      "level": "High",
      "category": "security",
      "title": "SQLインジェクションの脆弱性",
      "description": "ユーザー入力が適切にサニタイズされていません",
      "evidence": {
        "rule_id": "javascript.lang.security.audit.sql-injection",
        "line_number": 42,
        "code_snippet": "const query = 'SELECT * FROM users WHERE id = ' + userId;"
      }
    }
  ],
  "fixes": [
    {
      "risk_id": "risk-001",
      "fix_type": "code_change",
      "description": "パラメータ化クエリを使用してください",
      "code_diff": "...",
      "confidence": "high"
    }
  ],
  "next_actions": [
    {
      "priority": 1,
      "action": "Highリスクの修正",
      "description": "SQLインジェクションの脆弱性を修正"
    }
  ],
  "artifacts": {
    "markdown": "# 解析レポート\n..."
  }
}
```

**レスポンスフィールド:**

| フィールド | 型 | 説明 |
|---|---|---|
| `summary` | object | コードの要約情報 |
| `summary.detected_language` | string | 検出された言語 |
| `summary.loc` | number | コード行数 |
| `summary.complexity` | string | 複雑度（`low`, `medium`, `high`） |
| `summary.purpose` | string | コードの目的 |
| `risks` | array | 検出されたリスクのリスト |
| `risks[].level` | string | リスクレベル（`High`, `Medium`, `Low`） |
| `risks[].category` | string | カテゴリ（`security`, `quality`, `performance`） |
| `fixes` | array | 修正案のリスト |
| `next_actions` | array | 推奨される次のアクション |
| `artifacts` | object | 出力アーティファクト |

## ステータスコード

| コード | 説明 |
|---|---|
| 200 | 成功 |
| 400 | リクエストが不正 |
| 413 | ファイルサイズが大きすぎる（> 300KB） |
| 429 | レート制限超過 |
| 500 | サーバーエラー |

## レート制限

| 制限 | 値 |
|---|---|
| 1分あたりのリクエスト | 10回 |
| 1日あたりのリクエスト | 200回 |

レート制限を超えた場合、`429 Too Many Requests`が返されます。

**レスポンスヘッダー:**

- `X-RateLimit-Minute-Limit`: 1分あたりの制限
- `X-RateLimit-Minute-Remaining`: 1分間の残り回数
- `X-RateLimit-Daily-Limit`: 1日あたりの制限
- `X-RateLimit-Daily-Remaining`: 1日の残り回数

## エラーレスポンス

```json
{
  "error": "エラータイプ",
  "message": "エラーメッセージ",
  "details": {
    "field": "問題のあるフィールド",
    "reason": "エラーの理由"
  }
}
```

## サンプルコード

### cURL

```bash
curl -X POST https://api.cbrief.dev/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "languageHint": "javascript",
    "content": "function test() { eval(userInput); }",
    "save": false
  }'
```

### JavaScript (fetch)

```javascript
const response = await fetch('https://api.cbrief.dev/api/analyze', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    languageHint: 'javascript',
    content: 'function test() { eval(userInput); }',
    save: false,
  }),
});

const result = await response.json();
console.log(result);
```

### Python (requests)

```python
import requests

response = requests.post(
    'https://api.cbrief.dev/api/analyze',
    json={
        'languageHint': 'python',
        'content': 'import pickle\npickle.loads(user_data)',
        'save': False
    }
)

result = response.json()
print(result)
```

## 注意事項

- API は現在開発中です。仕様は変更される可能性があります
- 本番環境では認証が必要になる予定です
- WebSocket APIも今後提供予定です
