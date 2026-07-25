const test = require('node:test');
const assert = require('node:assert/strict');
const server = require('../server');

test('auto orders keep running until the $100 profit target or the $50 daily loss cap is reached', () => {
  const { pendingOrders, canPlaceAutoOrder, getTodayRealizedPnl } = server;

  pendingOrders.length = 0;

  const initialPnl = getTodayRealizedPnl();
  assert.equal(initialPnl, 0, 'expected no realized P&L before the test begins');

  const profitableOrders = [
    { status: 'green', result: 'profit-hit', targetProfit: 30, createdAt: Date.now() },
    { status: 'green', result: 'profit-hit', targetProfit: 30, createdAt: Date.now() },
    { status: 'green', result: 'profit-hit', targetProfit: 30, createdAt: Date.now() }
  ];

  profitableOrders.forEach((order) => {
    pendingOrders.push(order);
    assert.equal(canPlaceAutoOrder(), true, 'expected auto-orders to continue while the day is still below the $100 profit target');
  });

  pendingOrders.length = 0;

  const lossOrders = [
    { status: 'red', result: 'loss-hit', stopLossAmount: 20, createdAt: Date.now(), targetProfit: 10 },
    { status: 'red', result: 'loss-hit', stopLossAmount: 20, createdAt: Date.now(), targetProfit: 10 },
    { status: 'red', result: 'loss-hit', stopLossAmount: 20, createdAt: Date.now(), targetProfit: 10 }
  ];

  lossOrders.forEach((order, index) => {
    pendingOrders.push(order);
    const canPlace = canPlaceAutoOrder();
    if (index < 2) {
      assert.equal(canPlace, true, `expected auto-orders to stay enabled after ${index + 1} loss orders`);
    } else {
      assert.equal(canPlace, false, 'expected auto-orders to stop once cumulative loss reaches the $50 daily limit');
    }
  });

  pendingOrders.length = 0;

  const recoverToTarget = [
    { status: 'green', result: 'profit-hit', targetProfit: 30, createdAt: Date.now() },
    { status: 'red', result: 'loss-hit', stopLossAmount: 20, createdAt: Date.now(), targetProfit: 10 },
    { status: 'red', result: 'loss-hit', stopLossAmount: 20, createdAt: Date.now(), targetProfit: 10 },
    { status: 'green', result: 'profit-hit', targetProfit: 30, createdAt: Date.now() },
    { status: 'green', result: 'profit-hit', targetProfit: 30, createdAt: Date.now() }
  ];

  recoverToTarget.forEach((order, index) => {
    pendingOrders.push(order);
    const canPlace = canPlaceAutoOrder();
    if (index < 4) {
      assert.equal(canPlace, true, `expected auto-orders to continue while the day is still below the $100 target after recovery orders`);
    }
  });
});
