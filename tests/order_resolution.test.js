const test = require('node:test');
const assert = require('node:assert/strict');
const { resolveOrderMetricsForDisplay } = require('../server');

test('resolveOrderMetricsForDisplay uses the intraday price series for a historical order', () => {
  const order = {
    symbol: 'GILD',
    entryPrice: 100,
    currentPrice: 100,
    createdAt: 1785331800 * 1000,
    updatedAt: 1785331800 * 1000,
    settledAt: 1785331800 * 1000,
    status: 'green'
  };

  const resolved = resolveOrderMetricsForDisplay(order);

  assert.equal(Number.isFinite(resolved.resolvedEntryPrice), true);
  assert.equal(Number.isFinite(resolved.resolvedCurrentPrice), true);
  assert.equal(resolved.resolvedEntryPrice > 0, true);
  assert.equal(resolved.resolvedCurrentPrice > 0, true);
});
