/**
 * 书摘生成器 - 主应用
 * 模块化重构版本
 */

// ==================== 配置常量 ====================
const CONFIG = {
  THUMBNAIL_UPDATE_DELAY: 300,
  DOWNLOAD_DELAY: 300,
  DRAG_THRESHOLD: 5,
  ANIMATION_DURATION: {
    FAST: 150,
    BASE: 200,
    SLOW: 300,
  },
  CANVAS_SCALE: 2,
  THUMBNAIL_SCALE: 0.95,
};

// ==================== 数据配置 ====================
const THEMES = [
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

const FONTS = [
  { id: "noto-serif", value: "'Noto Serif SC', serif", name: "宋体", subtitle: "标准" },
  { id: "ma-shan-zheng", value: "'Ma Shan Zheng', cursive", name: "马善政", subtitle: "毛笔" },
  { id: "zhi-mang-xing", value: "'Zhi Mang Xing', cursive", name: "志莽行书", subtitle: "行书" },
  { id: "long-cang", value: "'Long Cang', cursive", name: "龙苍行书", subtitle: "行书" },
];

const FONT_COLORS = [
  { id: "color-black", value: "#1a1a1a", name: "黑色" },
  { id: "color-gray", value: "#666666", name: "灰色" },
  { id: "color-dark-gray", value: "#333333", name: "深灰" },
  { id: "color-brown", value: "#5d4037", name: "棕色" },
  { id: "color-dark-blue", value: "#1e3a5f", name: "深蓝" },
  { id: "color-dark-green", value: "#2e7d32", name: "深绿" },
  { id: "color-red", value: "#c62828", name: "红色" },
  { id: "color-purple", value: "#6a1b9a", name: "紫色" },
];

const FONT_SIZE_MIN = 14;
const FONT_SIZE_MAX = 32;
const FONT_SIZE_STEP = 2;
const CARD_WIDTH_MIN = 300;
const CARD_WIDTH_MAX = 600;
const CARD_WIDTH_STEP = 30;

// ==================== 状态管理 ====================
class AppState {
  constructor() {
    this.theme = "theme-clean";
    this.layout = "horizontal";
    this.font = "'Noto Serif SC', serif";
    this.fontSize = 20;
    this.fontColor = "#1a1a1a"; // 默认黑色
    this.cardWidth = 400; // 默认值，对应滑块中间位置
    this.zoom = 1;
    this.thumbnailPosition = null;
  }

  update(updates) {
    Object.assign(this, updates);
  }
}

// ==================== 工具函数 ====================
const Utils = {
  // 防抖函数
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  // 节流函数
  throttle(func, limit) {
    let inThrottle;
    return function executedFunction(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  },

  // 格式化日期
  formatDate(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}.${month}.${day}`;
  },

  // 创建加载动画样式
  createLoadingStyles() {
    if (!document.getElementById("loading-styles")) {
      const style = document.createElement("style");
      style.id = "loading-styles";
      style.textContent = `
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);
    }
  },
};

// ==================== DOM 元素管理 ====================
class DOMManager {
  constructor() {
    this.elements = {};
    this.init();
  }

  init() {
    this.elements = {
      // 输入元素
      quoteInput: document.getElementById("quote-text"),
      bookInput: document.getElementById("book-title"),
      authorInput: document.getElementById("author-text"),
      sealInput: document.getElementById("seal-text"),

      // 控制元素
      themeGrid: document.getElementById("theme-grid"),
      fontColorGrid: document.getElementById("font-color-grid"),
      fontGrid: document.getElementById("font-grid"),
      fontSizeSlider: document.getElementById("font-size-slider"),
      fontSizeValue: document.getElementById("font-size-value"),
      cardWidthSlider: document.getElementById("card-width-slider"),
      cardWidthValue: document.getElementById("card-width-value"),
      layoutRadios: document.querySelectorAll('input[name="layout"]'),
      downloadBtn: document.getElementById("download-btn"),

      // 预览元素
      card: document.getElementById("card-preview"),
      previewText: document.getElementById("preview-text"),
      previewBook: document.getElementById("preview-book"),
      previewAuthor: document.getElementById("preview-author"),
      previewSeal: document.getElementById("preview-seal"),
      currentDate: document.getElementById("current-date"),
      previewThumbnail: document.getElementById("preview-thumbnail"),
      previewWrapper: document.getElementById("preview-wrapper"),
      previewArea: document.getElementById("preview-area"),
      mobilePreviewBtn: document.getElementById("mobile-preview-btn"),
      mobilePreviewContainer: document.getElementById("mobile-preview-container"),
    };
  }

  get(id) {
    return this.elements[id];
  }
}

// ==================== 渲染器 ====================
class Renderer {
  constructor(dom, state) {
    this.dom = dom;
    this.state = state;
  }

  renderThemeGrid() {
    const grid = this.dom.get("themeGrid");
    if (!grid) return;

    grid.innerHTML = "";
    THEMES.forEach((theme) => {
      const div = document.createElement("div");
      div.className = `theme-option ${theme.id === this.state.theme ? "active" : ""}`;
      div.dataset.theme = theme.id;

      if (theme.background) {
        div.style.background = theme.background;
      } else {
        div.style.backgroundColor = theme.color;
        if (theme.border) {
          div.style.border = `1px solid ${theme.border}`;
        }
      }

      div.addEventListener("click", () => this.onThemeChange(theme.id));
      grid.appendChild(div);
    });
  }

  renderFontColorGrid() {
    const grid = this.dom.get("fontColorGrid");
    if (!grid) return;

    grid.innerHTML = "";
    FONT_COLORS.forEach((color) => {
      const div = document.createElement("button");
      div.className = `color-option ${color.value === this.state.fontColor ? "active" : ""}`;
      div.dataset.color = color.value;
      div.style.backgroundColor = color.value;
      div.title = color.name;
      div.setAttribute("aria-label", `选择${color.name}`);
      div.addEventListener("click", () => this.onFontColorChange(color.value));
      grid.appendChild(div);
    });
  }

  renderFontGrid() {
    const grid = this.dom.get("fontGrid");
    if (!grid) return;

    grid.innerHTML = "";
    FONTS.forEach((font) => {
      const btn = document.createElement("button");
      btn.className = `font-option-btn ${font.value === this.state.font ? "active" : ""}`;
      btn.dataset.font = font.value;
      btn.style.fontFamily = font.value;
      btn.textContent = font.name;
      btn.title = font.subtitle ? `${font.name} (${font.subtitle})` : font.name;
      btn.addEventListener("click", () => this.onFontChange(font.value));
      grid.appendChild(btn);
    });
  }

  renderSizeOptions() {
    this.renderFontSizeSlider();
    this.renderCardWidthSlider();
  }

  renderFontSizeSlider() {
    const slider = this.dom.get("fontSizeSlider");
    const valueDisplay = this.dom.get("fontSizeValue");
    if (!slider) return;

    // 设置滑块初始值
    slider.min = FONT_SIZE_MIN;
    slider.max = FONT_SIZE_MAX;
    slider.step = FONT_SIZE_STEP;
    slider.value = this.state.fontSize;

    // 更新显示值
    if (valueDisplay) {
      valueDisplay.textContent = `${this.state.fontSize}px`;
    }

    // 绑定输入事件
    slider.addEventListener("input", (e) => {
      const size = parseInt(e.target.value, 10);
      if (valueDisplay) {
        valueDisplay.textContent = `${size}px`;
      }
      this.onFontSizeChange(size);
    });

    // 阻止滑块事件冒泡，防止触发缩略图拖动
    slider.addEventListener("mousedown", (e) => {
      e.stopPropagation();
    });

    slider.addEventListener("touchstart", (e) => {
      e.stopPropagation();
    });

    slider.addEventListener("touchmove", (e) => {
      e.stopPropagation();
    });

    slider.addEventListener("touchend", (e) => {
      e.stopPropagation();
    });
  }

  renderCardWidthSlider() {
    const slider = this.dom.get("cardWidthSlider");
    const valueDisplay = this.dom.get("cardWidthValue");
    if (!slider) return;

    // 设置滑块初始值
    slider.min = CARD_WIDTH_MIN;
    slider.max = CARD_WIDTH_MAX;
    slider.step = CARD_WIDTH_STEP;
    slider.value = this.state.cardWidth;

    // 更新显示值
    if (valueDisplay) {
      valueDisplay.textContent = `${this.state.cardWidth}px`;
    }

    // 绑定输入事件
    slider.addEventListener("input", (e) => {
      const width = parseInt(e.target.value, 10);
      if (valueDisplay) {
        valueDisplay.textContent = `${width}px`;
      }
      this.onCardWidthChange(width);
    });

    // 阻止滑块事件冒泡，防止触发缩略图拖动
    slider.addEventListener("mousedown", (e) => {
      e.stopPropagation();
    });

    slider.addEventListener("touchstart", (e) => {
      e.stopPropagation();
    });

    slider.addEventListener("touchmove", (e) => {
      e.stopPropagation();
    });

    slider.addEventListener("touchend", (e) => {
      e.stopPropagation();
    });
  }

  // 事件回调 - 由主应用设置
  onThemeChange() {}
  onFontChange() {}
  onFontSizeChange() {}
  onFontColorChange() {}
  onCardWidthChange() {}
}

// ==================== 预览管理器 ====================
class PreviewManager {
  constructor(dom, state) {
    this.dom = dom;
    this.state = state;
  }

  updatePreview() {
    const { previewText, previewBook, previewAuthor, quoteInput, bookInput, authorInput } =
      this.dom.elements;
    if (!previewText || !previewBook || !previewAuthor) return;

    previewText.style.opacity = "0.5";
    setTimeout(() => {
      previewText.textContent = quoteInput?.value || "请输入摘录内容...";
      previewBook.textContent = bookInput?.value || "书名";
      previewAuthor.textContent = authorInput?.value || "作者";

      if (this.state.font) {
        previewText.style.fontFamily = this.state.font;
      }
      if (this.state.fontSize) {
        previewText.style.fontSize = `${this.state.fontSize}px`;
      }
      previewText.style.opacity = "1";
    }, 100);
  }

  updateSeal() {
    const seal = this.dom.get("previewSeal");
    const input = this.dom.get("sealInput");
    if (!seal || !input) return;

    const text = input.value || "印章";
    const len = text.length;

    seal.style.writingMode = "horizontal-tb";
    seal.style.lineHeight = "1";
    seal.style.display = "flex";
    seal.style.alignItems = "center";
    seal.style.justifyContent = "center";
    seal.style.textAlign = "center";
    seal.style.margin = "0 auto";

    if (len === 1) {
      seal.innerHTML = `<span style="font-size: 28px;display:block;">${text}</span>`;
    } else if (len === 2) {
      seal.innerHTML = `<div style="display:flex;flex-direction:column;line-height:1.2;align-items:center;justify-content:center;height:100%;"><span style="font-size:18px;">${text[0]}</span><span style="font-size:18px;">${text[1]}</span></div>`;
    } else if (len === 3) {
      seal.innerHTML = `
        <div style="display:flex;flex-direction:row-reverse;height:100%;width:100%;align-items:center;justify-content:center;">
          <div style="flex:1;display:flex;align-items:center;justify-content:center;height:100%;font-size:16px;">${text[0]}</div>
          <div style="flex:1;display:flex;flex-direction:column;height:100%;align-items:center;justify-content:center;">
            <div style="flex:1;display:flex;align-items:center;justify-content:center;font-size:16px;">${text[1]}</div>
            <div style="flex:1;display:flex;align-items:center;justify-content:center;font-size:16px;">${text[2]}</div>
          </div>
        </div>`;
    } else {
      seal.innerHTML = `
        <div style="display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;width:100%;height:100%;align-items:center;justify-items:center;gap:2px;">
          <span style="font-size:16px;display:flex;align-items:center;justify-content:center;">${text[0]}</span>
          <span style="font-size:16px;display:flex;align-items:center;justify-content:center;">${text[1]}</span>
          <span style="font-size:16px;display:flex;align-items:center;justify-content:center;">${text[2]}</span>
          <span style="font-size:16px;display:flex;align-items:center;justify-content:center;">${text[3]}</span>
        </div>`;
    }
  }

  setTheme(themeId) {
    const card = this.dom.get("card");
    if (!card || this.state.theme === themeId) return;

    this.state.update({ theme: themeId });
    card.style.opacity = "0.8";
    card.style.transform = "scale(0.98)";

    setTimeout(() => {
      card.className = `card ${themeId} ${this.state.layout === "vertical" ? "vertical-mode" : ""}`;
      card.style.opacity = "1";
      card.style.transform = "scale(1)";
    }, CONFIG.ANIMATION_DURATION.FAST);

    document.querySelectorAll(".theme-option").forEach((el) => {
      el.classList.toggle("active", el.dataset.theme === themeId);
    });
  }

  setLayout(layout) {
    const card = this.dom.get("card");
    if (!card || this.state.layout === layout) return;

    this.state.update({ layout });
    card.style.opacity = "0.7";
    card.style.transform = "scale(0.95)";

    setTimeout(() => {
      card.classList.toggle("vertical-mode", layout === "vertical");
      card.style.opacity = "1";
      card.style.transform = "scale(1)";
    }, CONFIG.ANIMATION_DURATION.BASE);

    // 更新单选框状态
    this.dom.get("layoutRadios")?.forEach((radio) => {
      radio.checked = radio.value === layout;
    });
  }

  setFont(fontValue) {
    const previewText = this.dom.get("previewText");
    if (!previewText || this.state.font === fontValue) return;

    this.state.update({ font: fontValue });
    previewText.style.fontFamily = fontValue;

    document.querySelectorAll(".font-option-btn").forEach((el) => {
      el.classList.toggle("active", el.dataset.font === fontValue);
    });
  }

  setFontSize(size) {
    const previewText = this.dom.get("previewText");
    if (!previewText || this.state.fontSize === size) return;

    this.state.update({ fontSize: size });
    previewText.style.transition = "font-size 0.2s ease";
    previewText.style.fontSize = `${size}px`;

    // 更新滑块值
    const slider = this.dom.get("fontSizeSlider");
    if (slider) {
      slider.value = size;
    }

    // 更新显示值
    const valueDisplay = this.dom.get("fontSizeValue");
    if (valueDisplay) {
      valueDisplay.textContent = `${size}px`;
    }
  }

  setFontColor(colorValue) {
    const previewText = this.dom.get("previewText");
    if (!previewText || this.state.fontColor === colorValue) return;

    this.state.update({ fontColor: colorValue });
    previewText.style.transition = "color 0.2s ease";
    previewText.style.color = colorValue;

    document.querySelectorAll(".color-option").forEach((el) => {
      el.classList.toggle("active", el.dataset.color === colorValue);
    });
  }

  setCardWidth(width) {
    const card = this.dom.get("card");
    if (!card || this.state.cardWidth === width) return;

    this.state.update({ cardWidth: width });
    card.style.transition = "width 0.3s ease";
    card.style.width = `${width}px`;

    // 更新滑块值
    const slider = this.dom.get("cardWidthSlider");
    if (slider) {
      slider.value = width;
    }

    // 更新显示值
    const valueDisplay = this.dom.get("cardWidthValue");
    if (valueDisplay) {
      valueDisplay.textContent = `${width}px`;
    }
  }

  setZoom(zoom) {
    const wrapper = this.dom.get("previewWrapper");
    if (!wrapper) return;

    this.state.update({ zoom });
    wrapper.style.transition = "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)";
    wrapper.style.transform = `scale(${zoom})`;
  }
}

// ==================== 统一预览处理器 ====================
/**
 * 统一的预览处理管理器
 * 确保缩略图、移动预览、导出都使用完全相同的处理逻辑，保证体验一致
 */
class PreviewProcessor {
  constructor(state) {
    this.state = state;
  }

  /**
   * 获取卡片背景样式
   */
  getCardBackground(card) {
    const currentTheme = THEMES.find((t) => t.id === this.state.theme);
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
    const previewArea = clonedDoc.querySelector(".preview-area");
    if (previewArea) {
      previewArea.style.background = "transparent";
      const style = clonedDoc.createElement("style");
      style.textContent = `.preview-area::before { display: none !important; }`;
      clonedDoc.head.appendChild(style);
    }

    const wrapper = clonedDoc.querySelector(".preview-wrapper");
    if (wrapper) {
      wrapper.style.boxShadow = "none";
      wrapper.style.transform = "none";
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

    const maxHeight = 450;
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

// ==================== 缩略图管理器 ====================
class ThumbnailManager {
  constructor(dom, state) {
    this.dom = dom;
    this.state = state;
    this.processor = new PreviewProcessor(state); // 使用统一的预览处理器
    this.updateTimer = null;
    this.isFirstLoad = true; // 标记是否是首次加载
    this.updateThumbnail = Utils.debounce(
      this._updateThumbnail.bind(this),
      CONFIG.THUMBNAIL_UPDATE_DELAY
    );
  }

  _updateThumbnail() {
    const thumbnail = this.dom.get("previewThumbnail");
    const card = this.dom.get("card");
    const container = this.dom.get("mobilePreviewContainer");

    if (!thumbnail || !card || typeof html2canvas === "undefined" || !container) return;

    // 首次加载时，设置容器初始状态为透明
    if (this.isFirstLoad) {
      container.style.opacity = "0";
      container.style.transition = "none"; // 初始状态不使用过渡
    }

    // 保存位置
    const rect = container.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      this.state.thumbnailPosition = {
        x: rect.left,
        y: window.innerHeight - rect.bottom,
      };
    }

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
    const originalTransform = card.style.transform;
    const originalBoxShadow = card.style.boxShadow;
    const originalOpacity = card.style.opacity;

    // 临时移除样式
    card.style.transform = "none";
    card.style.boxShadow = "none";
    card.style.opacity = "1";

    const cardWidth = card.offsetWidth || this.state.cardWidth || 400;
    const cardHeight = card.offsetHeight || card.scrollHeight || 600;

    // 缩略图宽度固定（160px），高度自适应，最大高度为屏幕高度的1/2
    const thumbnailWidth = 160; // 固定宽度
    const maxThumbnailHeight = window.innerHeight * 0.5; // 最大高度为屏幕高度的1/2

    // 计算卡片的宽高比
    const cardAspectRatio = cardWidth / cardHeight;

    // 根据卡片宽高比计算缩略图的理想高度（保持宽高比）
    let idealThumbnailHeight = thumbnailWidth / cardAspectRatio;

    // 如果理想高度超过最大高度，需要缩放内容以适应容器
    let contentScale = 1;
    let actualThumbnailHeight = idealThumbnailHeight;

    if (idealThumbnailHeight > maxThumbnailHeight) {
      // 超过最大高度，计算内容缩放比例
      contentScale = maxThumbnailHeight / idealThumbnailHeight;
      actualThumbnailHeight = maxThumbnailHeight;
    }

    // 设置缩略图容器的实际高度
    container.style.height = `${actualThumbnailHeight}px`;

    // 计算html2canvas的缩放比例
    // 基础缩放：使卡片宽度适配缩略图宽度
    const baseScale = thumbnailWidth / cardWidth;
    // 应用内容缩放（如果需要）
    const scale = baseScale * contentScale * CONFIG.THUMBNAIL_SCALE;

    // 获取缩略图容器的实际尺寸（用于绘制canvas）
    const thumbnailHeight = actualThumbnailHeight;

    // 使用统一的预览处理器获取背景色
    const backgroundColor = this.processor.getBackgroundColor(cardBackground, currentTheme);

    html2canvas(card, {
      scale,
      useCORS: true,
      backgroundColor: backgroundColor,
      logging: false,
      allowTaint: false,
      width: cardWidth,
      height: cardHeight,
      willReadFrequently: true, // 优化多次读取性能
      // 使用统一的预览处理器，确保与导出完全一致
      onclone: (clonedDoc) => {
        this.processor.cleanupClonedDoc(clonedDoc, cardBackground, currentTheme);
        // 处理竖排布局（使用统一的处理方法）
        const isVertical = this.state.layout === "vertical";
        if (isVertical) {
          this.processor.processVerticalLayout(clonedDoc);
        }
      },
    })
      .then((canvas) => {
        thumbnail.innerHTML = "";
        const thumbnailCanvas = document.createElement("canvas");
        thumbnailCanvas.width = thumbnailWidth;
        thumbnailCanvas.height = thumbnailHeight;
        const ctx = thumbnailCanvas.getContext("2d", { willReadFrequently: true });

        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, thumbnailWidth, thumbnailHeight);

        // 计算缩放后的卡片尺寸
        const scaledWidth = cardWidth * scale;
        const scaledHeight = cardHeight * scale;

        // 居中绘制（如果内容缩放后小于容器，则居中显示）
        const x = (thumbnailWidth - scaledWidth) / 2;
        const y = (thumbnailHeight - scaledHeight) / 2;

        ctx.drawImage(canvas, x, y, scaledWidth, scaledHeight);
        thumbnail.appendChild(thumbnailCanvas);

        // 恢复样式
        card.style.transform = originalTransform;
        card.style.boxShadow = originalBoxShadow;
        card.style.opacity = originalOpacity;

        // 恢复位置
        this.restorePosition();

        // 首次加载时，添加淡入动画
        if (this.isFirstLoad && container) {
          // 强制浏览器重新计算，确保初始状态被记录
          void container.offsetWidth;

          // 应用过渡并淡入
          container.style.transition = `opacity ${CONFIG.ANIMATION_DURATION.SLOW}ms cubic-bezier(0.4, 0, 0.2, 1)`;
          container.style.opacity = "1";

          // 标记首次加载完成
          this.isFirstLoad = false;
        }
      })
      .catch((err) => {
        console.error("Thumbnail generation failed:", err);
        card.style.transform = originalTransform;
        card.style.boxShadow = originalBoxShadow;
        card.style.opacity = originalOpacity;
      });
  }

  /**
   * 计算并设置缩略图位置
   * 诉求：缩略图的右下角应该在下载按钮的上方
   */
  restorePosition() {
    const container = this.dom.get("mobilePreviewContainer");
    if (!container) return;

    const downloadFab = document.getElementById("download-fab");
    if (!downloadFab) {
      // 如果找不到下载按钮，使用默认位置
      const spacingXl = 32;
      container.style.left = "auto";
      container.style.right = `${spacingXl}px`;
      container.style.bottom = `${spacingXl + 72}px`;
      return;
    }

    // 获取下载按钮的位置
    const fabRect = downloadFab.getBoundingClientRect();

    // 获取容器的尺寸
    const containerRect = container.getBoundingClientRect();
    const containerWidth = containerRect.width || 200;
    const containerHeight = containerRect.height || 200;

    // 间距：缩略图右下角与下载按钮顶部之间的间距
    const spacing = 8; // 8px

    // 计算位置：
    // - right: 与下载按钮右对齐（窗口宽度 - 下载按钮右边缘）
    // - bottom: 下载按钮的 top + 间距（这样缩略图的右下角就在下载按钮上方）
    const rightValue = window.innerWidth - fabRect.right;
    const bottomValue = window.innerHeight - fabRect.top + spacing;

    // 设置位置
    container.style.left = "auto";
    container.style.right = `${rightValue}px`;
    container.style.bottom = `${bottomValue}px`;
    container.style.transition = "left 0.3s ease, bottom 0.3s ease, right 0.3s ease";

    // 保存位置信息
    this.state.thumbnailPosition = {
      right: rightValue,
      bottom: bottomValue,
    };
  }
}

// ==================== 下载管理器 ====================
class DownloadManager {
  constructor(dom, state, previewManager) {
    this.dom = dom;
    this.state = state;
    this.previewManager = previewManager;
    this.processor = new PreviewProcessor(state); // 使用统一的预览处理器
  }

  async download() {
    const card = this.dom.get("card");
    const downloadBtn = this.dom.get("downloadBtn");
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
      await new Promise((resolve) => setTimeout(resolve, CONFIG.DOWNLOAD_DELAY));

      const options = this.getCanvasOptions(cardBackground, currentTheme);
      const canvas = await html2canvas(card, options);

      // 恢复样式
      this.restoreCardStyles(card, originalStyles);
      this.previewManager.setZoom(originalZoom);

      // 下载
      this.downloadCanvas(canvas);
      this.setLoadingState(downloadBtn, false, true);
    } catch (err) {
      console.error("Export failed:", err);
      alert("生成图片失败：" + (err.message || "未知错误") + "\n请重试或检查浏览器控制台");
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

  saveCardStyles(card) {
    return {
      transform: card.style.transform,
      boxShadow: card.style.boxShadow,
      position: card.style.position,
      zIndex: card.style.zIndex,
    };
  }

  restoreCardStyles(card, styles) {
    Object.assign(card.style, styles);
  }

  prepareCardForCapture(card) {
    card.style.transform = "none";
    card.style.boxShadow = "none";
    card.style.position = "relative";
    card.style.zIndex = "9999";
  }

  getCanvasOptions(cardBackground, theme) {
    const isVertical = this.state.layout === "vertical";

    // 使用统一的预览处理器获取背景色
    const backgroundColor = this.processor.getBackgroundColor(cardBackground, theme);

    const options = {
      scale: CONFIG.CANVAS_SCALE,
      useCORS: true,
      backgroundColor: backgroundColor,
      logging: false,
      allowTaint: false,
      willReadFrequently: true, // 优化多次读取性能
      // 使用统一的预览处理器，确保与缩略图完全一致
      onclone: (clonedDoc) => {
        this.processor.cleanupClonedDoc(clonedDoc, cardBackground, theme);
        if (isVertical) {
          this.processor.processVerticalLayout(clonedDoc);
        }
      },
    };
    return options;
  }

  downloadCanvas(canvas) {
    const link = document.createElement("a");
    link.download = `book-excerpt-${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png", 1.0);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

// ==================== 移动端预览管理器 ====================
class MobilePreviewManager {
  constructor(dom) {
    this.dom = dom;
    this.init();
  }

  init() {
    const container = this.dom.get("mobilePreviewContainer");
    const btn = this.dom.get("mobilePreviewBtn");
    const previewArea = this.dom.get("previewArea");
    if (!container || !btn || !previewArea) return;

    // 点击切换预览 - 使用 touchend 事件，更可靠
    container.addEventListener("touchend", (e) => {
      // 如果拖动被禁用（预览模式下），直接切换预览
      if (container._dragDisabled) {
        e.preventDefault();
        this.togglePreview(previewArea);
        return;
      }

      // 检查是否是拖动（移动距离超过阈值）
      const touch = e.changedTouches[0];
      if (touch) {
        const deltaX = Math.abs(touch.clientX - (container._startX || 0));
        const deltaY = Math.abs(touch.clientY - (container._startY || 0));

        // 如果移动距离很小，认为是点击
        if (deltaX < CONFIG.DRAG_THRESHOLD && deltaY < CONFIG.DRAG_THRESHOLD) {
          e.preventDefault();
          this.togglePreview(previewArea);
        }
      }
    });

    // 保存触摸开始位置
    container.addEventListener("touchstart", (e) => {
      // 如果拖动被禁用（预览模式下），不保存位置
      if (container._dragDisabled) {
        return;
      }
      const touch = e.touches[0];
      if (touch) {
        container._startX = touch.clientX;
        container._startY = touch.clientY;
      }
    });

    // 也支持鼠标点击（桌面端测试）
    container.addEventListener("click", (e) => {
      // 如果拖动被禁用（预览模式下），直接切换预览
      if (container._dragDisabled) {
        e.preventDefault();
        this.togglePreview(previewArea);
        return;
      }
      // 允许点击容器内的任何元素（包括缩略图和按钮）都能触发预览
      this.togglePreview(previewArea);
    });

    // 按钮点击事件（作为备用）
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (!container._dragDisabled) {
        this.togglePreview(previewArea);
      }
    });

    // 点击预览页任何地方都关闭预览
    previewArea.addEventListener("click", (e) => {
      if (!previewArea.classList.contains("active")) return;
      e.stopPropagation();
      e.preventDefault();
      this.closePreview(previewArea);
    });

    // ESC 键关闭
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && previewArea.classList.contains("active")) {
        this.closePreview(previewArea);
      }
    });

    // 滑动关闭
    this.initSwipeToClose(previewArea);
  }

  togglePreview(previewArea) {
    const isActive = previewArea.classList.contains("active");
    if (isActive) {
      this.closePreview(previewArea);
    } else {
      this.openPreview(previewArea);
    }
  }

  openPreview(previewArea) {
    const container = this.dom.get("mobilePreviewContainer");
    const previewWrapper = this.dom.get("previewWrapper");
    const sidebar = document.querySelector(".sidebar");
    if (!container || !previewWrapper) return;

    // 获取缩略图的当前位置和尺寸（动画起始位置）
    const rect = container.getBoundingClientRect();
    const currentLeft = rect.left;
    const currentTop = rect.top;
    const currentWidth = rect.width;
    const currentHeight = rect.height;
    const currentCenterX = currentLeft + currentWidth / 2;
    const currentCenterY = currentTop + currentHeight / 2;

    // 保存原始状态
    container._originalState = {
      width: `${currentWidth}px`,
      height: `${currentHeight}px`,
      left: `${currentLeft}px`,
      bottom: `${window.innerHeight - rect.bottom}px`,
      top: `${currentTop}px`,
      opacity: "1",
      transform: "none",
    };

    // 获取屏幕尺寸
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const screenCenterX = screenWidth / 2;
    const screenCenterY = screenHeight / 2;

    // 计算缩放比例（使缩略图放大到覆盖全屏）
    const scaleX = screenWidth / currentWidth;
    const scaleY = screenHeight / currentHeight;
    const finalScale = Math.max(scaleX, scaleY) * 1.05; // 稍微放大确保覆盖

    // 计算预览内容的初始缩放（与缩略图大小一致）
    const previewAreaRect = previewArea.getBoundingClientRect();
    const previewContentWidth = previewAreaRect.width;
    const previewContentHeight = previewAreaRect.height;
    const initialScaleX = currentWidth / previewContentWidth;
    const initialScaleY = currentHeight / previewContentHeight;

    // 计算预览内容的初始位置（使预览内容中心与缩略图中心对齐）
    const initialTranslateX = currentCenterX - screenCenterX;
    const initialTranslateY = currentCenterY - screenCenterY;

    // 动画参数
    const animationDuration = CONFIG.ANIMATION_DURATION.SLOW;
    const easing = "cubic-bezier(0.4, 0, 0.2, 1)";

    // ========== 步骤1：设置初始状态 ==========
    // 禁用所有过渡
    container.style.transition = "none";
    previewWrapper.style.transition = "none";
    previewArea.style.transition = "none";
    if (sidebar) sidebar.style.transition = "none";

    // 设置缩略图初始状态
    container.style.left = `${currentLeft}px`;
    container.style.bottom = `${window.innerHeight - rect.bottom}px`;
    container.style.right = "auto";
    container.style.transform = "translate(0, 0) scale(1)";
    container.style.opacity = "1";
    container.style.zIndex = "1002";

    // 设置预览内容初始状态（与缩略图位置和大小完全一致）
    previewWrapper.style.transform = `translate(${initialTranslateX}px, ${initialTranslateY}px) scale(${initialScaleX}, ${initialScaleY})`;
    previewWrapper.style.transformOrigin = "center center";
    previewWrapper.style.opacity = "0"; // 初始时隐藏

    // 设置预览区域初始状态
    previewArea.style.opacity = "0";
    previewArea.style.pointerEvents = "none";
    previewArea.style.zIndex = "100";

    // 隐藏侧边栏（编辑页）- 只使用 opacity，不使用滑动
    if (sidebar) {
      sidebar.style.opacity = "0";
      sidebar.style.pointerEvents = "none";
    }

    // 强制浏览器记录当前状态
    void container.offsetWidth;
    void previewWrapper.offsetWidth;
    void previewArea.offsetWidth;
    if (sidebar) void sidebar.offsetWidth;

    // ========== 步骤2：应用过渡并执行动画 ==========
    // 设置过渡
    container.style.transition = `transform ${animationDuration}ms ${easing}, opacity ${animationDuration}ms ${easing}`;
    previewWrapper.style.transition = `transform ${animationDuration}ms ${easing}, opacity ${animationDuration}ms ${easing}`;
    previewArea.style.transition = `opacity ${animationDuration}ms ${easing}`;
    if (sidebar) sidebar.style.transition = `opacity ${animationDuration}ms ${easing}`;

    // 计算缩略图的目标位置（中心对齐屏幕中心）
    const targetTranslateX = screenCenterX - currentCenterX;
    const targetTranslateY = screenCenterY - currentCenterY;

    // 缩略图放大并淡出
    container.style.transform = `translate(${targetTranslateX}px, ${targetTranslateY}px) scale(${finalScale})`;
    container.style.opacity = "0";

    // 预览内容同步放大并淡入
    previewWrapper.style.transform = "translate(0, 0) scale(1)";
    previewWrapper.style.opacity = "1";

    // 预览区域淡入
    previewArea.style.opacity = "1";
    previewArea.style.pointerEvents = "auto";

    // 标记状态
    container.classList.add("preview-mode");
    previewArea.classList.add("active");
    document.body.style.overflow = "hidden";

    // 禁用拖动
    container._dragDisabled = true;

    // 动画结束后隐藏缩略图
    setTimeout(() => {
      container.style.display = "none";
      container.style.zIndex = "999";
    }, animationDuration);
  }

  closePreview(previewArea) {
    const container = this.dom.get("mobilePreviewContainer");
    const previewWrapper = this.dom.get("previewWrapper");
    if (!container || !previewWrapper || !container._originalState) return;

    // 获取屏幕尺寸
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const screenCenterX = screenWidth / 2;
    const screenCenterY = screenHeight / 2;

    // 获取缩略图的原始位置和尺寸
    const originalLeft = parseFloat(container._originalState.left);
    const originalTop = parseFloat(container._originalState.top);
    const originalWidth = parseFloat(container._originalState.width);
    const originalHeight = parseFloat(container._originalState.height);
    const originalCenterX = originalLeft + originalWidth / 2;
    const originalCenterY = originalTop + originalHeight / 2;

    // 计算预览内容需要缩小到的位置和尺寸
    const previewAreaRect = previewArea.getBoundingClientRect();
    const previewContentWidth = previewAreaRect.width;
    const previewContentHeight = previewAreaRect.height;
    const targetScaleX = originalWidth / previewContentWidth;
    const targetScaleY = originalHeight / previewContentHeight;

    // 计算预览内容的目标位置（使预览内容中心与缩略图中心对齐）
    const targetTranslateX = originalCenterX - screenCenterX;
    const targetTranslateY = originalCenterY - screenCenterY;

    // 动画参数
    const animationDuration = CONFIG.ANIMATION_DURATION.SLOW;
    const easing = "cubic-bezier(0.4, 0, 0.2, 1)";
    const sidebar = document.querySelector(".sidebar");

    // ========== 步骤1：设置初始状态 ==========
    // 禁用所有过渡
    previewWrapper.style.transition = "none";
    previewArea.style.transition = "none";
    container.style.transition = "none";
    if (sidebar) sidebar.style.transition = "none";

    // 显示缩略图容器（初始时透明，位置在目标位置）
    container.style.display = "block";
    container.style.opacity = "0";
    container.style.left = `${originalLeft}px`;
    container.style.bottom = `${window.innerHeight - (originalTop + originalHeight)}px`;
    container.style.right = "auto";
    container.style.transform = "translate(0, 0) scale(1)";
    container.style.zIndex = "1002";

    // 设置预览内容当前状态（全屏状态）
    previewWrapper.style.transform = "translate(0, 0) scale(1)";
    previewWrapper.style.transformOrigin = "center center";
    previewWrapper.style.opacity = "1";

    // 设置预览区域当前状态
    previewArea.style.opacity = "1";
    previewArea.style.pointerEvents = "auto";

    // 侧边栏保持隐藏 - 只使用 opacity，不使用滑动
    if (sidebar) {
      sidebar.style.opacity = "0";
      sidebar.style.pointerEvents = "none";
    }

    // 强制浏览器记录当前状态
    void previewWrapper.offsetWidth;
    void previewArea.offsetWidth;
    void container.offsetWidth;
    if (sidebar) void sidebar.offsetWidth;

    // ========== 步骤2：应用过渡并执行动画 ==========
    // 设置过渡
    previewWrapper.style.transition = `transform ${animationDuration}ms ${easing}, opacity ${animationDuration}ms ${easing}`;
    previewArea.style.transition = `opacity ${animationDuration}ms ${easing}`;
    container.style.transition = `opacity ${animationDuration}ms ${easing}`;
    if (sidebar) sidebar.style.transition = `opacity ${animationDuration}ms ${easing}`;

    // 预览内容缩小并移动到缩略图位置
    previewWrapper.style.transform = `translate(${targetTranslateX}px, ${targetTranslateY}px) scale(${targetScaleX}, ${targetScaleY})`;
    previewWrapper.style.opacity = "0";

    // 预览区域淡出
    previewArea.style.opacity = "0";
    previewArea.style.pointerEvents = "none";

    // 缩略图淡入
    container.style.opacity = "1";

    // 显示侧边栏（编辑页）- 只使用 opacity，不使用滑动
    if (sidebar) {
      sidebar.style.opacity = "1";
      sidebar.style.pointerEvents = "auto";
    }

    // 移除预览模式标记
    previewArea.classList.remove("active");
    container.classList.remove("preview-mode");
    document.body.style.overflow = "";

    // 恢复拖动功能
    container._dragDisabled = false;

    // 动画结束后清理样式
    setTimeout(() => {
      previewWrapper.style.transform = "";
      previewWrapper.style.transformOrigin = "";
      previewWrapper.style.opacity = "";
      previewWrapper.style.transition = "";
      previewArea.style.opacity = "";
      previewArea.style.transition = "";
      container.style.zIndex = "";
      if (sidebar) {
        sidebar.style.opacity = "";
        sidebar.style.pointerEvents = "";
        sidebar.style.transition = "";
      }
      delete container._originalState;
    }, animationDuration);
  }

  initSwipeToClose(previewArea) {
    let touchStartX = 0;
    let touchEndX = 0;

    previewArea.addEventListener(
      "touchstart",
      (e) => {
        touchStartX = e.changedTouches[0].screenX;
      },
      { passive: true }
    );

    previewArea.addEventListener(
      "touchend",
      (e) => {
        touchEndX = e.changedTouches[0].screenX;
        const swipeThreshold = 100;
        const swipeDistance = touchEndX - touchStartX;

        if (swipeDistance > swipeThreshold && touchStartX < 50) {
          this.closePreview(previewArea);
        }
      },
      { passive: true }
    );
  }
}

// ==================== 主应用 ====================
class BookExcerptApp {
  constructor() {
    this.state = new AppState();
    this.dom = new DOMManager();
    this.renderer = new Renderer(this.dom, this.state);
    this.preview = new PreviewManager(this.dom, this.state);
    this.thumbnail = new ThumbnailManager(this.dom, this.state);
    this.download = null; // 将在init中初始化
    this.mobilePreview = new MobilePreviewManager(this.dom);
  }

  init() {
    // 设置日期
    const dateEl = this.dom.get("currentDate");
    if (dateEl) {
      dateEl.textContent = Utils.formatDate();
    }

    // 初始化侧边栏宽度调整功能
    this.initSidebarResizer();

    // 设置渲染器回调
    this.renderer.onThemeChange = (id) => {
      this.preview.setTheme(id);
      this.thumbnail.updateThumbnail();
    };
    this.renderer.onFontChange = (value) => {
      this.preview.setFont(value);
      this.thumbnail.updateThumbnail();
    };
    this.renderer.onFontSizeChange = (size) => {
      this.preview.setFontSize(size);
      this.thumbnail.updateThumbnail();
    };
    this.renderer.onFontColorChange = (color) => {
      this.preview.setFontColor(color);
      this.thumbnail.updateThumbnail();
    };
    this.renderer.onCardWidthChange = (width) => {
      this.preview.setCardWidth(width);
      this.thumbnail.updateThumbnail();
    };

    // 渲染UI
    this.renderer.renderThemeGrid();
    this.renderer.renderFontColorGrid();
    this.renderer.renderFontGrid();
    this.renderer.renderSizeOptions();

    // 绑定事件
    this.bindEvents();

    // 初始化预览
    this.preview.updatePreview();
    this.preview.updateSeal();

    // 设置初始值
    setTimeout(() => {
      this.preview.setFont(this.state.font);
      this.preview.setFontSize(this.state.fontSize);
      this.preview.setFontColor(this.state.fontColor);
      this.preview.setCardWidth(this.state.cardWidth);
      this.thumbnail.updateThumbnail();
      // 初始化缩略图位置到下载按钮上方（延迟执行确保按钮已渲染）
      setTimeout(() => {
        this.thumbnail.restorePosition();
        // 再次延迟确保位置正确设置
        setTimeout(() => {
          this.thumbnail.restorePosition();
        }, 200);
      }, 200);
    }, 500);

    // 初始化下载管理器（需要previewManager引用）
    this.download = new DownloadManager(this.dom, this.state, this.preview);

    // 初始化滚动监听
    this.initScrollListener();

    // 绑定浮动操作按钮
    this.bindFloatingActions();
  }

  initSidebarResizer() {
    const sidebar = document.getElementById("sidebar");
    const resizer = document.getElementById("sidebar-resizer");

    if (!sidebar || !resizer) return;

    let isResizing = false;
    let startX = 0;
    let startWidth = 0;
    const minWidth = 280; // 最小宽度
    const maxWidthRatio = 2 / 3; // 最大宽度比例

    const getMaxWidth = () => {
      return window.innerWidth * maxWidthRatio;
    };

    const startResize = (e) => {
      isResizing = true;
      startX = e.clientX || e.touches[0].clientX;
      startWidth = sidebar.offsetWidth;

      sidebar.classList.add("resizing");
      document.body.style.cursor = "ew-resize";
      document.body.style.userSelect = "none";

      // 防止文本选择
      e.preventDefault();
    };

    const doResize = (e) => {
      if (!isResizing) return;

      const currentX = e.clientX || e.touches[0].clientX;
      const diff = startX - currentX; // 向右拖动时diff为正
      let newWidth = startWidth + diff;

      // 限制宽度范围
      const maxWidth = getMaxWidth();
      newWidth = Math.max(minWidth, Math.min(newWidth, maxWidth));

      // 更新侧边栏宽度
      sidebar.style.width = `${newWidth}px`;
      document.documentElement.style.setProperty("--sidebar-width", `${newWidth}px`);

      // 同步更新预览区域的宽度和右边距
      const previewArea = document.getElementById("preview-area");
      if (previewArea) {
        previewArea.classList.add("resizing");
        previewArea.style.width = `calc(100% - ${newWidth}px)`;
        previewArea.style.marginRight = `${newWidth}px`;
      }
    };

    const stopResize = () => {
      if (!isResizing) return;

      isResizing = false;
      sidebar.classList.remove("resizing");
      document.body.style.cursor = "";
      document.body.style.userSelect = "";

      // 移除预览区域的 resizing 类，恢复过渡动画
      const previewArea = document.getElementById("preview-area");
      if (previewArea) {
        previewArea.classList.remove("resizing");
        // 移除内联样式，让 CSS 变量控制
        previewArea.style.width = "";
        previewArea.style.marginRight = "";
      }

      // 保存宽度到 localStorage
      const savedWidth = sidebar.offsetWidth;
      try {
        localStorage.setItem("sidebar-width", savedWidth.toString());
      } catch (e) {
        // localStorage 可能不可用，忽略错误
      }
    };

    // 鼠标事件
    resizer.addEventListener("mousedown", startResize);
    document.addEventListener("mousemove", doResize);
    document.addEventListener("mouseup", stopResize);

    // 触摸事件（移动端支持）
    resizer.addEventListener("touchstart", startResize, { passive: false });
    document.addEventListener("touchmove", doResize, { passive: false });
    document.addEventListener("touchend", stopResize);

    // 窗口大小改变时，确保宽度不超过最大值
    const handleResize = () => {
      const currentWidth = sidebar.offsetWidth;
      const maxWidth = getMaxWidth();
      if (currentWidth > maxWidth) {
        const newWidth = Math.max(minWidth, maxWidth);
        sidebar.style.width = `${newWidth}px`;
        document.documentElement.style.setProperty("--sidebar-width", `${newWidth}px`);

        // 同步更新预览区域
        const previewArea = document.getElementById("preview-area");
        if (previewArea) {
          previewArea.style.width = `calc(100% - ${newWidth}px)`;
          previewArea.style.marginRight = `${newWidth}px`;
        }
      }
    };

    window.addEventListener("resize", handleResize);

    // 从 localStorage 恢复宽度
    try {
      const savedWidth = localStorage.getItem("sidebar-width");
      if (savedWidth) {
        const width = parseInt(savedWidth, 10);
        if (width >= minWidth && width <= getMaxWidth()) {
          sidebar.style.width = `${width}px`;
          document.documentElement.style.setProperty("--sidebar-width", `${width}px`);

          // 同步更新预览区域
          const previewArea = document.getElementById("preview-area");
          if (previewArea) {
            previewArea.style.width = `calc(100% - ${width}px)`;
            previewArea.style.marginRight = `${width}px`;
          }
        }
      }
    } catch (e) {
      // localStorage 可能不可用，忽略错误
    }
  }

  bindFloatingActions() {
    const downloadFab = document.getElementById("download-fab");
    const downloadBtn = this.dom.get("downloadBtn");

    if (downloadFab && downloadBtn) {
      downloadFab.addEventListener("click", () => {
        downloadBtn.click();
      });
    }
  }

  bindEvents() {
    const { quoteInput, bookInput, authorInput, sealInput, downloadBtn } = this.dom.elements;

    // 输入事件
    quoteInput?.addEventListener("input", () => {
      this.preview.updatePreview();
      this.thumbnail.updateThumbnail();
    });

    bookInput?.addEventListener("input", () => {
      this.preview.updatePreview();
      this.thumbnail.updateThumbnail();
    });

    authorInput?.addEventListener("input", () => {
      this.preview.updatePreview();
      this.thumbnail.updateThumbnail();
    });

    sealInput?.addEventListener("input", () => {
      this.preview.updateSeal();
      this.thumbnail.updateThumbnail();
    });

    // 布局切换
    // 布局单选框事件
    this.dom.get("layoutRadios")?.forEach((radio) => {
      radio.addEventListener("change", (e) => {
        if (e.target.checked) {
          const layout = e.target.value;
          this.preview.setLayout(layout);
          this.thumbnail.updateThumbnail();
        }
      });
    });

    // 下载按钮
    downloadBtn?.addEventListener("click", () => {
      this.download.download();
    });
  }

  /**
   * 初始化滚动监听
   * 诉求：当用户在侧边栏中滑动时，缩略图自动移动到左上角（顶部），避免遮挡操作区域
   */
  initScrollListener() {
    const container = this.dom.get("mobilePreviewContainer");
    if (!container) return;

    // 获取侧边栏内的可滚动元素
    const scrollContainer = document.querySelector(".controls-scroll");
    if (!scrollContainer) {
      console.warn("未找到 .controls-scroll 元素");
      return;
    }

    // 滚动阈值：超过这个值后，缩略图移动到左上角
    const SCROLL_THRESHOLD = 50;

    // 保存位置信息：始终使用 bottom 和 right，通过 transform 移动
    let initialBottom = null;
    let initialRight = null;
    let translateYOffset = null; // 移动到顶部时需要的 translateY 偏移量
    let isInitialized = false;

    // 记录当前状态：'initial' 或 'top'，避免重复触发动画
    let currentState = "initial";

    // 标记是否正在执行动画，避免重复触发
    let isAnimating = false;

    // 初始化位置
    const initPosition = () => {
      if (isInitialized) return;

      // 获取容器的实际位置和尺寸
      const rect = container.getBoundingClientRect();
      const computedStyle = window.getComputedStyle(container);

      if (rect.width > 0 && rect.height > 0) {
        // 保存初始位置（bottom 和 right）
        const bottomStr = computedStyle.bottom;
        const rightStr = computedStyle.right;

        if (bottomStr && bottomStr !== "auto" && rightStr && rightStr !== "auto") {
          initialBottom = parseFloat(bottomStr) || 0;
          initialRight = parseFloat(rightStr) || 0;
        } else {
          // 如果还没有设置，使用当前计算值
          initialBottom = window.innerHeight - rect.bottom;
          initialRight = window.innerWidth - rect.right;
        }

        // 缩略图使用固定大小，不需要保存宽度设置

        // 计算移动到顶部时需要的 translateY 偏移量
        // 目标位置：top = 24px (spacingLg)
        // 当前位置：bottom = initialBottom
        // 需要向上移动的距离 = (window.innerHeight - initialBottom) - 24 - container.height
        const spacingLg = 24;
        const currentTop = window.innerHeight - initialBottom - rect.height;
        const targetTop = spacingLg;
        translateYOffset = targetTop - currentTop;

        isInitialized = true;
      }
    };

    // 延迟初始化，确保容器已渲染且位置已设置
    setTimeout(() => {
      // 确保位置已设置
      if (!container.style.bottom || container.style.bottom === "auto") {
        this.thumbnail.restorePosition();
      }
      // 延迟一点再读取位置
      setTimeout(initPosition, 100);
    }, 600);

    const handleScroll = () => {
      // 获取侧边栏滚动容器的滚动位置
      const currentScrollY = scrollContainer.scrollTop || 0;

      // 确保位置已初始化
      if (!isInitialized) {
        initPosition();
        if (!isInitialized) {
          return;
        }
      }

      // 判断目标状态
      const targetState = currentScrollY > SCROLL_THRESHOLD ? "top" : "initial";

      // 如果状态没有变化，不执行动画（避免重复触发）
      if (targetState === currentState) {
        return;
      }

      // 如果正在执行动画，跳过（避免重复触发）
      if (isAnimating) {
        return;
      }

      // 更新状态和动画标记
      currentState = targetState;
      isAnimating = true;

      // 设置过渡：使用 transform 实现位置移动和缩放，性能最好
      container.style.transition = "transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1), z-index 0s";

      if (targetState === "top") {
        // 移动到右上角：使用 transform: translateY() 实现位置移动
        // 提升 z-index 到最高层级，确保完全露出（高于所有其他元素）
        container.style.zIndex = "9999";

        // 设置 right 值，确保右边缘距离屏幕右边缘 spacingXl
        const spacingXl = 32;
        container.style.right = `${spacingXl}px`;
        container.style.left = "auto";
        container.style.bottom = `${initialBottom}px`;
        container.style.top = "auto";

        // 缩略图使用固定大小，不需要调整宽度

        // 重新计算 translateY 偏移量，确保顶部位置正确
        // 等待浏览器应用 right 和 width 的更改
        requestAnimationFrame(() => {
          const currentRect = container.getBoundingClientRect();
          const currentTop = currentRect.top;
          const spacingLg = 24;
          const targetTop = spacingLg;
          const newTranslateYOffset = targetTop - currentTop;

          // 应用位置移动和缩放：translateY 向上移动，scale 缩放
          container.style.transform = `translateY(${newTranslateYOffset}px) scale(0.92)`;

          // 延迟恢复缩放，保持位置移动
          setTimeout(() => {
            container.style.transform = `translateY(${newTranslateYOffset}px) scale(1)`;
            isAnimating = false;
          }, 300);
        });
      } else {
        // 恢复到初始位置：移除 translateY，只保留缩放
        container.style.zIndex = "199"; // 恢复到初始 z-index

        // 确保 bottom 和 right 正确设置
        container.style.bottom = `${initialBottom}px`;
        container.style.right = `${initialRight}px`;
        container.style.left = "auto";
        container.style.top = "auto";

        // 恢复宽度设置：完全清除内联样式，让 CSS 的初始值生效
        // 使用 removeProperty 确保完全清除，而不是设置为空字符串
        container.style.removeProperty("max-width");
        container.style.removeProperty("width");

        // 应用缩放效果：translateY 回到 0，scale 缩放
        container.style.transform = "translateY(0) scale(0.92)";

        // 延迟恢复缩放
        setTimeout(() => {
          container.style.transform = "translateY(0) scale(1)";
          isAnimating = false;
        }, 300);
      }
    };

    // 节流函数
    let scrollTimer = null;
    const throttledScroll = () => {
      if (scrollTimer) return;
      scrollTimer = requestAnimationFrame(() => {
        handleScroll();
        scrollTimer = null;
      });
    };

    // 监听侧边栏滚动容器的滚动事件
    scrollContainer.addEventListener("scroll", throttledScroll, { passive: true });
  }
}

// ==================== 初始化 ====================
document.addEventListener("DOMContentLoaded", () => {
  const app = new BookExcerptApp();
  app.init();
});
