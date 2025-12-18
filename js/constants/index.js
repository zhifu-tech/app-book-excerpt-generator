/**
 * 应用常量定义
 * @module constants
 */

/**
 * 应用配置常量
 * @type {Object}
 */
export const APP_CONFIG = {
  VERSION: "1.0.1",
  THUMBNAIL_UPDATE_DELAY: 300,
  DOWNLOAD_DELAY: 300,
  DRAG_THRESHOLD: 5,
  ANIMATION_DURATION: {
    FAST: 150,
    BASE: 200,
    SLOW: 300,
  },
  CANVAS_SCALE: 2,
  THUMBNAIL_HEIGHT_VH: 100,
  THUMBNAIL_SCALE_RATIO: 0.4,
  MOBILE_BREAKPOINT: 768,
};

/**
 * 字体大小配置
 */
export const FONT_SIZE = {
  MIN: 14,
  MAX: 32,
  STEP: 2,
  DEFAULT: 20,
};

/**
 * 卡片宽度配置
 */
export const CARD_WIDTH = {
  MIN: 300,
  MAX: 600,
  STEP: 30,
  DEFAULT: 400,
};

/**
 * 布局类型枚举
 * @enum {string}
 */
export const LAYOUT_TYPES = {
  HORIZONTAL: "horizontal",
  VERTICAL: "vertical",
};

/**
 * 导出格式枚举
 * @enum {string}
 */
export const EXPORT_FORMATS = {
  PNG: "png",
  JPEG: "jpeg",
  JPG: "jpg",
  SVG: "svg",
  WEBP: "webp",
};

/**
 * 默认导出格式
 */
export const DEFAULT_EXPORT_FORMAT = EXPORT_FORMATS.PNG;

/**
 * API 配置
 */
export const API_CONFIG = {
  TIMEOUT: 5000,
  ENDPOINTS: {
    GET_CONFIG: "/api/config",
    SAVE_CONFIG: "/api/config",
  },
};

/**
 * 服务器配置
 */
export const SERVER_CONFIG = {
  LOCAL: "http://localhost:3001",
  PRODUCTION: "https://api.book-excerpt.zhifu.tech",
};
