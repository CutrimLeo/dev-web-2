<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once '../config/database.php';
require_once '../classes/Attachment.php';

session_start();

// Check if user is authenticated
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['erro' => 'Usuário não autenticado']);
    exit;
}

$database = new Database();
$db = $database->getConnection();
$attachment = new Attachment($db);

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    try {
        if (isset($_POST['action'])) {
            switch ($_POST['action']) {
                case 'upload_post_images':
                    if (!isset($_POST['post_id']) || !isset($_FILES['images'])) {
                        echo json_encode(['erro' => 'Dados incompletos']);
                        exit;
                    }
                    
                    $post_id = $_POST['post_id'];
                    $files = $_FILES['images'];
                    
                    // Validate that user owns the post
                    $query = "SELECT user_id FROM post WHERE id = ?";
                    $stmt = $db->prepare($query);
                    $stmt->execute([$post_id]);
                    $post = $stmt->fetch();
                    
                    if (!$post || $post['user_id'] != $_SESSION['user_id']) {
                        echo json_encode(['erro' => 'Post não encontrado ou sem permissão']);
                        exit;
                    }
                    
                    $uploaded_files = $attachment->uploadPostImages($post_id, $files);
                    
                    echo json_encode([
                        'sucesso' => true,
                        'mensagem' => 'Imagens enviadas com sucesso',
                        'attachments' => $uploaded_files
                    ]);
                    break;
                    
                case 'delete_attachment':
                    if (!isset($_POST['attachment_id'])) {
                        echo json_encode(['erro' => 'ID do anexo é obrigatório']);
                        exit;
                    }
                    
                    $attachment_id = $_POST['attachment_id'];
                    
                    if ($attachment->deleteAttachment($attachment_id, $_SESSION['user_id'])) {
                        echo json_encode([
                            'sucesso' => true,
                            'mensagem' => 'Anexo deletado com sucesso'
                        ]);
                    } else {
                        echo json_encode(['erro' => 'Erro ao deletar anexo']);
                    }
                    break;
                    
                default:
                    echo json_encode(['erro' => 'Ação não reconhecida']);
            }
        } else {
            echo json_encode(['erro' => 'Ação não especificada']);
        }
        
    } catch (Exception $e) {
        echo json_encode(['erro' => $e->getMessage()]);
    }
} else {
    echo json_encode(['erro' => 'Método não permitido']);
}
?>
