-- Add status column to odns table
ALTER TABLE odns 
ADD COLUMN status VARCHAR(50) NOT NULL DEFAULT 'pending';

-- Verify the column was added
DESCRIBE odns;