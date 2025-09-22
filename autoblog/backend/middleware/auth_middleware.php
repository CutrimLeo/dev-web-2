<?php
require_once '../classes/Auth.php';

function requireAuthentication() {
    try {
        return Auth::requireAuth();
    } catch (Exception $e) {
        http_response_code(401);
        echo json_encode(['erro' => 'Acesso negado']);
        exit;
    }
}

function optionalAuthentication() {
    try {
        return Auth::getCurrentUser();
    } catch (Exception $e) {
        return false;
    }
}

function corsHeaders() {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        exit(0);
    }
}
?>
