/**
 * 导入管理器
 * @module import-manager
 */
import { APP_CONFIG } from "./constants/index.js";
import { logger } from "./utils/logger.js";

/**
 * 导入管理器类
 * 负责配置文件的导入和还原
 */
export class ImportManager {
  /**
   * 创建导入管理器实例
   * @param {DOMManager} dom - DOM 管理器
   * @param {AppState} state - 应用状态
   * @param {PreviewManager} previewManager - 预览管理器
   * @param {ThumbnailManager} thumbnailManager - 缩略图管理器
   */
  constructor(dom, state, previewManager, thumbnailManager) {
    /** @type {DOMManager} */
    this.dom = dom;
    /** @type {AppState} */
    this.state = state;
    /** @type {PreviewManager} */
    this.previewManager = previewManager;
    /** @type {ThumbnailManager} */
    this.thumbnailManager = thumbnailManager;

    this.init();
  }

  /**
   * 初始化事件绑定
   */
  init() {
    const importBtn = document.getElementById("import-config-btn");
    const fileInput = document.getElementById("config-file-input");

    if (importBtn && fileInput) {
      importBtn.addEventListener("click", () => {
        fileInput.click();
      });

      fileInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file) {
          this.importFile(file);
          // 清除 input 的值，以便下次可以选择同一个文件
          fileInput.value = "";
        }
      });
    }
  }

  /**
   * 导入文件并解析
   * @param {File} file
   */
  async importFile(file) {
    try {
      const text = await file.text();
      const config = JSON.parse(text);

      if (!this.validateConfig(config)) {
        throw new Error("无效的配置文件格式");
      }

      // 版本校验
      if (!this.checkVersion(config.version)) {
        if (
          !confirm(
            `配置文件版本 (${config.version}) 与当前版本 (${APP_CONFIG.VERSION}) 可能不兼容，是否继续？`
          )
        ) {
          return;
        }
      }

      this.applyConfig(config);
      logger.info("✓ 配置导入成功", config);
      alert("配置导入成功！");
    } catch (error) {
      logger.error("导入配置失败:", error);
      alert(`导入失败: ${error.message}`);
    }
  }

  /**
   * 校验配置格式
   * @param {any} config
   * @returns {boolean}
   */
  validateConfig(config) {
    return config && typeof config === "object" && config.content && config.style;
  }

  /**
   * 版本校验
   * @param {string} version
   * @returns {boolean}
   */
  checkVersion(version) {
    if (!version) return false;
    // 简单的版本校验：主版本号相同即可
    const currentMainVersion = APP_CONFIG.VERSION.split(".")[0];
    const importMainVersion = version.split(".")[0];
    return currentMainVersion === importMainVersion;
  }

  /**
   * 应用配置到应用
   * @param {any} config
   */
  applyConfig(config) {
    const { content, style } = config;
    const { quoteInput, bookInput, authorInput, sealInput, sealFontSelect } = this.dom.elements;

    // 1. 更新内容输入框
    if (quoteInput && content.quote !== undefined) quoteInput.value = content.quote;
    if (bookInput && content.book !== undefined) bookInput.value = content.book;
    if (authorInput && content.author !== undefined) authorInput.value = content.author;
    if (sealInput && content.seal !== undefined) sealInput.value = content.seal;
    if (sealFontSelect && content.sealFont !== undefined) {
      sealFontSelect.value = content.sealFont;
    }

    // 2. 更新应用状态
    this.state.update({
      theme: style.theme || this.state.theme,
      layout: style.layout || this.state.layout,
      font: style.font || this.state.font,
      fontSize: style.fontSize || this.state.fontSize,
      fontColor: style.fontColor || this.state.fontColor,
      cardWidth: style.cardWidth || this.state.cardWidth,
      textAlign: style.textAlign || this.state.textAlign,
      exportFormats: style.exportFormats || this.state.exportFormats,
      sealFont: content.sealFont || this.state.sealFont,
    });

    // 3. 更新 UI 显示和预览
    this.previewManager.updatePreview();
    this.previewManager.updateSeal();

    if (style.theme) this.previewManager.setTheme(style.theme);
    if (style.font) this.previewManager.setFont(style.font);
    if (style.fontSize) this.previewManager.setFontSize(style.fontSize);
    if (style.fontColor) this.previewManager.setFontColor(style.fontColor);
    if (style.cardWidth) this.previewManager.setCardWidth(style.cardWidth);
    if (style.textAlign) this.previewManager.setTextAlign(style.textAlign);
    if (style.layout) this.previewManager.setLayout(style.layout);

    // 更新缩略图
    this.thumbnailManager.updateThumbnail();

    // 手动触发一些 UI 更新（比如 radio 选中状态等）
    this.updateUIRadioStates();
  }

  /**
   * 更新 UI 中的单选框和复选框状态
   */
  updateUIRadioStates() {
    // 更新布局 radio
    const layoutRadios = this.dom.layoutRadios;
    if (layoutRadios) {
      layoutRadios.forEach((radio) => {
        radio.checked = radio.value === this.state.layout;
      });
    }

    // 更新导出格式 checkboxes
    const checkboxes = this.dom.exportFormatCheckboxes;
    if (checkboxes) {
      checkboxes.forEach((cb) => {
        cb.checked = this.state.exportFormats.includes(cb.value);
      });
    }

    // 更新字号、宽度等 slider 的显示
    const fontSizeSlider = this.dom.fontSizeSlider;
    const fontSizeValue = this.dom.fontSizeValue;
    if (fontSizeSlider && fontSizeValue) {
      fontSizeSlider.value = this.state.fontSize;
      fontSizeValue.textContent = `${this.state.fontSize}px`;
    }

    const cardWidthSlider = this.dom.cardWidthSlider;
    const cardWidthValue = this.dom.cardWidthValue;
    if (cardWidthSlider && cardWidthValue) {
      cardWidthSlider.value = this.state.cardWidth;
      cardWidthValue.textContent = `${this.state.cardWidth}px`;
    }

    // 更新对齐方式按钮
    if (this.state.textAlign) {
      document.querySelectorAll(".tool-btn[data-align]").forEach((btn) => {
        btn.classList.toggle("active", btn.dataset.align === this.state.textAlign);
      });
    }
  }
}
