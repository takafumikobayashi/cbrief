# サンプルコード

cbriefで解析できるサンプルコードをご紹介します。実際に試してみて、どのような結果が得られるか確認してください。

## 1. セキュリティリスクのあるJavaScriptコード

```javascript
// ユーザー入力をそのままevalで実行（危険！）
function executeUserCode(userInput) {
  return eval(userInput);
}

// SQLインジェクションの脆弱性
function searchUser(username) {
  const query = "SELECT * FROM users WHERE name = '" + username + "'";
  return database.query(query);
}

// XSS脆弱性
function displayMessage(message) {
  document.getElementById('output').innerHTML = message;
}
```

**期待される検出結果:**

- High: `eval()`の使用
- High: SQLインジェクション
- Medium: XSS脆弱性

## 2. より安全なコード（修正後）

```javascript
// サンドボックス化された関数の実行
function executeUserCode(userInput) {
  const safeFunction = new Function('return ' + userInput);
  return safeFunction();
}

// パラメータ化クエリ
function searchUser(username) {
  const query = 'SELECT * FROM users WHERE name = ?';
  return database.query(query, [username]);
}

// テキストコンテンツとして表示
function displayMessage(message) {
  document.getElementById('output').textContent = message;
}
```

## 3. Pythonコードのサンプル

```python
import pickle
import os

# Pickleの安全でない使用
def load_data(filename):
    with open(filename, 'rb') as f:
        return pickle.load(f)  # 危険！

# ハードコードされた認証情報
def connect_to_db():
    username = "admin"
    password = "password123"  # ハードコード（危険！）
    return database.connect(username, password)

# コマンドインジェクション
def process_file(filename):
    os.system(f"cat {filename}")  # 危険！
```

**期待される検出結果:**

- High: Pickleの安全でない使用
- High: ハードコードされた認証情報
- High: コマンドインジェクション

## 4. TypeScriptの型安全なコード

```typescript
interface User {
  id: number;
  name: string;
  email: string;
}

// 型安全なユーザー検索
async function searchUser(username: string): Promise<User[]> {
  const query = 'SELECT * FROM users WHERE name = $1';
  const result = await db.query(query, [username]);
  return result.rows as User[];
}

// 入力検証
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
```

## 試し方

1. 上記のコードをコピー
2. ホーム画面の入力エリアに貼り付け
3. 「分析」ボタンをクリック
4. 結果を確認

## 注意事項

これらのサンプルコードは、教育目的で作成されています。実際のプロダクションコードでは、適切なセキュリティ対策を実装してください。
