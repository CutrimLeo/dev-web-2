-- Migration: Add followers system (optional feature)
-- Date: 2024-12-19

USE `blogweb`;

-- Create followers table for social features
CREATE TABLE `blogweb`.`followers` (
    `follower_id` INT NOT NULL,
    `following_id` INT NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`follower_id`, `following_id`),
    INDEX `idx_follower_following` (`follower_id`),
    INDEX `idx_following_followers` (`following_id`),
    CONSTRAINT `FK_FOLLOWER_USER` 
        FOREIGN KEY (`follower_id`) 
        REFERENCES `user`(`id`) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `FK_FOLLOWING_USER` 
        FOREIGN KEY (`following_id`) 
        REFERENCES `user`(`id`) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    -- Prevent self-following
    CONSTRAINT `CHK_NO_SELF_FOLLOW` CHECK (`follower_id` != `following_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- Add follower/following counts to user table for performance
ALTER TABLE `user` ADD COLUMN `followers_count` INT DEFAULT 0;
ALTER TABLE `user` ADD COLUMN `following_count` INT DEFAULT 0;
ALTER TABLE `user` ADD COLUMN `posts_count` INT DEFAULT 0;

-- Create triggers to maintain counts (optional - can be done in application)
DELIMITER $$

CREATE TRIGGER `update_follower_counts_insert` 
AFTER INSERT ON `followers`
FOR EACH ROW
BEGIN
    UPDATE `user` SET `followers_count` = `followers_count` + 1 WHERE `id` = NEW.following_id;
    UPDATE `user` SET `following_count` = `following_count` + 1 WHERE `id` = NEW.follower_id;
END$$

CREATE TRIGGER `update_follower_counts_delete` 
AFTER DELETE ON `followers`
FOR EACH ROW
BEGIN
    UPDATE `user` SET `followers_count` = `followers_count` - 1 WHERE `id` = OLD.following_id;
    UPDATE `user` SET `following_count` = `following_count` - 1 WHERE `id` = OLD.follower_id;
END$$

CREATE TRIGGER `update_post_count_insert` 
AFTER INSERT ON `post`
FOR EACH ROW
BEGIN
    UPDATE `user` SET `posts_count` = `posts_count` + 1 WHERE `id` = NEW.user_id;
END$$

CREATE TRIGGER `update_post_count_delete` 
AFTER DELETE ON `post`
FOR EACH ROW
BEGIN
    UPDATE `user` SET `posts_count` = `posts_count` - 1 WHERE `id` = OLD.user_id;
END$$

DELIMITER ;
