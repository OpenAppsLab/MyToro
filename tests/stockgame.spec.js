const { test, expect } = require('@playwright/test');

function formatDateKey(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

test.describe.parallel('StockGame application', () => {
  test('home page loads with main inputs and starting balance', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('.brand-title')).toHaveText('Live entry signals and daily risk controls');
    await expect(page.locator('#dailyBalance')).toHaveText('$3,000.00');
    await expect(page.locator('#dailyPnl')).toHaveText('$0.00');
    await expect(page.locator('#minProfit')).toBeVisible();
    await expect(page.locator('#ballpark')).toBeVisible();
    await expect(page.locator('#searchButton')).toBeVisible();
    await expect(page.locator('#statusMessage')).toHaveText(/Ready for a MyToro live scan\./);
  });

  test('history page renders 30-day calendar and opens date detail modal', async ({ page }) => {
    const today = new Date();
    const todayKey = formatDateKey(today);

    const entry = {
      date: today.toISOString(),
      symbol: 'AAPL',
      name: 'Apple',
      minProfit: 100,
      ballpark: 500,
      status: 'pending',
      correct: null,
      estimatedProfit: 20,
      stopLossAmount: 15,
      stopLossPct: 3
    };

    await page.goto('/history.html');
    await page.evaluate((item) => {
      localStorage.setItem('stockgame-history', JSON.stringify({ entries: [item] }));
    }, entry);
    await page.reload();

    const count = await page.locator('.day-cell').count();
    expect(count).toBeGreaterThan(28);
    await page.click(`[data-date="${todayKey}"]`);
    await expect(page.locator('#historyModal')).toBeVisible();
    await expect(page.locator('.history-order-card')).toHaveCount(1);
    await expect(page.locator('.history-order-card')).toContainText('AAPL');
  });

  test('history refresh button is disabled when no pending backend orders exist', async ({ page }) => {
    await page.goto('/history.html');
    await expect(page.locator('#refreshPendingButton')).toBeDisabled();
  });

  test('API order creation validates payload and returns pending order', async ({ request }) => {
    const invalidResponse = await request.post('/api/orders', {
      data: { entryPrice: 100 }
    });
    expect(invalidResponse.status()).toBe(400);

    const response = await request.post('/api/orders', {
      data: {
        symbol: 'AAPL',
        name: 'Apple',
        entryPrice: 100,
        targetProfit: 50,
        ballparkAmount: 300,
        leverage: 2,
        stopLossAmount: 15
      }
    });

    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.order).toBeTruthy();
    expect(body.order.symbol).toBe('AAPL');
    expect(body.order.status).toBe('pending');
    expect(body.order.id).toBeTruthy();
  });

  test('API pending orders endpoint returns array and refresh endpoint works', async ({ request }) => {
    const postResponse = await request.post('/api/orders', {
      data: {
        symbol: 'TSLA',
        name: 'Tesla',
        entryPrice: 200,
        targetProfit: 40,
        ballparkAmount: 800,
        leverage: 2,
        stopLossAmount: 15
      }
    });
    expect(postResponse.ok()).toBeTruthy();

    const listResponse = await request.get('/api/orders');
    expect(listResponse.ok()).toBeTruthy();
    const listBody = await listResponse.json();
    expect(Array.isArray(listBody.orders)).toBeTruthy();
    expect(listBody.orders.length).toBeGreaterThanOrEqual(1);

    const refreshResponse = await request.post('/api/orders/refresh');
    expect(refreshResponse.ok()).toBeTruthy();
    const refreshBody = await refreshResponse.json();
    expect(Array.isArray(refreshBody.orders)).toBeTruthy();
  });

  test('predict API returns structured JSON and scoring values', async ({ request }) => {
    const response = await request.get('/api/predict?minProfit=100&ballpark=500');
    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    expect(body).toHaveProperty('result');
    expect(Array.isArray(body.result)).toBeTruthy();
    expect(body).toHaveProperty('note');
    expect(body).toHaveProperty('inputs');
    expect(body).toHaveProperty('viable');
    expect(body.inputs).toHaveProperty('requiredMovePct');
    expect(body).toHaveProperty('liveSource');
    if (body.result.length > 0) {
      expect(body.result[0]).toHaveProperty('score');
      expect(typeof body.result[0].score).toBe('number');
      expect(body.result[0]).toHaveProperty('viable');
      expect(typeof body.result[0].viable).toBe('boolean');
    }
  });

  test('the history page can open and close the modal by backdrop click and Escape key', async ({ page }) => {
    const today = new Date();
    const todayKey = formatDateKey(today);

    const entry = {
      date: today.toISOString(),
      symbol: 'MSFT',
      name: 'Microsoft',
      minProfit: 100,
      ballpark: 600,
      status: 'pending',
      correct: null,
      estimatedProfit: 18,
      stopLossAmount: 15,
      stopLossPct: 2.5
    };

    await page.goto('/history.html');
    await page.evaluate((item) => {
      localStorage.setItem('stockgame-history', JSON.stringify({ entries: [item] }));
    }, entry);
    await page.reload();

    await page.click(`[data-date="${todayKey}"]`);
    await expect(page.locator('#historyModal')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('#historyModal')).toBeHidden();
  });
});
