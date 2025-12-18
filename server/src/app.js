/**
 * Express 应用配置
 * 配置中间件和路由
 */

import express from "express";
import cors from "cors";
import { appConfig } from "./config/index.js";
import { requestLogger } from "./middleware/requestLogger.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import routes from "./routes/index.js";
import { logger } from "./utils/logger.js";

/**
 * 创建 Express 应用
 */
export function createApp() {
  const app = express();

  // CORS 配置
  app.use(cors(appConfig.cors));

  // 解析 JSON 请求体
  app.use(express.json({ limit: "10mb" }));

  // 请求日志
  app.use(requestLogger);

  // 路由
  app.use(routes);

  // 404 处理
  app.use(notFoundHandler);

  // 错误处理
  app.use(errorHandler);

  return app;
}

/**
 * 启动服务器
 */
export async function startServer() {
  try {
    const app = createApp();

    app.listen(appConfig.port, appConfig.host, () => {
      logger.info("服务器启动成功", {
        port: appConfig.port,
        host: appConfig.host,
        env: appConfig.nodeEnv,
      });

      console.log("=".repeat(50));
      console.log(`配置服务已启动`);
      console.log(`监听地址: ${appConfig.host}:${appConfig.port}`);
      console.log(`环境: ${appConfig.nodeEnv}`);
      console.log(`API 端点: http://${appConfig.host}:${appConfig.port}/api/config`);
      console.log(`健康检查: http://${appConfig.host}:${appConfig.port}/health`);
      console.log("=".repeat(50));
    });
  } catch (error) {
    logger.error("服务器启动失败", { error: error.message });
    process.exit(1);
  }
}
