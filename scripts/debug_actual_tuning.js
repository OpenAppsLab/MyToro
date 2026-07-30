const fs = require('fs');
const path = require('path');
const { optimizeAlphaThreshold, buildAdvancedSignals, buildIntradayFeatureVector, buildMarketFeatureStats, getIntradayModel, countThresholdCandidates } = require('../server');

const DATA_DIR = path.resolve(__dirname, '..', 'data');
const files = fs.readdirSync(DATA_DIR).filter((name) => name.endsWith('_snapshot_intraday_1d_5m.json')).sort().slice(0, 100);
const examples = [];
const market = [];
files.forEach((file) => {
  const raw = fs.readFileSync(path.join(DATA_DIR, file), 'utf8');
  const json = JSON.parse(raw);
  const result = json.result || json;
  const quote = (result.indicators || {}).quote && (result.indicators || {}).quote[0] ? (result.indicators || {}).quote[0] : {};
  const closes = Array.isArray(quote.close) ? quote.close.filter((v) => v != null) : [];
  const highs = Array.isArray(quote.high) ? quote.high.filter((v) => v != null) : [];
  const lows = Array.isArray(quote.low) ? quote.low.filter((v) => v != null) : [];
  const opens = Array.isArray(quote.open) ? quote.open.filter((v) => v != null) : [];
  const volumes = Array.isArray(quote.volume) ? quote.volume.filter((v) => v != null) : [];
  if (closes.length < 2) return;
  const currentPrice = closes[closes.length - 1];
  const dayMovePct = opens.length ? ((currentPrice - opens[0]) / opens[0]) * 100 : 0;
  const item = {
    symbol: file.split('_')[0],
    name: file.split('_')[0],
    closeHistory: closes,
    highHistory: highs,
    lowHistory: lows,
    currentPrice,
    dayMovePct,
    openPrice: opens[0] || closes[0],
    prevClose: closes[0],
    preMarketMovePct: 0,
    volumeHistory: volumes,
    volume: volumes.length ? volumes[volumes.length - 1] || volumes.slice().reverse().find((v) => v > 0) || 0 : 0
  };
  examples.push({ item, news: [] });
  market.push(item);
});

const marketStats = buildMarketFeatureStats(market);
const peerMoves = market.reduce((acc, item) => { acc[item.symbol] = Number(item.dayMovePct || 0); return acc; }, {});
const tuneInput = examples.map((example) => {
  const adv = buildAdvancedSignals(example.item, example.news || [], { marketStats, peerMoves, peerTargets: ['NVDA', 'AMD'] });
  const features = buildIntradayFeatureVector(example.item, adv, { marketStats });
  return { ...example, features, adv };
});

const intradayModel = getIntradayModel();
const tune = optimizeAlphaThreshold(tuneInput, {
  intradayModel,
  alphas: [0, 0.25, 0.5, 0.75, 1],
  thresholds: [0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5, 0.55, 0.6, 0.65, 0.7],
  ballparkAmount: 3000,
  leverage: 2,
  thresholdPct: 2.5
});
console.log('best', tune.best);
console.log('nonzero results', tune.results.filter((r) => r.orderCount > 0).length);
console.log('top results', tune.results.slice(0, 10));

(async () => {
  const count = await countThresholdCandidates(0.25, 0.6);
  console.log('countThresholdCandidates 0.25/0.6', count);
  const count2 = await countThresholdCandidates(0.75, 0.3);
  console.log('countThresholdCandidates 0.75/0.3', count2);
})();
