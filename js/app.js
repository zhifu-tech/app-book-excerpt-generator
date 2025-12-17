/**
 * 主应用
 * @module app
 */
import { AppState } from "./state.js";
import { DOMManager } from "./dom-manager.js";
import { Renderer } from "./renderer.js";
import { PreviewManager } from "./preview-manager.js";
import { ThumbnailManager } from "./thumbnail-manager.js";
import { DownloadManager } from "./download-manager.js";
import { MobilePreviewManager } from "./mobile-preview-manager.js";
import { CacheManager } from "./cache-manager.js";
import { CONFIG, initConfig } from "./config.js";
import { Utils } from "./utils.js";

/**
 * 书摘应用主类
 * 整合所有功能模块，管理应用生命周期
 */
export class BookExcerptApp {
  /**
   * 创建应用实例
   */
  constructor() {
    /** @type {AppState} 应用状态 */
    this.state = new AppState();
    /** @type {DOMManager} DOM 管理器 */
    this.dom = new DOMManager();
    /** @type {Renderer} UI 渲染器 */
    this.renderer = new Renderer(this.dom, this.state);
    /** @type {PreviewManager} 预览管理器 */
    this.preview = new PreviewManager(this.dom, this.state);
    /** @type {ThumbnailManager} 缩略图管理器 */
    this.thumbnail = new ThumbnailManager(this.dom, this.state);
    /** @type {DownloadManager | null} 下载管理器（在 init 中初始化） */
    this.download = null;
    /** @type {MobilePreviewManager} 移动端预览管理器 */
    this.mobilePreview = new MobilePreviewManager(this.dom, this.thumbnail, this.state);
    /** @type {CacheManager} 缓存管理器 */
    this.cache = new CacheManager();
  }

  /**
   * 初始化应用
   */
  async init() {
    // 从服务器加载配置（自动检测环境）
    await initConfig();

    // 设置日期
    const dateEl = this.dom.currentDate;
    if (dateEl) {
      dateEl.textContent = Utils.formatDate();
    }

    // 从缓存加载 sidebar 内容（优先使用缓存）
    const hasCachedContent = this.loadSidebarContentFromCache();

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

    // 初始化导出格式选中状态
    this.initExportFormats();

    // 绑定事件
    this.bindEvents();

    // 初始化预览（如果从缓存加载了内容，预览会自动使用缓存的值）
    this.preview.updatePreview();
    this.preview.updateSeal();

    // 立即初始化缩略图位置（避免闪现）
    // 使用 requestAnimationFrame 确保 DOM 已渲染
    requestAnimationFrame(() => {
      this.thumbnail.initThumbnail();
    });

    // 设置初始值
    setTimeout(() => {
      this.preview.setFont(this.state.font);
      this.preview.setFontSize(this.state.fontSize);
      this.preview.setFontColor(this.state.fontColor);
      this.preview.setCardWidth(this.state.cardWidth);
      this.thumbnail.updateThumbnail();
    }, 500);

    // 初始化下载管理器（需要previewManager引用）
    this.download = new DownloadManager(this.dom, this.state, this.preview);

    // 初始化滚动监听
    this.initScrollListener();

    // 绑定浮动操作按钮
    this.bindFloatingActions();
  }

  /**
   * 初始化侧边栏宽度调整功能
   * @private
   */
  initSidebarResizer() {
    const sidebar = this.dom.sidebar;
    const resizer = this.dom.sidebarResizer;
    const previewArea = this.dom.previewArea;

    if (!sidebar || !resizer || !previewArea) return;

    let isResizing = false;
    let startX = 0;
    let startWidth = 0;
    const minWidth = 280;
    const maxWidthRatio = 2 / 3;

    const getMaxWidth = () => window.innerWidth * maxWidthRatio;

    const updatePreviewArea = (width) => {
      previewArea.classList.add("resizing");
      previewArea.style.width = `calc(100% - ${width}px)`;
      previewArea.style.marginRight = `${width}px`;
    };

    const resetPreviewArea = () => {
      previewArea.classList.remove("resizing");
      previewArea.style.width = "";
      previewArea.style.marginRight = "";
    };

    const startResize = (e) => {
      isResizing = true;
      startX = e.clientX || e.touches[0].clientX;
      startWidth = sidebar.offsetWidth;
      sidebar.classList.add("resizing");
      document.body.style.cursor = "ew-resize";
      document.body.style.userSelect = "none";
      e.preventDefault();
    };

    const doResize = (e) => {
      if (!isResizing) return;
      const currentX = e.clientX || e.touches[0].clientX;
      const diff = startX - currentX;
      const maxWidth = getMaxWidth();
      const newWidth = Math.max(minWidth, Math.min(startWidth + diff, maxWidth));

      sidebar.style.width = `${newWidth}px`;
      document.documentElement.style.setProperty("--sidebar-width", `${newWidth}px`);
      updatePreviewArea(newWidth);
    };

    const stopResize = () => {
      if (!isResizing) return;
      isResizing = false;
      sidebar.classList.remove("resizing");
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      resetPreviewArea();

      try {
        localStorage.setItem("sidebar-width", sidebar.offsetWidth.toString());
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

    const handleResize = () => {
      const currentWidth = sidebar.offsetWidth;
      const maxWidth = getMaxWidth();
      if (currentWidth > maxWidth) {
        const newWidth = Math.max(minWidth, maxWidth);
        sidebar.style.width = `${newWidth}px`;
        document.documentElement.style.setProperty("--sidebar-width", `${newWidth}px`);
        updatePreviewArea(newWidth);
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
          updatePreviewArea(width);
        }
      }
    } catch (e) {
      // localStorage 可能不可用，忽略错误
    }
  }

  /**
   * 初始化导出格式选中状态
   * @private
   */
  initExportFormats() {
    const checkboxes = this.dom.exportFormatCheckboxes;
    if (!checkboxes || checkboxes.length === 0) return;

    // 根据 state 中的导出格式设置选中状态
    const defaultFormats = this.state.exportFormats || ["png"];
    checkboxes.forEach((checkbox) => {
      checkbox.checked = defaultFormats.includes(checkbox.value);
    });
  }

  /**
   * 绑定浮动操作按钮事件
   * @private
   */
  bindFloatingActions() {
    const downloadFab = this.dom.downloadFab;
    const downloadBtn = this.dom.downloadBtn;

    if (downloadFab && downloadBtn) {
      downloadFab.addEventListener("click", () => {
        downloadBtn.click();
      });
    }
  }

  /**
   * 从缓存加载 sidebar 内容
   * @private
   * @returns {boolean} 是否成功加载了缓存内容
   */
  loadSidebarContentFromCache() {
    // 检查是否有缓存内容
    if (!this.cache.hasCachedContent()) {
      return false;
    }

    const cachedContent = this.cache.loadSidebarContent();
    const { quoteInput, bookInput, authorInput, sealInput } = this.dom.elements;

    // 从缓存加载内容（优先使用缓存，即使为空字符串也使用）
    if (quoteInput && cachedContent.quote !== undefined) {
      quoteInput.value = cachedContent.quote;
    }
    if (bookInput && cachedContent.book !== undefined) {
      bookInput.value = cachedContent.book;
    }
    if (authorInput && cachedContent.author !== undefined) {
      authorInput.value = cachedContent.author;
    }
    if (sealInput && cachedContent.seal !== undefined) {
      sealInput.value = cachedContent.seal;
    }

    return true;
  }

  /**
   * 保存 sidebar 内容到缓存
   * @private
   */
  saveSidebarContentToCache() {
    const { quoteInput, bookInput, authorInput, sealInput } = this.dom.elements;

    this.cache.saveSidebarContent({
      quote: quoteInput?.value || "",
      book: bookInput?.value || "",
      author: authorInput?.value || "",
      seal: sealInput?.value || "",
    });
  }

  /**
   * 绑定所有事件监听器
   * @private
   */
  bindEvents() {
    const { quoteInput, bookInput, authorInput, sealInput, downloadBtn } = this.dom.elements;

    const updatePreviewAndThumbnail = () => {
      this.preview.updatePreview();
      this.thumbnail.updateThumbnail();
      // 保存到缓存
      this.saveSidebarContentToCache();
    };

    [quoteInput, bookInput, authorInput].forEach((input) => {
      input?.addEventListener("input", updatePreviewAndThumbnail);
    });

    sealInput?.addEventListener("input", () => {
      this.preview.updateSeal();
      this.thumbnail.updateThumbnail();
      // 保存到缓存
      this.saveSidebarContentToCache();
    });

    // 布局切换
    // 布局单选框事件
    this.dom.layoutRadios?.forEach((radio) => {
      radio.addEventListener("change", (e) => {
        if (e.target.checked) {
          const layout = e.target.value;
          this.preview.setLayout(layout);
          this.thumbnail.updateThumbnail();
        }
      });
    });

    // 导出格式选择
    this.dom.exportFormatCheckboxes?.forEach((checkbox) => {
      checkbox.addEventListener("change", () => {
        const selectedFormats = Array.from(this.dom.exportFormatCheckboxes || [])
          .filter((cb) => cb.checked)
          .map((cb) => cb.value);
        // 至少保留一个格式选中
        if (selectedFormats.length === 0) {
          checkbox.checked = true;
          this.state.update({ exportFormats: [checkbox.value] });
        } else {
          this.state.update({ exportFormats: selectedFormats });
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
   * 当用户在侧边栏中滑动时，缩略图自动移动到顶部，避免遮挡操作区域
   * @private
   */
  initScrollListener() {
    // 只在移动端初始化
    if (!Utils.isMobile()) {
      return;
    }

    const previewArea = this.dom.previewArea;
    if (!previewArea) return;

    // 获取侧边栏内的可滚动元素
    const scrollContainer = document.querySelector(".controls-scroll");
    if (!scrollContainer) {
      return;
    }

    // 滚动阈值：超过这个值后，预览区域移动到顶部
    const SCROLL_THRESHOLD = 50;

    // 保存位置信息：使用 left 和 top，与统一的状态管理保持一致
    let initialLeft = null;
    let initialTop = null;

    // 记录当前状态：'initial' 或 'top'，避免重复触发动画
    let currentState = "initial";

    // 标记是否正在执行动画，避免重复触发
    let isAnimating = false;

    // 初始化位置：使用 ThumbnailManager 的统一方法获取缩略图位置
    const initPosition = () => {
      const rect = previewArea.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        const position = this.thumbnail.getThumbnailPosition(previewArea);
        initialLeft = position.left;
        initialTop = position.top;
      }
    };

    const handleScroll = () => {
      // 获取侧边栏滚动容器的滚动位置
      const currentScrollY = scrollContainer.scrollTop || 0;
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
      previewArea._isScrollAnimating = true; // 标记正在滚动动画中

      // 设置过渡：使用 transform 实现位置移动和缩放，性能最好
      previewArea.style.transition = "transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1), z-index 0s";

      // 确保位置已初始化
      initPosition();

      if (targetState === "top") {
        // 移动到顶部：使用 transform: translateY() 实现位置移动，保持缩略图的 scale(0.4)
        const spacingXl = 16;
        const scaledWidth = window.innerWidth * CONFIG.THUMBNAIL_SCALE_RATIO;
        const targetLeft = window.innerWidth - spacingXl - scaledWidth;

        // 重新计算 translateY 偏移量，确保顶部位置正确
        // 等待浏览器应用 left 和 width 的更改
        requestAnimationFrame(() => {
          const currentRect = previewArea.getBoundingClientRect();
          const currentTop = currentRect.top;
          const spacingLg = 24;
          const targetTop = spacingLg;
          const newTranslateYOffset = targetTop - currentTop;

          // 保持缩略图的 scale(0.4)，只添加 translateY
          const transformValue = `translateY(${newTranslateYOffset}px) scale(${CONFIG.THUMBNAIL_SCALE_RATIO})`;

          // 通过 ThumbnailManager 统一更新状态
          const thumbnailState = this.thumbnail.createThumbnailState(previewArea, {
            left: targetLeft,
            top: initialTop,
            transform: transformValue,
            zIndex: "9999",
          });
          this.thumbnail.updateThumbnailState(previewArea, thumbnailState, true);

          isAnimating = false;
          previewArea._isScrollAnimating = false;
        });
      } else {
        // 恢复到初始位置：移除 translateY，保持缩略图的 scale(0.4)
        const transformValue = `translateY(0) scale(${CONFIG.THUMBNAIL_SCALE_RATIO})`;

        // 通过 ThumbnailManager 统一更新状态
        const thumbnailState = this.thumbnail.createThumbnailState(previewArea, {
          left: initialLeft,
          top: initialTop,
          transform: transformValue,
          zIndex: "199",
        });
        this.thumbnail.updateThumbnailState(previewArea, thumbnailState, true);

        isAnimating = false;
        previewArea._isScrollAnimating = false;
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
