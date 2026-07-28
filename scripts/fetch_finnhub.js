(async () => {
  const key = process.env.FINNHUB_API_KEY;
  if (!key) {
    console.error('FINNHUB_API_KEY not set');
    process.exit(2);
  }

  const symbols = ['QQQ', 'SPY', 'QQQM', 'NVDA', 'AAPL'];
  const now = Math.floor(Date.now() / 1000);
  const from = now - 60 * 60 * 24 * 5; // 5 days

  async function fetchJson(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
    return res.json();
  }

  for (const s of symbols) {
    try {
      const qUrl = 'https://finnhub.io/api/v1/quote?symbol=' + encodeURIComponent(s) + '&token=' + encodeURIComponent(key);
      const cUrl = 'https://finnhub.io/api/v1/stock/candle?symbol=' + encodeURIComponent(s) + '&resolution=5&from=' + from + '&to=' + now + '&token=' + encodeURIComponent(key);
      const q = await fetchJson(qUrl);
      const candle = await fetchJson(cUrl);
      const current = Number(q.c || 0);
      const prevClose = Number(q.pc || 0);
      const dayOpen = (candle.o && candle.o[0]) ? Number(candle.o[0]) : current;
      const lastClose = (candle.c && candle.c.length) ? Number(candle.c[candle.c.length - 1]) : current;
      const dayMovePct = dayOpen ? ((lastClose - dayOpen) / dayOpen * 100) : 0;
      console.log(`${s}: price=${current.toFixed(2)}, prevClose=${prevClose.toFixed(2)}, dayMovePct=${dayMovePct.toFixed(2)}%, candles=${JSON.stringify((candle.c||[]).slice(-6))}`);
    } catch (err) {
      console.error('ERR', s, err.message || err);
    }
  }
})();
