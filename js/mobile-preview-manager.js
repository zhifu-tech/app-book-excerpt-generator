/**
 * 移动端预览管理器
 */
import { CONFIG } from "./config.js";
import { Utils } from "./utils.js";

export class MobilePreviewManager {
  constructor(dom, thumbnailManager) {
    this.dom = dom;
    this.thumbnailManager = thumbnailManager; // 使用 ThumbnailManager 统一管理状态
    this.ANIMATION_DURATION = CONFIG.ANIMATION_DURATION.SLOW;
    this.EASING = "cubic-bezier(0.4, 0, 0.2, 1)";
    this.init();
  }

  _applyState(element, state, isFullscreen = false) {
    const properties = {
      left: state.left,
      top: state.top,
      right: state.right,
      bottom: state.bottom,
      width: state.width,
      height: state.height,
      transform: state.transform,
      "transform-origin": state.transformOrigin,
      "z-index": state.zIndex,
    };

    Object.entries(properties).forEach(([key, value]) => {
      element.style.setProperty(key, value, "important");
    });

    const borderProps = isFullscreen
      ? { border: "none", "border-radius": "0", "box-shadow": "none" }
      : { border: "", "border-radius": "", "box-shadow": "" };
    Object.entries(borderProps).forEach(([key, value]) => {
      element.style.setProperty(key, value, "important");
    });
  }

  _setupTransition(previewArea, sidebar) {
    const transitionProperties = [
      "transform",
      "transform-origin",
      "left",
      "top",
      "right",
      "bottom",
      "width",
      "height",
      "z-index",
      "border",
      "border-radius",
      "box-shadow",
    ];
    const transitionString = transitionProperties
      .map((prop) => `${prop} ${this.ANIMATION_DURATION}ms ${this.EASING}`)
      .join(", ");

    previewArea.style.transition = transitionString;
    sidebar.style.transition = `opacity ${this.ANIMATION_DURATION}ms ${this.EASING}`;
  }

  _createFullscreenState() {
    return {
      left: "0px",
      top: `calc((100vh - ${CONFIG.THUMBNAIL_HEIGHT_VH}vh) / 2)`,
      right: "auto",
      bottom: "auto",
      width: "100vw",
      height: `${CONFIG.THUMBNAIL_HEIGHT_VH}vh`,
      transform: "scale(1)",
      transformOrigin: "top left",
      zIndex: "1000",
    };
  }

  /**
   * 准备动画：禁用过渡，设置基本样式
   * @param {HTMLElement} previewArea - 预览区域元素
   * @param {HTMLElement} sidebar - 侧边栏元素
   */
  _prepareAnimation(previewArea, sidebar) {
    previewArea.style.transition = "none";
    previewArea.style.opacity = "1";
    previewArea.style.pointerEvents = "auto";
    sidebar.style.transition = "none";
  }

  /**
   * 强制浏览器重排（记录当前状态）
   * @param {HTMLElement} previewArea - 预览区域元素
   * @param {HTMLElement} sidebar - 侧边栏元素
   */
  _forceReflow(previewArea, sidebar) {
    void previewArea.offsetWidth;
    void sidebar.offsetWidth;
  }

  _hideSidebar(sidebar) {
    sidebar.style.opacity = "0";
    sidebar.style.pointerEvents = "none";
  }

  _showSidebar(sidebar) {
    sidebar.style.opacity = "1";
    sidebar.style.pointerEvents = "auto";
  }

  /**
   * 动画结束后清理样式并更新状态
   * @param {HTMLElement} previewArea - 预览区域元素
   * @param {HTMLElement} sidebar - 侧边栏元素
   * @param {Object} thumbnailState - 缩略图状态
   */
  _cleanupAfterAnimation(previewArea, sidebar, thumbnailState) {
    previewArea.style.transition = "";
    if (sidebar) {
      sidebar.style.opacity = "";
      sidebar.style.pointerEvents = "";
      sidebar.style.transition = "";
    }
    // 通过 ThumbnailManager 统一更新状态
    if (this.thumbnailManager && thumbnailState) {
      this.thumbnailManager.updateThumbnailState(previewArea, thumbnailState, false);
    }
  }

  init() {
    const previewArea = this.dom.previewArea;
    if (!previewArea) return;

    // 只在移动端初始化
    if (!Utils.isMobile()) {
      return;
    }

    // 初始化缩略图状态：确保初始状态与 updateThumbnail、openPreview、closePreview 一致
    // 注意：缩略图位置更新应该通过 ThumbnailManager.updateThumbnail() 来完成
    // 这里只设置事件监听器，不直接操作位置

    const isFullscreen = () => previewArea.classList.contains("preview-fullscreen");

    previewArea.addEventListener("touchend", (e) => {
      if (isFullscreen()) return;

      if (previewArea._dragDisabled) {
        e.preventDefault();
        this.togglePreview(previewArea);
        return;
      }

      const touch = e.changedTouches[0];
      if (touch) {
        const deltaX = Math.abs(touch.clientX - (previewArea._startX || 0));
        const deltaY = Math.abs(touch.clientY - (previewArea._startY || 0));

        if (deltaX < CONFIG.DRAG_THRESHOLD && deltaY < CONFIG.DRAG_THRESHOLD) {
          e.preventDefault();
          this.togglePreview(previewArea);
        }
      }
    });

    previewArea.addEventListener("touchstart", (e) => {
      if (isFullscreen() || previewArea._dragDisabled) return;
      const touch = e.touches[0];
      if (touch) {
        previewArea._startX = touch.clientX;
        previewArea._startY = touch.clientY;
      }
    });

    previewArea.addEventListener("click", (e) => {
      if (isFullscreen()) return;
      if (previewArea._dragDisabled) {
        e.preventDefault();
      }
      this.togglePreview(previewArea);
    });

    // 键盘支持（Enter 和 Space 键）
    previewArea.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        if (!previewArea._dragDisabled && !previewArea.classList.contains("preview-fullscreen")) {
          this.togglePreview(previewArea);
        }
      }
    });

    // 点击预览页任何地方都关闭预览（全屏状态下）
    previewArea.addEventListener("click", (e) => {
      if (!previewArea.classList.contains("preview-fullscreen")) return;
      // 点击预览区域的任何地方都关闭预览
      e.stopPropagation();
      e.preventDefault();
      this.closePreview(previewArea);
    });

    // ESC 键关闭
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && previewArea.classList.contains("preview-fullscreen")) {
        this.closePreview(previewArea);
      }
    });

    // 滑动关闭
    this.initSwipeToClose(previewArea);
  }

  togglePreview(previewArea) {
    previewArea.classList.contains("preview-fullscreen")
      ? this.closePreview(previewArea)
      : this.openPreview(previewArea);
  }

  /**
   * 打开全屏预览
   * 动画流程：缩略图状态 -> 全屏预览状态
   */
  openPreview(previewArea) {
    const sidebar = this.dom.sidebar;

    // 步骤1：准备状态 - 通过 ThumbnailManager 获取当前状态
    const thumbnailState = this.thumbnailManager.getThumbnailState(previewArea);
    const fullscreenState = this._createFullscreenState();

    // 通过 ThumbnailManager 保存缩略图状态供退出时使用
    if (thumbnailState) {
      this.thumbnailManager.updateThumbnailState(previewArea, thumbnailState, false);
    }

    // 步骤2：设置初始状态（缩略图状态）
    this._prepareAnimation(previewArea, sidebar);
    this._applyState(previewArea, thumbnailState, false);
    this._hideSidebar(sidebar);
    this._forceReflow(previewArea, sidebar);

    // 步骤3：执行动画到目标状态（全屏预览状态）
    this._setupTransition(previewArea, sidebar);
    previewArea.classList.add("preview-fullscreen", "active");
    this._applyState(previewArea, fullscreenState, true);

    // 更新应用状态
    document.body.style.overflow = "hidden";
    previewArea._dragDisabled = true;
  }

  /**
   * 关闭全屏预览
   * 动画流程：全屏预览状态 -> 缩略图状态
   */
  closePreview(previewArea) {
    const sidebar = this.dom.sidebar;

    // 步骤1：准备状态 - 通过 ThumbnailManager 获取缩略图状态
    const thumbnailState = this.thumbnailManager.getThumbnailState(previewArea);
    if (!thumbnailState) return;

    const fullscreenState = this._createFullscreenState();

    // 步骤2：设置初始状态（全屏预览状态）
    this._prepareAnimation(previewArea, sidebar);
    this._applyState(previewArea, fullscreenState, true);
    this._hideSidebar(sidebar);
    this._forceReflow(previewArea, sidebar);

    // 步骤3：执行动画到目标状态（缩略图状态）
    this._setupTransition(previewArea, sidebar);
    previewArea.classList.remove("preview-fullscreen", "active");
    this._applyState(previewArea, thumbnailState, false);

    // 更新应用状态
    document.body.style.overflow = "";
    previewArea._dragDisabled = false;
    this._showSidebar(sidebar);

    // 动画结束后清理并更新状态
    setTimeout(() => {
      this._cleanupAfterAnimation(previewArea, sidebar, thumbnailState);
    }, this.ANIMATION_DURATION);
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
