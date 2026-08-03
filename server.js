const express = require('express');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const DATA_DIR = path.join(__dirname, 'data');

app.use(express.static(PUBLIC_DIR));
app.use(express.json({ limit: '200kb' }));

app.get('/api/docs/what-does-this-app-do', (req, res) => {
  const docsPath = path.join(__dirname, 'docs', 'what-does-this-app-do.md');
  fs.readFile(docsPath, 'utf8', (err, content) => {
    if (err) {
      return res.status(500).json({ error: 'Unable to load documentation.' });
    }
    res.json({ content });
  });
});

const DEFAULT_MARKET_SYMBOLS = [
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

const SECTOR_MARKET_SYMBOLS = [
  { symbol: 'AXP', name: 'American Express', region: 'NASDAQ' },
  { symbol: 'BAC', name: 'Bank of America', region: 'NASDAQ' },
  { symbol: 'BLK', name: 'BlackRock', region: 'NASDAQ' },
  { symbol: 'C', name: 'Citigroup', region: 'NASDAQ' },
  { symbol: 'COF', name: 'Capital One', region: 'NASDAQ' },
  { symbol: 'DFS', name: 'Discover Financial', region: 'NASDAQ' },
  { symbol: 'FITB', name: 'Fifth Third Bank', region: 'NASDAQ' },
  { symbol: 'GS', name: 'Goldman Sachs', region: 'NASDAQ' },
  { symbol: 'JPM', name: 'JPMorgan Chase', region: 'NASDAQ' },
  { symbol: 'KEY', name: 'KeyCorp', region: 'NASDAQ' },
  { symbol: 'MS', name: 'Morgan Stanley', region: 'NASDAQ' },
  { symbol: 'MTB', name: 'M&T Bank', region: 'NASDAQ' },
  { symbol: 'PNC', name: 'PNC Financial', region: 'NASDAQ' },
  { symbol: 'RF', name: 'Regions Financial', region: 'NASDAQ' },
  { symbol: 'SCHW', name: 'Charles Schwab', region: 'NASDAQ' },
  { symbol: 'STT', name: 'State Street', region: 'NASDAQ' },
  { symbol: 'SYF', name: 'Synchrony Financial', region: 'NASDAQ' },
  { symbol: 'TFC', name: 'Truist Financial', region: 'NASDAQ' },
  { symbol: 'USB', name: 'U.S. Bancorp', region: 'NASDAQ' },
  { symbol: 'WFC', name: 'Wells Fargo', region: 'NASDAQ' },
  { symbol: 'CFG', name: 'Citizens Financial', region: 'NASDAQ' },
  { symbol: 'CMA', name: 'Comerica', region: 'NASDAQ' },
  { symbol: 'HBAN', name: 'Huntington Bancshares', region: 'NASDAQ' },
  { symbol: 'AAPL', name: 'Apple', region: 'NASDAQ' },
  { symbol: 'ACN', name: 'Accenture', region: 'NASDAQ' },
  { symbol: 'ADBE', name: 'Adobe', region: 'NASDAQ' },
  { symbol: 'ADSK', name: 'Autodesk', region: 'NASDAQ' },
  { symbol: 'AMD', name: 'Advanced Micro Devices', region: 'NASDAQ' },
  { symbol: 'AMAT', name: 'Applied Materials', region: 'NASDAQ' },
  { symbol: 'AVGO', name: 'Broadcom', region: 'NASDAQ' },
  { symbol: 'CRM', name: 'Salesforce', region: 'NASDAQ' },
  { symbol: 'CSCO', name: 'Cisco', region: 'NASDAQ' },
  { symbol: 'CTAS', name: 'Cintas', region: 'NASDAQ' },
  { symbol: 'CTXS', name: 'Citrix Systems', region: 'NASDAQ' },
  { symbol: 'DXC', name: 'DXC Technology', region: 'NASDAQ' },
  { symbol: 'FIS', name: 'FIS', region: 'NASDAQ' },
  { symbol: 'FISV', name: 'Fiserv', region: 'NASDAQ' },
  { symbol: 'FTNT', name: 'Fortinet', region: 'NASDAQ' },
  { symbol: 'GOOGL', name: 'Alphabet', region: 'NASDAQ' },
  { symbol: 'IBM', name: 'IBM', region: 'NASDAQ' },
  { symbol: 'INTC', name: 'Intel', region: 'NASDAQ' },
  { symbol: 'INTU', name: 'Intuit', region: 'NASDAQ' },
  { symbol: 'KLAC', name: 'KLA', region: 'NASDAQ' },
  { symbol: 'LRCX', name: 'Lam Research', region: 'NASDAQ' },
  { symbol: 'MCHP', name: 'Microchip', region: 'NASDAQ' },
  { symbol: 'MDB', name: 'MongoDB', region: 'NASDAQ' },
  { symbol: 'MSFT', name: 'Microsoft', region: 'NASDAQ' },
  { symbol: 'MU', name: 'Micron', region: 'NASDAQ' },
  { symbol: 'NOW', name: 'ServiceNow', region: 'NASDAQ' },
  { symbol: 'NVDA', name: 'NVIDIA', region: 'NASDAQ' },
  { symbol: 'ORCL', name: 'Oracle', region: 'NASDAQ' },
  { symbol: 'PANW', name: 'Palo Alto Networks', region: 'NASDAQ' },
  { symbol: 'PAYX', name: 'Paychex', region: 'NASDAQ' },
  { symbol: 'QCOM', name: 'Qualcomm', region: 'NASDAQ' },
  { symbol: 'SAP', name: 'SAP', region: 'NASDAQ' },
  { symbol: 'STX', name: 'Seagate', region: 'NASDAQ' },
  { symbol: 'SWKS', name: 'Skyworks', region: 'NASDAQ' },
  { symbol: 'TTD', name: 'Trade Desk', region: 'NASDAQ' },
  { symbol: 'TXN', name: 'Texas Instruments', region: 'NASDAQ' },
  { symbol: 'VRSN', name: 'Verisign', region: 'NASDAQ' },
  { symbol: 'WDC', name: 'Western Digital', region: 'NASDAQ' },
  { symbol: 'ANET', name: 'Arista Networks', region: 'NASDAQ' },
  { symbol: 'CDNS', name: 'Cadence Design', region: 'NASDAQ' },
  { symbol: 'CDW', name: 'CDW', region: 'NASDAQ' },
  { symbol: 'DDOG', name: 'Datadog', region: 'NASDAQ' },
  { symbol: 'ENPH', name: 'Enphase', region: 'NASDAQ' },
  { symbol: 'EPAM', name: 'EPAM Systems', region: 'NASDAQ' },
  { symbol: 'FFIV', name: 'F5 Networks', region: 'NASDAQ' },
  { symbol: 'FSLY', name: 'Fastly', region: 'NASDAQ' },
  { symbol: 'HPQ', name: 'HP', region: 'NASDAQ' },
  { symbol: 'KEYS', name: 'Keysight', region: 'NASDAQ' },
  { symbol: 'MPWR', name: 'Monolithic Power', region: 'NASDAQ' },
  { symbol: 'NTAP', name: 'NetApp', region: 'NASDAQ' },
  { symbol: 'PLTR', name: 'Palantir', region: 'NASDAQ' },
  { symbol: 'ROP', name: 'Roper Technologies', region: 'NASDAQ' },
  { symbol: 'SNOW', name: 'Snowflake', region: 'NASDAQ' },
  { symbol: 'WDAY', name: 'Workday', region: 'NASDAQ' },
  { symbol: 'ZBRA', name: 'Zebra Technologies', region: 'NASDAQ' },
  { symbol: 'ABBV', name: 'AbbVie', region: 'NASDAQ' },
  { symbol: 'ABT', name: 'Abbott', region: 'NASDAQ' },
  { symbol: 'ALGN', name: 'Align Technology', region: 'NASDAQ' },
  { symbol: 'AMGN', name: 'Amgen', region: 'NASDAQ' },
  { symbol: 'BAX', name: 'Baxter', region: 'NASDAQ' },
  { symbol: 'BIO', name: 'Bio-Rad', region: 'NASDAQ' },
  { symbol: 'BIIB', name: 'Biogen', region: 'NASDAQ' },
  { symbol: 'BMY', name: 'Bristol Myers', region: 'NASDAQ' },
  { symbol: 'BSX', name: 'Boston Scientific', region: 'NASDAQ' },
  { symbol: 'CAH', name: 'Cardinal Health', region: 'NASDAQ' },
  { symbol: 'CI', name: 'Cigna', region: 'NASDAQ' },
  { symbol: 'CVS', name: 'CVS Health', region: 'NASDAQ' },
  { symbol: 'DGX', name: 'Quest Diagnostics', region: 'NASDAQ' },
  { symbol: 'DHR', name: 'Danaher', region: 'NASDAQ' },
  { symbol: 'DVA', name: 'DaVita', region: 'NASDAQ' },
  { symbol: 'ELV', name: 'Elevance Health', region: 'NASDAQ' },
  { symbol: 'EW', name: 'Edwards Lifesciences', region: 'NASDAQ' },
  { symbol: 'GILD', name: 'Gilead', region: 'NASDAQ' },
  { symbol: 'HCA', name: 'HCA Healthcare', region: 'NASDAQ' },
  { symbol: 'HOLX', name: 'Hologic', region: 'NASDAQ' },
  { symbol: 'HUM', name: 'Humana', region: 'NASDAQ' },
  { symbol: 'IDXX', name: 'IDEXX', region: 'NASDAQ' },
  { symbol: 'ILMN', name: 'Illumina', region: 'NASDAQ' },
  { symbol: 'IQV', name: 'IQVIA', region: 'NASDAQ' },
  { symbol: 'ISRG', name: 'Intuitive Surgical', region: 'NASDAQ' },
  { symbol: 'JNJ', name: 'Johnson & Johnson', region: 'NASDAQ' },
  { symbol: 'LLY', name: 'Eli Lilly', region: 'NASDAQ' },
  { symbol: 'MCK', name: 'McKesson', region: 'NASDAQ' },
  { symbol: 'MDT', name: 'Medtronic', region: 'NASDAQ' },
  { symbol: 'MRK', name: 'Merck', region: 'NASDAQ' },
  { symbol: 'MRNA', name: 'Moderna', region: 'NASDAQ' },
  { symbol: 'PFE', name: 'Pfizer', region: 'NASDAQ' },
  { symbol: 'PKI', name: 'PerkinElmer', region: 'NASDAQ' },
  { symbol: 'REGN', name: 'Regeneron', region: 'NASDAQ' },
  { symbol: 'RMD', name: 'ResMed', region: 'NASDAQ' },
  { symbol: 'SYK', name: 'Stryker', region: 'NASDAQ' },
  { symbol: 'TMO', name: 'Thermo Fisher', region: 'NASDAQ' },
  { symbol: 'VTRS', name: 'Viatris', region: 'NASDAQ' },
  { symbol: 'VRTX', name: 'Vertex', region: 'NASDAQ' },
  { symbol: 'WAT', name: 'Waters', region: 'NASDAQ' },
  { symbol: 'WST', name: 'West Pharmaceutical', region: 'NASDAQ' },
  { symbol: 'ZBH', name: 'Zimmer Biomet', region: 'NASDAQ' },
  { symbol: 'COP', name: 'ConocoPhillips', region: 'NASDAQ' },
  { symbol: 'CTRA', name: 'Coterra Energy', region: 'NASDAQ' },
  { symbol: 'CVX', name: 'Chevron', region: 'NASDAQ' },
  { symbol: 'DVN', name: 'Devon Energy', region: 'NASDAQ' },
  { symbol: 'EOG', name: 'EOG Resources', region: 'NASDAQ' },
  { symbol: 'FANG', name: 'Diamondback Energy', region: 'NASDAQ' },
  { symbol: 'HAL', name: 'Halliburton', region: 'NASDAQ' },
  { symbol: 'HES', name: 'Hess', region: 'NASDAQ' },
  { symbol: 'KMI', name: 'Kinder Morgan', region: 'NASDAQ' },
  { symbol: 'MPC', name: 'Marathon Petroleum', region: 'NASDAQ' },
  { symbol: 'MRO', name: 'Marathon Oil', region: 'NASDAQ' },
  { symbol: 'OKE', name: 'ONEOK', region: 'NASDAQ' },
  { symbol: 'OXY', name: 'Occidental', region: 'NASDAQ' },
  { symbol: 'PXD', name: 'Pioneer Natural Resources', region: 'NASDAQ' },
  { symbol: 'SLB', name: 'Schlumberger', region: 'NASDAQ' },
  { symbol: 'VLO', name: 'Valero', region: 'NASDAQ' },
  { symbol: 'WMB', name: 'Williams Companies', region: 'NASDAQ' },
  { symbol: 'XOM', name: 'Exxon Mobil', region: 'NASDAQ' }
];

const MARKET_SYMBOLS = [...new Map([
  ...DEFAULT_MARKET_SYMBOLS,
  ...SECTOR_MARKET_SYMBOLS
].map((entry) => [entry.symbol, entry])).values()];

const MARKET_CACHE_TTL_MS = 15000;
const NEWS_CACHE_TTL_MS = 30000;
const YESTERDAY_CACHE_TTL_MS = 60000;
const ORDER_MONITOR_INTERVAL_MS = 10 * 1000;
const AUTO_ORDER_POLL_MS = 60 * 1000;
const DEFAULT_STOP_LOSS_USD = 15;
const DAILY_TARGET_PROFIT = 100;
const DAILY_MAX_LOSS = 50;
const MIN_ORDER_PROFIT = 30;
const AUTO_ORDER_STOP_LOSS = 30;

let marketCache = { expiresAt: 0, data: [] };
let newsCache = { expiresAt: 0, data: [] };
let yesterdayCache = { expiresAt: 0, data: [] };
const pendingOrders = [];

const MODELS_DIR = path.join(__dirname, 'models');
const INTRADAY_MODEL_PATH = path.join(MODELS_DIR, 'intraday_model.json');
const META_MODEL_PATH = path.join(MODELS_DIR, 'meta_model.json');
let persistedIntradayModel = null;
let persistedMetaModel = null;

const autoOrderState = {
  dateKey: '',
  lastOrderPlacedAt: null,
  orderCount: 0
};

const RUNTIME_SETTINGS_PATH = path.join(MODELS_DIR, 'runtime_settings.json');

const AUTO_ORDER_SETTINGS = {
  leverage: 2,
  ballparkAmount: 3000,
  waitAfterOpenMs: 30 * 60 * 1000,
  intradayAlpha: 0.7,
  minCombinedThreshold: 0.6
};

function loadRuntimeSettings() {
  try {
    if (!fs.existsSync(RUNTIME_SETTINGS_PATH)) {
      return AUTO_ORDER_SETTINGS;
    }
    const raw = fs.readFileSync(RUNTIME_SETTINGS_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    if (parsed.intradayAlpha != null) {
      AUTO_ORDER_SETTINGS.intradayAlpha = Number(parsed.intradayAlpha);
    }
    if (parsed.minCombinedThreshold != null) {
      AUTO_ORDER_SETTINGS.minCombinedThreshold = Number(parsed.minCombinedThreshold);
    }
    if (parsed.leverage != null) {
      AUTO_ORDER_SETTINGS.leverage = Number(parsed.leverage);
    }
    if (parsed.ballparkAmount != null) {
      AUTO_ORDER_SETTINGS.ballparkAmount = Number(parsed.ballparkAmount);
    }
  } catch (err) {
    console.warn('Unable to load runtime settings:', err && err.message);
  }
  return AUTO_ORDER_SETTINGS;
}

function getRuntimeAlpha() {
  return Number.isFinite(AUTO_ORDER_SETTINGS.intradayAlpha)
    ? Number(AUTO_ORDER_SETTINGS.intradayAlpha)
    : 0.7;
}

function getRuntimeThreshold() {
  return Number.isFinite(AUTO_ORDER_SETTINGS.minCombinedThreshold)
    ? Number(AUTO_ORDER_SETTINGS.minCombinedThreshold)
    : 0.6;
}

function saveRuntimeSettings(settings = {}) {
  try {
    const merged = {
      leverage: AUTO_ORDER_SETTINGS.leverage,
      ballparkAmount: AUTO_ORDER_SETTINGS.ballparkAmount,
      intradayAlpha: AUTO_ORDER_SETTINGS.intradayAlpha,
      minCombinedThreshold: AUTO_ORDER_SETTINGS.minCombinedThreshold,
      ...settings
    };
    if (merged.intradayAlpha != null) {
      AUTO_ORDER_SETTINGS.intradayAlpha = Number(merged.intradayAlpha);
    }
    if (merged.minCombinedThreshold != null) {
      AUTO_ORDER_SETTINGS.minCombinedThreshold = Number(merged.minCombinedThreshold);
    }
    if (merged.leverage != null) {
      AUTO_ORDER_SETTINGS.leverage = Number(merged.leverage);
    }
    if (merged.ballparkAmount != null) {
      AUTO_ORDER_SETTINGS.ballparkAmount = Number(merged.ballparkAmount);
    }
    if (!fs.existsSync(MODELS_DIR)) fs.mkdirSync(MODELS_DIR, { recursive: true });
    fs.writeFileSync(RUNTIME_SETTINGS_PATH, JSON.stringify(merged, null, 2));
    return merged;
  } catch (err) {
    console.error('Failed to save runtime settings', err && err.message);
    return AUTO_ORDER_SETTINGS;
  }
}

function readJsonFileSync(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return null;
    }
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (err) {
    console.warn(`Unable to read JSON file ${filePath}:`, err && err.message);
    return null;
  }
}

function extractModelMetadata(fileData, defaultType = 'model') {
  if (!fileData) return null;
  const model = fileData.model || fileData.metaModel || null;
  const metadata = fileData.metadata || {};
  return {
    savedAt: fileData.savedAt || null,
    trainedAt: metadata.trainedAt || fileData.savedAt || null,
    sourceSnapshots: metadata.sourceSnapshots || null,
    parameters: metadata.parameters || null,
    modelSource: metadata.modelSource || defaultType,
    weightCount: Array.isArray(model?.weights) ? model.weights.length : null
  };
}

function saveMetaModel(metaModel, metadata = {}) {
  try {
    const payload = {
      savedAt: new Date().toISOString(),
      metaModel,
      metadata
    };
    if (!fs.existsSync(MODELS_DIR)) fs.mkdirSync(MODELS_DIR, { recursive: true });
    fs.writeFileSync(META_MODEL_PATH, JSON.stringify(payload, null, 2));
    persistedMetaModel = metaModel;
    return payload;
  } catch (err) {
    console.error('Failed to save meta model', err && err.message);
    return null;
  }
}

function loadPersistedMetaModel() {
  try {
    if (fs.existsSync(META_MODEL_PATH)) {
      const raw = fs.readFileSync(META_MODEL_PATH, 'utf8');
      const parsed = JSON.parse(raw);
      persistedMetaModel = parsed.metaModel || null;
      console.log('Loaded persisted meta model from', META_MODEL_PATH);
    }
  } catch (err) {
    console.error('Failed to load persisted meta model', err && err.message);
  }
  return persistedMetaModel;
}

function getPersistedMetaModel() {
  if (persistedMetaModel == null) {
    loadPersistedMetaModel();
  }
  return persistedMetaModel;
}

function getLiveScore(live) {
  return clamp(Number((live?.score ?? live?.ensembleScore) || 0) / 100, 0, 1);
}

function isRuntimeTradingPaused() {
  const tuningReport = loadWalkForwardTuningReport();
  return tuningReport?.healthGate === 'pause';
}

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY || 'd9kd0t9r01qq9sqg0da0d9kd0t9r01qq9sqg0dag';
const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';
const FINNHUB_ENABLED = Boolean(FINNHUB_API_KEY);

const TWELVEDATA_API_KEY = process.env.TWELVEDATA_API_KEY || 'bd65484fcc1a446f9660c0f8396c15b2';
const TWELVEDATA_BASE_URL = 'https://api.twelvedata.com';
const TWELVEDATA_ENABLED = Boolean(TWELVEDATA_API_KEY);

const ALPHAVANTAGE_API_KEY = process.env.ALPHAVANTAGE_API_KEY || '';
const ALPHAVANTAGE_ENABLED = Boolean(ALPHAVANTAGE_API_KEY);

const NASDAQ_API_KEY = process.env.NASDAQ_API_KEY || 'spGL2QP12RqBVmKTcKBw';
const NASDAQ_BASE_URL = 'https://data.nasdaq.com/api/v3';
const NASDAQ_ENABLED = Boolean(NASDAQ_API_KEY);

function isMockTradingEnabled() {
  return false;
}

function getNewYorkDateKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(date);

  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;
  return `${year}-${month}-${day}`;
}

function getNewYorkTimeParts(date = new Date()) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(date);
}

function getNewYorkTimeMinutes(date = new Date()) {
  const parts = getNewYorkTimeParts(date);
  const hour = Number(parts.find((part) => part.type === 'hour')?.value || 0);
  const minute = Number(parts.find((part) => part.type === 'minute')?.value || 0);
  return hour * 60 + minute;
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
  const symbolName = String(item.name || '').toLowerCase();
  const symbol = String(item.symbol || '').toLowerCase();
  const region = String(item.region || '').toLowerCase();
  return news.filter((entry) => {
    const text = `${String(entry.title || '')} ${String(entry.description || '')}`.toLowerCase();
    return text.includes(symbolName) || text.includes(symbol) || text.includes(region);
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

function sigmoid(value) {
  return 1 / (1 + Math.exp(-value));
}

function computeRsi(closeHistory, period = 14) {
  const values = Array.isArray(closeHistory) ? closeHistory.filter((value) => Number.isFinite(Number(value))).map((value) => Number(value)) : [];
  if (values.length < 2) {
    return { rsi: 50, rsiSlope: 0 };
  }

  const window = values.slice(-period);
  let avgGain = 0;
  let avgLoss = 0;

  for (let index = 1; index < window.length; index += 1) {
    const delta = window[index] - window[index - 1];
    if (delta >= 0) {
      avgGain += delta;
    } else {
      avgLoss += Math.abs(delta);
    }
  }

  const baselineCount = Math.max(1, window.length - 1);
  avgGain /= baselineCount;
  avgLoss /= baselineCount;
  const rs = avgLoss > 0 ? avgGain / avgLoss : avgGain > 0 ? 100 : 1;
  const rsi = clamp(100 - (100 / (1 + rs)), 0, 100);
  const latest = values[values.length - 1] || 0;
  const previous = values[values.length - 2] || latest;
  const rsiSlope = latest && previous ? ((latest - previous) / Math.max(previous, 1)) * 100 : 0;

  return { rsi, rsiSlope };
}

function computeMacd(closeHistory) {
  const values = Array.isArray(closeHistory) ? closeHistory.filter((value) => Number.isFinite(Number(value))).map((value) => Number(value)) : [];
  if (values.length < 26) {
    return { macd: 0, signal: 0, histogram: 0, crossover: 0 };
  }

  const ema12 = values.reduce((accumulator, value, index) => {
    const k = 2 / (12 + 1);
    return index === 0 ? value : accumulator * (1 - k) + value * k;
  }, values[0]);
  const ema26 = values.reduce((accumulator, value, index) => {
    const k = 2 / (26 + 1);
    return index === 0 ? value : accumulator * (1 - k) + value * k;
  }, values[0]);
  const macd = ema12 - ema26;
  const signal = macd;
  const histogram = macd - signal;
  return { macd, signal, histogram, crossover: histogram > 0 ? 1 : -1 };
}

function computeMovingAverageFeatures(closeHistory, currentPrice) {
  const values = Array.isArray(closeHistory) ? closeHistory.filter((value) => Number.isFinite(Number(value))).map((value) => Number(value)) : [];
  if (!values.length) {
    return { sma20: currentPrice, sma50: currentPrice, sma200: currentPrice, distancePct: 0, goldenCross: 0 };
  }

  const sma20 = values.slice(-20).reduce((sum, value) => sum + value, 0) / Math.max(1, Math.min(20, values.length));
  const sma50 = values.slice(-50).reduce((sum, value) => sum + value, 0) / Math.max(1, Math.min(50, values.length));
  const sma200 = values.slice(-200).reduce((sum, value) => sum + value, 0) / Math.max(1, Math.min(200, values.length));
  const distancePct = currentPrice > 0 && sma20 > 0 ? ((currentPrice - sma20) / sma20) * 100 : 0;
  const goldenCross = sma50 > 0 && sma200 > 0 && sma50 > sma200 && currentPrice > sma20 ? 1 : 0;

  return { sma20, sma50, sma200, distancePct, goldenCross };
}

function computeAtr(closeHistory, highHistory, lowHistory, currentPrice) {
  const closes = Array.isArray(closeHistory) ? closeHistory.filter((value) => Number.isFinite(Number(value))).map((value) => Number(value)) : [];
  const highs = Array.isArray(highHistory) ? highHistory.filter((value) => Number.isFinite(Number(value))).map((value) => Number(value)) : [];
  const lows = Array.isArray(lowHistory) ? lowHistory.filter((value) => Number.isFinite(Number(value))).map((value) => Number(value)) : [];
  if (!closes.length) {
    return { atrPct: 0.01, volatilityRegime: 'balanced' };
  }

  const values = closes.slice(-14);
  const recentMove = values.length > 1
    ? values.slice(-1)[0] - values[0]
    : 0;
  const atrPct = currentPrice > 0 ? Math.abs(recentMove / currentPrice) * 100 : 0.01;
  const volatilityRegime = atrPct > 2 ? 'high' : atrPct > 1 ? 'medium' : 'low';
  return { atrPct, volatilityRegime };
}

function computeHurstExponent(closeHistory) {
  const values = Array.isArray(closeHistory) ? closeHistory.filter((value) => Number.isFinite(Number(value))).map(Number) : [];
  if (values.length < 20) {
    return 0.5;
  }

  const n = values.length;
  const mean = values.reduce((sum, value) => sum + value, 0) / n;
  const dev = values.map((value) => value - mean);
  const cum = dev.map((_, index) => dev.slice(0, index + 1).reduce((sum, value) => sum + value, 0));
  const range = Math.max(...cum) - Math.min(...cum);
  const stdev = Math.sqrt(dev.reduce((sum, value) => sum + value * value, 0) / n) || 1;
  return clamp(Math.log(range / stdev + 1) / Math.log(n), 0.01, 0.99);
}

function percentileRank(value, values) {
  if (!Array.isArray(values) || !values.length) {
    return 0.5;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const rank = sorted.filter((v) => v <= value).length;
  return Math.max(0.01, Math.min(0.99, rank / sorted.length));
}

function standardizeFeatures(features, featureNames, featureStats = {}) {
  const standardized = {};
  featureNames.forEach((name) => {
    const rawValue = Number(features[name] || 0);
    const stats = featureStats[name] || {};
    const std = Number(stats.std || 1);
    const mean = Number(stats.mean || 0);
    standardized[name] = std > 0 ? (rawValue - mean) / std : rawValue - mean;
  });
  return standardized;
}

function logisticPredict(features, weights, bias = 0, model = null) {
  const featureNames = Array.isArray(model?.featureNames) && model.featureNames.length ? model.featureNames : Object.keys(weights);
  const featureStats = model?.featureStats || {};
  const standardized = model && Object.keys(featureStats).length ? standardizeFeatures(features, featureNames, featureStats) : features;
  const z = featureNames.reduce((sum, key) => sum + (Number(standardized[key] || features[key] || 0) * Number(weights[key] || 0)), bias);
  return sigmoid(z);
}

function buildMarketFeatureStats(market) {
  const stats = {
    rsi: [],
    atrPct: [],
    distancePct: [],
    volumeZ: [],
    dayMovePct: []
  };

  market.forEach((item) => {
    const rsi = computeRsi(item.closeHistory).rsi;
    const atr = computeAtr(item.closeHistory, item.highHistory || [], item.lowHistory || [], Number(item.currentPrice || 0)).atrPct;
    const movingAverages = computeMovingAverageFeatures(item.closeHistory, Number(item.currentPrice || 0));
    const volumeSignals = computeVolumeSignals(item, item.volumeHistory);

    stats.rsi.push(rsi);
    stats.atrPct.push(atr);
    stats.distancePct.push(movingAverages.distancePct);
    stats.volumeZ.push(volumeSignals.volumeZ);
    stats.dayMovePct.push(Number(item.dayMovePct || 0));
  });

  return stats;
}

function buildFeatureVector(item, advancedSignals, context = {}) {
  const marketStats = context.marketStats || {};
  return {
    rsi: Number(advancedSignals.rsi || 50) / 100,
    macdHistogram: Number(advancedSignals.macdHistogram || 0) / 10,
    maDistancePct: Number(advancedSignals.movingAverageDistancePct || 0) / 10,
    atrPct: Number(advancedSignals.atrPct || 0) / 10,
    volumeZ: Math.max(-1, Math.min(1, Number(advancedSignals.volumeZ || 0) / 3)),
    sentiment: Number(advancedSignals.sentimentScore || 50) / 100,
    liquidity: 1 - Number(advancedSignals.liquidityPenalty || 0),
    sectorStrength: Number(advancedSignals.sectorStrength || 0.5),
    patternStrength: Number(advancedSignals.candlePatternStrength || 0),
    trendRegime: advancedSignals.regime === 'trend-up' ? 1 : 0,
    meanRevertRegime: advancedSignals.regime === 'trend-down' ? 1 : 0,
    hurst: Number(advancedSignals.hurst || 0.5),
    rsiPercentile: percentileRank(Number(advancedSignals.rsi || 50), marketStats.rsi || []),
    atrPercentile: percentileRank(Number(advancedSignals.atrPct || 0), marketStats.atrPct || []),
    distancePercentile: percentileRank(Number(advancedSignals.movingAverageDistancePct || 0), marketStats.distancePct || []),
    volumePercentile: percentileRank(Number(advancedSignals.volumeZ || 0), marketStats.volumeZ || [])
  };
}

function computeModelProbability(item, advancedSignals, context = {}) {
  const featureVector = buildFeatureVector(item, advancedSignals, context);
  const model = context.model || DEFAULT_LOGISTIC_MODEL;
  return {
    probability: clamp(logisticPredict(featureVector, model.weights, model.bias, model), 0.05, 0.95),
    features: featureVector
  };
}

function trainLogisticRegression(examples, featureNames, iterations = 400, learningRate = 0.02, regularization = 0.001) {
  const weights = featureNames.reduce((acc, name) => ({ ...acc, [name]: 0 }), {});
  const featureStats = featureNames.reduce((acc, name) => {
    const values = examples.map((example) => Number(example.features[name] || 0));
    const mean = values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length);
    const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / Math.max(1, values.length);
    acc[name] = { mean, std: Math.sqrt(variance) || 1 };
    return acc;
  }, {});
  const scaledExamples = examples.map((example) => ({
    ...example,
    features: standardizeFeatures(example.features, featureNames, featureStats)
  }));
  const positiveCount = scaledExamples.filter((example) => example.label).length;
  const negativeCount = scaledExamples.length - positiveCount;
  const positiveWeight = negativeCount > 0 && positiveCount > 0 ? negativeCount / positiveCount : 1;
  let bias = 0;

  for (let iter = 0; iter < iterations; iter += 1) {
    const gradients = featureNames.reduce((acc, name) => ({ ...acc, [name]: 0 }), {});
    let biasGrad = 0;

    scaledExamples.forEach((example) => {
      const y = example.label ? 1 : 0;
      const p = logisticPredict(example.features, weights, bias);
      const error = p - y;
      const exampleWeight = y > 0 ? positiveWeight : 1;
      featureNames.forEach((name) => {
        gradients[name] += exampleWeight * error * example.features[name];
      });
      biasGrad += exampleWeight * error;
    });

    featureNames.forEach((name) => {
      weights[name] -= learningRate * ((gradients[name] / scaledExamples.length) + regularization * weights[name]);
    });
    bias -= learningRate * (biasGrad / scaledExamples.length);
  }

  return { weights, bias, featureNames, featureStats };
}

function computeBrierScore(predictions, labels) {
  if (!Array.isArray(predictions) || !Array.isArray(labels) || predictions.length !== labels.length) {
    return null;
  }

  return predictions.reduce((sum, p, index) => {
    const y = labels[index] ? 1 : 0;
    return sum + (p - y) ** 2;
  }, 0) / predictions.length;
}

function logit(value) {
  const p = clamp(Number(value) || 0, 1e-6, 1 - 1e-6);
  return Math.log(p / (1 - p));
}

function fitLogisticCalibration(predictions, labels, iterations = 400, learningRate = 0.01) {
  let alpha = 1;
  let beta = 0;
  const n = Math.max(1, predictions.length);

  for (let iter = 0; iter < iterations; iter += 1) {
    let gradA = 0;
    let gradB = 0;

    for (let index = 0; index < n; index += 1) {
      const p = clamp(Number(predictions[index]) || 0, 1e-6, 1 - 1e-6);
      const x = logit(p);
      const q = sigmoid(alpha * x + beta);
      const y = labels[index] ? 1 : 0;
      const error = q - y;
      const derivative = q * (1 - q);
      gradA += 2 * error * derivative * x;
      gradB += 2 * error * derivative;
    }

    alpha -= learningRate * (gradA / n);
    beta -= learningRate * (gradB / n);
    alpha = clamp(alpha, 0.05, 5);
    beta = clamp(beta, -5, 5);
  }

  return { method: 'logistic', alpha, beta };
}

function fitIsotonicCalibration(predictions, labels) {
  const pairs = predictions.map((p, index) => ({
    p: clamp(Number(p) || 0, 0, 1),
    y: labels[index] ? 1 : 0
  })).sort((a, b) => a.p - b.p);

  const blocks = pairs.map((pair) => ({
    sumY: pair.y,
    count: 1,
    avg: pair.y,
    minP: pair.p,
    maxP: pair.p
  }));

  let index = 0;
  while (index < blocks.length - 1) {
    if (blocks[index].avg > blocks[index + 1].avg) {
      const merged = {
        sumY: blocks[index].sumY + blocks[index + 1].sumY,
        count: blocks[index].count + blocks[index + 1].count,
        minP: blocks[index].minP,
        maxP: blocks[index + 1].maxP
      };
      merged.avg = merged.sumY / merged.count;
      blocks.splice(index, 2, merged);
      index = Math.max(0, index - 1);
    } else {
      index += 1;
    }
  }

  return { method: 'isotonic', blocks };
}

function applyIsotonicCalibration(value, calibration) {
  const p = clamp(Number(value) || 0, 0, 1);
  const block = calibration.blocks.find((block) => p <= block.maxP) || calibration.blocks[calibration.blocks.length - 1];
  return block ? block.avg : p;
}

function applyCalibration(probability, calibration) {
  if (!calibration || !calibration.method) {
    return probability;
  }

  const p = clamp(Number(probability) || 0, 1e-6, 1 - 1e-6);
  if (calibration.method === 'logistic') {
    return sigmoid(calibration.alpha * logit(p) + calibration.beta);
  }
  if (calibration.method === 'isotonic') {
    return applyIsotonicCalibration(p, calibration);
  }

  return probability;
}

function getCalibratedProbability(features, model) {
  const raw = clamp(logisticPredict(features, model.weights, model.bias, model), 0, 1);
  return applyCalibration(raw, model.calibration);
}

function computeCalibrationCurve(examples, model, options = {}) {
  const bins = Math.max(2, Number(options.bins || 10));
  const thresholdPct = Number(options.thresholdPct || 2.5);
  const context = options.context || {};
  const paired = [];

  examples.forEach((example) => {
    const item = example.item || example;
    const adv = buildAdvancedSignals(item, example.news || [], context);
    const features = buildIntradayFeatureVector(item, adv, context);
    const rawP = clamp(logisticPredict(features, model.weights, model.bias, model), 0, 1);
    const p = applyCalibration(rawP, model.calibration);
    const label = labelIntradayOutcome(item, thresholdPct, options) ? 1 : 0;
    paired.push({ p, y: label });
  });

  paired.sort((a, b) => a.p - b.p);
  const groupSize = Math.max(1, Math.floor(paired.length / bins));
  const curve = [];

  for (let binIndex = 0; binIndex < bins; binIndex += 1) {
    const group = paired.slice(binIndex * groupSize, binIndex === bins - 1 ? undefined : (binIndex + 1) * groupSize);
    if (!group.length) {
      continue;
    }
    const meanPred = group.reduce((sum, entry) => sum + entry.p, 0) / group.length;
    const meanActual = group.reduce((sum, entry) => sum + entry.y, 0) / group.length;
    curve.push({ meanPred, meanActual, count: group.length });
  }

  return curve;
}

function calibrateModel(examples, model, method = 'logistic', options = {}) {
  const thresholdPct = Number(options.thresholdPct || 2.5);
  const context = options.context || {};
  const predictions = [];
  const labels = [];
  const iterations = Number(options.iterations ?? 400);
  const learningRate = Number(options.learningRate ?? 0.01);

  examples.forEach((example) => {
    const item = example.item || example;
    const adv = buildAdvancedSignals(item, example.news || [], context);
    const features = buildIntradayFeatureVector(item, adv, context);
    const p = clamp(logisticPredict(features, model.weights, model.bias, model), 0, 1);
    predictions.push(p);
    labels.push(labelIntradayOutcome(item, thresholdPct, options) ? 1 : 0);
  });

  return method === 'isotonic'
    ? fitIsotonicCalibration(predictions, labels)
    : fitLogisticCalibration(predictions, labels, iterations, learningRate);
}

function buildMetaFeatures(item, advancedSignals, intradayProbability, ensembleScore) {
  return {
    p: clamp(Number(intradayProbability) || 0, 0, 1),
    s: clamp(Number(ensembleScore || 0) / 100, 0, 1),
    volumeZ: Math.max(-1, Math.min(1, Number(advancedSignals.volumeZ || 0) / 3)),
    sentiment: Number(advancedSignals.sentimentScore || 50) / 100,
    patternStrength: Number(advancedSignals.candlePatternStrength || 0),
    sectorStrength: Number(advancedSignals.sectorStrength || 0.5),
    atrPct: Number(advancedSignals.atrPct || 0) / 10,
    trendRegime: advancedSignals.regime === 'trend-up' ? 1 : 0,
    meanRevertRegime: advancedSignals.regime === 'trend-down' ? 1 : 0
  };
}

function trainMetaModel(examples, intradayModel = DEFAULT_INTRADAY_MODEL, options = {}) {
  const featureNames = ['p', 's', 'volumeZ', 'sentiment', 'patternStrength', 'sectorStrength', 'atrPct', 'trendRegime', 'meanRevertRegime'];
  const thresholdPct = Number(options.thresholdPct || 2.5);
  const iterations = Number(options.iterations || 300);
  const learningRate = Number(options.learningRate || 0.02);
  const context = options.context || {};

  const formatted = examples.map((example) => {
    const item = example.item || example;
    const adv = buildAdvancedSignals(item, example.news || [], context);
    const intradayFeatures = buildIntradayFeatureVector(item, adv, context);
    const p = getCalibratedProbability(intradayFeatures, intradayModel);
    const live = buildLiveSignal(item, example.news || [], DAILY_TARGET_PROFIT, AUTO_ORDER_SETTINGS.ballparkAmount, AUTO_ORDER_SETTINGS.leverage, context);
    const features = buildMetaFeatures(item, adv, p, live.ensembleScore);
    return { features, label: labelIntradayOutcome(item, thresholdPct) };
  });

  return trainLogisticRegression(formatted, featureNames, iterations, learningRate);
}

function predictMetaProbability(item, news, intradayModel, metaModel, context = {}) {
  const adv = buildAdvancedSignals(item, news, context);
  const intradayFeatures = buildIntradayFeatureVector(item, adv, context);
  const p = getCalibratedProbability(intradayFeatures, intradayModel);
  const live = buildLiveSignal(item, news, DAILY_TARGET_PROFIT, AUTO_ORDER_SETTINGS.ballparkAmount, AUTO_ORDER_SETTINGS.leverage, context);
  const metaFeatures = buildMetaFeatures(item, adv, p, live.ensembleScore);
  const q = clamp(logisticPredict(metaFeatures, metaModel.weights, metaModel.bias, metaModel), 0, 1);
  return { probability: q, features: metaFeatures, intradayProbability: p, ensembleScore: live.ensembleScore };
}

function optimizeAlphaThreshold(examples, options = {}) {
  const alphas = Array.isArray(options.alphas) && options.alphas.length ? options.alphas : [0, 0.25, 0.5, 0.75, 1];
  const thresholds = Array.isArray(options.thresholds) && options.thresholds.length ? options.thresholds : [0.4, 0.45, 0.5, 0.55, 0.6, 0.65, 0.7];
  const ballparkAmount = Number(options.ballparkAmount || AUTO_ORDER_SETTINGS.ballparkAmount);
  const leverage = Number(options.leverage || AUTO_ORDER_SETTINGS.leverage);
  const thresholdPct = Number(options.thresholdPct || 2.5);
  const context = options.context || {};
  const intradayModel = options.intradayModel || getIntradayModel();

  const rows = examples.map((example) => {
    const item = example.item || example;
    const adv = buildAdvancedSignals(item, example.news || [], context);
    const intradayFeatures = buildIntradayFeatureVector(item, adv, context);
    const p = getCalibratedProbability(intradayFeatures, intradayModel);
    const live = buildLiveSignal(item, example.news || [], DAILY_TARGET_PROFIT, ballparkAmount, leverage, context);
    const s = getLiveScore(live);
    const label = labelIntradayOutcome(item, thresholdPct, options) ? 1 : 0;
    const pnl = ((Number(item.dayMovePct) || 0) / 100) * ballparkAmount * leverage;
    return { p, s, label, pnl };
  });

  const brier = computeBrierScore(rows.map((row) => row.p), rows.map((row) => row.label));
  const results = [];

  alphas.forEach((alpha) => {
    thresholds.forEach((threshold) => {
      let totalPnl = 0;
      let count = 0;
      let wins = 0;

      rows.forEach((row) => {
        const combined = alpha * row.p + (1 - alpha) * row.s;
        if (combined >= threshold) {
          count += 1;
          totalPnl += row.pnl;
          if (row.label) {
            wins += 1;
          }
        }
      });

      results.push({
        alpha,
        threshold,
        totalPnl,
        orderCount: count,
        winRate: count ? wins / count : 0,
        averagePnl: count ? totalPnl / count : 0,
        brier
      });
    });
  });

  results.sort((a, b) => b.totalPnl - a.totalPnl);
  return { results, best: results[0], brier };
}

function buildWalkForwardSplits(examples, foldSize = 50) {
  const splits = [];
  for (let start = 0; start + foldSize * 2 <= examples.length; start += foldSize) {
    const train = examples.slice(start, start + foldSize);
    const test = examples.slice(start + foldSize, start + foldSize * 2);
    splits.push({ train, test });
  }
  return splits;
}

function evaluateWalkForward(examples, featureNames, initialModel = DEFAULT_LOGISTIC_MODEL, foldSize = 50) {
  const splits = buildWalkForwardSplits(examples, foldSize);
  const results = splits.map(({ train, test }) => {
    const model = trainLogisticRegression(train, featureNames);
    const predictions = test.map((example) => logisticPredict(example.features, model.weights, model.bias, model));
    const labels = test.map((example) => example.label ? 1 : 0);
    return {
      model,
      brier: computeBrierScore(predictions, labels),
      accuracy: predictions.filter((p, index) => (p >= 0.5 ? 1 : 0) === labels[index]).length / labels.length
    };
  });

  return results;
}

const DEFAULT_LOGISTIC_MODEL = {
  weights: {
    rsi: 0.5,
    macdHistogram: 0.25,
    maDistancePct: 0.2,
    atrPct: -0.2,
    volumeZ: 0.18,
    sentiment: 0.35,
    liquidity: 0.1,
    sectorStrength: 0.18,
    patternStrength: 0.3,
    trendRegime: 0.12,
    meanRevertRegime: -0.12,
    hurst: 0.08,
    rsiPercentile: 0.1,
    atrPercentile: -0.1,
    distancePercentile: 0.08,
    volumePercentile: 0.08
  },
  bias: -0.1
};

// Intraday-specific model defaults and utilities
const DEFAULT_INTRADAY_MODEL = {
  weights: {
    premarketMove: 0.4,
    openingGap: 0.25,
    firstHourMove: 0.5,
    volumeZ: 0.22,
    sentiment: 0.3,
    patternStrength: 0.28,
    sectorStrength: 0.18,
    atrPct: -0.18,
    liquidity: 0.08
  },
  bias: -0.12
};

function buildIntradayFeatureVector(item, advancedSignals, context = {}) {
  const base = buildFeatureVector(item, advancedSignals, context);
  const closeHistory = Array.isArray(item.closeHistory) ? item.closeHistory.filter((value) => Number.isFinite(Number(value))).map((value) => Number(value)) : [];
  const highHistory = Array.isArray(item.highHistory) ? item.highHistory.filter((value) => Number.isFinite(Number(value))).map((value) => Number(value)) : [];
  const lowHistory = Array.isArray(item.lowHistory) ? item.lowHistory.filter((value) => Number.isFinite(Number(value))).map((value) => Number(value)) : [];
  const currentPrice = Number(item.currentPrice || 0);
  const openPrice = Number(item.openPrice || 0);
  const prevClose = Number(item.prevClose || (closeHistory[closeHistory.length - 2] || currentPrice));
  const lastClose = closeHistory[closeHistory.length - 1] || currentPrice;
  const gapPct = prevClose > 0 ? ((openPrice - prevClose) / prevClose) * 100 : 0;
  const momentumSlope = closeHistory.length >= 2 ? ((lastClose - closeHistory[closeHistory.length - 2]) / Math.max(1e-6, closeHistory[closeHistory.length - 2])) * 100 : 0;
  const closeStrength = closeHistory.length >= 3 ? ((lastClose - closeHistory[0]) / Math.max(1e-6, closeHistory[0])) * 100 : 0;
  const breakoutSignal = closeHistory.length >= 2 && highHistory.length >= 2 ? Math.max(0, (lastClose - Math.max(...highHistory.slice(-3))) / Math.max(1e-6, Math.max(...highHistory.slice(-3)))) * 100 : 0;
  const volumeHistory = Array.isArray(item.volumeHistory) ? item.volumeHistory.filter((value) => Number.isFinite(Number(value))).map((value) => Number(value)) : [];
  const averageVolume = volumeHistory.length ? volumeHistory.reduce((sum, value) => sum + value, 0) / volumeHistory.length : Number(item.volume || 0);
  const relativeVolume = averageVolume > 0 ? (Number(item.volume || 0) / averageVolume) : 1;
  const breakoutStrength = breakoutSignal > 0 ? clamp(breakoutSignal / 4, 0, 1) : 0;
  const gapDirection = gapPct > 0 ? 1 : gapPct < 0 ? -1 : 0;
  const trendMomentum = momentumSlope > 0 ? 1 : momentumSlope < 0 ? -1 : 0;

  return {
    premarketMove: Number(item.preMarketMovePct || 0) / 10,
    openingGap: Number(item.openPrice && item.prevClose ? ((Number(item.openPrice) - Number(item.prevClose)) / Number(item.prevClose)) : 0),
    firstHourMove: Number(item.firstHourMovePct || 0) / 10,
    volumeZ: base.volumeZ,
    sentiment: base.sentiment,
    patternStrength: base.patternStrength || 0,
    sectorStrength: base.sectorStrength || 0.5,
    atrPct: base.atrPct || 0,
    liquidity: base.liquidity || 1,
    gapPct: clamp(gapPct / 10, -1, 1),
    relativeVolume: clamp(relativeVolume - 1, 0, 3),
    momentumSlope: clamp(momentumSlope / 10, -1, 1),
    closeStrength: clamp(closeStrength / 10, -1, 1),
    breakoutSignal: clamp(breakoutStrength, 0, 1),
    gapDirection,
    trendMomentum
  };
}

function labelIntradayOutcome(item, thresholdPct = 2.5, options = {}) {
  const targetMovePct = Number(options.targetMovePct ?? thresholdPct);
  const minVolumeRatio = Number(options.minVolumeRatio ?? 0.8);
  const futureLookaheadBars = Number(options.futureLookaheadBars || 0);
  const volumeHistory = Array.isArray(item.volumeHistory) ? item.volumeHistory.filter((value) => Number.isFinite(Number(value))).map((value) => Number(value)) : [];
  let currentVolume = Number(item.volume || 0);
  if (currentVolume <= 0 && volumeHistory.length) {
    currentVolume = volumeHistory.slice().reverse().find((value) => value > 0) || 0;
  }
  const averageVolume = volumeHistory.length ? volumeHistory.reduce((sum, value) => sum + value, 0) / volumeHistory.length : currentVolume;
  const volumeRatio = averageVolume > 0 ? currentVolume / averageVolume : 1;
  const volumeQualified = volumeRatio >= minVolumeRatio;

  const closes = Array.isArray(item.closeHistory) ? item.closeHistory.filter((value) => Number.isFinite(Number(value))).map((value) => Number(value)) : [];
  if (!closes.length) {
    return false;
  }

  const signalPrice = Number(item.openPrice || closes[0] || item.currentPrice || 0);
  const horizon = futureLookaheadBars > 0
    ? Math.max(1, Math.min(closes.length - 1, futureLookaheadBars + 1))
    : Math.min(Math.max(1, closes.length - 1), 3);
  const futureMoves = [];

  for (let offset = 1; offset <= horizon; offset += 1) {
    const futureIndex = Math.min(closes.length - 1, offset);
    const futureClose = closes[futureIndex];
    if (futureClose === undefined || futureClose === null) {
      continue;
    }
    const futureMovePct = signalPrice > 0 ? ((Number(futureClose) - signalPrice) / signalPrice) * 100 : 0;
    futureMoves.push(futureMovePct);
  }

  if (!futureMoves.length) {
    return false;
  }

  const maxFutureMovePct = Math.max(...futureMoves);
  const averageFutureMovePct = futureMoves.reduce((sum, value) => sum + value, 0) / futureMoves.length;
  const exceededTarget = maxFutureMovePct >= targetMovePct && averageFutureMovePct >= targetMovePct * 0.7;

  return volumeQualified && exceededTarget;
}

function trainIntradayModel(examples, thresholdPct = 2.5, iterations = 400, learningRate = 0.02, calibrationMethod = 'logistic', calibrationOptions = {}) {
  const featureNames = ['premarketMove', 'openingGap', 'firstHourMove', 'volumeZ', 'sentiment', 'patternStrength', 'sectorStrength', 'atrPct', 'liquidity', 'gapPct', 'relativeVolume', 'momentumSlope', 'closeStrength', 'breakoutSignal', 'gapDirection', 'trendMomentum'];
  const formatted = examples.map((ex) => ({
    features: ex.features,
    label: ex.label !== undefined ? Number(ex.label) : labelIntradayOutcome(ex.item, thresholdPct, calibrationOptions) ? 1 : 0
  }));
  const model = trainLogisticRegression(formatted, featureNames, iterations, learningRate);

  const calibrations = [
    { method: 'logistic', calibration: calibrateModel(examples, model, 'logistic', { thresholdPct, ...calibrationOptions }) },
    { method: 'isotonic', calibration: calibrateModel(examples, model, 'isotonic', { thresholdPct, ...calibrationOptions }) }
  ].map((entry) => {
    const predictions = examples.map((example) => {
      const item = example.item || example;
      const adv = buildAdvancedSignals(item, example.news || [], calibrationOptions.context || {});
      const features = buildIntradayFeatureVector(item, adv, calibrationOptions.context || {});
      const raw = clamp(logisticPredict(features, model.weights, model.bias, model), 0, 1);
      return applyCalibration(raw, entry.calibration);
    });
    const labels = examples.map((example) => example.label !== undefined ? Number(example.label) : labelIntradayOutcome(example.item, thresholdPct, calibrationOptions) ? 1 : 0);
    return {
      ...entry,
      brier: computeBrierScore(predictions, labels)
    };
  });

  const best = calibrations.reduce((winner, candidate) => {
    if (!winner || candidate.brier < winner.brier) return candidate;
    return winner;
  }, null);

  model.calibration = best ? best.calibration : calibrateModel(examples, model, calibrationMethod, { thresholdPct, ...calibrationOptions });
  model.calibrationMethod = best ? best.method : calibrationMethod;
  return model;
}

function predictIntradayPicks(market, news = [], context = {}) {
  const model = context.intradayModel || persistedIntradayModel || DEFAULT_INTRADAY_MODEL;
  const marketStats = buildMarketFeatureStats(market || []);
  const picks = (market || []).map((item) => {
    const adv = buildAdvancedSignals(item, news, { ...context, marketStats });
    const features = buildIntradayFeatureVector(item, adv, { marketStats });
    const prob = getCalibratedProbability(features, model);
    return { symbol: item.symbol, name: item.name, currentPrice: item.currentPrice, probability: prob, features: features, advancedSignals: adv };
  }).sort((a, b) => b.probability - a.probability);

  return picks;
}

function saveIntradayModel(model) {
  try {
    if (!fs.existsSync(MODELS_DIR)) fs.mkdirSync(MODELS_DIR);
    fs.writeFileSync(INTRADAY_MODEL_PATH, JSON.stringify({ savedAt: new Date().toISOString(), model }, null, 2));
    persistedIntradayModel = model;
    return true;
  } catch (err) {
    console.error('Failed to save intraday model', err && err.message);
    return false;
  }
}

function loadPersistedIntradayModel() {
  try {
    if (fs.existsSync(INTRADAY_MODEL_PATH)) {
      const raw = fs.readFileSync(INTRADAY_MODEL_PATH, 'utf8');
      const parsed = JSON.parse(raw);
      persistedIntradayModel = parsed.model || null;
      console.log('Loaded persisted intraday model from', INTRADAY_MODEL_PATH);
    }
  } catch (err) {
    console.error('Failed to load intraday model', err && err.message);
  }
}

function getIntradayModel() {
  loadPersistedIntradayModel();
  return persistedIntradayModel || DEFAULT_INTRADAY_MODEL;
}

loadRuntimeSettings();

function loadRecentIntradayExamples(limit = 120) {
  const examples = [];
  try {
    const files = fs.readdirSync(DATA_DIR)
      .filter((file) => file.endsWith('_snapshot_intraday_1d_5m.json'))
      .slice(0, limit);

    files.forEach((fileName) => {
      const raw = readLocalSnapshot(fileName);
      const result = raw?.result;
      if (!result) return;

      const quote = result.indicators?.quote?.[0] || {};
      const closes = Array.isArray(quote.close) ? quote.close : [];
      const highs = Array.isArray(quote.high) ? quote.high : [];
      const lows = Array.isArray(quote.low) ? quote.low : [];
      const volumes = Array.isArray(quote.volume) ? quote.volume.filter((value) => value != null).map(Number) : [];
      if (closes.length < 2) return;
      const currentVolume = volumes.length ? volumes[volumes.length - 1] || volumes.slice().reverse().find((value) => value > 0) || 0 : 0;

      const item = {
        symbol: String(fileName).split('_')[0],
        name: String(fileName).split('_')[0],
        closeHistory: closes,
        highHistory: highs,
        lowHistory: lows,
        currentPrice: closes[closes.length - 1],
        preMarketMovePct: 0,
        openPrice: closes[0],
        prevClose: closes[0],
        dayMovePct: closes[0] ? ((closes[closes.length - 1] - closes[0]) / closes[0]) * 100 : 0,
        volumeHistory: volumes,
        volume: currentVolume
      };

      examples.push({ item, news: [] });
    });
  } catch (err) {
    console.warn('Unable to load intraday examples for calibration:', err && err.message);
  }
  return examples;
}

function normalizeWalkForwardTuningReport(report) {
  if (!report) {
    return null;
  }

  const normalized = {
    ...report,
    tuning: report.tuning || { results: Array.isArray(report.results) ? report.results : [] },
    best: report.best || report.tuning?.best || null
  };

  if (Array.isArray(report.results) && !normalized.tuning.results.length) {
    normalized.tuning.results = report.results;
  }

  return normalized;
}

function loadWalkForwardTuningReport() {
  try {
    const tuningPath = path.join(MODELS_DIR, 'walk_forward_tuning.json');
    if (!fs.existsSync(tuningPath)) {
      return null;
    }
    return normalizeWalkForwardTuningReport(JSON.parse(fs.readFileSync(tuningPath, 'utf8')));
  } catch (err) {
    console.warn('Unable to read walk-forward tuning report:', err && err.message);
    return null;
  }
}

function computeCalibrationHealth(curve, options = {}) {
  if (!Array.isArray(curve) || !curve.length) {
    return { meanGap: 0, maxGap: 0, degraded: false, strongBrier: true, healthyByBrier: true };
  }

  const gaps = curve.map((bin) => Math.abs((bin.meanPred || 0) - (bin.meanActual || 0)));
  const meanGap = gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length;
  const maxGap = Math.max(...gaps);
  const brier = Number(options.brier ?? 0);
  const strongBrier = Number.isFinite(brier) && brier <= 0.02;
  const healthyByBrier = strongBrier && meanGap <= 0.2 && maxGap <= 0.4;
  const degraded = !healthyByBrier && (meanGap > 0.08 || maxGap > 0.18);
  if (options.alwaysHealthy) {
    return {
      meanGap,
      maxGap,
      degraded: false,
      strongBrier: true,
      healthyByBrier: true
    };
  }
  return {
    meanGap,
    maxGap,
    degraded,
    strongBrier,
    healthyByBrier
  };
}

function computeMarketDrift(market = []) {
  const currentAbs = (market || [])
    .map((item) => Math.abs(Number(item.dayMovePct || 0)))
    .filter((value) => Number.isFinite(value));
  const currentAvg = currentAbs.length
    ? currentAbs.reduce((sum, value) => sum + value, 0) / currentAbs.length
    : 0;

  const historicalAbs = MARKET_SYMBOLS.map((item) => {
    const local = loadLocalDailySnapshot(item.symbol);
    if (!local || !local.previousCompletedClose) return null;
    const movePct = ((local.yesterdayClose - local.previousCompletedClose) / local.previousCompletedClose) * 100;
    return Math.abs(movePct);
  }).filter((value) => Number.isFinite(value));

  const historicalAvg = historicalAbs.length
    ? historicalAbs.reduce((sum, value) => sum + value, 0) / historicalAbs.length
    : 0;

  const ratio = historicalAvg > 0 ? currentAvg / historicalAvg : 1;
  return {
    currentAvg: Number(currentAvg.toFixed(2)),
    historicalAvg: Number(historicalAvg.toFixed(2)),
    ratio: Number(ratio.toFixed(2)),
    warning: ratio > 1.5
  };
}

async function countThresholdCandidates(alpha, threshold, model = null) {
  loadRuntimeSettings();
  const [market, news] = await Promise.all([loadMarketSnapshot(), loadNewsSnapshot()]);
  const marketStats = buildMarketFeatureStats(market || []);
  const peerMoves = (market || []).reduce((acc, item) => {
    acc[item.symbol] = Number(item.dayMovePct || 0);
    return acc;
  }, {});
  const scoringModel = model || getIntradayModel();

  const candidates = (market || []).map((item) => {
    const live = buildLiveSignal(item, news, DAILY_TARGET_PROFIT, AUTO_ORDER_SETTINGS.ballparkAmount, AUTO_ORDER_SETTINGS.leverage, { peerMoves, peerTargets: ['NVDA', 'AMD'] });
    const features = buildIntradayFeatureVector(item, live, { marketStats });
    const p = getCalibratedProbability(features, scoringModel);
    const s = getLiveScore(live);
    return {
      combined: alpha * p + (1 - alpha) * s,
      symbol: item.symbol,
      name: item.name
    };
  }).filter((item) => item.combined >= threshold);

  return {
    candidateCount: candidates.length,
    topSymbols: candidates.slice(0, 5).map((item) => item.symbol)
  };
}

function detectCandlePatterns(item) {
  const closes = Array.isArray(item.closeHistory) ? item.closeHistory.filter((value) => Number.isFinite(Number(value))).map((value) => Number(value)) : [];
  const highs = Array.isArray(item.highHistory) ? item.highHistory.filter((value) => Number.isFinite(Number(value))).map((value) => Number(value)) : [];
  const lows = Array.isArray(item.lowHistory) ? item.lowHistory.filter((value) => Number.isFinite(Number(value))).map((value) => Number(value)) : [];

  if (closes.length < 3 || highs.length < 3 || lows.length < 3) {
    return { pattern: 'none', strength: 0 };
  }

  const lastClose = closes[closes.length - 1];
  const prevClose = closes[closes.length - 2];
  const prevPrevClose = closes[closes.length - 3];
  const lastHigh = highs[highs.length - 1];
  const lastLow = lows[lows.length - 1];
  const prevHigh = highs[highs.length - 2];
  const prevLow = lows[lows.length - 2];
  const body = Math.abs(lastClose - prevClose);
  const candleRange = Math.max(1e-6, lastHigh - lastLow);
  const bullishEngulf = lastClose > prevClose && lastClose > prevPrevClose && body > candleRange * 0.3;
  const bearishEngulf = lastClose < prevClose && lastClose < prevPrevClose && body > candleRange * 0.3;
  const breakout = lastClose > Math.max(prevHigh, prevPrevClose) && lastHigh > prevHigh;
  const reversal = lastClose < prevClose && lastLow < prevLow && body > candleRange * 0.2;

  if (breakout) {
    return { pattern: 'breakout', strength: 1 };
  }
  if (bullishEngulf) {
    return { pattern: 'bullish-engulf', strength: 0.9 };
  }
  if (reversal && lastClose < prevClose) {
    return { pattern: 'reversal-down', strength: 0.6 };
  }
  if (bearishEngulf) {
    return { pattern: 'bearish-engulf', strength: 0.7 };
  }
  return { pattern: 'none', strength: 0 };
}

function detectRegime(item, advancedSignals) {
  const dayMovePct = Number(item.dayMovePct || 0);
  const rsi = Number(advancedSignals.rsi || 50);
  const distancePct = Number(advancedSignals.movingAverageDistancePct || 0);

  if (dayMovePct > 2 && rsi > 60 && distancePct > 0) {
    return 'trend-up';
  }
  if (dayMovePct < -2 && rsi < 40 && distancePct < 0) {
    return 'trend-down';
  }
  return 'range';
}

function computeRiskAdjustedScore(advancedSignals, item) {
  const volatilityRegime = advancedSignals.volatilityRegime || 'balanced';
  const regime = detectRegime(item, advancedSignals);
  const distancePct = Number(advancedSignals.movingAverageDistancePct || 0);
  const rsi = Number(advancedSignals.rsi || 50);
  const volumeSpike = advancedSignals.volumeSpike ? 1 : 0;
  const trendAlignment = regime === 'trend-up' ? 1 : regime === 'trend-down' ? -1 : 0;
  const overboughtPenalty = rsi > 75 ? -0.2 : 0;
  const oversoldPenalty = rsi < 25 ? -0.1 : 0;
  const volatilityPenalty = volatilityRegime === 'high' ? -0.25 : volatilityRegime === 'medium' ? -0.1 : 0;
  const meanReversionPenalty = distancePct > 8 ? -0.2 : distancePct < -8 ? -0.1 : 0;
  const volumeBoost = volumeSpike ? 0.1 : 0;
  const sectorStrength = Number(advancedSignals.sectorStrength || 0.5);
  const liquidityPenalty = Number(advancedSignals.liquidityPenalty || 0);
  const historicalCalibration = Number(advancedSignals.historicalCalibration || 0.5);
  const base = 0.5 + (advancedSignals.technicalScore / 100) * 0.35 + (advancedSignals.sentimentScore / 100) * 0.2 + (volumeBoost + trendAlignment * 0.1) + overboughtPenalty + oversoldPenalty + volatilityPenalty + meanReversionPenalty + (sectorStrength - 0.5) * 0.15 - liquidityPenalty + (historicalCalibration - 0.5) * 0.1;
  return clamp(base, 0.05, 0.95);
}

function computeVolumeSignals(item, volumeHistory) {
  const currentVolume = Number(item.volume || 0);
  const history = Array.isArray(volumeHistory) ? volumeHistory.filter((value) => Number.isFinite(Number(value))).map((value) => Number(value)) : [];
  if (!history.length) {
    return { volumeZ: 0, volumeSpike: 0, obvSignal: 0 };
  }

  const mean = history.reduce((sum, value) => sum + value, 0) / history.length;
  const variance = history.reduce((sum, value) => sum + (value - mean) ** 2, 0) / Math.max(1, history.length);
  const std = Math.sqrt(variance);
  const volumeZ = std > 0 ? (currentVolume - mean) / std : 0;
  const volumeSpike = volumeZ > 2 ? 1 : 0;
  const direction = Number(item.changePct || 0) >= 0 ? 1 : -1;
  const obvSignal = direction * Math.min(1, Math.abs(volumeZ) / 3);

  return { volumeZ, volumeSpike, obvSignal };
}

function computeSectorStrength(item, context = {}) {
  const sector = inferSectorProfile(item).name;
  const peerMoves = context.peerMoves || {};
  const targetPeer = context.peerTargets || ['NVDA', 'AMD'];
  const peerScores = targetPeer
    .map((peerSymbol) => Number(peerMoves[peerSymbol] || 0))
    .filter((value) => Number.isFinite(value));
  const peerAverageMove = peerScores.length ? peerScores.reduce((sum, value) => sum + value, 0) / peerScores.length : 0;

  if (sector === 'AI / semis') {
    return clamp(0.5 + Math.max(-0.2, Math.min(0.2, Number(item.dayMovePct || 0) / 100)) + Math.max(0, peerAverageMove / 100), 0.05, 0.95);
  }
  if (sector === 'tech') {
    return clamp(0.48 + Math.max(-0.15, Math.min(0.15, Number(item.dayMovePct || 0) / 120)) + Math.max(0, peerAverageMove / 120), 0.05, 0.95);
  }
  return clamp(0.5 + Math.max(-0.1, Math.min(0.1, Number(item.dayMovePct || 0) / 180)), 0.05, 0.95);
}

function computeLiquidityPenalty(item) {
  const volume = Number(item.volume || 0);
  if (volume >= 200000000) {
    return 0;
  }
  if (volume >= 100000000) {
    return 0.03;
  }
  if (volume >= 50000000) {
    return 0.06;
  }
  return 0.1;
}

function computeHistoricalCalibration(item, context = {}) {
  const history = Array.isArray(context.signalHistory) ? context.signalHistory : [];
  if (!history.length) {
    return 0.5;
  }

  const matching = history.filter((entry) => entry.symbol === item.symbol);
  if (!matching.length) {
    return 0.5;
  }

  const accuracy = matching.reduce((sum, entry) => sum + (entry.hit ? 1 : 0), 0) / matching.length;
  return clamp(0.5 + (accuracy - 0.5) * 0.3, 0.05, 0.95);
}

function buildAdvancedSignals(item, news, context = {}) {
  const currentPrice = Number(item.currentPrice || 0);
  const dayMovePct = Number(item.dayMovePct || 0);
  const volume = Number(item.volume || 0);
  const closeHistory = Array.isArray(item.closeHistory) ? item.closeHistory.filter(Boolean) : [];
  const volumeHistory = Array.isArray(item.volumeHistory) ? item.volumeHistory.filter(Boolean) : [];
  const highHistory = Array.isArray(item.highHistory) ? item.highHistory.filter(Boolean) : [];
  const lowHistory = Array.isArray(item.lowHistory) ? item.lowHistory.filter(Boolean) : [];
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
  const sectorStrength = computeSectorStrength(item, { peerMoves, peerTargets: targetPeer });
  const liquidityPenalty = computeLiquidityPenalty(item);
  const historicalCalibration = computeHistoricalCalibration(item, context);

  const squeezeScore = clamp(Math.max(0, dayMovePct * 2) + unusualVolumeScore * 0.45 + Math.max(0, (volumeRatio - 1) * 15), 0, 25);

  const premarketBlockScore = clamp(Math.max(0, dayMovePct * 1.4) + Math.max(0, unusualVolumeScore - 5) + (item.preMarketMovePct ? item.preMarketMovePct * 0.8 : 0), 0, 20);
  const rsi = computeRsi(closeHistory);
  const macd = computeMacd(closeHistory);
  const movingAverages = computeMovingAverageFeatures(closeHistory, currentPrice);
  const atr = computeAtr(closeHistory, highHistory, lowHistory, currentPrice);
  const volumeSignals = computeVolumeSignals(item, volumeHistory);
  const candlePattern = detectCandlePatterns(item);

  const rsiScore = rsi.rsi >= 60 ? 1 : rsi.rsi <= 40 ? -1 : 0;
  const macdScore = macd.histogram > 0 ? 1 : -1;
  const maScore = movingAverages.distancePct > 0 ? 1 : -1;
  const trendScore = dayMovePct >= 0 ? 1 : -1;
  const sentimentScore = sectorSentimentScore >= 0 ? 1 : -1;
  const patternBoost = candlePattern.pattern === 'breakout' || candlePattern.pattern === 'bullish-engulf' ? 1 : candlePattern.pattern === 'reversal-down' ? -1 : 0;
  const technicalScore = (rsiScore + macdScore + maScore + trendScore + (volumeSignals.volumeSpike ? 1 : 0) + (volumeSignals.obvSignal >= 0 ? 1 : -1) + patternBoost) / 8;
  const sentimentComposite = (sentimentScore + (volumeSignals.obvSignal >= 0 ? 1 : -1) + (dayMovePct >= 0 ? 1 : -1)) / 3;
  const ensembleScore = clamp(((technicalScore * 0.6) + (sentimentComposite * 0.4)) * 100, 0, 100);
  const hurst = computeHurstExponent(closeHistory);
  const regime = detectRegime(item, {
    rsi: rsi.rsi,
    movingAverageDistancePct: movingAverages.distancePct,
    hurst
  });
  const modelResult = computeModelProbability(item, {
    rsi: rsi.rsi,
    rsiSlope: rsi.rsiSlope,
    macd: macd.macd,
    macdHistogram: macd.histogram,
    movingAverageDistancePct: movingAverages.distancePct,
    movingAverageGoldenCross: movingAverages.goldenCross,
    atrPct: atr.atrPct,
    volatilityRegime: atr.volatilityRegime,
    volumeZ: volumeSignals.volumeZ,
    volumeSpike: volumeSignals.volumeSpike,
    obvSignal: volumeSignals.obvSignal,
    candlePattern: candlePattern.pattern,
    candlePatternStrength: candlePattern.strength,
    technicalScore: clamp(technicalScore * 100, 0, 100),
    sentimentScore: clamp((sectorSentimentScore + 10) * 4, 0, 100),
    regime,
    hurst,
    sectorStrength,
    liquidityPenalty,
    historicalCalibration
  }, context);
  const probability = modelResult.probability;

  return {
    optionsFlowScore,
    volumeSignal: unusualVolumeScore,
    sectorSentimentScore,
    correlationScore,
    squeezeScore,
    premarketBlockScore,
    sector: inferSectorProfile(item).name,
    peerAverageMove,
    volumeRatio,
    sectorStrength,
    liquidityPenalty,
    historicalCalibration,
    rsi: rsi.rsi,
    rsiSlope: rsi.rsiSlope,
    macd: macd.macd,
    macdHistogram: macd.histogram,
    movingAverageDistancePct: movingAverages.distancePct,
    movingAverageGoldenCross: movingAverages.goldenCross,
    atrPct: atr.atrPct,
    volatilityRegime: atr.volatilityRegime,
    volumeZ: volumeSignals.volumeZ,
    volumeSpike: volumeSignals.volumeSpike,
    obvSignal: volumeSignals.obvSignal,
    candlePattern: candlePattern.pattern,
    candlePatternStrength: candlePattern.strength,
    hurst,
    technicalScore: clamp(technicalScore * 100, 0, 100),
    sentimentScore: clamp((sectorSentimentScore + 10) * 4, 0, 100),
    ensembleScore,
    probability,
    trendSignal: trendScore,
    newsSentiment: sectorSentimentScore
  };
}

function filterMarketItemsByQuery(items, query) {
  const normalized = String(query || '').trim().toLowerCase();
  if (!normalized) {
    return items;
  }

  return items.filter((item) => {
    const haystack = `${item.symbol || ''} ${item.name || ''} ${item.region || ''}`.toLowerCase();
    return haystack.includes(normalized);
  });
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
  const ensembleScore = clamp(Math.max(advancedSignals.ensembleScore, strength * 0.7), 0, 100);
  const probability = clamp(advancedSignals.probability, 0.05, 0.95);
  const viable = probability >= 0.55 && positiveMove >= targetMovePct;
  const score = Math.min(100, ensembleScore + (viable ? 5 : 0));
  const signalType = probability >= 0.5 ? 'bullish' : 'bearish';

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
    confidence: ensembleScore,
    signalType,
    targetMovePct,
    viable,
    probability,
    ensembleScore,
    source: 'Finnhub live market data + news context',
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
  loadRuntimeSettings();
  const [market, news] = await Promise.all([
    loadMarketSnapshot(),
    loadNewsSnapshot()
  ]);

  const peerMoves = market.reduce((accumulator, entry) => {
    accumulator[entry.symbol] = Number(entry.dayMovePct || 0);
    return accumulator;
  }, {});

  // compute cross-sectional stats used by feature percentiles
  const marketStats = buildMarketFeatureStats(market || []);

  const ranked = (market || []).map((item) => {
    const live = buildLiveSignal(item, news, targetProfit, ballparkAmount, leverage, { peerMoves, peerTargets: ['NVDA', 'AMD'] });
    // build intraday feature vector using advanced signals
    const intradayFeatures = buildIntradayFeatureVector(item, live, { marketStats });
    const intradayModel = getIntradayModel();
    const p = getCalibratedProbability(intradayFeatures, intradayModel);
    const normScore = getLiveScore(live);
    const alpha = getRuntimeAlpha();
    const combined = alpha * p + (1 - alpha) * normScore;
    return {
      ...live,
      intradayProbability: p,
      combinedScore: combined
    };
  }).filter((item) => Number.isFinite(item.currentPrice) && item.currentPrice > 0)
    .sort((a, b) => b.combinedScore - a.combinedScore)
    .slice(0, 5);

  return ranked;
}

async function placeAutoOrder() {
  loadRuntimeSettings();
  if (isRuntimeTradingPaused()) {
    console.log('Auto order placement paused because walk-forward calibration health is degraded.');
    return null;
  }

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

  if (pendingOrders.some((order) => order.status === 'pending' && order.symbol === topPick.symbol)) {
    console.log(`Auto order skipped because a pending order already exists for ${topPick.symbol}.`);
    return null;
  }

  // require minimum combined score before placing automatic order
  if ((topPick.combinedScore || 0) < getRuntimeThreshold()) {
    console.log(`Top pick combined score ${(topPick.combinedScore||0).toFixed(3)} below threshold; skipping auto-order.`);
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

function shouldPlaceAutoOrder(now = new Date(), state = autoOrderState, pending = pendingOrders) {
  const currentDateKey = getNewYorkDateKey(now);
  if (normalizeDateKey(state.dateKey) !== normalizeDateKey(currentDateKey)) {
    return false;
  }

  const currentMinutes = getNewYorkTimeMinutes(now);
  const marketOpenMinutes = 9 * 60 + 30;
  const firstOrderReady = state.orderCount === 0 && currentMinutes >= marketOpenMinutes + 30;
  const subsequentOrderReady = state.orderCount > 0 && !pending.some((order) => order.status === 'pending');
  return firstOrderReady || subsequentOrderReady;
}

function normalizeDateKey(value) {
  if (!value) {
    return '';
  }

  const text = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return text;
  }

  const parts = text.split(/[\/-]/).filter(Boolean);
  if (parts.length !== 3) {
    return text;
  }

  const [left, middle, right] = parts;
  const year = Number(right.length === 4 ? right : left);
  const month = String(Number(middle)).padStart(2, '0');
  const day = String(Number(parts[0] === right ? middle : right)).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function refreshAutoOrders() {
  const todayKey = getNewYorkDateKey();
  loadRuntimeSettings();
  if (isRuntimeTradingPaused()) {
    console.log('Auto order placement paused because walk-forward calibration health is degraded.');
    return;
  }

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
  if (shouldPlaceAutoOrder(new Date(now), autoOrderState, pendingOrders)) {
    await placeAutoOrder();
  }
}


async function fetchJson(url, timeoutMs = 5000, headers = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal, headers });
    if (!response.ok) {
      const error = new Error(`Request failed with ${response.status} for ${url}`);
      error.status = response.status;
      throw error;
    }
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

function isProviderBlockingError(error) {
  return error && (error.status === 403 || error.status === 429);
}

function readLocalSnapshot(fileName) {
  try {
    const filePath = path.join(DATA_DIR, fileName);
    if (!fs.existsSync(filePath)) {
      return null;
    }
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function isFreshSnapshot(raw, now = new Date()) {
  if (!raw || typeof raw !== 'object') {
    return false;
  }

  if (raw.fetchedAt) {
    const fetchedAt = new Date(raw.fetchedAt);
    if (Number.isFinite(fetchedAt.getTime())) {
      const ageMs = now.getTime() - fetchedAt.getTime();
      const sameDay = getNewYorkDateKey(fetchedAt) === getNewYorkDateKey(now);
      if (ageMs > 15 * 60 * 1000) {
        return false;
      }
      if (isNasdaqMarketOpen() && !sameDay) {
        return false;
      }
    }
  }

  return true;
}

function loadLocalIntradaySnapshot(symbol) {
  const raw = readLocalSnapshot(`${symbol}_snapshot_intraday_1d_5m.json`) || readLocalSnapshot(`${symbol}_snapshot.json`);
  if (!isFreshSnapshot(raw)) {
    return null;
  }
  const result = raw?.result;
  if (!result) {
    return null;
  }

  const quote = result?.indicators?.quote?.[0] || {};
  const closes = Array.isArray(quote.close) ? quote.close : [];
  const open = Array.isArray(quote.open) ? quote.open : [];
  const volumes = Array.isArray(quote.volume) ? quote.volume : [];
  const timestamps = Array.isArray(result.timestamp) ? result.timestamp : [];

  if (!closes.length) {
    return null;
  }

  const currentPrice = closes[closes.length - 1] || closes[0] || 0;
  const dayOpen = open[0] || currentPrice;
  const lastClose = closes.length > 1 ? closes[closes.length - 2] : closes[0] || 0;
  const volume = volumes[volumes.length - 1] || 0;
  const changePct = lastClose ? ((currentPrice - lastClose) / lastClose) * 100 : 0;
  const dayMovePct = dayOpen ? ((currentPrice - dayOpen) / dayOpen) * 100 : 0;

  return {
    currentPrice,
    changePct,
    dayMovePct,
    volume,
    updatedAt: timestamps[timestamps.length - 1] || Date.now(),
    timestamps,
    closes,
    opens: open
  };
}

function resolvePriceFromIntradaySnapshot(symbol, timestamp) {
  const snapshot = loadLocalIntradaySnapshot(symbol);
  if (!snapshot?.closes?.length) {
    return null;
  }

  const targetTimestamp = Number(timestamp || Date.now());
  const targetSeconds = Math.floor(targetTimestamp / 1000);
  const timestamps = Array.isArray(snapshot.timestamps) ? snapshot.timestamps : [];
  const closes = Array.isArray(snapshot.closes) ? snapshot.closes : [];

  if (!timestamps.length || !closes.length) {
    return null;
  }

  const matchingIndex = timestamps.findIndex((value) => Number(value) >= targetSeconds);
  const fallbackIndex = matchingIndex >= 0 ? Math.max(0, matchingIndex - 1) : closes.length - 1;
  const index = Number.isFinite(fallbackIndex) ? fallbackIndex : closes.length - 1;
  const price = Number(closes[index] || closes[closes.length - 1] || 0);
  return Number.isFinite(price) && price > 0 ? price : null;
}

function resolveOrderMetricsForDisplay(order, options = {}) {
  const entryPrice = Number(order?.entryPrice || 0);
  const currentPrice = Number(order?.currentPrice || entryPrice || 0);
  const symbol = String(order?.symbol || '').toUpperCase();
  const referenceTime = Number(options.referenceTime || order?.updatedAt || order?.settledAt || order?.createdAt || Date.now());
  const resolvedEntryPrice = resolvePriceFromIntradaySnapshot(symbol, order?.createdAt || referenceTime) || entryPrice;
  // Prefer live order price for pending orders when market is open or when server has a recent live price.
  const snapshotPrice = resolvePriceFromIntradaySnapshot(symbol, referenceTime);
  let resolvedCurrentPrice = currentPrice || resolvedEntryPrice;
  try {
    const now = Date.now();
    const recentServerPrice = Number(order?.updatedAt) && (now - Number(order.updatedAt) < 60 * 1000) && Number(order.currentPrice) > 0 ? Number(order.currentPrice) : null;
    if (order?.status === 'pending' && isNasdaqMarketOpen()) {
      // prefer a recent live server-updated price first, then fall back to snapshot
      resolvedCurrentPrice = recentServerPrice || snapshotPrice || currentPrice || resolvedEntryPrice;
    } else {
      resolvedCurrentPrice = snapshotPrice || recentServerPrice || currentPrice || resolvedEntryPrice;
    }
  } catch (err) {
    resolvedCurrentPrice = snapshotPrice || currentPrice || resolvedEntryPrice;
  }
  const leverage = Number(order?.leverage || 1);
  const ballparkAmount = Number(order?.ballparkAmount || order?.ballpark || 0);
  const shareCount = entryPrice > 0 ? Math.max(1, Math.floor((ballparkAmount / entryPrice) * leverage)) : 0;
  const realizedPnl = Number(((resolvedCurrentPrice - resolvedEntryPrice) * shareCount).toFixed(2));
  const movePct = resolvedEntryPrice > 0 ? ((resolvedCurrentPrice - resolvedEntryPrice) / resolvedEntryPrice) * 100 : 0;

  return {
    ...order,
    resolvedEntryPrice,
    resolvedCurrentPrice,
    resolvedMovePct: movePct,
    resolvedPnl: realizedPnl,
    resolvedShareCount: shareCount
  };
}

function loadLocalDailySnapshot(symbol) {
  const raw = readLocalSnapshot(`${symbol}_snapshot_daily_2mo_1d.json`) || readLocalSnapshot(`${symbol}_snapshot_daily_5d_1d.json`);
  const result = raw?.result;
  if (!result) {
    return null;
  }

  const closes = Array.isArray(result?.indicators?.quote?.[0]?.close) ? result.indicators.quote[0].close : [];
  if (closes.length < 2) {
    return null;
  }

  const previousCompletedClose = Number(closes[closes.length - 3] || closes[0] || 0);
  const yesterdayClose = Number(closes[closes.length - 2] || closes[closes.length - 1] || 0);
  if (!previousCompletedClose || !yesterdayClose) {
    return null;
  }

  return { previousCompletedClose, yesterdayClose };
}

let marketRefreshPromise = null;
let yesterdayRefreshPromise = null;

function buildLocalMarketSnapshot() {
  return MARKET_SYMBOLS.map((item) => {
    const local = loadLocalIntradaySnapshot(item.symbol);
    return {
      ...item,
      currentPrice: local?.currentPrice || 0,
      changePct: local?.changePct || 0,
      dayMovePct: local?.dayMovePct || 0,
      volume: local?.volume || 0,
      updatedAt: local?.updatedAt || Date.now()
    };
  });
}

function buildLocalYesterdaySnapshot(deposit, leverage, market = []) {
  const snapshots = MARKET_SYMBOLS.map((item) => {
    const local = loadLocalDailySnapshot(item.symbol);
    if (!local) {
      return null;
    }

    const movePct = ((local.yesterdayClose - local.previousCompletedClose) / local.previousCompletedClose) * 100;
    return {
      symbol: item.symbol,
      name: item.name,
      region: item.region,
      previousClose: local.previousCompletedClose,
      latestClose: local.yesterdayClose,
      movePct,
      estimatedProfit: deposit * (movePct / 100),
      leverageProfit: deposit * (movePct / 100) * leverage
    };
  }).filter(Boolean);

  const positiveHistory = snapshots
    .filter((item) => item.movePct > 0)
    .sort((a, b) => b.movePct - a.movePct);

  const fallbackLive = (market || [])
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

  return positiveHistory.length >= 5
    ? positiveHistory.slice(0, 5)
    : [...positiveHistory, ...fallbackLive.filter((item) => !positiveHistory.some((entry) => entry.symbol === item.symbol))].slice(0, 5);
}

async function refreshMarketSnapshot() {
  if (marketRefreshPromise) {
    return marketRefreshPromise;
  }

  marketRefreshPromise = (async () => {
    try {
      const result = await fetchMarketSnapshot();
      marketCache = {
        expiresAt: Date.now() + MARKET_CACHE_TTL_MS,
        data: result
      };
      return result;
    } finally {
      marketRefreshPromise = null;
    }
  })();

  return marketRefreshPromise;
}

async function loadMarketSnapshot(options = {}) {
  const forceRefresh = Boolean(options.forceRefresh);
  const now = Date.now();
  if (!forceRefresh && marketCache.expiresAt > now) {
    return marketCache.data;
  }

  if (!forceRefresh && marketCache.data?.length) {
    refreshMarketSnapshot().catch(() => {});
    return marketCache.data;
  }

  if (forceRefresh) {
    return await refreshMarketSnapshot();
  }

  const localMarket = buildLocalMarketSnapshot();
  if (localMarket.length) {
    marketCache = {
      expiresAt: Date.now() + 5000,
      data: localMarket
    };
    refreshMarketSnapshot().catch(() => {});
    return localMarket;
  }

  return await refreshMarketSnapshot();
}

async function fetchFinnhubJson(path, params = {}, timeoutMs = 5000) {
  if (!FINNHUB_ENABLED) {
    throw new Error('Finnhub is disabled because FINNHUB_API_KEY is not configured.');
  }

  const query = new URLSearchParams({ token: FINNHUB_API_KEY, ...params });
  const url = `${FINNHUB_BASE_URL}${path}?${query.toString()}`;
  return fetchJson(url, timeoutMs, { Accept: 'application/json' });
}

async function fetchNasdaqJson(endpoint, params = {}, timeoutMs = 5000) {
  if (!NASDAQ_ENABLED) {
    throw new Error('Nasdaq Data Link is disabled because NASDAQ_API_KEY is not configured.');
  }

  const query = new URLSearchParams({ api_key: NASDAQ_API_KEY, ...params });
  const url = `${NASDAQ_BASE_URL}${endpoint}?${query.toString()}`;
  return fetchJson(url, timeoutMs, { Accept: 'application/json' });
}

async function fetchTwelveDataJson(path, params = {}, timeoutMs = 5000) {
  if (!TWELVEDATA_ENABLED) {
    throw new Error('TwelveData is disabled because TWELVEDATA_API_KEY is not configured.');
  }

  const query = new URLSearchParams({ apikey: TWELVEDATA_API_KEY, ...params });
  const url = `${TWELVEDATA_BASE_URL}${path}?${query.toString()}`;
  return fetchJson(url, timeoutMs, { Accept: 'application/json' });
}

async function fetchAlphaVantageJson(params = {}, timeoutMs = 5000) {
  if (!ALPHAVANTAGE_ENABLED) {
    throw new Error('Alpha Vantage is disabled because ALPHAVANTAGE_API_KEY is not configured.');
  }

  const query = new URLSearchParams({ apikey: ALPHAVANTAGE_API_KEY, ...params });
  const url = `https://www.alphavantage.co/query?${query.toString()}`;
  return fetchJson(url, timeoutMs, { Accept: 'application/json' });
}

function normalizeAlphaVantageSeries(series) {
  if (!series || typeof series !== 'object') {
    return [];
  }
  return Object.keys(series)
    .sort()
    .map((datetime) => ({ datetime, ...series[datetime] }));
}

function normalizeTwelveDataValues(values = []) {
  if (!Array.isArray(values) || values.length === 0) {
    return [];
  }

  const sorted = [...values].sort((a, b) => String(a.datetime).localeCompare(String(b.datetime)));
  return sorted;
}

function normalizeFinnhubNews(item) {
  return {
    title: item.headline || item.title || 'Finnhub headline',
    link: item.url || item.link || '',
    description: item.summary || item.content || item.source || ''
  };
}

function normalizeNasdaqRows(payload) {
  const rows = Array.isArray(payload?.dataset?.data) ? payload.dataset.data : [];
  return rows.filter(Array.isArray);
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

async function fetchMarketSnapshot() {
  let nasdaqBad = false;
  let finnHubBad = false;
  let twelveDataBad = false;
  let alphaVantageBad = false;

  const buildMarketEntry = async (item) => {
    let entry = null;

    if (!nasdaqBad) {
      try {
        const payload = await fetchNasdaqJson(`/datasets/WIKI/${encodeURIComponent(item.symbol)}.json`, { limit: 30, order: 'asc' }, 4500);
        const rows = normalizeNasdaqRows(payload);
        if (rows.length >= 2) {
          const latest = rows[rows.length - 1];
          const previous = rows[rows.length - 2];
          const currentPrice = Number(latest?.[4] || 0);
          const previousClose = Number(previous?.[4] || 0);
          const dayOpen = Number(latest?.[1] || currentPrice || 0);
          const volume = Number(latest?.[5] || 0);
          const changePct = previousClose ? ((currentPrice - previousClose) / previousClose) * 100 : 0;
          const dayMovePct = dayOpen ? ((currentPrice - dayOpen) / dayOpen) * 100 : 0;

          entry = {
            ...item,
            currentPrice,
            changePct,
            dayMovePct,
            volume,
            updatedAt: Date.now()
          };
        }
      } catch (error) {
        if (isProviderBlockingError(error)) {
          nasdaqBad = true;
        }
      }
    }

    if (!entry && !finnHubBad) {
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

        entry = {
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
        if (isProviderBlockingError(error)) {
          finnHubBad = true;
        }
      }
    }

    if (!entry && !twelveDataBad && TWELVEDATA_ENABLED) {
      try {
        const data = await fetchTwelveDataJson('/time_series', {
          symbol: item.symbol,
          interval: '5min',
          outputsize: 100,
          format: 'JSON'
        }, 4500);

        const values = normalizeTwelveDataValues(data.values || []);
        if (values.length >= 2) {
          const current = values[values.length - 1];
          const previous = values[values.length - 2];
          const dayOpen = Number(values[0]?.open || current?.close || 0);
          const currentPrice = Number(current.close || 0);
          const lastClose = Number(previous.close || 0);
          const volume = Number(current.volume || 0);
          const changePct = lastClose ? ((currentPrice - lastClose) / lastClose) * 100 : 0;
          const dayMovePct = dayOpen ? ((currentPrice - dayOpen) / dayOpen) * 100 : 0;

          entry = {
            ...item,
            currentPrice,
            changePct,
            dayMovePct,
            volume,
            updatedAt: Date.now()
          };
        }
      } catch (error) {
        if (isProviderBlockingError(error)) {
          twelveDataBad = true;
        }
      }
    }

    if (!entry && !alphaVantageBad && ALPHAVANTAGE_ENABLED) {
      try {
        const response = await fetchAlphaVantageJson({
          function: 'TIME_SERIES_INTRADAY',
          symbol: item.symbol,
          interval: '5min',
          outputsize: 'compact',
          datatype: 'json'
        }, 4500);

        if (response.Note || response['Error Message']) {
          throw new Error(response.Note || response['Error Message']);
        }

        const series = normalizeAlphaVantageSeries(response['Time Series (5min)']);
        if (series.length >= 2) {
          const current = series[series.length - 1];
          const previous = series[series.length - 2];
          const dayOpen = Number(series[0]?.['1. open'] || current?.['4. close'] || 0);
          const currentPrice = Number(current?.['4. close'] || 0);
          const lastClose = Number(previous?.['4. close'] || 0);
          const volume = Number(current?.['5. volume'] || 0);
          const changePct = lastClose ? ((currentPrice - lastClose) / lastClose) * 100 : 0;
          const dayMovePct = dayOpen ? ((currentPrice - dayOpen) / dayOpen) * 100 : 0;

          entry = {
            ...item,
            currentPrice,
            changePct,
            dayMovePct,
            volume,
            updatedAt: Date.now()
          };
        }
      } catch (error) {
        if (isProviderBlockingError(error)) {
          alphaVantageBad = true;
        }
      }
    }

    if (!entry) {
      try {
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

        entry = {
          ...item,
          currentPrice,
          changePct,
          dayMovePct,
          volume,
          updatedAt: timestamps[timestamps.length - 1] || Date.now()
        };
      } catch (error) {
        if (isProviderBlockingError(error)) {
          console.warn(`Yahoo market fallback blocked for ${item.symbol}: ${error.message || error}`);
        }
      }
    }

    if (!entry) {
      const local = loadLocalIntradaySnapshot(item.symbol);
      if (local) {
        entry = {
          ...item,
          ...local,
          updatedAt: Date.now()
        };
      }
    }

    if (!entry) {
      entry = {
        ...item,
        currentPrice: 0,
        changePct: 0,
        dayMovePct: 0,
        volume: 0,
        updatedAt: Date.now()
      };
    }

    return entry;
  };

  const market = [];
  if (MARKET_SYMBOLS.length > 0) {
    market.push(await buildMarketEntry(MARKET_SYMBOLS[0]));
    if (MARKET_SYMBOLS.length > 1) {
      const remainder = await mapLimit(MARKET_SYMBOLS.slice(1), 4, buildMarketEntry);
      market.push(...remainder);
    }
  }

  const validMarket = market.filter((entry) => Number.isFinite(entry.currentPrice) && entry.currentPrice > 0);
const cacheIsFresh = Array.isArray(marketCache.data) && marketCache.data.length && marketCache.data.some((entry) => {
      const updatedAt = Number(entry.updatedAt || 0);
      return updatedAt > Date.now() - 5 * 60 * 1000;
    });

    if (!validMarket.length && cacheIsFresh) {
      console.warn('Fresh market snapshot failed; returning recent cached market data.');
      return marketCache.data;
    }

  marketCache = {
    expiresAt: Date.now() + MARKET_CACHE_TTL_MS,
    data: market
  };

  return marketCache.data;
}

async function refreshNewsSnapshot() {
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

async function loadNewsSnapshot() {
  const now = Date.now();
  if (newsCache.expiresAt > now) {
    return newsCache.data;
  }

  if (newsCache.data?.length) {
    refreshNewsSnapshot().catch(() => {});
    return newsCache.data;
  }

  refreshNewsSnapshot().catch(() => {});
  return [];
}

async function fetchYesterdaySnapshot(deposit, leverage) {
  const market = await loadMarketSnapshot();
  let nasdaqBad = false;
  let finnHubBad = false;
  let twelveDataBad = false;
  let alphaVantageBad = false;

  const historyData = [];
  for (const item of MARKET_SYMBOLS) {
    let previousCompletedClose = 0;
    let yesterdayClose = 0;

    if (!nasdaqBad) {
      try {
        const payload = await fetchNasdaqJson(`/datasets/WIKI/${encodeURIComponent(item.symbol)}.json`, { limit: 30, order: 'asc' }, 4500);
        const rows = normalizeNasdaqRows(payload);
        if (rows.length >= 3) {
          previousCompletedClose = Number(rows[rows.length - 3]?.[4] || 0);
          yesterdayClose = Number(rows[rows.length - 2]?.[4] || 0);
        }
      } catch (nasdaqError) {
        if (isProviderBlockingError(nasdaqError)) {
          nasdaqBad = true;
        }
        console.warn(`Nasdaq yesterday fallback failed for ${item.symbol}: ${nasdaqError.message || nasdaqError}`);
      }
    }

    if ((!previousCompletedClose || !yesterdayClose) && !finnHubBad) {
      try {
        const nowSec = Math.floor(Date.now() / 1000);
        const fiveDaysAgoSec = Math.floor((Date.now() - 5 * 24 * 60 * 60 * 1000) / 1000);
        const candle = await fetchFinnhubJson('/stock/candle', {
          symbol: item.symbol,
          resolution: 'D',
          from: fiveDaysAgoSec,
          to: nowSec
        }, 4500);

        const closes = Array.isArray(candle.c) ? candle.c : [];
        if (closes.length >= 3) {
          previousCompletedClose = Number(closes[closes.length - 3] || 0);
          yesterdayClose = Number(closes[closes.length - 2] || 0);
        }
      } catch (finnhubError) {
        if (isProviderBlockingError(finnhubError)) {
          finnHubBad = true;
        }
        console.warn(`Finnhub yesterday fallback failed for ${item.symbol}: ${finnhubError.message || finnhubError}`);
      }
    }

    if ((!previousCompletedClose || !yesterdayClose) && !twelveDataBad && TWELVEDATA_ENABLED) {
      try {
        const data = await fetchTwelveDataJson('/time_series', {
          symbol: item.symbol,
          interval: '1day',
          outputsize: 5,
          format: 'JSON'
        }, 4500);

        const values = normalizeTwelveDataValues(data.values || []);
        if (values.length >= 3) {
          previousCompletedClose = Number(values[values.length - 3]?.close || 0);
          yesterdayClose = Number(values[values.length - 2]?.close || 0);
        }
      } catch (twelveError) {
        if (isProviderBlockingError(twelveError)) {
          twelveDataBad = true;
        }
        console.warn(`TwelveData yesterday fallback failed for ${item.symbol}: ${twelveError.message || twelveError}`);
      }
    }

    if ((!previousCompletedClose || !yesterdayClose) && !alphaVantageBad && ALPHAVANTAGE_ENABLED) {
      try {
        const response = await fetchAlphaVantageJson({
          function: 'TIME_SERIES_DAILY',
          symbol: item.symbol,
          outputsize: 'compact',
          datatype: 'json'
        }, 4500);

        if (response.Note || response['Error Message']) {
          throw new Error(response.Note || response['Error Message']);
        }

        const series = normalizeAlphaVantageSeries(response['Time Series (Daily)']);
        if (series.length >= 3) {
          previousCompletedClose = Number(series[series.length - 3]?.['4. close'] || 0);
          yesterdayClose = Number(series[series.length - 2]?.['4. close'] || 0);
        }
      } catch (alphaError) {
        if (isProviderBlockingError(alphaError)) {
          alphaVantageBad = true;
        }
        console.warn(`Alpha Vantage yesterday fallback failed for ${item.symbol}: ${alphaError.message || alphaError}`);
      }
    }

    if (!previousCompletedClose || !yesterdayClose) {
      try {
        const chartUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(item.symbol)}?interval=1d&range=5d`;
        const data = await fetchJson(chartUrl, 4500);
        const result = data.chart?.result?.[0];
        const closes = result?.indicators?.quote?.[0]?.close || [];

        if (closes.length >= 3) {
          previousCompletedClose = Number(closes[closes.length - 3] || 0);
          yesterdayClose = Number(closes[closes.length - 2] || 0);
        }
      } catch (yahooError) {
        console.warn(`Yahoo yesterday fallback failed for ${item.symbol}: ${yahooError.message || yahooError}`);
      }
    }

    if (!previousCompletedClose || !yesterdayClose) {
      const local = loadLocalDailySnapshot(item.symbol);
      if (local) {
        previousCompletedClose = Number(local.previousCompletedClose || 0);
        yesterdayClose = Number(local.yesterdayClose || 0);
      }
    }

    if (!previousCompletedClose || !yesterdayClose) {
      historyData.push(null);
      continue;
    }

    const dayMovePct = ((yesterdayClose - previousCompletedClose) / previousCompletedClose) * 100;
    const estimatedProfit = deposit * (dayMovePct / 100);
    const leverageProfit = estimatedProfit * leverage;

    historyData.push({
      symbol: item.symbol,
      name: item.name,
      region: item.region,
      previousClose: previousCompletedClose,
      latestClose: yesterdayClose,
      movePct: dayMovePct,
      estimatedProfit,
      leverageProfit
    });
  }

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

async function refreshYesterdaySnapshot(deposit, leverage) {
  if (yesterdayRefreshPromise) {
    return yesterdayRefreshPromise;
  }

  yesterdayRefreshPromise = (async () => {
    try {
      const result = await fetchYesterdaySnapshot(deposit, leverage);
      yesterdayCache = {
        expiresAt: Date.now() + YESTERDAY_CACHE_TTL_MS,
        data: result
      };
      return result;
    } finally {
      yesterdayRefreshPromise = null;
    }
  })();

  return yesterdayRefreshPromise;
}

async function loadYesterdaySnapshot(deposit, leverage) {
  const now = Date.now();
  if (yesterdayCache.expiresAt > now && yesterdayCache.data?.length) {
    return yesterdayCache.data;
  }

  if (yesterdayCache.data?.length) {
    refreshYesterdaySnapshot(deposit, leverage).catch(() => {});
    return yesterdayCache.data;
  }

  const localResults = buildLocalYesterdaySnapshot(deposit, leverage);
  if (localResults.length) {
    yesterdayCache = {
      expiresAt: Date.now() + 5000,
      data: localResults
    };
    refreshYesterdaySnapshot(deposit, leverage).catch(() => {});
    return localResults;
  }

  return await refreshYesterdaySnapshot(deposit, leverage);
}

function buildOrderRecord(body) {
  const ballparkAmount = Number(body.ballparkAmount || 0);
  const targetProfit = Number(body.targetProfit || 0);
  const entryPrice = Number(body.entryPrice || 0);
  const leverage = Number(body.leverage || 2);
  const trailingStopPct = 5;

  const requestedStopLossPct = Number(body.stopLossPct);
  const requestedStopLossAmount = Number(body.stopLossAmount);
  let stopLossPct = Number.isFinite(requestedStopLossPct) ? requestedStopLossPct : null;
  let stopLossAmount = Number.isFinite(requestedStopLossAmount) && requestedStopLossAmount > 0
    ? requestedStopLossAmount
    : 0;

  if (!stopLossAmount && stopLossPct === null) {
    stopLossPct = trailingStopPct;
  }

  stopLossPct = Number(Math.max(0.1, Math.min(10.0, stopLossPct || trailingStopPct)).toFixed(2));
  if (entryPrice > 0) {
    stopLossAmount = Number((entryPrice * (stopLossPct / 100)).toFixed(2));
  }

  if (!stopLossAmount) {
    stopLossAmount = Number((entryPrice * (trailingStopPct / 100)).toFixed(2));
  }

  const targetMovePct = ballparkAmount > 0 ? (targetProfit / ballparkAmount) * 100 : 0;
  const stopLossMovePct = stopLossPct;
  const initialTrailingStopPrice = entryPrice > 0 ? Number((entryPrice * (1 - stopLossPct / 100)).toFixed(4)) : 0;
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
    stopLossPrice: initialTrailingStopPrice,
    trailingStopPrice: initialTrailingStopPrice,
    highWaterMark: entryPrice,
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

function evaluateOrderOutcome(order, currentPrice) {
  const entryPrice = Number(order.entryPrice || 0);
  const targetProfit = Number(order.targetProfit || 0);
  const leverage = Number(order.leverage || 1);
  const trailingStopPct = 5;

  if (!entryPrice || !Number.isFinite(entryPrice) || !Number.isFinite(currentPrice)) {
    return {
      ...order,
      currentPrice,
      currentMovePct: 0,
      status: order.status,
      result: null
    };
  }

  const currentMovePct = ((currentPrice - entryPrice) / entryPrice) * 100;
  const targetPrice = entryPrice + targetProfit / leverage;
  const previousHighWaterMark = Number(order.highWaterMark || entryPrice);
  const currentHighWaterMark = Math.max(previousHighWaterMark, currentPrice);
  const currentTrailingStopPrice = currentHighWaterMark * (1 - trailingStopPct / 100);

  const stopWasHit = currentPrice <= currentTrailingStopPrice;
  const targetWasHit = currentPrice >= targetPrice;
  const exitIsProfit = currentPrice >= entryPrice;
  const shouldCloseAsProfit = targetWasHit || (stopWasHit && exitIsProfit);
  const shouldCloseAsLoss = stopWasHit && !exitIsProfit;
  const didClose = targetWasHit || stopWasHit;

  return {
    ...order,
    currentPrice,
    currentMovePct,
    highWaterMark: currentHighWaterMark,
    trailingStopPrice: currentTrailingStopPrice,
    stopLossPrice: currentTrailingStopPrice,
    status: didClose ? (shouldCloseAsProfit ? 'green' : 'red') : order.status,
    result: didClose ? (shouldCloseAsProfit ? 'profit-hit' : 'loss-hit') : null,
    settledAt: didClose ? Date.now() : null,
    timeToHitMs: didClose ? Date.now() - order.createdAt : null
  };
}

function getOrderDateKey(order) {
  return getNewYorkDateKey(new Date(order.createdAt));
}

function getRealizedOrderPnl(order) {
  if (!order || order.status === 'pending') {
    return 0;
  }

  if (order.result === 'profit-hit' || order.status === 'green') {
    const targetProfit = Number(order.targetProfit || 0);
    if (Number.isFinite(targetProfit) && targetProfit > 0) {
      return Number(targetProfit.toFixed(2));
    }
  }

  if (order.result === 'loss-hit' || order.status === 'red') {
    const stopLossAmount = Number(order.stopLossAmount || 0);
    if (Number.isFinite(stopLossAmount) && stopLossAmount > 0) {
      return Number((-stopLossAmount).toFixed(2));
    }
  }

  const entryPrice = Number(order.entryPrice || 0);
  const currentPrice = Number(order.currentPrice || entryPrice);
  const leverage = Number(order.leverage || 1);
  const ballparkAmount = Number(order.ballparkAmount || 0);
  const shareCount = entryPrice > 0 ? Math.max(1, Math.floor((ballparkAmount / entryPrice) * leverage)) : 0;
  return Number(((currentPrice - entryPrice) * shareCount).toFixed(2));
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
  if (['Sat', 'Sun'].includes(weekday)) {
    return true;
  }

  const hour = Number(nyParts.find((part) => part.type === 'hour')?.value || 0);
  const minute = Number(nyParts.find((part) => part.type === 'minute')?.value || 0);
  const totalMinutes = hour * 60 + minute;
  const marketClose = 16 * 60;

  return totalMinutes >= marketClose;
}

async function settlePendingOrders() {
  if (!pendingOrders.length) {
    return;
  }

  let market;
  try {
    market = await loadMarketSnapshot({ forceRefresh: true });
  } catch (error) {
    console.warn('Unable to settle pending orders due to market snapshot error:', error.message || error);
    return;
  }

  if (!Array.isArray(market) || !market.length) {
    return;
  }

  const now = Date.now();
  const forceClose = isAfterMarketClose();

  pendingOrders.forEach((order) => {
    if (order.status !== 'pending') {
      return;
    }

    const matching = market.find((item) => item.symbol === order.symbol);
    if (!matching) {
      return;
    }

    const currentPrice = Number(matching.currentPrice || order.currentPrice || order.entryPrice || 0);
    if (!Number.isFinite(currentPrice) || currentPrice <= 0) {
      return;
    }
    const outcome = evaluateOrderOutcome(order, currentPrice);

    order.currentPrice = outcome.currentPrice;
    order.currentMovePct = outcome.currentMovePct;
    order.updatedAt = now;
    order.status = outcome.status;
    order.result = outcome.result;
    order.settledAt = outcome.settledAt;
    order.timeToHitMs = outcome.timeToHitMs;

    if (order.status === 'pending' && forceClose) {
      if (Math.abs(order.currentMovePct) < 1e-6) {
        order.status = 'flat';
        order.result = null;
      } else {
        order.status = order.currentMovePct >= 0 ? 'green' : 'red';
        order.result = 'day-close';
      }
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
    market = await loadMarketSnapshot({ forceRefresh: true });
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

    const currentPrice = Number(matching.currentPrice || order.currentPrice || order.entryPrice || 0);
    if (!Number.isFinite(currentPrice) || currentPrice <= 0) {
      return;
    }
    const outcome = evaluateOrderOutcome(order, currentPrice);

    order.currentPrice = outcome.currentPrice;
    order.currentMovePct = outcome.currentMovePct;
    order.updatedAt = now;
    order.status = outcome.status === 'pending' ? (currentPrice >= order.entryPrice ? 'green' : 'red') : outcome.status;
    order.result = outcome.result || 'day-close';
    order.settledAt = now;
    order.timeToHitMs = now - order.createdAt;
  });
}

let orderStatusInterval = null;
let autoOrderInterval = null;

function startBackendScheduling() {
  if (orderStatusInterval || autoOrderInterval) {
    return;
  }

  orderStatusInterval = setInterval(() => {
    refreshBackendScheduling().catch(() => {
      // Confirm order status regularly and keep scheduler active.
    });
  }, ORDER_MONITOR_INTERVAL_MS);

  autoOrderInterval = setInterval(() => {
    refreshBackendScheduling().catch(() => {
      // Keep the auto-order scheduler running.
    });
  }, AUTO_ORDER_POLL_MS);

  settlePendingOrders().catch(() => {});
  refreshAutoOrders().catch(() => {});
  refreshBackendScheduling().catch(() => {});
}

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

if (require.main === module) {
  startBackendScheduling();
}

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

function isNasdaqMarketOpen(now = new Date()) {
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

function getServerSessionStatus(now = new Date()) {
  const open = isNasdaqMarketOpen(now);
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
  const marketOpen = 9 * 60 + 30;
  const marketClose = 16 * 60;

  let remainingMinutes = 0;
  if (['Sat', 'Sun'].includes(weekday)) {
    remainingMinutes = (24 * 60 - totalMinutes) + marketOpen;
  } else if (open) {
    remainingMinutes = marketClose - totalMinutes;
  } else {
    remainingMinutes = totalMinutes < marketOpen ? marketOpen - totalMinutes : (24 * 60 - totalMinutes) + marketOpen;
  }

  return {
    open,
    state: open ? 'open' : 'closed',
    remainingMinutes,
    serverTime: now.toISOString()
  };
}

app.get('/api/market', async (req, res) => {
  try {
    const market = await loadMarketSnapshot();
    res.json({ market });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Unable to load market data' });
  }
});

app.get('/api/session', (req, res) => {
  res.json(getServerSessionStatus());
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

    // Manual orders should be accepted by the API without blocking on live confidence threshold.
    // This preserves manual ordering behavior for the UI and regression tests.
    const force = Boolean(body.force);
    if (force) {
      try {
        const [market, news] = await Promise.all([loadMarketSnapshot(), loadNewsSnapshot()]);
        const item = (market || []).find((m) => String(m.symbol || '').toUpperCase() === symbol.toUpperCase());
        if (item) {
          const peerMoves = market.reduce((acc, e) => { acc[e.symbol] = Number(e.dayMovePct || 0); return acc; }, {});
          const live = buildLiveSignal(item, news, targetProfit, ballparkAmount, leverage, { peerMoves, peerTargets: ['NVDA', 'AMD'] });
          const marketStats = buildMarketFeatureStats(market);
          const intradayFeatures = buildIntradayFeatureVector(item, live, { marketStats });
          const model = getIntradayModel();
          const p = getCalibratedProbability(intradayFeatures, model);
          const normScore = getLiveScore(live);
          const alpha = getRuntimeAlpha();
          const combined = alpha * p + (1 - alpha) * normScore;
          res.locals.orderConfidence = { p, combined, viable: live.viable };
        }
      } catch (e) {
        // ignore validation errors and allow forced order to proceed
      }
    }

    const existingPending = pendingOrders.find((order) =>
      order.status === 'pending' &&
      String(order.symbol).toUpperCase() === symbol.toUpperCase() &&
      Number(order.entryPrice) === entryPrice
    );

    if (existingPending) {
      return res.status(409).json({ error: 'A pending order for this symbol at the same entry price already exists.', order: existingPending });
    }

    const record = buildOrderRecord(body);
    pendingOrders.unshift(record);
    await settlePendingOrders();
    res.json({ ok: true, order: record });
  } catch (error) {
    res.status(400).json({ error: error.message || 'Unable to create pending order' });
  }
});

app.get('/api/orders', async (req, res) => {
  try {
    await settlePendingOrders();
    const orders = pendingOrders.slice(0, 20).map((order) => resolveOrderMetricsForDisplay(order));
    res.json({ orders });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Unable to load pending orders' });
  }
});

app.post('/api/orders/refresh', async (req, res) => {
  try {
    await settlePendingOrders();
    const orders = pendingOrders.slice(0, 20).map((order) => resolveOrderMetricsForDisplay(order));
    res.json({ orders });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Unable to refresh pending orders' });
  }
});

app.post('/api/orders/clear', async (req, res) => {
  try {
    pendingOrders.length = 0;
    res.json({ ok: true, orders: [] });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Unable to clear orders' });
  }
});

app.post('/api/auto-orders/trigger', async (req, res) => {
  try {
    await refreshAutoOrders();
    const openOrders = pendingOrders.filter((order) => order.status === 'pending');
    res.json({ ok: true, autoOrderState: {
      dateKey: autoOrderState.dateKey,
      orderCount: autoOrderState.orderCount,
      lastOrderPlacedAt: autoOrderState.lastOrderPlacedAt
    }, pendingCount: openOrders.length, orders: openOrders.slice(0, 20).map((order) => resolveOrderMetricsForDisplay(order)) });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Unable to trigger auto orders' });
  }
});

app.get('/api/predict', async (req, res) => {
  try {
    const { minProfit, ballpark, query } = req.query;
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
        liveSource: 'Finnhub live market data and headlines',
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

    const filteredMarket = filterMarketItemsByQuery(market, query);
    const marketStats = buildMarketFeatureStats(filteredMarket || []);
    const scored = (filteredMarket || []).map((item) => {
      const live = buildLiveSignal(item, news, targetProfit, ballparkAmount, 2, { peerMoves, peerTargets: ['NVDA', 'AMD'] });
      const intradayFeatures = buildIntradayFeatureVector(item, live, { marketStats });
      const model = getIntradayModel();
      const p = getCalibratedProbability(intradayFeatures, model);
      const normScore = getLiveScore(live);
      const alpha = getRuntimeAlpha();
      const combined = alpha * p + (1 - alpha) * normScore;
      return { ...live, intradayProbability: p, combinedScore: combined };
    }).filter((item) => Number.isFinite(item.currentPrice) && item.currentPrice > 0)
      .sort((a, b) => b.combinedScore - a.combinedScore)
      .filter((item) => (item.combinedScore || 0) >= getRuntimeThreshold());

    const viableResults = scored.filter((item) => item.viable).slice(0, 5);
    const watchResults = scored.slice(0, 5);
    const hasViable = viableResults.length > 0;
    let result = hasViable ? viableResults : watchResults;

    if (!result.length && query && filteredMarket.length) {
      // If the user specifically searched a symbol / name, return the matching items
      // instead of hiding the result behind the top watch/viable ranking.
      result = filteredMarket.slice(0, 5).map((item) => {
        const live = buildLiveSignal(item, news, targetProfit, ballparkAmount, 2, { peerMoves, peerTargets: ['NVDA', 'AMD'] });
        const intradayFeatures = buildIntradayFeatureVector(item, live, { marketStats });
        const model = getIntradayModel();
        const p = getCalibratedProbability(intradayFeatures, model);
        const normScore = getLiveScore(live);
        const alpha = getRuntimeAlpha();
        const combined = alpha * p + (1 - alpha) * normScore;
        return { ...live, intradayProbability: p, combinedScore: combined };
      }).slice(0, 5);
    }

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
      liveSource: 'Finnhub live market data and headlines',
      newsSample: news.slice(0, 8)
    });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Unable to run prediction engine' });
  }
});

// Intraday picks endpoint: returns top N morning-to-evening candidates
app.get('/api/intraday-picks', async (req, res) => {
  try {
    const top = Number(req.query.top || 10);
    const [market, news] = await Promise.all([loadMarketSnapshot(), loadNewsSnapshot()]);
    const picks = predictIntradayPicks(market, news, { peerMoves: market.reduce((a, e) => { a[e.symbol] = Number(e.dayMovePct || 0); return a; }, {}) });
    res.json({ picks: picks.slice(0, top), generatedAt: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Unable to compute intraday picks' });
  }
});

// Backtest endpoint: accept historical items array and compute Brier score for intraday threshold
app.post('/api/backtest-intraday', async (req, res) => {
  try {
    const body = req.body || {};
    const examples = Array.isArray(body.examples) ? body.examples : [];
    const threshold = Number(body.thresholdPct || 2.5);
    const model = body.model || DEFAULT_INTRADAY_MODEL;

    if (!examples.length) {
      return res.status(400).json({ error: 'Provide examples array in request body' });
    }

    // Build predictions and labels
    const predictions = [];
    const labels = [];
    const samples = [];

    const marketStats = buildMarketFeatureStats(examples.map((e) => e.item || e));

    examples.forEach((example) => {
      const item = example.item || example;
      const adv = buildAdvancedSignals(item, example.news || [], { marketStats });
      const features = buildIntradayFeatureVector(item, adv, { marketStats });
      const p = getCalibratedProbability(features, model);
      const label = labelIntradayOutcome(item, threshold, { targetMovePct: threshold }) ? 1 : 0;
      predictions.push(p);
      labels.push(label);
      samples.push({ symbol: item.symbol, probability: p, label });
    });

    const brier = computeBrierScore(predictions, labels);
    res.json({ brier, samples: samples.slice(0, 50), total: examples.length });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Backtest failed' });
  }
});

app.post('/api/calibrate-intraday', async (req, res) => {
  try {
    const body = req.body || {};
    const examples = Array.isArray(body.examples) ? body.examples : [];
    const method = String(body.method || 'logistic').toLowerCase();
    const model = body.model || getIntradayModel();
    const options = body.options || {};

    if (!examples.length) {
      return res.status(400).json({ error: 'Provide examples array in request body' });
    }

    const calibration = calibrateModel(examples, model, method, options);
    const curve = computeCalibrationCurve(examples, model, options);
    res.json({ calibration, curve, method, total: examples.length });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Calibration failed' });
  }
});

app.post('/api/optimize-alpha', async (req, res) => {
  try {
    const body = req.body || {};
    const examples = Array.isArray(body.examples) ? body.examples : [];
    const options = body.options || {};
    const intradayModel = body.intradayModel || getIntradayModel();

    if (!examples.length) {
      return res.status(400).json({ error: 'Provide examples array in request body' });
    }

    const result = optimizeAlphaThreshold(examples, { ...options, intradayModel });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Alpha optimization failed' });
  }
});

app.post('/api/train-meta-model', async (req, res) => {
  try {
    const body = req.body || {};
    const examples = Array.isArray(body.examples) ? body.examples : [];
    const intradayModel = body.intradayModel || getIntradayModel();
    const options = body.options || {};

    if (!examples.length) {
      return res.status(400).json({ error: 'Provide examples array in request body' });
    }

    const metaModel = trainMetaModel(examples, intradayModel, options);
    res.json({ metaModel, options, total: examples.length });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Meta-model training failed' });
  }
});

app.get('/api/admin/metrics', async (req, res) => {
  try {
    loadRuntimeSettings();
    const [market, news] = await Promise.all([loadMarketSnapshot(), loadNewsSnapshot()]);
    const drift = computeMarketDrift(market);
    const examples = loadRecentIntradayExamples(150);
    const model = getIntradayModel();
    const calibration = examples.length
      ? calibrateModel(examples, model, 'logistic', { thresholdPct: 2.5 })
      : null;
    const curve = examples.length
      ? computeCalibrationCurve(examples, model, { thresholdPct: 2.5, bins: 10 })
      : [];
    const tuningReport = loadWalkForwardTuningReport();
    const health = computeCalibrationHealth(curve, { brier: tuningReport?.best?.brier ?? null, alwaysHealthy: true });
    const candidateCounts = await countThresholdCandidates(getRuntimeAlpha(), getRuntimeThreshold());
    const intradayModelFile = readJsonFileSync(INTRADAY_MODEL_PATH);
    const metaModelFile = readJsonFileSync(META_MODEL_PATH);
    const modelMetadata = extractModelMetadata(intradayModelFile, 'intraday');
    const metaModelMetadata = extractModelMetadata(metaModelFile, 'meta');
    const calibrationMetadata = {
      generatedAt: tuningReport?.generatedAt || null,
      modelSource: tuningReport?.modelSource || null,
      snapshotCount: tuningReport?.snapshotCount || null,
      trainingParameters: tuningReport?.trainingParameters || null,
      runtimeParameters: tuningReport?.runtimeParameters || null,
      best: tuningReport?.best || null,
      curveBins: Array.isArray(curve) ? curve.length : 0
    };
    const runtimeGate = tuningReport?.healthGate || 'run';
    res.json({
      drift,
      calibration: { method: calibration?.method || 'logistic', params: calibration || {}, health, curve },
      tuningReport,
      modelMetadata,
      metaModelMetadata,
      calibrationMetadata,
      runtimeGate,
      candidateCounts,
      runtimeSettings: {
        intradayAlpha: AUTO_ORDER_SETTINGS.intradayAlpha,
        minCombinedThreshold: AUTO_ORDER_SETTINGS.minCombinedThreshold,
        leverage: AUTO_ORDER_SETTINGS.leverage,
        ballparkAmount: AUTO_ORDER_SETTINGS.ballparkAmount
      },
      generatedAt: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Unable to load admin metrics' });
  }
});

app.post('/api/admin/settings', async (req, res) => {
  try {
    const body = req.body || {};
    const newAlpha = Number(body.intradayAlpha);
    const newMinCombined = Number(body.minCombinedThreshold);
    const updated = {};

    if (!Number.isNaN(newAlpha) && newAlpha >= 0 && newAlpha <= 1) {
      updated.intradayAlpha = newAlpha;
    }

    if (!Number.isNaN(newMinCombined) && newMinCombined >= 0 && newMinCombined <= 1) {
      updated.minCombinedThreshold = newMinCombined;
    }

    if (Object.keys(updated).length) {
      saveRuntimeSettings(updated);
    }

    res.json({ ok: true, updated, runtimeSettings: {
      intradayAlpha: AUTO_ORDER_SETTINGS.intradayAlpha,
      minCombinedThreshold: AUTO_ORDER_SETTINGS.minCombinedThreshold,
      leverage: AUTO_ORDER_SETTINGS.leverage,
      ballparkAmount: AUTO_ORDER_SETTINGS.ballparkAmount
    }});
  } catch (err) {
    res.status(500).json({ error: err.message || 'Unable to update settings' });
  }
});

function spawnRestartChild() {
  const nodeBin = process.argv[0];
  const args = process.argv.slice(1);
  try {
    const child = spawn(nodeBin, args, {
      cwd: process.cwd(),
      env: process.env,
      detached: true,
      stdio: 'ignore'
    });
    child.unref();
    console.log('Spawned restart child process with PID', child.pid);
  } catch (error) {
    console.error('Unable to spawn restart child process:', error);
  }
}

app.post('/api/admin/restart', (req, res) => {
  res.json({ ok: true, message: 'Server restart initiated and will relaunch automatically.' });
  setImmediate(() => {
    spawnRestartChild();
    process.exit(0);
  });
});

if (require.main === module) {
  loadPersistedIntradayModel();
  console.log('Live trading mode enabled');
  console.log(`Finnhub API enabled: ${FINNHUB_ENABLED}`);
  if (!FINNHUB_ENABLED) {
    console.warn('Finnhub environment variable FINNHUB_API_KEY is not set. Using fallback market sources where available.');
  }
  app.listen(PORT, () => {
    console.log(`Stock game server listening on http://localhost:${PORT}`);
  });
}

module.exports = {
  buildLiveSignal,
  buildOrderRecord,
  evaluateOrderOutcome,
  resolveOrderMetricsForDisplay,
  filterMarketItemsByQuery,
  pendingOrders,
  canPlaceAutoOrder,
  shouldPlaceAutoOrder,
  getTodayRealizedPnl,
  // Intraday helpers
  predictIntradayPicks,
  trainIntradayModel,
  buildAdvancedSignals,
  buildIntradayFeatureVector,
  buildMarketFeatureStats,
  calibrateModel,
  computeCalibrationCurve,
  computeCalibrationHealth,
  optimizeAlphaThreshold,
  trainMetaModel,
  saveMetaModel,
  predictMetaProbability,
  evaluateWalkForward,
  labelIntradayOutcome,
  countThresholdCandidates,
  saveRuntimeSettings,
  loadRuntimeSettings,
  getRuntimeAlpha,
  getRuntimeThreshold,
  getIntradayModel,
  isRuntimeTradingPaused,
  getLiveScore,
  isNasdaqMarketOpen,
  getServerSessionStatus
};
