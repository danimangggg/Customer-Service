-- Add process_id column to pi_vehicle_requests for emergency/breakdown support
-- Emergency and Breakdown processes are not route-based, so they link directly to a process
-- Also makes route_id, month, year nullable since emergency/breakdown rows won't have them

ALTER TABLE pi_vehicle_requests
  DROP FOREIGN KEY pi_vehicle_requests_ibfk_1,
  DROP INDEX unique_route_period,
  MODIFY COLUMN route_id INT NULL,
  MODIFY COLUMN month VARCHAR(20) NULL,
  MODIFY COLUMN year INT NULL,
  ADD COLUMN process_id INT NULL AFTER route_id,
  ADD CONSTRAINT fk_pvr_route FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE;
