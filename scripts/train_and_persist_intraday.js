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
      // Build a minimal item object compatible with labelIntradayOutcome
      const meta = result.meta || {};
      const indicators = result.indicators || {};
      const quote = indicators.quote && indicators.quote[0] ? indicators.quote[0] : {};
      const closes = quote.close || [];
      const highs = quote.high || [];
      const lows = quote.low || [];
      const volumes = Array.isArray(quote.volume) ? quote.volume.filter((value) => value != null).map(Number) : [];
      const currentVolume = volumes.length ? volumes[volumes.length - 1] || volumes.slice().reverse().find((value) => value > 0) || 0 : 0;
      const item = {
        symbol: fname.split('_')[0],
        name: fname.split('_')[0],
        closeHistory: closes,
        highHistory: highs,
        lowHistory: lows,
        currentPrice: closes.length ? closes[closes.length-1] : 0,
        dayMovePct: (closes.length && closes[0]) ? ((closes[closes.length-1] - closes[0]) / closes[0]) * 100 : 0,
        openPrice: closes[0] || 0,
        prevClose: closes[0] || 0,
        preMarketMovePct: 0,
        volumeHistory: volumes,
        volume: currentVolume
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
    const label = labelIntradayOutcome(example.item, 1.0, { targetMovePct: 1.0, minVolumeRatio: 0.8, futureLookaheadBars: 2 }) ? 1 : 0;
    return { item: example.item, features, label, news: example.news || [] };
  });

  console.log('Training intraday model with', formattedExamples.length, 'examples');
  const model = trainIntradayModel(formattedExamples, 1.0, 500, 0.01);
  const outPath = path.join(outDir, 'intraday_model.json');
  await fs.writeFile(outPath, JSON.stringify({ trainedAt: new Date().toISOString(), model }, null, 2));
  console.log('Saved intraday model to', outPath);
})();
