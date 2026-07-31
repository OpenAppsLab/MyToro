const fs = require('fs').promises;
const path = require('path');
const {
  optimizeAlphaThreshold,
  calibrateModel,
  computeCalibrationCurve,
  computeCalibrationHealth,
  evaluateWalkForward,
  trainIntradayModel,
  buildAdvancedSignals,
  buildIntradayFeatureVector,
  buildMarketFeatureStats,
  labelIntradayOutcome,
  countThresholdCandidates,
  saveRuntimeSettings,
  getIntradayModel,
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
  const currentVolume = volumes.length ? volumes[volumes.length - 1] || volumes.slice().reverse().find((value) => value > 0) || 0 : 0;
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
    volume: currentVolume
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
    const label = labelIntradayOutcome(example.item, 1.8, { targetMovePct: 1.8, minVolumeRatio: 1.0, futureLookaheadBars: 2 }) ? 1 : 0;
    return { item: example.item, features, label, news: [] };
  });

  const intradayModel = trainIntradayModel(formattedExamples, 1.8, 500, 0.01);
  const persistedModel = getIntradayModel();

  const trainedTuning = optimizeAlphaThreshold(formattedExamples, {
    intradayModel,
    alphas: [0, 0.25, 0.5, 0.75, 1],
    thresholds: [0.1, 0.2, 0.3, 0.4, 0.45, 0.5, 0.55, 0.6, 0.65, 0.7],
    ballparkAmount: 3000,
    leverage: 2,
    thresholdPct: 2.5
  });

  const persistedTuning = optimizeAlphaThreshold(formattedExamples, {
    intradayModel: persistedModel,
    alphas: [0, 0.25, 0.5, 0.75, 1],
    thresholds: [0.1, 0.2, 0.3, 0.4, 0.45, 0.5, 0.55, 0.6, 0.65, 0.7],
    ballparkAmount: 3000,
    leverage: 2,
    thresholdPct: 2.5
  });

  const tuning = (persistedTuning.best.totalPnl >= trainedTuning.best.totalPnl && persistedTuning.best.orderCount > 0)
    ? persistedTuning
    : trainedTuning;
  const chosenModel = tuning === persistedTuning ? persistedModel : intradayModel;
  const modelSource = tuning === persistedTuning ? 'persisted' : 'trained';

  const calibrationCurve = computeCalibrationCurve(formattedExamples, chosenModel, { thresholdPct: 1.8, bins: 10 });
  const calibrationHealth = computeCalibrationHealth(calibrationCurve, { brier: tuning.best.brier });

  const healthGate = calibrationHealth.degraded ? 'pause' : 'run';

  async function chooseRuntimeSettings(results, calibrationHealth) {
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

    const enoughCandidates = scored.filter((row) => row.liveCandidateCount >= targetMin && row.liveCandidateCount <= targetMax);
    if (enoughCandidates.length) {
      return enoughCandidates
        .sort((a, b) => {
          const winRateDiff = (b.winRate || 0) - (a.winRate || 0);
          const pnlDiff = (b.totalPnl || 0) - (a.totalPnl || 0);
          const countDiff = Math.abs((a.liveCandidateCount || 0) - ((targetMin + targetMax) / 2)) - Math.abs((b.liveCandidateCount || 0) - ((targetMin + targetMax) / 2));
          return winRateDiff || countDiff || pnlDiff;
        })[0];
    }

    const aboveMin = scored.filter((row) => row.liveCandidateCount >= targetMin);
    if (aboveMin.length) {
      return aboveMin.sort((a, b) => {
        const winRateDiff = (b.winRate || 0) - (a.winRate || 0);
        const countDiff = Math.abs((a.liveCandidateCount || 0) - ((targetMin + targetMax) / 2)) - Math.abs((b.liveCandidateCount || 0) - ((targetMin + targetMax) / 2));
        return winRateDiff || countDiff || ((b.totalPnl || 0) - (a.totalPnl || 0));
      })[0];
    }

    const positiveCandidates = scored.filter((row) => row.liveCandidateCount > 0);
    if (positiveCandidates.length) {
      return positiveCandidates.sort((a, b) => {
        const winRateDiff = (b.winRate || 0) - (a.winRate || 0);
        return winRateDiff || (b.liveCandidateCount - a.liveCandidateCount) || ((b.totalPnl || 0) - (a.totalPnl || 0));
      })[0];
    }

    if (calibrationHealth.degraded) {
      return null;
    }

    return scored.sort((a, b) => b.liveCandidateCount - a.liveCandidateCount || ((b.totalPnl || 0) - (a.totalPnl || 0)))[0];
  }

    async function runCalibration() {
    const recommended = await chooseRuntimeSettings(tuning.results, calibrationHealth);
    if (recommended) {
      saveRuntimeSettings({
        intradayAlpha: recommended.alpha,
        minCombinedThreshold: recommended.threshold
      });
    }
  }

  await runCalibration();

  const walkForward = evaluateWalkForward(formattedExamples, ['premarketMove', 'openingGap', 'firstHourMove', 'volumeZ', 'sentiment', 'patternStrength', 'sectorStrength', 'atrPct', 'liquidity'], chosenModel, 50);
  const logisticCalibration = calibrateModel(formattedExamples, intradayModel, 'logistic', { iterations: 300, learningRate: 0.05 });
  const isotonicCalibration = calibrateModel(formattedExamples, intradayModel, 'isotonic');

  const output = {
    generatedAt: new Date().toISOString(),
    snapshotCount: formattedExamples.length,
    intradayModel: chosenModel,
    modelSource,
    best: tuning.best,
    results: tuning.results,
    tuning,
    calibrationHealth,
    healthGate,
    walkForward: walkForward.map((entry, index) => ({ fold: index + 1, brier: entry.brier, accuracy: entry.accuracy })),
    calibration: {
      logistic: logisticCalibration,
      isotonic: isotonicCalibration,
      curve: calibrationCurve
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
