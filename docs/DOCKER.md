# Docker 部署指南

## 快速开始

### 使用 Docker Compose（推荐）

1. **配置环境变量**

   复制示例环境变量文件：

   ```bash
   cp example.env .env
   ```

   编辑 `.env` 文件，配置所需参数。

2. **启动服务**

   ```bash
   docker-compose up -d
   ```

3. **查看日志**

   ```bash
   docker-compose logs -f
   ```

4. **停止服务**

   ```bash
   docker-compose down
   ```

### 使用 Docker 命令

1. **构建镜像**

   ```bash
   docker build -t book-excerpt-server:latest .
   ```

2. **运行容器**

   ```bash
   docker run -d \
     --name book-excerpt-server \
     -p 3001:3001 \
     -v $(pwd)/data:/app/data \
     -v $(pwd)/logs:/app/logs \
     -e PORT=3001 \
     -e NODE_ENV=production \
     book-excerpt-server:latest
   ```

3. **查看日志**

   ```bash
   docker logs -f book-excerpt-server
   ```

4. **停止容器**

   ```bash
   docker stop book-excerpt-server
   docker rm book-excerpt-server
   ```

## 配置说明

### 环境变量

Docker Compose 会自动从 `.env` 文件读取环境变量，也可以通过 `environment` 部分直接设置。

主要环境变量：

- `PORT`: 服务器端口（默认：3001）
- `NODE_ENV`: 运行环境（默认：production）
- `HOST`: 监听地址（默认：0.0.0.0）
- `CORS_ORIGIN`: CORS 允许的来源（默认：*）
- `LOG_LEVEL`: 日志级别（默认：info）
- `LOG_FORMAT`: 日志格式（默认：json）
- `ENABLE_FILE_LOGGING`: 启用文件日志（默认：true）

### 数据持久化

Docker Compose 配置了以下卷挂载：

- `./data:/app/data` - 配置文件持久化
- `./logs:/app/logs` - 日志文件持久化

确保这些目录存在，或者 Docker 会自动创建。

## 健康检查

容器配置了健康检查，每 30 秒检查一次服务状态：

```bash
# 查看健康状态
docker ps
# 或
docker inspect book-excerpt-config-server | grep -A 10 Health
```

## 生产环境建议

1. **使用环境变量文件**

   创建 `.env.production` 文件：

   ```env
   NODE_ENV=production
   PORT=3001
   CORS_ORIGIN=https://yourdomain.com
   LOG_LEVEL=info
   ```

2. **限制资源使用**

   在 `docker-compose.yml` 中添加资源限制：

   ```yaml
   deploy:
     resources:
       limits:
         cpus: '0.5'
         memory: 512M
       reservations:
         cpus: '0.25'
         memory: 256M
   ```

3. **使用 Docker Secrets**

   对于敏感信息，使用 Docker Secrets：

   ```yaml
   secrets:
     - config_secret
   ```

4. **网络配置**

   使用自定义网络：

   ```yaml
   networks:
     app-network:
       driver: bridge
   ```

## 故障排查

### 查看容器日志

```bash
docker-compose logs -f config-server
```

### 进入容器调试

```bash
docker-compose exec config-server sh
```

### 检查健康状态

```bash
curl http://localhost:3001/health
```

### 重启服务

```bash
docker-compose restart config-server
```

## 多阶段构建（可选）

如果需要更小的镜像，可以使用多阶段构建：

```dockerfile
# 构建阶段
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# 运行阶段
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
CMD ["node", "dist/server.js"]
```

## 与 Kubernetes 集成

如果需要部署到 Kubernetes，可以参考以下配置：

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: book-excerpt-server
spec:
  replicas: 2
  selector:
    matchLabels:
      app: book-excerpt-server
  template:
    metadata:
      labels:
        app: book-excerpt-server
    spec:
      containers:
      - name: server
        image: book-excerpt-server:latest
        ports:
        - containerPort: 3001
        env:
        - name: PORT
          value: "3001"
        - name: NODE_ENV
          value: "production"
        volumeMounts:
        - name: data
          mountPath: /app/data
        - name: logs
          mountPath: /app/logs
      volumes:
      - name: data
        persistentVolumeClaim:
          claimName: book-excerpt-data
      - name: logs
        persistentVolumeClaim:
          claimName: book-excerpt-logs
```

