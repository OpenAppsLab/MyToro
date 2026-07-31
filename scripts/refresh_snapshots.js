const fs = require('fs').promises;
const path = require('path');
const { getCuratedSymbolSet } = require('./symbol_watchlist');

const symbols = getCuratedSymbolSet();

const outDir = path.resolve(__dirname, '..', 'data');
const jobs = [
  { range: '1d', interval: '5m', suffix: 'intraday_1d_5m' },
  { range: '5d', interval: '1d', suffix: 'daily_5d_1d' },
  { range: '2mo', interval: '1d', suffix: 'daily_2mo_1d' }
];

async function fetchJson(url, timeoutMs = 10000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) {
      throw new Error(`${res.status}: ${res.statusText}`);
    }
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

async function saveSnapshot(symbol, job) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${job.interval}&range=${job.range}`;
  const data = await fetchJson(url);
  const result = data.chart?.result?.[0];
  if (!result) {
    throw new Error('Missing chart result');
  }

  const outPath = path.join(outDir, `${symbol}_snapshot_${job.suffix}.json`);
  await fs.writeFile(outPath, JSON.stringify({ fetchedAt: new Date().toISOString(), url, result }, null, 2));

  const closes = result.indicators?.quote?.[0]?.close || [];
  const opens = result.indicators?.quote?.[0]?.open || [];
  const lastClose = closes.length ? closes[closes.length - 1] : null;
  const firstOpen = opens.length ? opens[0] : null;
  const dayMovePct = (firstOpen && lastClose) ? ((lastClose - firstOpen) / firstOpen * 100) : 0;
  console.log(`${symbol} ${job.suffix}: saved ${outPath} — values=${closes.length}, lastClose=${lastClose?.toFixed(2) || 'n/a'}, movePct=${dayMovePct.toFixed(2)}%`);
}

async function run() {
  await fs.mkdir(outDir, { recursive: true });

  for (const symbol of symbols) {
    for (const job of jobs) {
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
