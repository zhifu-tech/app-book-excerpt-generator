/**
 * 请求日志中间件
 */

import { logger } from "../utils/logger.js";

/**
 * 请求日志中间件
 */
export function requestLogger(req, res, next) {
  const start = Date.now();

  // 记录请求开始
  logger.debug("收到请求", {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get("user-agent"),
  });

  // 监听响应完成
  res.on("finish", () => {
    const duration = Date.now() - start;
    const logLevel = res.statusCode >= 400 ? "warn" : "info";

    logger[logLevel]("请求完成", {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
    });
  });

  next();
}
