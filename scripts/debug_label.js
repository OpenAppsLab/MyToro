const fs = require('fs');
const path = require('path');
const { labelIntradayOutcome } = require('../server');

const DATA_DIR = path.resolve(__dirname, '..', 'data');
const files = fs.readdirSync(DATA_DIR).filter((name) => name.endsWith('_snapshot_intraday_1d_5m.json')).sort();
for (let idx = 0; idx < Math.min(10, files.length); idx += 1) {
  const file = files[idx];
  const raw = fs.readFileSync(path.join(DATA_DIR, file), 'utf8');
  const json = JSON.parse(raw);
  const result = json.result || json;
  const quote = (result.indicators || {}).quote && (result.indicators || {}).quote[0] ? (result.indicators || {}).quote[0] : {};
  const closes = Array.isArray(quote.close) ? quote.close.filter((v) => v != null) : [];
  const opens = Array.isArray(quote.open) ? quote.open.filter((v) => v != null) : [];
  const volumes = Array.isArray(quote.volume) ? quote.volume.filter((v) => v != null) : [];
  const item = {
    symbol: file.split('_')[0],
    closeHistory: closes,
    highHistory: Array.isArray(quote.high) ? quote.high.filter((v) => v != null) : [],
    lowHistory: Array.isArray(quote.low) ? quote.low.filter((v) => v != null) : [],
    currentPrice: closes[closes.length - 1] || 0,
    dayMovePct: opens.length ? ((closes[closes.length - 1] - opens[0]) / opens[0]) * 100 : 0,
    openPrice: opens[0] || 0,
    prevClose: closes[0] || 0,
    preMarketMovePct: 0,
    volumeHistory: volumes,
    volume: volumes.length ? volumes[volumes.length - 1] : 0
  };
  const targetMovePct = 0.5;
  const label = labelIntradayOutcome(item, targetMovePct, { targetMovePct, minVolumeRatio: 0.8 });
  const averageVolume = item.volumeHistory.length ? item.volumeHistory.reduce((sum, v) => sum + v, 0) / item.volumeHistory.length : item.volume;
  const volumeRatio = averageVolume > 0 ? item.volume / averageVolume : 1;
  console.log(JSON.stringify({ file, symbol: item.symbol, openPrice: item.openPrice, currentPrice: item.currentPrice, futureClose: closes[closes.length-1] || item.openPrice, futureMovePct: item.openPrice ? ((item.currentPrice - item.openPrice) / item.openPrice) * 100 : 0, targetMovePct, minVolumeRatio: 0.8, averageVolume, currentVolume: item.volume, volumeRatio, label, closeCount: closes.length, volumeCount: volumes.length }, null, 2));
}
