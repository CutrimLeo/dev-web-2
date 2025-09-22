<?php
// Load environment variables from .env file if it exists
if (file_exists(__DIR__ . '/../../.env')) {
    $lines = file(__DIR__ . '/../../.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) {
            continue;
        }
        
        list($name, $value) = explode('=', $line, 2);
        $name = trim($name);
        $value = trim($value);
        
        if (!array_key_exists($name, $_ENV)) {
            $_ENV[$name] = $value;
        }
    }
}

// Set default values if not provided
$defaults = [
    'DB_HOST' => 'localhost',
    'DB_NAME' => 'blogweb',
    'DB_USER' => 'root',
    'DB_PASS' => '',
    'JWT_SECRET' => 'your-secret-key-change-this',
    'UPLOAD_PATH' => __DIR__ . '/../../uploads/',
    'MAX_FILE_SIZE' => '5242880', // 5MB
    'ALLOWED_EXTENSIONS' => 'jpg,jpeg,png,gif,webp'
];

foreach ($defaults as $key => $value) {
    if (!isset($_ENV[$key])) {
        $_ENV[$key] = $value;
    }
}
?>
