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
