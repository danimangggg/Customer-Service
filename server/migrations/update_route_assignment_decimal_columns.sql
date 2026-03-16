-- Update departure_kilometer and arrival_kilometer columns to support larger values
ALTER TABLE `route_assignments` 
MODIFY COLUMN `departure_kilometer` DECIMAL(15, 2) NULL COMMENT 'Departure kilometer reading for the route',
MODIFY COLUMN `arrival_kilometer` DECIMAL(15, 2) NULL COMMENT 'Arrival kilometer reading for the route';
