/**
 * 默认配置数据
 * 当配置文件不存在或无效时使用
 */

export const defaultConfig = {
  themes: [
    { id: "theme-clean", color: "#fff", border: "#ddd" },
    { id: "theme-paper", color: "#fdfbf7", border: "#f0e6d2" },
    { id: "theme-dark", color: "#1a1a1a", border: "#333" },
    { id: "theme-mist", color: "#e8ecef", border: "#d1d9e0" },
    { id: "theme-pink", color: "#fff0f5", border: "#f8bbd0" },
    { id: "theme-green", color: "#f1f8e9", border: "#c5e1a5" },
    { id: "theme-parchment", color: "#f4e4bc", border: "#d4c5a3" },
    {
      id: "theme-gradient-blue",
      background: "linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)",
    },
    {
      id: "theme-gradient-sunset",
      background: "linear-gradient(120deg, #f6d365 0%, #fda085 100%)",
    },
    {
      id: "theme-gradient-mint",
      background: "linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%)",
    },
  ],
  fonts: [
    { id: "noto-serif", value: "'Noto Serif SC', serif", name: "宋体", subtitle: "标准" },
    { id: "ma-shan-zheng", value: "'Ma Shan Zheng', cursive", name: "马善政", subtitle: "毛笔" },
    { id: "zhi-mang-xing", value: "'Zhi Mang Xing', cursive", name: "志莽行书", subtitle: "行书" },
    { id: "long-cang", value: "'Long Cang', cursive", name: "龙苍行书", subtitle: "行书" },
  ],
  fontColors: [
    { id: "color-black", value: "#1a1a1a", name: "黑色" },
    { id: "color-gray", value: "#666666", name: "灰色" },
    { id: "color-dark-gray", value: "#333333", name: "深灰" },
    { id: "color-brown", value: "#5d4037", name: "棕色" },
    { id: "color-dark-blue", value: "#1e3a5f", name: "深蓝" },
    { id: "color-dark-green", value: "#2e7d32", name: "深绿" },
    { id: "color-red", value: "#c62828", name: "红色" },
    { id: "color-purple", value: "#6a1b9a", name: "紫色" },
  ],
};
