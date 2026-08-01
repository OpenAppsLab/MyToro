const LOCAL_HISTORY_KEY = 'stockgame-history';

const historyProfitDaysLabel = document.getElementById('historyProfitDays');
const historyLossDaysLabel = document.getElementById('historyLossDays');
const historyCalendar = document.getElementById('historyCalendarFull');
const clearButton = document.getElementById('clearHistoryButton');
const refreshButton = document.getElementById('refreshPendingButton');
const historyModal = document.getElementById('historyModal');
const historyModalClose = document.getElementById('historyModalClose');
const historyModalDate = document.getElementById('historyModalDate');
const historyModalContent = document.getElementById('historyModalContent');
const exportButton = document.getElementById('exportHistoryButton');
const importButton = document.getElementById('importHistoryButton');
const importInput = document.getElementById('importHistoryInput');

function loadHistory() {
  try {
    const parsed = JSON.parse(localStorage.getItem(LOCAL_HISTORY_KEY) || '{}');
    if (parsed && typeof parsed === 'object') {
      return {
        entries: Array.isArray(parsed.entries) ? parsed.entries : [],
        orders: Array.isArray(parsed.orders) ? parsed.orders : []
      };
    }
  } catch {
    return { entries: [], orders: [] };
  }
  return { entries: [], orders: [] };
}

function saveHistory(entries, orders) {
  const normalizedEntries = Array.isArray(entries) ? entries.slice(-60) : [];
  const normalizedOrders = Array.isArray(orders) ? orders.slice(-60) : [];
  localStorage.setItem(LOCAL_HISTORY_KEY, JSON.stringify({ entries: normalizedEntries, orders: normalizedOrders }));
}

async function exportHistoryData() {
  const history = loadHistory();
  const savedOrders = Array.isArray(history.orders) ? history.orders : [];
  const liveOrders = await loadPendingOrders();
  const orders = [
    ...savedOrders,
    ...liveOrders.filter((order) => !savedOrders.some((saved) => saved.id === order.id))
  ];

  const payload = {
    exportedAt: new Date().toISOString(),
    entries: Array.isArray(history.entries) ? history.entries : [],
    orders
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `mytoro-history-${toDateKey(new Date())}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

async function importHistoryData(file) {
  if (!file) {
    return;
  }

  try {
    const text = await file.text();
    const parsed = JSON.parse(text);
    const entries = Array.isArray(parsed.entries) ? parsed.entries : [];
    const importedOrders = Array.isArray(parsed.orders) ? parsed.orders : [];
    const hasImportableData = entries.length > 0 || importedOrders.length > 0;

    if (!hasImportableData) {
      window.alert('No history entries or orders were found in this file.');
      return;
    }

    saveHistory(entries, importedOrders);
    window.historyOrders = importedOrders;
    window.dispatchEvent(new CustomEvent('orders-cleared'));
    await renderHistoryFull();
    window.alert('History imported successfully.');
  } catch (error) {
    window.alert(`Unable to import history: ${error.message || 'Unknown error'}`);
  }
}

function parseHistoryDateValue(value) {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day, 12));
  }
  return new Date(value);
}

function getDateParts(value = new Date(), timeZone) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(parseHistoryDateValue(value));

  return {
    year: parts.find((part) => part.type === 'year')?.value,
    month: parts.find((part) => part.type === 'month')?.value,
    day: parts.find((part) => part.type === 'day')?.value
  };
}

function getBrisbaneDateParts(value = new Date()) {
  return getDateParts(value, 'Australia/Brisbane');
}

function getNewYorkDateParts(value = new Date()) {
  return getDateParts(value, 'America/New_York');
}

function toDateKey(value) {
  const { year, month, day } = getBrisbaneDateParts(value);
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(value) {
  const date = parseHistoryDateValue(value);
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'Australia/Brisbane'
  });
}

function isWeekend(dateKey) {
  const date = parseHistoryDateValue(dateKey);
  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Australia/Brisbane',
    weekday: 'short'
  }).formatToParts(date).find((part) => part.type === 'weekday')?.value;
  return weekday === 'Sat' || weekday === 'Sun';
}

function getBrisbaneWeekdayIndex(value) {
  const date = parseHistoryDateValue(value);
  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Australia/Brisbane',
    weekday: 'short'
  }).format(date);
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(weekday);
}

async function loadPendingOrders() {
  try {
    const response = await fetch('/api/orders');
    const payload = await response.json();
    return Array.isArray(payload.orders) ? payload.orders : [];
  } catch {
    return [];
  }
}

async function refreshPendingOrders() {
  try {
    const response = await fetch('/api/orders/refresh', { method: 'POST' });
    const payload = await response.json();
    return Array.isArray(payload.orders) ? payload.orders : [];
  } catch {
    return [];
  }
}

let pendingOrdersRefreshTimer = null;

function startPendingOrderAutoRefresh() {
  if (pendingOrdersRefreshTimer) {
    return;
  }

  pendingOrdersRefreshTimer = window.setInterval(async () => {
    try {
      await refreshPendingOrders();
      await renderHistoryFull();
    } catch {
      // Ignore refresh failures and keep the page responsive.
    }
  }, 15000);
}

function updateRefreshButton(orders) {
  if (!refreshButton) {
    return;
  }
  const hasPending = orders.some((order) => order.status === 'pending');
  refreshButton.disabled = !hasPending;
}

function isNasdaqMarketOpenNow() {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(now);
  const hour = Number(parts.find((part) => part.type === 'hour')?.value || 0);
  const minute = Number(parts.find((part) => part.type === 'minute')?.value || 0);
  const totalMinutes = hour * 60 + minute;
  return totalMinutes >= (9 * 60 + 30) && totalMinutes < (16 * 60);
}

function getGroupNetValue(group) {
  const orderValue = (group?.orders || []).reduce((sum, order) => {
    if (order.status === 'pending') {
      return sum;
    }

    return sum + getOrderRealizedPnl(order);
  }, 0);

  const entryValue = (group?.entries || []).reduce((sum, entry) => {
    if (entry.status === 'pending') {
      return sum;
    }

    if (entry.correct === true) {
      return sum + Number(entry.minProfit || 0);
    }

    return sum - Number(entry.stopLossAmount || 15);
  }, 0);

  return orderValue + entryValue;
}

function getGroupStatus(group, dateKey) {
  if (!group) {
    return { className: 'grey' };
  }

  const isToday = toDateKey(new Date()) === dateKey;
  const hasPendingItems = (group.orders || []).some((order) => order.status === 'pending') || (group.entries || []).some((entry) => entry.status === 'pending');

  if (hasPendingItems && isToday && isNasdaqMarketOpenNow()) {
    return { className: 'pending' };
  }

  const netValue = getGroupNetValue(group);
  if (netValue > 0) {
    return { className: 'green' };
  }
  if (netValue < 0) {
    return { className: 'red' };
  }

  return { className: 'grey' };
}

function buildHistoryGroups(entries, orders) {
  const groups = {};

  entries.forEach((entry) => {
    const key = toDateKey(entry.date);
    groups[key] = groups[key] || { entries: [], orders: [] };
    groups[key].entries.push(entry);
  });

  orders.forEach((order) => {
    const key = toDateKey(order.createdAt || order.date || Date.now());
    groups[key] = groups[key] || { entries: [], orders: [] };
    groups[key].orders.push(order);
  });

  return groups;
}

function buildDateTiles(groups) {
  const { year: currentYear, month: currentMonth } = getBrisbaneDateParts();
  const year = Number(currentYear);
  const month = Number(currentMonth) - 1;
  const firstDayOfMonth = new Date(Date.UTC(year, month, 1, 12));
  const firstWeekday = getBrisbaneWeekdayIndex(firstDayOfMonth);
  const adjustedFirstWeekday = (firstWeekday + 6) % 7;
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0, 12)).getUTCDate();
  const totalCells = Math.ceil((adjustedFirstWeekday + daysInMonth) / 7) * 7;

  const headerLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const headerMarkup = headerLabels.map((label) => `<div class="calendar-header-cell">${label}</div>`).join('');
  const cells = [];

  for (let index = 0; index < totalCells; index += 1) {
    const cellDate = new Date(Date.UTC(year, month, index - adjustedFirstWeekday + 1, 12));
    const cellParts = getBrisbaneDateParts(cellDate);
    const cellYear = Number(cellParts.year);
    const cellMonth = Number(cellParts.month) - 1;
    const isCurrentMonth = cellYear === year && cellMonth === month;
    const dateKey = toDateKey(cellDate);
    const group = groups[dateKey];
    const { className } = group ? getGroupStatus(group, dateKey) : isWeekend(dateKey) ? { className: 'grey' } : { className: 'grey' };

    const dayNumber = Number(cellParts.day);
    const isMuted = !isCurrentMonth;
    const cellClassName = [
      'day-cell',
      className,
      isMuted ? 'muted' : '',
      isCurrentMonth ? 'clickable' : ''
    ].filter(Boolean).join(' ');

    cells.push(`
      <div class="${cellClassName}" data-date="${dateKey}" ${isCurrentMonth ? '' : 'aria-hidden="true"'}>
        <strong>${dayNumber}</strong>
      </div>
    `);
  }

  return [`<div class="calendar-header">${headerMarkup}</div>`, `<div class="calendar-grid">${cells.join('')}</div>`];
}

function formatCurrency(amount) {
  return `$${Number(amount || 0).toFixed(2)}`;
}

function clearAllSavedData() {
  const confirmed = window.confirm('Are you sure you want to wipe out all the order details?');
  if (!confirmed) {
    return;
  }

  saveHistory([], []);
  window.historyOrders = [];
  window.dispatchEvent(new CustomEvent('orders-cleared'));

  fetch('/api/orders/clear', { method: 'POST' }).catch(() => {});
  renderHistoryFull();
}

function getOrderRealizedPnl(order) {
  if (!order || order.status === 'pending') {
    return 0;
  }

  const entryPrice = Number(order.resolvedEntryPrice || order.entryPrice || 0);
  const currentPrice = Number(order.resolvedCurrentPrice || order.currentPrice || entryPrice);
  const leverage = Number(order.leverage || 1);
  const ballparkAmount = Number(order.ballparkAmount || order.ballpark || 0);
  const shareCount = entryPrice > 0 ? Math.max(1, Math.floor((ballparkAmount / entryPrice) * leverage)) : 0;
  return Number(((currentPrice - entryPrice) * shareCount).toFixed(2));
}

function renderOrderDetailCard(order) {
  const entryPrice = Number(order.resolvedEntryPrice || order.entryPrice || 0);
  const currentPrice = Number(order.resolvedCurrentPrice || order.currentPrice || entryPrice);
  const ballparkAmount = Number(order.ballparkAmount || order.ballpark || 0);
  const leverage = Number(order.leverage || 1);
  const shareCount = entryPrice > 0 ? Math.max(1, Math.floor((ballparkAmount / entryPrice) * leverage)) : 0;
  const totalBuyPrice = shareCount * entryPrice;
  const totalSoldPrice = shareCount * currentPrice;
  const profitLoss = Number(((currentPrice - entryPrice) * shareCount).toFixed(2));
  const trailingStopPrice = Number(order.trailingStopPrice || order.stopLossPrice || 0);
  const isProfitable = Number(currentPrice) >= Number(entryPrice);
  const statusText = order.status === 'pending'
    ? 'In progress'
    : order.status === 'green' || order.correct || isProfitable
      ? 'Profit'
      : 'Loss';

  const resultText = order.status === 'pending'
    ? 'Position remains open. It will close when the profit target or stop loss condition is hit.'
    : statusText === 'Profit'
      ? `Realized profit ${formatCurrency(profitLoss)}.`
      : `Realized loss ${formatCurrency(Math.abs(profitLoss))}.`;

  const totalSoldLine = order.status === 'pending'
    ? `<small>Current position value: ${formatCurrency(totalSoldPrice)}</small>`
    : `<small>Total sold price: ${formatCurrency(totalSoldPrice)}</small>`;

  return `
    <div class="history-order-card">
      <strong>${order.symbol || 'Unknown'} - ${statusText}</strong>
      <small>Entry price: ${formatCurrency(entryPrice)}</small>
      <small>Current / exit price: ${formatCurrency(currentPrice)}</small>
      <small>Shares: ${shareCount}</small>
      <small>Leverage: ${leverage}x</small>
      <small>Total buy price: ${formatCurrency(totalBuyPrice)}</small>
      ${totalSoldLine}
      <small>Profit / Loss: ${formatCurrency(profitLoss)}</small>
      <small>Trailing stop: ${formatCurrency(trailingStopPrice)} (${Number(order.stopLossPct || 0).toFixed(2)}%)</small>
      <small>Target profit: ${formatCurrency(Number(order.targetProfit || 0))}</small>
      <small>${resultText}</small>
    </div>
  `;
}

function openHistoryModal(dateKey) {
  const history = loadHistory();
  const entries = Array.isArray(history.entries) ? history.entries : [];
  const selectedEntries = entries
    .filter((entry) => toDateKey(entry.date) === dateKey)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const orders = window.historyOrders || [];
  const selectedOrders = orders
    .filter((order) => toDateKey(order.createdAt || order.date || order.createdAt) === dateKey)
    .sort((a, b) => Number(b.createdAt || b.date || 0) - Number(a.createdAt || a.date || 0));

  historyModalDate.textContent = formatDisplayDate(dateKey);

  if (!selectedEntries.length && !selectedOrders.length) {
    historyModalContent.innerHTML = `
      <div class="history-order-card">
        <strong>No saved history for this day.</strong>
        <small>Place orders on the Home page and live orders will appear here once they are created.</small>
      </div>
    `;
  } else {
    historyModalContent.innerHTML = [
      ...selectedOrders.map(renderOrderDetailCard),
      ...selectedEntries.map((entry) => {
        const historyOrder = {
          symbol: entry.symbol || 'Unknown',
          entryPrice: Number(entry.entryPrice || entry.targetPrice || 0),
          currentPrice: Number(entry.targetPrice || entry.entryPrice || 0),
          ballparkAmount: Number(entry.ballparkAmount || entry.amount || 0),
          leverage: Number(entry.leverage || 1),
          trailingStopPrice: Number(entry.trailingStopPrice || entry.stopLossPrice || 0),
          stopLossPct: Number(entry.stopLossPct || 0),
          targetProfit: Number(entry.minProfit || entry.targetProfit || 0),
          status: entry.correct ? 'green' : 'red',
          result: entry.correct ? 'profit-hit' : 'loss-hit',
          resolvedEntryPrice: Number(entry.entryPrice || entry.targetPrice || 0),
          resolvedCurrentPrice: Number(entry.targetPrice || entry.entryPrice || 0)
        };
        return renderOrderDetailCard(historyOrder);
      })
    ].join('');
  }

  historyModal.classList.remove('hidden');
  historyModal.setAttribute('aria-hidden', 'false');
}

function closeHistoryModal() {
  if (!historyModal) {
    return;
  }

  historyModal.classList.add('hidden');
  historyModal.setAttribute('aria-hidden', 'true');
}

function attachDateClickHandlers() {
  if (!historyCalendar) {
    return;
  }

  historyCalendar.querySelectorAll('.day-cell.clickable').forEach((tile) => {
    tile.addEventListener('click', () => {
      const dateKey = tile.getAttribute('data-date');
      if (dateKey) {
        openHistoryModal(dateKey);
      }
    });
  });
}

async function renderHistoryFull() {
  const history = loadHistory();
  const entries = Array.isArray(history.entries) ? history.entries : [];
  const importedOrders = Array.isArray(history.orders) ? history.orders : [];
  const liveOrders = await loadPendingOrders();
  const orders = [
    ...importedOrders,
    ...liveOrders.filter((order) => !importedOrders.some((item) => item.id === order.id))
  ];
  window.historyOrders = orders; // store fetched orders for modal use
  const groups = buildHistoryGroups(entries, orders);
  const { year: currentYear, month: currentMonth } = getBrisbaneDateParts();
  const profitDays = Object.entries(groups).reduce((sum, [dateKey, group]) => {
    const [groupYear, groupMonth] = dateKey.split('-').map(Number);
    if (groupYear !== Number(currentYear) || groupMonth !== Number(currentMonth)) {
      return sum;
    }
    return sum + (getGroupStatus(group, dateKey).className === 'green' ? 1 : 0);
  }, 0);
  const lossDays = Object.entries(groups).reduce((sum, [dateKey, group]) => {
    const [groupYear, groupMonth] = dateKey.split('-').map(Number);
    if (groupYear !== Number(currentYear) || groupMonth !== Number(currentMonth)) {
      return sum;
    }
    return sum + (getGroupStatus(group, dateKey).className === 'red' ? 1 : 0);
  }, 0);

  if (historyProfitDaysLabel) {
    historyProfitDaysLabel.textContent = profitDays;
  }
  if (historyLossDaysLabel) {
    historyLossDaysLabel.textContent = lossDays;
  }

  updateRefreshButton(orders);
  const tiles = buildDateTiles(groups);

  if (historyCalendar) {
    historyCalendar.innerHTML = tiles.join('');
    attachDateClickHandlers();
  }
}

if (clearButton) {
  clearButton.addEventListener('click', clearAllSavedData);
}

if (exportButton) {
  exportButton.addEventListener('click', exportHistoryData);
}

if (importButton && importInput) {
  importButton.addEventListener('click', () => importInput.click());
  importInput.addEventListener('change', async (event) => {
    const [file] = event.target.files || [];
    await importHistoryData(file);
    event.target.value = '';
  });
}

if (refreshButton) {
  refreshButton.addEventListener('click', async () => {
    refreshButton.disabled = true;
    refreshButton.textContent = 'Refreshing...';
    await refreshPendingOrders();
    await renderHistoryFull();
    refreshButton.textContent = 'Refresh pending orders';
  });
}

if (historyModalClose) {
  historyModalClose.addEventListener('click', closeHistoryModal);
}

if (historyModal) {
  historyModal.addEventListener('click', (event) => {
    if (event.target === historyModal) {
      closeHistoryModal();
    }
  });
}

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeHistoryModal();
  }
});

renderHistoryFull();
startPendingOrderAutoRefresh();
