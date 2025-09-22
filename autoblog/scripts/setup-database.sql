SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

CREATE DATABASE IF NOT EXISTS `blogweb` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `blogweb`;

-- Drop tables in correct dependency order
DROP TABLE IF EXISTS `attachment`;
DROP TABLE IF EXISTS `comment`;
DROP TABLE IF EXISTS `likes`;
DROP TABLE IF EXISTS `post`;
DROP TABLE IF EXISTS `user`;

-- Enhanced user table with better constraints and indexes
CREATE TABLE `user` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nome` VARCHAR(100) NOT NULL,
  `sobrenome` VARCHAR(100) NOT NULL DEFAULT '',
  `senha` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `biografia` TEXT NULL,
  `avatar_url` VARCHAR(500) NULL,
  `data_registro` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `status` ENUM('active', 'inactive', 'suspended') NOT NULL DEFAULT 'active',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_user_email` (`email`),
  INDEX `idx_user_status` (`status`),
  INDEX `idx_user_created` (`data_registro` DESC),
  FULLTEXT KEY `ft_user_search` (`nome`, `sobrenome`, `biografia`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Enhanced post table with better performance indexes
CREATE TABLE `post` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `titulo` VARCHAR(255) NULL,
  `corpo` TEXT NOT NULL,
  `data_criacao` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `user_id` INT NOT NULL,
  `status` ENUM('published', 'draft', 'archived') NOT NULL DEFAULT 'published',
  `views` INT NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  INDEX `idx_user_posts` (`user_id`, `data_criacao` DESC),
  INDEX `idx_post_date` (`data_criacao` DESC),
  INDEX `idx_post_status` (`status`),
  INDEX `idx_post_views` (`views` DESC),
  FULLTEXT KEY `ft_post_search` (`titulo`, `corpo`),
  CONSTRAINT `fk_post_user` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Renamed and enhanced likes table with timestamp
CREATE TABLE `likes` (
  `user_id` INT NOT NULL,
  `post_id` INT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`, `post_id`),
  INDEX `idx_post_likes` (`post_id`),
  INDEX `idx_user_likes` (`user_id`),
  INDEX `idx_likes_created` (`created_at` DESC),
  CONSTRAINT `fk_likes_user` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_likes_post` FOREIGN KEY (`post_id`) REFERENCES `post`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Renamed and enhanced comments table
CREATE TABLE `comment` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `post_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `comentario` TEXT NOT NULL,
  `data_criacao` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `status` ENUM('approved', 'pending', 'spam') NOT NULL DEFAULT 'approved',
  PRIMARY KEY (`id`),
  INDEX `idx_post_comments` (`post_id`, `data_criacao` DESC),
  INDEX `idx_user_comments` (`user_id`),
  INDEX `idx_comment_status` (`status`),
  FULLTEXT KEY `ft_comment_search` (`comentario`),
  CONSTRAINT `fk_comment_user` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_comment_post` FOREIGN KEY (`post_id`) REFERENCES `post`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Enhanced attachment table with better file management
CREATE TABLE `attachment` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `post_id` INT NOT NULL,
  `filename` VARCHAR(255) NOT NULL,
  `original_name` VARCHAR(255) NOT NULL,
  `caminho` VARCHAR(500) NOT NULL,
  `thumb_path` VARCHAR(500) NULL,
  `file_size` INT NOT NULL,
  `mime_type` VARCHAR(100) NOT NULL,
  `tipo` ENUM('image', 'video', 'document') NOT NULL DEFAULT 'image',
  `ordem` TINYINT NOT NULL DEFAULT 0,
  `width` INT NULL,
  `height` INT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_post_attachments` (`post_id`, `ordem`),
  INDEX `idx_attachment_type` (`tipo`),
  INDEX `idx_attachment_created` (`created_at` DESC),
  CONSTRAINT `fk_attachment_post` FOREIGN KEY (`post_id`) REFERENCES `post`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create optimized views for common queries
CREATE VIEW `post_with_stats` AS
SELECT 
    p.*,
    u.nome,
    u.sobrenome,
    u.avatar_url,
    CONCAT(u.nome, ' ', u.sobrenome) as autor_nome,
    COALESCE(like_count.total_likes, 0) as total_likes,
    COALESCE(comment_count.total_comentarios, 0) as total_comentarios,
    COALESCE(attachment_count.total_attachments, 0) as total_attachments
FROM post p
LEFT JOIN user u ON p.user_id = u.id
LEFT JOIN (
    SELECT post_id, COUNT(*) as total_likes 
    FROM likes 
    GROUP BY post_id
) like_count ON p.id = like_count.post_id
LEFT JOIN (
    SELECT post_id, COUNT(*) as total_comentarios 
    FROM comment 
    WHERE status = 'approved'
    GROUP BY post_id
) comment_count ON p.id = comment_count.post_id
LEFT JOIN (
    SELECT post_id, COUNT(*) as total_attachments 
    FROM attachment 
    GROUP BY post_id
) attachment_count ON p.id = attachment_count.post_id
WHERE p.status = 'published' AND u.status = 'active';

-- Create user statistics view
CREATE VIEW `user_stats` AS
SELECT 
    u.id,
    u.nome,
    u.sobrenome,
    u.email,
    u.biografia,
    u.avatar_url,
    u.data_registro,
    COALESCE(post_count.total_posts, 0) as total_posts,
    COALESCE(like_count.total_likes_given, 0) as total_likes_given,
    COALESCE(received_likes.total_likes_received, 0) as total_likes_received,
    COALESCE(comment_count.total_comments, 0) as total_comments
FROM user u
LEFT JOIN (
    SELECT user_id, COUNT(*) as total_posts 
    FROM post 
    WHERE status = 'published'
    GROUP BY user_id
) post_count ON u.id = post_count.user_id
LEFT JOIN (
    SELECT user_id, COUNT(*) as total_likes_given 
    FROM likes 
    GROUP BY user_id
) like_count ON u.id = like_count.user_id
LEFT JOIN (
    SELECT p.user_id, COUNT(l.post_id) as total_likes_received
    FROM post p
    LEFT JOIN likes l ON p.id = l.post_id
    WHERE p.status = 'published'
    GROUP BY p.user_id
) received_likes ON u.id = received_likes.user_id
LEFT JOIN (
    SELECT user_id, COUNT(*) as total_comments 
    FROM comment 
    WHERE status = 'approved'
    GROUP BY user_id
) comment_count ON u.id = comment_count.user_id
WHERE u.status = 'active';

COMMIT;
