# 配置服务 API 文档

## 概述

配置服务允许从服务器动态加载和保存配置数据（主题、字体、字体颜色等），实现配置的集中管理和动态更新。

## API 端点

### 获取配置

**请求**

```
GET /api/config
```

**响应**

```json
{
  "themes": [
    {
      "id": "theme-clean",
      "color": "#fff",
      "border": "#ddd"
    },
    {
      "id": "theme-gradient-blue",
      "background": "linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)"
    }
  ],
  "fonts": [
    {
      "id": "noto-serif",
      "value": "'Noto Serif SC', serif",
      "name": "宋体",
      "subtitle": "标准"
    }
  ],
  "fontColors": [
    {
      "id": "color-black",
      "value": "#1a1a1a",
      "name": "黑色"
    }
  ]
}
```

### 保存配置

**请求**

```
POST /api/config
Content-Type: application/json
```

**请求体**

```json
{
  "themes": [...],
  "fonts": [...],
  "fontColors": [...]
}
```

**响应**

```json
{
  "success": true
}
```

## 使用方式

### 1. 设置服务器地址（可选）

```javascript
import { setConfigBaseUrl } from "./js/config.js";

// 设置服务器基础URL
setConfigBaseUrl("https://api.example.com");
```

### 2. 初始化配置

配置会在应用初始化时自动从服务器加载。如果服务器不可用，将使用默认配置。

```javascript
import { initConfig } from "./js/config.js";

// 手动初始化配置（通常不需要，应用会自动调用）
await initConfig();
```

### 3. 保存配置

```javascript
import { saveConfig } from "./js/config.js";

// 保存当前配置到服务器
const success = await saveConfig();
if (success) {
  console.log("配置保存成功");
} else {
  console.error("配置保存失败");
}
```

## 配置数据结构

### Theme（主题）

```typescript
interface Theme {
  id: string; // 主题ID（必需）
  color?: string; // 背景颜色（纯色主题）
  border?: string; // 边框颜色（纯色主题）
  background?: string; // 背景样式（渐变主题）
}
```

### Font（字体）

```typescript
interface Font {
  id: string; // 字体ID（必需）
  value: string; // CSS字体值（必需）
  name: string; // 字体显示名称（必需）
  subtitle?: string; // 字体副标题（可选）
}
```

### FontColor（字体颜色）

```typescript
interface FontColor {
  id: string; // 颜色ID（必需）
  value: string; // 颜色值（十六进制）（必需）
  name: string; // 颜色显示名称（必需）
}
```

## 错误处理

- 如果服务器请求失败，应用会自动使用默认配置
- 配置验证失败时，会回退到默认配置
- 所有错误都会在控制台输出警告信息，不会中断应用运行

## 示例服务器实现

### Node.js + Express

```javascript
const express = require('express');
const app = express();

app.use(express.json());

// 存储配置（实际应用中应使用数据库）
let config = {
  themes: [...],
  fonts: [...],
  fontColors: [...]
};

// 获取配置
app.get('/api/config', (req, res) => {
  res.json(config);
});

// 保存配置
app.post('/api/config', (req, res) => {
  config = req.body;
  res.json({ success: true });
});

app.listen(3000);
```

### Python + Flask

```python
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# 存储配置（实际应用中应使用数据库）
config = {
    "themes": [...],
    "fonts": [...],
    "fontColors": [...]
}

@app.route('/api/config', methods=['GET'])
def get_config():
    return jsonify(config)

@app.route('/api/config', methods=['POST'])
def save_config():
    global config
    config = request.json
    return jsonify({"success": True})

if __name__ == '__main__':
    app.run(port=3000)
```

## 注意事项

1. **CORS 配置**：确保服务器允许跨域请求
2. **数据验证**：服务器应验证配置数据的格式和有效性
3. **安全性**：生产环境中应添加身份验证和授权机制
4. **数据持久化**：建议使用数据库存储配置，而不是内存
