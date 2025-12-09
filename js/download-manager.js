/**
 * 下载管理器
 * @module download-manager
 */
import { CONFIG, DEFAULT_EXPORT_FORMAT } from "./config.js";
import { Utils } from "./utils.js";
import { PreviewProcessor } from "./preview-processor.js";
import { logger } from "./utils/logger.js";

/**
 * 下载管理器类
 * 负责图片导出和下载功能
 */
export class DownloadManager {
  /**
   * 创建下载管理器实例
   * @param {DOMManager} dom - DOM 管理器
   * @param {AppState} state - 应用状态
   * @param {PreviewManager} previewManager - 预览管理器
   */
  constructor(dom, state, previewManager) {
    /** @type {DOMManager} */
    this.dom = dom;
    /** @type {AppState} */
    this.state = state;
    /** @type {PreviewManager} */
    this.previewManager = previewManager;
    /** @type {PreviewProcessor} */
    this.processor = new PreviewProcessor(state);
  }

  /**
   * 下载图片（支持多格式）
   * @returns {Promise<void>}
   */
  async download() {
    const card = this.dom.card;
    const downloadBtn = this.dom.downloadBtn;
    if (!card || !downloadBtn) return;

    // 显示加载状态
    this.setLoadingState(downloadBtn, true);

    // 使用统一的预览处理器获取背景样式
    const cardBackgroundInfo = this.processor.getCardBackground(card);
    const cardBackground = {
      background: cardBackgroundInfo.background,
      backgroundColor: cardBackgroundInfo.backgroundColor,
      backgroundImage: cardBackgroundInfo.backgroundImage,
      color: cardBackgroundInfo.color,
    };
    const currentTheme = cardBackgroundInfo.theme;

    // 保存原始样式
    const originalStyles = this.saveCardStyles(card);
    const originalZoom = this.state.zoom;

    // 重置样式和缩放
    this.prepareCardForCapture(card);
    this.previewManager.setZoom(1);

    try {
      // 等待字体加载完成（如果浏览器支持）
      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }

      // 等待样式应用和渲染
      await new Promise((resolve) => setTimeout(resolve, CONFIG.DOWNLOAD_DELAY));

      // 计算目标尺寸（实际尺寸）
      const targetWidth = this.state.cardWidth;
      const cardRect = card.getBoundingClientRect();
      const aspectRatio = cardRect.height / cardRect.width;
      const targetHeight = targetWidth * aspectRatio;

      // 根据设备 DPI 设置 scale，类似于截屏设置
      // devicePixelRatio 通常是 1（普通屏幕）、2（Retina）、3（高 DPI）等
      // 使用 Math.max(1, ...) 确保至少为 1，避免低 DPI 设备出现问题
      const deviceScale = window.devicePixelRatio || 1;
      const finalScale = Math.max(1, deviceScale);

      const options = this.getCanvasOptions(
        cardBackground,
        currentTheme,
        targetWidth,
        targetHeight,
        finalScale
      );

      // 移动端特殊处理：将卡片克隆到干净的临时容器中，避免父元素背景影响
      // 这是解决移动端白色蒙层问题的唯一有效方案
      const isMobile = Utils.isMobile();
      let tempContainer = null;
      let clonedCardForCapture = card;

      if (isMobile) {
        // 创建临时容器（完全干净的 DOM 环境）
        // 注意：不设置固定高度，让容器自适应内容高度，避免底部空白
        tempContainer = document.createElement("div");
        tempContainer.style.cssText = `
          position: absolute;
          left: -9999px;
          top: 0;
          width: ${targetWidth}px;
          min-height: ${targetHeight}px;
          background: transparent;
          padding: 0;
          margin: 0;
          border: none;
          overflow: visible;
        `;
        document.body.appendChild(tempContainer);

        // 克隆卡片到临时容器
        clonedCardForCapture = card.cloneNode(true);
        clonedCardForCapture.style.cssText = `
          transform: none !important;
          position: relative !important;
          margin: 0 !important;
          width: ${targetWidth}px !important;
          min-height: auto !important;
          height: auto !important;
          opacity: 1 !important;
          visibility: visible !important;
        `;

        // 应用卡片背景
        if (currentTheme?.background) {
          clonedCardForCapture.style.setProperty(
            "background",
            currentTheme.background,
            "important"
          );
        } else if (currentTheme?.color) {
          clonedCardForCapture.style.setProperty(
            "background-color",
            currentTheme.color,
            "important"
          );
        } else if (
          cardBackground?.backgroundColor &&
          cardBackground.backgroundColor !== "transparent"
        ) {
          clonedCardForCapture.style.setProperty(
            "background-color",
            cardBackground.backgroundColor,
            "important"
          );
        } else {
          clonedCardForCapture.style.setProperty("background-color", "#fff", "important");
        }

        tempContainer.appendChild(clonedCardForCapture);

        // 等待 DOM 渲染完成
        await new Promise((resolve) => setTimeout(resolve, 50));

        // 对于竖排布局，需要在临时容器中直接处理
        // 因为临时容器中的卡片不在 html2canvas 的 clonedDoc 中
        if (this.state.layout === "vertical") {
          // 创建一个虚拟的 document 对象，用于 processVerticalLayout
          const virtualDoc = {
            getElementById: (id) => {
              if (id === "card-preview") return clonedCardForCapture;
              return null;
            },
            createElement: (tag) => document.createElement(tag),
            defaultView: window,
          };

          // 处理竖排布局
          this.processor.processVerticalLayout(virtualDoc);

          // 等待竖排布局渲染完成
          await new Promise((resolve) => setTimeout(resolve, 50));
        }

        // 重新计算实际高度（处理竖排布局后）
        const actualHeight = clonedCardForCapture.offsetHeight || clonedCardForCapture.scrollHeight;
        if (actualHeight > 0) {
          // 更新临时容器高度为实际内容高度
          tempContainer.style.height = `${actualHeight}px`;
        }
      }

      // 对于移动端临时容器，不设置固定 height，让 html2canvas 自动计算
      const canvasOptions = isMobile
        ? { ...options, height: undefined } // 移除固定高度，让 html2canvas 自动计算
        : options;

      const canvas = await html2canvas(clonedCardForCapture, canvasOptions);

      // 清理临时容器
      if (tempContainer?.parentNode) {
        tempContainer.parentNode.removeChild(tempContainer);
      }

      // 恢复样式
      this.restoreCardStyles(card, originalStyles);
      this.previewManager.setZoom(originalZoom);

      // 根据选中的格式导出（支持多格式）
      const selectedFormats = this.getSelectedFormats();
      if (selectedFormats.length === 0) {
        alert("请至少选择一个导出格式");
        this.setLoadingState(downloadBtn, false);
        return;
      }

      // 导出所有选中的格式
      for (const format of selectedFormats) {
        await this.downloadCanvas(canvas, format);
        // 格式之间稍作延迟，避免浏览器阻止多个下载
        if (selectedFormats.length > 1 && format !== selectedFormats[selectedFormats.length - 1]) {
          await new Promise((resolve) => setTimeout(resolve, 300));
        }
      }

      this.setLoadingState(downloadBtn, false, true);
    } catch (err) {
      this._showError(`生成图片失败：${err.message || "未知错误"}\n请重试或检查浏览器控制台`);
      this.restoreCardStyles(card, originalStyles);
      this.previewManager.setZoom(originalZoom);
      this.setLoadingState(downloadBtn, false);
    }
  }

  setLoadingState(btn, isLoading, isSuccess = false) {
    if (isLoading) {
      Utils.createLoadingStyles();
      btn.disabled = true;
      const originalText = btn.innerHTML;
      btn.dataset.originalText = originalText;
      btn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation: spin 1s linear infinite;">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="7 10 12 15 17 10"></polyline>
        <line x1="12" y1="15" x2="12" y2="3"></line>
      </svg>
      生成中...
    `;
    } else {
      btn.disabled = false;
      if (isSuccess) {
        btn.innerHTML = `
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          已保存
        `;
        setTimeout(() => {
          btn.innerHTML = btn.dataset.originalText || "保存";
        }, 2000);
      } else {
        btn.innerHTML = btn.dataset.originalText || "保存";
      }
    }
  }

  /**
   * 显示错误信息
   * @private
   * @param {string} message - 错误消息
   */
  _showError(message) {
    logger.error(message);
    alert(message);
  }

  /**
   * 保存卡片原始样式
   * @private
   * @param {HTMLElement} card - 卡片元素
   * @returns {Record<string, string>} 样式对象
   */
  saveCardStyles(card) {
    return {
      transform: card.style.transform,
      boxShadow: card.style.boxShadow,
      position: card.style.position,
      zIndex: card.style.zIndex,
    };
  }

  /**
   * 恢复卡片原始样式
   * @private
   * @param {HTMLElement} card - 卡片元素
   * @param {Record<string, string>} styles - 样式对象
   */
  restoreCardStyles(card, styles) {
    Object.assign(card.style, styles);
  }

  /**
   * 准备卡片用于捕获（重置样式）
   * @private
   * @param {HTMLElement} card - 卡片元素
   */
  prepareCardForCapture(card) {
    card.style.transform = "none";
    card.style.boxShadow = "none";
    card.style.position = "relative";
    card.style.zIndex = "9999";
  }

  getCanvasOptions(cardBackground, theme, targetWidth, targetHeight, finalScale) {
    const isVertical = this.state.layout === "vertical";

    // 使用统一的预览处理器获取背景色
    const backgroundColor = this.processor.getBackgroundColor(cardBackground, theme);

    return {
      scale: finalScale,
      useCORS: true,
      backgroundColor: backgroundColor,
      logging: false,
      allowTaint: false,
      willReadFrequently: false,
      removeContainer: false,
      imageTimeout: 15000,
      width: targetWidth,
      height: targetHeight,
      onclone: (clonedDoc) => {
        // 设置克隆文档的 body 和 html 为桌面端尺寸，避免移动端媒体查询生效
        const clonedBody = clonedDoc.body;
        const clonedHtml = clonedDoc.documentElement;
        if (clonedBody) {
          clonedBody.style.setProperty("min-width", "1024px", "important");
          clonedBody.style.setProperty("background", "transparent", "important");
        }
        if (clonedHtml) {
          clonedHtml.style.setProperty("min-width", "1024px", "important");
          clonedHtml.style.setProperty("background", "transparent", "important");
        }

        // 在克隆文档中强制优化文字渲染
        const clonedCard = clonedDoc.querySelector("#card-preview");
        if (clonedCard) {
          // 强制设置卡片宽度为设置的宽度，确保导出尺寸正确
          clonedCard.style.setProperty("width", `${targetWidth}px`, "important");
          clonedCard.style.setProperty("min-width", `${targetWidth}px`, "important");
          clonedCard.style.setProperty("max-width", `${targetWidth}px`, "important");
          // 高度设置为 auto，让内容自适应，避免底部空白
          clonedCard.style.setProperty("height", "auto", "important");
          clonedCard.style.setProperty("min-height", "auto", "important");
          clonedCard.style.setProperty("max-height", "none", "important");

          // 强制应用文字渲染优化样式
          clonedCard.style.setProperty("-webkit-font-smoothing", "antialiased", "important");
          clonedCard.style.setProperty("-moz-osx-font-smoothing", "grayscale", "important");
          clonedCard.style.setProperty("text-rendering", "optimizeLegibility", "important");
          clonedCard.style.setProperty("image-rendering", "-webkit-optimize-contrast", "important");
          clonedCard.style.setProperty("image-rendering", "crisp-edges", "important");

          // 确保所有文字元素都有正确的字体样式
          const textElements = clonedCard.querySelectorAll("*");
          textElements.forEach((el) => {
            const computedStyle = clonedDoc.defaultView?.getComputedStyle(el);
            if (computedStyle) {
              // 强制应用字体相关属性
              el.style.setProperty("font-family", computedStyle.fontFamily, "important");
              el.style.setProperty("font-size", computedStyle.fontSize, "important");
              el.style.setProperty("font-weight", computedStyle.fontWeight, "important");
              el.style.setProperty("font-style", computedStyle.fontStyle, "important");
              el.style.setProperty("line-height", computedStyle.lineHeight, "important");
              el.style.setProperty("letter-spacing", computedStyle.letterSpacing, "important");
              // 文字渲染优化
              el.style.setProperty("-webkit-font-smoothing", "antialiased", "important");
              el.style.setProperty("-moz-osx-font-smoothing", "grayscale", "important");
              el.style.setProperty("text-rendering", "optimizeLegibility", "important");
            }
          });
        }

        // 使用统一的预览处理器清理克隆文档
        this.processor.cleanupClonedDoc(clonedDoc, cardBackground, theme);
        if (isVertical) {
          this.processor.processVerticalLayout(clonedDoc);
        }
      },
    };
  }

  /**
   * 获取选中的导出格式
   * @returns {string[]} 选中的格式数组，如 ['png', 'jpeg']
   */
  getSelectedFormats() {
    const checkboxes = this.dom.exportFormatCheckboxes;
    if (!checkboxes || checkboxes.length === 0) {
      // 如果没有找到复选框，返回默认格式
      return this.state.exportFormats || ["png"];
    }

    const selected = Array.from(checkboxes)
      .filter((cb) => cb.checked)
      .map((cb) => cb.value);

    return selected.length > 0 ? selected : this.state.exportFormats || ["png"];
  }

  /**
   * 下载 canvas 为指定格式
   * @param {HTMLCanvasElement} canvas - 要下载的 canvas
   * @param {string} [format='png'] - 格式：'png', 'jpeg', 'webp'
   */
  downloadCanvas(canvas, format = DEFAULT_EXPORT_FORMAT) {
    const link = document.createElement("a");
    const timestamp = Date.now();
    let mimeType;
    let quality = 1.0;
    let extension = format;

    switch (format.toLowerCase()) {
      case "png":
        mimeType = "image/png";
        quality = 1.0;
        break;
      case "jpeg":
      case "jpg":
        mimeType = "image/jpeg";
        quality = 0.92; // JPEG 质量
        extension = "jpg";
        break;
      case "webp":
        mimeType = "image/webp";
        quality = 0.9; // WebP 质量
        break;
      case "svg":
        // SVG 需要特殊处理，从 DOM 生成
        this.downloadSVG();
        return;
      default:
        mimeType = "image/png";
        extension = "png";
    }

    link.download = `book-excerpt-${timestamp}.${extension}`;
    link.href = canvas.toDataURL(mimeType, quality);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * 下载 SVG 格式（需要从 DOM 生成）
   * @private
   */
  downloadSVG() {
    const card = this.dom.card;
    if (!card) return;

    // 克隆卡片元素
    const clonedCard = card.cloneNode(true);

    // 获取卡片样式
    const computedStyle = window.getComputedStyle(card);
    const cardRect = card.getBoundingClientRect();

    // 创建 SVG
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    svg.setAttribute("width", `${this.state.cardWidth}`);
    svg.setAttribute("height", `${cardRect.height * (this.state.cardWidth / cardRect.width)}`);

    // 创建 foreignObject 来嵌入 HTML
    const foreignObject = document.createElementNS("http://www.w3.org/2000/svg", "foreignObject");
    foreignObject.setAttribute("width", "100%");
    foreignObject.setAttribute("height", "100%");

    // 设置克隆卡片的样式
    clonedCard.style.width = `${this.state.cardWidth}px`;
    clonedCard.style.height = "auto";
    clonedCard.style.margin = "0";
    clonedCard.style.padding = computedStyle.padding;
    clonedCard.style.backgroundColor = computedStyle.backgroundColor;
    clonedCard.style.color = computedStyle.color;
    clonedCard.style.fontFamily = computedStyle.fontFamily;
    clonedCard.style.fontSize = computedStyle.fontSize;

    foreignObject.appendChild(clonedCard);
    svg.appendChild(foreignObject);

    // 转换为字符串并下载
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svg);
    const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.download = `book-excerpt-${Date.now()}.svg`;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
