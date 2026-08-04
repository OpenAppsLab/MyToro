const test = require('node:test');
const assert = require('node:assert/strict');
const { evaluateOrderEligibility, calculateDynamicPositionSizing } = require('../server');

test('evaluateOrderEligibility marks strong candidates as pending-eligible and weak ones as rejected-risk', () => {
  const eligible = evaluateOrderEligibility({
    symbol: 'AAPL',
    currentPrice: 190,
    dayMovePct: 2.4,
    probability: 0.74,
    combinedScore: 0.82,
    advancedSignals: { atrPct: 0.012, sectorStrength: 0.8, volumeZ: 2.1, liquidityPenalty: 0.01 }
  }, {
    targetProfit: 40,
    ballparkAmount: 3000,
    leverage: 2,
    stopLossPct: 2.5,
    marketOpen: true,
    requireManualReview: true
  });

  assert.equal(eligible.status, 'pending-eligible');
  assert.ok(eligible.reasons.some((reason) => reason.includes('manual review')));
  assert.ok(eligible.executionContext.price > 0);

  const rejected = evaluateOrderEligibility({
    symbol: 'TSLA',
    currentPrice: 240,
    dayMovePct: -0.4,
    probability: 0.3,
    combinedScore: 0.2,
    advancedSignals: { atrPct: 0.08, sectorStrength: 0.2, volumeZ: 0.6, liquidityPenalty: 0.1 }
  }, {
    targetProfit: 40,
    ballparkAmount: 3000,
    leverage: 2,
    stopLossPct: 2.5,
    marketOpen: true,
    requireManualReview: true
  });

  assert.equal(rejected.status, 'rejected-risk');
  assert.ok(rejected.reasons.some((reason) => reason.includes('risk')) || rejected.reasons.some((reason) => reason.includes('threshold')));
});

test('calculateDynamicPositionSizing scales down for higher volatility and scales up for better expected value', () => {
  const lowerVolatility = calculateDynamicPositionSizing({
    entryPrice: 100,
    targetProfit: 40,
    stopLossAmount: 5,
    ballparkAmount: 3000,
    leverage: 2,
    volatilityPct: 2,
    expectedMovePct: 4
  });

  const higherVolatility = calculateDynamicPositionSizing({
    entryPrice: 100,
    targetProfit: 40,
    stopLossAmount: 5,
    ballparkAmount: 3000,
    leverage: 2,
    volatilityPct: 8,
    expectedMovePct: 4
  });

  assert.ok(higherVolatility.shareCount <= lowerVolatility.shareCount);
  assert.ok(higherVolatility.sizeMultiplier <= lowerVolatility.sizeMultiplier);
  assert.ok(higherVolatility.riskAmount > 0);
});

test('review gating stays on for pending-eligible candidates and blocks rejected-risk picks', () => {
  const pending = evaluateOrderEligibility({
    symbol: 'AAPL',
    currentPrice: 190,
    dayMovePct: 2.4,
    probability: 0.74,
    combinedScore: 0.82,
    advancedSignals: { atrPct: 0.012, volumeZ: 2.1, liquidityPenalty: 0.01 }
  }, {
    targetProfit: 40,
    ballparkAmount: 3000,
    leverage: 2,
    stopLossPct: 2.5,
    marketOpen: true,
    requireManualReview: true
  });

  const rejected = evaluateOrderEligibility({
    symbol: 'TSLA',
    currentPrice: 240,
    dayMovePct: -0.4,
    probability: 0.3,
    combinedScore: 0.2,
    advancedSignals: { atrPct: 0.08, volumeZ: 0.6, liquidityPenalty: 0.1 }
  }, {
    targetProfit: 40,
    ballparkAmount: 3000,
    leverage: 2,
    stopLossPct: 2.5,
    marketOpen: true,
    requireManualReview: true
  });

  assert.equal(pending.status, 'pending-eligible');
  assert.equal(pending.reviewRequired, true);
  assert.equal(rejected.status, 'rejected-risk');
  assert.equal(rejected.reviewRequired, true);
});
