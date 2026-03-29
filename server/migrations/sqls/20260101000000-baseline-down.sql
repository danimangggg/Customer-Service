-- Rollback baseline — only use on a fresh/test DB, never on production
ALTER TABLE customer_queue
  DROP COLUMN IF EXISTS cancellation_reason,
  DROP COLUMN IF EXISTS cancelled_by_id,
  DROP COLUMN IF EXISTS cancelled_by_name,
  DROP COLUMN IF EXISTS cancelled_at;

ALTER TABLE processes
  DROP COLUMN IF EXISTS departure_kilometer,
  DROP COLUMN IF EXISTS process_type,
  DROP COLUMN IF EXISTS vehicle_id,
  DROP COLUMN IF EXISTS driver_id,
  DROP COLUMN IF EXISTS driver_name,
  DROP COLUMN IF EXISTS vehicle_plate;

ALTER TABLE pi_vehicle_requests
  DROP COLUMN IF EXISTS process_id,
  DROP COLUMN IF EXISTS status;

DROP TABLE IF EXISTS gate_keeper_sessions;
