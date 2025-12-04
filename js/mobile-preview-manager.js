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

  /**
   * 解析位置值（支持 px 和 calc）
   */
  _parsePositionValue(value) {
    if (typeof value === "string") {
      if (value.includes("px")) {
        return parseFloat(value);
      }
      if (value === "auto" || value === "0px" || value === "0") {
        return 0;
      }
      // 对于 calc，返回 null，表示需要特殊处理
      if (value.includes("calc")) {
        return null;
      }
    }
    return 0;
  }

  _applyState(element, state, isFullscreen = false) {
    // 设置位置和尺寸（这些是基础布局属性）
    // 关键策略：
    // - 缩略图状态：left/top 设置为缩略图位置，transform = translate(0, 0) scale(0.4)
    // - 全屏状态：left/top 保持为缩略图位置（不立即变为 0），
    //   通过 transform: translate(-left, -top) scale(1) 来移动到 (0, 0)
    //   这样位置移动和缩放可以同时动画，不会出现先移动后缩放的问题

    // 获取缩略图位置（用于全屏状态时保持 left/top）
    const thumbnailState = this.thumbnailManager?.getThumbnailState(element);
    const thumbnailLeft = thumbnailState ? this._parsePositionValue(thumbnailState.left) : null;
    const thumbnailTop = thumbnailState ? this._parsePositionValue(thumbnailState.top) : null;

    const layoutProperties = {
      // 全屏时，left/top 保持为缩略图位置，通过 translate 来移动
      // 这样 left/top 不参与动画，只有 transform 参与动画
      left: isFullscreen && thumbnailLeft !== null ? thumbnailState.left : state.left,
      top: isFullscreen && thumbnailTop !== null ? thumbnailState.top : state.top,
      right: state.right,
      bottom: state.bottom,
      width: state.width,
      height: state.height,
    };

    Object.entries(layoutProperties).forEach(([key, value]) => {
      element.style.setProperty(key, value, "important");
    });

    // 计算 transform：将 left/top 的变化转换为 translate
    let finalTransform = state.transform || "";

    if (isFullscreen) {
      // 全屏状态：通过 translate 来移动到 (0, 0)
      if (thumbnailLeft !== null && thumbnailTop !== null) {
        // 从缩略图位置 (thumbnailLeft, thumbnailTop) 移动到 (0, 0)
        // 所以 translate 是负值
        const translateX = -thumbnailLeft;
        const translateY = -thumbnailTop;
        // transform 顺序：先 translate 后 scale（从右到左应用）
        finalTransform = `translate(${translateX}px, ${translateY}px) scale(1)`;
      } else {
        // 如果无法解析（如 calc），使用原始 transform
        finalTransform = state.transform || "scale(1)";
      }
    } else {
      // 缩略图状态：translate 为 0，只有 scale
      // 确保 transform 包含 translate(0, 0)，这样动画时才能平滑过渡
      if (!finalTransform.includes("translate")) {
        finalTransform = `translate(0, 0) ${finalTransform}`;
      }
    }

    // 设置 transform 相关属性（这些会参与动画）
    const transformProperties = {
      transform: finalTransform,
      "transform-origin": state.transformOrigin,
      "z-index": state.zIndex,
    };

    Object.entries(transformProperties).forEach(([key, value]) => {
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
    // 只动画 transform 相关属性，避免 layout 抖动
    // 使用 transform: translate() 代替 left/top，确保所有动画都在同一层处理
    // 这样可以避免 left 和 transform 进度不一致导致的超出屏幕问题
    const transitionProperties = [
      "transform",
      "transform-origin",
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
   * @param {boolean} isFullscreen - 是否为全屏状态
   */
  _cleanupAfterAnimation(previewArea, sidebar, thumbnailState, isFullscreen = false) {
    previewArea.style.transition = "";
    if (sidebar) {
      sidebar.style.opacity = "";
      sidebar.style.pointerEvents = "";
      sidebar.style.transition = "";
    }

    // 如果是全屏状态，动画结束后需要将 left/top 设置为 0
    // 因为动画时 left/top 保持为缩略图位置，通过 translate 来移动
    // 动画结束后，应该将 left/top 设置为 0，translate 设置为 0，这样关闭动画时才能正确
    if (isFullscreen) {
      previewArea.style.setProperty("left", "0px", "important");
      previewArea.style.setProperty("top", "0px", "important");
      previewArea.style.setProperty("transform", "scale(1)", "important");
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

    // 步骤2：设置初始状态（全屏预览状态）
    // 注意：此时 left/top 应该是 0（打开动画结束后设置的）
    // 但为了关闭动画时也能使用 translate，我们需要：
    // - left/top 保持为缩略图位置（通过 translate 来移动）
    // - transform = translate(0, 0) scale(1)（从 translate(-left, -top) scale(1) 动画到 translate(0,0) scale(0.4)）

    // 获取缩略图位置
    const thumbnailLeft = this._parsePositionValue(thumbnailState.left);
    const thumbnailTop = this._parsePositionValue(thumbnailState.top);

    this._prepareAnimation(previewArea, sidebar);

    // 创建全屏初始状态：left=缩略图位置, top=缩略图位置, transform=translate(0,0) scale(1)
    // 这样关闭动画时，只需要动画 transform，left/top 保持不变
    const fullscreenInitialState = {
      left: thumbnailLeft !== null ? thumbnailState.left : "0px",
      top: thumbnailTop !== null ? thumbnailState.top : "0px",
      right: "auto",
      bottom: "auto",
      width: "100vw",
      height: `${CONFIG.THUMBNAIL_HEIGHT_VH}vh`,
      transform: "translate(0, 0) scale(1)",
      transformOrigin: "top left",
      zIndex: "1000",
    };

    this._applyState(previewArea, fullscreenInitialState, true);
    this._hideSidebar(sidebar);
    this._forceReflow(previewArea, sidebar);

    // 步骤3：执行动画到目标状态（缩略图状态）
    // 目标：left=缩略图位置（保持不变）, top=缩略图位置（保持不变）, transform=translate(0,0) scale(0.4)
    this._setupTransition(previewArea, sidebar);
    previewArea.classList.remove("preview-fullscreen", "active");
    this._applyState(previewArea, thumbnailState, false);

    // 更新应用状态
    document.body.style.overflow = "";
    previewArea._dragDisabled = false;
    this._showSidebar(sidebar);

    // 动画结束后清理并更新状态
    setTimeout(() => {
      this._cleanupAfterAnimation(previewArea, sidebar, thumbnailState, false);
    }, this.ANIMATION_DURATION);
  }
}
