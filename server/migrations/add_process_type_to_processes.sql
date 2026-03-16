-- Add process_type column to processes table
-- Values: 'regular', 'emergency', 'breakdown'
ALTER TABLE processes ADD COLUMN process_type VARCHAR(20) NOT NULL DEFAULT 'regular';
