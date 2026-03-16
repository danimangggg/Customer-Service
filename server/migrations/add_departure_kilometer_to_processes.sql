-- Add departure_kilometer column to processes table
ALTER TABLE `processes` 
ADD COLUMN `departure_kilometer` DECIMAL(15, 2) NULL COMMENT 'Departure kilometer reading when driver/deliverer assigned' AFTER `driver_assigned_at`;
