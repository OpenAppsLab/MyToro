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
const selectionModalSecondary = document.getElementById('selectionModalSecondary');
const infoButton = document.getElementById('infoButton');
const appInfoModal = document.getElementById('appInfoModal');
const appInfoBody = document.getElementById('appInfoBody');
const appInfoClose = document.getElementById('appInfoClose');
const candidateDetailModal = document.getElementById('candidateDetailModal');
const candidateDetailContent = document.getElementById('candidateDetailContent');
const candidateDetailSubtitle = document.getElementById('candidateDetailSubtitle');
const candidateDetailClose = document.getElementById('candidateDetailClose');
const STARTING_DAILY_BALANCE = 3000;
let latestPredictionOptions = [];
let appInfoCache = '';
let selectedPredictionSymbol = '';
let orderCreateInProgress = false;
let pendingReviewOption = null;
let activeSelectionModalMode = 'info';

const adminPanel = document.getElementById('adminPanel');
const adminAlerts = document.getElementById('adminAlerts');
const driftRatioLabel = document.getElementById('driftRatio');
const driftDetail = document.getElementById('driftDetail');
const calibrationHealth = document.getElementById('calibrationHealth');
const healthDetail = document.getElementById('healthDetail');
const candidateCountLabel = document.getElementById('candidateCount');
const candidateDetail = document.getElementById('candidateDetail');
const modelRetrainAt = document.getElementById('modelRetrainAt');
const metaModelRetrainAt = document.getElementById('metaModelRetrainAt');
const snapshotCountLabel = document.getElementById('snapshotCount');
const snapshotCountDetail = document.getElementById('snapshotCountDetail');
const runtimeGateLabel = document.getElementById('runtimeGate');
const runtimeGateDetail = document.getElementById('runtimeGateDetail');
const dataHealthStateLabel = document.getElementById('dataHealthState');
const dataHealthDetailLabel = document.getElementById('dataHealthDetail');
const livePerformanceStateLabel = document.getElementById('livePerformanceState');
const livePerformanceDetailLabel = document.getElementById('livePerformanceDetail');
const calibrationChart = document.getElementById('adminCalibrationChart');
const curveMeta = document.getElementById('curveMeta');
const alphaControl = document.getElementById('alphaControl');
const thresholdControl = document.getElementById('thresholdControl');
const saveAdminButton = document.getElementById('saveAdminSettings');
const refreshAdminButton = document.getElementById('refreshAdminSettings');
const restartServerButton = document.getElementById('restartServerButton');
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
      <div class="calibration-line"></div>
      ${segments}
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

    const monitoring = payload.monitoring || {};
    const dataHealth = monitoring.dataHealth || {};
    const performance = monitoring.performance || {};
    if (dataHealthStateLabel) {
      dataHealthStateLabel.textContent = dataHealth.stale ? 'Stale' : (dataHealth.healthy ? 'Healthy' : 'Warning');
    }
    if (dataHealthDetailLabel) {
      dataHealthDetailLabel.textContent = dataHealth.stale
        ? 'The latest data refresh is older than the freshness window.'
        : (dataHealth.providerFailureCount > 0
          ? `Provider failures detected (${dataHealth.providerFailureCount}).`
          : 'Live data refreshes are currently healthy.');
    }
    if (livePerformanceStateLabel) {
      livePerformanceStateLabel.textContent = performance.autoOrderPaused ? 'Paused' : `${Math.round((Number(performance.successRate || 0) * 100) || 0)}%`;
    }
    if (livePerformanceDetailLabel) {
      livePerformanceDetailLabel.textContent = performance.autoOrderPaused
        ? (performance.pauseReason || 'Auto-ordering is paused because success rate fell below the threshold.')
        : `Based on ${performance.sampleSize || 0} recent outcomes.`;
    }

    const runtime = payload.runtimeSettings || {};
    if (alphaControl) alphaControl.value = runtime.intradayAlpha ?? 0.7;
    if (thresholdControl) thresholdControl.value = runtime.minCombinedThreshold ?? 0.6;

    renderCalibrationChart(payload.calibration?.curve || []);
    curveMeta.textContent = `Based on ${payload.calibration?.curve?.length || 0} calibration bins`;

    const tuning = payload.tuningReport;
    const bestTuning = getBestTuningResult(tuning);
    const validationSummary = payload.calibrationMetadata?.validationSummary;
    if (bestTuning) {
      adminTuningSummary.innerHTML = `
        <strong>Best walk-forward tuning</strong><br>
        alpha ${Number(bestTuning.alpha || 0).toFixed(2)}, threshold ${Number(bestTuning.threshold || 0).toFixed(2)}<br>
        total PnL $${Number(bestTuning.totalPnl || 0).toFixed(0)}, win rate ${(Number(bestTuning.winRate || 0) * 100).toFixed(1)}%<br>
        candidate set size ${payload.candidateCounts?.candidateCount ?? '—'}.
      `;
      if (validationSummary) {
        adminTuningSummary.innerHTML += `
          <div style="margin-top:0.75rem; font-size:0.9rem; color:var(--text-secondary);">
            Validation: ${validationSummary.folds} folds, avg accuracy ${(Number(validationSummary.averageAccuracy || 0) * 100).toFixed(1)}%, avg brier ${Number(validationSummary.averageBrier || 0).toFixed(4)}
          </div>`;
      }
    } else {
      adminTuningSummary.textContent = 'Walk-forward tuning report is unavailable or not yet generated.';
    }

    if (modelRetrainAt) {
      modelRetrainAt.textContent = payload.modelMetadata?.trainedAt
        ? new Date(payload.modelMetadata.trainedAt).toLocaleString()
        : '—';
    }

    if (metaModelRetrainAt) {
      metaModelRetrainAt.textContent = payload.metaModelMetadata?.trainedAt
        ? new Date(payload.metaModelMetadata.trainedAt).toLocaleString()
        : '—';
    }

    if (snapshotCountLabel) {
      snapshotCountLabel.textContent = payload.calibrationMetadata?.snapshotCount ?? '—';
    }

    if (snapshotCountDetail) {
      snapshotCountDetail.textContent = payload.calibrationMetadata?.snapshotCount != null
        ? `Based on ${payload.calibrationMetadata.snapshotCount} snapshots`
        : 'Based on saved intraday examples';
    }

    const monitoringWarnings = [
      ...(Array.isArray(dataHealth.warnings) ? dataHealth.warnings : []),
      ...(performance.autoOrderPaused ? [performance.pauseReason || 'Auto-ordering is paused because live performance is under threshold.'] : [])
    ];

    if (health.degraded || drift.warning || dataHealth.stale || performance.autoOrderPaused || monitoringWarnings.length) {
      showAdminAlert(monitoringWarnings[0] || 'Warning: calibration or market drift requires review.', 'warning');
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

async function refreshAdminMetrics() {
  if (!refreshAdminButton) return;

  refreshAdminButton.disabled = true;
  refreshAdminButton.textContent = 'Refreshing...';

  try {
    await loadAdminMetrics();
    showAdminAlert('Admin metrics refreshed successfully.', 'healthy');
  } catch (error) {
    showAdminAlert(error.message || 'Unable to refresh admin metrics', 'danger');
  } finally {
    if (refreshAdminButton) {
      refreshAdminButton.disabled = false;
      refreshAdminButton.textContent = 'Refresh';
    }
  }
}

async function requestServerRestart() {
  if (!restartServerButton) return;
  if (!window.confirm('Restart the server? This will stop the backend process and may require a manual restart if no watcher is running.')) {
    return;
  }

  restartServerButton.disabled = true;

  try {
    const response = await fetch('/api/admin/restart', { method: 'POST' });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || 'Unable to request server restart');
    }

    showAdminAlert('Server restart requested. Backend process will stop shortly.', 'warning');
  } catch (error) {
    showAdminAlert(error.message || 'Unable to request server restart', 'danger');
  } finally {
    restartServerButton.disabled = false;
  }
}

function showSelectionModal(option, order, mode = 'info') {
  if (!selectionModal || !selectionModalText) {
    return;
  }

  activeSelectionModalMode = mode;
  let canApprove = false;
  if (mode === 'review' && option) {
    const evaluation = option.eligibility || {};
    canApprove = evaluation.status === 'pending-eligible';
    const reasons = Array.isArray(evaluation.reasons) ? evaluation.reasons : [];
    const signalSummary = evaluation.signalSummary || {};
    const reviewHtml = `
      <strong>${option.name} (${option.symbol})</strong>
      <div style="margin-top:0.6rem; color:#8fd5ff; font-weight:700;">Status: ${canApprove ? 'Pending eligible' : 'Rejected by risk rules'}</div>
      <ul style="margin:0.7rem 0 0 1rem; padding:0; color:#cfd9ec; line-height:1.55;">
        ${reasons.length ? reasons.map((reason) => `<li>${reason}</li>`).join('') : '<li>Model and signal checks were completed.</li>'}
      </ul>
      <div style="margin-top:0.7rem; font-size:0.9rem; color:#9cb2d1;">Probability ${(Number(signalSummary.probability || 0) * 100).toFixed(0)}%, combined score ${(Number(signalSummary.combinedScore || 0) * 100).toFixed(0)}%, volatility ${(Number(signalSummary.volatilityPct || 0).toFixed(2))}%</div>
      <div style="margin-top:0.7rem; font-size:0.9rem; color:${canApprove ? '#7dd3fc' : '#fda4af'};">${canApprove ? 'Manual review is required before execution.' : 'This pick is blocked by risk rules and cannot be approved.'}</div>
    `;
    selectionModalText.innerHTML = reviewHtml;
  } else {
    const symbolName = option?.name || selectedPredictionSymbol || 'your selected option';
    const stopLossMessage = order
      ? `Your order is placed at $${order.entryPrice.toFixed(2)} with a 5% trailing stop loss at $${(order.trailingStopPrice || order.stopLossPrice || order.entryPrice * 0.95).toFixed(2)}. `
      : '';

    selectionModalText.innerHTML = `<div>${`You picked ${symbolName} for today. ${stopLossMessage}The position is pending in History until the profit target or stop loss condition is met.`}</div>`;
  }

  const closeLabel = mode === 'review' ? (canApprove ? 'Approve & place' : 'Close') : 'Continue';
  if (selectionModalClose) {
    selectionModalClose.textContent = closeLabel;
  }
  if (selectionModalSecondary) {
    selectionModalSecondary.style.display = mode === 'review' ? 'inline-flex' : 'none';
  }
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

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function parseMarkdownToHtml(markdown) {
  const lines = markdown.split(/\r?\n/);
  let html = '';
  let currentList = null;
  let paragraphOpen = false;

  const closeParagraph = () => {
    if (paragraphOpen) {
      html += '</p>';
      paragraphOpen = false;
    }
  };

  const closeList = () => {
    if (currentList) {
      html += currentList === 'ol' ? '</ol>' : '</ul>';
      currentList = null;
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      closeList();
      closeParagraph();
      continue;
    }

    const headerMatch = line.match(/^(#{1,2})\s+(.*)$/);
    const olMatch = line.match(/^\d+\.\s+(.*)$/);
    const ulMatch = line.match(/^[-*+]\s+(.*)$/);

    if (headerMatch) {
      closeList();
      closeParagraph();
      const level = headerMatch[1].length + 1;
      html += `<h${level}>${escapeHtml(headerMatch[2])}</h${level}>`;
      continue;
    }

    if (olMatch) {
      if (currentList !== 'ol') {
        closeParagraph();
        closeList();
        currentList = 'ol';
        html += '<ol class="doc-list">';
      }
      html += `<li>${escapeHtml(olMatch[1])}</li>`;
      continue;
    }

    if (ulMatch) {
      if (currentList !== 'ul') {
        closeParagraph();
        closeList();
        currentList = 'ul';
        html += '<ul class="doc-list">';
      }
      html += `<li>${escapeHtml(ulMatch[1])}</li>`;
      continue;
    }

    if (!paragraphOpen) {
      closeList();
      html += '<p>';
      paragraphOpen = true;
    } else {
      html += ' ';
    }

    html += escapeHtml(line);
  }

  closeList();
  closeParagraph();

  return html;
}

async function fetchAppDocumentation() {
  if (appInfoCache) {
    return appInfoCache;
  }

  try {
    const response = await fetch('/api/docs/what-does-this-app-do', { cache: 'no-store' });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || 'Unable to load documentation');
    }

    appInfoCache = payload.content || 'Documentation could not be loaded.';
    return appInfoCache;
  } catch (error) {
    return `Unable to load documentation: ${error.message}`;
  }
}

async function openAppInfo() {
  if (!appInfoModal || !appInfoBody) {
    return;
  }

  const markdown = await fetchAppDocumentation();
  appInfoBody.innerHTML = parseMarkdownToHtml(markdown);

  appInfoModal.classList.remove('hidden');
  appInfoModal.setAttribute('aria-hidden', 'false');
}

function closeAppInfo() {
  if (!appInfoModal) {
    return;
  }

  appInfoModal.classList.add('hidden');
  appInfoModal.setAttribute('aria-hidden', 'true');
}

function renderCandidateDetail(detail) {
  if (!detail || typeof detail !== 'object') {
    return '<div class="option-card">Unable to load candidate details.</div>';
  }

  const probabilityText = Number(detail.probability || 0) > 0
    ? `${(Number(detail.probability) * 100).toFixed(1)}%`
    : '—';
  const combinedScoreText = Number(detail.combinedScore || 0) > 0
    ? Number(detail.combinedScore).toFixed(3)
    : '—';
  const riskStatus = detail.evaluation?.status || 'unknown';
  const riskReasons = Array.isArray(detail.evaluation?.reasons) ? detail.evaluation.reasons : [];
  const riskFlags = Array.isArray(detail.evaluation?.riskFlags) ? detail.evaluation.riskFlags : [];
  const featureBreakdownHtml = Array.isArray(detail.featureBreakdown) && detail.featureBreakdown.length
    ? detail.featureBreakdown.map((feature) => `
        <div class="metric-chip">
          <span class="metric-label">${feature.label}</span>
          <strong>${feature.value}</strong>
        </div>
      `).join('')
    : '<div class="metric-chip">Feature details unavailable.</div>';

  const riskListHtml = riskReasons.length
    ? `<ul class="candidate-detail-list">${riskReasons.map((reason) => `<li>${reason}</li>`).join('')}</ul>`
    : '<div class="candidate-detail-copy">No risk reasons were recorded.</div>';

  const trendDetails = detail.trendContext || {};
  const trendSummary = [];
  if (trendDetails.regime) trendSummary.push(`Regime: ${trendDetails.regime}`);
  if (trendDetails.candlePattern) trendSummary.push(`Pattern: ${trendDetails.candlePattern.pattern || trendDetails.candlePattern}`);
  if (trendDetails.snapshotFresh !== undefined) trendSummary.push(`Snapshot: ${trendDetails.snapshotFresh ? 'fresh' : 'stale'}`);

  const trendSummaryHtml = trendSummary.length
    ? `<div class="candidate-detail-copy">${trendSummary.join(' • ')}</div>`
    : '<div class="candidate-detail-copy">Trend and regime context unavailable.</div>';

  return `
    <section class="candidate-detail-section">
      <div class="candidate-detail-row">
        <div>
          <strong>Symbol</strong>
          <div>${detail.symbol || 'Unknown'}</div>
        </div>
        <div>
          <strong>Region</strong>
          <div>${detail.region || 'N/A'}</div>
        </div>
        <div>
          <strong>Price</strong>
          <div>$${Number(detail.currentPrice || 0).toFixed(2)}</div>
        </div>
      </div>
      <div class="confidence-grid">
        <div class="confidence-item"><span>Probability</span><strong>${probabilityText}</strong></div>
        <div class="confidence-item"><span>Combined score</span><strong>${combinedScoreText}</strong></div>
        <div class="confidence-item"><span>Expected move</span><strong>${(Number(detail.expectedMoveScore || 0) * 100).toFixed(1)}%</strong></div>
        <div class="confidence-item"><span>Liquidity</span><strong>${Number(detail.liquidityScore || 0).toFixed(2)}</strong></div>
      </div>
      <div class="candidate-detail-copy">Target move: ${Number(detail.targetMovePct || 0).toFixed(2)}%, day move: ${Number(detail.dayMovePct || 0).toFixed(2)}%</div>
      <div class="candidate-detail-copy">Review status: ${riskStatus}${detail.evaluation?.reviewRequired ? ' (manual review required)' : ''}</div>
      ${riskFlags.length ? `<div class="candidate-detail-copy">Risk flags: ${riskFlags.join(', ')}</div>` : ''}
    </section>

    <section class="candidate-detail-section">
      <div class="candidate-detail-section-title">Feature & trend drivers</div>
      <div class="metric-grid">${featureBreakdownHtml}</div>
      ${trendSummaryHtml}
    </section>

    <section class="candidate-detail-section">
      <div class="candidate-detail-section-title">Risk review and reasons</div>
      ${riskListHtml}
    </section>
  `;
}

async function fetchCandidateDetail(symbol) {
  const minProfit = Number(minProfitInput?.value || 100);
  const ballpark = Number(ballparkInput?.value || 500);
  const searchParams = new URLSearchParams({ symbol, minProfit: String(minProfit), ballpark: String(ballpark) });
  const response = await fetch(`/api/candidate-detail?${searchParams.toString()}`);
  const payload = await response.json();
  if (!response.ok || !payload.ok || !payload.detail) {
    throw new Error(payload.error || 'Unable to fetch candidate detail');
  }
  return payload.detail;
}

async function openCandidateDetail(symbol) {
  if (!candidateDetailModal || !candidateDetailContent || !candidateDetailSubtitle) {
    return;
  }

  candidateDetailSubtitle.textContent = `Loading ${symbol} candidate intelligence...`;
  candidateDetailContent.innerHTML = '<div class="option-card">Fetching candidate details…</div>';
  candidateDetailModal.classList.remove('hidden');
  candidateDetailModal.setAttribute('aria-hidden', 'false');

  try {
    const detail = await fetchCandidateDetail(symbol);
    candidateDetailSubtitle.textContent = `${detail.name || symbol} — ${detail.currentPrice ? `$${Number(detail.currentPrice).toFixed(2)}` : 'price unavailable'}`;
    candidateDetailContent.innerHTML = renderCandidateDetail(detail);
  } catch (error) {
    candidateDetailSubtitle.textContent = 'Unable to load candidate details.';
    candidateDetailContent.innerHTML = `<div class="option-card">${error.message || 'Candidate detail lookup failed.'}</div>`;
  }
}

function closeCandidateDetail() {
  if (!candidateDetailModal) {
    return;
  }

  candidateDetailModal.classList.add('hidden');
  candidateDetailModal.setAttribute('aria-hidden', 'true');
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

let homeOrderRefreshTimer = null;

async function refreshHomeOrderState() {
  try {
    await Promise.all([updateDailyBalance(), updateDailyPnl()]);
  } catch {
    // Ignore refresh errors and keep the UI responsive.
  }
}

function startHomeOrderAutoRefresh() {
  if (homeOrderRefreshTimer) {
    return;
  }

  homeOrderRefreshTimer = window.setInterval(() => {
    refreshHomeOrderState().catch(() => {});
  }, 15000);
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
  const orders = Array.isArray(existing.orders) ? existing.orders : [];
  entries.push(entry);
  localStorage.setItem(LOCAL_HISTORY_KEY, JSON.stringify({
    entries: entries.slice(-60),
    orders: orders.slice(-60)
  }));
  updateDailyBalance();
  updateDailyPnl();
}

window.addEventListener('orders-cleared', () => {
  updateDailyBalance();
  updateDailyPnl();
});

async function createPendingOrder(option, overrides = {}) {
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
        stopLossPct: 5,
        force: true,
        requireManualReview: true,
        manualReviewApproved: Boolean(overrides.manualReviewApproved),
        probability: Number(option.probability || 0),
        combinedScore: Number(option.combinedScore ?? option.score ?? 0),
        dayMovePct: Number(option.dayMovePct || 0),
        advancedSignals: option.advancedSignals || {},
        stopLossAmount: Number(option.stopLossAmount || 0)
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
      marketScore: Number(((option.compositeScore ?? option.score) || 0).toFixed(2)),
      compositeScore: Number(((option.compositeScore ?? option.score) || 0).toFixed(2)),
      eligibility: option.eligibility || { status: option.eligibleForExecution ? 'pending-eligible' : 'rejected-risk', reasons: ['Manual review and risk checks were completed.'] }
    }));
    selectedPredictionSymbol = latestPredictionOptions[0]?.symbol || '';

    const headerCard = `<div class="option-card info-card"><strong>${payload.viable ? 'Live picks meet your target' : 'No currently viable live pick'}</strong><div class="info-copy">${payload.note}</div><div class="info-copy">Live source: ${payload.liveSource}</div></div>`;
    const optionsMarkup = latestPredictionOptions.length
      ? latestPredictionOptions.map((option, index) => {
        const evaluation = option.eligibility || {};
        const statusText = evaluation.status === 'pending-eligible' ? 'Pending review' : 'Blocked by risk rules';
        const actionLabel = evaluation.status === 'pending-eligible' ? `Review and approve ${index + 1}` : `Review reason ${index + 1}`;
        return `
        <article class="option-card ${option.viable ? '' : 'watch-card'}">
          <h3>${option.name} (${option.symbol})</h3>
          <div class="option-meta">
            <span>Region: ${option.region}</span>
            <span>Current price: ${Number(option.currentPrice).toFixed(2)}</span>
            <span>Day move: ${Number(option.dayMovePct).toFixed(2)}%</span>
            <span>Signal: ${option.signalType}</span>
            <span>Composite score: ${option.marketScore}</span>
            <span>Probability: ${(Number(option.probability) * 100).toFixed(0)}%</span>
            <span>Quality: ${Number(option.qualityScore || 0).toFixed(2)}</span>
            <span>Expected move: ${(Number(option.expectedMoveScore || 0) * 100).toFixed(0)}%</span>
            <span>Liquidity: ${Number(option.liquidityScore || 0).toFixed(2)}</span>
            <span>News mentions: ${option.newsMentions}</span>
            <span>Estimated profit: ${option.estimatedProfit.toFixed(2)}</span>
            <span>Leverage profit: ${option.leverageProfit.toFixed(2)}</span>
          </div>
          <div class="review-pill">${statusText}</div>
          <div class="review-details">${Array.isArray(evaluation.reasons) ? evaluation.reasons.slice(0, 2).join(' • ') : 'Review required before execution.'}</div>
          <div class="option-actions">
            <button data-details="${option.symbol}" class="ghost-button small-button">View details</button>
            <a href="candidate.html?symbol=${option.symbol}" class="ghost-button small-button">Open full page</a>
            <button data-select="${option.symbol}" class="ghost-button">${actionLabel}</button>
          </div>
        </article>
      `;
      }).join('')
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
    const detailTarget = event.target.closest('[data-details]');
    if (detailTarget && !detailTarget.disabled) {
      const symbol = detailTarget.getAttribute('data-details');
      if (symbol) {
        detailTarget.disabled = true;
        window.location.assign(`candidate.html?symbol=${encodeURIComponent(symbol)}`);
        detailTarget.disabled = false;
      }
      return;
    }

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

    pendingReviewOption = option;
    showSelectionModal(option, null, 'review');
    target.disabled = false;
    updateStatus(`Reviewing ${option.name} before placement.`);
  });
}

if (selectionModalClose) {
  selectionModalClose.addEventListener('click', async () => {
    if (activeSelectionModalMode === 'review' && pendingReviewOption) {
      const option = pendingReviewOption;
      const evaluation = option.eligibility || {};
      if (evaluation.status === 'rejected-risk') {
        updateStatus(`${option.symbol} is blocked by risk rules and was not placed.`);
        pendingReviewOption = null;
        hideSelectionModal();
        return;
      }

      updateStatus(`Placing order for ${option.name}...`);
      const order = await createPendingOrder(option, { manualReviewApproved: true });
      if (!order) {
        return;
      }

      updateStatus(`Order placed at $${order.entryPrice.toFixed(2)} with a 5% trailing stop loss.`);
      showSelectionModal(option, order, 'info');
      return;
    }

    hideSelectionModal();
  });
}

if (selectionModalSecondary) {
  selectionModalSecondary.addEventListener('click', () => {
    pendingReviewOption = null;
    hideSelectionModal();
  });
}

if (selectionModal) {
  selectionModal.addEventListener('click', (event) => {
    if (event.target === selectionModal) {
      hideSelectionModal();
    }
  });
}

if (appInfoModal) {
  appInfoModal.addEventListener('click', (event) => {
    if (event.target === appInfoModal) {
      closeAppInfo();
    }
  });
}

if (candidateDetailModal) {
  candidateDetailModal.addEventListener('click', (event) => {
    if (event.target === candidateDetailModal) {
      closeCandidateDetail();
    }
  });
}

if (candidateDetailClose) {
  candidateDetailClose.addEventListener('click', closeCandidateDetail);
}

if (infoButton) {
  infoButton.addEventListener('click', openAppInfo);
}

if (appInfoClose) {
  appInfoClose.addEventListener('click', closeAppInfo);
}

if (searchButton) {
  searchButton.addEventListener('click', searchPrediction);
}

async function triggerAutoOrdersOnLoad() {
  try {
    const response = await fetch('/api/auto-orders/trigger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || 'Unable to trigger auto orders');
    }
  } catch {
    // Best-effort startup trigger; ignore failures so page still loads.
  }
}

if (saveAdminButton) {
  saveAdminButton.addEventListener('click', saveAdminSettings);
}

if (refreshAdminButton) {
  refreshAdminButton.addEventListener('click', refreshAdminMetrics);
}

if (restartServerButton) {
  restartServerButton.addEventListener('click', requestServerRestart);
}

updateSessionBadge();
updateDailyBalance();
updateDailyPnl();
triggerAutoOrdersOnLoad().catch(() => {});
startHomeOrderAutoRefresh();

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
