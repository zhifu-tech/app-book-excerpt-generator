/**
 * DOM 元素管理
 * 按需加载 DOM 元素，提高初始化性能
 * 支持直接属性访问：this.dom.quoteInput
 * @module dom-manager
 */

/**
 * @typedef {() => HTMLElement | null} ElementSelector
 * @typedef {() => NodeListOf<HTMLElement>} NodeListSelector
 */

/**
 * 元素查询映射表
 * @type {Record<string, ElementSelector | NodeListSelector>}
 */
const SELECTORS = {
  // 输入元素
  quoteInput: () => document.getElementById("quote-text"),
  bookInput: () => document.getElementById("book-title"),
  authorInput: () => document.getElementById("author-text"),
  sealInput: () => document.getElementById("seal-text"),

  // 控制元素
  themeGrid: () => document.getElementById("theme-grid"),
  fontColorGrid: () => document.getElementById("font-color-grid"),
  fontGrid: () => document.getElementById("font-grid"),
  fontSizeSlider: () => document.getElementById("font-size-slider"),
  fontSizeValue: () => document.getElementById("font-size-value"),
  cardWidthSlider: () => document.getElementById("card-width-slider"),
  cardWidthValue: () => document.getElementById("card-width-value"),
  layoutRadios: () => document.querySelectorAll('input[name="layout"]'),
  exportFormatCheckboxes: () => document.querySelectorAll('input[name="export-format"]'),
  downloadBtn: () => document.getElementById("download-btn"),

  // 预览元素
  card: () => document.getElementById("card-preview"),
  previewText: () => document.getElementById("preview-text"),
  previewBook: () => document.getElementById("preview-book"),
  previewAuthor: () => document.getElementById("preview-author"),
  previewSeal: () => document.getElementById("preview-seal"),
  currentDate: () => document.getElementById("current-date"),
  previewArea: () => document.getElementById("preview-area"),

  // 布局元素
  sidebar: () => document.getElementById("sidebar"),
  sidebarResizer: () => document.getElementById("sidebar-resizer"),
  downloadFab: () => document.getElementById("download-fab"),
};

/**
 * DOM 元素管理器
 * 使用 Proxy 实现按需加载和直接属性访问
 */
export class DOMManager {
  /**
   * 创建 DOM 管理器实例
   */
  constructor() {
    /** @type {Record<string, HTMLElement | NodeListOf<HTMLElement> | null>} 元素缓存 */
    this._cache = {};

    // 返回代理对象，支持直接属性访问
    return new Proxy(this, {
      get(target, prop) {
        // 如果是内部属性或方法，直接返回
        if (prop.startsWith("_") || prop === "constructor" || typeof target[prop] === "function") {
          return target[prop];
        }

        // 如果是 elements 属性，返回代理对象用于解构赋值
        if (prop === "elements") {
          return new Proxy(
            {},
            {
              get(_, elementKey) {
                return target._getElement(elementKey);
              },
              has(_, elementKey) {
                return elementKey in SELECTORS;
              },
              ownKeys() {
                return Object.keys(SELECTORS);
              },
              getOwnPropertyDescriptor(_, elementKey) {
                if (elementKey in SELECTORS) {
                  return {
                    enumerable: true,
                    configurable: true,
                    value: target._getElement(elementKey),
                  };
                }
                return undefined;
              },
            }
          );
        }

        // 如果是 DOM 元素标识符，按需加载并返回
        if (prop in SELECTORS) {
          return target._getElement(prop);
        }

        // 其他情况返回 undefined
        return undefined;
      },
    });
  }

  /**
   * 内部方法：获取 DOM 元素（按需加载）
   * @private
   * @param {string} id - 元素标识符
   * @returns {HTMLElement | NodeListOf<HTMLElement> | null | undefined} DOM 元素
   */
  _getElement(id) {
    // 如果已缓存，直接返回
    if (id in this._cache) {
      return this._cache[id];
    }

    // 如果存在查询函数，执行查询并缓存
    if (id in SELECTORS) {
      const element = SELECTORS[id]();
      this._cache[id] = element;
      return element;
    }

    // 未找到对应的查询函数
    return undefined;
  }
}
