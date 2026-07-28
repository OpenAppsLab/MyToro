const test = require('node:test');
const assert = require('node:assert/strict');
const server = require('../server');

test('market query matching finds symbols and company names', () => {
  const market = [
    { symbol: 'AAPL', name: 'Apple', region: 'NASDAQ' },
    { symbol: 'QQQ', name: 'Invesco NASDAQ 100 ETF', region: 'NASDAQ' },
    { symbol: 'NVDA', name: 'NVIDIA', region: 'NASDAQ' }
  ];

  const matches = server.filterMarketItemsByQuery(market, 'apple');
  assert.equal(matches.length, 1);
  assert.equal(matches[0].symbol, 'AAPL');

  const symbolMatches = server.filterMarketItemsByQuery(market, 'qqq');
  assert.equal(symbolMatches[0].symbol, 'QQQ');
});

test('buildLiveSignal produces a calibrated probability from technical and sentiment features', () => {
  const signal = server.buildLiveSignal({
    symbol: 'AAPL',
    name: 'Apple',
    region: 'NASDAQ',
    currentPrice: 200,
    changePct: 1.2,
    dayMovePct: 2.3,
    volume: 1200000,
    closeHistory: [190, 192, 195, 198, 200],
    volumeHistory: [800000, 900000, 950000, 1100000, 1200000],
    highHistory: [192, 195, 198, 200, 202],
    lowHistory: [188, 190, 193, 196, 198]
  }, [{ title: 'Apple beats expectations', description: 'Apple reports strong guidance' }], 30, 3000, 2, {});

  assert.ok(signal.probability >= 0.5, 'expected a bullish probability above 0.5 for the sample setup');
  assert.ok(Number.isFinite(signal.ensembleScore));
  assert.ok(signal.ensembleScore >= 50);
});
