# 书摘卡片生成器 - 配置服务端

一个专业的 Node.js 配置服务，为书摘卡片生成器提供配置数据的获取和保存功能。

## ✨ 功能特性

- ✅ RESTful API 设计
- ✅ 配置数据持久化（JSON 文件）
- ✅ 数据验证和错误处理
- ✅ 结构化日志系统
- ✅ CORS 支持
- ✅ 健康检查端点
- ✅ 环境变量配置
- ✅ PM2 进程管理支持
- ✅ Docker 容器化支持

## 🚀 快速开始

### 安装依赖

```bash
npm install
```

### 配置环境变量

复制示例环境变量文件：

```bash
cp example.env .env
```

编辑 `.env` 文件，配置服务器参数：

```env
PORT=3001
HOST=0.0.0.0
NODE_ENV=production
CORS_ORIGIN=*
LOG_LEVEL=info
```

### 启动服务

**开发模式（自动重启）：**

```bash
npm run dev
```

**生产模式：**

```bash
npm start
```

**使用 PM2：**

```bash
npm run pm2:start
```

服务将在 `http://localhost:3001` 启动。

## 📁 项目结构

```text
book-excerpt-generator-server/
├── src/                    # 源代码
│   ├── config/            # 配置管理
│   ├── constants/         # 常量定义
│   ├── controllers/       # 控制器层
│   ├── services/         # 服务层
│   ├── routes/           # 路由定义
│   ├── middleware/       # 中间件
│   └── utils/            # 工具函数
├── scripts/               # 部署脚本
├── docs/                  # 文档目录 (位于根目录)
│   ├── CHANGELOG.md      # 更新日志
│   ├── DEPLOY.md         # 部署指南
│   ├── DOCKER.md         # Docker 指南
│   └── API.md            # API 文档
├── data/                 # 数据目录
├── logs/                 # 日志目录
└── server.js             # 入口文件
```

## 📡 API 文档

### GET /api/config

获取配置数据。

**响应示例：**

```json
{
  "themes": [{ "id": "theme-clean", "color": "#fff", "border": "#ddd" }],
  "fonts": [{ "id": "noto-serif", "value": "'Noto Serif SC', serif", "name": "宋体" }],
  "fontColors": [{ "id": "color-black", "value": "#1a1a1a", "name": "黑色" }]
}
```

### POST /api/config

保存配置数据。

**请求体：**

```json
{
  "themes": [...],
  "fonts": [...],
  "fontColors": [...]
}
```

**响应：**

```json
{
  "success": true
}
```

### GET /health

健康检查端点。

**响应：**

```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 1234.56
}
```

## 🛠️ 开发

### 代码检查

```bash
npm run lint
npm run lint:fix
```

### 代码格式化

```bash
npm run format
npm run format:check
```

### 项目架构

项目采用分层架构设计：

- **Controller 层**: 处理 HTTP 请求
- **Service 层**: 业务逻辑处理
- **Utils 层**: 通用工具函数
- **Middleware 层**: Express 中间件

## 📦 部署

### 使用部署脚本

```bash
cd scripts
./deploy.sh
```

### 使用 PM2

```bash
pm2 start ecosystem.config.cjs
pm2 save
```

### 使用 Docker

```bash
docker-compose up -d
```

### GitHub 自动发布

项目配置了基于 Git tag 的自动发布流程：

```bash
# 创建标签并推送
git tag -a v0.3.0 -m "版本 0.3.0"
git push origin v0.3.0
```

推送标签后，GitHub Actions 会自动创建 Release。

详细部署说明请查看：

- [部署指南](../docs/DEPLOY.md) - 服务器部署详细说明
- [Docker 指南](../docs/DOCKER.md) - Docker 容器化部署
- [API 文档](../docs/API.md) - 配置服务 API 接口说明
- [发布流程](../docs/RELEASE.md) - GitHub 自动发布流程

## ⚙️ 配置

### 环境变量

| 变量名                | 说明            | 默认值        |
| --------------------- | --------------- | ------------- |
| `PORT`                | 服务器端口      | `3001`        |
| `HOST`                | 监听地址        | `0.0.0.0`     |
| `NODE_ENV`            | 运行环境        | `development` |
| `CORS_ORIGIN`         | CORS 允许的来源 | `*`           |
| `LOG_LEVEL`           | 日志级别        | `info`        |
| `LOG_FORMAT`          | 日志格式        | `json`        |
| `ENABLE_FILE_LOGGING` | 启用文件日志    | `true`        |

### 配置文件

配置数据存储在 `data/config.json` 文件中。如果文件不存在，服务器会自动创建并使用默认配置。

## 📝 日志

日志文件存储在 `logs/` 目录：

- `error.log` - 错误日志
- `warn.log` - 警告日志
- `info.log` - 信息日志
- `debug.log` - 调试日志

日志格式支持 JSON 和文本两种格式。

## 🔒 安全建议

1. **生产环境**: 限制 `CORS_ORIGIN`，不要使用 `*`
2. **HTTPS**: 使用 HTTPS 保护数据传输
3. **数据备份**: 定期备份 `data/config.json` 文件
4. **访问控制**: 考虑添加身份验证和授权机制
5. **速率限制**: 添加 API 请求速率限制

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！
