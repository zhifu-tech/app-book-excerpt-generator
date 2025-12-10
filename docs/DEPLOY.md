# 部署指南

## 服务器信息

- **服务器地址**: 8.138.183.116
- **部署目录**: `/var/www/html/book-excerpt-generator` (Nginx 默认)
- **访问地址**: `http://8.138.183.116` 或 `https://8.138.183.116`

## 统一管理脚本

项目使用 `book-excerpt.sh` 统一管理所有部署和管理操作，所有功能都整合在一个脚本中。

### 脚本位置

```bash
scripts/book-excerpt.sh
```

### 使用方法

```bash
cd source/apps/book-excerpt-generator/scripts
chmod +x book-excerpt.sh
./book-excerpt.sh [command] [options]
```

### 可用命令

| 命令           | 说明                                     | 示例                                  |
| -------------- | ---------------------------------------- | ------------------------------------- |
| `deploy`       | 部署前端应用到服务器                     | `./book-excerpt.sh deploy`            |
| `update-nginx` | 更新 Nginx 配置文件（包含 SSL 证书上传） | `./book-excerpt.sh update-nginx`      |
| `start-nginx`  | 启动 Nginx 服务                          | `./book-excerpt.sh start-nginx`       |
| `fix-port`     | 修复端口占用问题                         | `./book-excerpt.sh fix-port [端口号]` |
| `check`        | 检查部署状态和配置                       | `./book-excerpt.sh check`             |
| `help`         | 显示帮助信息                             | `./book-excerpt.sh help`              |

### 脚本特性

- **自动 SSH 连接检测**：自动检测并使用 SSH 密钥或别名
- **配置集中管理**：所有配置都在脚本内部，无需修改外部文件
- **SSL 证书自动上传**：更新 Nginx 配置时自动上传证书文件
- **配置备份**：更新配置前自动备份
- **错误处理**：完善的错误检查和提示

## 快速部署

### 方法 1: 使用统一管理脚本（推荐）

```bash
cd source/apps/book-excerpt-generator/scripts
./book-excerpt.sh deploy
```

脚本会自动：

- 检查本地文件
- 创建临时部署目录
- 上传文件到服务器
- 设置文件权限
- 验证部署结果

### 方法 2: 手动部署

#### 1. 连接到服务器

```bash
ssh root@8.138.183.116
```

#### 2. 创建部署目录

```bash
mkdir -p /var/www/html/book-excerpt-generator
cd /var/www/html/book-excerpt-generator
```

#### 3. 上传文件

从本地机器执行：

```bash
cd source/apps/book-excerpt-generator

# 上传核心文件
scp index.html style.css root@8.138.183.116:/var/www/html/book-excerpt-generator/

# 上传 JavaScript 目录
scp -r js/ root@8.138.183.116:/var/www/html/book-excerpt-generator/

# 上传截图目录（可选）
scp -r screenshots/ root@8.138.183.116:/var/www/html/book-excerpt-generator/
```

或者使用 rsync（更高效）：

```bash
rsync -avz --exclude 'node_modules' --exclude '.git' --exclude 'docs' \
  source/apps/book-excerpt-generator/ \
  root@8.138.183.116:/var/www/html/book-excerpt-generator/
```

#### 4. 设置文件权限

```bash
ssh root@8.138.183.116

cd /var/www/html/book-excerpt-generator
chmod -R 755 .
chown -R nginx:nginx .  # 或 www-data:www-data (Ubuntu/Debian)
```

## 配置 Web 服务器

### Nginx 配置

#### 使用统一脚本更新配置（推荐）

```bash
cd source/apps/book-excerpt-generator/scripts
./book-excerpt.sh update-nginx
```

脚本会自动：

- 将 `scripts/nginx.conf` 上传到服务器
- 上传 SSL 证书文件（如果存在）
- 备份现有配置
- 测试配置语法
- 重新加载 Nginx

**检查配置和状态:**

```bash
cd source/apps/book-excerpt-generator/scripts
./book-excerpt.sh check
```

脚本会检查：

- 部署目录和文件
- Nginx 配置结构
- 服务状态
- 端口监听情况

**重要说明:**

Nginx 的配置文件结构：

- `/etc/nginx/nginx.conf` - 主配置文件
- `/etc/nginx/conf.d/*.conf` - 包含的配置文件目录

我们的配置文件 `/etc/nginx/conf.d/book-excerpt-generator.conf` 只有在主配置文件中包含以下行时才会生效：

```nginx
http {
    # ... 其他配置 ...
    include /etc/nginx/conf.d/*.conf;
}
```

大多数 Nginx 安装默认已包含此配置。如果未包含，需要手动添加。

**脚本文件结构:**

```
scripts/
├── book-excerpt.sh          # 统一管理脚本（包含所有功能）
├── nginx.conf               # Nginx 配置文件
└── book-excerpt.zhifu.tech_nginx/  # SSL 证书目录
    ├── book-excerpt.zhifu.tech_bundle.crt
    ├── book-excerpt.zhifu.tech_bundle.pem
    └── book-excerpt.zhifu.tech.key
```

**Nginx 配置文件说明:**

`scripts/nginx.conf` 包含：

- HTTP 配置（监听 80 端口）
- HTTPS 配置（监听 443 端口，需要 SSL 证书）
- 静态资源缓存配置
- Gzip 压缩配置
- 安全头配置

**注意**: HTTP 和 HTTPS 同时可用，不会自动重定向。如需重定向，可以修改配置。

重新加载 Nginx:

```bash
nginx -t  # 检查配置
systemctl reload nginx  # 或 service nginx reload
```

### 启动 Nginx

如果 Nginx 未运行，可以使用统一脚本启动：

```bash
cd source/apps/book-excerpt-generator/scripts
./book-excerpt.sh start-nginx
```

脚本会自动：

- 检查 Nginx 是否安装
- 验证配置语法
- 检查端口占用情况
- 启动 Nginx 服务
- 设置开机自启

### 修复端口占用问题

如果 Nginx 启动失败，提示端口被占用：

```bash
cd source/apps/book-excerpt-generator/scripts
./book-excerpt.sh fix-port [端口号]
```

默认检查 80 和 443 端口。脚本会：

- 检查端口占用情况
- 显示占用进程信息
- 提供解决方案
- 支持交互式修复

### Apache 配置

如果需要使用 Apache，创建配置文件 `/etc/apache2/sites-available/book-excerpt-generator.conf`:

```apache
<VirtualHost *:80>
    ServerName book-excerpt.your-domain.com
    DocumentRoot /var/www/html/book-excerpt-generator

    <Directory /var/www/html/book-excerpt-generator>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    # 静态资源缓存
    <IfModule mod_expires.c>
        ExpiresActive On
        ExpiresByType image/jpg "access plus 1 year"
        ExpiresByType image/jpeg "access plus 1 year"
        ExpiresByType image/gif "access plus 1 year"
        ExpiresByType image/png "access plus 1 year"
        ExpiresByType text/css "access plus 1 year"
        ExpiresByType application/javascript "access plus 1 year"
    </IfModule>
</VirtualHost>
```

启用站点:

```bash
a2ensite book-excerpt-generator
systemctl reload apache2
```

## 验证部署

### 检查文件

```bash
ssh root@8.138.183.116
cd /var/www/html/book-excerpt-generator

# 检查关键文件
ls -lah index.html style.css js/

# 检查文件权限
ls -la
```

### 测试访问

```bash
# 本地测试
curl http://localhost/

# 远程测试 HTTP
curl http://8.138.183.116/

# 远程测试 HTTPS
curl https://8.138.183.116/
```

### 使用检查脚本

```bash
cd source/apps/book-excerpt-generator/scripts
./book-excerpt.sh check
```

## 配置 HTTPS（可选）

### 使用 Let's Encrypt

```bash
# 安装 Certbot
yum install certbot python3-certbot-nginx  # CentOS/RHEL
# 或
apt-get install certbot python3-certbot-nginx  # Ubuntu/Debian

# 获取证书
certbot --nginx -d book-excerpt.your-domain.com

# 自动续期
certbot renew --dry-run
```

### 手动配置 SSL

在 Nginx 配置中添加：

```nginx
server {
    listen 443 ssl http2;
    server_name book-excerpt.your-domain.com;

    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;

    # SSL 配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    root /var/www/html/book-excerpt-generator;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}

# HTTP 重定向到 HTTPS（可选，当前配置中 HTTP 和 HTTPS 同时可用）
server {
    listen 80;
    server_name book-excerpt.your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

## 故障排查

### 检查 Web 服务器状态

```bash
# Nginx
systemctl status nginx
nginx -t

# Apache
systemctl status apache2  # 或 httpd
apache2ctl configtest
```

### 检查文件权限

```bash
cd /var/www/html/book-excerpt-generator
ls -la

# 如果权限不正确
chmod -R 755 .
chown -R nginx:nginx .  # 或 www-data:www-data
```

### 检查日志

```bash
# Nginx 错误日志
tail -f /var/log/nginx/error.log

# Apache 错误日志
tail -f /var/log/apache2/error.log  # 或 /var/log/httpd/error_log
```

### 常见问题

#### 1. 403 Forbidden

- 检查文件权限
- 检查目录权限
- 检查 SELinux 状态（如果启用）

```bash
# 检查 SELinux
getenforce
# 如果启用，可能需要设置上下文
chcon -R -t httpd_sys_content_t /var/www/html/book-excerpt-generator
```

#### 2. 404 Not Found

- 检查文件是否存在
- 检查 Nginx/Apache 配置
- 检查 `root` 路径是否正确

#### 3. JavaScript 文件加载失败

- 检查文件路径
- 检查 MIME 类型配置
- 检查浏览器控制台错误

#### 4. CORS 错误

如果前端需要访问后端 API，确保后端服务器配置了正确的 CORS 头。

## 更新部署

### 使用统一管理脚本

```bash
cd source/apps/book-excerpt-generator/scripts
./book-excerpt.sh deploy
```

### 手动更新

```bash
# 备份当前版本
ssh root@8.138.183.116
cd /var/www/html
cp -r book-excerpt-generator book-excerpt-generator.backup.$(date +%Y%m%d)

# 上传新版本
# ... (使用 scp 或 rsync)
```

## 性能优化

### 1. 启用 Gzip 压缩

已在 Nginx 配置示例中包含。

### 2. 静态资源缓存

已在配置示例中包含缓存头设置。

### 3. CDN 加速（可选）

可以将静态资源（CSS、JS、图片）部署到 CDN。

### 4. 浏览器缓存

确保 HTML 文件不缓存，但静态资源长期缓存：

```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

location ~* \.(html)$ {
    expires -1;
    add_header Cache-Control "no-cache, no-store, must-revalidate";
}
```

## 安全建议

1. **文件权限**
   - 目录权限: 755
   - 文件权限: 644
   - 不要使用 777

2. **用户权限**
   - 使用专用用户运行 Web 服务器
   - 不要使用 root 用户

3. **防火墙**
   - 只开放必要的端口（80, 443）
   - 使用云服务器安全组配置

4. **HTTPS**
   - 生产环境必须使用 HTTPS
   - 使用 Let's Encrypt 免费证书

5. **安全头**
   - 添加安全响应头（CSP, X-Frame-Options 等）

```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
```

## 监控和维护

### 定期检查

```bash
# 使用统一检查脚本
cd scripts
./book-excerpt.sh check

# 检查磁盘空间
df -h

# 检查文件完整性
ls -lah /var/www/html/book-excerpt-generator
```

### 日志监控

定期检查 Web 服务器日志，发现异常访问或错误。

## 回滚

如果需要回滚到之前的版本：

```bash
ssh root@8.138.183.116
cd /var/www/html
rm -rf book-excerpt-generator
mv book-excerpt-generator.backup.YYYYMMDD book-excerpt-generator
```

## 参考资源

- [Nginx 官方文档](https://nginx.org/en/docs/)
- [Apache 官方文档](https://httpd.apache.org/docs/)
- [Let's Encrypt 文档](https://letsencrypt.org/docs/)
