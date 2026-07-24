const test = require('node:test');
const assert = require('node:assert/strict');
const { buildLiveSignal } = require('../server');

test('buildLiveSignal includes advanced live forecasting signals', () => {
  const item = {
    symbol: 'NVDA',
    name: 'NVIDIA',
    region: 'NASDAQ',
    currentPrice: 120.5,
    changePct: 1.8,
    dayMovePct: 3.2,
    volume: 120000000,
    volumeHistory: [90000000, 95000000, 98000000, 110000000, 115000000, 120000000, 125000000],
    closeHistory: [118, 119, 119.5, 120, 120.4, 120.8, 121.1]
  };

  const news = [
    {
      title: 'NVIDIA AI demand accelerates as data center orders surge',
      description: 'Analysts expect strong demand for next-generation chips.'
    }
  ];

  const signal = buildLiveSignal(item, news, 100, 3000, 2, {
    peerMoves: { NVDA: 3.1, AMD: 2.2 },
    peerCorrelations: { NVDA: 0.78, AMD: 0.63 }
  });

  assert.ok(signal.advancedSignals, 'expected advancedSignals to be present');
  assert.ok(signal.advancedSignals.optionsFlowScore >= 0, 'expected options flow score to be numeric');
  assert.ok(signal.advancedSignals.volumeSignal >= 0, 'expected volume score to be numeric');
  assert.ok(signal.advancedSignals.sectorSentimentScore !== 0, 'expected sector sentiment score to be non-zero');
  assert.ok(signal.advancedSignals.correlationScore >= 0, 'expected correlation score to be numeric');
  assert.ok(signal.advancedSignals.squeezeScore >= 0, 'expected squeeze score to be numeric');
  assert.ok(signal.advancedSignals.premarketBlockScore >= 0, 'expected pre-market block score to be numeric');
});
