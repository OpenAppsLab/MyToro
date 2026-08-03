# What Does This App Do?

This app is a local trading game and model-backed stock selection system that uses market snapshots, signal features, and machine learning to generate intraday trading candidates and manage order execution.

## 1. Data collection and snapshot persistence

1. The app fetches market data from Yahoo Finance for every curated symbol in `scripts/symbol_watchlist.js`.
2. The refresh pipeline in `scripts/refresh_snapshots.js` writes JSON snapshots into `data/` for:
   - intraday 5-minute bars (`*_snapshot_intraday_1d_5m.json`)
   - the last 5 trading days of daily bars (`*_snapshot_daily_5d_1d.json`)
   - the last 2 months of daily bars (`*_snapshot_daily_2mo_1d.json`)
3. These snapshots provide the historical and intraday context needed for training, calibration, live signal generation, and order validation.

## 2. Model training and persistence

1. `scripts/train_and_persist_intraday.js` reads intraday snapshots from `data/` and builds training examples.
2. It derives features such as price momentum, volatility, volume history, and advanced intraday signals.
3. It trains a compact logistic intraday model to estimate the probability that a symbol will hit a target intraday move.
4. The trained model is saved to `models/intraday_model.json` so the server can load and reuse it at startup.

## 3. Walk-forward calibration and runtime tuning

1. `scripts/walk_forward_calibration.js` loads snapshot-derived examples and evaluates model performance over multiple folds.
2. It runs alpha/threshold optimization via `optimizeAlphaThreshold(...)` to select the best blending and gating values.
3. It computes calibration curves and health metrics using `calibrateModel(...)` and `computeCalibrationHealth(...)`.
4. It persists the tuning report to `models/walk_forward_tuning.json` and saves meta-model metadata for runtime calibration.

## 4. Server prediction and UI picks

1. The Express server in `server.js` loads the persisted intraday model at startup with `loadPersistedIntradayModel()`.
2. It exposes live endpoints that read the latest snapshots and news, compute signals, and rank symbols.
3. Each symbol is scored using both:
   - a model probability `p` from the intraday logistic model,
   - a normalized ensemble score `s` from legacy signals.
4. These are blended into a combined score using `alpha`:
   - `combined = alpha * p + (1 - alpha) * s`
5. The UI in `public/app.js` and `public/premarket.js` displays the top candidates, probability drivers, combined score, and whether a symbol qualifies for auto-order consideration.

## 5. Order placement and stop-loss behavior

### Order creation

- Orders are created via `POST /api/orders`.
- Required fields are:
  - `symbol`
  - `name`
  - `entryPrice`
  - `targetProfit`
  - `ballparkAmount`
  - `leverage`
- If any required field is invalid or missing, the API rejects the request.
- Manual orders may be forced via `force`, which allows placement even when the model confidence threshold is not met.

### Stop-loss setup

- Every order is initialized with a stop-loss based on the entry price.
- If the request does not include `stopLossPct` or `stopLossAmount`, the app defaults to a `5%` stop-loss percent.
- The stop-loss percent is bounded between `0.1%` and `10.0%`.
- The stop-loss dollar amount is calculated as:
  - `stopLossAmount = entryPrice * stopLossPct / 100`
- The initial trailing stop price is set to:
  - `entryPrice * (1 - stopLossPct / 100)`
- The initial target price is set according to leverage and target profit.

### Trailing stop loss behavior

- The app uses a `5%` trailing stop loss logic during order evaluation.
- As the order price rises, the high-water mark updates to the highest price achieved.
- The trailing stop price is recalculated as:
  - `currentHighWaterMark * (1 - 0.05)`
- The order closes when either:
  - the current price reaches or exceeds the target price, or
  - the current price falls to or below the trailing stop price.
- When the trailing stop triggers, the order may still close as a profit if the current price is above the entry price.

### Maximum loss and minimum trade size

- The maximum loss is effectively defined by the stop-loss percentage or amount. With the default, a loss cannot exceed roughly `5%` of the entry price for that trade.
- Because `ballparkAmount` is used to compute position sizing, actual share count is `max(1, floor((ballparkAmount / entryPrice) * leverage))`.
- This means the minimum trade is always at least one share, even if the ballpark amount is small.

## 6. Auto-order gating and runtime settings

- Auto-orders require the candidate to pass runtime gating logic in `canPlaceAutoOrder()` and `shouldPlaceAutoOrder()`.
- Gating is based on:
  - `AUTO_ORDER_SETTINGS.intradayAlpha`
  - `AUTO_ORDER_SETTINGS.minCombinedThreshold`
  - current market state and order cadence
- Runtime settings such as `alpha`, threshold, `ballparkAmount`, and `leverage` are persisted and can be adjusted by calibration scripts or admin controls.

## 7. Order lifecycle and settlement

1. Orders are created as `pending` records in memory.
2. The server repeatedly evaluates pending orders against live prices.
3. If a target or trailing stop condition is met, the order status updates to `green` for profit or `red` for loss.
4. Settled orders are retained in history for display.
5. Pending orders are refreshed via `POST /api/orders/refresh` and loaded via `GET /api/orders`.

## 8. Calibration and evaluation endpoints

- `POST /api/backtest-intraday` — validates probability predictions against historical examples and computes the Brier score.
- `POST /api/calibrate-intraday` — fits logistic or isotonic calibration curves to example data.
- `POST /api/optimize-alpha` — searches for the best alpha and threshold tradeoff.
- `POST /api/train-meta-model` — trains a secondary meta-model using intraday model output and runtime examples.
- `GET /api/admin/metrics` — returns model metadata, calibration metadata, tuning report, and runtime gating status.

## 9. Daily workflow

1. Run `npm run refresh:snapshots` to refresh symbol snapshots.
2. Run `npm run refresh:models` to retrain and persist the intraday model.
3. Run `npm run refresh:walkforward` to tune alpha/threshold, persist the model calibration report, and generate meta-model metadata.
4. Restart the server to load the latest persisted models and runtime metrics.

## 10. How this could be used in real time market?

- In live trading, the app can help convert fresh market snapshots into actionable intraday candidates before or during market hours.
- Updated `data/` snapshots become the current market context for the server to score today’s symbols and identify the strongest momentum setups.
- The Home page then shows the best ranked candidates, and the Admin page helps verify whether model calibration and drift are in acceptable ranges.
- When the market opens, the server can place auto-orders for symbols that meet runtime gating, while the app continues to evaluate trailing stops and profit targets.
- After every data refresh, rerun the calibration workflow so the model weights and runtime thresholds stay aligned with the newest market behavior.
- Recommended live workflow:
  1. run `npm run refresh:snapshots`
  2. run `npm run refresh:models`
  3. run `npm run refresh:walkforward`
  4. restart the server and verify Admin metrics before relying on live auto-orders.
- This helps the app stay connected to current market conditions and avoids stale decisions when the `data/` folder has been updated.

## 11. Why this app exists

- To turn live market snapshots into probability-weighted intraday picks.
- To combine a logistic model with legacy ensemble signals for stronger ranking.
- To add safe order gating, trailing stop logic, and manual override support.
- To keep the workflow reproducible through persisted model and calibration artifacts.

## 11. Key files

- `server.js` — core app engine, prediction flow, order placement, and stop-loss evaluation.
- `scripts/refresh_snapshots.js` — snapshot persistence pipeline.
- `scripts/train_and_persist_intraday.js` — intraday model training.
- `scripts/walk_forward_calibration.js` — calibration, optimization, and meta-model persistence.
- `scripts/symbol_watchlist.js` — curated symbol universe.
- `data/` — saved market snapshots.
- `models/` — persisted model weights, tuning reports, and calibration metadata.
