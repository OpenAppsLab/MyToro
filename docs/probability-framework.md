**Probability Framework — Current (Latest)**

This document describes the current probability framework used to generate intraday picks, how the system selects symbols, and a compact TODO list for future improvements.

**High-Level Flow**

```mermaid
flowchart TD
    A[Market snapshot + Headlines] --> B[Advanced signal builder]
    B --> C[Feature vectors]
    C --> D[Intraday logistic model]
    C --> E[Ensemble score normalization]
    D --> F[Intraday probability `p`]
    E --> F2[Normalized ensemble score `s`]
    F & F2 --> G[Combined score: alpha*p + (1-alpha)*s]
    G --> H[Threshold gating + ranking]
    H --> I[UI picks / Auto-orders / Manual orders]
```

**How the framework picks the right stocks**

- **Feature construction:** : The app builds a rich, explainable feature set per symbol (technical indicators, volatility/ATR, RSI, moving-average distance, MACD-style histogram, Hurst exponent/regime, candle pattern strength, cross-sectional percentiles, volume Z, sentiment and sector signals). Implementations live in `buildFeatureVector(...)` / `buildIntradayFeatureVector(...)` inside [server.js](server.js).
- **Intraday probability model:** : A compact logistic model (weights in `DEFAULT_INTRADAY_MODEL`) converts intraday features into a probability `p` that the symbol will make a target intraday move (default threshold 2.5%). The model output is clamped and exposed for explainability.
- **Ensemble score normalization:** : The app also receives an existing ensemble/score (`signal.score`), which is normalized to [0,1] as `s = (score/100)`. This preserves legacy signals and enables blending.
- **Blended ranking & gating:** : A combined score is computed as `combined = alpha * p + (1-alpha) * s` where `alpha` defaults to `AUTO_ORDER_SETTINGS.intradayAlpha` (configurable). Auto-orders and UI recommendations require `combined >= AUTO_ORDER_SETTINGS.minCombinedThreshold` to pass the gating filter — this prevents low-confidence automated trades.
- **Safety & business rules:** : The pipeline enforces trading constraints (wait-after-open, leverage/ballpark sizing, stop-loss defaults), uses `canPlaceAutoOrder()`/`shouldPlaceAutoOrder()` checks (see [server.js](server.js)), and supports forced manual overrides when required.
- **Explainability in UI:** : Results include the probability `p`, top contributing features, and the blended `combined` score — surfaced in the premarket / home UI via [public/premarket.js](public/premarket.js) and [public/app.js](public/app.js).
- **Backtest validation:** : The system supports `POST /api/backtest-intraday` to run Brier-score based validation on example snapshots and compute calibration metrics before trusting auto-orders.

**What changed in this update**

- Replaced ad‑hoc penalty stacking with a feature-based logistic model for better validation and tunability.
- Added an intraday-specific feature vector and `DEFAULT_INTRADAY_MODEL` weights used for morning→evening picks.
- Blended intraday probability with existing ensemble score and enforced a `minCombinedThreshold` for placing auto-orders.
- Exposed `/api/intraday-picks` and `/api/backtest-intraday` endpoints and added training helpers (`trainIntradayModel`, `trainLogisticRegression`).
- Added scripts to persist market snapshots for offline backtests: see [scripts/fetch_yahoo.js](scripts/fetch_yahoo.js) which writes snapshots to the `data/` folder.

**Current limitations**

- Trained model persistence is not yet implemented — weights are currently defaulted or in-memory after training.
- Formal probability calibration (reliability plots, isotonic/logistic recalibration) is not yet applied to `p`.
- Stacked meta-model (meta‑learner combining `p` and `s`) and monitoring/A‑B tooling are not yet implemented.

**Practical selection summary (short):**

- The system first narrows candidates using explainable technical + sentiment features.
- It computes an intraday probability `p` and normalizes the legacy ensemble score `s`.
- It blends them by `alpha` and applies a safety threshold to avoid low-confidence automated trades.
- Top-ranked candidates are shown in the UI with probability drivers; the same combined score is used when placing auto-orders or validating manual orders (unless forced).

**Files / Endpoints to inspect**

- Server logic and models: [server.js](server.js)
- Premarket UI & injection: [public/premarket.js](public/premarket.js)
- Home UI updates and picks: [public/app.js](public/app.js)
- Snapshot persistence script: [scripts/fetch_yahoo.js](scripts/fetch_yahoo.js)
- Persisted snapshots folder: [data/](data/)

**Todos — Next improvements**

- **Persist trained weights:** Save/load trained intraday and ensemble models to `models/` and load at startup (low effort, high impact).
- **Calibration pipeline:** Produce reliability diagrams, implement logistic/isotonic recalibration on `p`, and write a `calibrateModel()` utility.
- **Walk-forward tuning:** Run systematic alpha + threshold grid search with the saved `data/` snapshots and choose operating point that optimizes Brier score and realized PnL.
- **Stacked meta-model:** Train a small meta-learner on `[p, s, other signals]` to improve combined ranking and reduce ad-hoc blending.
- **Expand features & labels:** Add first-hour move, opening-gap features, order‑flow / options signals, and richer labeling (multi-threshold labels, realized return targets).
- **Model registry & versioning:** Add `models/` with metadata (trainedAt, dataset, metrics, weights) and an API to roll forward / rollback models.
- **Monitoring & alerting:** Add endpoints to stream prediction vs outcome metrics (Brier, calibration drift, realized PnL) and surface alerts when model performance degrades.
- **A/B testing & canary:** Add runtime switches and traffic splits to compare legacy scoring vs learned models on a small subset of auto-orders.
- **UI controls for runtime tuning:** Expose `alpha` and `minCombinedThreshold` in the admin UI so operators can adjust safely without redeploy.
- **Scheduled snapshot capture:** Add a cron/endpoint to periodically save snapshots to `data/` for continuous training and richer backtests.
- **Offline training harness:** Provide CLI scripts to build labeled examples from `data/`, run `trainIntradayModel(...)`, evaluate `evaluateWalkForward(...)`, and persist chosen weights.

If you want, I can implement the highest-impact item next — I recommend starting with "Persist trained weights" and then running a walk-forward calibration sweep using the `data/` snapshots. Which should I do first?
