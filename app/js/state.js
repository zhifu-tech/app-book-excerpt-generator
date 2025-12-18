/**
 * 状态管理
 * @module state
 */

/**
 * 应用状态类
 * 管理应用的全局状态，包括主题、字体、布局等配置
 */
export class AppState {
  /**
   * 创建应用状态实例
   */
  constructor() {
    /** @type {string} 当前主题ID */
    this.theme = "theme-clean";
    /** @type {'horizontal'|'vertical'} 布局方式 */
    this.layout = "horizontal";
    /** @type {string} 字体CSS值 */
    this.font = "'Noto Serif SC', serif";
    /** @type {number} 字体大小（像素） */
    this.fontSize = 20;
    /** @type {string} 字体颜色（十六进制） */
    this.fontColor = "#1a1a1a";
    /** @type {number} 卡片宽度（像素） */
    this.cardWidth = 400;
    /** @type {number} 缩放比例 */
    this.zoom = 1;
    /** @type {string[]} 导出格式列表 */
    this.exportFormats = ["png"];
    /** @type {string} 印章字体 */
    this.sealFont = "'Ma Shan Zheng', cursive";
    /** @type {'left'|'center'|'right'} 文本对齐方式 */
    this.textAlign = "justify";
  }

  /**
   * 更新状态
   * @param {Partial<AppState>} updates - 要更新的状态属性
   */
  update(updates) {
    Object.assign(this, updates);
  }
}
