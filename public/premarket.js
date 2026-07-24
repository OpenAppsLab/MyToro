const premarketResults = document.getElementById('premarketResults');

function money(value) {
  return Number(value || 0).toFixed(2);
}

async function renderPreMarketPage() {
  try {
    const response = await fetch('/api/premarket?depositUSD=100&leverage=2');
    const payload = await response.json();

    if (!response.ok || !Array.isArray(payload.results) || !payload.results.length) {
      throw new Error(payload.error || 'No pre-market signal data was available.');
    }

    premarketResults.innerHTML = payload.results.map((item) => `
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
      </article>
    `).join('');
  } catch (error) {
    premarketResults.innerHTML = '<div class="option-card">Pre-market signal data is unavailable right now.</div>';
  }
}

renderPreMarketPage();
