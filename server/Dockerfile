FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 安装必要的系统工具（用于健康检查）
RUN apk add --no-cache wget

# 复制 package 文件
COPY package*.json ./

# 安装依赖
RUN npm ci --omit=dev && npm cache clean --force

# 复制应用代码
COPY . .

# 创建必要的目录
RUN mkdir -p data logs && \
    chown -R node:node /app

# 切换到非 root 用户（安全最佳实践）
USER node

# 暴露端口（默认 3001，可通过环境变量覆盖）
EXPOSE 3001

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:${PORT:-3001}/health || exit 1

# 启动服务
CMD ["node", "server.js"]


