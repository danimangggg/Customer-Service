-- Migration: Add vehicle, driver, and deliverer columns to processes table
-- This is required for TM Manager Phase 1 (vehicle assignment) and Phase 2 (driver/deliverer assignment)

USE `customer-service`;

-- Add vehicle assignment columns (TM Manager Phase 1)
ALTER TABLE `processes` 
ADD COLUMN IF NOT EXISTS `vehicle_id` INT NULL AFTER `biller_status`,
ADD COLUMN IF NOT EXISTS `vehicle_name` VARCHAR(255) NULL AFTER `vehicle_id`;

-- Add driver and deliverer assignment columns (Route Management Phase 2)
ALTER TABLE `processes` 
ADD COLUMN IF NOT EXISTS `driver_id` INT NULL AFTER `vehicle_name`,
ADD COLUMN IF NOT EXISTS `driver_name` VARCHAR(255) NULL AFTER `driver_id`,
ADD COLUMN IF NOT EXISTS `deliverer_id` INT NULL AFTER `driver_name`,
ADD COLUMN IF NOT EXISTS `deliverer_name` VARCHAR(255) NULL AFTER `deliverer_id`;

-- Add timestamp columns
ALTER TABLE `processes` 
ADD COLUMN IF NOT EXISTS `driver_assigned_at` DATETIME NULL AFTER `deliverer_name`,
ADD COLUMN IF NOT EXISTS `tm_confirmed_at` DATETIME NULL AFTER `driver_assigned_at`;

-- Verify the columns were added
DESCRIBE `processes`;
