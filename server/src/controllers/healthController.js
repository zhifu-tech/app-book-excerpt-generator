/**
 * 健康检查控制器
 */

/**
 * 健康检查
 * GET /health
 */
export function healthCheck(req, res) {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
}
