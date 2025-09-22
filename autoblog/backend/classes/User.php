<?php
require_once '../config/database.php';

class User {
    private $conn;
    private $table_name = "user";

    public function __construct($db) {
        $this->conn = $db;
    }

    public function isValidEmail($email) {
        return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
    }

    public function emailExists($email) {
        $query = "SELECT id FROM " . $this->table_name . " WHERE email = ? LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->execute([$email]);
        return $stmt->rowCount() > 0;
    }

    // Função GET: getUserByEmail
    public function getUserByEmail($email) {
        $query = "SELECT * FROM " . $this->table_name . " WHERE email = ? LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->execute([$email]);
        return $stmt->fetch();
    }

    // Função GET: getUserByID
    public function getUserByID($userid) {
        $query = "SELECT id, nome, sobrenome, email, biografia, avatar_url, data_registro FROM " . $this->table_name . " WHERE id = ? LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->execute([$userid]);
        return $stmt->fetch();
    }

    public function createUser($dados) {
        // Validate required fields
        if (empty($dados['nome']) || empty($dados['email']) || empty($dados['senha'])) {
            throw new Exception("Nome, email e senha são obrigatórios");
        }

        // Validate email format
        if (!$this->isValidEmail($dados['email'])) {
            throw new Exception("Email inválido");
        }

        // Check if email already exists
        if ($this->emailExists($dados['email'])) {
            throw new Exception("Email já está em uso");
        }

        // Validate password strength
        if (strlen($dados['senha']) < 6) {
            throw new Exception("Senha deve ter pelo menos 6 caracteres");
        }

        $query = "INSERT INTO " . $this->table_name . " (nome, sobrenome, email, senha, biografia, avatar_url) VALUES (?, ?, ?, ?, ?, ?)";
        $stmt = $this->conn->prepare($query);
        
        $senha_hash = password_hash($dados['senha'], PASSWORD_DEFAULT);
        
        $result = $stmt->execute([
            trim($dados['nome']),
            trim($dados['sobrenome'] ?? ''), 
            trim($dados['email']),
            $senha_hash,
            trim($dados['biografia'] ?? ''),
            trim($dados['avatar_url'] ?? '')
        ]);

        if ($result) {
            return $this->conn->lastInsertId();
        }
        
        return false;
    }

    public function updateUser($dados) {
        if (empty($dados['id']) || empty($dados['nome'])) {
            throw new Exception("ID e nome são obrigatórios");
        }

        $query = "UPDATE " . $this->table_name . " SET nome = ?, sobrenome = ?, biografia = ?, avatar_url = ? WHERE id = ?";
        $stmt = $this->conn->prepare($query);
        
        return $stmt->execute([
            trim($dados['nome']),
            trim($dados['sobrenome'] ?? ''),
            trim($dados['biografia'] ?? ''),
            trim($dados['avatar_url'] ?? ''),
            $dados['id']
        ]);
    }

    public function updatePassword($user_id, $current_password, $new_password) {
        // Get current user data
        $user = $this->getUserByID($user_id);
        if (!$user) {
            throw new Exception("Usuário não encontrado");
        }

        // Verify current password
        $full_user = $this->getUserByEmail($user['email']);
        if (!$this->verifyPassword($current_password, $full_user['senha'])) {
            throw new Exception("Senha atual incorreta");
        }

        // Validate new password
        if (strlen($new_password) < 6) {
            throw new Exception("Nova senha deve ter pelo menos 6 caracteres");
        }

        $query = "UPDATE " . $this->table_name . " SET senha = ? WHERE id = ?";
        $stmt = $this->conn->prepare($query);
        
        $new_hash = password_hash($new_password, PASSWORD_DEFAULT);
        return $stmt->execute([$new_hash, $user_id]);
    }

    // Função DELETE: deleteUser
    public function deleteUser($user_id) {
        $query = "DELETE FROM " . $this->table_name . " WHERE id = ?";
        $stmt = $this->conn->prepare($query);
        return $stmt->execute([$user_id]);
    }

    // Verificar senha
    public function verifyPassword($senha, $hash) {
        return password_verify($senha, $hash);
    }

    public function authenticate($email, $senha) {
        $user = $this->getUserByEmail($email);
        
        if ($user && $this->verifyPassword($senha, $user['senha'])) {
            // Remove password from returned data
            unset($user['senha']);
            return $user;
        }
        
        return false;
    }

    public function getUserStats($user_id) {
        $query = "SELECT 
                    (SELECT COUNT(*) FROM post WHERE user_id = ?) as total_posts,
                    (SELECT COUNT(*) FROM likes WHERE user_id = ?) as total_likes_given,
                    (SELECT COUNT(*) FROM likes l JOIN post p ON l.post_id = p.id WHERE p.user_id = ?) as total_likes_received,
                    (SELECT COUNT(*) FROM comment WHERE user_id = ?) as total_comments";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute([$user_id, $user_id, $user_id, $user_id]);
        return $stmt->fetch();
    }
}
?>
