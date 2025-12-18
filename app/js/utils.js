/**
 * 工具函数
 * @module utils
 */
import { CONFIG } from "./config.js";

/**
 * 工具函数集合
 */
export const Utils = {
  /**
   * 防抖函数
   * @template T
   * @param {(...args: T[]) => void} func - 要防抖的函数
   * @param {number} wait - 等待时间（毫秒）
   * @returns {(...args: T[]) => void} 防抖后的函数
   */
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

  /**
   * 节流函数
   * @template T
   * @param {(...args: T[]) => void} func - 要节流的函数
   * @param {number} limit - 时间限制（毫秒）
   * @returns {(...args: T[]) => void} 节流后的函数
   */
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

  /**
   * 格式化日期为 YYYY.MM.DD 格式
   * @param {Date} [date=new Date()] - 要格式化的日期对象
   * @returns {string} 格式化后的日期字符串
   */
  formatDate(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}.${month}.${day}`;
  },

  /**
   * 创建加载动画样式（如果尚未创建）
   */
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

  /**
   * 判断当前是否为移动端设备
   * @returns {boolean} 是否为移动端
   */
  isMobile() {
    return window.innerWidth <= CONFIG.MOBILE_BREAKPOINT;
  },
};
