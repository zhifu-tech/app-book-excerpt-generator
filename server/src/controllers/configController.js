/**
 * 配置控制器
 * 处理配置相关的 HTTP 请求
 */

import { configService } from "../services/configService.js";
import { logger } from "../utils/logger.js";
import { validateConfig } from "../utils/validator.js";

/**
 * 获取配置
 * GET /api/config
 */
export async function getConfig(req, res, next) {
  try {
    const config = await configService.loadConfig();
    logger.info("获取配置成功", { ip: req.ip });
    res.json(config);
  } catch (error) {
    logger.error("获取配置失败", { error: error.message, ip: req.ip });
    next(error);
  }
}

/**
 * 保存配置
 * POST /api/config
 */
export async function saveConfig(req, res, next) {
  try {
    const config = req.body;

    // 验证配置格式
    if (!validateConfig(config)) {
      logger.warn("保存配置失败: 配置格式无效", { ip: req.ip });
      return res.status(400).json({
        error: "配置格式无效",
        success: false,
      });
    }

    // 保存配置
    const success = await configService.saveConfig(config);
    if (success) {
      logger.info("保存配置成功", { ip: req.ip });
      res.json({ success: true });
    } else {
      logger.error("保存配置失败", { ip: req.ip });
      res.status(500).json({
        error: "保存配置失败",
        success: false,
      });
    }
  } catch (error) {
    logger.error("保存配置失败", { error: error.message, ip: req.ip });
    next(error);
  }
}
