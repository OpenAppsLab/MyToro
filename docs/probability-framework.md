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
- Exposed `/api/intraday-picks`, `/api/backtest-intraday`, `/api/calibrate-intraday`, `/api/optimize-alpha`, and `/api/train-meta-model` endpoints.
- Added training helpers in `server.js` for `calibrateModel()`, `optimizeAlphaThreshold()`, `trainMetaModel()`, and `predictMetaProbability()`.
- Added scripts to persist market snapshots for offline backtests: see [scripts/fetch_yahoo.js](scripts/fetch_yahoo.js) which writes snapshots to the `data/` folder.

**Current limitations**

- Production monitoring, model drift detection, and reliability dashboarding are not yet implemented.
- A versioned model registry and scheduled retraining pipeline are still future work.
- UI controls for runtime alpha/threshold tuning and calibration review are not yet available.

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

> **Daily training/persistence commands**
>
> - `npm run refresh:snapshots` — fetches and saves the latest Yahoo intraday and daily snapshots into `data/`
> - `npm run refresh:models` — trains the intraday logistic model from snapshots and saves weights to `models/intraday_model.json`
> - `npm run refresh:daily` — runs both snapshot refresh and model persistence in sequence
> - `npm run refresh:walkforward` — runs walk-forward calibration tuning using saved `data/` snapshots and writes the tuning report to `models/walk_forward_tuning.json`
>
> The server already loads the persisted intraday model at startup via `loadPersistedIntradayModel()` in `server.js`.

**Todos — Next improvements**

- **Persist trained weights:** Add model persistence for intraday and meta-model weights in `models/`, including saved metadata and automatic loading at startup.
- **Production calibration UI:** Build reliability diagrams and expose calibration curves in dashboards or admin tooling.
- **Scheduled retraining pipeline:** Make `refresh:daily` the standard daily workflow, with a scheduled task to persist snapshots, retrain models, and rerun walk-forward tuning.
- **Model registry/versioning:** Record model metadata in `models/` with `trainedAt`, data source, metrics, and versioned weights for rollback.
- **Monitoring and alerting:** Add drift, calibration, and realized-PnL monitoring with alerts for degraded model performance.
- **Runtime tuning controls:** Add safe admin controls for `alpha` and `minCombinedThreshold` with staging/preview support.
- **Offline training harness:** Extend CLI scripts to build, evaluate, calibrate, and persist deployable model artifacts from `data/` snapshots.

If you want, I can implement the highest-impact item next — I recommend starting with "Persist trained weights" and then running a walk-forward calibration sweep using the `data/` snapshots. Which should I do first?
