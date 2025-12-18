/**
 * 错误处理中间件
 */

import { logger } from "../utils/logger.js";

/**
 * 错误处理中间件
 */
export function errorHandler(err, req, res, _next) {
  logger.error("服务器错误", {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
  });

  // 开发环境返回详细错误信息
  const isDevelopment = process.env.NODE_ENV === "development";

  res.status(err.status || 500).json({
    error: err.message || "服务器内部错误",
    success: false,
    ...(isDevelopment && { stack: err.stack }),
  });
}

/**
 * 404 处理中间件
 */
export function notFoundHandler(req, res) {
  res.status(404).json({
    error: "端点不存在",
    success: false,
    path: req.path,
  });
}
