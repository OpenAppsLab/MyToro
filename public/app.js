const LOCAL_HISTORY_KEY = 'stockgame-history';

const minProfitInput = document.getElementById('minProfit');
const ballparkInput = document.getElementById('ballpark');
const symbolSearchInput = document.getElementById('symbolSearch');
const searchButton = document.getElementById('searchButton');
const resultsArea = document.getElementById('resultsArea');
const statusMessage = document.getElementById('statusMessage');
const sessionBadge = document.getElementById('sessionBadge');
const sessionNote = document.getElementById('sessionNote');
const dailyBalanceLabel = document.getElementById('dailyBalance');
const dailyPnlLabel = document.getElementById('dailyPnl');
const selectionModal = document.getElementById('selectionModal');
const selectionModalText = document.getElementById('selectionModalText');
const selectionModalClose = document.getElementById('selectionModalClose');
const STARTING_DAILY_BALANCE = 3000;
let latestPredictionOptions = [];
let selectedPredictionSymbol = '';
let orderCreateInProgress = false;

const adminPanel = document.getElementById('adminPanel');
const adminAlerts = document.getElementById('adminAlerts');
const driftRatioLabel = document.getElementById('driftRatio');
const driftDetail = document.getElementById('driftDetail');
const calibrationHealth = document.getElementById('calibrationHealth');
const healthDetail = document.getElementById('healthDetail');
const candidateCountLabel = document.getElementById('candidateCount');
const candidateDetail = document.getElementById('candidateDetail');
const runtimeGateLabel = document.getElementById('runtimeGate');
const runtimeGateDetail = document.getElementById('runtimeGateDetail');
const calibrationChart = document.getElementById('adminCalibrationChart');
const curveMeta = document.getElementById('curveMeta');
const alphaControl = document.getElementById('alphaControl');
const thresholdControl = document.getElementById('thresholdControl');
const saveAdminButton = document.getElementById('saveAdminSettings');
const adminTuningSummary = document.getElementById('adminTuningSummary');

function showAdminAlert(message, type = 'healthy') {
  if (!adminAlerts) return;
  adminAlerts.innerHTML = `<span class="alert-pill ${type}">${message}</span>`;
}

function formatPercent(value) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '—';
  }
  return `${(Number(value) * 100).toFixed(1)}%`;
}

function renderCalibrationChart(curve = []) {
  if (!calibrationChart) return;
  if (!curve.length) {
    calibrationChart.innerHTML = '<div>Calibration curve unavailable</div>';
    return;
  }

  const segments = curve.map((bin) => {
    const x = Number(bin.meanPred || 0);
    const y = Number(bin.meanActual || 0);
    return `<div class="calibration-segment" style="--x:${x}; --y:${y};">
      <span>${formatPercent(x)} → ${formatPercent(y)}</span>
    </div>`;
  }).join('');

  calibrationChart.innerHTML = `
    <div class="calibration-grid">
      ${segments}
      <div class="calibration-line"></div>
    </div>
  `;
}

function getBestTuningResult(tuningReport) {
  if (!tuningReport) {
    return null;
  }

  if (tuningReport.best) {
    return tuningReport.best;
  }

  const nested = tuningReport.tuning || {};
  if (nested.best) {
    return nested.best;
  }

  const results = Array.isArray(nested.results) ? nested.results : Array.isArray(tuningReport.results) ? tuningReport.results : [];
  if (!results.length) {
    return null;
  }

  return results.slice().sort((a, b) => (Number(b.totalPnl || 0) - Number(a.totalPnl || 0)))[0];
}

async function loadAdminMetrics() {
  if (!adminPanel) return;

  try {
    const response = await fetch('/api/admin/metrics', { cache: 'no-store' });
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error || 'Unable to load admin metrics');
    }

    const drift = payload.drift || {};
    driftRatioLabel.textContent = drift.ratio != null ? drift.ratio.toFixed(2) : '—';
    driftDetail.textContent = drift.warning
      ? `Current amplitude is ${drift.currentAvg} vs historical ${drift.historicalAvg}`
      : `Stable market drift: ${drift.currentAvg} vs historical ${drift.historicalAvg}`;

    const health = payload.calibration?.health || {};
    const thresholdHint = payload.runtimeSettings?.minCombinedThreshold ?? 0.6;
    calibrationHealth.textContent = health.degraded ? 'Degraded' : 'Healthy';
    healthDetail.textContent = health.degraded
      ? `Model predictions are off by ${formatPercent(health.meanGap)} on average and ${formatPercent(health.maxGap)} at worst.`
      : `Model calibration looks stable: average gap ${formatPercent(health.meanGap)}.`;

    candidateCountLabel.textContent = payload.candidateCounts?.candidateCount ?? '—';
    candidateDetail.textContent = payload.candidateCounts?.topSymbols?.length
      ? `Top: ${payload.candidateCounts.topSymbols.join(', ')}`
      : `No current candidates meet the minimum strength (${formatPercent(thresholdHint)}).`;

    const runtimeGate = payload.runtimeGate || 'run';
    if (runtimeGateLabel) runtimeGateLabel.textContent = runtimeGate === 'pause' ? 'Paused' : 'Run';
    if (runtimeGateDetail) runtimeGateDetail.textContent = runtimeGate === 'pause'
      ? 'Auto trading is blocked by walk-forward calibration health.'
      : 'Auto trading is permitted under current calibration settings.';

    const runtime = payload.runtimeSettings || {};
    if (alphaControl) alphaControl.value = runtime.intradayAlpha ?? 0.7;
    if (thresholdControl) thresholdControl.value = runtime.minCombinedThreshold ?? 0.6;

    renderCalibrationChart(payload.calibration?.curve || []);
    curveMeta.textContent = `Based on ${payload.calibration?.curve?.length || 0} calibration bins`;

    const tuning = payload.tuningReport;
    const bestTuning = getBestTuningResult(tuning);
    if (bestTuning) {
      adminTuningSummary.innerHTML = `
        <strong>Best walk-forward tuning</strong><br>
        alpha ${Number(bestTuning.alpha || 0).toFixed(2)}, threshold ${Number(bestTuning.threshold || 0).toFixed(2)}<br>
        total PnL $${Number(bestTuning.totalPnl || 0).toFixed(0)}, win rate ${(Number(bestTuning.winRate || 0) * 100).toFixed(1)}%<br>
        candidate set size ${payload.candidateCounts?.candidateCount ?? '—'}.
      `;
    } else {
      adminTuningSummary.textContent = 'Walk-forward tuning report is unavailable or not yet generated.';
    }

    if (health.degraded || drift.warning) {
      showAdminAlert('Warning: calibration or market drift requires review.', 'warning');
    } else {
      showAdminAlert('Admin diagnostics are within expected limits.', 'healthy');
    }
  } catch (error) {
    showAdminAlert(error.message || 'Unable to load admin metrics', 'danger');
  }
}

async function saveAdminSettings() {
  if (!saveAdminButton) return;
  saveAdminButton.disabled = true;

  try {
    const payload = {
      intradayAlpha: Number(alphaControl?.value || 0.7),
      minCombinedThreshold: Number(thresholdControl?.value || 0.6)
    };

    const response = await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || 'Failed to save admin settings');
    }

    showAdminAlert('Runtime settings updated successfully.', 'healthy');
    loadAdminMetrics();
  } catch (error) {
    showAdminAlert(error.message || 'Unable to save admin settings', 'danger');
  } finally {
    saveAdminButton.disabled = false;
  }
}

function showSelectionModal(option, order) {
  if (!selectionModal || !selectionModalText) {
    return;
  }

  const symbolName = option?.name || selectedPredictionSymbol || 'your selected option';
  const stopLossMessage = order
    ? `Your order is placed at $${order.entryPrice.toFixed(2)} with a 5% trailing stop loss at $${(order.trailingStopPrice || order.stopLossPrice || order.entryPrice * 0.95).toFixed(2)}. `
    : '';

  selectionModalText.textContent = `You picked ${symbolName} for today. ${stopLossMessage}The position is pending in History until the profit target or stop loss condition is met.`;
  selectionModal.classList.remove('hidden');
  selectionModal.setAttribute('aria-hidden', 'false');
}

function hideSelectionModal() {
  if (!selectionModal) {
    return;
  }

  selectionModal.classList.add('hidden');
  selectionModal.setAttribute('aria-hidden', 'true');
}

function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_HISTORY_KEY) || '{}');
  } catch {
    return {};
  }
}

async function getLiveOrderPnl() {
  try {
    const response = await fetch('/api/orders');
    const payload = await response.json();
    const orders = Array.isArray(payload.orders) ? payload.orders : [];

    return orders.reduce((sum, order) => {
      if (order.status === 'pending') {
        return sum;
      }

      const entryPrice = Number(order.entryPrice || 0);
      const currentPrice = Number(order.currentPrice || entryPrice);
      const leverage = Number(order.leverage || 1);
      const ballparkAmount = Number(order.ballparkAmount || 0);
      const shareCount = entryPrice > 0 ? Math.max(1, Math.floor((ballparkAmount / entryPrice) * leverage)) : 0;
      const profitLoss = Number(((currentPrice - entryPrice) * shareCount).toFixed(2));
      return sum + profitLoss;
    }, 0);
  } catch {
    return 0;
  }
}

async function calculateDailyBalance() {
  const history = loadHistory();
  const entries = Array.isArray(history.entries) ? history.entries : [];
  const localRealized = entries.reduce((sum, entry) => {
    if (entry.status !== 'pending') {
      const profit = Number(entry.minProfit || 0);
      const loss = Number(entry.stopLossAmount || 15);
      return sum + (entry.correct ? profit : -loss);
    }
    return sum;
  }, 0);
  const livePnl = await getLiveOrderPnl();
  return STARTING_DAILY_BALANCE + localRealized + livePnl;
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

async function updateDailyBalance() {
  if (!dailyBalanceLabel) {
    return;
  }
  const balance = await calculateDailyBalance();
  dailyBalanceLabel.textContent = currencyFormatter.format(balance);
}

async function updateDailyPnl() {
  if (!dailyPnlLabel) {
    return;
  }
  const history = loadHistory();
  const entries = Array.isArray(history.entries) ? history.entries : [];
  const localPnl = entries.reduce((sum, entry) => {
    if (entry.status !== 'pending') {
      const profit = Number(entry.minProfit || 0);
      const loss = Number(entry.stopLossAmount || 15);
      return sum + (entry.correct ? profit : -loss);
    }
    return sum;
  }, 0);
  const livePnl = await getLiveOrderPnl();
  dailyPnlLabel.textContent = currencyFormatter.format(localPnl + livePnl);
}

function getNasdaqSessionStatus() {
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
  const marketOpen = 9 * 60 + 30;
  const marketClose = 16 * 60;

  if (['Sat', 'Sun'].includes(weekday)) {
    return {
      state: 'closed',
      remainingMinutes: (24 * 60 - totalMinutes) + marketOpen
    };
  }

  if (totalMinutes >= marketOpen && totalMinutes < marketClose) {
    return {
      state: 'open',
      remainingMinutes: marketClose - totalMinutes
    };
  }

  return {
    state: 'closed',
    remainingMinutes: totalMinutes < marketOpen ? marketOpen - totalMinutes : (24 * 60 - totalMinutes) + marketOpen
  };
}

function formatCountdown(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return `${hours}h ${mins}m`;
}

async function updateSessionBadge() {
  if (!sessionBadge || !sessionNote) {
    return;
  }

  let session;

  try {
    const response = await fetch('/api/session');
    const payload = await response.json();
    session = payload;
  } catch {
    session = getNasdaqSessionStatus();
  }

  const isOpen = session.state === 'open';
  sessionBadge.textContent = isOpen
    ? 'NASDAQ session: open now'
    : 'NASDAQ session: closed now';
  sessionBadge.style.background = isOpen ? '#dcfce7' : '#eff6ff';
  sessionBadge.style.color = isOpen ? '#166534' : '#1d4ed8';
  sessionNote.textContent = isOpen
    ? `Closes in ${formatCountdown(session.remainingMinutes)}.`
    : `Opens in ${formatCountdown(session.remainingMinutes)}.`;

  if (searchButton) {
    searchButton.disabled = !isOpen;
  }
}

function updateStatus(message) {
  statusMessage.textContent = message;
}

function persistHistory(entry) {
  const existing = loadHistory();
  const entries = Array.isArray(existing.entries) ? existing.entries : [];
  entries.push(entry);
  localStorage.setItem(LOCAL_HISTORY_KEY, JSON.stringify({ entries: entries.slice(-60) }));
  updateDailyBalance();
  updateDailyPnl();
}

window.addEventListener('orders-cleared', () => {
  updateDailyBalance();
  updateDailyPnl();
});

async function createPendingOrder(option) {
  const minProfit = Number(minProfitInput.value || 0);
  const ballpark = Number(ballparkInput.value || 0);

  if (orderCreateInProgress) {
    updateStatus('An order is already being placed. Please wait a moment.');
    return null;
  }

  if (!option?.symbol || !minProfit || !ballpark) {
    return null;
  }

  orderCreateInProgress = true;
  try {
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        symbol: option.symbol,
        name: option.name,
        entryPrice: Number(option.currentPrice || 0),
        targetProfit: minProfit,
        ballparkAmount: ballpark,
        leverage: 2,
        stopLossPct: 5
      })
    });

    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || 'Unable to create order');
    }

    return payload.order;
  } catch (error) {
    updateStatus(error.message || 'Unable to place order with the live monitor. Please try again.');
    return null;
  } finally {
    orderCreateInProgress = false;
  }
}

async function fetchIntradaySuggestionsHtml(top = 5) {
  try {
    const resp = await fetch(`/api/intraday-picks?top=${top}`);
    const data = await resp.json();
    if (!resp.ok || !Array.isArray(data.picks)) return '';
    if (!data.picks.length) return '';

    return `
      <section class="intraday-suggestions">
        <h4>Suggested top intraday picks</h4>
        <div class="intraday-list">
          ${data.picks.map(p => `<div class="intraday-item"><strong>${p.symbol}</strong> ${p.name} — ${Math.round((p.probability||0)*100)}%</div>`).join('')}
        </div>
      </section>
    `;
  } catch {
    return '';
  }
}

async function searchPrediction() {
  updateSessionBadge();
  const minProfit = Number(minProfitInput.value || 0);
  const ballpark = Number(ballparkInput.value || 0);

  if (!minProfit || !ballpark) {
    updateStatus('Please enter both minimum profit and ballpark amount.');
    return;
  }

  let session;
  try {
    const response = await fetch('/api/session');
    session = await response.json();
  } catch {
    session = getNasdaqSessionStatus();
  }

  if (session.state !== 'open') {
    updateStatus('NASDAQ is not open right now. Please try again during market hours.');
    resultsArea.innerHTML = '<div class="option-card">NASDAQ is currently closed. Use the scan button only during open hours.</div>';
    return;
  }

  updateStatus('Scanning live Nasdaq market and news feeds...');
  resultsArea.innerHTML = 'Working on your live Nasdaq prediction...';

  try {
    const searchQuery = (symbolSearchInput?.value || '').trim();
    const response = await fetch(`/api/predict?minProfit=${minProfit}&ballpark=${ballpark}${searchQuery ? `&query=${encodeURIComponent(searchQuery)}` : ''}`);
    const payload = await response.json();

    if (!response.ok || !payload.result) {
      throw new Error(payload.error || 'Prediction service could not run.');
    }

    latestPredictionOptions = payload.result.map((option) => ({
      ...option,
      estimatedProfit: Number(option.estimatedProfit.toFixed(2)),
      leverageProfit: Number((option.leverageProfit || option.estimatedProfit * 2).toFixed(2)),
      marketScore: Number(option.score.toFixed(2))
    }));
    selectedPredictionSymbol = latestPredictionOptions[0]?.symbol || '';

    const headerCard = `<div class="option-card info-card"><strong>${payload.viable ? 'Live picks meet your target' : 'No currently viable live pick'}</strong><div class="info-copy">${payload.note}</div><div class="info-copy">Live source: ${payload.liveSource}</div></div>`;
    const optionsMarkup = latestPredictionOptions.length
      ? latestPredictionOptions.map((option, index) => `
        <article class="option-card ${option.viable ? '' : 'watch-card'}">
          <h3>${option.name} (${option.symbol})</h3>
          <div class="option-meta">
            <span>Region: ${option.region}</span>
            <span>Current price: ${Number(option.currentPrice).toFixed(2)}</span>
            <span>Day move: ${Number(option.dayMovePct).toFixed(2)}%</span>
            <span>Signal: ${option.signalType}</span>
            <span>Score: ${option.marketScore}</span>
            <span>Confidence: ${option.confidence?.toFixed(1) ?? 'n/a'}</span>
            <span>News mentions: ${option.newsMentions}</span>
            <span>Estimated profit: ${option.estimatedProfit.toFixed(2)}</span>
            <span>Leverage profit: ${option.leverageProfit.toFixed(2)}</span>
          </div>
          <button data-select="${option.symbol}" class="ghost-button" ${payload.viable ? '' : 'disabled'}>${payload.viable ? `Select option ${index + 1}` : `Watch option ${index + 1}`}</button>
        </article>
      `).join('')
      : '<div class="option-card">No live movement data is available for your requested target right now.</div>';

    resultsArea.innerHTML = `${headerCard}${optionsMarkup}`;

    // include top intraday suggestions for the user to consider
    const suggestions = await fetchIntradaySuggestionsHtml(5);
    if (suggestions) {
      resultsArea.insertAdjacentHTML('afterbegin', suggestions);
    }

    updateStatus(payload.viable
      ? 'Live options are available. You may place an order on a viable pick.'
      : 'No viable live picks right now. Use the top watch candidates and re-scan for updated movement.');

  } catch (error) {
    updateStatus(error.message || 'Unable to complete live prediction.');
    resultsArea.innerHTML = 'The live service is unavailable right now. Please try again in a moment.';
  }
}

if (resultsArea) {
  resultsArea.addEventListener('click', async (event) => {
    const target = event.target.closest('[data-select]');
    if (!target || target.disabled) {
      return;
    }

    target.disabled = true;
    selectedPredictionSymbol = target.getAttribute('data-select');
    const option = latestPredictionOptions.find((item) => item.symbol === selectedPredictionSymbol);
    if (!option) {
      updateStatus('Selected option is no longer available. Please scan again.');
      target.disabled = false;
      return;
    }

    if (!option.viable) {
      updateStatus('This option is a watch candidate only. Re-scan for a live viable pick when the market moves.');
      target.disabled = false;
      return;
    }

    updateStatus(`Placing order for ${option.name}...`);
    const order = await createPendingOrder(option);
    if (!order) {
      target.disabled = false;
      return;
    }

    updateStatus(`Order placed at $${order.entryPrice.toFixed(2)} with a 5% trailing stop loss.`);
    showSelectionModal(option, order);
    target.disabled = false;
    // after placing an order, suggest top intraday picks for quick follow-up
    const postSuggestions = await fetchIntradaySuggestionsHtml(5);
    if (postSuggestions) {
      resultsArea.insertAdjacentHTML('afterbegin', postSuggestions);
    }
  });
}

if (selectionModalClose) {
  selectionModalClose.addEventListener('click', hideSelectionModal);
}

if (selectionModal) {
  selectionModal.addEventListener('click', (event) => {
    if (event.target === selectionModal) {
      hideSelectionModal();
    }
  });
}

if (searchButton) {
  searchButton.addEventListener('click', searchPrediction);
}

if (saveAdminButton) {
  saveAdminButton.addEventListener('click', saveAdminSettings);
}

updateSessionBadge();
updateDailyBalance();
updateDailyPnl();

if (adminPanel) {
  loadAdminMetrics();
  setInterval(() => {
    updateSessionBadge();
    updateDailyBalance();
    updateDailyPnl();
    loadAdminMetrics();
  }, 60000);
} else {
  setInterval(() => {
    updateSessionBadge();
    updateDailyBalance();
    updateDailyPnl();
  }, 60000);
}
