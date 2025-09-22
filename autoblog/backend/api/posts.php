<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once '../config/database.php';
require_once '../config/env.php';
require_once '../classes/Post.php';
require_once '../classes/Likes.php';
require_once '../classes/Attachment.php';
require_once '../classes/Auth.php';
require_once '../middleware/auth_middleware.php';

corsHeaders();

try {
    $database = new Database();
    $db = $database->getConnection();
    
    if (!$db) {
        throw new Exception('Database connection failed');
    }
    
    $post = new Post($db);
    $likes = new Likes($db);
    $attachment = new Attachment($db);
} catch (Exception $e) {
    echo json_encode(['erro' => 'Erro de conexão com o banco de dados']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        try {
            $current_user = optionalAuthentication();
            $user_id = $current_user ? $current_user['user_id'] : null;
            
            if (isset($_GET['action'])) {
                switch ($_GET['action']) {
                    case 'all':
                        $limit = min(intval($_GET['limit'] ?? 10), 50); // Max 50 posts per request
                        $page = max(intval($_GET['page'] ?? 1), 1);
                        $offset = ($page - 1) * $limit;
                        
                        $posts = $post->getAllPostsWithPagination($limit, $offset);
                        
                        // Add user like status if authenticated
                        if ($user_id) {
                            foreach ($posts as &$postItem) {
                                $postItem['user_liked'] = $likes->userLikedPost($postItem['id'], $user_id);
                            }
                        }
                        
                        echo json_encode(['posts' => $posts]);
                        break;
                        
                    case 'by_id':
                        if (isset($_GET['id'])) {
                            $postData = $post->getPostByID($_GET['id']);
                            if ($postData && $user_id) {
                                $postData['user_liked'] = $likes->userLikedPost($postData['id'], $user_id);
                            }
                            echo json_encode(['post' => $postData]);
                        } else {
                            echo json_encode(['erro' => 'ID do post é obrigatório']);
                        }
                        break;
                        
                    case 'by_user':
                        if (isset($_GET['user_id'])) {
                            $posts = $post->getAllPostByUser($_GET['user_id']);
                            echo json_encode(['posts' => $posts]);
                        } else {
                            echo json_encode(['erro' => 'ID do usuário é obrigatório']);
                        }
                        break;

                    case 'getLikedPostsByUser':
                        if (!$user_id) {
                            echo json_encode(['erro' => 'Autenticação necessária']);
                            exit;
                        }
                        
                        $target_user_id = $_GET['user_id'] ?? $user_id;
                        $start_date = $_GET['start_date'] ?? '';
                        $end_date = $_GET['end_date'] ?? '';
                        
                        $posts = $post->getLikedPostsByUser($target_user_id, $start_date, $end_date);
                        echo json_encode(['posts' => $posts]);
                        break;
                        
                    case 'search_title':
                        if (isset($_GET['query'])) {
                            $posts = $post->getPostBySearchTitle($_GET['query']);
                            echo json_encode(['posts' => $posts]);
                        } else {
                            echo json_encode(['erro' => 'Query de busca é obrigatória']);
                        }
                        break;
                        
                    case 'search_content':
                        if (isset($_GET['query'])) {
                            $posts = $post->getPostBySearchContent($_GET['query']);
                            echo json_encode(['posts' => $posts]);
                        } else {
                            echo json_encode(['erro' => 'Query de busca é obrigatória']);
                        }
                        break;
                        
                    default:
                        echo json_encode(['erro' => 'Ação não reconhecida']);
                }
            } else {
                // Default: get all posts with pagination
                $limit = min(intval($_GET['limit'] ?? 10), 50);
                $page = max(intval($_GET['page'] ?? 1), 1);
                $offset = ($page - 1) * $limit;
                
                $posts = $post->getAllPostsWithPagination($limit, $offset);
                echo json_encode(['posts' => $posts]);
            }
        } catch (Exception $e) {
            echo json_encode(['erro' => 'Erro ao buscar posts: ' . $e->getMessage()]);
        }
        break;
        
    case 'POST':
        try {
            $current_user = requireAuthentication();
            $user_id = $current_user['user_id'];
            
            if (isset($_FILES['images']) && !empty($_FILES['images']['name'][0])) {
                // Handle post with images
                $titulo = $_POST['titulo'] ?? '';
                $corpo = $_POST['corpo'] ?? '';
                
                // Validate required fields
                if (empty(trim($corpo))) {
                    echo json_encode(['erro' => 'Conteúdo do post é obrigatório']);
                    exit;
                }
                
                // Validate image count
                if (count($_FILES['images']['name']) > 5) {
                    echo json_encode(['erro' => 'Máximo de 5 imagens permitidas']);
                    exit;
                }
                
                // Create post first
                $post_data = [
                    'titulo' => trim($titulo),
                    'corpo' => trim($corpo)
                ];
                
                $post_id = $post->createPost($post_data, $user_id);
                
                if ($post_id) {
                    // Upload images
                    $uploaded_files = $attachment->uploadPostImages($post_id, $_FILES['images']);
                    
                    echo json_encode([
                        'sucesso' => true,
                        'mensagem' => 'Post criado com sucesso',
                        'post_id' => $post_id,
                        'attachments' => $uploaded_files
                    ]);
                } else {
                    echo json_encode(['erro' => 'Erro ao criar post']);
                }
            } else {
                // Handle regular JSON post (text only)
                $json_data = file_get_contents('php://input');
                $data = json_decode($json_data, true);
                
                if ($data === null) {
                    echo json_encode(['erro' => 'JSON inválido']);
                    exit;
                }
                
                // Validate required fields
                if (empty(trim($data['corpo'] ?? ''))) {
                    echo json_encode(['erro' => 'Conteúdo do post é obrigatório']);
                    exit;
                }
                
                // Validate content length
                if (strlen($data['corpo']) > 5000) {
                    echo json_encode(['erro' => 'Conteúdo muito longo (máximo 5000 caracteres)']);
                    exit;
                }
                
                $post_data = [
                    'titulo' => trim($data['titulo'] ?? ''),
                    'corpo' => trim($data['corpo'])
                ];
                
                $post_id = $post->createPost($post_data, $user_id);
                
                if ($post_id) {
                    echo json_encode([
                        'sucesso' => true,
                        'mensagem' => 'Post criado com sucesso',
                        'post_id' => $post_id
                    ]);
                } else {
                    echo json_encode(['erro' => 'Erro ao criar post']);
                }
            }
        } catch (Exception $e) {
            echo json_encode(['erro' => 'Erro interno: ' . $e->getMessage()]);
        }
        break;
        
    case 'PUT':
        try {
            $current_user = requireAuthentication();
            $user_id = $current_user['user_id'];
            
            $json_data = file_get_contents('php://input');
            $data = json_decode($json_data, true);
            
            if ($data === null) {
                echo json_encode(['erro' => 'JSON inválido']);
                exit;
            }
            
            if (!isset($data['id']) || empty(trim($data['corpo'] ?? ''))) {
                echo json_encode(['erro' => 'ID do post e conteúdo são obrigatórios']);
                exit;
            }
            
            // Validate content length
            if (strlen($data['corpo']) > 5000) {
                echo json_encode(['erro' => 'Conteúdo muito longo (máximo 5000 caracteres)']);
                exit;
            }
            
            if ($post->updatePost($data, $user_id)) {
                echo json_encode(['sucesso' => true, 'mensagem' => 'Post atualizado com sucesso']);
            } else {
                echo json_encode(['erro' => 'Erro ao atualizar post ou post não encontrado']);
            }
        } catch (Exception $e) {
            echo json_encode(['erro' => 'Erro interno: ' . $e->getMessage()]);
        }
        break;
        
    case 'DELETE':
        try {
            $current_user = requireAuthentication();
            $user_id = $current_user['user_id'];
            
            $post_id = intval($_GET['id'] ?? 0);
            if ($post_id && $post->deletePost($post_id, $user_id)) {
                echo json_encode(['sucesso' => true, 'mensagem' => 'Post deletado com sucesso']);
            } else {
                echo json_encode(['erro' => 'Erro ao deletar post ou post não encontrado']);
            }
        } catch (Exception $e) {
            echo json_encode(['erro' => 'Erro interno: ' . $e->getMessage()]);
        }
        break;
        
    default:
        echo json_encode(['erro' => 'Método não permitido']);
}
?>
