/**
 * 状态管理
 */

export class AppState {
  constructor() {
    this.theme = "theme-clean";
    this.layout = "horizontal";
    this.font = "'Noto Serif SC', serif";
    this.fontSize = 20;
    this.fontColor = "#1a1a1a"; // 默认黑色
    this.cardWidth = 400; // 默认值，对应滑块中间位置
    this.zoom = 1;
    this.exportFormats = ["png"]; // 默认导出格式，支持多选
  }

  update(updates) {
    Object.assign(this, updates);
  }
}
