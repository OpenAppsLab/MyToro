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

function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_HISTORY_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveHistory(entries) {
  localStorage.setItem(LOCAL_HISTORY_KEY, JSON.stringify({ entries: entries.slice(-60) }));
}

function getNewYorkDateParts(value = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(new Date(value));

  return {
    year: parts.find((part) => part.type === 'year')?.value,
    month: parts.find((part) => part.type === 'month')?.value,
    day: parts.find((part) => part.type === 'day')?.value
  };
}

function toDateKey(value) {
  const { year, month, day } = getNewYorkDateParts(value);
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(value) {
  const date = new Date(value);
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'America/New_York'
  });
}

function isWeekend(dateKey) {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, 12));
  const weekday = date.getUTCDay();
  return weekday === 0 || weekday === 6;
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
  const { year: currentYear, month: currentMonth } = getNewYorkDateParts();
  const year = Number(currentYear);
  const month = Number(currentMonth) - 1;
  const firstDayOfMonth = new Date(Date.UTC(year, month, 1));
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const firstWeekday = (firstDayOfMonth.getUTCDay() + 6) % 7;
  const totalCells = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;

  const headerLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const headerMarkup = headerLabels.map((label) => `<div class="calendar-header-cell">${label}</div>`).join('');
  const cells = [];

  for (let index = 0; index < totalCells; index += 1) {
    const cellDate = new Date(Date.UTC(year, month, index - firstWeekday + 1));
    const cellParts = getNewYorkDateParts(cellDate);
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

  saveHistory([]);
  window.historyOrders = [];
  window.dispatchEvent(new CustomEvent('orders-cleared'));

  fetch('/api/orders/clear', { method: 'POST' }).catch(() => {});
  renderHistoryFull();
}

function getOrderRealizedPnl(order) {
  if (!order || order.status === 'pending') {
    return 0;
  }

  if (order.result === 'profit-hit') {
    return Number(order.targetProfit || 0);
  }

  if (order.result === 'loss-hit') {
    return -Number(order.stopLossAmount || 0);
  }

  const entryPrice = Number(order.entryPrice || 0);
  const currentPrice = Number(order.currentPrice || entryPrice);
  const leverage = Number(order.leverage || 1);
  const ballparkAmount = Number(order.ballparkAmount || 0);
  const shareCount = entryPrice > 0 ? Math.max(1, Math.floor((ballparkAmount / entryPrice) * leverage)) : 0;
  return Number(((currentPrice - entryPrice) * shareCount).toFixed(2));
}

function renderOrderDetailCard(order) {
  const entryPrice = Number(order.entryPrice || 0);
  const currentPrice = Number(order.currentPrice || entryPrice);
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

  return `
    <div class="history-order-card">
      <strong>${order.symbol || 'Unknown'} - ${statusText}</strong>
      <small>Entry price: ${formatCurrency(entryPrice)}</small>
      <small>Current / exit price: ${formatCurrency(currentPrice)}</small>
      <small>Shares: ${shareCount}</small>
      <small>Leverage: ${leverage}x</small>
      <small>Total buy price: ${formatCurrency(totalBuyPrice)}</small>
      <small>Total sold price: ${formatCurrency(totalSoldPrice)}</small>
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
      ...selectedEntries.map(renderOrderDetailCard)
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
  const orders = await loadPendingOrders();
  window.historyOrders = orders; // store fetched orders for modal use
  const groups = buildHistoryGroups(entries, orders);
  const { year: currentYear, month: currentMonth } = getNewYorkDateParts();
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
