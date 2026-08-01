**Probability Framework — Current (Latest)**

This document describes the current probability framework used to generate intraday picks, how the system selects symbols, and the active upgrade path for model and data pipelines.

**High-Level Flow**

```mermaid
flowchart TD
    A[Snapshot refresh + news refresh] --> B[Advanced signal builder]
    B --> C[Feature vectors]
    C --> D[Intraday logistic model]
    C --> E[Ensemble score normalization]
    D --> F[Intraday probability `p`]
    E --> F2[Normalized ensemble score `s`]
    F & F2 --> G[Combined score: alpha*p + (1-alpha)*s]
    G --> H[Threshold gating + ranking]
    H --> I[Live picks / Auto orders / Manual orders]
    I --> J[Order record + stop-loss setup]
    J --> K[Trailing stop evaluation + settlement]
```

**How the framework picks the right stocks**

- **Feature construction:** The app builds a rich feature set per symbol, including price history, ATR/volatility, volume Z, moving-average distance, momentum, sentiment, sector strength, pattern scores, regime signal, and cross-sectional percentiles. Those implementations are centralized in `buildIntradayFeatureVector(...)` and `buildAdvancedSignals(...)` inside [server.js](server.js).
- **Intraday probability model:** A compact logistic model converts intraday features into a probability `p` that the symbol will clear a target intraday move. The trained model is persisted in `models/intraday_model.json` and loaded at startup with `loadPersistedIntradayModel()`.
- **Legacy ensemble normalization:** The system retains a legacy ensemble score that is normalized to `[0, 1]` as `s = score / 100`. This normalized score is blended with the model probability instead of replacing the legacy signal entirely.
- **Combined ranking and gating:** The combined score is computed as `combined = alpha * p + (1-alpha) * s`, where `alpha` is configured by `AUTO_ORDER_SETTINGS.intradayAlpha`. Candidates only qualify for auto-order consideration when `combined >= AUTO_ORDER_SETTINGS.minCombinedThreshold`.
- **Runtime calibration:** Walk-forward calibration evaluates candidate alpha/threshold pairs and writes runtime tuning metadata into a persisted report. The server now exposes admin metrics that combine model metadata, calibration health, and tuning recommendations.
- **Safety & order rules:** The system enforces business rules via `canPlaceAutoOrder()` and `shouldPlaceAutoOrder()` and applies stop-loss defaults, ballpark sizing, and leverage limits. Manual orders remain supported via forced overrides.
- **Explainability and validation:** The UI surfaces probability, combined score, and feature contribution context in `public/app.js`. Backend endpoints provide calibration, backtest, and meta-model training operations.

**What changed in this update**

- Added snapshot persistence with `scripts/refresh_snapshots.js` and expanded the symbol list in `scripts/symbol_watchlist.js`.
- Added intraday model training and persistence in `scripts/train_and_persist_intraday.js`, preserving weights in `models/intraday_model.json`.
- Added walk-forward calibration and runtime tuning through `scripts/walk_forward_calibration.js`, which persists `models/walk_forward_tuning.json` and meta-model metadata.
- Added meta-model persistence helpers in `server.js`, including `saveMetaModel()` and persisted calibration metadata loading.
- Extended admin metrics to expose model metadata, meta-model metadata, and calibration snapshot counts in `GET /api/admin/metrics`.
- Confirmed that `npm run refresh:models` trains the model, and `npm run refresh:walkforward` evaluates calibration health and chooses runtime alpha/threshold settings.

**Current limitations**

- Production monitoring, drift alerts, and dashboarding remain work in progress.
- Full artifact versioning, rollback, and deploy history are not yet implemented.
- Admin runtime tuning UX is still being refined.
- Snapshot persistence is local only and not backed by remote artifact storage.

**Practical selection summary**

- The app builds explainable signals for each symbol.
- It computes an intraday probability `p` from a persisted logistic model.
- It normalizes legacy ensemble scores to `s` and blends them with `alpha`.
- It gates candidates on a minimum combined threshold before order consideration.
- It persists trained models and tuning reports so restarts reuse calibrated weights.

**Files / Endpoints to inspect**

- `server.js` — core logic, model helpers, and endpoints.
- `public/premarket.js` — premarket live pick UI flow.
- `public/app.js` — admin and pick display logic.
- `scripts/symbol_watchlist.js` — curated symbols for snapshot refresh.
- `scripts/refresh_snapshots.js` — market snapshot refresh.
- `scripts/train_and_persist_intraday.js` — intraday model training.
- `scripts/walk_forward_calibration.js` — calibration and tuning harness.
- `models/` — persisted intraday model, tuning report, and meta-model artifacts.
- `data/` — persisted market snapshots.

> **Daily training/persistence commands**
>
> - `npm run refresh:snapshots` — fetches latest Yahoo intraday and daily snapshots into `data/`
> - `npm run refresh:models` — trains and persists the intraday logistic model to `models/intraday_model.json`
> - `npm run refresh:walkforward` — runs calibration and writes `models/walk_forward_tuning.json`
> - `npm run refresh:daily` — runs snapshot refresh, model training, and walk-forward tuning end to end
>
> The server loads persisted model weights and runtime settings at startup.

**Todos — Next improvements**

- **Complete meta-model metadata persistence:** Store meta-model weights and calibration metadata with timestamps, source snapshot references, and training parameters.
- **Ship a production calibration dashboard:** Surface reliability diagrams, calibration curves, health status, and drift metrics in admin pages.
- **Add safe runtime controls:** Allow admins to preview and stage `alpha`, `minCombinedThreshold`, `ballparkAmount`, and leverage changes before applying.
- **Automate daily refresh:** Schedule `npm run refresh:daily` and archive artifacts to reduce manual intervention.
- **Build model registry/versioning:** Track model artifacts, rollback capability, and experiment history for each calibration run.
- **Extend drift detection:** Add continuous drift scoring and alerting around probability calibration and candidate stability.
- **Improve snapshot reliability:** Add batching, retry/resume, and repair for incomplete or failed Yahoo snapshot fetches.
- **Add offline training validation:** Build a CLI workflow that trains, evaluates, and persists model artifacts from files without interactive dependency.
