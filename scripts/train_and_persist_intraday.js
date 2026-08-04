(async () => {
  const fs = require('fs').promises;
  const path = require('path');
  const { trainIntradayModel, buildAdvancedSignals, buildIntradayFeatureVector, buildMarketFeatureStats, labelIntradayOutcome } = require('../server');

  const dataDir = path.resolve(__dirname, '..', 'data');
  const outDir = path.resolve(__dirname, '..', 'models');
  await fs.mkdir(outDir, { recursive: true });

  // Read daily intraday snapshots and convert into training examples
  const files = await fs.readdir(dataDir);
  const intradayFiles = files.filter(f => f.endsWith('_snapshot_intraday_1d_5m.json'));
  if (!intradayFiles.length) {
    console.error('No intraday snapshots found in', dataDir);
    process.exit(2);
  }

  const examples = [];
  const items = [];
  for (const fname of intradayFiles) {
    try {
      const raw = await fs.readFile(path.join(dataDir, fname), 'utf8');
      const json = JSON.parse(raw);
      const result = json.result || json;
      const derived = json.derivedMetrics || {};
      const indicators = result.indicators || {};
      const quote = indicators.quote && indicators.quote[0] ? indicators.quote[0] : {};
      const closes = Array.isArray(quote.close) ? quote.close.map((value) => Number(value)).filter((value) => Number.isFinite(value)) : [];
      const highs = Array.isArray(quote.high) ? quote.high.map((value) => Number(value)).filter((value) => Number.isFinite(value)) : [];
      const lows = Array.isArray(quote.low) ? quote.low.map((value) => Number(value)).filter((value) => Number.isFinite(value)) : [];
      const volumes = Array.isArray(quote.volume) ? quote.volume.map((value) => Number(value)).filter((value) => Number.isFinite(value)) : [];
      const currentVolume = Number(derived.currentVolume ?? (volumes.length ? volumes[volumes.length - 1] || volumes.slice().reverse().find((value) => value > 0) || 0 : 0));
      const currentPrice = Number(derived.currentPrice ?? (closes.length ? closes[closes.length - 1] : 0));
      const openPrice = Number(derived.firstOpen ?? (closes[0] || currentPrice));
      const prevClose = Number(derived.prevClose ?? (closes.length > 1 ? closes[closes.length - 2] : closes[0] || currentPrice));
      const dayMovePct = Number(derived.dayMovePct ?? (openPrice ? ((currentPrice - openPrice) / openPrice) * 100 : 0));
      const item = {
        symbol: fname.split('_')[0],
        name: fname.split('_')[0],
        closeHistory: closes,
        highHistory: highs,
        lowHistory: lows,
        currentPrice,
        dayMovePct,
        openPrice,
        prevClose,
        preMarketMovePct: Number(derived.preMarketMovePct ?? 0),
        volumeHistory: volumes,
        volume: currentVolume,
        derivedMetrics: derived,
        volumeSpikeRatio: Number(derived.volumeSpikeRatio ?? 0),
        intradayVolatility: Number(derived.intradayVolatility ?? 0),
        minutesSinceOpen: derived.minutesSinceOpen,
        morningRangePct: Number(derived.morningRangePct ?? 0),
        aboveMorningRange: Boolean(derived.aboveMorningRange)
      };

      items.push(item);
      examples.push({ item, news: [] });
    } catch (err) {
      console.error('Failed to parse', fname, err && err.message);
    }
  }

  const marketStats = buildMarketFeatureStats(items);
  const formattedExamples = examples.map((example) => {
    const adv = buildAdvancedSignals(example.item, example.news || [], { marketStats });
    const features = buildIntradayFeatureVector(example.item, adv, { marketStats });
    const label = labelIntradayOutcome(example.item, 1.5, { targetMovePct: 1.5, minVolumeRatio: 0.9, futureLookaheadBars: 2 }) ? 1 : 0;
    return { item: example.item, features, label, news: example.news || [] };
  });

  const exampleCount = formattedExamples.length;
  const positiveCount = formattedExamples.filter((ex) => ex.label === 1).length;
  const positiveRate = exampleCount ? (positiveCount / exampleCount) : 0;
  console.log(`Training intraday model with ${exampleCount} examples (${positiveCount} positive labels, ${Math.round(positiveRate * 100)}% positive)`);
  const model = trainIntradayModel(formattedExamples, 1.5, 500, 0.01);
  const outPath = path.join(outDir, 'intraday_model.json');
  await fs.writeFile(outPath, JSON.stringify({ trainedAt: new Date().toISOString(), model }, null, 2));
  console.log('Saved intraday model to', outPath);
})();
