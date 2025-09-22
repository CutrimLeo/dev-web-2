<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../config/database.php';
require_once '../classes/Likes.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

session_start();

$database = new Database();
$db = $database->getConnection();
$likes = new Likes($db);

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        if (isset($_GET['action'])) {
            switch ($_GET['action']) {
                case 'count':
                    if (isset($_GET['post_id'])) {
                        $count = $likes->getPostLikes($_GET['post_id']);
                        echo json_encode(['likes' => $count]);
                    } else {
                        echo json_encode(['erro' => 'ID do post é obrigatório']);
                    }
                    break;
                    
                case 'user_liked':
                    if (isset($_GET['user_id'])) {
                        $posts = $likes->getPostLikedByUser($_GET['user_id']);
                        echo json_encode(['posts' => $posts]);
                    } else {
                        echo json_encode(['erro' => 'ID do usuário é obrigatório']);
                    }
                    break;
                    
                case 'check':
                    if (isset($_GET['post_id']) && isset($_SESSION['user_id'])) {
                        $liked = $likes->userLikedPost($_GET['post_id'], $_SESSION['user_id']);
                        echo json_encode(['liked' => $liked]);
                    } else {
                        echo json_encode(['erro' => 'Parâmetros insuficientes']);
                    }
                    break;
            }
        }
        break;
        
    case 'POST':
        $json_data = file_get_contents('php://input');
        $data = json_decode($json_data, true);
        
        if (!isset($_SESSION['user_id'])) {
            echo json_encode(['erro' => 'Usuário não autenticado']);
            exit;
        }
        
        if (isset($data['post_id'])) {
            if ($likes->updateLikes($data['post_id'], $_SESSION['user_id'])) {
                $newCount = $likes->getPostLikes($data['post_id']);
                $liked = $likes->userLikedPost($data['post_id'], $_SESSION['user_id']);
                echo json_encode([
                    'sucesso' => true, 
                    'likes' => $newCount,
                    'liked' => $liked
                ]);
            } else {
                echo json_encode(['erro' => 'Erro ao processar like']);
            }
        } else {
            echo json_encode(['erro' => 'ID do post é obrigatório']);
        }
        break;
        
    default:
        echo json_encode(['erro' => 'Método não permitido']);
}
?>
