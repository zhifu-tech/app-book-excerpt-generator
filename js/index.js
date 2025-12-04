/**
 * 入口文件 - 初始化应用
 */
import { BookExcerptApp } from "./app.js";

// 确保 DOM 完全加载后再初始化
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    const app = new BookExcerptApp();
    app.init();
  });
} else {
  // DOM 已经加载完成，立即初始化
  const app = new BookExcerptApp();
  app.init();
}
