/**
 * 日志工具
 * 提供统一的日志记录功能
 */

import fs from "fs/promises";
import path from "path";
import { pathConfig, logConfig } from "../config/index.js";

const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

class Logger {
  constructor() {
    this.level = LOG_LEVELS[logConfig.level] || LOG_LEVELS.info;
    this.logDir = pathConfig.logs;
    this.enableFileLogging = logConfig.enableFileLogging;
    this.init();
  }

  async init() {
    if (this.enableFileLogging) {
      try {
        await fs.mkdir(this.logDir, { recursive: true });
      } catch (error) {
        console.error("创建日志目录失败:", error);
        this.enableFileLogging = false;
      }
    }
  }

  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      message,
      ...meta,
    };

    if (logConfig.format === "json") {
      return JSON.stringify(logEntry);
    }

    // 简单格式
    return `[${timestamp}] [${level.toUpperCase()}] ${message} ${
      Object.keys(meta).length > 0 ? JSON.stringify(meta) : ""
    }`;
  }

  async writeToFile(level, message, meta) {
    if (!this.enableFileLogging) return;

    try {
      const logFile = path.join(this.logDir, `${level}.log`);
      const formatted = this.formatMessage(level, message, meta);
      await fs.appendFile(logFile, formatted + "\n", "utf-8");
    } catch (error) {
      console.error("写入日志文件失败:", error);
    }
  }

  log(level, message, meta = {}) {
    const levelNum = LOG_LEVELS[level] || LOG_LEVELS.info;

    if (levelNum <= this.level) {
      const formatted = this.formatMessage(level, message, meta);
      console.log(formatted);
      this.writeToFile(level, message, meta);
    }
  }

  error(message, meta = {}) {
    this.log("error", message, meta);
  }

  warn(message, meta = {}) {
    this.log("warn", message, meta);
  }

  info(message, meta = {}) {
    this.log("info", message, meta);
  }

  debug(message, meta = {}) {
    this.log("debug", message, meta);
  }
}

export const logger = new Logger();
export default logger;
