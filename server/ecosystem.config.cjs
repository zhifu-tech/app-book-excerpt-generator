/**
 * PM2 进程管理配置
 * 用于生产环境部署
 * 注意：使用 .cjs 扩展名以支持 CommonJS 格式（PM2 需要）
 */
module.exports = {
  apps: [
    {
      name: "book-excerpt-generator-server",
      script: "./server.js",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 3001,
      },
      error_file: "./logs/error.log",
      out_file: "./logs/out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      min_uptime: "10s",
      max_restarts: 10,
    },
  ],
};


