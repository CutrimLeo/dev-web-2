-- Database optimization script
-- Run this to improve performance

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_post_user_id ON post(user_id);
CREATE INDEX IF NOT EXISTS idx_post_data_criacao ON post(data_criacao DESC);
CREATE INDEX IF NOT EXISTS idx_post_titulo ON post(titulo);
CREATE INDEX IF NOT EXISTS idx_post_corpo_fulltext ON post(corpo);

CREATE INDEX IF NOT EXISTS idx_comment_post_id ON comment(post_id);
CREATE INDEX IF NOT EXISTS idx_comment_user_id ON comment(user_id);
CREATE INDEX IF NOT EXISTS idx_comment_data_criacao ON comment(data_criacao DESC);

CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_unique ON likes(post_id, user_id);

CREATE INDEX IF NOT EXISTS idx_attachment_post_id ON attachment(post_id);
CREATE INDEX IF NOT EXISTS idx_attachment_tipo ON attachment(tipo);

CREATE INDEX IF NOT EXISTS idx_user_email ON user(email);
CREATE INDEX IF NOT EXISTS idx_user_data_registro ON user(data_registro DESC);

-- Add fulltext search indexes
ALTER TABLE post ADD FULLTEXT(titulo, corpo);
ALTER TABLE user ADD FULLTEXT(nome, sobrenome, biografia);

-- Optimize tables
OPTIMIZE TABLE user;
OPTIMIZE TABLE post;
OPTIMIZE TABLE comment;
OPTIMIZE TABLE likes;
OPTIMIZE TABLE attachment;

-- Update table statistics
ANALYZE TABLE user;
ANALYZE TABLE post;
ANALYZE TABLE comment;
ANALYZE TABLE likes;
ANALYZE TABLE attachment;

-- Set optimal MySQL settings (add to my.cnf)
-- innodb_buffer_pool_size = 1G
-- query_cache_size = 256M
-- query_cache_type = 1
-- slow_query_log = 1
-- long_query_time = 2
-- max_connections = 200
-- innodb_log_file_size = 256M
