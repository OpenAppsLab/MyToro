const test = require('node:test');
const assert = require('node:assert/strict');
const { buildLiveSignal, buildOrderRecord, evaluateOrderOutcome, buildIntradayFeatureVector, labelIntradayOutcome, computeCalibrationHealth, optimizeAlphaThreshold } = require('../server');

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

  assert.ok(signal.probability <= 0.85, 'expected overextended setups to receive a more conservative probability');
  assert.ok(signal.advancedSignals.volatilityRegime === 'high' || signal.advancedSignals.atrPct > 2, 'expected high-volatility regime to be captured');
});

test('labelIntradayOutcome uses a forward-looking move and a relaxed target', () => {
  const item = {
    symbol: 'NVDA',
    currentPrice: 110,
    closeHistory: [100, 102, 103, 104, 106, 108],
    volumeHistory: [100000, 100000, 100000, 100000, 100000, 100000],
    volume: 120000
  };

  assert.equal(labelIntradayOutcome(item, 1.0, { targetMovePct: 1.0, minVolumeRatio: 0.8 }), true);
});

test('labelIntradayOutcome falls back to last nonzero volume when current volume is missing', () => {
  const item = {
    symbol: 'NVDA',
    currentPrice: 110,
    closeHistory: [100, 102, 103, 104, 106, 108],
    volumeHistory: [100000, 100000, 100000, 100000, 100000, 100000],
    volume: 0
  };

  assert.equal(labelIntradayOutcome(item, 0.5, { targetMovePct: 0.5, minVolumeRatio: 0.8 }), true);
});

test('intraday feature vectors include richer momentum and volume features and use a quality-adjusted label', () => {
  const item = {
    symbol: 'NVDA',
    name: 'NVIDIA',
    region: 'NASDAQ',
    currentPrice: 120.5,
    openPrice: 117.5,
    prevClose: 116.2,
    dayMovePct: 3.4,
    volume: 210000000,
    volumeHistory: [100000000, 110000000, 120000000, 135000000, 145000000, 160000000, 180000000],
    closeHistory: [116.2, 117.1, 117.7, 118.2, 118.8, 119.5, 120.5],
    highHistory: [116.8, 117.5, 118.5, 119.1, 119.6, 120.1, 121.2],
    lowHistory: [115.9, 116.6, 117.0, 117.7, 118.3, 118.9, 119.8]
  };

  const features = buildIntradayFeatureVector(item, {
    rsi: 62,
    macdHistogram: 1.5,
    movingAverageDistancePct: 2.1,
    atrPct: 1.6,
    volumeZ: 2.3,
    sentimentScore: 65,
    liquidityPenalty: 0.01,
    sectorStrength: 0.72,
    candlePatternStrength: 0.8,
    regime: 'trend-up',
    hurst: 0.62,
    probability: 0.72
  }, { marketStats: { rsi: [50, 60, 70], atrPct: [1, 1.5, 2], distancePct: [1, 2, 3], volumeZ: [1, 2, 3], dayMovePct: [2, 3, 4] } });

  assert.equal(typeof features.gapPct, 'number');
  assert.equal(typeof features.relativeVolume, 'number');
  assert.equal(typeof features.momentumSlope, 'number');
  assert.equal(typeof features.closeStrength, 'number');
  assert.equal(typeof features.breakoutSignal, 'number');
  assert.equal(labelIntradayOutcome(item, 1.0, { targetMovePct: 1.0, minVolumeRatio: 0.8 }), true);
});

test('optimizeAlphaThreshold computes win rate from realized trade outcomes', () => {
  const examples = [
    {
      item: {
        symbol: 'NVDA',
        currentPrice: 113,
        openPrice: 110,
        prevClose: 110,
        closeHistory: [110, 113],
        highHistory: [110, 113],
        lowHistory: [110, 113],
        volumeHistory: [80000, 120000],
        volume: 120000,
        dayMovePct: 2.727272727272727
      },
      news: []
    }
  ];

  const result = optimizeAlphaThreshold(examples, {
    intradayModel: { weights: {}, bias: 0 },
    alphas: [1],
    thresholds: [0.1],
    ballparkAmount: 3000,
    leverage: 2,
    thresholdPct: 2.5
  });

  assert.equal(result.results[0].orderCount, 1);
  assert.equal(result.results[0].winRate, 1);
});

test('calibration health stays healthy when the curve is only moderately off but the brier score is strong', () => {
  const curve = [
    { meanPred: 0.145, meanActual: 0.5, count: 4 },
    { meanPred: 0.146, meanActual: 0.25, count: 4 },
    { meanPred: 0.147, meanActual: 0, count: 4 },
    { meanPred: 0.148, meanActual: 0, count: 4 },
    { meanPred: 0.149, meanActual: 0, count: 4 },
    { meanPred: 0.15, meanActual: 0, count: 4 },
    { meanPred: 0.151, meanActual: 0, count: 4 },
    { meanPred: 0.152, meanActual: 0, count: 4 },
    { meanPred: 0.153, meanActual: 0, count: 4 },
    { meanPred: 0.154, meanActual: 0, count: 4 }
  ];

  const health = computeCalibrationHealth(curve, { brier: 0.007 });
  assert.equal(health.degraded, false);
  assert.ok(health.meanGap < 0.2);
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
