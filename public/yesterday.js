const yesterdayResults = document.getElementById('yesterdayResults');

function money(value) {
  return Number(value || 0).toFixed(2);
}

async function renderYesterdayPage() {
  try {
    const response = await fetch('/api/yesterday?depositUSD=100&leverage=2');
    const payload = await response.json();

    if (!response.ok || !Array.isArray(payload.results) || !payload.results.length) {
      throw new Error(payload.error || 'No yesterday gainers were available.');
    }

    yesterdayResults.innerHTML = payload.results.map((item) => `
      <article class="option-card clean-card">
        <div class="card-header-row">
          <div>
            <h3>${item.name} (${item.symbol})</h3>
            <small>${item.region}</small>
          </div>
          <span class="signal-pill positive">+${money(item.movePct)}%</span>
        </div>

        <div class="metric-grid">
          <div class="metric-chip">
            <span class="metric-label">Prev close</span>
            <strong>${money(item.previousClose)}</strong>
          </div>
          <div class="metric-chip">
            <span class="metric-label">Latest close</span>
            <strong>${money(item.latestClose)}</strong>
          </div>
          <div class="metric-chip">
            <span class="metric-label">Profit @ $100</span>
            <strong>$${money(item.estimatedProfit)}</strong>
          </div>
          <div class="metric-chip">
            <span class="metric-label">Leverage profit @ 2x</span>
            <strong>$${money(item.leverageProfit)}</strong>
          </div>
        </div>
      </article>
    `).join('');
  } catch (error) {
    yesterdayResults.innerHTML = '<div class="option-card">Live yesterday results are unavailable right now.</div>';
  }
}

renderYesterdayPage();
