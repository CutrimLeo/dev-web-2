<?php
require_once '../config/env.php';

class Auth {
    private static $secret_key;
    private static $algorithm = 'HS256';
    
    public function __construct() {
        self::$secret_key = $_ENV['JWT_SECRET'] ?? 'your-secret-key-change-this';
    }

    public static function generateToken($user_data) {
        $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
        $payload = json_encode([
            'user_id' => $user_data['id'],
            'email' => $user_data['email'],
            'nome' => $user_data['nome'],
            'iat' => time(),
            'exp' => time() + (24 * 60 * 60) // 24 hours
        ]);

        $base64Header = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
        $base64Payload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));

        $signature = hash_hmac('sha256', $base64Header . "." . $base64Payload, self::$secret_key, true);
        $base64Signature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));

        return $base64Header . "." . $base64Payload . "." . $base64Signature;
    }

    public static function validateToken($token) {
        if (!$token) {
            return false;
        }

        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return false;
        }

        list($header, $payload, $signature) = $parts;

        // Verify signature
        $valid_signature = hash_hmac('sha256', $header . "." . $payload, self::$secret_key, true);
        $valid_signature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($valid_signature));

        if (!hash_equals($signature, $valid_signature)) {
            return false;
        }

        // Decode payload
        $payload = base64_decode(str_replace(['-', '_'], ['+', '/'], $payload));
        $data = json_decode($payload, true);

        // Check expiration
        if (isset($data['exp']) && $data['exp'] < time()) {
            return false;
        }

        return $data;
    }

    public static function getCurrentUser() {
        $headers = getallheaders();
        $token = null;

        // Check Authorization header
        if (isset($headers['Authorization'])) {
            $auth_header = $headers['Authorization'];
            if (preg_match('/Bearer\s+(.*)$/i', $auth_header, $matches)) {
                $token = $matches[1];
            }
        }

        // Check cookie as fallback
        if (!$token && isset($_COOKIE['auth_token'])) {
            $token = $_COOKIE['auth_token'];
        }

        if ($token) {
            return self::validateToken($token);
        }

        return false;
    }

    public static function requireAuth() {
        $user = self::getCurrentUser();
        if (!$user) {
            http_response_code(401);
            echo json_encode(['error' => 'Token de autenticação necessário']);
            exit;
        }
        return $user;
    }

    public static function setAuthCookie($token) {
        setcookie('auth_token', $token, [
            'expires' => time() + (24 * 60 * 60), // 24 hours
            'path' => '/',
            'secure' => isset($_SERVER['HTTPS']),
            'httponly' => true,
            'samesite' => 'Strict'
        ]);
    }

    public static function clearAuthCookie() {
        setcookie('auth_token', '', [
            'expires' => time() - 3600,
            'path' => '/',
            'secure' => isset($_SERVER['HTTPS']),
            'httponly' => true,
            'samesite' => 'Strict'
        ]);
    }
}
?>
