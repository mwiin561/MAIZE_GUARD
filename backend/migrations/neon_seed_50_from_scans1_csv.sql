-- Seed ~50 existing scans into normalized tables (predictions, diagnoses, sync_log)
-- Source: Desktop `scans (1).csv` rows 1..50 (excluding header), matched by local_id.
-- Does NOT insert into `scans`.
-- Safe to re-run: skips scans that already have prediction/diagnosis/log rows.

BEGIN;

WITH csv_seed (local_id, user_id, model_prediction, confidence, severity, user_verified, final_diagnosis, synced_at) AS (
  VALUES
    ('1773494089647', 2, 'Healthy', 0.9200, NULL, TRUE, 'Healthy', '2026-03-14 13:24:53.818232+00'::timestamptz),
    ('1773494070862', 2, 'Healthy', 0.9200, NULL, TRUE, 'Healthy', '2026-03-14 13:24:53.88714+00'::timestamptz),
    ('1773492969279', 2, 'Maize Streak Virus', 0.9100, NULL, TRUE, 'Maize Streak Virus', '2026-03-14 13:24:53.94768+00'::timestamptz),
    ('1773492292483', 2, 'Healthy', 0.9000, NULL, TRUE, 'Healthy', '2026-03-14 13:24:54.008923+00'::timestamptz),
    ('1773326950937', 2, 'Healthy', 0.8800, NULL, TRUE, 'Healthy', '2026-03-14 13:24:54.069266+00'::timestamptz),
    ('1773326927536', 2, 'Healthy', 0.9100, NULL, TRUE, 'Healthy', '2026-03-14 13:24:54.129541+00'::timestamptz),
    ('1773326901797', 2, 'Healthy', 0.9000, NULL, TRUE, 'Healthy', '2026-03-14 13:24:54.189579+00'::timestamptz),
    ('1773326884063', 2, 'Healthy', 0.9200, NULL, TRUE, 'Healthy', '2026-03-14 13:24:54.24984+00'::timestamptz),
    ('1773317787368', 2, 'Maize Streak Virus', 0.9300, NULL, TRUE, 'Maize Streak Virus', '2026-03-14 13:24:54.310192+00'::timestamptz),
    ('1773059294057', 2, 'Healthy', 1.0000, NULL, TRUE, 'Healthy', '2026-03-14 13:24:54.37045+00'::timestamptz),
    ('1773059246818', 2, 'Maize Streak Virus', 0.9999, NULL, TRUE, 'Maize Streak Virus', '2026-03-14 13:24:54.430221+00'::timestamptz),
    ('1773057810157', 2, 'Maize Streak Virus', 1.0000, NULL, TRUE, 'Maize Streak Virus', '2026-03-14 13:24:54.490155+00'::timestamptz),
    ('1773057744758', 2, 'Healthy', 0.9998, NULL, TRUE, 'Healthy', '2026-03-14 13:24:54.55019+00'::timestamptz),
    ('1773057273617', 2, 'Healthy', 0.9740, NULL, TRUE, 'Healthy', '2026-03-14 13:24:54.610128+00'::timestamptz),
    ('1773057252429', 2, 'Healthy', 1.0000, NULL, TRUE, 'Healthy', '2026-03-14 13:24:54.670008+00'::timestamptz),
    ('1773057078778', 2, 'Healthy', 0.9936, NULL, TRUE, 'Healthy', '2026-03-14 13:24:54.730015+00'::timestamptz),
    ('1773052353033', 2, 'Healthy', 0.9400, NULL, TRUE, 'Healthy', '2026-03-14 13:24:54.789814+00'::timestamptz),
    ('1772001102483', 2, 'Healthy', 0.9500, NULL, TRUE, 'Healthy', '2026-03-14 13:24:54.849532+00'::timestamptz),
    ('1771856827662', 2, 'Healthy', 0.8600, NULL, TRUE, 'Healthy', '2026-03-14 13:24:54.909452+00'::timestamptz),
    ('1771855938156', 2, 'Healthy', 0.8800, NULL, TRUE, 'Healthy', '2026-03-14 13:24:54.969233+00'::timestamptz),
    ('1771855922076', 2, 'Maize Streak Virus', 0.9800, NULL, TRUE, 'Maize Streak Virus', '2026-03-14 13:24:55.029287+00'::timestamptz),
    ('1771855910830', 2, 'Healthy', 0.8700, NULL, TRUE, 'Healthy', '2026-03-14 13:24:55.089379+00'::timestamptz),
    ('1771854110876', 2, 'Maize Streak Virus', 0.9800, NULL, TRUE, 'Maize Streak Virus', '2026-03-14 13:24:55.149482+00'::timestamptz),
    ('1771678810989', 2, 'Maize Streak Virus', 0.9500, NULL, TRUE, 'Maize Streak Virus', '2026-03-14 13:24:55.209649+00'::timestamptz),
    ('1771364069355', 2, 'Maize Streak Virus', 0.9500, NULL, TRUE, 'Maize Streak Virus', '2026-03-14 13:24:55.269729+00'::timestamptz),
    ('1771245021825', 2, 'Maize Streak Virus', 0.9600, NULL, TRUE, 'Maize Streak Virus', '2026-03-14 13:24:55.330022+00'::timestamptz),
    ('1771245009670', 2, 'Healthy', 0.8500, NULL, TRUE, 'Healthy', '2026-03-14 13:24:55.389769+00'::timestamptz),
    ('1771244979821', 2, 'Maize Streak Virus', 0.8700, NULL, TRUE, 'Maize Streak Virus', '2026-03-14 13:24:55.450093+00'::timestamptz),
    ('1771241678413', 2, 'Maize Streak Virus', 0.9800, NULL, TRUE, 'Maize Streak Virus', '2026-03-14 13:24:55.510196+00'::timestamptz),
    ('1771241148826', 2, 'Healthy', 0.9200, NULL, TRUE, 'Healthy', '2026-03-14 13:24:55.570015+00'::timestamptz),
    ('1771240650849', 2, 'Healthy', 0.9700, NULL, TRUE, 'Healthy', '2026-03-14 13:24:55.62989+00'::timestamptz),
    ('1771240632629', 2, 'Healthy', 0.8700, NULL, TRUE, 'Healthy', '2026-03-14 13:24:55.689714+00'::timestamptz),
    ('1771107137961', 2, 'Maize Streak Virus', 0.8600, NULL, TRUE, 'Maize Streak Virus', '2026-03-14 13:24:55.749577+00'::timestamptz),
    ('1771107116809', 2, 'Maize Streak Virus', 0.8900, NULL, TRUE, 'Maize Streak Virus', '2026-03-14 13:24:55.809687+00'::timestamptz),
    ('1771107100007', 2, 'Healthy', 0.9700, NULL, TRUE, 'Healthy', '2026-03-14 13:24:55.872436+00'::timestamptz),
    ('1771106514456', 2, 'Healthy', 0.8900, NULL, TRUE, 'Healthy', '2026-03-14 13:24:55.932266+00'::timestamptz),
    ('1773495056627', 2, 'Healthy', 0.9200, NULL, TRUE, 'Healthy', '2026-03-14 13:30:58.83207+00'::timestamptz),
    ('1773497244673', 2, 'Healthy', 0.9200, NULL, TRUE, 'Healthy', '2026-03-14 14:07:26.427639+00'::timestamptz),
    ('1773497266198', 2, 'Healthy', 0.9200, NULL, TRUE, 'Healthy', '2026-03-14 14:07:48.345158+00'::timestamptz),
    ('1773497286722', 2, 'Healthy', 0.9200, NULL, TRUE, 'Healthy', '2026-03-14 14:08:08.905036+00'::timestamptz),
    ('1773497443773', 2, 'Healthy', 0.9200, NULL, TRUE, 'Healthy', '2026-03-14 14:10:45.871161+00'::timestamptz),
    ('1773497468333', 2, 'Healthy', 0.9200, NULL, TRUE, 'Healthy', '2026-03-14 14:11:10.46413+00'::timestamptz),
    ('1773497717598', 2, 'Healthy', 0.9200, NULL, TRUE, 'Healthy', '2026-03-14 14:15:20.392541+00'::timestamptz),
    ('1773497727773', 2, 'Healthy', 0.9200, NULL, TRUE, 'Healthy', '2026-03-14 14:15:29.647858+00'::timestamptz),
    ('1773497736926', 2, 'Healthy', 0.9200, NULL, TRUE, 'Healthy', '2026-03-14 14:15:38.665052+00'::timestamptz),
    ('1773497754037', 2, 'Healthy', 0.9200, NULL, TRUE, 'Healthy', '2026-03-14 14:15:56.249565+00'::timestamptz),
    ('1773497831835', 2, 'Healthy', 0.9200, NULL, TRUE, 'Healthy', '2026-03-14 14:17:14.011687+00'::timestamptz),
    ('1773497890306', 2, 'Healthy', 0.8900, NULL, TRUE, 'Healthy', '2026-03-14 14:18:38.434451+00'::timestamptz),
    ('1773498002413', 2, 'Healthy', 0.9200, NULL, TRUE, 'Healthy', '2026-03-14 14:20:04.542955+00'::timestamptz),
    ('1773498019781', 2, 'Healthy', 0.9200, NULL, TRUE, 'Healthy', '2026-03-14 14:20:21.89099+00'::timestamptz)
),
matched_scans AS (
  SELECT
    s.id AS scan_id,
    s.user_id AS scan_user_id,
    c.local_id,
    c.model_prediction,
    c.confidence,
    COALESCE(NULLIF(c.severity, ''), c.final_diagnosis, c.model_prediction, 'Unknown') AS severity,
    c.user_verified,
    COALESCE(c.final_diagnosis, c.model_prediction, 'Unknown') AS final_diagnosis,
    c.synced_at
  FROM csv_seed c
  JOIN scans s ON s.local_id = c.local_id
),
ins_predictions AS (
  INSERT INTO predictions (
    scan_id, model_prediction, confidence, severity, source, logits, scores, created_at
  )
  SELECT
    m.scan_id, m.model_prediction, m.confidence, m.severity, 'csv-seed', NULL, NULL, m.synced_at
  FROM matched_scans m
  WHERE NOT EXISTS (
    SELECT 1 FROM predictions p WHERE p.scan_id = m.scan_id
  )
  RETURNING id, scan_id
),
chosen_prediction AS (
  SELECT
    m.scan_id,
    COALESCE(
      ip.id,
      (
        SELECT p2.id
        FROM predictions p2
        WHERE p2.scan_id = m.scan_id
        ORDER BY p2.created_at DESC, p2.id DESC
        LIMIT 1
      )
    ) AS prediction_id,
    m.final_diagnosis,
    m.user_verified,
    m.synced_at,
    m.scan_user_id
  FROM matched_scans m
  LEFT JOIN ins_predictions ip ON ip.scan_id = m.scan_id
),
ins_diagnoses AS (
  INSERT INTO diagnoses (scan_id, prediction_id, final_diagnosis, user_verified, created_at)
  SELECT
    c.scan_id, c.prediction_id, c.final_diagnosis, c.user_verified, c.synced_at
  FROM chosen_prediction c
  WHERE c.prediction_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM diagnoses d WHERE d.scan_id = c.scan_id
    )
  RETURNING scan_id
)
INSERT INTO sync_log (scan_id, user_id, sync_status, synced_at, error_message)
SELECT
  c.scan_id, c.scan_user_id, 'csv_seeded', c.synced_at, NULL
FROM chosen_prediction c
WHERE NOT EXISTS (
  SELECT 1
  FROM sync_log sl
  WHERE sl.scan_id = c.scan_id
    AND sl.sync_status = 'csv_seeded'
);

COMMIT;

-- Optional verification after running:
-- SELECT COUNT(*) FROM predictions WHERE source = 'csv-seed';
-- SELECT COUNT(*) FROM diagnoses d JOIN predictions p ON p.id = d.prediction_id WHERE p.source = 'csv-seed';
-- SELECT COUNT(*) FROM sync_log WHERE sync_status = 'csv_seeded';
