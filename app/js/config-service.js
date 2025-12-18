/**
 * 配置服务
 * 负责从服务器获取和保存配置数据
 * @module config-service
 */
import { logger } from "./utils/logger.js";
import { API_CONFIG } from "./constants/index.js";

/**
 * 配置服务类
 * 管理配置数据的远程获取和保存
 */
export class ConfigService {
  /**
   * 创建配置服务实例
   * @param {string} [baseUrl] - 服务器基础URL，默认为空（使用相对路径）
   */
  constructor(baseUrl = "") {
    /** @type {string} 服务器基础URL */
    this.baseUrl = baseUrl;
    /** @type {string} 获取配置的API端点 */
    this.getConfigEndpoint = API_CONFIG.ENDPOINTS.GET_CONFIG;
    /** @type {string} 保存配置的API端点 */
    this.saveConfigEndpoint = API_CONFIG.ENDPOINTS.SAVE_CONFIG;
    /** @type {number} 请求超时时间（毫秒） */
    this.timeout = API_CONFIG.TIMEOUT;
    /** @type {import('./utils/logger.js').Logger} 日志器 */
    this.logger = logger.createChild("ConfigService");
  }

  /**
   * 从服务器获取配置
   * @returns {Promise<Object|null>} 配置对象，失败时返回 null
   */
  async fetchConfig() {
    // 如果没有配置服务器地址，直接返回 null，不显示警告
    if (!this.baseUrl) {
      return null;
    }

    try {
      const url = `${this.baseUrl}${this.getConfigEndpoint}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        // 404 是正常的（服务器未配置），不显示警告
        if (response.status === 404) {
          return null;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      // 网络错误或超时，只在开发环境显示详细信息
      if (error.name === "AbortError") {
        // 超时错误，静默处理
        return null;
      }
      // 其他错误，使用 logger 记录（自动判断环境）
      this.logger.debug("从服务器获取配置失败，使用默认配置:", error.message);
      return null;
    }
  }

  /**
   * 保存配置到服务器
   * @param {Object} config - 要保存的配置对象
   * @returns {Promise<boolean>} 是否保存成功
   */
  async saveConfig(config) {
    try {
      const url = `${this.baseUrl}${this.saveConfigEndpoint}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(config),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.success !== false;
    } catch (error) {
      this.logger.error("保存配置到服务器失败:", error.message);
      return false;
    }
  }

  /**
   * 验证配置数据格式
   * @param {Object} config - 配置对象
   * @returns {boolean} 配置是否有效
   */
  validateConfig(config) {
    if (!config || typeof config !== "object") {
      return false;
    }

    // 验证主题配置
    if (config.themes) {
      if (!Array.isArray(config.themes)) {
        return false;
      }
      for (const theme of config.themes) {
        if (
          !theme.id ||
          (typeof theme.color !== "string" && typeof theme.background !== "string")
        ) {
          return false;
        }
      }
    }

    // 验证字体配置
    if (config.fonts) {
      if (!Array.isArray(config.fonts)) {
        return false;
      }
      for (const font of config.fonts) {
        if (!font.id || !font.value || !font.name) {
          return false;
        }
      }
    }

    // 验证字体颜色配置
    if (config.fontColors) {
      if (!Array.isArray(config.fontColors)) {
        return false;
      }
      for (const color of config.fontColors) {
        if (!color.id || !color.value || !color.name) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * 合并服务器配置和默认配置
   * @param {Object} serverConfig - 服务器配置
   * @param {Object} defaultConfig - 默认配置
   * @returns {Object} 合并后的配置
   */
  mergeConfig(serverConfig, defaultConfig) {
    if (!serverConfig || !this.validateConfig(serverConfig)) {
      return defaultConfig;
    }

    return {
      themes: serverConfig.themes || defaultConfig.themes,
      fonts: serverConfig.fonts || defaultConfig.fonts,
      fontColors: serverConfig.fontColors || defaultConfig.fontColors,
    };
  }
}
