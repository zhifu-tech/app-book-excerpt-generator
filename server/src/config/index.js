/**
 * 应用配置管理
 * 统一管理环境变量和应用配置
 */

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 项目根目录（统一计算一次）
const rootDir = path.resolve(__dirname, "../..");

// 加载环境变量（从项目根目录）
dotenv.config({ path: path.join(rootDir, ".env") });

/**
 * 服务器配置
 */
export const serverConfig = {
  port: parseInt(process.env.PORT || "3001", 10),
  host: process.env.HOST || "0.0.0.0",
  nodeEnv: process.env.NODE_ENV || "development",
};

/**
 * CORS 配置
 */
export const corsConfig = {
  origin: process.env.CORS_ORIGIN || "*",
  credentials: true,
  optionsSuccessStatus: 200,
};

/**
 * 文件路径配置
 */
export const pathConfig = {
  root: rootDir,
  data: path.join(rootDir, "data"),
  logs: path.join(rootDir, "logs"),
  configFile: path.join(rootDir, "data/config.json"),
};

/**
 * 日志配置
 */
export const logConfig = {
  level: process.env.LOG_LEVEL || (serverConfig.nodeEnv === "production" ? "info" : "debug"),
  format: process.env.LOG_FORMAT || "json",
  enableFileLogging: process.env.ENABLE_FILE_LOGGING !== "false",
};

/**
 * 应用配置
 */
export const appConfig = {
  name: "book-excerpt-generator-server",
  version: process.env.npm_package_version || "1.0.0",
  ...serverConfig,
  cors: corsConfig,
  paths: pathConfig,
  log: logConfig,
};

export default appConfig;
