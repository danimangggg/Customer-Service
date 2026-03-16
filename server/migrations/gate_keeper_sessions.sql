-- Create gate_keeper_sessions table
CREATE TABLE IF NOT EXISTS `gate_keeper_sessions` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `store` VARCHAR(50) NOT NULL COMMENT 'Store gate assigned to this Gate Keeper session',
  `logged_in_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Whether this session is currently active',
  `logged_out_at` DATETIME NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_user_active` (`user_id`, `is_active`),
  INDEX `idx_store_active` (`store`, `is_active`),
  CONSTRAINT `fk_gate_keeper_sessions_user`
    FOREIGN KEY (`user_id`)
    REFERENCES `Users` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
