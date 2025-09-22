# Deployment Guide

This guide covers various deployment scenarios for the AutoBlog platform.

## 🚀 Quick Deploy Options

### Option 1: Vercel (Recommended for Frontend)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/autoblog)

### Option 2: Traditional Server
Suitable for full-stack deployment with PHP backend.

### Option 3: Docker Deployment
Containerized deployment for consistent environments.

## 📋 Pre-Deployment Checklist

- [ ] Node.js 18+ installed
- [ ] PHP 8.0+ installed (for backend)
- [ ] MySQL 8.0+ database ready
- [ ] Domain name configured
- [ ] SSL certificate obtained
- [ ] Environment variables prepared
- [ ] Database migrations ready
- [ ] File upload directories created

## 🔧 Environment Configuration

### Production Environment Variables
\`\`\`env
# Application
NODE_ENV=production
APP_URL=https://yourdomain.com
APP_ENV=production

# Database
DB_HOST=your-db-host
DB_NAME=autoblog_prod
DB_USER=autoblog_user
DB_PASSWORD=your-secure-password
DB_PORT=3306

# Security
JWT_SECRET=your-super-secure-jwt-secret-minimum-32-characters
SESSION_SECRET=your-session-secret-minimum-32-characters
BCRYPT_ROUNDS=12

# File Upload
UPLOAD_PATH=/var/www/uploads/
MAX_FILE_SIZE=5242880
ALLOWED_EXTENSIONS=jpg,jpeg,png,gif,webp
MAX_FILES_PER_POST=5

# Email (if implementing notifications)
SMTP_HOST=smtp.yourdomain.com
SMTP_PORT=587
SMTP_USER=noreply@yourdomain.com
SMTP_PASS=your-email-password

# Analytics
VERCEL_ANALYTICS_ID=your-analytics-id
\`\`\`

## 🌐 Vercel Deployment

### Step 1: Prepare Repository
\`\`\`bash
# Ensure your code is in a Git repository
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/autoblog.git
git push -u origin main
\`\`\`

### Step 2: Deploy to Vercel
\`\`\`bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
\`\`\`

### Step 3: Configure Environment Variables
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add all production environment variables
3. Redeploy to apply changes

### Step 4: Custom Domain
1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add your custom domain
3. Configure DNS records as instructed

### Vercel Configuration
\`\`\`json
// vercel.json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "routes": [
    {
      "src": "/backend/(.*)",
      "dest": "/api/$1"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  },
  "functions": {
    "app/api/**/*.php": {
      "runtime": "vercel-php@0.6.0"
    }
  }
}
\`\`\`

## 🖥️ Traditional Server Deployment

### Step 1: Server Setup (Ubuntu 20.04+)
\`\`\`bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PHP and extensions
sudo apt install php8.1 php8.1-fpm php8.1-mysql php8.1-curl php8.1-gd php8.1-mbstring php8.1-xml -y

# Install MySQL
sudo apt install mysql-server -y

# Install Nginx
sudo apt install nginx -y

# Install Certbot for SSL
sudo apt install certbot python3-certbot-nginx -y
\`\`\`

### Step 2: Database Setup
\`\`\`bash
# Secure MySQL installation
sudo mysql_secure_installation

# Create database and user
sudo mysql -u root -p
\`\`\`

\`\`\`sql
CREATE DATABASE autoblog_prod CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'autoblog_user'@'localhost' IDENTIFIED BY 'your-secure-password';
GRANT ALL PRIVILEGES ON autoblog_prod.* TO 'autoblog_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
\`\`\`

### Step 3: Application Deployment
\`\`\`bash
# Clone repository
cd /var/www/
sudo git clone https://github.com/yourusername/autoblog.git
cd autoblog

# Install dependencies
sudo npm install

# Build application
sudo npm run build

# Set permissions
sudo chown -R www-data:www-data /var/www/autoblog
sudo chmod -R 755 /var/www/autoblog

# Create upload directories
sudo mkdir -p /var/www/autoblog/public/uploads/{posts,avatars}
sudo chown -R www-data:www-data /var/www/autoblog/public/uploads
sudo chmod -R 755 /var/www/autoblog/public/uploads
\`\`\`

### Step 4: Nginx Configuration
\`\`\`bash
sudo nano /etc/nginx/sites-available/autoblog
\`\`\`

\`\`\`nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;
    
    root /var/www/autoblog/out;  # For static export
    index index.html;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # API routes to PHP
    location /backend/ {
        root /var/www/autoblog;
        try_files $uri $uri/ /backend/index.php?$query_string;
        
        location ~ \.php$ {
            fastcgi_pass unix:/var/run/php/php8.1-fpm.sock;
            fastcgi_index index.php;
            fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
            include fastcgi_params;
            fastcgi_param PHP_VALUE "upload_max_filesize=5M \n post_max_size=25M";
        }
    }
    
    # Handle Next.js routes
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Rate limiting
    limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;
    limit_req_zone $binary_remote_addr zone=api:10m rate=100r/m;
    
    location /backend/api/auth.php {
        limit_req zone=login burst=3 nodelay;
        root /var/www/autoblog;
        try_files $uri /backend/api/auth.php;
        
        location ~ \.php$ {
            fastcgi_pass unix:/var/run/php/php8.1-fpm.sock;
            fastcgi_index index.php;
            fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
            include fastcgi_params;
        }
    }
    
    location /backend/api/ {
        limit_req zone=api burst=20 nodelay;
        root /var/www/autoblog;
        try_files $uri $uri/ /backend/index.php?$query_string;
        
        location ~ \.php$ {
            fastcgi_pass unix:/var/run/php/php8.1-fpm.sock;
            fastcgi_index index.php;
            fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
            include fastcgi_params;
        }
    }
}
\`\`\`

### Step 5: Enable Site and SSL
\`\`\`bash
# Enable site
sudo ln -s /etc/nginx/sites-available/autoblog /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Test SSL renewal
sudo certbot renew --dry-run
\`\`\`

### Step 6: Database Migration
\`\`\`bash
cd /var/www/autoblog
mysql -u autoblog_user -p autoblog_prod < backend/migrations/001_initial_schema.sql
mysql -u autoblog_user -p autoblog_prod < backend/migrations/002_add_instagram_features.sql
\`\`\`

## 🐳 Docker Deployment

### Dockerfile
\`\`\`dockerfile
# Multi-stage build
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

# Production image
FROM node:18-alpine AS runner

WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/out ./out
COPY --from=builder /app/public ./public
COPY --from=builder /app/backend ./backend

# Set permissions
RUN chown -R nextjs:nodejs /app
USER nextjs

EXPOSE 3000

CMD ["npx", "serve", "out", "-p", "3000"]
\`\`\`

### Docker Compose
\`\`\`yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DB_HOST=db
      - DB_NAME=autoblog
      - DB_USER=autoblog_user
      - DB_PASSWORD=secure_password
    depends_on:
      - db
    volumes:
      - uploads:/app/public/uploads
    restart: unless-stopped

  db:
    image: mysql:8.0
    environment:
      - MYSQL_ROOT_PASSWORD=root_password
      - MYSQL_DATABASE=autoblog
      - MYSQL_USER=autoblog_user
      - MYSQL_PASSWORD=secure_password
    volumes:
      - db_data:/var/lib/mysql
      - ./backend/migrations:/docker-entrypoint-initdb.d
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
      - uploads:/var/www/uploads
    depends_on:
      - app
    restart: unless-stopped

volumes:
  db_data:
  uploads:
\`\`\`

### Deploy with Docker
\`\`\`bash
# Build and start services
docker-compose up -d

# View logs
docker-compose logs -f

# Scale application
docker-compose up -d --scale app=3
\`\`\`

## 🔄 CI/CD Pipeline

### GitHub Actions
\`\`\`yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test
      - run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to server
        uses: appleboy/ssh-action@v0.1.5
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /var/www/autoblog
            git pull origin main
            npm ci
            npm run build
            sudo systemctl reload nginx
\`\`\`

## 📊 Monitoring Setup

### Health Check Endpoint
\`\`\`javascript
// pages/api/health.js
export default function handler(req, res) {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version
  });
}
\`\`\`

### Monitoring Script
\`\`\`bash
#!/bin/bash
# monitor.sh

# Check application health
curl -f http://localhost:3000/api/health || exit 1

# Check database connection
mysql -u autoblog_user -p$DB_PASSWORD -e "SELECT 1" autoblog_prod || exit 1

# Check disk space
df -h | grep -E "9[0-9]%|100%" && exit 1

echo "All checks passed"
\`\`\`

## 🚨 Rollback Procedure

### Quick Rollback
\`\`\`bash
# Rollback to previous version
cd /var/www/autoblog
git log --oneline -10  # Find previous commit
git checkout <previous-commit-hash>
npm run build
sudo systemctl reload nginx
\`\`\`

### Database Rollback
\`\`\`bash
# Restore database backup
mysql -u root -p autoblog_prod < backup_YYYYMMDD_HHMMSS.sql
\`\`\`

## 📞 Post-Deployment Verification

### Checklist
- [ ] Application loads correctly
- [ ] User registration works
- [ ] Login functionality works
- [ ] Post creation works
- [ ] Image upload works
- [ ] Comments system works
- [ ] Like functionality works
- [ ] Mobile responsiveness verified
- [ ] SSL certificate valid
- [ ] Performance metrics acceptable
- [ ] Error monitoring active

### Performance Testing
\`\`\`bash
# Load testing with Apache Bench
ab -n 1000 -c 10 https://yourdomain.com/

# Check Core Web Vitals
npx lighthouse https://yourdomain.com --view
\`\`\`

This comprehensive deployment guide covers all major deployment scenarios and includes security best practices, monitoring setup, and maintenance procedures for the AutoBlog platform.
