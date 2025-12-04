/**
 * 缩略图管理器（统一预览图方案）
 * 统一管理缩略图的所有状态变化、更新和获取
 */
import { CONFIG } from "./config.js";
import { Utils } from "./utils.js";

export class ThumbnailManager {
  constructor(dom, state) {
    this.dom = dom;
    this.state = state;
    this.updateThumbnail = Utils.debounce(
      this._updateThumbnail.bind(this),
      CONFIG.THUMBNAIL_UPDATE_DELAY
    );
  }

  /**
   * 立即初始化缩略图位置（不使用防抖）
   * 用于页面加载时立即设置正确位置，避免闪现
   */
  initThumbnail() {
    // 只在移动端初始化
    if (!Utils.isMobile()) return;

    const previewArea = this.dom.previewArea;
    if (!previewArea) return;

    // 如果已经是全屏预览状态，不初始化
    if (previewArea.classList.contains("preview-fullscreen")) return;

    // 立即创建并应用缩略图状态
    const thumbnailState = this.createThumbnailState(previewArea);
    this.updateThumbnailState(previewArea, thumbnailState, true);
  }

  /**
   * 【统一入口】获取缩略图状态
   * @param {HTMLElement} previewArea - 预览区域元素
   * @returns {Object|null} 缩略图状态对象
   */
  getThumbnailState(previewArea) {
    if (!previewArea) return null;

    // 优先返回保存的状态
    if (previewArea._thumbnailState) {
      return { ...previewArea._thumbnailState };
    }

    // 如果没有保存的状态，计算默认状态
    return this.createThumbnailState(previewArea);
  }

  /**
   * 【统一入口】创建缩略图状态
   * @param {HTMLElement} previewArea - 预览区域元素
   * @param {Object} options - 可选参数
   * @param {number} options.left - 自定义 left 位置
   * @param {number} options.top - 自定义 top 位置
   * @param {string} options.transform - 自定义 transform
   * @param {string} options.zIndex - 自定义 z-index
   * @returns {Object} 缩略图状态对象
   */
  createThumbnailState(previewArea, options = {}) {
    const downloadFab = this.dom.downloadFab;
    const position = this._calculateThumbnailPosition(previewArea, downloadFab);

    return {
      left:
        options.left !== undefined
          ? typeof options.left === "string"
            ? options.left
            : `${options.left}px`
          : `${position.left}px`,
      top:
        options.top !== undefined
          ? typeof options.top === "string"
            ? options.top
            : `${options.top}px`
          : `${position.top}px`,
      right: "auto",
      bottom: "auto",
      width: "100vw",
      height: `${CONFIG.THUMBNAIL_HEIGHT_VH}vh`,
      transform: options.transform || `scale(${CONFIG.THUMBNAIL_SCALE_RATIO})`,
      transformOrigin: "top left",
      zIndex: options.zIndex || "199",
    };
  }

  /**
   * 【统一入口】更新缩略图状态
   * @param {HTMLElement} previewArea - 预览区域元素
   * @param {Object} state - 状态对象
   * @param {boolean} applyToDOM - 是否应用到 DOM（默认 true）
   */
  updateThumbnailState(previewArea, state, applyToDOM = true) {
    if (!previewArea || !state) return;

    // 保存状态
    previewArea._thumbnailState = { ...state };

    // 应用到 DOM
    if (applyToDOM) {
      this.applyThumbnailState(previewArea, state);
    }
  }

  /**
   * 【统一入口】应用缩略图状态到 DOM
   * @param {HTMLElement} previewArea - 预览区域元素
   * @param {Object} state - 状态对象
   */
  applyThumbnailState(previewArea, state) {
    if (!previewArea || !state) return;

    const propertyMap = {
      left: "left",
      top: "top",
      right: "right",
      bottom: "bottom",
      width: "width",
      height: "height",
      transform: "transform",
      transformOrigin: "transform-origin",
      zIndex: "z-index",
    };

    Object.entries(propertyMap).forEach(([key, prop]) => {
      if (state[key] !== undefined) {
        previewArea.style.setProperty(prop, state[key], "important");
      }
    });

    // 清除边框样式
    ["border", "border-radius", "box-shadow"].forEach((prop) => {
      previewArea.style.setProperty(prop, "", "important");
    });
  }

  /**
   * 【统一入口】获取缩略图位置（用于兼容旧代码）
   * @param {HTMLElement} previewArea - 预览区域元素
   * @returns {{left: number, top: number}} 缩略图的 left 和 top 位置
   */
  getThumbnailPosition(previewArea) {
    const state = this.getThumbnailState(previewArea);
    if (state && state.left && state.top) {
      return {
        left: parseFloat(state.left) || 0,
        top: parseFloat(state.top) || 0,
      };
    }

    // 如果没有状态，重新计算
    const downloadFab = this.dom.downloadFab;
    return this._calculateThumbnailPosition(previewArea, downloadFab);
  }

  /**
   * 计算缩略图在屏幕中的位置（位于下载按钮之上）
   * @param {HTMLElement} previewArea - 预览区域元素
   * @param {HTMLElement} downloadFab - 下载按钮元素
   * @returns {{left: number, top: number}} 缩略图的 left 和 top 位置
   */
  _calculateThumbnailPosition(previewArea, downloadFab) {
    const rect = previewArea.getBoundingClientRect();
    if (!downloadFab) {
      return { left: rect.left, top: rect.top };
    }

    const fabRect = downloadFab.getBoundingClientRect();
    const VERTICAL_SPACING = 8;
    const RIGHT_MARGIN = 16;
    const scaledWidth = window.innerWidth * CONFIG.THUMBNAIL_SCALE_RATIO;
    const scaledHeight =
      ((window.innerHeight * CONFIG.THUMBNAIL_HEIGHT_VH) / 100) * CONFIG.THUMBNAIL_SCALE_RATIO;

    return {
      left: window.innerWidth - RIGHT_MARGIN - scaledWidth,
      top:
        window.innerHeight - (window.innerHeight - fabRect.top + VERTICAL_SPACING) - scaledHeight,
    };
  }

  /**
   * 更新缩略图（响应式更新）
   * 保持当前位置，只更新样式属性
   */
  _updateThumbnail() {
    // 只在移动端更新缩略图
    if (!Utils.isMobile()) return;

    const previewArea = this.dom.previewArea;
    if (!previewArea) return;

    // 如果正在滚动动画中，不更新缩略图（避免冲突）
    if (previewArea._isScrollAnimating) return;

    // 如果已经是全屏预览状态，不更新缩略图
    if (previewArea.classList.contains("preview-fullscreen")) return;

    // 获取当前状态（优先使用已保存的位置）
    const currentState = this.getThumbnailState(previewArea);

    // 如果有保存的状态，保持当前位置，只更新其他属性
    if (currentState && previewArea._thumbnailState) {
      // 保持当前位置和 transform，只更新其他属性
      const thumbnailState = {
        ...currentState,
        // 保持位置不变
        left: currentState.left,
        top: currentState.top,
        // 保持 transform 不变（可能包含 translateY）
        transform: currentState.transform || `scale(${CONFIG.THUMBNAIL_SCALE_RATIO})`,
        // 保持 zIndex 不变
        zIndex: currentState.zIndex || "199",
        // 更新其他属性
        right: "auto",
        bottom: "auto",
        width: "100vw",
        height: `${CONFIG.THUMBNAIL_HEIGHT_VH}vh`,
        transformOrigin: "top left",
      };
      this.updateThumbnailState(previewArea, thumbnailState, true);
    } else {
      // 如果没有保存的状态，创建新的默认状态
      const thumbnailState = this.createThumbnailState(previewArea);
      this.updateThumbnailState(previewArea, thumbnailState, true);
    }
  }
}
