const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

app.use(express.static(PUBLIC_DIR));
app.use(express.json());

const MARKET_SYMBOLS = [
  { symbol: 'QQQ', name: 'Nasdaq 100 ETF', region: 'NASDAQ' },
  { symbol: 'SPY', name: 'S&P 500 ETF', region: 'NASDAQ' },
  { symbol: 'QQQM', name: 'Invesco NASDAQ 100 ETF', region: 'NASDAQ' },
  { symbol: 'NVDA', name: 'NVIDIA', region: 'NASDAQ' },
  { symbol: 'AAPL', name: 'Apple', region: 'NASDAQ' },
  { symbol: 'MSFT', name: 'Microsoft', region: 'NASDAQ' },
  { symbol: 'AMD', name: 'Advanced Micro Devices', region: 'NASDAQ' },
  { symbol: 'META', name: 'Meta Platforms', region: 'NASDAQ' },
  { symbol: 'TSLA', name: 'Tesla', region: 'NASDAQ' },
  { symbol: 'AMZN', name: 'Amazon', region: 'NASDAQ' },
  { symbol: 'AVGO', name: 'Broadcom', region: 'NASDAQ' },
  { symbol: 'GOOGL', name: 'Alphabet', region: 'NASDAQ' },
  { symbol: 'ADBE', name: 'Adobe', region: 'NASDAQ' },
  { symbol: 'COST', name: 'Costco', region: 'NASDAQ' },
  { symbol: 'PLTR', name: 'Palantir', region: 'NASDAQ' },
  { symbol: 'SMCI', name: 'Super Micro Computer', region: 'NASDAQ' },
  { symbol: 'NFLX', name: 'Netflix', region: 'NASDAQ' },
  { symbol: 'CRM', name: 'Salesforce', region: 'NASDAQ' },
  { symbol: 'INTC', name: 'Intel', region: 'NASDAQ' },
  { symbol: 'PYPL', name: 'PayPal', region: 'NASDAQ' },
  { symbol: 'PDD', name: 'PDD Holdings', region: 'NASDAQ' },
  { symbol: 'CSCO', name: 'Cisco', region: 'NASDAQ' },
  { symbol: 'ORCL', name: 'Oracle', region: 'NASDAQ' },
  { symbol: 'IBM', name: 'IBM', region: 'NASDAQ' },
  { symbol: 'UBER', name: 'Uber', region: 'NASDAQ' },
  { symbol: 'SHOP', name: 'Shopify', region: 'NASDAQ' },
  { symbol: 'SNOW', name: 'Snowflake', region: 'NASDAQ' },
  { symbol: 'ARM', name: 'Arm Holdings', region: 'NASDAQ' },
  { symbol: 'V', name: 'Visa', region: 'NASDAQ' },
  { symbol: 'MA', name: 'Mastercard', region: 'NASDAQ' },
  { symbol: 'HD', name: 'Home Depot', region: 'NASDAQ' },
  { symbol: 'WMT', name: 'Walmart', region: 'NASDAQ' },
  { symbol: 'JPM', name: 'JPMorgan Chase', region: 'NASDAQ' },
  { symbol: 'BAC', name: 'Bank of America', region: 'NASDAQ' },
  { symbol: 'C', name: 'Citigroup', region: 'NASDAQ' },
  { symbol: 'GS', name: 'Goldman Sachs', region: 'NASDAQ' },
  { symbol: 'MS', name: 'Morgan Stanley', region: 'NASDAQ' },
  { symbol: 'AXP', name: 'American Express', region: 'NASDAQ' },
  { symbol: 'DIS', name: 'Disney', region: 'NASDAQ' },
  { symbol: 'CMCSA', name: 'Comcast', region: 'NASDAQ' },
  { symbol: 'T', name: 'AT&T', region: 'NASDAQ' },
  { symbol: 'VZ', name: 'Verizon', region: 'NASDAQ' },
  { symbol: 'CVX', name: 'Chevron', region: 'NASDAQ' },
  { symbol: 'XOM', name: 'Exxon Mobil', region: 'NASDAQ' },
  { symbol: 'CAT', name: 'Caterpillar', region: 'NASDAQ' },
  { symbol: 'HON', name: 'Honeywell', region: 'NASDAQ' },
  { symbol: 'UPS', name: 'United Parcel Service', region: 'NASDAQ' },
  { symbol: 'FDX', name: 'FedEx', region: 'NASDAQ' },
  { symbol: 'DOW', name: 'Dow', region: 'NASDAQ' },
  { symbol: 'NKE', name: 'Nike', region: 'NASDAQ' },
  { symbol: 'MCD', name: 'McDonald\'s', region: 'NASDAQ' },
  { symbol: 'KO', name: 'Coca-Cola', region: 'NASDAQ' },
  { symbol: 'PG', name: 'Procter & Gamble', region: 'NASDAQ' },
  { symbol: 'PEP', name: 'PepsiCo', region: 'NASDAQ' },
  { symbol: 'LLY', name: 'Eli Lilly', region: 'NASDAQ' },
  { symbol: 'PFE', name: 'Pfizer', region: 'NASDAQ' },
  { symbol: 'MRK', name: 'Merck', region: 'NASDAQ' },
  { symbol: 'UNH', name: 'UnitedHealth', region: 'NASDAQ' },
  { symbol: 'ABBV', name: 'AbbVie', region: 'NASDAQ' },
  { symbol: 'CME', name: 'CME Group', region: 'NASDAQ' },
  { symbol: 'TDG', name: 'TransDigm', region: 'NASDAQ' },
  { symbol: 'FIS', name: 'Fidelity National Information Services', region: 'NASDAQ' },
  { symbol: 'MU', name: 'Micron', region: 'NASDAQ' },
  { symbol: 'QCOM', name: 'Qualcomm', region: 'NASDAQ' },
  { symbol: 'TXN', name: 'Texas Instruments', region: 'NASDAQ' },
  { symbol: 'LRCX', name: 'Lam Research', region: 'NASDAQ' },
  { symbol: 'ON', name: 'ON Semiconductor', region: 'NASDAQ' },
  { symbol: 'ADI', name: 'Analog Devices', region: 'NASDAQ' },
  { symbol: 'KLAC', name: 'KLA', region: 'NASDAQ' },
  { symbol: 'MCHP', name: 'Microchip', region: 'NASDAQ' },
  { symbol: 'PM', name: 'Philip Morris', region: 'NASDAQ' },
  { symbol: 'LULU', name: 'Lululemon', region: 'NASDAQ' },
  { symbol: 'RCL', name: 'Royal Caribbean', region: 'NASDAQ' },
  { symbol: 'NCLH', name: 'Norwegian Cruise Line', region: 'NASDAQ' },
  { symbol: 'BKNG', name: 'Booking Holdings', region: 'NASDAQ' },
  { symbol: 'ABNB', name: 'Airbnb', region: 'NASDAQ' },
  { symbol: 'ETSY', name: 'Etsy', region: 'NASDAQ' },
  { symbol: 'PINS', name: 'Pinterest', region: 'NASDAQ' },
  { symbol: 'ROKU', name: 'Roku', region: 'NASDAQ' },
  { symbol: 'DUK', name: 'Duke Energy', region: 'NASDAQ' },
  { symbol: 'SO', name: 'Southern Company', region: 'NASDAQ' },
  { symbol: 'AEP', name: 'American Electric Power', region: 'NASDAQ' },
  { symbol: 'PCG', name: 'PG&E', region: 'NASDAQ' },
  { symbol: 'REGN', name: 'Regeneron', region: 'NASDAQ' },
  { symbol: 'VRTX', name: 'Vertex', region: 'NASDAQ' },
  { symbol: 'BMY', name: 'Bristol Myers', region: 'NASDAQ' },
  { symbol: 'GILD', name: 'Gilead', region: 'NASDAQ' },
  { symbol: 'BLK', name: 'BlackRock', region: 'NASDAQ' },
  { symbol: 'SCHW', name: 'Charles Schwab', region: 'NASDAQ' },
  { symbol: 'SPGI', name: 'S&P Global', region: 'NASDAQ' },
  { symbol: 'NDAQ', name: 'Nasdaq', region: 'NASDAQ' },
  { symbol: 'RNG', name: 'RingCentral', region: 'NASDAQ' },
  { symbol: 'AZO', name: 'AutoZone', region: 'NASDAQ' },
  { symbol: 'CVS', name: 'CVS Health', region: 'NASDAQ' },
  { symbol: 'UNP', name: 'Union Pacific', region: 'NASDAQ' },
  { symbol: 'RTX', name: 'RTX', region: 'NASDAQ' },
  { symbol: 'AIG', name: 'American International Group', region: 'NASDAQ' },
  { symbol: 'BRK-B', name: 'Berkshire Hathaway', region: 'NASDAQ' },
  { symbol: 'CRWD', name: 'CrowdStrike', region: 'NASDAQ' },
  { symbol: 'MRVL', name: 'Marvell', region: 'NASDAQ' }
];

const MARKET_CACHE_TTL_MS = 15000;
const NEWS_CACHE_TTL_MS = 30000;
const YESTERDAY_CACHE_TTL_MS = 60000;
const ORDER_MONITOR_INTERVAL_MS = 15 * 60 * 1000;
const AUTO_ORDER_POLL_MS = 60 * 1000;
const DEFAULT_STOP_LOSS_USD = 15;
const DAILY_TARGET_PROFIT = 100;
const DAILY_MAX_LOSS = 1000;
const MIN_ORDER_PROFIT = 30;
const AUTO_ORDER_STOP_LOSS = 30;

let marketCache = { expiresAt: 0, data: [] };
let newsCache = { expiresAt: 0, data: [] };
let yesterdayCache = { expiresAt: 0, data: [] };
const pendingOrders = [];

const autoOrderState = {
  dateKey: '',
  lastOrderPlacedAt: null,
  orderCount: 0
};

const AUTO_ORDER_SETTINGS = {
  leverage: 2,
  ballparkAmount: 3000,
  waitAfterOpenMs: 30 * 60 * 1000
};

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY || 'd9hiin9r01qhv00mf19gd9hiin9r01qhv00mf1a0';
const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';

function getNewYorkDateKey(date = new Date()) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
}

function getNewYorkNow() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }));
}

function getTodayMarketOpenMs() {
  const nyNow = getNewYorkNow();
  nyNow.setHours(9, 30, 0, 0);
  return nyNow.getTime();
}

function resetAutoOrderState(dateKey) {
  autoOrderState.dateKey = dateKey;
  autoOrderState.lastOrderPlacedAt = null;
  autoOrderState.orderCount = 0;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function computeTextMatchCount(item, news) {
  const symbolName = item.name.toLowerCase();
  return news.filter((entry) => {
    const text = `${entry.title} ${entry.description}`.toLowerCase();
    return text.includes(symbolName) || text.includes(item.symbol.toLowerCase()) || text.includes(item.region.toLowerCase());
  }).length;
}

function inferSectorProfile(item) {
  const haystack = `${item.name} ${item.symbol}`.toLowerCase();
  if (/(nvda|amd|intel|qualcomm|tsm|asml|arm|smci|mu|avgo|qcom|lam|mchp|adi|klac|txn|on)/.test(haystack)) {
    return { name: 'AI / semis', keywords: ['ai', 'chip', 'semiconductor', 'gpu', 'data center', 'demand', 'orders'] };
  }
  if (/(apple|microsoft|meta|amazon|google|adobe|salesforce|oracle|shopify|paypal|crm|intc|msft|aapl|amzn|googl|meta|adbe|shop|pypl)/.test(haystack)) {
    return { name: 'tech', keywords: ['cloud', 'software', 'ai', 'enterprise', 'earnings', 'growth'] };
  }
  if (/(tesla|ford|gm|rivn|f|hmc|nio|xpev)/.test(haystack)) {
    return { name: 'auto', keywords: ['ev', 'vehicle', 'delivery', 'manufacturing', 'production'] };
  }
  if (/(jpm|bac|gs|ms|c|wfc|gs|axp|v|ma|schw|blk)/.test(haystack)) {
    return { name: 'finance', keywords: ['bank', 'rates', 'credit', 'loan', 'capital'] };
  }
  return { name: 'general', keywords: ['earnings', 'guidance', 'growth', 'demand'] };
}

function scoreNewsSentiment(item, news) {
  const sectorProfile = inferSectorProfile(item);
  const relevantEntries = news.filter((entry) => {
    const text = `${entry.title} ${entry.description}`.toLowerCase();
    return text.includes(item.symbol.toLowerCase()) || sectorProfile.keywords.some((keyword) => text.includes(keyword));
  });

  if (!relevantEntries.length) {
    return 0;
  }

  let sentimentScore = 0;
  relevantEntries.forEach((entry) => {
    const text = `${entry.title} ${entry.description}`.toLowerCase();
    const positiveHits = (text.match(/surge|strong|beat|raise|boost|upbeat|demand|accelerat|growth|rally|buy|upgrade|bull|gains|expansion/i) || []).length;
    const negativeHits = (text.match(/fall|weak|miss|cut|warn|slump|risk|concern|down|selloff|slow|pressure|decline|bear/i) || []).length;
    const weight = 1 + Math.min(4, positiveHits + negativeHits);
    sentimentScore += (positiveHits - negativeHits) * weight;
  });

  return clamp(sentimentScore * 5, -20, 20);
}

function buildAdvancedSignals(item, news, context = {}) {
  const currentPrice = Number(item.currentPrice || 0);
  const dayMovePct = Number(item.dayMovePct || 0);
  const volume = Number(item.volume || 0);
  const volumeHistory = Array.isArray(item.volumeHistory) ? item.volumeHistory.filter(Boolean) : [];
  const averageVolume = volumeHistory.length > 0
    ? volumeHistory.reduce((sum, value) => sum + Number(value || 0), 0) / volumeHistory.length
    : volume;
  const volumeRatio = averageVolume > 0 ? Math.min(6, volume / averageVolume) : 1;
  const unusualVolumeScore = clamp((volumeRatio - 1) * 25, 0, 30);

  const rangeHigh = Number(item.highPrice || currentPrice * 1.02 || 0);
  const rangeLow = Number(item.lowPrice || currentPrice * 0.98 || 0);
  const intradayRangePct = rangeHigh && rangeLow && currentPrice ? ((rangeHigh - rangeLow) / currentPrice) * 100 : 0;
  const optionsFlowScore = clamp(Math.min(30, dayMovePct * 3 + unusualVolumeScore * 0.4 + intradayRangePct * 1.5), 0, 30);

  const sectorSentimentScore = clamp(scoreNewsSentiment(item, news) + (computeTextMatchCount(item, news) * 2), -10, 25);

  const peerMoves = context.peerMoves || {};
  const targetPeer = context.peerTargets || ['NVDA', 'AMD'];
  const peerScores = targetPeer
    .map((peerSymbol) => Number(peerMoves[peerSymbol] || 0))
    .filter((value) => Number.isFinite(value));
  const peerAverageMove = peerScores.length ? peerScores.reduce((sum, value) => sum + value, 0) / peerScores.length : 0;
  const correlationScore = clamp((dayMovePct * 0.35) + (peerAverageMove * 0.35) + (Math.max(0, volumeRatio - 1) * 8), 0, 25);

  const squeezeScore = clamp(Math.max(0, dayMovePct * 2) + unusualVolumeScore * 0.45 + Math.max(0, (volumeRatio - 1) * 15), 0, 25);

  const premarketBlockScore = clamp(Math.max(0, dayMovePct * 1.4) + Math.max(0, unusualVolumeScore - 5) + (item.preMarketMovePct ? item.preMarketMovePct * 0.8 : 0), 0, 20);

  return {
    optionsFlowScore,
    volumeSignal: unusualVolumeScore,
    sectorSentimentScore,
    correlationScore,
    squeezeScore,
    premarketBlockScore,
    sector: inferSectorProfile(item).name,
    peerAverageMove,
    volumeRatio
  };
}

function buildLiveSignal(item, news, targetProfit, ballparkAmount, leverage, context = {}) {
  const currentPrice = Number(item.currentPrice || 0);
  const dayMovePct = Number(item.dayMovePct || 0);
  const positiveMove = Math.max(0, dayMovePct);
  const targetMovePct = ballparkAmount > 0 ? (targetProfit / ballparkAmount) * 100 : 0;
  const estimatedProfit = ballparkAmount > 0 ? (positiveMove / 100) * ballparkAmount : 0;
  const leverageProfit = estimatedProfit * leverage;
  const newsMentions = computeTextMatchCount(item, news);
  const advancedSignals = buildAdvancedSignals(item, news, context);

  const newsSignal = Math.min(20, newsMentions * 5 + Math.max(0, advancedSignals.sectorSentimentScore));
  const momentumSignal = Math.min(30, Math.max(0, positiveMove * 5));
  const volumeSignal = Math.min(25, Math.max(0, advancedSignals.volumeSignal));
  const optionsFlowSignal = Math.min(20, Math.max(0, advancedSignals.optionsFlowScore));
  const correlationSignal = Math.min(20, Math.max(0, advancedSignals.correlationScore));
  const squeezeSignal = Math.min(15, Math.max(0, advancedSignals.squeezeScore));
  const premarketBlockSignal = Math.min(10, Math.max(0, advancedSignals.premarketBlockScore));
  const targetAlignment = targetMovePct > 0 ? Math.max(0, 40 - Math.max(0, targetMovePct - positiveMove) * 2) : 20;
  const strength = Math.min(100, momentumSignal + volumeSignal + newsSignal + optionsFlowSignal + correlationSignal + squeezeSignal + premarketBlockSignal + targetAlignment);
  const viable = positiveMove >= targetMovePct && strength >= 50;
  const score = Math.min(100, strength + (viable ? 10 : 0));
  const signalType = dayMovePct >= 0 ? 'bullish' : 'bearish';

  return {
    symbol: item.symbol,
    name: item.name,
    region: item.region,
    currentPrice,
    changePct: item.changePct,
    dayMovePct,
    newsMentions,
    estimatedProfit,
    leverageProfit,
    score,
    confidence: strength,
    signalType,
    targetMovePct,
    viable,
    source: 'Yahoo Finance 5m + live market context',
    liveSignal: true,
    advancedSignals: {
      ...advancedSignals,
      optionsFlowSignal,
      correlationSignal,
      squeezeSignal,
      premarketBlockSignal,
      newsSignal
    }
  };
}

async function rankAutoOptions({ targetProfit, ballparkAmount, leverage }) {
  const [market, news] = await Promise.all([
    loadMarketSnapshot(),
    loadNewsSnapshot()
  ]);

  const peerMoves = market.reduce((accumulator, entry) => {
    accumulator[entry.symbol] = Number(entry.dayMovePct || 0);
    return accumulator;
  }, {});

  return market
    .map((item) => buildLiveSignal(item, news, targetProfit, ballparkAmount, leverage, { peerMoves, peerTargets: ['NVDA', 'AMD'] }))
    .filter((item) => Number.isFinite(item.currentPrice) && item.currentPrice > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

async function placeAutoOrder() {
  const cumulativePnl = getTodayRealizedPnl();
  const remainingTarget = DAILY_TARGET_PROFIT - cumulativePnl;
  const orderTarget = Math.max(MIN_ORDER_PROFIT, remainingTarget);

  const ranking = await rankAutoOptions({
    targetProfit: orderTarget,
    ballparkAmount: AUTO_ORDER_SETTINGS.ballparkAmount,
    leverage: AUTO_ORDER_SETTINGS.leverage
  });
  const topPick = ranking[0];
  if (!topPick) {
    return null;
  }

  const record = buildOrderRecord({
    symbol: topPick.symbol,
    name: topPick.name,
    entryPrice: Number(topPick.currentPrice || 0),
    targetProfit: orderTarget,
    ballparkAmount: AUTO_ORDER_SETTINGS.ballparkAmount,
    leverage: AUTO_ORDER_SETTINGS.leverage,
    stopLossAmount: AUTO_ORDER_STOP_LOSS,
    auto: true
  });

  pendingOrders.unshift(record);
  autoOrderState.orderCount += 1;
  autoOrderState.lastOrderPlacedAt = Date.now();

  console.log(`Auto order #${autoOrderState.orderCount} placed: ${record.symbol} @ ${record.entryPrice} target ${record.targetProfit}`);
  return record;
}

function canPlaceAutoOrder() {
  const cumulativePnl = getTodayRealizedPnl();
  if (cumulativePnl >= DAILY_TARGET_PROFIT) {
    return false;
  }
  if (cumulativePnl <= -DAILY_MAX_LOSS) {
    return false;
  }
  if (pendingOrders.some((order) => order.status === 'pending')) {
    return false;
  }
  return true;
}

async function refreshAutoOrders() {
  const todayKey = getNewYorkDateKey();
  if (autoOrderState.dateKey !== todayKey) {
    resetAutoOrderState(todayKey);
  }

  if (isAfterMarketClose()) {
    await forceClosePendingOrders();
    return;
  }

  if (!isNasdaqMarketOpen()) {
    return;
  }

  if (!canPlaceAutoOrder()) {
    return;
  }

  const now = Date.now();
  const firstOrderReady = autoOrderState.orderCount === 0 && now >= getTodayMarketOpenMs() + AUTO_ORDER_SETTINGS.waitAfterOpenMs;
  const subsequentOrderReady = autoOrderState.orderCount > 0 && !pendingOrders.some((order) => order.status === 'pending');

  if (firstOrderReady || subsequentOrderReady) {
    await placeAutoOrder();
  }
}


async function fetchJson(url, timeoutMs = 5000, headers = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal, headers });
    if (!response.ok) {
      throw new Error(`Request failed with ${response.status} for ${url}`);
    }
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

async function fetchFinnhubJson(path, params = {}, timeoutMs = 5000) {
  const query = new URLSearchParams({ token: FINNHUB_API_KEY, ...params });
  const url = `${FINNHUB_BASE_URL}${path}?${query.toString()}`;
  return fetchJson(url, timeoutMs, { Accept: 'application/json' });
}

function normalizeFinnhubNews(item) {
  return {
    title: item.headline || item.title || 'Finnhub headline',
    link: item.url || item.link || '',
    description: item.summary || item.content || item.source || ''
  };
}

function mapLimit(items, limit, worker) {
  const results = new Array(items.length);
  let nextIndex = 0;

  const workerPool = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex++;
      results[currentIndex] = await worker(items[currentIndex], currentIndex);
    }
  });

  return Promise.all(workerPool).then(() => results);
}

async function loadMarketSnapshot() {
  const now = Date.now();
  if (marketCache.expiresAt > now) {
    return marketCache.data;
  }

  const market = await mapLimit(MARKET_SYMBOLS, 8, async (item) => {
    try {
      const quote = await fetchFinnhubJson('/quote', { symbol: item.symbol }, 4500);
      const candle = await fetchFinnhubJson('/stock/candle', {
        symbol: item.symbol,
        resolution: '5',
        from: Math.floor((Date.now() - 30 * 60 * 1000) / 1000),
        to: Math.floor(Date.now() / 1000)
      }, 4500);

      const currentPrice = Number(quote.c || 0);
      const previousClose = Number(quote.pc || 0);
      const dayOpen = Number(candle.o?.[0] || quote.o || currentPrice || 0);
      const volume = Number(candle.v?.[candle.v.length - 1] || 0);
      const lastClose = Number(candle.c?.[candle.c.length - 2] || quote.pc || 0);
      const currentCandleClose = Number(candle.c?.[candle.c.length - 1] || currentPrice || 0);
      const changePct = previousClose ? ((currentPrice - previousClose) / previousClose) * 100 : 0;
      const dayMovePct = dayOpen ? ((currentCandleClose - dayOpen) / dayOpen) * 100 : 0;
      const closeHistory = Array.isArray(candle.c) ? candle.c.filter((value) => Number.isFinite(Number(value))) : [];
      const volumeHistory = Array.isArray(candle.v) ? candle.v.filter((value) => Number.isFinite(Number(value))) : [];

      return {
        ...item,
        currentPrice,
        changePct,
        dayMovePct,
        volume,
        closeHistory,
        volumeHistory,
        updatedAt: Date.now()
      };
    } catch (error) {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(item.symbol)}?interval=5m&range=1d`;
      const data = await fetchJson(url, 4500);
      const result = data.chart?.result?.[0];
      const timestamps = result?.timestamp || [];
      const quote = result?.indicators?.quote?.[0] || {};
      const closes = quote.close || [];
      const volumes = quote.volume || [];
      const open = quote.open || [];
      const lastClose = closes[closes.length - 2] || closes[0] || 0;
      const currentPrice = closes[closes.length - 1] || closes[0] || 0;
      const dayOpen = open[0] || currentPrice;
      const volume = volumes[volumes.length - 1] || 0;
      const changePct = lastClose ? ((currentPrice - lastClose) / lastClose) * 100 : 0;
      const dayMovePct = dayOpen ? ((currentPrice - dayOpen) / dayOpen) * 100 : 0;

      return {
        ...item,
        currentPrice,
        changePct,
        dayMovePct,
        volume,
        updatedAt: timestamps[timestamps.length - 1] || Date.now()
      };
    }
  });

  marketCache = {
    expiresAt: Date.now() + MARKET_CACHE_TTL_MS,
    data: market
  };

  return marketCache.data;
}

async function loadNewsSnapshot() {
  const now = Date.now();
  if (newsCache.expiresAt > now) {
    return newsCache.data;
  }

  const feeds = [
    'https://feeds.finance.yahoo.com/rss/2.0/headline?s=QQQ&region=US&lang=en-US',
    'https://feeds.finance.yahoo.com/rss/2.0/headline?s=SPY&region=US&lang=en-US',
    'https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en',
    'https://feeds.bbci.co.uk/news/world/rss.xml'
  ];

  const headlines = await Promise.all([
    (async () => {
      try {
        const newsItems = await fetchFinnhubJson('/news', { category: 'general' }, 4500);
        return Array.isArray(newsItems) ? newsItems.map(normalizeFinnhubNews) : [];
      } catch {
        return [];
      }
    })(),
    ...feeds.map(async (url) => {
      try {
        const response = await fetch(url, { signal: AbortSignal.timeout(4000) });
        if (!response.ok) {
          return [];
        }
        const xml = await response.text();
        return parseRss(xml);
      } catch {
        return [];
      }
    })
  ]);

  const combined = headlines.flat().slice(0, 30);
  newsCache = {
    expiresAt: Date.now() + NEWS_CACHE_TTL_MS,
    data: combined
  };

  return newsCache.data;
}

async function loadYesterdaySnapshot(deposit, leverage) {
  const now = Date.now();
  if (yesterdayCache.expiresAt > now && yesterdayCache.data?.length) {
    return yesterdayCache.data;
  }

  const market = await loadMarketSnapshot();
  const historyData = await mapLimit(MARKET_SYMBOLS, 8, async (item) => {
    const chartUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(item.symbol)}?interval=1d&range=5d`;
    const data = await fetchJson(chartUrl, 4500);
    const result = data.chart?.result?.[0];
    const closes = result?.indicators?.quote?.[0]?.close || [];

    if (closes.length < 3) {
      return null;
    }

    const previousCompletedClose = Number(closes[closes.length - 3] || 0);
    const yesterdayClose = Number(closes[closes.length - 2] || 0);

    if (!previousCompletedClose || !yesterdayClose) {
      return null;
    }

    const dayMovePct = ((yesterdayClose - previousCompletedClose) / previousCompletedClose) * 100;
    const estimatedProfit = deposit * (dayMovePct / 100);
    const leverageProfit = estimatedProfit * leverage;

    return {
      symbol: item.symbol,
      name: item.name,
      region: item.region,
      previousClose: previousCompletedClose,
      latestClose: yesterdayClose,
      movePct: dayMovePct,
      estimatedProfit,
      leverageProfit
    };
  });

  const positiveHistory = historyData
    .filter(Boolean)
    .filter((item) => item.movePct > 0)
    .sort((a, b) => b.movePct - a.movePct);

  const fallbackLive = market
    .map((item) => ({
      symbol: item.symbol,
      name: item.name,
      region: item.region,
      currentPrice: item.currentPrice,
      movePct: item.dayMovePct,
      estimatedProfit: deposit * ((item.dayMovePct || 0) / 100),
      leverageProfit: deposit * ((item.dayMovePct || 0) / 100) * leverage
    }))
    .filter((item) => Number.isFinite(item.currentPrice) && item.currentPrice > 0)
    .sort((a, b) => b.movePct - a.movePct);

  const results = positiveHistory.length >= 5
    ? positiveHistory.slice(0, 5)
    : [...positiveHistory, ...fallbackLive.filter((item) => !positiveHistory.some((entry) => entry.symbol === item.symbol))].slice(0, 5);

  yesterdayCache = {
    expiresAt: Date.now() + YESTERDAY_CACHE_TTL_MS,
    data: results
  };

  return yesterdayCache.data;
}

function buildOrderRecord(body) {
  const ballparkAmount = Number(body.ballparkAmount || 0);
  const targetProfit = Number(body.targetProfit || 0);
  const entryPrice = Number(body.entryPrice || 0);
  const leverage = Number(body.leverage || 2);

  const requestedStopLossPct = Number(body.stopLossPct);
  const requestedStopLossAmount = Number(body.stopLossAmount);
  let stopLossPct = Number.isFinite(requestedStopLossPct) ? requestedStopLossPct : null;
  let stopLossAmount = Number.isFinite(requestedStopLossAmount) && requestedStopLossAmount > 0
    ? requestedStopLossAmount
    : 0;

  if (ballparkAmount > 0) {
    if (!stopLossAmount && stopLossPct === null) {
      stopLossAmount = DEFAULT_STOP_LOSS_USD;
      stopLossPct = Number((stopLossAmount / ballparkAmount * 100).toFixed(2));
    } else if (!stopLossAmount) {
      stopLossAmount = Number((ballparkAmount * (stopLossPct / 100)).toFixed(2));
    } else {
      stopLossPct = Number((stopLossAmount / ballparkAmount * 100).toFixed(2));
    }
  }

  stopLossPct = Number(Math.max(0.1, Math.min(10.0, stopLossPct || 0)).toFixed(2));
  if (ballparkAmount > 0) {
    stopLossAmount = Number((ballparkAmount * (stopLossPct / 100)).toFixed(2));
  }

  if (!stopLossAmount) {
    stopLossAmount = DEFAULT_STOP_LOSS_USD;
  }

  const targetMovePct = ballparkAmount > 0 ? (targetProfit / ballparkAmount) * 100 : 0;
  const stopLossMovePct = stopLossPct;
  const stopLossPrice = entryPrice > 0 ? Number((entryPrice * (1 - stopLossPct / 100)).toFixed(4)) : 0;
  const targetPrice = entryPrice > 0 ? Number((entryPrice * (1 + targetMovePct / 100)).toFixed(4)) : 0;

  return {
    id: `ord-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    symbol: body.symbol,
    name: body.name,
    entryPrice,
    currentPrice: entryPrice,
    ballparkAmount,
    leverage,
    targetProfit,
    stopLossAmount,
    stopLossPct,
    stopLossMovePct,
    stopLossPrice,
    targetMovePct,
    targetPrice,
    status: 'pending',
    result: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    settledAt: null,
    timeToHitMs: null,
    currentMovePct: 0
  };
}

function getOrderDateKey(order) {
  return getNewYorkDateKey(new Date(order.createdAt));
}

function getRealizedOrderPnl(order) {
  if (order.status === 'pending') {
    return 0;
  }

  if (order.result === 'profit-hit') {
    return Number(order.targetProfit || 0);
  }

  if (order.result === 'loss-hit') {
    return -Number(order.stopLossAmount || 0);
  }

  const currentMovePct = Number(order.currentMovePct || 0);
  const realized = Number(order.ballparkAmount || 0) * (currentMovePct / 100) * Number(order.leverage || 1);
  return Number(realized.toFixed(2));
}

function getTodayRealizedPnl() {
  const todayKey = getNewYorkDateKey();
  return pendingOrders
    .filter((order) => order.status !== 'pending' && getOrderDateKey(order) === todayKey)
    .reduce((sum, order) => sum + getRealizedOrderPnl(order), 0);
}

function isAfterMarketClose() {
  const now = new Date();
  const nyParts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    weekday: 'short'
  }).formatToParts(now);

  const weekday = nyParts.find((part) => part.type === 'weekday')?.value;
  const hour = Number(nyParts.find((part) => part.type === 'hour')?.value || 0);
  const minute = Number(nyParts.find((part) => part.type === 'minute')?.value || 0);
  const totalMinutes = hour * 60 + minute;
  const marketClose = 16 * 60;

  return !['Sat', 'Sun'].includes(weekday) && totalMinutes >= marketClose;
}

async function settlePendingOrders() {
  if (!pendingOrders.length) {
    return;
  }

  let market;
  try {
    market = await loadMarketSnapshot();
  } catch (error) {
    console.warn('Unable to settle pending orders due to market snapshot error:', error.message || error);
    return;
  }

  if (!Array.isArray(market) || !market.length) {
    return;
  }

  const now = Date.now();

  pendingOrders.forEach((order) => {
    if (order.status !== 'pending') {
      return;
    }

    const matching = market.find((item) => item.symbol === order.symbol);
    if (!matching) {
      return;
    }

    const currentPrice = Number(matching.currentPrice || order.entryPrice);
    const currentMovePct = order.entryPrice
      ? ((currentPrice - order.entryPrice) / order.entryPrice) * 100
      : 0;

    order.currentPrice = currentPrice;
    order.currentMovePct = currentMovePct;
    order.updatedAt = now;

    const stopWasHit = currentMovePct <= -order.stopLossMovePct;
    const targetWasHit = currentMovePct >= order.targetMovePct;

    if (stopWasHit || targetWasHit) {
      order.status = targetWasHit ? 'green' : 'red';
      order.result = targetWasHit ? 'profit-hit' : 'loss-hit';
      order.settledAt = now;
      order.timeToHitMs = now - order.createdAt;
    }
  });
}

async function forceClosePendingOrders() {
  if (!pendingOrders.length) {
    return;
  }

  let market;
  try {
    market = await loadMarketSnapshot();
  } catch (error) {
    console.warn('Unable to force-close pending orders due to market snapshot error:', error.message || error);
    return;
  }

  if (!Array.isArray(market) || !market.length) {
    return;
  }

  const now = Date.now();
  pendingOrders.forEach((order) => {
    if (order.status !== 'pending') {
      return;
    }

    const matching = market.find((item) => item.symbol === order.symbol);
    if (!matching) {
      return;
    }

    const currentPrice = Number(matching.currentPrice || order.entryPrice);
    const currentMovePct = order.entryPrice
      ? ((currentPrice - order.entryPrice) / order.entryPrice) * 100
      : 0;

    order.currentPrice = currentPrice;
    order.currentMovePct = currentMovePct;
    order.updatedAt = now;
    order.status = currentMovePct >= 0 ? 'green' : 'red';
    order.result = 'day-close';
    order.settledAt = now;
    order.timeToHitMs = now - order.createdAt;
  });
}

const orderStatusInterval = setInterval(() => {
  refreshBackendScheduling().catch(() => {
    // Confirm order status regularly and keep scheduler active.
  });
}, ORDER_MONITOR_INTERVAL_MS);

const autoOrderInterval = setInterval(() => {
  refreshBackendScheduling().catch(() => {
    // Keep the auto-order scheduler running.
  });
}, AUTO_ORDER_POLL_MS);

function shouldKeepScheduling(todayKey) {
  const isSameDay = autoOrderState.dateKey === todayKey;
  const hasPendingOrders = pendingOrders.some((order) => order.status === 'pending');
  return !isSameDay || hasPendingOrders || !isAfterMarketClose();
}

async function refreshBackendScheduling() {
  await settlePendingOrders();
  await refreshAutoOrders();

  const todayKey = getNewYorkDateKey();
  if (!shouldKeepScheduling(todayKey)) {
    clearInterval(orderStatusInterval);
    clearInterval(autoOrderInterval);
  }
}

settlePendingOrders().catch(() => {});
refreshAutoOrders().catch(() => {});
refreshBackendScheduling().catch(() => {});

function extractText(xml, tag) {
  const regex = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const match = xml.match(regex);
  return match ? match[1].replace(/<.*?>/g, '').trim() : '';
}

function parseRss(xml) {
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].map(([, item]) => ({
    title: extractText(item, 'title'),
    link: extractText(item, 'link'),
    description: extractText(item, 'description')
  })).filter((item) => item.title);
  return items.slice(0, 8);
}

function isNasdaqMarketOpen() {
  const now = new Date();
  const nyParts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(now);

  const hourPart = nyParts.find((part) => part.type === 'hour');
  const minutePart = nyParts.find((part) => part.type === 'minute');
  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    weekday: 'short'
  }).format(now);

  if (['Sat', 'Sun'].includes(weekday)) {
    return false;
  }

  const hour = Number(hourPart?.value || 0);
  const minute = Number(minutePart?.value || 0);
  const totalMinutes = hour * 60 + minute;
  const marketOpen = 9 * 60 + 30;
  const marketClose = 16 * 60;

  return totalMinutes >= marketOpen && totalMinutes < marketClose;
}

app.get('/api/market', async (req, res) => {
  try {
    const market = await loadMarketSnapshot();
    res.json({ market });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Unable to load market data' });
  }
});

app.get('/api/news', async (req, res) => {
  try {
    const news = await loadNewsSnapshot();
    res.json({ news });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Unable to load news data' });
  }
});

app.get('/api/yesterday', async (req, res) => {
  try {
    const deposit = Number(req.query.depositUSD || 100);
    const leverage = Number(req.query.leverage || 1);
    const results = await loadYesterdaySnapshot(deposit, leverage);

    res.json({
      deposit,
      leverage,
      results,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Unable to load yesterday performance data' });
  }
});

app.get('/api/premarket', async (req, res) => {
  try {
    const deposit = Number(req.query.depositUSD || 100);
    const leverage = Number(req.query.leverage || 1);

    const [market, news] = await Promise.all([
      loadMarketSnapshot(),
      loadNewsSnapshot()
    ]);

    const peerMoves = market.reduce((accumulator, entry) => {
      accumulator[entry.symbol] = Number(entry.dayMovePct || 0);
      return accumulator;
    }, {});

    const ranked = market
      .map((item) => {
        const signal = buildLiveSignal(item, news, 100, 3000, leverage, { peerMoves, peerTargets: ['NVDA', 'AMD'] });
        const leverageProfit = deposit * ((Number(item.dayMovePct || 0) || 0) / 100) * leverage;

        return {
          symbol: item.symbol,
          name: item.name,
          region: item.region,
          currentPrice: item.currentPrice,
          movePct: Number(item.dayMovePct || 0),
          newsMentions: signal.newsMentions,
          signalScore: signal.score,
          leverageProfit,
          advancedSignals: signal.advancedSignals
        };
      })
      .filter((item) => Number.isFinite(item.currentPrice) && item.currentPrice > 0)
      .sort((a, b) => b.signalScore - a.signalScore)
      .slice(0, 5);

    res.json({
      deposit,
      leverage,
      results: ranked,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Unable to load pre-market signal data' });
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const body = req.body || {};
    const symbol = String(body.symbol || '').trim();
    const name = String(body.name || '').trim();
    const entryPrice = Number(body.entryPrice || 0);
    const targetProfit = Number(body.targetProfit || 0);
    const ballparkAmount = Number(body.ballparkAmount || 0);
    const leverage = Number(body.leverage || 0);

    if (!symbol || !name || entryPrice <= 0 || targetProfit <= 0 || ballparkAmount <= 0 || leverage <= 0) {
      return res.status(400).json({ error: 'Missing or invalid order fields. symbol, name, entryPrice, targetProfit, ballparkAmount, and leverage are required.' });
    }

    const record = buildOrderRecord(body);
    pendingOrders.unshift(record);
    res.json({ ok: true, order: record });
  } catch (error) {
    res.status(400).json({ error: error.message || 'Unable to create pending order' });
  }
});

app.get('/api/orders', async (req, res) => {
  try {
    await settlePendingOrders();
    res.json({ orders: pendingOrders.slice(0, 20) });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Unable to load pending orders' });
  }
});

app.post('/api/orders/refresh', async (req, res) => {
  try {
    await settlePendingOrders();
    res.json({ orders: pendingOrders.slice(0, 20) });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Unable to refresh pending orders' });
  }
});

app.get('/api/predict', async (req, res) => {
  try {
    const { minProfit, ballpark } = req.query;
    const targetProfit = Number(minProfit || 0);
    const ballparkAmount = Number(ballpark || 0);
    const requiredMovePct = ballparkAmount > 0 ? (targetProfit / ballparkAmount) * 100 : 0;

    if (!isNasdaqMarketOpen()) {
      return res.json({
        result: [],
        viable: false,
        note: 'NASDAQ market is currently closed. Please run this during NASDAQ open hours (09:30–16:00 ET).',
        inputs: {
          targetProfit,
          ballparkAmount,
          requiredMovePct
        },
        liveSource: 'Yahoo Finance 5m data and RSS headlines',
        newsSample: []
      });
    }

    const [market, news] = await Promise.all([
      loadMarketSnapshot(),
      loadNewsSnapshot()
    ]);

    const peerMoves = market.reduce((accumulator, entry) => {
      accumulator[entry.symbol] = Number(entry.dayMovePct || 0);
      return accumulator;
    }, {});

    const scored = market
      .map((item) => buildLiveSignal(item, news, targetProfit, ballparkAmount, 2, { peerMoves, peerTargets: ['NVDA', 'AMD'] }))
      .filter((item) => Number.isFinite(item.currentPrice) && item.currentPrice > 0)
      .sort((a, b) => b.score - a.score);

    const viableResults = scored.filter((item) => item.viable).slice(0, 5);
    const watchResults = scored.slice(0, 5);
    const hasViable = viableResults.length > 0;
    const result = hasViable ? viableResults : watchResults;

    res.json({
      result,
      viable: hasViable,
      note: hasViable
        ? 'Selected live options meet your target threshold based on current intraday movement and volume.'
        : `No live option currently meets the $${targetProfit.toFixed(0)} target. The top live candidates are shown as watch picks with current confidence levels.`,
      inputs: {
        targetProfit,
        ballparkAmount,
        requiredMovePct
      },
      liveSource: 'Yahoo Finance 5m data and RSS headlines',
      newsSample: news.slice(0, 8)
    });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Unable to run prediction engine' });
  }
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Stock game server listening on http://localhost:${PORT}`);
  });
}

module.exports = {
  buildLiveSignal
};
