-- BASELINE MIGRATION
-- This represents all schema changes that were applied manually before
-- migration tracking was introduced. Running this on a fresh DB will
-- recreate the same structure. On the existing production DB, this
-- migration will be marked as already run (see README in migrations/).

-- ---------------------------------------------------------------
-- From: add_cancellation_reason_to_customer_queue.sql
-- ---------------------------------------------------------------
ALTER TABLE customer_queue
  ADD COLUMN IF NOT EXISTS cancellation_reason TEXT NULL;

ALTER TABLE customer_queue
  ADD COLUMN IF NOT EXISTS cancelled_by_id INT NULL;

ALTER TABLE customer_queue
  ADD COLUMN IF NOT EXISTS cancelled_by_name VARCHAR(255) NULL;

ALTER TABLE customer_queue
  ADD COLUMN IF NOT EXISTS cancelled_at DATETIME NULL;

-- ---------------------------------------------------------------
-- From: add_departure_kilometer_to_processes.sql
-- ---------------------------------------------------------------
ALTER TABLE processes
  ADD COLUMN IF NOT EXISTS departure_kilometer DECIMAL(10,2) NULL;

-- ---------------------------------------------------------------
-- From: add_process_id_to_pi_vehicle_requests.sql
-- ---------------------------------------------------------------
ALTER TABLE pi_vehicle_requests
  ADD COLUMN IF NOT EXISTS process_id INT NULL;

-- ---------------------------------------------------------------
-- From: add_process_type_to_processes.sql
-- ---------------------------------------------------------------
ALTER TABLE processes
  ADD COLUMN IF NOT EXISTS process_type VARCHAR(50) NULL DEFAULT 'regular';

-- ---------------------------------------------------------------
-- From: add_status_to_pi_vehicle_requests.sql
-- ---------------------------------------------------------------
ALTER TABLE pi_vehicle_requests
  ADD COLUMN IF NOT EXISTS status VARCHAR(50) NULL DEFAULT 'pending';

-- ---------------------------------------------------------------
-- From: add_vehicle_driver_columns_to_processes.sql
-- ---------------------------------------------------------------
ALTER TABLE processes
  ADD COLUMN IF NOT EXISTS vehicle_id INT NULL,
  ADD COLUMN IF NOT EXISTS driver_id INT NULL,
  ADD COLUMN IF NOT EXISTS driver_name VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS vehicle_plate VARCHAR(100) NULL;

-- ---------------------------------------------------------------
-- From: gate_keeper_sessions.sql
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS gate_keeper_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  process_id INT NOT NULL,
  session_token VARCHAR(255) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------
-- From: update_route_assignment_decimal_columns.sql
-- ---------------------------------------------------------------
ALTER TABLE route_assignments
  MODIFY COLUMN IF EXISTS arrival_kilometer DECIMAL(10,2) NULL;
