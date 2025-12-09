# 开发指南

本文档介绍如何开发和维护书摘卡片生成器项目。

## 项目结构

```
book-excerpt-generator/
├── js/                          # JavaScript 源代码
│   ├── index.js                 # 应用入口
│   ├── app.js                   # 主应用类
│   ├── config.js                # 配置管理
│   ├── config-service.js        # 配置服务（API 调用）
│   ├── state.js                 # 状态管理
│   ├── utils.js                 # 工具函数
│   ├── utils/
│   │   └── logger.js            # 日志管理
│   ├── constants/
│   │   └── index.js             # 常量定义
│   ├── types/
│   │   └── index.js             # 类型定义（JSDoc）
│   ├── dom-manager.js           # DOM 管理
│   ├── renderer.js              # UI 渲染器
│   ├── preview-manager.js       # 预览管理
│   ├── preview-processor.js     # 预览处理
│   ├── thumbnail-manager.js     # 缩略图管理
│   ├── mobile-preview-manager.js # 移动端预览
│   └── download-manager.js      # 下载管理
├── style.css                    # 样式文件
├── index.html                   # 主页面
├── package.json                 # 项目配置
├── .eslintrc.json              # ESLint 配置
├── .prettierrc                 # Prettier 配置
├── jsconfig.json               # TypeScript/JSDoc 配置
└── docs/                       # 文档目录
    ├── API_DOCUMENTATION.md    # API 文档
    ├── DEVELOPMENT.md          # 开发指南（本文件）
    ├── OPTIMIZATION.md         # 代码优化说明
    └── PROJECT_STRUCTURE.md    # 项目结构说明
```

## 开发环境设置

### 1. 安装依赖

```bash
npm install
```

### 2. 代码检查

```bash
# 检查代码规范
npm run lint

# 自动修复代码规范问题
npm run lint:fix
```

### 3. 代码格式化

```bash
# 格式化代码
npm run format

# 检查代码格式
npm run format:check
```

### 4. 本地开发

由于项目使用 ES6 模块，需要本地服务器运行：

```bash
# 使用 Python
python -m http.server 8000

# 或使用 Node.js
npx serve .

# 或使用 VS Code Live Server 扩展
```

访问 `http://localhost:8000`

## 代码规范

### 1. 命名规范

- **类名**：使用 PascalCase，如 `BookExcerptApp`
- **函数/方法名**：使用 camelCase，如 `formatDate`
- **常量**：使用 UPPER_SNAKE_CASE，如 `LAYOUT_TYPES`
- **私有方法**：使用下划线前缀，如 `_showError`

### 2. 文件组织

- **模块化**：每个文件一个主要功能
- **职责单一**：每个类/函数只做一件事
- **依赖清晰**：明确模块间的依赖关系

### 3. 注释规范

- 使用 JSDoc 格式注释
- 为所有公共方法添加注释
- 为复杂逻辑添加行内注释

示例：

```javascript
/**
 * 格式化日期为 YYYY.MM.DD 格式
 * @param {Date} [date=new Date()] - 要格式化的日期对象
 * @returns {string} 格式化后的日期字符串
 */
formatDate(date = new Date()) {
  // ...
}
```

### 4. 类型定义

使用 JSDoc 类型定义，类型定义在 `js/types/index.js`：

```javascript
/**
 * @typedef {Object} Theme
 * @property {string} id - 主题ID
 * @property {string} [color] - 背景颜色
 */
```

## 日志管理

项目使用统一的日志管理器 `logger`：

```javascript
import { logger } from "./utils/logger.js";

// 调试日志（仅开发环境）
logger.debug("调试信息");

// 信息日志（仅开发环境）
logger.info("信息");

// 警告日志（所有环境）
logger.warn("警告");

// 错误日志（所有环境）
logger.error("错误");
```

### 创建子日志器

```javascript
const childLogger = logger.createChild("ModuleName");
childLogger.info("模块日志");
```

## 常量管理

所有常量定义在 `js/constants/index.js`：

```javascript
import { APP_CONFIG, LAYOUT_TYPES } from "./constants/index.js";
```

## 错误处理

### 统一错误处理

使用 `logger.error()` 记录错误，并向用户显示友好的错误消息：

```javascript
try {
  // 操作
} catch (error) {
  logger.error("操作失败:", error);
  alert("操作失败，请重试");
}
```

## 添加新功能

### 1. 创建新模块

1. 在 `js/` 目录创建新文件
2. 使用 JSDoc 添加类型注释
3. 导出类或函数
4. 在 `app.js` 中集成

### 2. 添加新常量

在 `js/constants/index.js` 中添加：

```javascript
export const NEW_CONSTANT = {
  VALUE1: "value1",
  VALUE2: "value2",
};
```

### 3. 添加新类型

在 `js/types/index.js` 中添加：

```javascript
/**
 * @typedef {Object} NewType
 * @property {string} id - ID
 * @property {number} value - 值
 */
```

## 测试

### 手动测试清单

- [ ] 桌面端功能正常
- [ ] 移动端功能正常
- [ ] 图片导出功能正常
- [ ] 配置加载功能正常
- [ ] 错误处理正常

### 浏览器兼容性

- Chrome/Edge（推荐）
- Firefox
- Safari
- 移动端浏览器

## 性能优化

### 1. 防抖和节流

使用 `Utils.debounce()` 和 `Utils.throttle()` 优化频繁操作：

```javascript
const debouncedUpdate = Utils.debounce(() => {
  updatePreview();
}, 300);
```

### 2. DOM 操作优化

- 使用 `DOMManager` 统一管理 DOM 元素
- 批量更新 DOM，减少重排重绘
- 使用 `transform` 和 `opacity` 实现动画（GPU 加速）

### 3. 图片导出优化

- 使用 `html2canvas` 的 `scale` 选项提高质量
- 移动端使用临时容器避免父元素影响
- 合理设置 `backgroundColor` 选项

## 部署

### 生产环境

1. 确保所有代码已格式化
2. 运行 `npm run lint` 检查代码
3. 测试所有功能
4. 提交代码

### 构建优化（可选）

如果需要进一步优化，可以考虑：

- 使用 Vite/Webpack 打包
- 代码压缩和混淆
- 资源优化（图片、字体）

## 常见问题

### 1. 模块导入错误

确保使用正确的路径和文件扩展名：

```javascript
import { Utils } from "./utils.js"; // ✅
import { Utils } from "./utils"; // ❌
```

### 2. 类型错误

确保类型定义正确导入：

```javascript
/**
 * @typedef {import('./types/index.js').Theme} Theme
 */
```

### 3. 日志不显示

检查是否为开发环境，`logger.debug()` 和 `logger.info()` 仅在开发环境显示。

## 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 运行代码检查
5. 创建 Pull Request

## 参考资源

- [JSDoc 文档](https://jsdoc.app/)
- [ESLint 规则](https://eslint.org/docs/rules/)
- [Prettier 配置](https://prettier.io/docs/en/configuration.html)
