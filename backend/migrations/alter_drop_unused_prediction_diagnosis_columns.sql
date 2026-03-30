-- Use only if you already ran the older `add_predictions_diagnoses_sync_log.sql`
-- that included model_version, corrected_by_user, verified_at.

ALTER TABLE predictions DROP COLUMN IF EXISTS model_version;

ALTER TABLE diagnoses DROP COLUMN IF EXISTS corrected_by_user;
ALTER TABLE diagnoses DROP COLUMN IF EXISTS verified_at;
