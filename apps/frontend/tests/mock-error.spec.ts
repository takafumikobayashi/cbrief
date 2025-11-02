import { test } from '@playwright/test';

test('モックエラーでスクリーンショット撮影', async ({ page }) => {
  console.log('📱 ブラウザを起動...');

  // ページを開く
  await page.goto('http://localhost:3000');

  // JavaScriptでエラーメッセージを直接表示
  await page.evaluate(() => {
    // エラー状態をReactに注入
    const errorDiv = document.createElement('div');
    errorDiv.className = 'mt-4 p-3 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-md text-red-700 dark:text-red-200';
    errorDiv.textContent = 'API error: Too Many Requests';

    // 「分析」ボタンを含む要素を探す
    const buttons = Array.from(document.querySelectorAll('button'));
    const analyzeButton = buttons.find(btn => btn.textContent?.includes('分析'));

    if (analyzeButton) {
      // ボタンの親コンテナを取得して、その親に追加
      const container = analyzeButton.closest('.flex')?.parentElement;
      if (container) {
        container.appendChild(errorDiv);
      }
    }
  });

  console.log('✅ モックエラーを表示しました');

  // 少し待ってから撮影
  await page.waitForTimeout(500);

  // スクリーンショット撮影
  await page.screenshot({
    path: 'tests/screenshots/mock-rate-limit-error.png',
    fullPage: true
  });

  console.log('📸 保存: tests/screenshots/mock-rate-limit-error.png');

  // エラーボックスのみ
  const errorBox = page.locator('.bg-red-50, .bg-red-900').first();
  if (await errorBox.isVisible()) {
    await errorBox.screenshot({
      path: 'tests/screenshots/mock-error-box.png'
    });
    console.log('📸 保存: tests/screenshots/mock-error-box.png');
  }
});
