<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

session_start();

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        if (isset($_GET['post_id'])) {
            $post_id = intval($_GET['post_id']);
            $query = "SELECT c.id, c.post_id, c.user_id, c.comentario, c.data_criacao, u.nome, u.sobrenome, u.avatar_url
                      FROM comments c
                      JOIN user u ON u.id = c.user_id
                      WHERE c.post_id = ?
                      ORDER BY c.data_criacao ASC";
            $stmt = $db->prepare($query);
            $stmt->execute([$post_id]);
            $comments = $stmt->fetchAll();
            echo json_encode(['comments' => $comments]);
        } else {
            echo json_encode(['erro' => 'post_id é obrigatório']);
        }
        break;
    case 'POST':
        $json_data = file_get_contents('php://input');
        $data = json_decode($json_data, true);
        if (!isset($_SESSION['user_id'])) {
            echo json_encode(['erro' => 'Usuário não autenticado']);
            exit;
        }
        if (!isset($data['post_id']) || !isset($data['comentario'])) {
            echo json_encode(['erro' => 'post_id e comentario são obrigatórios']);
            exit;
        }
        $post_id = intval($data['post_id']);
        $user_id = intval($_SESSION['user_id']);
        $comentario = $data['comentario'];

        $insert = "INSERT INTO comments (post_id, user_id, comentario) VALUES (?, ?, ?)";
        $stmt = $db->prepare($insert);
        if ($stmt->execute([$post_id, $user_id, $comentario])) {
            echo json_encode(['sucesso' => true, 'mensagem' => 'Comentário adicionado com sucesso']);
        } else {
            echo json_encode(['erro' => 'Erro ao adicionar comentário']);
        }
        break;
    default:
        echo json_encode(['erro' => 'Método não permitido']);
}
?>
