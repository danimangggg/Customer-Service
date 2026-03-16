-- Add status and notes columns to pi_vehicle_requests table
-- This allows tracking request status (pending, approved, rejected, cancelled)
-- instead of preventing duplicate requests

ALTER TABLE pi_vehicle_requests 
ADD COLUMN status VARCHAR(20) DEFAULT 'pending' AFTER requested_at,
ADD COLUMN notes TEXT AFTER status;

-- Update existing records to 'approved' status (they were previously approved)
UPDATE pi_vehicle_requests SET status = 'approved' WHERE status = 'pending';

-- Create index for faster queries by status
CREATE INDEX idx_pi_requests_status ON pi_vehicle_requests(status, month, year);

-- Create index for finding active requests
CREATE INDEX idx_pi_requests_active ON pi_vehicle_requests(route_id, month, year, status);
