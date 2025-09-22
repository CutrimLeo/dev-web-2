-- Migration: Add attachments table for multiple images per post
-- Date: 2024-12-19

USE `blogweb`;

-- Create attachments table for multiple images per post
CREATE TABLE `blogweb`.`attachments` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `post_id` INT NOT NULL,
    `filename` VARCHAR(255) NOT NULL,
    `original_name` VARCHAR(255) NOT NULL,
    `file_path` VARCHAR(500) NOT NULL,
    `thumb_path` VARCHAR(500) NULL,
    `file_size` INT NOT NULL,
    `mime_type` VARCHAR(100) NOT NULL,
    `ordem` TINYINT DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_post_attachments` (`post_id`),
    INDEX `idx_attachment_order` (`post_id`, `ordem`),
    CONSTRAINT `FK_ATTACHMENT_POST` 
        FOREIGN KEY (`post_id`) 
        REFERENCES `post`(`id`) 
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- Add indexes for better performance
ALTER TABLE `post` ADD INDEX `idx_user_posts` (`user_id`, `data_criacao` DESC);
ALTER TABLE `post` ADD INDEX `idx_post_date` (`data_criacao` DESC);
ALTER TABLE `likes` ADD INDEX `idx_post_likes` (`id_post`);
ALTER TABLE `comments` ADD INDEX `idx_post_comments` (`post_id`, `data_criacao` DESC);

-- Modify post table to allow posts without text content (image-only posts)
ALTER TABLE `post` MODIFY `corpo` TEXT NULL;
ALTER TABLE `post` MODIFY `titulo` VARCHAR(255) NULL;

-- Add a constraint to ensure either title/body or attachments exist
-- This will be enforced at application level since MySQL doesn't support this easily
