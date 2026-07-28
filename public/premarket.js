const premarketResults = document.getElementById('premarketResults');
const premarketSearchInput = document.getElementById('premarketSearch');
const premarketSearchButton = document.getElementById('premarketSearchButton');

function money(value) {
  return Number(value || 0).toFixed(2);
}

function formatConfidenceItem(label, value) {
  const numericValue = Number(value || 0);
  const percent = `${numericValue.toFixed(0)}%`;
  return `<div class="confidence-item"><span>${label}</span><strong>${percent}</strong></div>`;
}

function formatProbability(value) {
  const numericValue = Number(value || 0);
  return `${(numericValue * 100).toFixed(0)}%`;
}

async function renderPreMarketPage(query = '') {
  try {
    const response = await fetch(`/api/premarket?depositUSD=100&leverage=2${query ? `&query=${encodeURIComponent(query)}` : ''}`);
    const payload = await response.json();

    if (!response.ok || !Array.isArray(payload.results) || !payload.results.length) {
      throw new Error(payload.error || 'No pre-market signal data was available.');
    }

    // fetch intraday picks and render a top-picks banner above results
    let intradayHTML = '';
    try {
      const intradayResp = await fetch(`/api/intraday-picks?top=5`);
      const intradayPayload = await intradayResp.json();
      if (intradayResp.ok && Array.isArray(intradayPayload.picks) && intradayPayload.picks.length) {
        intradayHTML = `
          <section class="intraday-picks">
            <h4>Top intraday picks</h4>
            <div class="intraday-list">
              ${intradayPayload.picks.map(p => `<div class="intraday-item"><strong>${p.symbol}</strong> ${p.name} — ${formatProbability(p.probability)}</div>`).join('')}
            </div>
          </section>
        `;
      }
    } catch (e) {
      // ignore intraday fetch errors
    }

    premarketResults.innerHTML = intradayHTML + payload.results.map((item) => {
      const advanced = item.advancedSignals || {};
      const regime = advanced.regime || 'range';
      const probability = formatProbability(advanced.probability || 0);
      const sectorStrength = `${Math.round((Number(advanced.sectorStrength || 0.5) * 100))}%`;
      const liquidityPenalty = `${Math.round((Number(advanced.liquidityPenalty || 0) * 100))}%`;
      const historicalCalibration = `${Math.round((Number(advanced.historicalCalibration || 0.5) * 100))}%`;

      return `
        <article class="option-card clean-card">
          <div class="card-header-row">
            <div>
              <h3>${item.name} (${item.symbol})</h3>
              <small>${item.region}</small>
            </div>
            <span class="signal-pill ${item.signalScore >= 70 ? 'positive' : 'neutral'}">Signal ${money(item.signalScore)}%</span>
          </div>

          <div class="metric-grid">
            <div class="metric-chip">
              <span class="metric-label">Current price</span>
              <strong>${money(item.currentPrice)}</strong>
            </div>
            <div class="metric-chip">
              <span class="metric-label">Move vs prior close</span>
              <strong>${money(item.movePct)}%</strong>
            </div>
            <div class="metric-chip">
              <span class="metric-label">News mentions</span>
              <strong>${item.newsMentions}</strong>
            </div>
            <div class="metric-chip">
              <span class="metric-label">Leverage profit @ 2x</span>
              <strong>$${money(item.leverageProfit)}</strong>
            </div>
          </div>

          <div class="confidence-panel">
            <div class="confidence-panel-header">
              <strong>Model confidence factors</strong>
              <span>Probability: ${probability}</span>
            </div>
            <div class="confidence-grid">
              <div class="confidence-item"><span>Regime</span><strong>${regime}</strong></div>
              <div class="confidence-item"><span>RSI</span><strong>${Math.round(Number(advanced.rsi || 50))}</strong></div>
              <div class="confidence-item"><span>Momentum</span><strong>${Math.round(Number(advanced.technicalScore || 0))}%</strong></div>
              <div class="confidence-item"><span>Sentiment</span><strong>${Math.round(Number(advanced.sentimentScore || 0))}%</strong></div>
              <div class="confidence-item"><span>Sector strength</span><strong>${sectorStrength}</strong></div>
              <div class="confidence-item"><span>Liquidity penalty</span><strong>${liquidityPenalty}</strong></div>
              <div class="confidence-item"><span>Historical fit</span><strong>${historicalCalibration}</strong></div>
              <div class="confidence-item"><span>Volatility</span><strong>${advanced.volatilityRegime || 'balanced'}</strong></div>
            </div>
          </div>
        </article>
      `;
    }).join('');
  } catch (error) {
    premarketResults.innerHTML = '<div class="option-card">Pre-market signal data is unavailable right now.</div>';
  }
}

if (premarketSearchButton) {
  premarketSearchButton.addEventListener('click', () => renderPreMarketPage(premarketSearchInput?.value || ''));
}

renderPreMarketPage();
