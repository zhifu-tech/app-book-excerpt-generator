/**
 * 配置服务
 * 处理配置数据的读取、保存和验证
 */

import fs from "fs/promises";
import { pathConfig } from "../config/index.js";
import { logger } from "../utils/logger.js";
import { defaultConfig } from "../constants/defaultConfig.js";
import { validateConfig } from "../utils/validator.js";

class ConfigService {
  constructor() {
    this.configFile = pathConfig.configFile;
    this.dataDir = pathConfig.data;
  }

  /**
   * 确保数据目录存在
   */
  async ensureDataDir() {
    try {
      await fs.mkdir(this.dataDir, { recursive: true });
    } catch (error) {
      logger.error("创建数据目录失败", { error: error.message });
      throw error;
    }
  }

  /**
   * 读取配置文件
   * @returns {Promise<Object>} 配置对象
   */
  async loadConfig() {
    try {
      const data = await fs.readFile(this.configFile, "utf-8");
      const config = JSON.parse(data);

      if (validateConfig(config)) {
        logger.info("配置文件加载成功", { file: this.configFile });
        return config;
      } else {
        logger.warn("配置文件格式无效，使用默认配置", { file: this.configFile });
        return defaultConfig;
      }
    } catch (error) {
      if (error.code === "ENOENT") {
        // 文件不存在，创建默认配置
        logger.info("配置文件不存在，创建默认配置", { file: this.configFile });
        await this.saveConfig(defaultConfig);
        return defaultConfig;
      }
      logger.error("读取配置文件失败", { error: error.message, file: this.configFile });
      return defaultConfig;
    }
  }

  /**
   * 保存配置文件
   * @param {Object} config - 配置对象
   * @returns {Promise<boolean>} 是否保存成功
   */
  async saveConfig(config) {
    try {
      // 确保目录存在
      await this.ensureDataDir();

      // 验证配置格式
      if (!validateConfig(config)) {
        logger.warn("保存配置失败: 配置格式无效", { config });
        throw new Error("配置格式无效");
      }

      // 保存配置
      await fs.writeFile(this.configFile, JSON.stringify(config, null, 2), "utf-8");
      logger.info("配置文件保存成功", { file: this.configFile });
      return true;
    } catch (error) {
      logger.error("保存配置文件失败", { error: error.message, file: this.configFile });
      return false;
    }
  }

  /**
   * 获取默认配置
   * @returns {Object} 默认配置对象
   */
  getDefaultConfig() {
    return defaultConfig;
  }
}

export const configService = new ConfigService();
export default configService;
