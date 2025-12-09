/**
 * 日志管理工具
 * 提供统一的日志输出接口，支持不同环境下的日志级别控制
 * @module utils/logger
 */

/**
 * 日志级别枚举
 * @enum {string}
 */
export const LogLevel = {
  DEBUG: "debug",
  INFO: "info",
  WARN: "warn",
  ERROR: "error",
};

/**
 * 判断是否为开发环境
 * @returns {boolean} 是否为开发环境
 */
function isDevelopment() {
  return (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname === "" ||
    window.location.hostname.includes("localhost")
  );
}

/**
 * 日志管理器
 * 提供统一的日志输出接口
 */
export class Logger {
  /**
   * 创建日志管理器实例
   * @param {string} [context="App"] - 日志上下文名称
   */
  constructor(context = "App") {
    /** @type {string} 日志上下文 */
    this.context = context;
    /** @type {boolean} 是否为开发环境 */
    this.isDev = isDevelopment();
    /** @type {string} 当前日志级别 */
    this.level = this.isDev ? LogLevel.DEBUG : LogLevel.ERROR;
  }

  /**
   * 格式化日志消息
   * @param {string} level - 日志级别
   * @param {any[]} args - 日志参数
   * @returns {string} 格式化后的消息
   * @private
   */
  _formatMessage(level, args) {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${this.context}] [${level.toUpperCase()}]`;
    return `${prefix}`;
  }

  /**
   * 输出调试日志
   * @param {...any} args - 日志参数
   */
  debug(...args) {
    if (this.isDev && this.level === LogLevel.DEBUG) {
      console.debug(this._formatMessage(LogLevel.DEBUG, args), ...args);
    }
  }

  /**
   * 输出信息日志
   * @param {...any} args - 日志参数
   */
  info(...args) {
    if (this.isDev) {
      console.log(this._formatMessage(LogLevel.INFO, args), ...args);
    }
  }

  /**
   * 输出警告日志
   * @param {...any} args - 日志参数
   */
  warn(...args) {
    console.warn(this._formatMessage(LogLevel.WARN, args), ...args);
  }

  /**
   * 输出错误日志
   * @param {...any} args - 日志参数
   */
  error(...args) {
    console.error(this._formatMessage(LogLevel.ERROR, args), ...args);
  }

  /**
   * 创建子日志器
   * @param {string} subContext - 子上下文名称
   * @returns {Logger} 新的日志器实例
   */
  createChild(subContext) {
    const child = new Logger(`${this.context}:${subContext}`);
    child.level = this.level;
    return child;
  }
}

/**
 * 默认日志器实例
 * @type {Logger}
 */
export const logger = new Logger("BookExcerpt");
