# 书摘卡片生成器 - 预览与缩略图系统设计文档

## 1. 概要设计

### 1.1 系统架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                        应用主入口 (App)                          │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   状态管理 (AppState)                    │   │
│  │  - theme, layout, font, fontSize, fontColor, cardWidth  │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────┐
        │      DOM 管理器 (DOMManager)            │
        │  管理所有 DOM 元素的引用和操作          │
        └─────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  预览管理器   │    │  渲染器      │    │  事件管理器   │
│PreviewManager│    │  Renderer    │    │EventHandler  │
└──────────────┘    └──────────────┘    └──────────────┘
        │                     │                     │
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────┐
        │    统一预览处理器 (PreviewProcessor)     │
        │  核心：确保所有预览场景使用相同逻辑      │
        │  ┌──────────────────────────────────┐  │
        │  │  getCardBackground()              │  │
        │  │  cleanupClonedDoc()               │  │
        │  │  processVerticalLayout()          │  │
        │  │  getBackgroundColor()             │  │
        │  └──────────────────────────────────┘  │
        └─────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  缩略图管理器 │    │ 移动预览管理器│    │  下载管理器   │
│ThumbnailMgr  │    │MobilePreview │    │DownloadMgr   │
│              │    │    Manager   │    │              │
│ 使用统一处理  │    │              │    │ 使用统一处理  │
│ 器生成缩略图 │    │ 全屏预览动画  │    │ 器导出图片    │
└──────────────┘    └──────────────┘    └──────────────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │   html2canvas   │
                    │   图片生成库    │
                    └─────────────────┘
```

### 1.2 核心设计原则

1. **统一处理原则**：所有预览场景（桌面预览、移动预览、缩略图、导出）都使用 `PreviewProcessor` 统一处理，确保视觉一致性
2. **单一数据源**：所有预览都基于同一个 DOM 元素（`#card-preview`），避免数据不一致
3. **性能优化**：使用防抖、节流等技术优化频繁更新操作
4. **响应式设计**：缩略图自适应高度，移动预览支持全屏动画

### 1.3 数据流

```
用户输入/操作
    │
    ▼
AppState 更新
    │
    ▼
PreviewManager 更新 DOM
    │
    ▼
ThumbnailManager / MobilePreviewManager / DownloadManager
    │
    ▼
PreviewProcessor 统一处理
    │
    ▼
html2canvas 生成图片
```

## 2. 模块详细设计

### 2.1 PreviewProcessor（统一预览处理器）

#### 2.1.1 职责

- 统一处理所有预览场景的样式和布局
- 确保缩略图、移动预览、导出使用完全相同的处理逻辑
- 处理主题背景、竖排布局、克隆文档清理等通用逻辑

#### 2.1.2 类结构

```javascript
class PreviewProcessor {
  constructor(state: AppState)

  // 获取卡片背景样式信息
  getCardBackground(card: HTMLElement): CardBackgroundInfo

  // 清理克隆文档，准备 html2canvas 渲染
  cleanupClonedDoc(
    clonedDoc: Document,
    cardBackground: CardBackground,
    theme: Theme
  ): void

  // 处理竖排布局
  processVerticalLayout(clonedDoc: Document): void

  // 获取 html2canvas 的 backgroundColor 选项
  getBackgroundColor(
    cardBackground: CardBackground,
    theme: Theme
  ): string | null
}
```

#### 2.1.3 核心方法设计

**getCardBackground()**

- **输入**：卡片 DOM 元素
- **输出**：包含背景样式信息的对象
- **逻辑**：
  1. 从 `THEMES` 配置中查找当前主题
  2. 获取卡片的计算样式
  3. 返回合并后的背景信息（包括渐变、纯色、图片等）

**cleanupClonedDoc()**

- **输入**：克隆的文档对象、背景信息、主题配置
- **输出**：无（直接修改克隆文档）
- **逻辑**：
  1. 清理预览区域的背景和伪元素
  2. 移除包装器的阴影和变换
  3. 注入主题样式（确保渐变正确渲染）
  4. 设置卡片背景（优先使用主题配置）
  5. 设置文字颜色
  6. 确保卡片可见性和尺寸

**processVerticalLayout()**

- **输入**：克隆的文档对象
- **输出**：无（直接修改克隆文档）
- **逻辑**：
  1. 获取文字内容和样式信息
  2. 计算每列字符数（基于最大高度和行高）
  3. 创建列容器，按列分割文字
  4. 设置竖排样式（从右到左排列）
  5. 调整引号位置（绝对定位）

**getBackgroundColor()**

- **输入**：背景信息、主题配置
- **输出**：背景色字符串或 null
- **逻辑**：
  1. 如果是渐变背景，返回 null（让渐变完全显示）
  2. 如果是纯色背景，返回实际背景色
  3. 如果是图片背景，返回 null

### 2.2 ThumbnailManager（缩略图管理器）

#### 2.2.1 职责

- 生成和管理移动端缩略图预览
- 实现自适应高度和内容缩放
- 处理缩略图位置定位
- 优化性能（防抖更新）

#### 2.2.2 类结构

```javascript
class ThumbnailManager {
  constructor(dom: DOMManager, state: AppState)

  // 更新缩略图（防抖）
  updateThumbnail(): void

  // 内部更新方法
  _updateThumbnail(): void

  // 恢复缩略图位置
  restorePosition(): void
}
```

#### 2.2.3 核心方法设计

**updateThumbnail()**

- **设计模式**：防抖包装器
- **延迟时间**：300ms（`CONFIG.THUMBNAIL_UPDATE_DELAY`）
- **目的**：避免频繁更新，优化性能

**\_updateThumbnail()**

- **输入**：无（从 DOM 和 State 获取数据）
- **输出**：无（直接更新 DOM）
- **核心逻辑**：
  1. **准备阶段**：
     - 获取卡片和缩略图容器元素
     - 首次加载时设置初始透明状态
     - 保存按钮位置信息
  2. **样式处理**：
     - 使用 `PreviewProcessor` 获取背景样式
     - 保存原始样式（transform, boxShadow, opacity）
     - 临时移除样式，准备渲染
  3. **尺寸计算**：
     - 固定宽度：160px
     - 最大高度：屏幕高度的 50%
     - 计算卡片宽高比
     - 计算理想缩略图高度（保持宽高比）
     - 如果超过最大高度，计算内容缩放比例
  4. **Canvas 生成**：
     - 计算 html2canvas 缩放比例
     - 调用 html2canvas，使用 `PreviewProcessor` 处理
     - 处理竖排布局（如果需要）
  5. **缩略图绘制**：
     - 创建目标 canvas（160px × 实际高度）
     - 填充白色背景
     - 居中绘制卡片内容（考虑缩放）
  6. **恢复和动画**：
     - 恢复卡片原始样式
     - 恢复缩略图位置
     - 首次加载时添加淡入动画

**restorePosition()**

- **职责**：计算并设置缩略图位置
- **诉求**：缩略图的右下角应该在下载按钮的上方
- **逻辑**：
  1. 获取下载按钮的位置信息
  2. 计算 right 值：窗口宽度 - 下载按钮右边缘
  3. 计算 bottom 值：窗口高度 - 下载按钮顶部 + 间距（8px）
  4. 设置位置样式
  5. 保存位置信息到 State

#### 2.2.4 尺寸计算算法

```
输入：
  - cardWidth: 卡片宽度（如 400px）
  - cardHeight: 卡片高度（如 600px）
  - thumbnailWidth: 固定宽度（160px）
  - maxThumbnailHeight: 最大高度（屏幕高度 × 0.5）

计算：
  1. cardAspectRatio = cardWidth / cardHeight
  2. idealThumbnailHeight = thumbnailWidth / cardAspectRatio
  3. if idealThumbnailHeight > maxThumbnailHeight:
       contentScale = maxThumbnailHeight / idealThumbnailHeight
       actualThumbnailHeight = maxThumbnailHeight
     else:
       contentScale = 1
       actualThumbnailHeight = idealThumbnailHeight
  4. baseScale = thumbnailWidth / cardWidth
  5. finalScale = baseScale × contentScale × THUMBNAIL_SCALE (0.95)
```

### 2.3 MobilePreviewManager（移动预览管理器）

#### 2.3.1 职责

- 管理移动端全屏预览功能
- 实现平滑的打开/关闭动画
- 处理触摸事件和手势识别
- 支持滑动关闭预览

#### 2.3.2 类结构

```javascript
class MobilePreviewManager {
  constructor(dom: DOMManager)

  // 初始化事件监听
  init(): void

  // 切换预览状态
  togglePreview(previewArea: HTMLElement): void

  // 打开预览
  openPreview(previewArea: HTMLElement): void

  // 关闭预览
  closePreview(previewArea: HTMLElement): void

  // 初始化滑动关闭
  initSwipeToClose(previewArea: HTMLElement): void
}
```

#### 2.3.3 核心方法设计

**init()**

- **职责**：初始化所有事件监听器
- **事件处理**：
  1. **touchend**：触摸结束事件
     - 检查是否拖动（移动距离 > 阈值）
     - 如果是点击，切换预览
  2. **touchstart**：保存触摸起始位置
  3. **click**：鼠标点击（桌面端测试）
  4. **预览区域点击**：关闭预览
  5. **ESC 键**：关闭预览
  6. **滑动关闭**：初始化滑动关闭功能

**openPreview()**

- **输入**：预览区域 DOM 元素
- **输出**：无（直接修改 DOM）
- **动画设计**：两阶段动画
  1. **阶段1：设置初始状态**
     - 禁用所有过渡
     - 获取缩略图当前位置和尺寸
     - 计算预览内容的初始缩放（与缩略图一致）
     - 计算预览内容的初始位置（中心对齐）
     - 设置预览区域初始状态（透明、不可交互）
  2. **阶段2：执行动画**
     - 启用过渡
     - 缩略图：放大并淡出（移动到屏幕中心）
     - 预览内容：同步放大并淡入（从缩略图位置到全屏）
     - 预览区域：淡入
     - 侧边栏：淡出隐藏
  3. **状态管理**：
     - 标记预览模式
     - 禁用拖动
     - 隐藏 body 滚动

**closePreview()**

- **输入**：预览区域 DOM 元素
- **输出**：无（直接修改 DOM）
- **动画设计**：反向动画
  1. **阶段1：设置初始状态**
     - 禁用所有过渡
     - 获取缩略图原始位置和尺寸
     - 计算预览内容的目标缩放（缩小到缩略图大小）
     - 计算预览内容的目标位置（对齐缩略图中心）
  2. **阶段2：执行动画**
     - 启用过渡
     - 预览内容：缩小并淡出（从全屏到缩略图位置）
     - 缩略图：同步缩小并淡入（从屏幕中心到原始位置）
     - 预览区域：淡出
     - 侧边栏：淡入显示
  3. **状态管理**：
     - 取消预览模式标记
     - 启用拖动
     - 恢复 body 滚动

**initSwipeToClose()**

- **职责**：初始化滑动关闭功能
- **逻辑**：
  1. 监听触摸事件（touchstart, touchmove, touchend）
  2. 计算滑动距离和方向
  3. 如果向下滑动超过阈值，关闭预览
  4. 添加滑动反馈动画

#### 2.3.4 动画参数

```javascript
动画时长：300ms (CONFIG.ANIMATION_DURATION.SLOW)
缓动函数：cubic-bezier(0.4, 0, 0.2, 1)
缩放计算：Math.max(scaleX, scaleY) × 1.05（确保覆盖全屏）
```

### 2.4 PreviewManager（预览管理器）

#### 2.4.1 职责

- 管理桌面端预览区域的实时更新
- 处理主题、布局、字体等样式变更
- 管理缩放功能

#### 2.4.2 类结构

```javascript
class PreviewManager {
  constructor(dom: DOMManager, state: AppState)

  // 更新预览内容
  updatePreview(): void

  // 更新印章
  updateSeal(): void

  // 设置主题
  setTheme(themeId: string): void

  // 设置布局
  setLayout(layout: 'horizontal' | 'vertical'): void

  // 设置字体
  setFont(fontValue: string): void

  // 设置字号
  setFontSize(size: number): void

  // 设置字体颜色
  setFontColor(colorValue: string): void

  // 设置卡片宽度
  setCardWidth(width: number): void

  // 设置缩放
  setZoom(zoom: number): void
}
```

#### 2.4.3 核心方法设计

**updatePreview()**

- **职责**：更新预览区域的文字内容
- **逻辑**：
  1. 从输入框获取内容
  2. 淡出动画（opacity: 0.5）
  3. 更新文字内容
  4. 应用字体样式
  5. 淡入动画（opacity: 1）

**updateSeal()**

- **职责**：根据输入长度动态生成印章布局
- **布局规则**：
  - 1字：单行居中，28px
  - 2字：上下排列，18px
  - 3字：左1右2，16px
  - 4字：2×2网格，16px

**setTheme()**

- **逻辑**：
  1. 更新 State
  2. 卡片淡出并缩小（opacity: 0.8, scale: 0.98）
  3. 更新卡片类名
  4. 卡片淡入并恢复（opacity: 1, scale: 1）
  5. 更新主题选项状态

**setLayout()**

- **逻辑**：
  1. 更新 State
  2. 卡片淡出并缩小（opacity: 0.7, scale: 0.95）
  3. 切换 vertical-mode 类
  4. 卡片淡入并恢复
  5. 更新单选框状态

### 2.5 DownloadManager（下载管理器）

#### 2.5.1 职责

- 处理图片导出功能
- 使用 `PreviewProcessor` 确保导出与预览一致
- 管理下载按钮的加载状态

#### 2.5.2 类结构

```javascript
class DownloadManager {
  constructor(
    dom: DOMManager,
    state: AppState,
    previewManager: PreviewManager
  )

  // 下载图片
  download(): Promise<void>

  // 设置加载状态
  setLoadingState(
    btn: HTMLElement,
    isLoading: boolean,
    isSuccess?: boolean
  ): void

  // 保存卡片样式
  saveCardStyles(card: HTMLElement): CardStyles

  // 恢复卡片样式
  restoreCardStyles(card: HTMLElement, styles: CardStyles): void

  // 准备卡片用于捕获
  prepareCardForCapture(card: HTMLElement): void

  // 获取 Canvas 选项
  getCanvasOptions(
    cardBackground: CardBackground,
    theme: Theme
  ): html2canvas.Options

  // 下载 Canvas
  downloadCanvas(canvas: HTMLCanvasElement): void
}
```

#### 2.5.3 核心方法设计

**download()**

- **流程**：
  1. 显示加载状态
  2. 使用 `PreviewProcessor` 获取背景样式
  3. 保存原始样式和缩放
  4. 准备卡片（移除 transform、shadow 等）
  5. 重置缩放为 1
  6. 等待 300ms（确保样式应用）
  7. 调用 html2canvas，使用 `PreviewProcessor` 处理
  8. 恢复样式和缩放
  9. 下载图片
  10. 更新按钮状态

**getCanvasOptions()**

- **返回**：html2canvas 配置对象
- **配置项**：
  - scale: 2（高清）
  - useCORS: true
  - backgroundColor: 从 `PreviewProcessor` 获取
  - onclone: 使用 `PreviewProcessor.cleanupClonedDoc()` 和 `processVerticalLayout()`

## 3. 技术细节

### 3.1 性能优化

1. **防抖（Debounce）**
   - 缩略图更新：300ms 延迟
   - 避免频繁的 html2canvas 调用

2. **节流（Throttle）**
   - 滚动事件处理
   - 窗口大小调整

3. **延迟渲染**
   - 首次加载时延迟显示缩略图
   - 使用淡入动画提升体验

4. **Canvas 优化**
   - `willReadFrequently: true`：优化多次读取性能
   - 合理的缩放比例：平衡质量和性能

### 3.2 一致性保证

1. **统一处理器**
   - 所有预览场景都使用 `PreviewProcessor`
   - 确保样式处理逻辑完全一致

2. **单一数据源**
   - 所有预览都基于同一个 DOM 元素
   - 避免数据同步问题

3. **样式注入**
   - 在克隆文档中注入主题样式
   - 使用 `!important` 确保优先级

### 3.3 响应式设计

1. **缩略图自适应**
   - 固定宽度：160px
   - 自适应高度：基于卡片宽高比
   - 最大高度限制：屏幕高度的 50%
   - 内容缩放：超过最大高度时缩放内容

2. **移动预览**
   - 全屏显示
   - 平滑的打开/关闭动画
   - 支持滑动关闭

## 4. 使用示例

### 4.1 初始化

```javascript
// 创建状态管理
const state = new AppState();

// 创建 DOM 管理器
const dom = new DOMManager();

// 创建预览管理器
const previewManager = new PreviewManager(dom, state);

// 创建缩略图管理器（使用统一处理器）
const thumbnail = new ThumbnailManager(dom, state);

// 创建移动预览管理器
const mobilePreview = new MobilePreviewManager(dom);

// 创建下载管理器（使用统一处理器）
const download = new DownloadManager(dom, state, previewManager);
```

### 4.2 更新缩略图

```javascript
// 当状态改变时，自动更新缩略图
state.update({ theme: "theme-dark" });
thumbnail.updateThumbnail(); // 防抖更新
```

### 4.3 导出图片

```javascript
// 用户点击下载按钮
download.download(); // 使用统一处理器确保一致性
```

## 5. 总结

本设计通过 `PreviewProcessor` 统一处理所有预览场景，确保了：

1. **视觉一致性**：缩略图、移动预览、导出使用相同的处理逻辑
2. **代码复用**：避免重复代码，易于维护
3. **性能优化**：使用防抖、节流等技术优化性能
4. **用户体验**：平滑的动画、响应式设计、直观的交互

整个系统采用模块化设计，职责清晰，易于扩展和维护。
