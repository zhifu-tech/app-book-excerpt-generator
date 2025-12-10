# 缓存管理指南

本文档说明在部署前端应用后，如何使改动生效，处理浏览器和服务器缓存问题。

## 📋 问题说明

前端应用部署后，由于以下原因，用户可能看不到最新改动：

1. **浏览器缓存**: 浏览器缓存了旧的 JS、CSS 文件
2. **Nginx 缓存**: 服务器端可能配置了缓存
3. **CDN 缓存**: 如果使用了 CDN，CDN 也会缓存文件

## 🚀 部署后使改动生效

### 方法 1: 强制刷新浏览器（推荐，最简单）

**Windows/Linux:**

- `Ctrl + Shift + R` 或 `Ctrl + F5`

**macOS:**

- `Cmd + Shift + R`

这会强制浏览器重新加载所有资源，忽略缓存。

### 方法 2: 清除浏览器缓存

1. 打开浏览器设置
2. 找到「清除浏览数据」或「隐私和安全」
3. 选择「缓存的图片和文件」
4. 清除缓存

### 方法 3: 使用无痕/隐私模式

打开浏览器的无痕模式（隐私模式）访问网站，这样不会使用任何缓存。

### 方法 4: 添加版本参数（开发测试）

在 URL 后添加时间戳参数：

```
https://book-excerpt.zhifu.tech?v=1234567890
```

## 🛠️ 服务器端缓存管理

### 使用 clear-cache 命令

部署脚本提供了清除服务器缓存的命令：

```bash
cd source/apps/book-excerpt-generator/scripts
./book-excerpt.sh clear-cache
```

这个命令会：

- 清除 Nginx 缓存（如果配置了）
- 重新加载 Nginx 配置
- 提供浏览器缓存清除的提示

### 手动清除 Nginx 缓存

如果服务器配置了 Nginx 缓存：

```bash
# SSH 连接到服务器
ssh root@8.138.183.116

# 清除 Nginx 缓存
rm -rf /var/cache/nginx/*

# 重新加载 Nginx
systemctl reload nginx
```

## 📝 部署流程建议

### 标准部署流程

```bash
# 1. 部署文件
./book-excerpt.sh deploy

# 2. 清除服务器缓存（可选）
./book-excerpt.sh clear-cache

# 3. 验证部署
./book-excerpt.sh check
```

### 完整部署流程（包含缓存处理）

```bash
# 1. 部署文件
./book-excerpt.sh deploy

# 2. 清除服务器缓存
./book-excerpt.sh clear-cache

# 3. 验证部署
./book-excerpt.sh check

# 4. 通知用户清除浏览器缓存
# 或者等待浏览器缓存自然过期
```

## 🔧 Nginx 缓存配置说明

### 当前缓存策略

根据 `nginx.conf` 配置：

- **HTML 文件**: 不缓存（`Cache-Control: no-cache`）
- **静态资源（JS/CSS/图片）**: 缓存 1 年（`Cache-Control: public, immutable`）

这意味着：

- ✅ HTML 文件更新会立即生效
- ⚠️ JS/CSS 文件更新需要清除浏览器缓存

### 优化建议

#### 方案 1: 使用版本化文件名（推荐）

在构建时给文件添加版本号或哈希值：

```
js/index.js → js/index.v1.0.0.js
style.css → style.v1.0.0.css
```

这样每次更新版本号，浏览器会自动加载新文件。

#### 方案 2: 使用查询参数

在 HTML 中引用资源时添加版本参数：

```html
<script src="js/index.js?v=1.0.0"></script>
<link rel="stylesheet" href="style.css?v=1.0.0" />
```

#### 方案 3: 缩短缓存时间

修改 Nginx 配置，缩短静态资源缓存时间：

```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    expires 1d;  # 改为 1 天
    add_header Cache-Control "public, max-age=86400";
}
```

## 🔍 验证改动是否生效

### 方法 1: 检查文件时间戳

```bash
# SSH 到服务器
ssh root@8.138.183.116

# 检查文件修改时间
ls -lh /var/www/html/book-excerpt-generator/js/index.js
stat /var/www/html/book-excerpt-generator/js/index.js
```

### 方法 2: 检查文件内容

```bash
# 检查文件内容（前几行）
head -20 /var/www/html/book-excerpt-generator/js/index.js
```

### 方法 3: 使用浏览器开发者工具

1. 打开浏览器开发者工具（F12）
2. 进入「Network」标签
3. 勾选「Disable cache」
4. 刷新页面
5. 查看加载的文件，确认是最新版本

### 方法 4: 添加调试信息

在代码中添加版本号或时间戳：

```javascript
console.log("App Version: 1.0.0");
console.log("Build Time: 2024-01-01 12:00:00");
```

部署后检查控制台输出，确认是新版本。

## ⚠️ 常见问题

### Q1: 部署后看不到改动

**可能原因**:

- 浏览器缓存未清除
- 文件未正确上传
- Nginx 配置未重新加载

**解决方法**:

1. 强制刷新浏览器（Ctrl+Shift+R）
2. 检查文件是否已上传: `./book-excerpt.sh check`
3. 清除服务器缓存: `./book-excerpt.sh clear-cache`

### Q2: 部分用户看到旧版本，部分看到新版本

**可能原因**:

- 不同用户的浏览器缓存状态不同
- CDN 缓存未清除（如果使用 CDN）

**解决方法**:

1. 通知所有用户清除缓存
2. 如果使用 CDN，清除 CDN 缓存
3. 考虑使用版本化文件名

### Q3: 开发环境正常，生产环境看不到改动

**可能原因**:

- 生产环境使用了不同的缓存策略
- 文件路径不一致

**解决方法**:

1. 检查生产环境的 Nginx 配置
2. 确认文件已正确部署到生产目录
3. 清除生产环境的缓存

## 📊 缓存策略最佳实践

### 推荐配置

1. **HTML 文件**: 不缓存或短缓存（5-10 分钟）
2. **静态资源**: 使用版本化文件名 + 长期缓存
3. **API 响应**: 根据内容类型设置合适的缓存时间

### 版本化文件名示例

如果使用构建工具，可以配置：

```javascript
// webpack.config.js 示例
output: {
  filename: 'js/[name].[contenthash].js',
  chunkFilename: 'js/[name].[contenthash].chunk.js',
}
```

这样每次内容变化，文件名也会变化，浏览器会自动加载新文件。

## 🔗 相关文档

- [部署指南](./DEPLOY.md) - 详细部署说明
- [Nginx 配置](../scripts/nginx.conf) - Nginx 配置文件

## 📞 快速参考

### 部署后立即生效

```bash
# 1. 部署
./book-excerpt.sh deploy

# 2. 清除服务器缓存
./book-excerpt.sh clear-cache

# 3. 在浏览器中强制刷新
# Windows/Linux: Ctrl + Shift + R
# macOS: Cmd + Shift + R
```

### 检查部署状态

```bash
./book-excerpt.sh check
```
