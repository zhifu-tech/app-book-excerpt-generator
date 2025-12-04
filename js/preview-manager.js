/**
 * 预览管理器
 */
import { CONFIG } from "./config.js";

export class PreviewManager {
  constructor(dom, state) {
    this.dom = dom;
    this.state = state;
  }

  updatePreview() {
    const { previewText, previewBook, previewAuthor, quoteInput, bookInput, authorInput } =
      this.dom.elements;
    if (!previewText || !previewBook || !previewAuthor) return;

    previewText.style.opacity = "0.5";
    requestAnimationFrame(() => {
      previewText.textContent = quoteInput?.value || "请输入摘录内容...";
      previewBook.textContent = bookInput?.value || "书名";
      previewAuthor.textContent = authorInput?.value || "作者";

      if (this.state.font) {
        previewText.style.fontFamily = this.state.font;
      }
      if (this.state.fontSize) {
        previewText.style.fontSize = `${this.state.fontSize}px`;
      }
      requestAnimationFrame(() => {
        previewText.style.opacity = "1";
      });
    });
  }

  updateSeal() {
    const seal = this.dom.previewSeal;
    const input = this.dom.sealInput;
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
    const card = this.dom.card;
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
    const card = this.dom.card;
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
    this.dom.layoutRadios?.forEach((radio) => {
      radio.checked = radio.value === layout;
    });
  }

  setFont(fontValue) {
    const previewText = this.dom.previewText;
    if (!previewText || this.state.font === fontValue) return;

    this.state.update({ font: fontValue });
    previewText.style.fontFamily = fontValue;

    document.querySelectorAll(".font-option-btn").forEach((el) => {
      el.classList.toggle("active", el.dataset.font === fontValue);
    });
  }

  setFontSize(size) {
    const previewText = this.dom.previewText;
    if (!previewText || this.state.fontSize === size) return;

    this.state.update({ fontSize: size });
    previewText.style.transition = "font-size 0.2s ease";
    previewText.style.fontSize = `${size}px`;

    // 更新滑块值
    const slider = this.dom.fontSizeSlider;
    if (slider) {
      slider.value = size;
    }

    // 更新显示值
    const valueDisplay = this.dom.fontSizeValue;
    if (valueDisplay) {
      valueDisplay.textContent = `${size}px`;
    }
  }

  setFontColor(colorValue) {
    const previewText = this.dom.previewText;
    if (!previewText || this.state.fontColor === colorValue) return;

    this.state.update({ fontColor: colorValue });
    previewText.style.transition = "color 0.2s ease";
    previewText.style.color = colorValue;

    document.querySelectorAll(".color-option").forEach((el) => {
      el.classList.toggle("active", el.dataset.color === colorValue);
    });
  }

  setCardWidth(width) {
    const card = this.dom.card;
    if (!card || this.state.cardWidth === width) return;

    this.state.update({ cardWidth: width });
    card.style.transition = "width 0.3s ease";
    card.style.width = `${width}px`;

    // 更新滑块值
    const slider = this.dom.cardWidthSlider;
    if (slider) {
      slider.value = width;
    }

    // 更新显示值
    const valueDisplay = this.dom.cardWidthValue;
    if (valueDisplay) {
      valueDisplay.textContent = `${width}px`;
    }
  }

  setZoom(zoom) {
    const card = this.dom.card;
    if (!card) return;

    this.state.update({ zoom });
    card.style.transition = "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)";
    card.style.transform = `scale(${zoom})`;
  }
}
