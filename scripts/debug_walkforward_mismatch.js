const fs = require('fs');
const path = require('path');
const {
  optimizeAlphaThreshold,
  trainIntradayModel,
  buildAdvancedSignals,
  buildIntradayFeatureVector,
  buildMarketFeatureStats,
  labelIntradayOutcome,
  getIntradayModel
} = require('../server');

const DATA_DIR = path.resolve(__dirname, '..', 'data');
const files = fs.readdirSync(DATA_DIR).filter((name) => name.endsWith('_snapshot_intraday_1d_5m.json')).sort();
const examples = [];

for (const file of files) {
  const raw = fs.readFileSync(path.join(DATA_DIR, file), 'utf8');
  const json = JSON.parse(raw);
  const result = json.result || json;
  const indicators = result.indicators || {};
  const quote = indicators.quote && indicators.quote[0] ? indicators.quote[0] : {};
  const closes = Array.isArray(quote.close) ? quote.close.filter((v) => v != null) : [];
  const highs = Array.isArray(quote.high) ? quote.high.filter((v) => v != null) : [];
  const lows = Array.isArray(quote.low) ? quote.low.filter((v) => v != null) : [];
  const opens = Array.isArray(quote.open) ? quote.open.filter((v) => v != null) : [];
  const volumes = Array.isArray(quote.volume) ? quote.volume.filter((v) => v != null).map(Number) : [];
  if (!closes.length) continue;
  const currentPrice = closes[closes.length - 1];
  const firstOpen = opens.length ? opens[0] : closes[0];
  const currentVolume = volumes.length ? volumes[volumes.length - 1] || volumes.slice().reverse().find((value) => value > 0) || 0 : 0;
  examples.push({
    item: {
      symbol: file.split('_')[0],
      name: file.split('_')[0],
      closeHistory: closes,
      highHistory: highs,
      lowHistory: lows,
      currentPrice,
      dayMovePct: firstOpen > 0 ? ((currentPrice - firstOpen) / firstOpen) * 100 : 0,
      openPrice: firstOpen,
      prevClose: closes[0],
      preMarketMovePct: 0,
      volumeHistory: volumes,
      volume: currentVolume
    },
    news: []
  });
}

const marketItems = examples.map((ex) => ex.item);
const marketStats = buildMarketFeatureStats(marketItems);
const formattedExamples = examples.map((example) => {
  const adv = buildAdvancedSignals(example.item, example.news, { marketStats });
  const features = buildIntradayFeatureVector(example.item, adv, { marketStats });
  const label = labelIntradayOutcome(example.item, 2.5, { targetMovePct: 2.5, minVolumeRatio: 1.2 }) ? 1 : 0;
  return { item: example.item, features, label, news: example.news };
});

console.log('examples', formattedExamples.length);

const trainedModel = trainIntradayModel(formattedExamples, 2.5, 500, 0.01);
const persistedModel = getIntradayModel();

const tuningFromTrained = optimizeAlphaThreshold(formattedExamples, {
  intradayModel: trainedModel,
  alphas: [0, 0.25, 0.5, 0.75, 1],
  thresholds: [0.1,0.2,0.3,0.4,0.45,0.5,0.55,0.6,0.65,0.7],
  ballparkAmount: 3000,
  leverage: 2,
  thresholdPct: 2.5
});

const tuningFromPersisted = optimizeAlphaThreshold(formattedExamples, {
  intradayModel: persistedModel,
  alphas: [0, 0.25, 0.5, 0.75, 1],
  thresholds: [0.1,0.2,0.3,0.4,0.45,0.5,0.55,0.6,0.65,0.7],
  ballparkAmount: 3000,
  leverage: 2,
  thresholdPct: 2.5
});

console.log('trained best', tuningFromTrained.best, 'nonzero', tuningFromTrained.results.filter((r) => r.orderCount > 0).length);
console.log('persisted best', tuningFromPersisted.best, 'nonzero', tuningFromPersisted.results.filter((r) => r.orderCount > 0).length);
