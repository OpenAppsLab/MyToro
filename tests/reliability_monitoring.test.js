const test = require('node:test');
const assert = require('node:assert/strict');

const {
  resetReliabilityMonitor,
  updateDataHealthMonitoring,
  recordOrderOutcomeMonitoring,
  getReliabilityMonitorSnapshot
} = require('../server');

test('data health monitoring flags stale snapshots and provider failures', () => {
  resetReliabilityMonitor();

  const status = updateDataHealthMonitoring({
    marketItems: [],
    newsItems: [],
    providerErrors: ['Finnhub timeout'],
    sourceUpdatedAt: Date.now() - 20 * 60 * 1000,
    fallbackUsed: true
  });

  assert.equal(status.stale, true);
  assert.equal(status.providerFailureCount > 0, true);
  assert.equal(status.healthy, false);
  assert.match(status.warnings.join(' '), /stale/i);
});

test('order outcome monitoring pauses auto-ordering after repeated poor results', () => {
  resetReliabilityMonitor();

  recordOrderOutcomeMonitoring({ symbol: 'AAPL' }, { profitable: false });
  recordOrderOutcomeMonitoring({ symbol: 'MSFT' }, { profitable: false });
  recordOrderOutcomeMonitoring({ symbol: 'NVDA' }, { profitable: false });

  const status = getReliabilityMonitorSnapshot();
  assert.equal(status.autoOrderPaused, true);
  assert.equal(status.performance.sampleSize, 3);
  assert.match(status.pauseReason || '', /success rate/i);
});
