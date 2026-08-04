const title = document.getElementById('candidatePageTitle');
const content = document.getElementById('candidatePageContent');

function escapeHtml(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatPct(value) {
  return `${(Number(value || 0) * 100).toFixed(1)}%`;
}

function renderCandidatePage(detail) {
  const featureRows = Array.isArray(detail.featureBreakdown) && detail.featureBreakdown.length
    ? detail.featureBreakdown.map((feature) => `
        <div class="metric-chip">
          <span class="metric-label">${escapeHtml(feature.label)}</span>
          <strong>${escapeHtml(feature.value)}</strong>
        </div>
      `).join('')
    : '<div class="metric-chip">Feature details unavailable.</div>';

  const riskRows = Array.isArray(detail.riskTable) && detail.riskTable.length
    ? detail.riskTable.map((item) => `
        <tr>
          <td>${escapeHtml(item.id || '')}</td>
          <td>${escapeHtml(item.description || '')}</td>
          <td>${escapeHtml(item.status || '')}</td>
        </tr>
      `).join('')
    : '<tr><td colspan="3">No risk table rows were recorded.</td></tr>';

  const trendDetails = detail.trendContext || {};
  const trendSummary = [];
  if (trendDetails.regime) trendSummary.push(`Regime: ${trendDetails.regime}`);
  if (trendDetails.candlePattern) trendSummary.push(`Pattern: ${trendDetails.candlePattern.pattern || trendDetails.candlePattern}`);
  if (trendDetails.snapshotFresh !== undefined) trendSummary.push(`Snapshot: ${trendDetails.snapshotFresh ? 'fresh' : 'stale'}`);

  return `
    <section class="candidate-detail-section">
      <div class="candidate-detail-row">
        <div>
          <strong>Symbol</strong>
          <div>${escapeHtml(detail.symbol || 'Unknown')}</div>
        </div>
        <div>
          <strong>Current price</strong>
          <div>$${Number(detail.currentPrice || 0).toFixed(2)}</div>
        </div>
        <div>
          <strong>Day move</strong>
          <div>${Number(detail.dayMovePct || 0).toFixed(2)}%</div>
        </div>
      </div>
      <div class="confidence-grid">
        <div class="confidence-item"><span>Probability</span><strong>${formatPct(detail.probability)}</strong></div>
        <div class="confidence-item"><span>Combined score</span><strong>${Number(detail.combinedScore || 0).toFixed(3)}</strong></div>
        <div class="confidence-item"><span>Expected move</span><strong>${formatPct(detail.expectedMoveScore)}</strong></div>
        <div class="confidence-item"><span>Liquidity</span><strong>${Number(detail.liquidityScore || 0).toFixed(2)}</strong></div>
      </div>
      <div class="candidate-detail-copy">Review status: ${escapeHtml(detail.evaluation?.status || 'unknown')}${detail.evaluation?.reviewRequired ? ' (manual review required)' : ''}</div>
      <div class="candidate-detail-copy">Target move: ${Number(detail.targetMovePct || 0).toFixed(2)}%, signal type: ${escapeHtml(detail.signalType || 'unknown')}</div>
    </section>

    <section class="candidate-detail-section">
      <div class="candidate-detail-section-title">Features used</div>
      <div class="metric-grid">${featureRows}</div>
      <div class="candidate-detail-copy">${trendSummary.length ? trendSummary.join(' • ') : 'Trend context unavailable.'}</div>
    </section>

    <section class="candidate-detail-section">
      <div class="candidate-detail-section-title">Risk table</div>
      <table class="candidate-risk-table">
        <thead>
          <tr><th>#</th><th>Reason</th><th>Status</th></tr>
        </thead>
        <tbody>${riskRows}</tbody>
      </table>
    </section>
  `;
}

async function loadCandidate() {
  const params = new URLSearchParams(window.location.search);
  const symbol = params.get('symbol');
  if (!symbol) {
    title.textContent = 'Candidate detail';
    content.innerHTML = '<div class="option-card">No symbol was supplied.</div>';
    return;
  }

  title.textContent = `${symbol} candidate detail`;
  content.innerHTML = '<div class="option-card">Loading candidate intelligence…</div>';

  try {
    const response = await fetch(`/api/candidate-detail?symbol=${encodeURIComponent(symbol)}&minProfit=100&ballpark=3000`);
    const payload = await response.json();
    if (!response.ok || !payload.ok || !payload.detail) {
      throw new Error(payload.error || 'Unable to load candidate detail');
    }
    content.innerHTML = renderCandidatePage(payload.detail);
  } catch (error) {
    content.innerHTML = `<div class="option-card">${escapeHtml(error.message || 'Unable to load candidate detail')}</div>`;
  }
}

loadCandidate();
