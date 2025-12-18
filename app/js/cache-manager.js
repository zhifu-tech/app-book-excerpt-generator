/**
 * 缓存管理器
 * @module cache-manager
 * 管理 sidebar 内容的本地存储（localStorage）
 */

/**
 * 缓存键名常量
 */
const CACHE_KEYS = {
  QUOTE: "book-excerpt-quote",
  BOOK: "book-excerpt-book",
  AUTHOR: "book-excerpt-author",
  SEAL: "book-excerpt-seal",
};

/**
 * 缓存管理器类
 * 负责 sidebar 内容的保存和加载
 */
export class CacheManager {
  /**
   * 创建缓存管理器实例
   */
  constructor() {
    this._isAvailable = this._checkLocalStorageAvailable();
  }

  /**
   * 检查 localStorage 是否可用
   * @private
   * @returns {boolean} 是否可用
   */
  _checkLocalStorageAvailable() {
    try {
      const test = "__localStorage_test__";
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * 保存内容到缓存
   * @param {string} key - 缓存键
   * @param {string} value - 要保存的值
   * @returns {boolean} 是否保存成功
   */
  save(key, value) {
    if (!this._isAvailable) {
      return false;
    }

    try {
      if (value === null || value === undefined || value === "") {
        // 如果值为空，删除缓存项
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, value);
      }
      return true;
    } catch (e) {
      console.warn("保存到缓存失败:", e);
      return false;
    }
  }

  /**
   * 从缓存加载内容
   * @param {string} key - 缓存键
   * @param {string} defaultValue - 默认值（如果缓存不存在）
   * @returns {string} 缓存的值或默认值
   */
  load(key, defaultValue = "") {
    if (!this._isAvailable) {
      return defaultValue;
    }

    try {
      const value = localStorage.getItem(key);
      return value !== null ? value : defaultValue;
    } catch (e) {
      console.warn("从缓存加载失败:", e);
      return defaultValue;
    }
  }

  /**
   * 清除所有缓存
   * @returns {boolean} 是否清除成功
   */
  clear() {
    if (!this._isAvailable) {
      return false;
    }

    try {
      Object.values(CACHE_KEYS).forEach((key) => {
        localStorage.removeItem(key);
      });
      return true;
    } catch (e) {
      console.warn("清除缓存失败:", e);
      return false;
    }
  }

  /**
   * 保存 sidebar 内容到缓存
   * @param {Object} data - sidebar 数据对象
   * @param {string} data.quote - 摘录内容
   * @param {string} data.book - 书名/出处
   * @param {string} data.author - 作者
   * @param {string} data.seal - 印章落款
   * @returns {boolean} 是否保存成功
   */
  saveSidebarContent({ quote, book, author, seal }) {
    let success = true;

    if (quote !== undefined) {
      success = this.save(CACHE_KEYS.QUOTE, quote) && success;
    }
    if (book !== undefined) {
      success = this.save(CACHE_KEYS.BOOK, book) && success;
    }
    if (author !== undefined) {
      success = this.save(CACHE_KEYS.AUTHOR, author) && success;
    }
    if (seal !== undefined) {
      success = this.save(CACHE_KEYS.SEAL, seal) && success;
    }

    return success;
  }

  /**
   * 从缓存加载 sidebar 内容
   * @returns {{quote: string, book: string, author: string, seal: string}} sidebar 数据对象
   */
  loadSidebarContent() {
    return {
      quote: this.load(CACHE_KEYS.QUOTE, ""),
      book: this.load(CACHE_KEYS.BOOK, ""),
      author: this.load(CACHE_KEYS.AUTHOR, ""),
      seal: this.load(CACHE_KEYS.SEAL, ""),
    };
  }

  /**
   * 检查是否有缓存的 sidebar 内容
   * @returns {boolean} 是否有缓存
   */
  hasCachedContent() {
    if (!this._isAvailable) {
      return false;
    }

    try {
      return (
        localStorage.getItem(CACHE_KEYS.QUOTE) !== null ||
        localStorage.getItem(CACHE_KEYS.BOOK) !== null ||
        localStorage.getItem(CACHE_KEYS.AUTHOR) !== null ||
        localStorage.getItem(CACHE_KEYS.SEAL) !== null
      );
    } catch (e) {
      return false;
    }
  }
}
