const test = require('node:test');
const assert = require('node:assert/strict');
const { curatedSymbols, getCuratedSymbolSet } = require('../scripts/symbol_watchlist');

test('curated watchlist is restricted to a high-liquidity S&P 500-oriented set', () => {
  const symbols = getCuratedSymbolSet();

  assert.ok(symbols.length >= 50, 'expected a meaningful watchlist size');
  assert.ok(symbols.includes('AAPL'), 'expected major tech coverage');
  assert.ok(symbols.includes('NVDA'), 'expected AI/semiconductor coverage');
  assert.ok(symbols.includes('JPM'), 'expected banking coverage');
  assert.ok(symbols.includes('XOM'), 'expected energy coverage');
  assert.ok(symbols.includes('LLY'), 'expected pharma coverage');
  assert.ok(!symbols.includes('TECH'), 'expected to exclude non-core symbols');
  assert.equal(symbols.length, curatedSymbols.length, 'expected a stable symbol set');
});
