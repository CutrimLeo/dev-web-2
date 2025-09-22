# AutoBlog - Instagram-Style Social Media Platform

A modern, responsive social media platform built with Next.js, featuring Instagram-like UI/UX, real-time interactions, and comprehensive user management.

## 🚀 Features

- **Instagram-Style Feed**: Modern, responsive design with infinite scroll
- **User Authentication**: Secure login/registration system
- **Post Creation**: Multi-image upload with drag-and-drop support
- **Real-time Comments**: Interactive commenting system with live updates
- **Like System**: Heart animations and real-time like counts
- **Responsive Design**: Mobile-first approach with bottom navigation
- **Image Management**: Optimized image handling and preview system
- **Search Functionality**: Real-time post search capabilities
- **Profile Management**: User profiles with post grids
- **Modern Animations**: Smooth transitions and micro-interactions

## 🛠 Tech Stack

### Frontend
- **Next.js 14+** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS v4** - Modern utility-first CSS framework
- **jQuery** - DOM manipulation and AJAX requests
- **Font Awesome** - Icon library
- **Google Fonts** - Space Grotesk & DM Sans typography

### Backend
- **PHP 8+** - Server-side logic
- **MySQL 8+** - Database management
- **Apache/Nginx** - Web server

### Infrastructure
- **Vercel** - Deployment platform (recommended)
- **Vercel Analytics** - Performance monitoring
- **Environment Variables** - Configuration management

## 📋 Prerequisites

- Node.js 18+ and npm/yarn
- PHP 8.0+
- MySQL 8.0+
- Apache or Nginx web server
- Git for version control

## 🔧 Installation

### 1. Clone the Repository
\`\`\`bash
git clone <repository-url>
cd autoblog
\`\`\`

### 2. Install Dependencies
\`\`\`bash
npm install
# or
yarn install
\`\`\`

### 3. Database Setup
\`\`\`sql
-- Create database
CREATE DATABASE autoblog_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create user (optional)
CREATE USER 'autoblog_user'@'localhost' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON autoblog_db.* TO 'autoblog_user'@'localhost';
FLUSH PRIVILEGES;
\`\`\`

### 4. Run Database Migrations
Execute the SQL scripts in order:
\`\`\`bash
# Navigate to backend/migrations/
mysql -u root -p autoblog_db < 001_initial_schema.sql
mysql -u root -p autoblog_db < 002_add_instagram_features.sql
\`\`\`

### 5. Configure Environment Variables
Create `.env.local` file:
\`\`\`env
# Database Configuration
DB_HOST=localhost
DB_NAME=autoblog_db
DB_USER=autoblog_user
DB_PASSWORD=secure_password

# Application Settings
APP_ENV=development
APP_URL=http://localhost:3000
UPLOAD_PATH=/uploads/
MAX_FILE_SIZE=5242880

# Security
JWT_SECRET=your-super-secure-jwt-secret-key-here
SESSION_SECRET=your-session-secret-key-here
BCRYPT_ROUNDS=12

# File Upload
ALLOWED_EXTENSIONS=jpg,jpeg,png,gif,webp
MAX_FILES_PER_POST=5
\`\`\`

### 6. Set Up File Permissions
\`\`\`bash
# Create upload directories
mkdir -p public/uploads/posts
mkdir -p public/uploads/avatars

# Set permissions (Linux/Mac)
chmod 755 public/uploads/
chmod 755 public/uploads/posts/
chmod 755 public/uploads/avatars/

# For production, ensure web server can write to these directories
chown -R www-data:www-data public/uploads/ # Apache
# or
chown -R nginx:nginx public/uploads/ # Nginx
\`\`\`

### 7. Development Server
\`\`\`bash
npm run dev
# or
yarn dev
\`\`\`

Visit `http://localhost:3000` to see the application.

## 🚀 Deployment

### Vercel Deployment (Recommended)

1. **Connect Repository**
   \`\`\`bash
   npm i -g vercel
   vercel login
   vercel
   \`\`\`

2. **Configure Environment Variables**
   Add all environment variables in Vercel dashboard:
   - Go to Project Settings → Environment Variables
   - Add production values for all variables

3. **Database Setup**
   - Use a managed MySQL service (PlanetScale, AWS RDS, etc.)
   - Update connection strings in environment variables

4. **File Upload Configuration**
   - Configure Vercel Blob for file storage
   - Update upload handlers to use cloud storage

### Traditional Server Deployment

1. **Server Requirements**
   - Ubuntu 20.04+ or CentOS 8+
   - Node.js 18+, PHP 8+, MySQL 8+
   - Nginx or Apache
   - SSL certificate (Let's Encrypt recommended)

2. **Build Application**
   \`\`\`bash
   npm run build
   npm run export # if using static export
   \`\`\`

3. **Nginx Configuration**
   \`\`\`nginx
   server {
       listen 80;
       server_name yourdomain.com;
       return 301 https://$server_name$request_uri;
   }

   server {
       listen 443 ssl http2;
       server_name yourdomain.com;
       
       ssl_certificate /path/to/certificate.crt;
       ssl_certificate_key /path/to/private.key;
       
       root /var/www/autoblog;
       index index.html index.php;
       
       # Next.js static files
       location /_next/static/ {
           expires 1y;
           add_header Cache-Control "public, immutable";
       }
       
       # API routes to PHP
       location /backend/ {
           try_files $uri $uri/ /backend/index.php?$query_string;
           
           location ~ \.php$ {
               fastcgi_pass unix:/var/run/php/php8.1-fpm.sock;
               fastcgi_index index.php;
               fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
               include fastcgi_params;
           }
       }
       
       # Handle Next.js routes
       location / {
           try_files $uri $uri/ /index.html;
       }
       
       # Security headers
       add_header X-Frame-Options "SAMEORIGIN" always;
       add_header X-Content-Type-Options "nosniff" always;
       add_header X-XSS-Protection "1; mode=block" always;
       add_header Referrer-Policy "strict-origin-when-cross-origin" always;
   }
   \`\`\`

4. **Process Management**
   \`\`\`bash
   # Using PM2 for Node.js processes (if needed)
   npm install -g pm2
   pm2 start npm --name "autoblog" -- start
   pm2 startup
   pm2 save
   \`\`\`

## 🔒 Security Considerations

### Authentication & Authorization
- ✅ Password hashing with bcrypt (12 rounds minimum)
- ✅ JWT tokens for session management
- ✅ Input validation and sanitization
- ✅ SQL injection prevention with prepared statements
- ⚠️ **TODO**: Implement rate limiting for login attempts
- ⚠️ **TODO**: Add two-factor authentication (2FA)
- ⚠️ **TODO**: Implement password strength requirements

### File Upload Security
- ✅ File type validation (whitelist approach)
- ✅ File size limits (5MB per file)
- ✅ Secure file naming (prevent directory traversal)
- ⚠️ **TODO**: Virus scanning for uploaded files
- ⚠️ **TODO**: Image processing to strip EXIF data
- ⚠️ **TODO**: Content Security Policy (CSP) headers

### Database Security
- ✅ Prepared statements for all queries
- ✅ Database user with minimal privileges
- ✅ Connection encryption (SSL/TLS)
- ⚠️ **TODO**: Database backup encryption
- ⚠️ **TODO**: Query logging and monitoring

### Infrastructure Security
- ⚠️ **TODO**: HTTPS enforcement (SSL/TLS)
- ⚠️ **TODO**: Security headers implementation
- ⚠️ **TODO**: DDoS protection
- ⚠️ **TODO**: Regular security updates
- ⚠️ **TODO**: Firewall configuration

## 📊 Performance Optimization

### Frontend Optimization
- ✅ Image lazy loading
- ✅ Infinite scroll pagination
- ✅ CSS/JS minification
- ✅ Font optimization
- ⚠️ **TODO**: Service Worker for caching
- ⚠️ **TODO**: Image optimization (WebP conversion)
- ⚠️ **TODO**: Bundle splitting and code splitting

### Backend Optimization
- ✅ Database indexing on frequently queried columns
- ✅ Efficient SQL queries with JOINs
- ⚠️ **TODO**: Redis caching for sessions and frequent queries
- ⚠️ **TODO**: Database connection pooling
- ⚠️ **TODO**: API response caching

### Infrastructure Optimization
- ⚠️ **TODO**: CDN implementation for static assets
- ⚠️ **TODO**: Database read replicas
- ⚠️ **TODO**: Load balancing for high traffic
- ⚠️ **TODO**: Monitoring and alerting setup

## 🧪 Testing

### Frontend Testing
\`\`\`bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Accessibility testing
npm run test:a11y
\`\`\`

### Backend Testing
\`\`\`bash
# PHP unit tests
composer test

# API integration tests
npm run test:api
\`\`\`

## 📈 Monitoring & Analytics

### Performance Monitoring
- Vercel Analytics (built-in)
- Core Web Vitals tracking
- Error tracking and reporting

### User Analytics
- Page view tracking
- User engagement metrics
- Conversion funnel analysis

### System Monitoring
- Server resource usage
- Database performance
- API response times
- Error rates and logs

## 🔄 Maintenance

### Regular Tasks
- **Daily**: Monitor error logs and performance metrics
- **Weekly**: Database backup verification
- **Monthly**: Security updates and dependency updates
- **Quarterly**: Performance audit and optimization review

### Backup Strategy
\`\`\`bash
# Database backup
mysqldump -u root -p autoblog_db > backup_$(date +%Y%m%d_%H%M%S).sql

# File backup
tar -czf uploads_backup_$(date +%Y%m%d_%H%M%S).tar.gz public/uploads/
\`\`\`

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Check database credentials in `.env.local`
   - Verify MySQL service is running
   - Check firewall settings

2. **File Upload Issues**
   - Verify upload directory permissions
   - Check PHP upload limits in `php.ini`
   - Ensure disk space availability

3. **Performance Issues**
   - Enable database query logging
   - Check for missing database indexes
   - Monitor server resources

### Debug Mode
\`\`\`bash
# Enable debug mode
export NODE_ENV=development
export DEBUG=true

# Check logs
tail -f /var/log/nginx/error.log
tail -f /var/log/php8.1-fpm.log
\`\`\`

## 📞 Support

For technical support or questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review server logs for error details

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🔄 Changelog

### v1.0.0 (Current)
- Instagram-style UI implementation
- User authentication system
- Post creation with multi-image support
- Comments and likes functionality
- Responsive design with animations
- Database migrations and API endpoints

### Planned Features (v1.1.0)
- Real-time notifications
- Direct messaging system
- Story functionality
- Advanced search and filters
- Admin dashboard
- Mobile app (React Native)
