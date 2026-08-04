const fs = require('fs').promises;
const path = require('path');
const { getCuratedSymbolSet } = require('./symbol_watchlist');

const symbols = getCuratedSymbolSet();

const outDir = path.resolve(__dirname, '..', 'data');
const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';
const jobs = [
  { range: '1d', interval: '5m', suffix: 'intraday_1d_5m' },
  { range: '5d', interval: '1d', suffix: 'daily_5d_1d' },
  { range: '2mo', interval: '1d', suffix: 'daily_2mo_1d' }
];

const args = process.argv.slice(2);
const intradayOnly = args.includes('--intraday-only');
const symbolsArg = args.find((arg) => arg.startsWith('--symbols='));
const limitArg = args.find((arg) => arg.startsWith('--limit='));
const selectedJobs = intradayOnly ? jobs.filter((job) => job.suffix === 'intraday_1d_5m') : jobs;
const selectedSymbols = symbolsArg ? String(symbolsArg.split('=')[1] || '').split(',').map((symbol) => symbol.trim()).filter(Boolean) : null;
const limit = limitArg ? Number(limitArg.split('=')[1]) : null;
const executionSymbols = selectedSymbols || (Number.isFinite(limit) && limit > 0 ? symbols.slice(0, limit) : symbols);

async function fetchJson(url, timeoutMs = 10000, headers = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal, headers });
    if (!res.ok) {
      throw new Error(`${res.status}: ${res.statusText}`);
    }
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

async function fetchYahooSnapshot(symbol, job) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${job.interval}&range=${job.range}`;
  const data = await fetchJson(url);
  const result = data.chart?.result?.[0];
  if (!result) {
    throw new Error('Missing Yahoo chart result');
  }
  return { provider: 'Yahoo', url, result };
}

async function fetchFinnhubSnapshot(symbol, job) {
  if (!FINNHUB_API_KEY) {
    throw new Error('FINNHUB_API_KEY is not configured.');
  }

  const now = Math.floor(Date.now() / 1000);
  let from;
  let resolution;

  if (job.interval === '5m' && job.range === '1d') {
    from = now - 60 * 60 * 24;
    resolution = '5';
  } else if (job.interval === '1d' && job.range === '5d') {
    from = now - 5 * 24 * 60 * 60;
    resolution = 'D';
  } else if (job.interval === '1d' && job.range === '2mo') {
    from = now - 60 * 24 * 60 * 60;
    resolution = 'D';
  } else {
    throw new Error(`Finnhub fallback only supports intraday 1d/5m and daily 5d/1d or 2mo/1d snapshots.`);
  }

  const url = `${FINNHUB_BASE_URL}/stock/candle?symbol=${encodeURIComponent(symbol)}&resolution=${resolution}&from=${from}&to=${now}&token=${encodeURIComponent(FINNHUB_API_KEY)}`;
  const data = await fetchJson(url);
  if (data.s !== 'ok') {
    throw new Error(`Finnhub candle response status: ${data.s}`);
  }

  const result = {
    timestamp: Array.isArray(data.t) ? data.t : [],
    indicators: {
      quote: [{
        open: Array.isArray(data.o) ? data.o : [],
        high: Array.isArray(data.h) ? data.h : [],
        low: Array.isArray(data.l) ? data.l : [],
        close: Array.isArray(data.c) ? data.c : [],
        volume: Array.isArray(data.v) ? data.v : []
      }]
    }
  };

  return { provider: 'Finnhub', url, result };
}

function normalizeNumericArray(array) {
  return Array.isArray(array)
    ? array.map((value) => Number(value)).filter((value) => Number.isFinite(value))
    : [];
}

function computeIntradayDerivedMetrics(result) {
  const quote = result.indicators?.quote?.[0] || {};
  const timestamps = Array.isArray(result.timestamp)
    ? result.timestamp.map((value) => Number(value)).filter((value) => Number.isFinite(value))
    : [];
  const closes = normalizeNumericArray(quote.close);
  const opens = normalizeNumericArray(quote.open);
  const highs = normalizeNumericArray(quote.high);
  const lows = normalizeNumericArray(quote.low);
  const volumes = normalizeNumericArray(quote.volume);

  const currentPrice = closes.length ? closes[closes.length - 1] : 0;
  const firstOpen = opens.length ? opens[0] : currentPrice;
  const prevClose = closes.length > 1 ? closes[closes.length - 2] : closes[0] || currentPrice;
  const dayMovePct = firstOpen ? ((currentPrice - firstOpen) / firstOpen) * 100 : 0;
  const gapPct = prevClose ? ((firstOpen - prevClose) / prevClose) * 100 : 0;
  const averageVolume = volumes.length ? volumes.reduce((sum, value) => sum + value, 0) / volumes.length : 0;
  const currentVolume = volumes.length ? volumes[volumes.length - 1] : 0;
  const volumeSpikeRatio = averageVolume > 0 ? currentVolume / averageVolume : 1;

  const firstHourBars = Math.min(12, closes.length);
  const morningHigh = highs.slice(0, firstHourBars).length ? Math.max(...highs.slice(0, firstHourBars)) : currentPrice;
  const morningLow = lows.slice(0, firstHourBars).length ? Math.min(...lows.slice(0, firstHourBars)) : currentPrice;
  const morningRangePct = morningLow > 0 ? ((morningHigh - morningLow) / morningLow) * 100 : 0;
  const aboveMorningRange = currentPrice > morningHigh;

  const intradayReturns = closes.length >= 2
    ? closes.slice(1).map((close, idx) => ((close - closes[idx]) / Math.max(1e-6, closes[idx])) * 100)
    : [];
  const averageIntradayReturn = intradayReturns.length
    ? intradayReturns.reduce((sum, value) => sum + value, 0) / intradayReturns.length
    : 0;
  const intradayVolatility = intradayReturns.length
    ? Math.sqrt(intradayReturns.reduce((sum, value) => sum + (value - averageIntradayReturn) ** 2, 0) / intradayReturns.length)
    : 0;

  const openTimestamp = timestamps.length ? timestamps[0] * 1000 : null;
  const lastTimestamp = timestamps.length ? timestamps[timestamps.length - 1] * 1000 : null;
  const minutesSinceOpen = openTimestamp && lastTimestamp
    ? Math.max(0, Math.round((lastTimestamp - openTimestamp) / 60000))
    : null;

  return {
    currentPrice,
    prevClose,
    firstOpen,
    dayMovePct,
    gapPct,
    currentVolume,
    averageVolume,
    volumeSpikeRatio,
    morningHigh,
    morningLow,
    morningRangePct,
    aboveMorningRange,
    averageIntradayReturn,
    intradayVolatility,
    minutesSinceOpen,
    timestampsCount: timestamps.length
  };
}

async function saveSnapshot(symbol, job) {
  let snapshot;
  let error = null;

  try {
    snapshot = await fetchYahooSnapshot(symbol, job);
  } catch (primaryError) {
    error = primaryError;
    if (job.suffix === 'intraday_1d_5m') {
      try {
        snapshot = await fetchFinnhubSnapshot(symbol, job);
      } catch (fallbackError) {
        throw new Error(`Yahoo failed: ${primaryError.message}; Finnhub fallback failed: ${fallbackError.message}`);
      }
    } else {
      throw primaryError;
    }
  }

  const outPath = path.join(outDir, `${symbol}_snapshot_${job.suffix}.json`);
  const derivedMetrics = computeIntradayDerivedMetrics(snapshot.result);
  const payload = {
    symbol,
    range: job.range,
    interval: job.interval,
    source: snapshot.provider,
    sourceUrl: snapshot.url,
    fetchedAt: new Date().toISOString(),
    derivedMetrics,
    result: snapshot.result
  };
  await fs.writeFile(outPath, JSON.stringify(payload, null, 2));

  const lastClose = derivedMetrics.currentPrice;
  const firstOpen = derivedMetrics.firstOpen;
  const dayMovePct = derivedMetrics.dayMovePct;
  console.log(`${symbol} ${job.suffix}: saved ${outPath} — provider=${snapshot.provider}, values=${derivedMetrics.timestampsCount}, currentPrice=${lastClose?.toFixed(2) || 'n/a'}, dayMovePct=${dayMovePct.toFixed(2)}%, volumeSpike=${derivedMetrics.volumeSpikeRatio.toFixed(2)}`);
}

async function run() {
  await fs.mkdir(outDir, { recursive: true });

  for (const symbol of executionSymbols) {
    for (const job of selectedJobs) {
      try {
        await saveSnapshot(symbol, job);
      } catch (error) {
        console.error(`Failed ${symbol} ${job.suffix}: ${error.message || error}`);
      }
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }
}

run().catch((err) => {
  console.error('Snapshot producer failed:', err);
  process.exit(1);
});
