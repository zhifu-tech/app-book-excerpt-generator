# 书摘卡片生成器

一个简单易用的书摘卡片生成工具，可以快速生成精美的书摘图片。

[点击体验](https://book-excerpt.zhifu.tech/)

## 预览截图

### 桌面端预览

![桌面端预览](./screenshots/desktop.png)

### 移动端预览

![移动端预览 - 编辑界面](./screenshots/mobile-1.png)

![移动端预览 - 全屏预览](./screenshots/mobile-2.png)

## 功能特性

- 📝 **实时预览**：输入内容后实时预览效果
- 🎨 **多种主题**：内置 10+ 精美主题，包括纯色和渐变背景
- 🔤 **字体选择**：支持多种中文字体，包括宋体、毛笔字体、行书字体等
- 🎯 **布局切换**：支持横排和竖排两种布局方式
- 📱 **响应式设计**：完美适配桌面端和移动端
- 💾 **一键导出**：支持导出为高清 PNG 图片
- 🎨 **自定义样式**：可调整字体大小、颜色、卡片宽度等

## 使用方法

1. 在输入框中填写：
   - **摘录内容**：要展示的文字内容
   - **书名/出处**：书籍名称或来源
   - **作者**：作者姓名
   - **印章落款**：印章文字（最多4字）

2. 自定义样式：
   - 选择主题背景
   - 选择字体和字号
   - 选择字体颜色
   - 调整卡片宽度
   - 切换横排/竖排布局

3. 预览和导出：
   - 在预览区域实时查看效果
   - 点击"保存"按钮导出为 PNG 图片

## 技术栈

- **HTML5** - 语义化标记
- **CSS3** - 使用 CSS 变量和 Flexbox，响应式设计
- **JavaScript (ES6+)** - 模块化架构，使用 ES6 模块
- **html2canvas** - 用于图片导出
- **JSDoc** - 类型注释和文档生成
- **ESLint** - 代码质量检查
- **Prettier** - 代码格式化

## 后端服务

本项目包含配套的后端服务，位于 `server/` 目录下，以支持：
- 动态配置加载（主题、字体、颜色等）
- 配置信息的保存和同步

如果未连接到服务器，前端应用将自动回退到使用内置的默认配置。

## 核心组件说明

### 1. 统一管理脚本 (run.sh)
位于根目录的 `run.sh` 是管理整个项目的唯一入口。它封装了：
- 前端和后端的部署流程（支持 Docker 和 PM2）
- 远程服务器的状态检查
- Nginx 配置的自动化更新
- 数据同步工具

### 2. 前端应用 (app)
前端采用纯原生 JavaScript 开发，使用 ES6 模块化方案。
- **PreviewProcessor**: 核心逻辑，确保在实时预览、导出图片和移动端预览时保持视觉一致。
- **State Management**: 使用单一状态机管理应用数据。

### 3. 后端服务 (server)
后端使用 Node.js + Express 架构。
- **Dynamic Config**: 支持动态加载和更新主题、字体等配置，无需重新发布前端。
- **Persistence**: 简单的 JSON 文件存储，方便备份和同步。

## 开发规范

- **前后端解耦**: 前端通过 API 与后端通信，支持离线降级到默认配置。
- **脚本驱动**: 所有的管理和部署操作都应通过 `run.sh` 完成，避免手动操作服务器。
- **环境一致性**: 使用 Docker 确保开发、测试和生产环境的一致性。

## 文件结构

```sh
book-excerpt-generator/
├── app/                        # 前端应用
│   ├── index.html              # 主页面
│   ├── style.css               # 样式文件
│   ├── js/                     # JavaScript 模块
│   ├── scripts/                # 前端 Nginx 配置与 SSL
│   ├── package.json           # 前端依赖配置
│   └── Dockerfile             # 前端 Docker 镜像
├── server/                     # 后端服务
│   ├── server.js               # 服务器入口
│   ├── src/                    # 后端源代码
│   ├── scripts/                # 后端 Nginx 配置与 SSL
│   ├── data/                   # 后端数据目录
│   ├── package.json           # 后端依赖配置
│   └── Dockerfile             # 后端 Docker 镜像
├── docs/                       # 项目文档
├── screenshots/                # 预览截图
├── scripts/                    # 统用工具脚本 (run.sh 依赖)
│   ├── nginx-utils.sh         # Nginx 处理工具
│   └── ssh-utils.sh           # SSH 连接工具
├── run.sh                      # 唯一管理脚本 (v2.1+)
└── README.md                   # 项目说明
```

## 架构设计

### 模块说明

本项目采用前后端分离架构，统一由根目录的 `run.sh` 进行管理。

#### 前端 (app)
- **核心逻辑**：基于 ES6 模块，使用 `PreviewProcessor` 统一处理各种场景的预览
- **状态管理**：使用 `AppState` 进行全局状态管理
- **性能优化**：通过 `DOMManager` Proxy 机制实现 DOM 按需加载

#### 后端 (server)
- **核心框架**：Express.js
- **部署方式**：支持 PM2 和 Docker 两种部署方式
- **功能说明**：提供动态配置加载和持久化存储

### 管理脚本 (run.sh)

`run.sh` 是本项目的统一管理入口，支持以下功能：
- 前端部署（Docker）
- 后端部署（PM2/Docker）
- Nginx 配置更新
- 数据备份与同步

使用方法：
```bash
./run.sh [module] [command]
```
详情请运行 `./run.sh help` 查看。

### 核心设计原则

1. **统一处理原则**：所有预览场景（桌面预览、移动预览、缩略图、导出）都使用 `PreviewProcessor` 统一处理，确保视觉一致性
2. **单一数据源**：所有预览都基于同一个 DOM 元素（`#card-preview`），避免数据不一致
3. **状态管理统一**：所有缩略图状态变化都通过 `ThumbnailManager` 的方法
4. **性能优化**：使用防抖、节流等技术优化频繁更新操作
5. **响应式设计**：缩略图自适应高度，移动预览支持全屏动画

### 缩略图状态管理

所有缩略图状态操作都通过 `ThumbnailManager` 的统一接口：

- **getThumbnailState()** - 获取当前状态（优先返回已保存的状态）
- **createThumbnailState()** - 创建新状态（支持自定义选项）
- **updateThumbnailState()** - 更新状态（可选择是否立即应用到 DOM）
- **applyThumbnailState()** - 应用状态到 DOM
- **getThumbnailPosition()** - 获取位置信息（兼容方法）

状态保存在 `previewArea._thumbnailState`，但只能通过 `ThumbnailManager` 的方法访问和修改。

### 性能优化

1. **防抖（Debounce）**
   - 缩略图更新：300ms 延迟
   - 避免频繁的 html2canvas 调用

2. **节流（Throttle）**
   - 滚动事件处理
   - 窗口大小调整

3. **DOM 按需加载**
   - `DOMManager` 使用 Proxy 实现按需加载 DOM 元素
   - 减少初始加载时间

4. **像素对齐优化**
   - 所有位置计算使用 `Math.round()` 确保整数像素
   - 避免亚像素渲染导致的抖动
   - Transform 中的 `translateY()` 值进行像素对齐

5. **硬件加速**
   - 使用 `transform` 和 `opacity`（GPU 加速）
   - 避免 `left/top` 重排

### 移动端特性

1. **缩略图预览**
   - 固定宽度，自适应高度
   - 使用 DOM 缩放（`transform: scale(0.4)`）而非 html2canvas，确保清晰度
   - 位置在下载按钮上方

2. **全屏预览**
   - 平滑的打开/关闭动画
   - 支持点击预览区域关闭
   - 支持 ESC 键关闭

3. **滚动动画**
   - 滚动时缩略图平滑移动到右上角
   - 使用 `translateY` 实现垂直移动
   - 保持缩放比例不变

## 浏览器支持

- Chrome/Edge（推荐）
- Firefox
- Safari
- 移动端浏览器

**注意**：使用 ES6 模块 (`import/export`)，需要支持 ES6 模块的现代浏览器。如果需要在旧浏览器运行，需要使用构建工具（如 Webpack、Vite、Rollup）打包。

## 开发指南

### 开发环境设置

#### 1. 安装依赖

```bash
npm install
```

#### 2. 代码检查

```bash
# 检查代码规范
npm run lint

# 自动修复代码规范问题
npm run lint:fix
```

#### 3. 代码格式化

```bash
# 格式化代码
npm run format

# 检查代码格式
npm run format:check
```

#### 4. 本地开发

由于项目使用 ES6 模块，需要本地服务器运行：

```bash
# 使用 Python
python -m http.server 8000

# 或使用 Node.js
npx serve .

# 或使用 VS Code Live Server 扩展
```

访问 `http://localhost:8000`

### 代码规范

#### 1. 命名规范

- **类名**：使用 PascalCase，如 `BookExcerptApp`
- **函数/方法名**：使用 camelCase，如 `formatDate`
- **常量**：使用 UPPER_SNAKE_CASE，如 `LAYOUT_TYPES`
- **私有方法**：使用下划线前缀，如 `_showError`

#### 2. 文件组织

- **模块化**：每个文件一个主要功能
- **职责单一**：每个类/函数只做一件事
- **依赖清晰**：明确模块间的依赖关系

#### 3. 注释规范

使用 JSDoc 格式注释，为所有公共方法添加注释：

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

#### 4. 类型定义

使用 JSDoc 类型定义，类型定义在 `js/types/index.js`：

```javascript
/**
 * @typedef {Object} Theme
 * @property {string} id - 主题ID
 * @property {string} [color] - 背景颜色
 */
```

### 日志管理

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

#### 创建子日志器

```javascript
const childLogger = logger.createChild("ModuleName");
childLogger.info("模块日志");
```

### 常量管理

所有常量定义在 `js/constants/index.js`：

```javascript
import { APP_CONFIG, LAYOUT_TYPES } from "./constants/index.js";
```

### 错误处理

使用 `logger.error()` 记录错误，并向用户显示友好的错误消息：

```javascript
try {
  // 操作
} catch (error) {
  logger.error("操作失败:", error);
  alert("操作失败，请重试");
}
```

### 添加新功能

#### 1. 创建新模块

1. 在 `js/` 目录创建新文件
2. 使用 JSDoc 添加类型注释
3. 导出类或函数
4. 在 `app.js` 中集成

#### 2. 添加新常量

在 `js/constants/index.js` 中添加：

```javascript
export const NEW_CONSTANT = {
  VALUE1: "value1",
  VALUE2: "value2",
};
```

#### 3. 添加新类型

在 `js/types/index.js` 中添加：

```javascript
/**
 * @typedef {Object} NewType
 * @property {string} id - ID
 * @property {number} value - 值
 */
```

### 测试

#### 手动测试清单

- [ ] 桌面端功能正常
- [ ] 移动端功能正常
- [ ] 图片导出功能正常
- [ ] 配置加载功能正常
- [ ] 错误处理正常

#### 浏览器兼容性

- Chrome/Edge（推荐）
- Firefox
- Safari
- 移动端浏览器

### 性能优化

#### 1. 防抖和节流

使用 `Utils.debounce()` 和 `Utils.throttle()` 优化频繁操作：

```javascript
const debouncedUpdate = Utils.debounce(() => {
  updatePreview();
}, 300);
```

#### 2. DOM 操作优化

- 使用 `DOMManager` 统一管理 DOM 元素
- 批量更新 DOM，减少重排重绘
- 使用 `transform` 和 `opacity` 实现动画（GPU 加速）

#### 3. 图片导出优化

- 使用 `html2canvas` 的 `scale` 选项提高质量
- 移动端使用临时容器避免父元素影响
- 合理设置 `backgroundColor` 选项

### 生产环境建议

1. 确保所有代码已格式化
2. 运行 `npm run lint` 检查代码
3. 测试所有功能
4. 提交代码

#### 构建优化（可选）

如果需要进一步优化，可以考虑：

- 使用 Vite/Webpack 打包
- 代码压缩和混淆
- 资源优化（图片、字体）

### 常见问题

#### 1. 模块导入错误

确保使用正确的路径和文件扩展名：

```javascript
import { Utils } from "./utils.js"; // ✅
import { Utils } from "./utils"; // ❌
```

#### 2. 类型错误

确保类型定义正确导入：

```javascript
/**
 * @typedef {import('./types/index.js').Theme} Theme
 */
```

#### 3. 日志不显示

检查是否为开发环境，`logger.debug()` 和 `logger.info()` 仅在开发环境显示。

### 代码质量

项目采用专业的前端工程化实践：

1. **JSDoc 类型注释**：完整的类型定义和方法注释，提升 IDE 支持和代码可维护性
2. **模块化架构**：清晰的模块划分，职责单一，易于维护和扩展
3. **常量管理**：统一的常量定义，避免魔法字符串，提供类型安全
4. **日志管理**：统一的日志输出接口，支持不同环境下的日志级别控制
5. **错误处理**：统一的错误处理机制，提升健壮性
6. **代码规范**：ESLint + Prettier 确保代码风格一致
7. **类型安全**：JSDoc 类型系统提供编译时类型检查

## 部署

### 统一管理脚本

项目使用根目录下的 `run.sh` 脚本管理所有部署和管理操作：

```bash
chmod +x run.sh
./run.sh [module] [command] [options]
```

### 常用命令示例

- `app docker-deploy` - 部署前端应用到服务器
- `app update-nginx` - 更新前端 Nginx 配置文件
- `server deploy` - 使用 PM2 部署后端服务
- `server status` - 检查后端状态
- `help` - 显示帮助信息

### 快速部署前端

```bash
./run.sh app docker-deploy
```

### 部署说明

详细的部署指南请参考 [docs/DEPLOY.md](./docs/DEPLOY.md)

**⚠️ 部署后使改动生效**: 部署完成后，由于浏览器缓存，可能需要强制刷新浏览器（`Ctrl+Shift+R` 或 `Cmd+Shift+R`）才能看到最新改动。

**部署信息**:

- 服务器地址: 8.138.183.116
- 前端部署目录: `/var/www/html/book-excerpt-generator`
- 访问地址: `https://book-excerpt.zhifu.tech`

### 检查部署状态

```bash
./run.sh app check
./run.sh server status
```

## 许可证

MIT License
