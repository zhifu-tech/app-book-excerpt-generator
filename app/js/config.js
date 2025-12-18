/**
 * 配置常量和数据配置
 * @module config
 */
import { ConfigService } from "./config-service.js";
import { logger } from "./utils/logger.js";
import {
  APP_CONFIG,
  LAYOUT_TYPES,
  EXPORT_FORMATS,
  DEFAULT_EXPORT_FORMAT,
  SERVER_CONFIG,
  FONT_SIZE,
  CARD_WIDTH,
} from "./constants/index.js";

// 导入类型定义（用于 JSDoc）
/**
 * @typedef {import('./types/index.js').Theme} Theme
 * @typedef {import('./types/index.js').Font} Font
 * @typedef {import('./types/index.js').FontColor} FontColor
 */

// 重新导出常量（向后兼容）
export const CONFIG = APP_CONFIG;
export { LAYOUT_TYPES, EXPORT_FORMATS, DEFAULT_EXPORT_FORMAT };

// ==================== 数据配置 ====================
/**
 * 主题列表
 * @type {Theme[]}
 */
export const THEMES = [
  { id: "theme-clean", color: "#fff", border: "#ddd" },
  { id: "theme-paper", color: "#fdfbf7", border: "#f0e6d2" },
  { id: "theme-dark", color: "#1a1a1a", border: "#333" },
  { id: "theme-mist", color: "#e8ecef", border: "#d1d9e0" },
  { id: "theme-pink", color: "#fff0f5", border: "#f8bbd0" },
  { id: "theme-green", color: "#f1f8e9", border: "#c5e1a5" },
  { id: "theme-parchment", color: "#f4e4bc", border: "#d4c5a3" },
  { id: "theme-gradient-blue", background: "linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)" },
  { id: "theme-gradient-sunset", background: "linear-gradient(120deg, #f6d365 0%, #fda085 100%)" },
  { id: "theme-gradient-mint", background: "linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%)" },
];

/**
 * 字体列表
 * @type {Font[]}
 */
export const FONTS = [
  { id: "noto-serif", value: "'Noto Serif SC', serif", name: "宋体", subtitle: "标准" },
  { id: "ma-shan-zheng", value: "'Ma Shan Zheng', cursive", name: "马善政", subtitle: "毛笔" },
  { id: "zhi-mang-xing", value: "'Zhi Mang Xing', cursive", name: "志莽行书", subtitle: "行书" },
  { id: "long-cang", value: "'Long Cang', cursive", name: "龙苍行书", subtitle: "行书" },
];

/**
 * 字体颜色列表
 * @type {FontColor[]}
 */
export const FONT_COLORS = [
  { id: "color-black", value: "#1a1a1a", name: "黑色" },
  { id: "color-gray", value: "#666666", name: "灰色" },
  { id: "color-dark-gray", value: "#333333", name: "深灰" },
  { id: "color-brown", value: "#5d4037", name: "棕色" },
  { id: "color-dark-blue", value: "#1e3a5f", name: "深蓝" },
  { id: "color-dark-green", value: "#2e7d32", name: "深绿" },
  { id: "color-red", value: "#c62828", name: "红色" },
  { id: "color-purple", value: "#6a1b9a", name: "紫色" },
];

// 重新导出字体和卡片宽度配置（向后兼容）
export { FONT_SIZE, CARD_WIDTH } from "./constants/index.js";
export const FONT_SIZE_MIN = FONT_SIZE.MIN;
export const FONT_SIZE_MAX = FONT_SIZE.MAX;
export const FONT_SIZE_STEP = FONT_SIZE.STEP;
export const CARD_WIDTH_MIN = CARD_WIDTH.MIN;
export const CARD_WIDTH_MAX = CARD_WIDTH.MAX;
export const CARD_WIDTH_STEP = CARD_WIDTH.STEP;

// ==================== 配置管理 ====================
/**
 * 配置数据管理器
 * 支持从服务器加载配置，失败时使用默认配置
 */
/**
 * 自动检测并返回配置服务器地址
 * @returns {string} 配置服务器基础URL
 */
function detectConfigBaseUrl() {
  // 检查是否在本地开发环境
  const isLocalhost =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname === "";

  if (isLocalhost) {
    // 本地开发环境，使用 localhost:3001
    return SERVER_CONFIG.LOCAL;
  } else {
    // 生产环境，使用远程服务器
    return SERVER_CONFIG.PRODUCTION;
  }
}

class ConfigManager {
  constructor() {
    // 自动检测并设置配置服务器地址
    const baseUrl = detectConfigBaseUrl();
    /** @type {ConfigService} 配置服务 */
    this.configService = new ConfigService(baseUrl);
    /** @type {Theme[]} 当前主题列表 */
    this._themes = [...THEMES];
    /** @type {Font[]} 当前字体列表 */
    this._fonts = [...FONTS];
    /** @type {FontColor[]} 当前字体颜色列表 */
    this._fontColors = [...FONT_COLORS];
    /** @type {boolean} 配置是否已加载 */
    this._loaded = false;
  }

  /**
   * 获取默认配置
   * @returns {Object} 默认配置对象
   */
  getDefaultConfig() {
    return {
      themes: THEMES,
      fonts: FONTS,
      fontColors: FONT_COLORS,
    };
  }

  /**
   * 从服务器加载配置
   * @returns {Promise<void>}
   */
  async loadConfig() {
    if (this._loaded) {
      return;
    }

    try {
      const serverConfig = await this.configService.fetchConfig();
      if (serverConfig) {
        const mergedConfig = this.configService.mergeConfig(serverConfig, this.getDefaultConfig());
        this._themes = mergedConfig.themes;
        this._fonts = mergedConfig.fonts;
        this._fontColors = mergedConfig.fontColors;
        logger.info("✓ 已从服务器加载配置", serverConfig);
      } else {
        // 服务器未配置或不可用，使用默认配置（这是正常的）
        // 不显示警告，因为这是预期的行为
        logger.debug("✓ 服务器未配置或不可用，使用默认配置");
      }
      this._loaded = true;
    } catch (error) {
      logger.error("加载配置失败:", error);
      // 使用默认配置
      this._loaded = true;
    }
  }

  /**
   * 保存配置到服务器
   * @returns {Promise<boolean>} 是否保存成功
   */
  async saveConfig() {
    const config = {
      themes: this._themes,
      fonts: this._fonts,
      fontColors: this._fontColors,
    };
    return await this.configService.saveConfig(config);
  }

  /**
   * 获取主题列表
   * @returns {Theme[]}
   */
  getThemes() {
    return this._themes;
  }

  /**
   * 获取字体列表
   * @returns {Font[]}
   */
  getFonts() {
    return this._fonts;
  }

  /**
   * 获取字体颜色列表
   * @returns {FontColor[]}
   */
  getFontColors() {
    return this._fontColors;
  }

  /**
   * 更新主题列表
   * @param {Theme[]} themes - 新的主题列表
   */
  setThemes(themes) {
    this._themes = themes;
  }

  /**
   * 更新字体列表
   * @param {Font[]} fonts - 新的字体列表
   */
  setFonts(fonts) {
    this._fonts = fonts;
  }

  /**
   * 更新字体颜色列表
   * @param {FontColor[]} fontColors - 新的字体颜色列表
   */
  setFontColors(fontColors) {
    this._fontColors = fontColors;
  }

  /**
   * 设置配置服务的基础URL
   * @param {string} baseUrl - 服务器基础URL
   */
  setBaseUrl(baseUrl) {
    this.configService.baseUrl = baseUrl;
  }
}

// 创建全局配置管理器实例
const configManager = new ConfigManager();

/**
 * 初始化配置（从服务器加载）
 * @returns {Promise<void>}
 */
export async function initConfig() {
  await configManager.loadConfig();
}

/**
 * 保存配置到服务器
 * @returns {Promise<boolean>}
 */
export async function saveConfig() {
  return await configManager.saveConfig();
}

/**
 * 获取主题列表（动态）
 * @returns {Theme[]}
 */
export function getThemes() {
  return configManager.getThemes();
}

/**
 * 获取字体列表（动态）
 * @returns {Font[]}
 */
export function getFonts() {
  return configManager.getFonts();
}

/**
 * 获取字体颜色列表（动态）
 * @returns {FontColor[]}
 */
export function getFontColors() {
  return configManager.getFontColors();
}

/**
 * 设置配置服务的基础URL
 * @param {string} baseUrl - 服务器基础URL
 */
export function setConfigBaseUrl(baseUrl) {
  configManager.setBaseUrl(baseUrl);
}

// 为了向后兼容，导出默认配置作为后备
export { THEMES as DEFAULT_THEMES, FONTS as DEFAULT_FONTS, FONT_COLORS as DEFAULT_FONT_COLORS };
