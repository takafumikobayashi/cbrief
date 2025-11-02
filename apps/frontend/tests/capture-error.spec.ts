import { test } from '@playwright/test';

test('レート制限エラーを確実に撮影', async ({ page }) => {
  console.log('📱 ブラウザを起動しています...');

  await page.goto('http://localhost:3000');
  console.log('✅ ページを開きました');

  // テストコードを入力
  await page.locator('#code').fill('console.log("test");');

  // 1回目のリクエスト
  console.log('📤 1回目のリクエスト...');
  await page.click('button:has-text("分析")');

  // 完了を待つ
  await page.waitForSelector('button:has-text("分析"):not([disabled])', { timeout: 30000 });
  console.log('✅ 1回目完了');

  // 2回目のリクエスト（すぐに送信）
  console.log('📤 2回目のリクエスト（レート制限を期待）...');
  await page.click('button:has-text("分析")');

  // エラーメッセージまたは解析完了のどちらかを待つ
  try {
    // エラーメッセージが表示されるのを待つ（最大5秒）
    const errorBox = page.locator('div.bg-red-50, div.bg-red-900');
    await errorBox.waitFor({ timeout: 5000 });

    console.log('❌ レート制限エラーが表示されました！');

    const errorText = await errorBox.textContent();
    console.log('エラー内容:', errorText);

    // 少し待ってからスクリーンショット（アニメーションがある場合に備えて）
    await page.waitForTimeout(500);

    // 全画面スクリーンショット
    await page.screenshot({
      path: 'tests/screenshots/rate-limit-error-captured.png',
      fullPage: true
    });
    console.log('📸 保存: tests/screenshots/rate-limit-error-captured.png');

    // エラーボックスのみ
    await errorBox.screenshot({
      path: 'tests/screenshots/error-box-only.png'
    });
    console.log('📸 保存: tests/screenshots/error-box-only.png');

  } catch (e) {
    console.log('⚠️  エラーが表示されませんでした（解析が成功したかも）');

    // デバッグ用にとりあえず撮影
    await page.screenshot({
      path: 'tests/screenshots/no-error-state.png',
      fullPage: true
    });
    console.log('📸 デバッグ用: tests/screenshots/no-error-state.png');
  }

  console.log('✅ テスト完了');
});
