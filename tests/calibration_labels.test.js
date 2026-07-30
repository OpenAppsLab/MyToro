const test = require('node:test');
const assert = require('node:assert/strict');
const { labelIntradayOutcome } = require('../server');

test('labels a move that reaches the target within the short lookahead horizon', () => {
  const item = {
    openPrice: 100,
    currentPrice: 100,
    volume: 2500,
    closeHistory: [100, 101, 102, 105],
    volumeHistory: [1000, 1200, 1400, 2500]
  };

  const label = labelIntradayOutcome(item, 2.5, { futureLookaheadBars: 2, minVolumeRatio: 0.8 });

  assert.equal(label, true);
});

test('ignores weak or noisy moves that do not sustain the target', () => {
  const item = {
    openPrice: 100,
    currentPrice: 100,
    volume: 2500,
    closeHistory: [100, 101, 102, 102],
    volumeHistory: [1000, 1200, 1400, 2500]
  };

  const label = labelIntradayOutcome(item, 2.5, { futureLookaheadBars: 2, minVolumeRatio: 0.8 });

  assert.equal(label, false);
});
