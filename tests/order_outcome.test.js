const test = require('node:test');
const assert = require('node:assert/strict');
const { evaluateOrderOutcome } = require('../server');

test('evaluateOrderOutcome updates the live price and trailing stop while an order is pending', () => {
  const order = {
    entryPrice: 100,
    targetProfit: 50,
    leverage: 2,
    highWaterMark: 100,
    currentPrice: 100,
    trailingStopPrice: 95,
    stopLossPrice: 95,
    status: 'pending',
    createdAt: Date.now()
  };

  const updated = evaluateOrderOutcome(order, 104);

  assert.equal(updated.currentPrice, 104);
  assert.equal(updated.currentMovePct, 4);
  assert.equal(updated.highWaterMark, 104);
  assert.equal(updated.trailingStopPrice, 98.8);
  assert.equal(updated.status, 'pending');
});

test('evaluateOrderOutcome marks a zero-move close as flat instead of profit', () => {
  const order = {
    entryPrice: 100,
    targetProfit: 50,
    leverage: 2,
    highWaterMark: 100,
    currentPrice: 100,
    trailingStopPrice: 95,
    stopLossPrice: 95,
    status: 'pending',
    createdAt: Date.now()
  };

  const updated = evaluateOrderOutcome(order, 100);

  assert.equal(updated.currentPrice, 100);
  assert.equal(updated.currentMovePct, 0);
  assert.equal(updated.status, 'flat');
  assert.equal(updated.result, null);
});
