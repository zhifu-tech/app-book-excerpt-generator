/**
 * 配置验证工具
 * 验证配置数据的格式和有效性
 */

/**
 * 验证主题配置
 * @param {Array} themes - 主题数组
 * @returns {boolean} 是否有效
 */
function validateThemes(themes) {
  if (!Array.isArray(themes)) {
    return false;
  }

  for (const theme of themes) {
    if (!theme || typeof theme !== "object") {
      return false;
    }
    if (!theme.id || typeof theme.id !== "string") {
      return false;
    }
    // 必须有 color 或 background
    if (typeof theme.color !== "string" && typeof theme.background !== "string") {
      return false;
    }
  }

  return true;
}

/**
 * 验证字体配置
 * @param {Array} fonts - 字体数组
 * @returns {boolean} 是否有效
 */
function validateFonts(fonts) {
  if (!Array.isArray(fonts)) {
    return false;
  }

  for (const font of fonts) {
    if (!font || typeof font !== "object") {
      return false;
    }
    if (
      !font.id ||
      typeof font.id !== "string" ||
      !font.value ||
      typeof font.value !== "string" ||
      !font.name ||
      typeof font.name !== "string"
    ) {
      return false;
    }
  }

  return true;
}

/**
 * 验证字体颜色配置
 * @param {Array} fontColors - 字体颜色数组
 * @returns {boolean} 是否有效
 */
function validateFontColors(fontColors) {
  if (!Array.isArray(fontColors)) {
    return false;
  }

  for (const color of fontColors) {
    if (!color || typeof color !== "object") {
      return false;
    }
    if (
      !color.id ||
      typeof color.id !== "string" ||
      !color.value ||
      typeof color.value !== "string" ||
      !color.name ||
      typeof color.name !== "string"
    ) {
      return false;
    }
  }

  return true;
}

/**
 * 验证配置数据格式
 * @param {Object} config - 配置对象
 * @returns {boolean} 配置是否有效
 */
export function validateConfig(config) {
  if (!config || typeof config !== "object") {
    return false;
  }

  // 验证主题配置（可选）
  if (config.themes !== undefined && !validateThemes(config.themes)) {
    return false;
  }

  // 验证字体配置（可选）
  if (config.fonts !== undefined && !validateFonts(config.fonts)) {
    return false;
  }

  // 验证字体颜色配置（可选）
  if (config.fontColors !== undefined && !validateFontColors(config.fontColors)) {
    return false;
  }

  return true;
}
