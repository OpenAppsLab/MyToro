const LOCAL_HISTORY_KEY = 'stockgame-history';

const historyCountLabel = document.getElementById('historyCount');
const historyWinsLabel = document.getElementById('historyWins');
const historyLossesLabel = document.getElementById('historyLosses');
const historyBalanceLabel = document.getElementById('historyBalance');
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

function toDateKey(value) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatDisplayDate(value) {
  const date = new Date(value);
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

function isWeekend(dateKey) {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const weekday = date.getDay();
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

function getGroupStatus(group) {
  if (!group) {
    return { className: 'grey', label: 'No data' };
  }

  if (group.orders.length) {
    const settled = group.orders.find((order) => order.status !== 'pending');
    if (settled) {
      return {
        className: settled.status === 'green' ? 'green' : 'red',
        label: `${group.orders.length} order${group.orders.length > 1 ? 's' : ''}`
      };
    }
    return {
      className: 'pending',
      label: `${group.orders.length} order${group.orders.length > 1 ? 's' : ''} - ${group.orders.filter((o) => o.status === 'pending').length} pending`
    };
  }

  if (group.entries.length) {
    const settledEntry = group.entries.find((entry) => entry.status !== 'pending');
    if (settledEntry) {
      return {
        className: settledEntry.correct ? 'green' : 'red',
        label: settledEntry.correct ? 'Pass' : 'Fail'
      };
    }
    return {
      className: 'pending',
      label: 'Pending'
    };
  }

  return { className: 'grey', label: 'No data' };
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
  const today = new Date();
  const monthAgo = new Date(today);
  monthAgo.setDate(today.getDate() - 30);

  const tiles = [];
  for (let cursor = new Date(monthAgo); cursor <= today; cursor.setDate(cursor.getDate() + 1)) {
    const dateKey = toDateKey(cursor);
    const group = groups[dateKey];
    const { className, label } = group ? getGroupStatus(group) : isWeekend(dateKey) ? { className: 'blue', label: 'Closed' } : { className: 'grey', label: 'No data' };
    const displayDate = formatDisplayDate(dateKey);

    tiles.push(`
      <div class="day-cell ${className} clickable" data-date="${dateKey}">
        <strong>${displayDate}</strong>
        <br/>
        <small>${label}</small>
      </div>
    `);
  }

  return tiles;
}

function renderOrderDetailCard(entry) {
  const statusText = entry.status === 'pending' ? 'Pending' : entry.correct ? 'Profit' : 'Loss';
  const outcomeText = entry.status === 'pending'
    ? 'Waiting for stop loss or profit target to resolve.'
    : entry.correct
      ? `Realized profit $${Number(entry.minProfit || 0).toFixed(2)}.`
      : `Realized loss $${Number(entry.stopLossAmount || 15).toFixed(2)}.`;

  return `
    <div class="history-order-card">
      <strong>${entry.symbol} - ${statusText}</strong>
      <small>Target profit: $${Number(entry.minProfit || 0).toFixed(2)}</small>
      <small>Ballpark: $${Number(entry.ballpark || 0).toFixed(2)}</small>
      <small>Stop loss: $${Number(entry.stopLossAmount || 15).toFixed(2)} (${Number(entry.stopLossPct || 0).toFixed(2)}%)</small>
      <small>${outcomeText}</small>
    </div>
  `;
}

function openHistoryModal(dateKey) {
  const history = loadHistory();
  const entries = Array.isArray(history.entries) ? history.entries : [];
  const selectedEntries = entries
    .filter((entry) => toDateKey(entry.date) === dateKey)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  historyModalDate.textContent = formatDisplayDate(dateKey);

  if (!selectedEntries.length) {
    historyModalContent.innerHTML = `
      <div class="history-order-card">
        <strong>No saved history for this day.</strong>
        <small>Place orders on the Home page and save snapshots to build a daily performance record.</small>
      </div>
    `;
  } else {
    historyModalContent.innerHTML = selectedEntries.map(renderOrderDetailCard).join('');
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
  const wins = entries.filter((entry) => entry.correct === true).length;
  const losses = entries.filter((entry) => entry.correct === false).length;
  const balance = entries.reduce((sum, entry) => {
    if (entry.status !== 'pending') {
      return sum + (entry.correct ? Number(entry.minProfit || 0) : -Number(entry.stopLossAmount || 15));
    }
    return sum;
  }, 3000);

  if (historyCountLabel) {
    historyCountLabel.textContent = entries.length;
  }
  if (historyWinsLabel) {
    historyWinsLabel.textContent = wins;
  }
  if (historyLossesLabel) {
    historyLossesLabel.textContent = losses;
  }
  if (historyBalanceLabel) {
    historyBalanceLabel.textContent = `$${balance.toFixed(2)}`;
  }

  const orders = await loadPendingOrders();
  updateRefreshButton(orders);
  const groups = buildHistoryGroups(entries, orders);
  const tiles = buildDateTiles(groups);

  if (historyCalendar) {
    historyCalendar.innerHTML = tiles.join('');
    attachDateClickHandlers();
  }
}

if (clearButton) {
  clearButton.addEventListener('click', () => {
    saveHistory([]);
    renderHistoryFull();
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
