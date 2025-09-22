<?php
require_once '../config/database.php';

class Attachment {
    private $conn;
    private $table_name = "attachments";
    private $upload_dir = "../uploads/";
    private $thumb_dir = "../uploads/thumbs/";
    
    public function __construct($db) {
        $this->conn = $db;
        
        // Create upload directories if they don't exist
        if (!file_exists($this->upload_dir)) {
            mkdir($this->upload_dir, 0755, true);
        }
        if (!file_exists($this->thumb_dir)) {
            mkdir($this->thumb_dir, 0755, true);
        }
    }
    
    private function isGDEnabled() {
        return extension_loaded('gd') && function_exists('imagecreatefromjpeg');
    }
    
    // Upload and process multiple images for a post
    public function uploadPostImages($post_id, $files) {
        $uploaded_files = [];
        $max_files = 5; // Instagram-like limit
        
        if (count($files['name']) > $max_files) {
            throw new Exception("Máximo de {$max_files} imagens por post");
        }
        
        for ($i = 0; $i < count($files['name']); $i++) {
            if ($files['error'][$i] === UPLOAD_ERR_OK) {
                $file_info = [
                    'name' => $files['name'][$i],
                    'tmp_name' => $files['tmp_name'][$i],
                    'size' => $files['size'][$i],
                    'type' => $files['type'][$i]
                ];
                
                $uploaded_file = $this->processUpload($post_id, $file_info, $i);
                if ($uploaded_file) {
                    $uploaded_files[] = $uploaded_file;
                }
            }
        }
        
        return $uploaded_files;
    }
    
    // Process individual file upload
    private function processUpload($post_id, $file, $order = 0) {
        // Validate file
        $validation = $this->validateFile($file);
        if (!$validation['valid']) {
            throw new Exception($validation['error']);
        }
        
        // Generate unique filename
        $file_extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        $unique_name = uniqid('img_') . '_' . time() . '.' . $file_extension;
        $file_path = $this->upload_dir . $unique_name;
        $thumb_path = $this->thumb_dir . 'thumb_' . $unique_name;
        
        // Move uploaded file
        if (!move_uploaded_file($file['tmp_name'], $file_path)) {
            throw new Exception("Erro ao salvar arquivo");
        }
        
        if ($this->isGDEnabled()) {
            $this->createThumbnail($file_path, $thumb_path, 300, 300);
        } else {
            // Fallback: copy original file as thumbnail
            copy($file_path, $thumb_path);
        }
        
        // Save to database
        $attachment_data = [
            'post_id' => $post_id,
            'filename' => $unique_name,
            'original_name' => $file['name'],
            'file_path' => 'uploads/' . $unique_name,
            'thumb_path' => 'uploads/thumbs/thumb_' . $unique_name,
            'file_size' => $file['size'],
            'mime_type' => $file['type'],
            'ordem' => $order
        ];
        
        $attachment_id = $this->saveAttachment($attachment_data);
        
        if ($attachment_id) {
            $attachment_data['id'] = $attachment_id;
            return $attachment_data;
        }
        
        return false;
    }
    
    // Validate uploaded file
    private function validateFile($file) {
        $max_size = 5 * 1024 * 1024; // 5MB
        $allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        $allowed_extensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
        
        // Check file size
        if ($file['size'] > $max_size) {
            return ['valid' => false, 'error' => 'Arquivo muito grande. Máximo 5MB'];
        }
        
        // Check MIME type
        if (!in_array($file['type'], $allowed_types)) {
            return ['valid' => false, 'error' => 'Tipo de arquivo não permitido'];
        }
        
        // Check file extension
        $file_extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        if (!in_array($file_extension, $allowed_extensions)) {
            return ['valid' => false, 'error' => 'Extensão de arquivo não permitida'];
        }
        
        if (function_exists('getimagesize')) {
            $image_info = getimagesize($file['tmp_name']);
            if ($image_info === false) {
                return ['valid' => false, 'error' => 'Arquivo não é uma imagem válida'];
            }
        }
        
        return ['valid' => true];
    }
    
    private function createThumbnail($source_path, $thumb_path, $max_width, $max_height) {
        // Check if GD extension is available
        if (!$this->isGDEnabled()) {
            // Fallback: copy original file
            return copy($source_path, $thumb_path);
        }
        
        $image_info = getimagesize($source_path);
        if (!$image_info) return false;
        
        $mime_type = $image_info['mime'];
        $original_width = $image_info[0];
        $original_height = $image_info[1];
        
        // Calculate new dimensions
        $ratio = min($max_width / $original_width, $max_height / $original_height);
        $new_width = round($original_width * $ratio);
        $new_height = round($original_height * $ratio);
        
        // Create image resource based on type
        switch ($mime_type) {
            case 'image/jpeg':
                $source_image = imagecreatefromjpeg($source_path);
                break;
            case 'image/png':
                $source_image = imagecreatefrompng($source_path);
                break;
            case 'image/gif':
                $source_image = imagecreatefromgif($source_path);
                break;
            case 'image/webp':
                if (function_exists('imagecreatefromwebp')) {
                    $source_image = imagecreatefromwebp($source_path);
                } else {
                    return copy($source_path, $thumb_path);
                }
                break;
            default:
                return false;
        }
        
        if (!$source_image) return false;
        
        // Create thumbnail
        $thumb_image = imagecreatetruecolor($new_width, $new_height);
        
        // Preserve transparency for PNG and GIF
        if ($mime_type == 'image/png' || $mime_type == 'image/gif') {
            imagealphablending($thumb_image, false);
            imagesavealpha($thumb_image, true);
            $transparent = imagecolorallocatealpha($thumb_image, 255, 255, 255, 127);
            imagefilledrectangle($thumb_image, 0, 0, $new_width, $new_height, $transparent);
        }
        
        // Resize image
        imagecopyresampled($thumb_image, $source_image, 0, 0, 0, 0, $new_width, $new_height, $original_width, $original_height);
        
        // Save thumbnail
        $result = false;
        switch ($mime_type) {
            case 'image/jpeg':
                $result = imagejpeg($thumb_image, $thumb_path, 85);
                break;
            case 'image/png':
                $result = imagepng($thumb_image, $thumb_path, 8);
                break;
            case 'image/gif':
                $result = imagegif($thumb_image, $thumb_path);
                break;
            case 'image/webp':
                if (function_exists('imagewebp')) {
                    $result = imagewebp($thumb_image, $thumb_path, 85);
                } else {
                    $result = copy($source_path, $thumb_path);
                }
                break;
        }
        
        // Clean up memory
        imagedestroy($source_image);
        imagedestroy($thumb_image);
        
        return $result;
    }
    
    // Save attachment to database
    private function saveAttachment($data) {
        $query = "INSERT INTO " . $this->table_name . " 
                  (post_id, filename, original_name, file_path, thumb_path, file_size, mime_type, ordem) 
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        
        $stmt = $this->conn->prepare($query);
        $result = $stmt->execute([
            $data['post_id'],
            $data['filename'],
            $data['original_name'],
            $data['file_path'],
            $data['thumb_path'],
            $data['file_size'],
            $data['mime_type'],
            $data['ordem']
        ]);
        
        return $result ? $this->conn->lastInsertId() : false;
    }
    
    // Get attachments for a post
    public function getPostAttachments($post_id) {
        $query = "SELECT * FROM " . $this->table_name . " WHERE post_id = ? ORDER BY ordem ASC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute([$post_id]);
        return $stmt->fetchAll();
    }
    
    // Delete attachment
    public function deleteAttachment($attachment_id, $user_id = null) {
        // Get attachment info first
        $query = "SELECT a.*, p.user_id FROM " . $this->table_name . " a 
                  LEFT JOIN post p ON a.post_id = p.id 
                  WHERE a.id = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->execute([$attachment_id]);
        $attachment = $stmt->fetch();
        
        if (!$attachment) {
            return false;
        }
        
        // Check if user owns the post (if user_id provided)
        if ($user_id && $attachment['user_id'] != $user_id) {
            return false;
        }
        
        // Delete files
        if (file_exists('../' . $attachment['file_path'])) {
            unlink('../' . $attachment['file_path']);
        }
        if (file_exists('../' . $attachment['thumb_path'])) {
            unlink('../' . $attachment['thumb_path']);
        }
        
        // Delete from database
        $query = "DELETE FROM " . $this->table_name . " WHERE id = ?";
        $stmt = $this->conn->prepare($query);
        return $stmt->execute([$attachment_id]);
    }
    
    // Delete all attachments for a post
    public function deletePostAttachments($post_id) {
        $attachments = $this->getPostAttachments($post_id);
        
        foreach ($attachments as $attachment) {
            $this->deleteAttachment($attachment['id']);
        }
        
        return true;
    }
    
    public function uploadAvatar($user_id, $file) {
        // Validate file
        $validation = $this->validateFile($file);
        if (!$validation['valid']) {
            throw new Exception($validation['error']);
        }
        
        // Generate unique filename for avatar
        $file_extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        $unique_name = 'avatar_' . $user_id . '_' . time() . '.' . $file_extension;
        $file_path = $this->upload_dir . $unique_name;
        $thumb_path = $this->thumb_dir . 'thumb_' . $unique_name;
        
        // Delete old avatar if exists
        $this->deleteOldAvatar($user_id);
        
        // Move uploaded file
        if (!move_uploaded_file($file['tmp_name'], $file_path)) {
            throw new Exception("Erro ao salvar arquivo de avatar");
        }
        
        // Create thumbnail for avatar
        if ($this->isGDEnabled()) {
            $this->createThumbnail($file_path, $thumb_path, 150, 150);
        } else {
            copy($file_path, $thumb_path);
        }
        
        return [
            'filename' => $unique_name,
            'file_path' => 'uploads/' . $unique_name,
            'thumb_path' => 'uploads/thumbs/thumb_' . $unique_name,
            'file_size' => $file['size'],
            'mime_type' => $file['type']
        ];
    }
    
    private function deleteOldAvatar($user_id) {
        // Get current user avatar
        $query = "SELECT avatar_url FROM user WHERE id = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->execute([$user_id]);
        $user = $stmt->fetch();
        
        if ($user && $user['avatar_url']) {
            $old_file_path = '../' . $user['avatar_url'];
            $old_thumb_path = str_replace('uploads/', 'uploads/thumbs/thumb_', $old_file_path);
            
            // Delete old files if they exist
            if (file_exists($old_file_path)) {
                unlink($old_file_path);
            }
            if (file_exists($old_thumb_path)) {
                unlink($old_thumb_path);
            }
        }
    }
}
?>
