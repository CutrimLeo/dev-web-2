<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once '../config/database.php';
require_once '../config/env.php';
require_once '../classes/User.php';
require_once '../classes/Auth.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

try {
    $database = new Database();
    $db = $database->getConnection();
    
    if (!$db) {
        throw new Exception('Database connection failed');
    }
    
    $user = new User($db);
    $auth = new Auth();
} catch (Exception $e) {
    echo json_encode(['erro' => 'Erro de conexão com o banco de dados']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $json_data = file_get_contents('php://input');
    $data = json_decode($json_data, true);
    
    if ($data === null) {
        echo json_encode(['erro' => 'JSON inválido']);
        exit;
    }
    
    $action = $data['action'] ?? $_GET['action'] ?? '';
    
    switch ($action) {
        case 'login':
            if (!isset($data['email']) || !isset($data['senha'])) {
                echo json_encode(['erro' => 'Email e senha são obrigatórios']);
                exit;
            }
            
            try {
                $userData = $user->authenticate($data['email'], $data['senha']);
                
                if ($userData) {
                    $token = Auth::generateToken($userData);
                    Auth::setAuthCookie($token);
                    
                    echo json_encode([
                        'sucesso' => true,
                        'mensagem' => 'Login realizado com sucesso',
                        'token' => $token,
                        'usuario' => [
                            'id' => $userData['id'],
                            'nome' => $userData['nome'],
                            'sobrenome' => $userData['sobrenome'],
                            'email' => $userData['email'],
                            'biografia' => $userData['biografia'],
                            'avatar_url' => $userData['avatar_url']
                        ]
                    ]);
                } else {
                    echo json_encode(['erro' => 'Email ou senha incorretos']);
                }
            } catch (Exception $e) {
                echo json_encode(['erro' => $e->getMessage()]);
            }
            break;
            
        case 'register':
            if (!isset($data['nome']) || !isset($data['email']) || !isset($data['senha'])) {
                echo json_encode(['erro' => 'Nome, email e senha são obrigatórios']);
                exit;
            }
            
            try {
                $user_id = $user->createUser($data);
                
                if ($user_id) {
                    echo json_encode([
                        'sucesso' => true, 
                        'mensagem' => 'Usuário criado com sucesso',
                        'user_id' => $user_id
                    ]);
                } else {
                    echo json_encode(['erro' => 'Erro ao criar usuário']);
                }
            } catch (Exception $e) {
                echo json_encode(['erro' => $e->getMessage()]);
            }
            break;
            
        case 'logout':
            Auth::clearAuthCookie();
            echo json_encode(['sucesso' => true, 'mensagem' => 'Logout realizado com sucesso']);
            break;

        case 'change_password':
            try {
                $current_user = Auth::requireAuth();
                
                if (!isset($data['current_password']) || !isset($data['new_password'])) {
                    echo json_encode(['erro' => 'Senha atual e nova senha são obrigatórias']);
                    exit;
                }
                
                if ($user->updatePassword($current_user['user_id'], $data['current_password'], $data['new_password'])) {
                    echo json_encode(['sucesso' => true, 'mensagem' => 'Senha alterada com sucesso']);
                } else {
                    echo json_encode(['erro' => 'Erro ao alterar senha']);
                }
            } catch (Exception $e) {
                echo json_encode(['erro' => $e->getMessage()]);
            }
            break;

        case 'update_profile':
            try {
                $current_user = Auth::requireAuth();
                
                $avatar_url = '';
                if (isset($_FILES['avatar']) && $_FILES['avatar']['error'] === UPLOAD_ERR_OK) {
                    require_once '../classes/Attachment.php';
                    $attachment = new Attachment($db);
                    
                    // Create a temporary post ID for avatar upload (we'll use user ID as negative to distinguish)
                    $temp_post_id = -$current_user['user_id'];
                    
                    $avatar_file = [
                        'name' => $_FILES['avatar']['name'],
                        'tmp_name' => $_FILES['avatar']['tmp_name'],
                        'size' => $_FILES['avatar']['size'],
                        'type' => $_FILES['avatar']['type']
                    ];
                    
                    $uploaded_avatar = $attachment->uploadAvatar($current_user['user_id'], $avatar_file);
                    if ($uploaded_avatar) {
                        $avatar_url = $uploaded_avatar['file_path'];
                    }
                }
                
                $update_data = [
                    'id' => $current_user['user_id'],
                    'nome' => $_POST['nome'] ?? $data['nome'] ?? '',
                    'sobrenome' => $_POST['sobrenome'] ?? $data['sobrenome'] ?? '',
                    'biografia' => $_POST['biografia'] ?? $data['biografia'] ?? '',
                    'avatar_url' => $avatar_url ?: ($_POST['avatar_url'] ?? $data['avatar_url'] ?? '')
                ];
                
                if ($user->updateUser($update_data)) {
                    $updated_user = $user->getUserByID($current_user['user_id']);
                    echo json_encode([
                        'sucesso' => true, 
                        'mensagem' => 'Perfil atualizado com sucesso',
                        'usuario' => $updated_user,
                        'avatar_url' => $updated_user['avatar_url']
                    ]);
                } else {
                    echo json_encode(['erro' => 'Erro ao atualizar perfil']);
                }
            } catch (Exception $e) {
                echo json_encode(['erro' => $e->getMessage()]);
            }
            break;
            
        default:
            echo json_encode(['erro' => 'Ação não reconhecida']);
    }
} elseif ($method === 'GET') {
    $action = $_GET['action'] ?? '';
    
    switch ($action) {
        case 'check':
            try {
                $current_user = Auth::getCurrentUser();
                if ($current_user) {
                    $userData = $user->getUserByID($current_user['user_id']);
                    if ($userData) {
                        echo json_encode([
                            'autenticado' => true,
                            'usuario' => [
                                'id' => $userData['id'],
                                'nome' => $userData['nome'],
                                'sobrenome' => $userData['sobrenome'],
                                'email' => $userData['email'],
                                'biografia' => $userData['biografia'],
                                'avatar_url' => $userData['avatar_url']
                            ]
                        ]);
                    } else {
                        echo json_encode(['autenticado' => false]);
                    }
                } else {
                    echo json_encode(['autenticado' => false]);
                }
            } catch (Exception $e) {
                echo json_encode(['autenticado' => false]);
            }
            break;

        case 'profile':
            try {
                $user_id = $_GET['user_id'] ?? null;
                if (!$user_id) {
                    $current_user = Auth::requireAuth();
                    $user_id = $current_user['user_id'];
                }
                
                $userData = $user->getUserByID($user_id);
                $userStats = $user->getUserStats($user_id);
                
                if ($userData) {
                    echo json_encode([
                        'sucesso' => true,
                        'usuario' => $userData,
                        'estatisticas' => $userStats
                    ]);
                } else {
                    echo json_encode(['erro' => 'Usuário não encontrado']);
                }
            } catch (Exception $e) {
                echo json_encode(['erro' => $e->getMessage()]);
            }
            break;
            
        default:
            echo json_encode(['erro' => 'Ação não reconhecida']);
    }
} else {
    echo json_encode(['erro' => 'Método não permitido']);
}
?>
