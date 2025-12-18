/**
 * 路由入口
 * 统一导出所有路由
 */

import express from "express";
import configRoutes from "./configRoutes.js";
import { healthCheck } from "../controllers/healthController.js";

const router = express.Router();

// 健康检查
router.get("/health", healthCheck);

// API 路由
router.use("/api/config", configRoutes);

export default router;
