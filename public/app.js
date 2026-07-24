const LOCAL_HISTORY_KEY = 'stockgame-history';

const minProfitInput = document.getElementById('minProfit');
const ballparkInput = document.getElementById('ballpark');
const saveResultsCheckbox = document.getElementById('saveResults');
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

function showSelectionModal(option, order) {
  if (!selectionModal || !selectionModalText) {
    return;
  }

  const symbolName = option?.name || selectedPredictionSymbol || 'your selected option';
  const stopLossMessage = order
    ? `Your order is placed at $${order.entryPrice.toFixed(2)} with a leverage stop loss target of $${order.stopLossAmount.toFixed(2)} (${order.stopLossPct.toFixed(2)}%). `
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

function calculateDailyBalance() {
  const history = loadHistory();
  const entries = Array.isArray(history.entries) ? history.entries : [];
  const realized = entries.reduce((sum, entry) => {
    if (entry.status !== 'pending') {
      const profit = Number(entry.minProfit || 0);
      const loss = Number(entry.stopLossAmount || 15);
      return sum + (entry.correct ? profit : -loss);
    }
    return sum;
  }, 0);
  return STARTING_DAILY_BALANCE + realized;
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

function updateDailyBalance() {
  if (!dailyBalanceLabel) {
    return;
  }
  const balance = calculateDailyBalance();
  dailyBalanceLabel.textContent = currencyFormatter.format(balance);
}

function updateDailyPnl() {
  if (!dailyPnlLabel) {
    return;
  }
  const history = loadHistory();
  const entries = Array.isArray(history.entries) ? history.entries : [];
  const pnl = entries.reduce((sum, entry) => {
    if (entry.status !== 'pending') {
      const profit = Number(entry.minProfit || 0);
      const loss = Number(entry.stopLossAmount || 15);
      return sum + (entry.correct ? profit : -loss);
    }
    return sum;
  }, 0);
  dailyPnlLabel.textContent = currencyFormatter.format(pnl);
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

function updateSessionBadge() {
  const session = getNasdaqSessionStatus();
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

async function createPendingOrder(option) {
  const minProfit = Number(minProfitInput.value || 0);
  const ballpark = Number(ballparkInput.value || 0);

  if (!option?.symbol || !minProfit || !ballpark) {
    return null;
  }

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
        stopLossAmount: 15
      })
    });

    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || 'Unable to create order');
    }

    return payload.order;
  } catch {
    updateStatus('Unable to place order with the live monitor. Please try again.');
    return null;
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

  const session = getNasdaqSessionStatus();
  if (session.state !== 'open') {
    updateStatus('NASDAQ is not open right now. Please try again during market hours.');
    resultsArea.innerHTML = '<div class="option-card">NASDAQ is currently closed. Use the scan button only during open hours.</div>';
    return;
  }

  updateStatus('Scanning live Nasdaq market and news feeds...');
  resultsArea.innerHTML = 'Working on your live Nasdaq prediction...';

  try {
    const response = await fetch(`/api/predict?minProfit=${minProfit}&ballpark=${ballpark}`);
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

    updateStatus(payload.viable
      ? 'Live options are available. You may place an order on a viable pick.'
      : 'No viable live picks right now. Use the top watch candidates and re-scan for updated movement.');

      if (saveResultsCheckbox.checked) {
      if (!latestPredictionOptions.length) {
        updateStatus('No valid result to save. Please run a successful scan with qualifying live options.');
        return;
      }

      const today = new Date().toISOString();
      const chosen = latestPredictionOptions.find((item) => item.symbol === selectedPredictionSymbol) || latestPredictionOptions[0];
      const estimatedProfit = Number(chosen?.estimatedProfit || 0);
      const nextEntry = {
        date: today,
        symbol: chosen?.symbol || 'N/A',
        name: chosen?.name || 'N/A',
        minProfit,
        ballpark,
        status: 'pending',
        correct: null,
        input: payload.inputs,
        estimatedProfit,
        stopLossAmount: 15,
        targetMovePct: ballpark > 0 ? (minProfit / ballpark) * 100 : 0
      };

      persistHistory(nextEntry);
      updateDailyPnl();
      updateStatus(`Saved the result snapshot to local storage as a pending order. It will be settled when the profit target or $15 stop-loss is reached.`);
    }
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

    selectedPredictionSymbol = target.getAttribute('data-select');
    const option = latestPredictionOptions.find((item) => item.symbol === selectedPredictionSymbol);
    if (!option) {
      updateStatus('Selected option is no longer available. Please scan again.');
      return;
    }

    if (!option.viable) {
      updateStatus('This option is a watch candidate only. Re-scan for a live viable pick when the market moves.');
      return;
    }

    updateStatus(`Placing order for ${option.name}...`);
    const order = await createPendingOrder(option);
    if (!order) {
      return;
    }

    updateStatus(`Order placed at $${order.entryPrice.toFixed(2)} with stop loss set at $${order.stopLossAmount.toFixed(2)}.`);
    showSelectionModal(option, order);
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

updateSessionBadge();
updateDailyBalance();
updateDailyPnl();
setInterval(updateSessionBadge, 60000);
