/**
 * 配置路由
 * 定义配置相关的 API 路由
 */

import express from "express";
import { getConfig, saveConfig } from "../controllers/configController.js";

const router = express.Router();

/**
 * GET /api/config
 * 获取配置
 */
router.get("/", getConfig);

/**
 * POST /api/config
 * 保存配置
 */
router.post("/", saveConfig);

export default router;
