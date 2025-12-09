/**
 * 统一预览处理器
 * 确保缩略图、移动预览、导出都使用完全相同的处理逻辑，保证体验一致
 */
import { getThemes } from "./config.js";

export class PreviewProcessor {
  constructor(state) {
    this.state = state;
  }

  /**
   * 获取卡片背景样式
   */
  getCardBackground(card) {
    const currentTheme = getThemes().find((t) => t.id === this.state.theme);
    const cardComputedStyle = window.getComputedStyle(card);
    return {
      background: currentTheme?.background || cardComputedStyle.background,
      backgroundColor: currentTheme?.color || cardComputedStyle.backgroundColor,
      backgroundImage: currentTheme?.background || cardComputedStyle.backgroundImage,
      color: cardComputedStyle.color,
      theme: currentTheme,
    };
  }

  /**
   * 统一的克隆文档清理方法
   * 用于缩略图、导出等所有需要html2canvas的场景
   */
  cleanupClonedDoc(clonedDoc, cardBackground, theme) {
    // 添加全局样式覆盖，强制禁用所有移动端样式和 transform
    // 使用更高的优先级覆盖移动端媒体查询
    const globalOverrideStyle = clonedDoc.createElement("style");
    globalOverrideStyle.textContent = `
      /* 强制覆盖移动端样式，确保导出时不受影响 */
      /* 基础样式覆盖 */
      .preview-area {
        transform: none !important;
        transform-origin: center center !important;
        position: relative !important;
        width: auto !important;
        height: auto !important;
        min-height: auto !important;
        max-height: none !important;
        padding: 0 !important;
        margin: 0 !important;
        left: auto !important;
        top: auto !important;
        right: auto !important;
        bottom: auto !important;
        z-index: auto !important;
        border: none !important;
        border-radius: 0 !important;
        box-shadow: none !important;
        opacity: 1 !important;
        overflow: visible !important;
        background: transparent !important;
        display: flex !important;
        align-items: flex-start !important;
        justify-content: center !important;
      }
      .preview-area::before {
        display: none !important;
      }
      .preview-wrapper {
        transform: none !important;
        transform-origin: center center !important;
        width: 100% !important;
        max-width: none !important;
        padding: 0 !important;
        margin: 0 !important;
      }
      #card-preview {
        transform: none !important;
        position: relative !important;
        margin: 0 auto !important;
        max-width: none !important;
      }
      /* 覆盖移动端媒体查询 */
      @media screen and (max-width: 768px) {
        .preview-area {
          transform: none !important;
          transform-origin: center center !important;
          position: relative !important;
          width: auto !important;
          height: auto !important;
          min-height: auto !important;
          max-height: none !important;
          padding: 0 !important;
          margin: 0 !important;
          left: auto !important;
          top: auto !important;
          right: auto !important;
          bottom: auto !important;
          z-index: auto !important;
          border: none !important;
          border-radius: 0 !important;
          box-shadow: none !important;
          opacity: 1 !important;
          overflow: visible !important;
          background: transparent !important;
          display: flex !important;
          align-items: flex-start !important;
          justify-content: center !important;
        }
        .preview-wrapper {
          transform: none !important;
          transform-origin: center center !important;
          width: 100% !important;
          max-width: none !important;
          padding: 0 !important;
          margin: 0 !important;
        }
        #card-preview {
          transform: none !important;
          position: relative !important;
          margin: 0 auto !important;
          max-width: none !important;
        }
      }
      @media screen and (max-width: 380px) {
        #card-preview {
          transform: none !important;
        }
      }
    `;
    clonedDoc.head.appendChild(globalOverrideStyle);

    const previewArea = clonedDoc.querySelector(".preview-area");
    if (previewArea) {
      // 重置预览区域样式，确保导出时不受移动端 transform 影响
      previewArea.style.setProperty("background", "transparent", "important");
      previewArea.style.setProperty("transform", "none", "important");
      previewArea.style.setProperty("transform-origin", "center center", "important");
      previewArea.style.setProperty("position", "relative", "important");
      previewArea.style.setProperty("width", "auto", "important");
      previewArea.style.setProperty("height", "auto", "important");
      previewArea.style.setProperty("min-height", "auto", "important");
      previewArea.style.setProperty("max-height", "none", "important");
      previewArea.style.setProperty("padding", "0", "important");
      previewArea.style.setProperty("margin", "0", "important");
      previewArea.style.setProperty("left", "auto", "important");
      previewArea.style.setProperty("top", "auto", "important");
      previewArea.style.setProperty("right", "auto", "important");
      previewArea.style.setProperty("bottom", "auto", "important");
      previewArea.style.setProperty("z-index", "auto", "important");
      previewArea.style.setProperty("border", "none", "important");
      previewArea.style.setProperty("border-radius", "0", "important");
      previewArea.style.setProperty("box-shadow", "none", "important");
      previewArea.style.setProperty("opacity", "1", "important");
      previewArea.style.setProperty("overflow", "visible", "important");
    }

    // 重置 preview-wrapper 的样式
    const previewWrapper = clonedDoc.querySelector(".preview-wrapper");
    if (previewWrapper) {
      previewWrapper.style.setProperty("transform", "none", "important");
      previewWrapper.style.setProperty("transform-origin", "center center", "important");
      previewWrapper.style.setProperty("width", "100%", "important");
      previewWrapper.style.setProperty("max-width", "none", "important");
      previewWrapper.style.setProperty("padding", "0", "important");
      previewWrapper.style.setProperty("margin", "0", "important");
    }

    const card = clonedDoc.querySelector("#card-preview");
    if (card) {
      card.style.boxShadow = "none";
      // transform 可能用于动画，在导出时移除
      if (card.style.transform) {
        card.style.transform = "none";
      }
      // 确保卡片位置正常
      card.style.setProperty("position", "relative", "important");
      card.style.setProperty("margin", "0 auto", "important");
    }

    // 在克隆文档中注入主题样式，确保渐变正确渲染
    if (theme) {
      const themeStyle = clonedDoc.createElement("style");
      let themeCSS = "";

      if (theme.background) {
        // 渐变背景 - 确保完全不透明
        themeCSS = `#card-preview { 
          background: ${theme.background} !important; 
          background-color: transparent !important;
          background-size: cover !important; 
          background-repeat: no-repeat !important; 
          background-position: center !important;
          opacity: 1 !important;
        }`;
      } else if (theme.color) {
        // 纯色背景
        themeCSS = `#card-preview { 
          background-color: ${theme.color} !important; 
          background: ${theme.color} !important; 
          opacity: 1 !important;
        }`;
      }

      if (themeCSS) {
        themeStyle.textContent = themeCSS;
        clonedDoc.head.appendChild(themeStyle);
      }
    }

    // 确保卡片背景样式正确保留（包括渐变）
    const clonedCard = clonedDoc.getElementById("card-preview");
    if (clonedCard) {
      // 确保卡片完全不透明
      clonedCard.style.opacity = "1";
      clonedCard.style.setProperty("opacity", "1", "important");

      // 优先使用主题配置（通过内联样式确保优先级）
      if (theme) {
        if (theme.background) {
          // 渐变背景 - 直接设置 background 属性，确保完全不透明
          clonedCard.style.setProperty("background", theme.background, "important");
          clonedCard.style.setProperty("background-color", "transparent", "important");
          clonedCard.style.setProperty("background-size", "cover", "important");
          clonedCard.style.setProperty("background-repeat", "no-repeat", "important");
          clonedCard.style.setProperty("background-position", "center", "important");
          clonedCard.style.setProperty("background-clip", "border-box", "important");
        } else if (theme.color) {
          // 纯色背景
          clonedCard.style.setProperty("background-color", theme.color, "important");
          clonedCard.style.setProperty("background", theme.color, "important");
        }
      } else if (cardBackground) {
        // 回退到计算样式
        if (
          cardBackground.background &&
          cardBackground.background !== "none" &&
          !cardBackground.background.includes("rgba(0, 0, 0, 0)")
        ) {
          clonedCard.style.setProperty("background", cardBackground.background, "important");
        }
        if (
          cardBackground.backgroundColor &&
          cardBackground.backgroundColor !== "rgba(0, 0, 0, 0)" &&
          cardBackground.backgroundColor !== "transparent"
        ) {
          clonedCard.style.setProperty(
            "background-color",
            cardBackground.backgroundColor,
            "important"
          );
        }
        if (cardBackground.backgroundImage && cardBackground.backgroundImage !== "none") {
          clonedCard.style.setProperty(
            "background-image",
            cardBackground.backgroundImage,
            "important"
          );
          clonedCard.style.setProperty("background-size", "cover", "important");
          clonedCard.style.setProperty("background-repeat", "no-repeat", "important");
          clonedCard.style.setProperty("background-position", "center", "important");
        }
      }

      // 设置文字颜色 - 优先使用状态中的字体颜色
      if (this.state.fontColor) {
        const textContent = clonedCard.querySelector(".text-content");
        if (textContent) {
          textContent.style.color = this.state.fontColor;
        }
      } else if (cardBackground?.color) {
        clonedCard.style.color = cardBackground.color;
      }

      // 强制应用样式，确保 html2canvas 能捕获
      clonedCard.style.display = "block";
      clonedCard.style.visibility = "visible";
      clonedCard.style.opacity = "1";

      // 确保卡片有明确的尺寸
      if (!clonedCard.style.width) {
        clonedCard.style.width = `${this.state.cardWidth || 400}px`;
      }
    }
  }

  /**
   * 统一的竖排布局处理方法
   * @param {Document|Object} clonedDoc - 克隆的文档对象，或包含 getElementById 和 createElement 方法的虚拟文档对象
   */
  processVerticalLayout(clonedDoc) {
    const clonedCard = clonedDoc.getElementById("card-preview");
    if (!clonedCard) return;

    const clonedBody = clonedCard.querySelector(".card-body");
    const clonedText = clonedCard.querySelector(".text-content");

    if (!clonedBody || !clonedText) return;

    // 从原始文档获取样式，因为克隆文档中的元素可能无法正确获取样式
    const originalCard = document.getElementById("card-preview");
    const originalText = originalCard?.querySelector(".text-content");
    const textElement = originalText || clonedText;
    const computedStyle = window.getComputedStyle(textElement);
    const fontSize = computedStyle.fontSize || "20px";
    const fontFamily = computedStyle.fontFamily || "inherit";
    // 优先使用状态中的字体颜色，如果没有则使用计算样式
    const color = this.state.fontColor || computedStyle.color || "#333";

    let lineHeightVal = parseFloat(computedStyle.lineHeight);
    if (isNaN(lineHeightVal)) {
      lineHeightVal = parseFloat(fontSize) * 1.8;
    } else if (computedStyle.lineHeight.includes("px")) {
      lineHeightVal = lineHeightVal;
    } else {
      lineHeightVal = parseFloat(fontSize) * lineHeightVal;
    }

    let text = clonedText.textContent || clonedText.innerText || "";
    text = text.replace(/\n/g, " ").replace(/\s+/g, " ").trim();
    const chars = text.split("");

    // 动态计算最大高度：使用卡片实际高度，而不是固定值
    // 获取卡片或 card-body 的实际高度
    const cardHeight = clonedCard.offsetHeight || clonedCard.scrollHeight;
    const bodyHeight = clonedBody.offsetHeight || clonedBody.scrollHeight;
    // 减去头部和底部信息的高度（日期、书名、作者、印章等），大约预留 150px
    const maxHeight = Math.max(300, (cardHeight || bodyHeight) - 150);
    const charsPerColumn = Math.floor(maxHeight / lineHeightVal) || 10;

    const textContainer = clonedDoc.createElement("div");
    textContainer.style.cssText = `
                  display: flex;
                  flex-direction: row-reverse;
                  justify-content: center;
                  align-items: flex-start;
                  width: 100%;
                  height: 100%;
                  position: relative;
                `;

    for (let i = 0; i < chars.length; i += charsPerColumn) {
      const column = clonedDoc.createElement("div");
      column.style.cssText = `
                    display: flex;
                    flex-direction: column;
                    align-items: center;
        margin: 0 4px;
                  `;

      const columnChars = chars.slice(i, i + charsPerColumn);
      columnChars.forEach((char) => {
        const charSpan = clonedDoc.createElement("span");
        charSpan.textContent = char;
        charSpan.style.cssText = `
                      display: block;
                      font-size: ${fontSize};
                      font-family: ${fontFamily};
                      line-height: ${lineHeightVal}px;
                      color: ${color};
                      text-align: center;
          min-width: 1em;
                    `;
        column.appendChild(charSpan);
      });

      textContainer.appendChild(column);
    }

    clonedText.style.display = "none";
    clonedBody.insertBefore(textContainer, clonedText);
    clonedBody.style.alignItems = "center";

    // 修复引号位置
    const startMark = clonedCard.querySelector(".quote-mark.start");
    const endMark = clonedCard.querySelector(".quote-mark.end");
    if (startMark) {
      startMark.style.position = "absolute";
      startMark.style.top = "10px";
      startMark.style.right = "20px";
      startMark.style.alignSelf = "auto";
      startMark.style.margin = "0";
    }
    if (endMark) {
      endMark.style.position = "absolute";
      endMark.style.bottom = "10px";
      endMark.style.left = "20px";
      endMark.style.alignSelf = "auto";
      endMark.style.margin = "0";
    }
  }

  /**
   * 获取html2canvas的backgroundColor选项
   */
  getBackgroundColor(cardBackground, theme) {
    if (theme?.background) {
      // 渐变背景：不设置背景色，让渐变完全显示
      return null;
    } else if (cardBackground) {
      // 纯色背景：使用实际背景色
      if (cardBackground.backgroundImage && cardBackground.backgroundImage !== "none") {
        return null;
      } else {
        return cardBackground.backgroundColor || null;
      }
    }
    return null;
  }
}
