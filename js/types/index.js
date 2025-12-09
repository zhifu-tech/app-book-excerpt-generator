/**
 * 类型定义
 * @module types
 */

// 导出空对象以使其成为有效模块
export {};

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

/**
 * @typedef {Object} AppStateData
 * @property {string} theme - 当前主题ID
 * @property {'horizontal'|'vertical'} layout - 布局方式
 * @property {string} font - 字体CSS值
 * @property {number} fontSize - 字体大小（像素）
 * @property {string} fontColor - 字体颜色（十六进制）
 * @property {number} cardWidth - 卡片宽度（像素）
 * @property {number} zoom - 缩放比例
 * @property {string[]} exportFormats - 导出格式列表
 */

/**
 * @typedef {Object} ServerConfig
 * @property {Theme[]} themes - 主题列表
 * @property {Font[]} fonts - 字体列表
 * @property {FontColor[]} fontColors - 字体颜色列表
 */

