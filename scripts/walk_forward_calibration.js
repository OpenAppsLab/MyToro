const fs = require('fs').promises;
const path = require('path');
const {
  optimizeAlphaThreshold,
  calibrateModel,
  evaluateWalkForward,
  trainIntradayModel,
  buildAdvancedSignals,
  buildIntradayFeatureVector,
  buildMarketFeatureStats,
  labelIntradayOutcome,
  countThresholdCandidates,
  saveRuntimeSettings,
  DEFAULT_INTRADAY_MODEL
} = require('../server');

const DATA_DIR = path.resolve(__dirname, '..', 'data');
const MODELS_DIR = path.resolve(__dirname, '..', 'models');
const OUT_PATH = path.join(MODELS_DIR, 'walk_forward_tuning.json');

function buildItemFromSnapshot(result, symbol) {
  const indicators = result.indicators || {};
  const quote = indicators.quote && indicators.quote[0] ? indicators.quote[0] : {};
  const closes = Array.isArray(quote.close) ? quote.close.filter((v) => v != null) : [];
  const highs = Array.isArray(quote.high) ? quote.high.filter((v) => v != null) : [];
  const lows = Array.isArray(quote.low) ? quote.low.filter((v) => v != null) : [];
  const opens = Array.isArray(quote.open) ? quote.open.filter((v) => v != null) : [];
  const volumes = Array.isArray(quote.volume) ? quote.volume.filter((v) => v != null) : [];
  const currentPrice = closes.length ? closes[closes.length - 1] : 0;
  const firstOpen = opens.length ? opens[0] : (closes.length ? closes[0] : 0);
  const prevClose = closes.length ? closes[0] : 0;
  const dayMovePct = firstOpen > 0 ? ((currentPrice - firstOpen) / firstOpen) * 100 : 0;

  return {
    symbol,
    name: symbol,
    closeHistory: closes,
    highHistory: highs,
    lowHistory: lows,
    currentPrice,
    dayMovePct,
    openPrice: firstOpen,
    prevClose,
    preMarketMovePct: 0,
    volumeHistory: volumes,
    volume: volumes.length ? volumes[volumes.length - 1] : 0
  };
}

async function loadSnapshotExamples() {
  const files = await fs.readdir(DATA_DIR);
  const snapshotFiles = files.filter((name) => name.endsWith('_snapshot_intraday_1d_5m.json')).sort();
  if (!snapshotFiles.length) {
    throw new Error(`No intraday snapshot files found in ${DATA_DIR}`);
  }

  const items = [];
  for (const file of snapshotFiles) {
    const raw = await fs.readFile(path.join(DATA_DIR, file), 'utf8');
    const json = JSON.parse(raw);
    const symbol = file.split('_')[0];
    const result = json.result || json;
    if (!result) {
      continue;
    }
    const item = buildItemFromSnapshot(result, symbol);
    if (!item.closeHistory.length) {
      continue;
    }
    items.push({ item, news: [] });
  }

  if (!items.length) {
    throw new Error('No valid item examples were built from snapshot files.');
  }

  return items;
}

async function run() {
  await fs.mkdir(MODELS_DIR, { recursive: true });

  const examples = await loadSnapshotExamples();
  const items = examples.map((example) => example.item);
  const marketStats = buildMarketFeatureStats(items);

  const formattedExamples = examples.map((example) => {
    const adv = buildAdvancedSignals(example.item, [], { marketStats });
    const features = buildIntradayFeatureVector(example.item, adv, { marketStats });
    const label = labelIntradayOutcome(example.item, 2.5) ? 1 : 0;
    return { item: example.item, features, label, news: [] };
  });

  const intradayModel = trainIntradayModel(formattedExamples, 2.5, 300, 0.02);

  const tuning = optimizeAlphaThreshold(formattedExamples, {
    intradayModel,
    alphas: [0, 0.25, 0.5, 0.75, 1],
    thresholds: [0.1, 0.2, 0.3, 0.4, 0.45, 0.5, 0.55, 0.6, 0.65, 0.7],
    ballparkAmount: 3000,
    leverage: 2,
    thresholdPct: 2.5
  });

  async function chooseRuntimeSettings(results) {
    const targetMin = 3;
    const targetMax = 5;
    const scored = [];

    for (const row of results) {
      const candidateCounts = await countThresholdCandidates(row.alpha, row.threshold);
      scored.push({
        ...row,
        liveCandidateCount: candidateCounts.candidateCount,
        topSymbols: candidateCounts.topSymbols
      });
    }

    const valid = scored.filter((row) => row.liveCandidateCount >= targetMin && row.liveCandidateCount <= targetMax);
    if (valid.length) {
      return valid.sort((a, b) => b.totalPnl - a.totalPnl)[0];
    }

    const aboveMin = scored.filter((row) => row.liveCandidateCount >= targetMin);
    if (aboveMin.length) {
      return aboveMin.sort((a, b) => {
        const countDiff = Math.abs(a.liveCandidateCount - ((targetMin + targetMax) / 2)) - Math.abs(b.liveCandidateCount - ((targetMin + targetMax) / 2));
        return countDiff || b.totalPnl - a.totalPnl;
      })[0];
    }

    const positiveCandidates = scored.filter((row) => row.liveCandidateCount > 0);
    if (positiveCandidates.length) {
      return positiveCandidates.sort((a, b) => b.liveCandidateCount - a.liveCandidateCount || b.totalPnl - a.totalPnl)[0];
    }

    const fallbackThresholds = [0.05, 0.1, 0.15, 0.2, 0.25, 0.3];
    const fallbackRows = [];
    for (const alpha of [0, 0.25, 0.5, 0.75, 1]) {
      for (const threshold of fallbackThresholds) {
        const candidateCounts = await countThresholdCandidates(alpha, threshold);
        fallbackRows.push({
          alpha,
          threshold,
          liveCandidateCount: candidateCounts.candidateCount,
          topSymbols: candidateCounts.topSymbols
        });
      }
    }

    const fallbackPositive = fallbackRows.filter((row) => row.liveCandidateCount > 0);
    if (fallbackPositive.length) {
      return fallbackPositive.sort((a, b) => b.liveCandidateCount - a.liveCandidateCount)[0];
    }

    return scored.sort((a, b) => b.liveCandidateCount - a.liveCandidateCount || b.totalPnl - a.totalPnl)[0];
  }

  const recommended = await chooseRuntimeSettings(tuning.results);
  if (recommended) {
    saveRuntimeSettings({
      intradayAlpha: recommended.alpha,
      minCombinedThreshold: recommended.threshold
    });
  }

  const walkForward = evaluateWalkForward(formattedExamples, ['premarketMove', 'openingGap', 'firstHourMove', 'volumeZ', 'sentiment', 'patternStrength', 'sectorStrength', 'atrPct', 'liquidity'], intradayModel, 50);
  const logisticCalibration = calibrateModel(formattedExamples, intradayModel, 'logistic', { iterations: 300, learningRate: 0.05 });
  const isotonicCalibration = calibrateModel(formattedExamples, intradayModel, 'isotonic');

  const output = {
    generatedAt: new Date().toISOString(),
    snapshotCount: formattedExamples.length,
    intradayModel,
    tuning,
    walkForward: walkForward.map((entry, index) => ({ fold: index + 1, brier: entry.brier, accuracy: entry.accuracy })),
    calibration: {
      logistic: logisticCalibration,
      isotonic: isotonicCalibration
    }
  };

  await fs.writeFile(OUT_PATH, JSON.stringify(output, null, 2));
  console.log(`Saved walk-forward tuning report to ${OUT_PATH}`);
  console.log('Best tuning result:', tuning.best);
}

run().catch((err) => {
  console.error('Walk-forward calibration failed:', err.message || err);
  process.exit(1);
});
