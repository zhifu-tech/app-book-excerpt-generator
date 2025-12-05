/**
 * 配置常量和数据配置
 * @module config
 */

/**
 * @typedef {Object} Theme
 * @property {string} id - 主题ID
 * @property {string} [color] - 背景颜色（纯色主题）
 * @property {string} [border] - 边框颜色（纯色主题）
 * @property {string} [background] - 背景样式（渐变主题）
 */

/**
 * @typedef {Object} Font
 * @property {string} id - 字体ID
 * @property {string} value - CSS字体值
 * @property {string} name - 字体显示名称
 * @property {string} subtitle - 字体副标题
 */

/**
 * @typedef {Object} FontColor
 * @property {string} id - 颜色ID
 * @property {string} value - 颜色值（十六进制）
 * @property {string} name - 颜色显示名称
 */

/**
 * @typedef {Object} AnimationDuration
 * @property {number} FAST - 快速动画时长（毫秒）
 * @property {number} BASE - 基础动画时长（毫秒）
 * @property {number} SLOW - 慢速动画时长（毫秒）
 */

/**
 * @typedef {Object} AppConfig
 * @property {number} THUMBNAIL_UPDATE_DELAY - 缩略图更新延迟（毫秒）
 * @property {number} DOWNLOAD_DELAY - 下载延迟（毫秒）
 * @property {number} DRAG_THRESHOLD - 拖拽阈值（像素）
 * @property {AnimationDuration} ANIMATION_DURATION - 动画时长配置
 * @property {number} CANVAS_SCALE - Canvas缩放比例
 * @property {number} THUMBNAIL_HEIGHT_VH - 缩略图高度（视口高度百分比）
 * @property {number} THUMBNAIL_SCALE_RATIO - 缩略图缩放比例
 * @property {number} MOBILE_BREAKPOINT - 移动端断点（像素）
 */

// ==================== 配置常量 ====================
/**
 * 应用配置常量
 * @type {AppConfig}
 */
export const CONFIG = {
  THUMBNAIL_UPDATE_DELAY: 300,
  DOWNLOAD_DELAY: 300,
  DRAG_THRESHOLD: 5,
  ANIMATION_DURATION: {
    FAST: 150,
    BASE: 200,
    SLOW: 300,
  },
  CANVAS_SCALE: 2,
  THUMBNAIL_HEIGHT_VH: 80,
  THUMBNAIL_SCALE_RATIO: 0.4,
  MOBILE_BREAKPOINT: 768, // 移动端断点
};

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

/**
 * 字体大小配置
 */
export const FONT_SIZE_MIN = 14;
export const FONT_SIZE_MAX = 32;
export const FONT_SIZE_STEP = 2;

/**
 * 卡片宽度配置
 */
export const CARD_WIDTH_MIN = 300;
export const CARD_WIDTH_MAX = 600;
export const CARD_WIDTH_STEP = 30;

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
