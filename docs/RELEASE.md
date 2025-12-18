# 发布流程

本文档说明如何使用 GitHub Actions 自动发布流程。

## 自动发布流程

项目配置了基于 Git tag 的自动发布流程。当推送版本标签到 GitHub 时，会自动：

1. ✅ 运行代码检查（Lint）
2. ✅ 从 CHANGELOG.md 提取版本更新内容
3. ✅ 创建 GitHub Release
4. ✅ 生成发布说明

## 发布步骤

### 1. 更新版本号

确保以下文件中的版本号已更新：

- `package.json` - 更新 `version` 字段
- `docs/CHANGELOG.md` - 添加新版本的更新日志

### 2. 提交更改

```bash
git add .
git commit -m "chore: bump version to 0.2.0"
git push origin main
```

### 3. 创建并推送标签

```bash
# 创建带注释的标签
git tag -a v0.2.0 -m "版本 0.2.0 - 描述信息"

# 或者使用 CHANGELOG 中的内容
git tag -a v0.2.0 -F docs/CHANGELOG.md

# 推送标签到远程
git push origin v0.2.0
```

### 4. 自动触发发布

推送标签后，GitHub Actions 会自动：

1. 检测到新标签（匹配 `v*.*.*` 模式）
2. 运行 CI 检查
3. 从 CHANGELOG.md 提取版本更新内容
4. 创建 GitHub Release
5. 生成发布说明

## 标签命名规范

遵循 [语义化版本](https://semver.org/lang/zh-CN/)：

- **主版本号**：不兼容的 API 修改
- **次版本号**：向下兼容的功能性新增
- **修订号**：向下兼容的问题修正

标签格式：`v主版本号.次版本号.修订号`

示例：

- `v0.2.0` - 新功能版本
- `v0.2.1` - 修复版本
- `v1.0.0` - 正式版本

## 预发布版本

支持预发布版本标签：

- `v0.2.0-alpha.1` - Alpha 版本
- `v0.2.0-beta.1` - Beta 版本
- `v0.2.0-rc.1` - 候选版本

预发布版本会自动标记为 GitHub Release 的 "Pre-release"。

## 发布说明

发布说明会自动从以下来源生成：

1. **优先使用**: `docs/CHANGELOG.md` 中对应版本的内容
2. **备用方案**: Git tag 的注释信息

### CHANGELOG 格式

确保 `docs/CHANGELOG.md` 包含以下格式：

```markdown
## [0.2.0] - 2025-12-09

### 🎉 重大更新

- 架构重构
- ...

### ✨ 新增功能

- ...
```

## 手动触发（可选）

如果需要手动触发发布流程，可以：

1. 进入 GitHub Actions 页面
2. 选择 "Release" workflow
3. 点击 "Run workflow"
4. 输入标签名称（如 `v0.2.0`）

## 查看发布状态

发布后可以：

1. 在 GitHub 仓库的 "Releases" 页面查看
2. 在 GitHub Actions 页面查看工作流执行状态
3. 检查发布说明是否包含完整的更新内容

## 故障排查

### 发布失败

1. **检查标签格式**: 确保标签格式为 `v*.*.*`
2. **检查权限**: 确保 GitHub token 有写入权限
3. **查看日志**: 在 GitHub Actions 中查看详细错误信息

### 发布说明为空

1. **检查 CHANGELOG**: 确保 `docs/CHANGELOG.md` 包含对应版本
2. **检查标签注释**: 确保标签有注释信息
3. **查看工作流日志**: 检查 changelog 提取步骤的输出

## 示例

### 发布 v0.2.0

```bash
# 1. 更新版本号
# 编辑 package.json: "version": "0.2.0"
# 编辑 docs/CHANGELOG.md: 添加 [0.2.0] 部分

# 2. 提交更改
git add package.json docs/CHANGELOG.md
git commit -m "chore: bump version to 0.2.0"
git push origin main

# 3. 创建标签
git tag -a v0.2.0 -m "版本 0.2.0 - 架构重构与工程化优化"

# 4. 推送标签（触发自动发布）
git push origin v0.2.0
```

推送标签后，GitHub Actions 会自动创建 Release。

## 相关文件

- `.github/workflows/release.yml` - 发布工作流配置
- `.github/workflows/ci.yml` - CI 工作流配置
- `docs/CHANGELOG.md` - 更新日志
