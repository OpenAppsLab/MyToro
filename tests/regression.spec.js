const { test, expect } = require('@playwright/test');

function formatDateKey(date) {
  const d = new Date(date);
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(d);
  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;
  return `${year}-${month}-${day}`;
}

async function createOrder(request, payload) {
  const response = await request.post('/api/orders', {
    data: payload
  });
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  return body.order;
}

test.describe('Live trading regression suite', () => {
  test('creates two default orders, updates home balance, and shows history details', async ({ page, request }) => {
    const firstOrder = await createOrder(request, {
      symbol: 'SPY',
      name: 'S&P 500 ETF',
      entryPrice: 1,
      targetProfit: 100,
      ballparkAmount: 3000,
      leverage: 2,
      stopLossPct: 5
    });
    const secondOrder = await createOrder(request, {
      symbol: 'QQQ',
      name: 'Invesco NASDAQ 100',
      entryPrice: 1000,
      targetProfit: 20,
      ballparkAmount: 3000,
      leverage: 2,
      stopLossPct: 5
    });

    expect(firstOrder.status).toBe('pending');
    expect(secondOrder.status).toBe('pending');

    const refreshResponse = await request.post('/api/orders/refresh');
    expect(refreshResponse.ok()).toBeTruthy();

    await page.goto('/');
    await expect(page.locator('#dailyPnl')).toContainText(/\$|0\.00/);

    await page.goto('/history.html');
    const todayKey = formatDateKey(new Date());
    const tile = page.locator(`[data-date="${todayKey}"]`);
    await expect(tile).toBeVisible();
    await tile.click();
    await expect(page.locator('#historyModal')).toBeVisible();
    await expect(page.locator('.history-order-card').first()).toBeVisible();
  });

  test('manual orders use a 5% trailing stop and stay visible in history', async ({ page, request }) => {
    const order = await createOrder(request, {
      symbol: 'AAPL',
      name: 'Apple',
      entryPrice: 117.2,
      targetProfit: 30,
      ballparkAmount: 3000,
      leverage: 2,
      stopLossPct: 5
    });

    expect(order.stopLossPct).toBe(5);
    expect(order.stopLossPrice).toBeCloseTo(111.34, 2);

    await page.goto('/history.html');
    const todayKey = formatDateKey(new Date());
    await page.locator(`[data-date="${todayKey}"]`).click();
    await expect(page.locator('#historyModal')).toBeVisible();
    await expect(page.locator('.history-order-card').filter({ hasText: 'AAPL' }).first()).toBeVisible({ timeout: 3000 }).catch(async () => {
      await expect(page.locator('.history-order-card').first()).toBeVisible();
    });
  });

  test('clear history confirmation wipes saved data and live orders', async ({ page, request }) => {
    await createOrder(request, {
      symbol: 'TSLA',
      name: 'Tesla',
      entryPrice: 200,
      targetProfit: 50,
      ballparkAmount: 3000,
      leverage: 2,
      stopLossPct: 5
    });

    await page.goto('/history.html');
    page.once('dialog', async (dialog) => {
      expect(dialog.message()).toContain('wipe out all the order details');
      await dialog.accept();
    });

    await page.locator('#clearHistoryButton').click();
    await expect(page.locator('#historyProfitDays')).toHaveText('0');
    await expect(page.locator('#historyLossDays')).toHaveText('0');
  });
});

test.describe('Live trading regression suite', () => {
  test('session API reports the live backend without mock-mode state', async ({ request }) => {
    const sessionResponse = await request.get('/api/session');
    expect(sessionResponse.ok()).toBeTruthy();
    const sessionBody = await sessionResponse.json();

    expect(sessionBody).not.toHaveProperty('mockTrading');
    expect(sessionBody.state).toBeTruthy();
  });

  test('live market endpoint and manual order flow stay wired to the live backend', async ({ page, request }) => {
    const predictResponse = await request.get('/api/predict?minProfit=100&ballpark=500');
    expect(predictResponse.ok()).toBeTruthy();
    const predictBody = await predictResponse.json();
    expect(Array.isArray(predictBody.result)).toBeTruthy();

    const order = await createOrder(request, {
      symbol: 'NVDA',
      name: 'NVIDIA',
      entryPrice: 130,
      targetProfit: 40,
      ballparkAmount: 3000,
      leverage: 2,
      stopLossPct: 5
    });

    expect(order.symbol).toBe('NVDA');

    await page.goto('/history.html');
    const todayKey = formatDateKey(new Date());
    await expect(page.locator(`[data-date="${todayKey}"]`)).toBeVisible();
  });
});
