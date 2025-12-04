/**
 * 配置常量和数据配置
 */

// ==================== 配置常量 ====================
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

export const FONTS = [
  { id: "noto-serif", value: "'Noto Serif SC', serif", name: "宋体", subtitle: "标准" },
  { id: "ma-shan-zheng", value: "'Ma Shan Zheng', cursive", name: "马善政", subtitle: "毛笔" },
  { id: "zhi-mang-xing", value: "'Zhi Mang Xing', cursive", name: "志莽行书", subtitle: "行书" },
  { id: "long-cang", value: "'Long Cang', cursive", name: "龙苍行书", subtitle: "行书" },
];

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

export const FONT_SIZE_MIN = 14;
export const FONT_SIZE_MAX = 32;
export const FONT_SIZE_STEP = 2;
export const CARD_WIDTH_MIN = 300;
export const CARD_WIDTH_MAX = 600;
export const CARD_WIDTH_STEP = 30;
