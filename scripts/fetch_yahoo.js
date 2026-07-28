(async () => {
  const symbols = [
    'QQQ','SPY','QQQM','NVDA','AAPL','MSFT','AMD','META','TSLA','AMZN',
    'AVGO','GOOGL','ADBE','COST','PLTR','SMCI','NFLX','CRM','INTC','PYPL',
    'PDD','CSCO','ORCL','IBM','UBER','SHOP','SNOW','ARM','V','MA',
    'HD','WMT','JPM','BAC','C','GS','MS','AXP','DIS','CMCSA'
  ];
  const fs = require('fs').promises;
  const path = require('path');

  const fetchJson = async (url) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
    return res.json();
  };

  const now = Math.floor(Date.now() / 1000);
  const from = now - 60 * 60 * 24 * 5; // 5 days ago
  const outDir = path.resolve(__dirname, '..', 'data');
  await fs.mkdir(outDir, { recursive: true });

  // We'll persist two snapshots per symbol:
  //  - intraday: range=1d & interval=5m
  //  - daily history: range=5d & interval=1d
  const jobs = [
    { range: '1d', interval: '5m', suffix: 'intraday_1d_5m' },
    { range: '5d', interval: '1d', suffix: 'daily_5d_1d' }
  ];

  for (const s of symbols) {
    for (const job of jobs) {
      try {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(s)}?interval=${job.interval}&range=${job.range}`;
        const data = await fetchJson(url);
        const result = data.chart && data.chart.result && data.chart.result[0];
        if (!result) {
          console.log(s + `: no data for ${job.range}@${job.interval}`);
          continue;
        }

        const outPath = path.join(outDir, `${s}_snapshot_${job.suffix}.json`);
        await fs.writeFile(outPath, JSON.stringify({ fetchedAt: new Date().toISOString(), url, result }, null, 2));
        const closes = result.indicators?.quote?.[0]?.close || [];
        const opens = result.indicators?.quote?.[0]?.open || [];
        const lastClose = closes.length ? closes[closes.length - 1] : null;
        const firstOpen = opens.length ? opens[0] : null;
        const dayMovePct = (firstOpen && lastClose) ? ((lastClose - firstOpen) / firstOpen * 100) : 0;
        console.log(`${s}: saved ${outPath} — lastClose=${lastClose?.toFixed(2)||'n/a'}, firstOpen=${firstOpen?.toFixed(2)||'n/a'}, dayMovePct=${dayMovePct.toFixed(2)}%, points=${closes.length}`);
      } catch (err) {
        console.error('ERR', s, job.range, job.interval, err.message || err);
      }
      // small delay to be polite
      await new Promise((r) => setTimeout(r, 150));
    }
  }
})();
