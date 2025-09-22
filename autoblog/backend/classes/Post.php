<?php
require_once '../config/database.php';

class Post {
    private $conn;
    private $table_name = "post";

    public function __construct($db) { $this->conn = $db; }

    public function getAllPosts($limit = 10) {
        $query = "SELECT p.*, u.nome, u.sobrenome, u.avatar_url,
                  (SELECT COUNT(*) FROM likes l WHERE l.id_post = p.id) as total_likes,
                  (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) as total_comments,
                  (SELECT file_path FROM attachments a WHERE a.post_id = p.id ORDER BY a.ordem ASC LIMIT 1) as first_image
                  FROM " . $this->table_name . " p
                  LEFT JOIN user u ON p.user_id = u.id
                  ORDER BY p.data_criacao DESC LIMIT ?";
        $stmt = $this->conn->prepare($query);
        $stmt->execute([$limit]);
        return $stmt->fetchAll();
    }

    public function getPostByID($postid) {
        $query = "SELECT p.*, u.nome, u.sobrenome, u.avatar_url,
                  (SELECT COUNT(*) FROM likes l WHERE l.id_post = p.id) as total_likes,
                  (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) as total_comments
                  FROM " . $this->table_name . " p
                  LEFT JOIN user u ON p.user_id = u.id
                  WHERE p.id = ? LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->execute([$postid]);
        $post = $stmt->fetch();

        if ($post) {
            $attachments_query = "SELECT * FROM attachments WHERE post_id = ? ORDER BY ordem ASC";
            $attachments_stmt = $this->conn->prepare($attachments_query);
            $attachments_stmt->execute([$postid]);
            $post['attachments'] = $attachments_stmt->fetchAll();
        }
        return $post;
    }

    public function getAllPostByUser($userid) {
        $query = "SELECT p.*, u.nome, u.sobrenome,
                  (SELECT COUNT(*) FROM likes l WHERE l.id_post = p.id) as total_likes,
                  (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) as total_comments,
                  (SELECT file_path FROM attachments a WHERE a.post_id = p.id ORDER BY a.ordem ASC LIMIT 1) as image_url
                  FROM " . $this->table_name . " p
                  LEFT JOIN user u ON p.user_id = u.id
                  WHERE p.user_id = ? ORDER BY p.data_criacao DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute([$userid]);
        return $stmt->fetchAll();
    }

    public function getPostBySearchContent($search_string) {
        $query = "SELECT p.*, u.nome, u.sobrenome,
                  (SELECT COUNT(*) FROM likes l WHERE l.id_post = p.id) as total_likes,
                  (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) as total_comments
                  FROM " . $this->table_name . " p
                  LEFT JOIN user u ON p.user_id = u.id
                  WHERE p.corpo LIKE ? ORDER BY p.data_criacao DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute(['%' . $search_string . '%']);
        return $stmt->fetchAll();
    }

    public function getPostBySearchTitle($search_string) {
        $query = "SELECT p.*, u.nome, u.sobrenome,
                  (SELECT COUNT(*) FROM likes l WHERE l.id_post = p.id) as total_likes,
                  (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) as total_comments
                  FROM " . $this->table_name . " p
                  LEFT JOIN user u ON p.user_id = u.id
                  WHERE p.titulo LIKE ? ORDER BY p.data_criacao DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute(['%' . $search_string . '%']);
        return $stmt->fetchAll();
    }

    public function createPost($dados, $user_id) {
        $query = "INSERT INTO " . $this->table_name . " (titulo, corpo, user_id) VALUES (?, ?, ?)";
        $stmt = $this->conn->prepare($query);
        $result = $stmt->execute([$dados['titulo'], $dados['corpo'], $user_id]);
        return $result ? $this->conn->lastInsertId() : false;
    }

    public function updatePost($dados, $user_id) {
        $query = "UPDATE " . $this->table_name . " SET titulo = ?, corpo = ? WHERE id = ? AND user_id = ?";
        $stmt = $this->conn->prepare($query);
        return $stmt->execute([$dados['titulo'], $dados['corpo'], $dados['id'], $user_id]);
    }

    public function deletePost($post_id, $user_id) {
        require_once 'Attachment.php';
        $attachment = new Attachment($this->conn);
        $attachment->deletePostAttachments($post_id);
        $query = "DELETE FROM " . $this->table_name . " WHERE id = ? AND user_id = ?";
        $stmt = $this->conn->prepare($query);
        return $stmt->execute([$post_id, $user_id]);
    }

    public function getLikedPostsByUser($user_id, $start_date = null, $end_date = null) {
        $query = "SELECT p.*, u.nome, u.sobrenome, u.avatar_url,
                  (SELECT COUNT(*) FROM likes l2 WHERE l2.id_post = p.id) as total_likes,
                  (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) as total_comments,
                  (SELECT file_path FROM attachments a WHERE a.post_id = p.id ORDER BY a.ordem ASC LIMIT 1) as first_image
                  FROM " . $this->table_name . " p
                  INNER JOIN likes l ON l.id_post = p.id
                  LEFT JOIN user u ON p.user_id = u.id
                  WHERE l.user_id = ?";
        $params = [$user_id];
        if($start_date) { $query .= " AND l.data_criacao >= ?"; $params[] = $start_date; }
        if($end_date) { $query .= " AND l.data_criacao <= ?"; $params[] = $end_date; }
        $query .= " ORDER BY l.data_criacao DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }
}

// AJAX endpoint
if(isset($_POST['action'])) {
    $postObj = new Post($db);
    if($_POST['action'] == 'getAllPosts'){
        echo json_encode($postObj->getAllPosts($_POST['limit'] ?? 10));
    }
    if($_POST['action'] == 'getLikedPostsByUser'){
        $start = $_POST['start_date'] ?? null;
        $end = $_POST['end_date'] ?? null;
        echo json_encode($postObj->getLikedPostsByUser($_POST['user_id'], $start, $end));
    }
}
?>
