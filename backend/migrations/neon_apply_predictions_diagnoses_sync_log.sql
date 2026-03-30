-- =============================================================================
-- Neon: paste this entire file into SQL Editor and run once.
-- Requires existing tables: public.users, public.scans
--
-- What it does:
--   1) Creates predictions, diagnoses, sync_log (if missing), with current columns.
--   2) Removes legacy columns if you ran an older version of this migration.
-- Safe to re-run: CREATE/INDEX use IF NOT EXISTS; DROP COLUMN uses IF EXISTS.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1) predictions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS predictions (
    id SERIAL PRIMARY KEY,
    scan_id INTEGER NOT NULL REFERENCES scans(id) ON DELETE CASCADE,
    model_prediction VARCHAR(255),
    confidence DECIMAL(5, 4),
    severity VARCHAR(100),
    source VARCHAR(50),
    logits JSONB,
    scores JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_predictions_scan_id ON predictions(scan_id);
CREATE INDEX IF NOT EXISTS idx_predictions_created_at ON predictions(created_at DESC);

-- Legacy cleanup (older script had model_version)
ALTER TABLE predictions DROP COLUMN IF EXISTS model_version;

-- ---------------------------------------------------------------------------
-- 2) diagnoses
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

-- Legacy cleanup (older script had corrected_by_user, verified_at)
ALTER TABLE diagnoses DROP COLUMN IF EXISTS corrected_by_user;
ALTER TABLE diagnoses DROP COLUMN IF EXISTS verified_at;

-- ---------------------------------------------------------------------------
-- 3) sync_log
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
