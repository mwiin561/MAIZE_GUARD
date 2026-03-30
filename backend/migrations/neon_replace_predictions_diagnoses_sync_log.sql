-- =============================================================================
-- Neon: DROP then CREATE predictions, diagnoses, sync_log (modified definitions).
-- Does NOT touch users, scans, or devices.
--
-- WARNING: This deletes all data in predictions, diagnoses, and sync_log.
-- =============================================================================

DROP TABLE IF EXISTS sync_log CASCADE;
DROP TABLE IF EXISTS diagnoses CASCADE;
DROP TABLE IF EXISTS predictions CASCADE;

CREATE TABLE predictions (
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

CREATE INDEX idx_predictions_scan_id ON predictions(scan_id);
CREATE INDEX idx_predictions_created_at ON predictions(created_at DESC);

CREATE TABLE diagnoses (
    id SERIAL PRIMARY KEY,
    scan_id INTEGER NOT NULL REFERENCES scans(id) ON DELETE CASCADE,
    prediction_id INTEGER REFERENCES predictions(id) ON DELETE SET NULL,
    final_diagnosis VARCHAR(255),
    user_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_diagnoses_scan_id ON diagnoses(scan_id);
CREATE INDEX idx_diagnoses_prediction_id ON diagnoses(prediction_id);

CREATE TABLE sync_log (
    id SERIAL PRIMARY KEY,
    scan_id INTEGER REFERENCES scans(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    sync_status VARCHAR(50) NOT NULL,
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    error_message TEXT
);

CREATE INDEX idx_sync_log_scan_id ON sync_log(scan_id);
CREATE INDEX idx_sync_log_user_id ON sync_log(user_id);
CREATE INDEX idx_sync_log_synced_at ON sync_log(synced_at DESC);
