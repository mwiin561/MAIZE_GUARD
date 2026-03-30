-- Run in Neon after `users` and `scans` exist.
-- Only columns that map to data the app/backend already produce without new user-input UI:
--   predictions: model outputs + optional pipeline source + logits/scores (offline/ONNX path).
--   diagnoses: same labels as `scans` (final_diagnosis, user_verified) — mirrors API payload.
--   sync_log: server-side sync outcomes (no extra app prompts).

-- ---------------------------------------------------------------------------
-- predictions: one row per scan once wired (model_prediction, confidence, severity,
--             source, logits, scores — all derivable from inference + request path)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS predictions (
    id SERIAL PRIMARY KEY,
    scan_id INTEGER NOT NULL REFERENCES scans(id) ON DELETE CASCADE,
    model_prediction VARCHAR(255),
    confidence DECIMAL(5, 4),
    severity VARCHAR(100),
    -- e.g. 'offline' | 'flask-backend' from ModelService / backend route (no user prompt)
    source VARCHAR(50),
    logits JSONB,
    scores JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_predictions_scan_id ON predictions(scan_id);
CREATE INDEX IF NOT EXISTS idx_predictions_created_at ON predictions(created_at DESC);

-- ---------------------------------------------------------------------------
-- diagnoses: final label row linked to scan (matches scans.final_diagnosis / user_verified
--             when you mirror inserts — no correction UI or separate verify timestamp)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS diagnoses (
    id SERIAL PRIMARY KEY,
    scan_id INTEGER NOT NULL REFERENCES scans(id) ON DELETE CASCADE,
    prediction_id INTEGER REFERENCES predictions(id) ON DELETE SET NULL,
    final_diagnosis VARCHAR(255),
    user_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_diagnoses_scan_id ON diagnoses(scan_id);
CREATE INDEX IF NOT EXISTS idx_diagnoses_prediction_id ON diagnoses(prediction_id);

-- ---------------------------------------------------------------------------
-- sync_log: background sync attempts (populate from API when a batch sync runs)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sync_log (
    id SERIAL PRIMARY KEY,
    scan_id INTEGER REFERENCES scans(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    sync_status VARCHAR(50) NOT NULL,
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_sync_log_scan_id ON sync_log(scan_id);
CREATE INDEX IF NOT EXISTS idx_sync_log_user_id ON sync_log(user_id);
CREATE INDEX IF NOT EXISTS idx_sync_log_synced_at ON sync_log(synced_at DESC);
