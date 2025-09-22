<?php
// Performance optimization configurations

class PerformanceConfig {
    // Cache settings
    const CACHE_ENABLED = true;
    const CACHE_TTL = 300; // 5 minutes
    const CACHE_PREFIX = 'blogweb_';
    
    // Database optimization
    const DB_PERSISTENT_CONNECTIONS = true;
    const DB_QUERY_CACHE = true;
    const DB_SLOW_QUERY_LOG = true;
    
    // Image optimization
    const IMAGE_MAX_WIDTH = 1920;
    const IMAGE_MAX_HEIGHT = 1080;
    const IMAGE_QUALITY = 85;
    const THUMBNAIL_SIZE = 300;
    
    // API rate limiting
    const RATE_LIMIT_ENABLED = true;
    const RATE_LIMIT_REQUESTS = 100; // per minute
    const RATE_LIMIT_WINDOW = 60; // seconds
    
    // Content limits
    const MAX_POST_LENGTH = 5000;
    const MAX_COMMENT_LENGTH = 1000;
    const MAX_IMAGES_PER_POST = 5;
    const MAX_FILE_SIZE = 5242880; // 5MB
    
    public static function getImageConfig() {
        return [
            'max_width' => self::IMAGE_MAX_WIDTH,
            'max_height' => self::IMAGE_MAX_HEIGHT,
            'quality' => self::IMAGE_QUALITY,
            'thumbnail_size' => self::THUMBNAIL_SIZE
        ];
    }
    
    public static function getRateLimitConfig() {
        return [
            'enabled' => self::RATE_LIMIT_ENABLED,
            'requests' => self::RATE_LIMIT_REQUESTS,
            'window' => self::RATE_LIMIT_WINDOW
        ];
    }
}

// Simple cache implementation
class SimpleCache {
    private static $cache = [];
    
    public static function get($key) {
        $key = PerformanceConfig::CACHE_PREFIX . $key;
        
        if (isset(self::$cache[$key])) {
            $item = self::$cache[$key];
            if ($item['expires'] > time()) {
                return $item['data'];
            } else {
                unset(self::$cache[$key]);
            }
        }
        
        return null;
    }
    
    public static function set($key, $data, $ttl = null) {
        if (!PerformanceConfig::CACHE_ENABLED) return false;
        
        $key = PerformanceConfig::CACHE_PREFIX . $key;
        $ttl = $ttl ?? PerformanceConfig::CACHE_TTL;
        
        self::$cache[$key] = [
            'data' => $data,
            'expires' => time() + $ttl
        ];
        
        return true;
    }
    
    public static function delete($key) {
        $key = PerformanceConfig::CACHE_PREFIX . $key;
        unset(self::$cache[$key]);
    }
    
    public static function clear() {
        self::$cache = [];
    }
}

// Rate limiting
class RateLimit {
    private static $requests = [];
    
    public static function check($identifier, $limit = null, $window = null) {
        if (!PerformanceConfig::RATE_LIMIT_ENABLED) return true;
        
        $limit = $limit ?? PerformanceConfig::RATE_LIMIT_REQUESTS;
        $window = $window ?? PerformanceConfig::RATE_LIMIT_WINDOW;
        
        $now = time();
        $key = md5($identifier);
        
        // Clean old requests
        if (isset(self::$requests[$key])) {
            self::$requests[$key] = array_filter(
                self::$requests[$key], 
                function($timestamp) use ($now, $window) {
                    return ($now - $timestamp) < $window;
                }
            );
        } else {
            self::$requests[$key] = [];
        }
        
        // Check limit
        if (count(self::$requests[$key]) >= $limit) {
            return false;
        }
        
        // Add current request
        self::$requests[$key][] = $now;
        return true;
    }
    
    public static function getRemainingRequests($identifier, $limit = null, $window = null) {
        if (!PerformanceConfig::RATE_LIMIT_ENABLED) return $limit ?? PerformanceConfig::RATE_LIMIT_REQUESTS;
        
        $limit = $limit ?? PerformanceConfig::RATE_LIMIT_REQUESTS;
        $window = $window ?? PerformanceConfig::RATE_LIMIT_WINDOW;
        
        $now = time();
        $key = md5($identifier);
        
        if (!isset(self::$requests[$key])) {
            return $limit;
        }
        
        // Clean old requests
        self::$requests[$key] = array_filter(
            self::$requests[$key], 
            function($timestamp) use ($now, $window) {
                return ($now - $timestamp) < $window;
            }
        );
        
        return max(0, $limit - count(self::$requests[$key]));
    }
}
?>
