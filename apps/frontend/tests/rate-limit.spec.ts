import { test, expect } from '@playwright/test';

/**
 * レート制限エラーのスクリーンショットを撮るテスト
 *
 * 事前準備:
 * 1. .envでRATE_LIMIT_MINUTE=2に設定（テスト用に低く設定）
 * 2. バックエンドとフロントエンドを起動
 */
test('レート制限エラーのスクリーンショット', async ({ page }) => {
  // 1. アプリケーションを開く
  await page.goto('http://localhost:3000');

  // 2. タイトルが表示されることを確認
  await expect(page.locator('h1')).toContainText('cbrief');

  // 3. テストコードを入力
  const codeTextarea = page.locator('#code');
  await codeTextarea.fill('console.log("rate limit test");');

  // 4. 最初のリクエスト（成功するはず）
  await page.click('button:has-text("分析")');

  // 解析中の表示を待つ
  await page.waitForSelector('button:has-text("解析中...")', { timeout: 1000 }).catch(() => {});

  // 解析完了を待つ（最大30秒）
  await page.waitForSelector('button:has-text("分析")', { timeout: 30000 });

  console.log('✅ 1回目のリクエスト成功');

  // 5. 2回目のリクエスト（成功するはず）
  await page.click('button:has-text("分析")');
  await page.waitForSelector('button:has-text("解析中...")', { timeout: 1000 }).catch(() => {});
  await page.waitForSelector('button:has-text("分析")', { timeout: 30000 });

  console.log('✅ 2回目のリクエスト成功');

  // 6. 3回目のリクエスト（RATE_LIMIT_MINUTE=2の場合、これでエラー）
  await page.click('button:has-text("分析")');

  // エラーメッセージが表示されるまで待つ
  const errorBox = page.locator('div.bg-red-50, div.bg-red-900').filter({ hasText: /error|エラー|制限|リクエスト/i });

  try {
    await errorBox.waitFor({ timeout: 5000 });
    console.log('❌ レート制限エラーが発生しました');

    // エラーメッセージのテキストを取得
    const errorText = await errorBox.textContent();
    console.log('エラーメッセージ:', errorText);

    // スクリーンショットを撮影
    await page.screenshot({
      path: 'tests/screenshots/rate-limit-error.png',
      fullPage: true
    });

    console.log('📸 スクリーンショット保存: tests/screenshots/rate-limit-error.png');

    // エラーボックスのみのスクリーンショット
    await errorBox.screenshot({
      path: 'tests/screenshots/rate-limit-error-box.png'
    });

    console.log('📸 エラーボックス保存: tests/screenshots/rate-limit-error-box.png');

  } catch (e) {
    // エラーが表示されなかった場合（まだ制限に達していない）
    console.log('⚠️  エラーが表示されませんでした。RATE_LIMIT_MINUTEを下げてください。');

    // デバッグ用に現在の画面を撮影
    await page.screenshot({
      path: 'tests/screenshots/no-error.png',
      fullPage: true
    });
  }
});

/**
 * レート制限エラーを強制的に発生させるテスト
 * より確実にエラーを発生させるため、複数回連続でリクエスト
 */
test('レート制限を確実に発生させる', async ({ page }) => {
  await page.goto('http://localhost:3000');

  const codeTextarea = page.locator('#code');
  await codeTextarea.fill('console.log("test");');

  // 連続で5回リクエストを送る
  for (let i = 1; i <= 5; i++) {
    console.log(`リクエスト ${i}/5 を送信中...`);

    await page.click('button:has-text("分析")');

    // エラーが表示されたかチェック
    const errorBox = page.locator('div.bg-red-50, div.bg-red-900');
    const errorVisible = await errorBox.isVisible().catch(() => false);

    if (errorVisible) {
      console.log(`❌ ${i}回目でレート制限エラー発生`);

      const errorText = await errorBox.textContent();
      console.log('エラー内容:', errorText);

      // スクリーンショット撮影
      await page.screenshot({
        path: `tests/screenshots/rate-limit-error-attempt-${i}.png`,
        fullPage: true
      });

      break;
    }

    // 少し待機（ボタンが押せる状態に戻るまで）
    await page.waitForTimeout(500);
  }
});
