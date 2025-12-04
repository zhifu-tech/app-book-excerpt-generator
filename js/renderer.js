/**
 * 渲染器
 */
import {
  THEMES,
  FONTS,
  FONT_COLORS,
  FONT_SIZE_MIN,
  FONT_SIZE_MAX,
  FONT_SIZE_STEP,
  CARD_WIDTH_MIN,
  CARD_WIDTH_MAX,
  CARD_WIDTH_STEP,
} from "./config.js";

export class Renderer {
  constructor(dom, state) {
    this.dom = dom;
    this.state = state;
  }

  renderThemeGrid() {
    const grid = this.dom.themeGrid;
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
    const grid = this.dom.fontColorGrid;
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
    const grid = this.dom.fontGrid;
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
    const slider = this.dom.fontSizeSlider;
    const valueDisplay = this.dom.fontSizeValue;
    if (!slider) return;

    slider.min = FONT_SIZE_MIN;
    slider.max = FONT_SIZE_MAX;
    slider.step = FONT_SIZE_STEP;
    slider.value = this.state.fontSize;

    if (valueDisplay) {
      valueDisplay.textContent = `${this.state.fontSize}px`;
    }

    slider.addEventListener("input", (e) => {
      const size = parseInt(e.target.value, 10);
      if (valueDisplay) {
        valueDisplay.textContent = `${size}px`;
      }
      this.onFontSizeChange(size);
    });

    this._preventSliderBubble(slider);
  }

  renderCardWidthSlider() {
    const slider = this.dom.cardWidthSlider;
    const valueDisplay = this.dom.cardWidthValue;
    if (!slider) return;

    slider.min = CARD_WIDTH_MIN;
    slider.max = CARD_WIDTH_MAX;
    slider.step = CARD_WIDTH_STEP;
    slider.value = this.state.cardWidth;

    if (valueDisplay) {
      valueDisplay.textContent = `${this.state.cardWidth}px`;
    }

    slider.addEventListener("input", (e) => {
      const width = parseInt(e.target.value, 10);
      if (valueDisplay) {
        valueDisplay.textContent = `${width}px`;
      }
      this.onCardWidthChange(width);
    });

    this._preventSliderBubble(slider);
  }

  _preventSliderBubble(slider) {
    ["mousedown", "touchstart", "touchmove", "touchend"].forEach((event) => {
      slider.addEventListener(event, (e) => e.stopPropagation());
    });
  }

  // 事件回调 - 由主应用设置
  onThemeChange() {}
  onFontChange() {}
  onFontSizeChange() {}
  onFontColorChange() {}
  onCardWidthChange() {}
}
