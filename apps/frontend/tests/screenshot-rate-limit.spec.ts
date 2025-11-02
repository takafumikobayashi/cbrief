import { test } from '@playwright/test';

test('レート制限エラーのスクリーンショット撮影', async ({ page }) => {
  console.log('📱 ブラウザを起動しています...');

  // アプリケーションを開く
  await page.goto('http://localhost:3000');
  console.log('✅ ページを開きました');

  // テストコードを入力
  await page.locator('#code').fill('console.log("rate limit test");');
  console.log('✅ コードを入力しました');

  // 1回目のリクエスト（成功するはず）
  console.log('📤 1回目のリクエストを送信...');
  await page.click('button:has-text("分析")');

  // 解析完了を待つ（最大30秒）
  await page.waitForSelector('button:has-text("分析")', { timeout: 30000 });
  console.log('✅ 1回目成功');

  // すぐに2回目のリクエスト（RATE_LIMIT_MINUTE=1なので、これで制限に達する）
  console.log('📤 2回目のリクエストを送信（レート制限発動を期待）...');
  await page.click('button:has-text("分析")');

  // エラーメッセージが表示されるまで少し待つ
  await page.waitForTimeout(1000);

  // ページ全体のスクリーンショット
  await page.screenshot({
    path: 'tests/screenshots/rate-limit-full-page.png',
    fullPage: true
  });
  console.log('📸 全画面スクリーンショット保存: tests/screenshots/rate-limit-full-page.png');

  // エラーボックスのみのスクリーンショット（存在する場合）
  const errorBox = page.locator('div').filter({ hasText: /error|エラー|制限|Too Many/i }).first();
  if (await errorBox.isVisible().catch(() => false)) {
    await errorBox.screenshot({
      path: 'tests/screenshots/rate-limit-error-box.png'
    });
    console.log('📸 エラーボックス保存: tests/screenshots/rate-limit-error-box.png');

    const errorText = await errorBox.textContent();
    console.log('エラー内容:', errorText);
  } else {
    console.log('⚠️  エラーボックスが見つかりませんでした');
  }

  // ビューポート領域のみのスクリーンショット
  await page.screenshot({
    path: 'tests/screenshots/rate-limit-viewport.png',
    fullPage: false
  });
  console.log('📸 ビューポートスクリーンショット保存: tests/screenshots/rate-limit-viewport.png');

  console.log('✅ スクリーンショット撮影完了！');
});
