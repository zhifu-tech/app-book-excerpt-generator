# 书摘卡片生成器

一个简单易用的书摘卡片生成工具，可以快速生成精美的书摘图片。

[点击体验](https://zhifu-tech.github.io/apps/book-excerpt-generator/)

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

## 文件结构

```
book-excerpt-generator/
├── index.html                 # 主页面
├── js/                        # JavaScript 模块
│   ├── index.js              # 入口文件
│   ├── app.js                # 主应用
│   ├── config.js             # 配置管理
│   ├── config-service.js     # 配置服务（API 调用）
│   ├── state.js              # 状态管理
│   ├── utils.js              # 工具函数
│   ├── utils/
│   │   └── logger.js         # 日志管理
│   ├── constants/
│   │   └── index.js          # 常量定义
│   ├── types/
│   │   └── index.js          # 类型定义（JSDoc）
│   ├── dom-manager.js        # DOM元素管理
│   ├── renderer.js           # UI渲染器
│   ├── preview-manager.js    # 预览管理器
│   ├── preview-processor.js # 统一预览处理器
│   ├── thumbnail-manager.js # 缩略图管理器
│   ├── mobile-preview-manager.js # 移动端预览管理器
│   └── download-manager.js   # 下载管理器
├── style.css                 # 样式文件
├── package.json              # 项目配置
├── .eslintrc.json            # ESLint 配置
├── .prettierrc               # Prettier 配置
├── jsconfig.json             # TypeScript/JSDoc 配置
├── README.md                 # 说明文档
├── docs/                     # 文档目录
│   ├── API_DOCUMENTATION.md  # API 文档
│   ├── DEVELOPMENT.md        # 开发指南
│   ├── OPTIMIZATION.md       # 代码优化说明
│   └── PROJECT_STRUCTURE.md  # 项目结构说明
└── screenshots/              # 截图目录
    ├── desktop.png           # 桌面端预览截图
    ├── mobile-1.png          # 移动端预览截图 - 编辑界面
    └── mobile-2.png          # 移动端预览截图 - 全屏预览
```

## 架构设计

### 模块说明

#### 核心模块

- **config.js** - 配置常量和数据配置（主题、字体、颜色等）
- **utils.js** - 工具函数集合（防抖、节流、日期格式化等）
- **state.js** - 应用状态管理（AppState 类）
- **dom-manager.js** - DOM元素管理和访问（使用 Proxy 实现按需加载）

#### 功能模块

- **renderer.js** - UI渲染器（主题、字体、颜色等样式更新）
- **preview-manager.js** - 预览内容更新和管理
- **preview-processor.js** - 统一预览处理器（确保缩略图、移动预览、导出使用相同逻辑）
- **thumbnail-manager.js** - 缩略图管理和更新（移动端缩略图状态管理）
- **mobile-preview-manager.js** - 移动端预览交互管理（全屏预览动画）
- **download-manager.js** - 图片下载功能（使用 html2canvas 导出）

#### 应用模块

- **app.js** - 主应用类，整合所有模块
- **index.js** - 应用入口，初始化应用

### 依赖关系

```
config.js (无依赖)
    ↓
utils.js → config.js
state.js (无依赖)
dom-manager.js (无依赖)
    ↓
renderer.js → dom-manager.js, state.js, config.js
preview-manager.js → dom-manager.js, state.js, config.js
preview-processor.js → state.js, config.js
thumbnail-manager.js → dom-manager.js, state.js, config.js, utils.js
download-manager.js → dom-manager.js, state.js, preview-processor.js, preview-manager.js, config.js, utils.js
mobile-preview-manager.js → dom-manager.js, config.js, utils.js
    ↓
app.js → 所有上述模块
    ↓
index.js → app.js
```

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

## 开发说明

### 使用方式

HTML 文件使用模块化入口：

```html
<script type="module" src="js/index.js"></script>
```

### 代码质量

项目采用专业的前端工程化实践：

1. **JSDoc 类型注释**：完整的类型定义和方法注释，提升 IDE 支持和代码可维护性
2. **模块化架构**：清晰的模块划分，职责单一，易于维护和扩展
3. **常量管理**：统一的常量定义，避免魔法字符串，提供类型安全
4. **日志管理**：统一的日志输出接口，支持不同环境下的日志级别控制
5. **错误处理**：统一的错误处理机制，提升健壮性
6. **代码规范**：ESLint + Prettier 确保代码风格一致
7. **类型安全**：JSDoc 类型系统提供编译时类型检查

### 模块化优势

1. **模块化**：每个文件职责单一，易于维护
2. **可维护性**：代码结构清晰，易于定位问题
3. **可扩展性**：新增功能时只需添加新模块
4. **团队协作**：多人开发时减少代码冲突
5. **代码复用**：模块可以在其他项目中复用

### 代码结构

```
js/
├── index.js              # 入口文件
├── app.js               # 主应用类
├── config.js            # 配置常量和数据
├── state.js             # 状态管理
├── utils.js             # 工具函数
├── dom-manager.js       # DOM元素管理
├── renderer.js          # UI渲染器
├── preview-manager.js   # 预览管理器
├── preview-processor.js # 预览处理器
├── thumbnail-manager.js # 缩略图管理器
├── mobile-preview-manager.js # 移动端预览管理器
└── download-manager.js  # 下载管理器
```

### 开发工具

项目包含完整的开发工具配置：

```bash
# 安装依赖
npm install

# 代码检查
npm run lint

# 自动修复代码规范问题
npm run lint:fix

# 代码格式化
npm run format

# 检查代码格式
npm run format:check
```

### 开发指南

详细的开发指南请参考 [docs/DEVELOPMENT.md](./docs/DEVELOPMENT.md)

### 生产环境建议

- 使用构建工具（如 Vite、Webpack）打包成单个或少量文件
- 启用代码压缩和优化
- 利用浏览器缓存机制
- 考虑使用 TypeScript 进行类型安全（可选）

### 代码优化

详细的优化说明请参考 [docs/OPTIMIZATION.md](./docs/OPTIMIZATION.md)

## 许可证

MIT License
