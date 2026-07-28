(async () => {
  const fs = require('fs').promises;
  const path = require('path');
  const { trainIntradayModel } = require('../server');

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
        preMarketMovePct: 0
      };

      // Build advancedSignals by calling into server.js functionality is complex; use simple feature mapping
      const features = {
        premarketMove: Number(item.preMarketMovePct || 0) / 10,
        openingGap: item.openPrice && item.prevClose ? ((Number(item.openPrice) - Number(item.prevClose)) / Number(item.prevClose)) : 0,
        firstHourMove: 0,
        volumeZ: 0,
        sentiment: 0.5,
        patternStrength: 0,
        sectorStrength: 0.5,
        atrPct: 0,
        liquidity: 1
      };

      examples.push({ item, features });
    } catch (err) {
      console.error('Failed to parse', fname, err && err.message);
    }
  }

  console.log('Training intraday model with', examples.length, 'examples');
  const model = trainIntradayModel(examples, 2.5, 300, 0.02);
  const outPath = path.join(outDir, 'intraday_model.json');
  await fs.writeFile(outPath, JSON.stringify({ trainedAt: new Date().toISOString(), model }, null, 2));
  console.log('Saved intraday model to', outPath);
})();
