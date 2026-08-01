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

test('evaluateOrderOutcome keeps a pending order open when price equals entry and no trigger is hit', () => {
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
  assert.equal(updated.status, 'pending');
  assert.equal(updated.result, null);
  assert.equal(updated.settledAt, null);
  assert.equal(updated.timeToHitMs, null);
});

test('evaluateOrderOutcome treats a trailing stop exit above entry as profit', () => {
  const order = {
    entryPrice: 100,
    targetProfit: 50,
    leverage: 2,
    highWaterMark: 120,
    currentPrice: 100,
    trailingStopPrice: 95,
    stopLossPrice: 95,
    status: 'pending',
    createdAt: Date.now()
  };

  const updated = evaluateOrderOutcome(order, 110);

  assert.equal(updated.currentPrice, 110);
  assert.equal(updated.highWaterMark, 120);
  assert.equal(updated.trailingStopPrice, 114);
  assert.equal(updated.status, 'green');
  assert.equal(updated.result, 'profit-hit');
});
