const test = require('node:test');
const assert = require('node:assert/strict');
const { buildLiveSignal, buildOrderRecord, evaluateOrderOutcome } = require('../server');

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

test('buildLiveSignal down-weights overextended or highly volatile setups', () => {
  const item = {
    symbol: 'TSLA',
    name: 'Tesla',
    region: 'NASDAQ',
    currentPrice: 320,
    changePct: 9.1,
    dayMovePct: 9.1,
    volume: 260000000,
    volumeHistory: [60000000, 65000000, 70000000, 72000000, 78000000, 80000000, 85000000],
    closeHistory: [250, 255, 258, 265, 270, 280, 320],
    highHistory: [255, 260, 270, 275, 280, 290, 322],
    lowHistory: [248, 252, 255, 260, 265, 270, 315]
  };

  const signal = buildLiveSignal(item, [], 100, 3000, 2, {
    peerMoves: { NVDA: 1.2, AMD: 0.5 },
    peerTargets: ['NVDA', 'AMD']
  });

  assert.ok(signal.probability < 0.75, 'expected overextended setups to receive a lower probability');
  assert.ok(signal.advancedSignals.volatilityRegime === 'high' || signal.advancedSignals.atrPct > 2, 'expected high-volatility regime to be captured');
});

test('trailing stop logic closes a trade once profit target or stop-loss threshold is reached', () => {
  const order = buildOrderRecord({
    symbol: 'AAPL',
    name: 'Apple',
    entryPrice: 500,
    targetProfit: 30,
    ballparkAmount: 3000,
    leverage: 2,
    stopLossAmount: 50
  });

  const profitHit = evaluateOrderOutcome(order, 530);
  assert.equal(profitHit.result, 'profit-hit');
  assert.equal(profitHit.status, 'green');

  const stopLossHit = evaluateOrderOutcome(order, 450);
  assert.equal(stopLossHit.result, 'loss-hit');
  assert.equal(stopLossHit.status, 'red');
});

test('a 5% trailing stop moves up as price rises and triggers when price drops below the trailing level', () => {
  const order = buildOrderRecord({
    symbol: 'SPY',
    name: 'S&P 500 ETF',
    entryPrice: 117.2,
    targetProfit: 30,
    ballparkAmount: 3000,
    leverage: 2
  });

  const afterRise = evaluateOrderOutcome(order, 125);
  assert.equal(afterRise.trailingStopPrice, 118.75);
  assert.equal(afterRise.status, 'pending');

  const afterDrop = evaluateOrderOutcome({ ...afterRise, trailingStopPrice: afterRise.trailingStopPrice }, 118.7);
  assert.equal(afterDrop.result, 'loss-hit');
  assert.equal(afterDrop.status, 'red');
});
