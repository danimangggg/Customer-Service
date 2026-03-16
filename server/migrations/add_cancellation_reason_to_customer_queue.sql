-- Add cancellation tracking columns to customer_queue table
-- These columns store information about who cancelled the process and when

ALTER TABLE customer_queue 
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT NULL 
COMMENT 'Reason provided when cancelling a customer process';

ALTER TABLE customer_queue 
ADD COLUMN IF NOT EXISTS cancelled_by_id INT NULL 
COMMENT 'ID of the officer who cancelled the process';

ALTER TABLE customer_queue 
ADD COLUMN IF NOT EXISTS cancelled_by_name VARCHAR(255) NULL 
COMMENT 'Name of the officer who cancelled the process';

ALTER TABLE customer_queue 
ADD COLUMN IF NOT EXISTS cancelled_at DATETIME NULL 
COMMENT 'Timestamp when the process was cancelled';
