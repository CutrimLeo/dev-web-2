<?php
require_once '../config/database.php';

class Likes {
    private $conn;
    private $table_name = "likes";

    public function __construct($db) {
        $this->conn = $db;
    }

    // Função GET: getPostLikedByUser
    public function getPostLikedByUser($userid) {
        $query = "SELECT p.*, u.nome, u.sobrenome,
                  (SELECT COUNT(*) FROM likes l WHERE l.id_post = p.id) as total_likes
                  FROM post p 
                  LEFT JOIN user u ON p.user_id = u.id 
                  INNER JOIN " . $this->table_name . " l ON p.id = l.id_post 
                  WHERE l.id_user = ? ORDER BY p.data_criacao DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute([$userid]);
        return $stmt->fetchAll();
    }

    // Função GET: getPostLikes
    public function getPostLikes($postid) {
        $query = "SELECT COUNT(*) as total FROM " . $this->table_name . " WHERE id_post = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->execute([$postid]);
        $result = $stmt->fetch();
        return $result['total'];
    }

    // Função UPDATE: updateLikes (toggle)
    public function updateLikes($post_id, $user_id) {
        // Verificar se já existe o like
        $check_query = "SELECT * FROM " . $this->table_name . " WHERE id_post = ? AND id_user = ?";
        $check_stmt = $this->conn->prepare($check_query);
        $check_stmt->execute([$post_id, $user_id]);
        
        if ($check_stmt->fetch()) {
            // Se existe, remove o like
            $delete_query = "DELETE FROM " . $this->table_name . " WHERE id_post = ? AND id_user = ?";
            $delete_stmt = $this->conn->prepare($delete_query);
            return $delete_stmt->execute([$post_id, $user_id]);
        } else {
            // Se não existe, adiciona o like
            $insert_query = "INSERT INTO " . $this->table_name . " (id_post, id_user) VALUES (?, ?)";
            $insert_stmt = $this->conn->prepare($insert_query);
            return $insert_stmt->execute([$post_id, $user_id]);
        }
    }

    // Verificar se usuário curtiu o post
    public function userLikedPost($post_id, $user_id) {
        $query = "SELECT * FROM " . $this->table_name . " WHERE id_post = ? AND id_user = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->execute([$post_id, $user_id]);
        return $stmt->fetch() ? true : false;
    }
}
?>
