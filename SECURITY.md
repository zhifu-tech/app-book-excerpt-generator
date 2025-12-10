# 安全警告

## ⚠️ SSL 证书私钥泄露

**重要**: SSL 证书的私钥文件 (`book-excerpt.zhifu.tech.key`) 曾经被提交到 git 仓库中。

### 已修复措施

1. ✅ **已从 git 中移除敏感文件**
   - 私钥文件 (`.key`)
   - 证书签名请求文件 (`.csr`)
   - 证书文件 (`.crt`, `.pem`)

2. ✅ **已更新 `.gitignore`**
   - 添加了 SSL 证书文件的忽略规则
   - 防止未来意外提交

### ⚠️ 必须执行的操作

**由于私钥已经泄露，您必须：**

1. **立即重新生成 SSL 证书和私钥**
   - 联系证书颁发机构（CA）撤销当前证书
   - 生成新的私钥和证书签名请求（CSR）
   - 申请新的 SSL 证书

2. **更新服务器上的证书**
   - 将新证书上传到服务器
   - 更新 Nginx 配置
   - 重启 Nginx 服务

3. **检查 git 历史**
   - 如果这些文件已经被推送到远程仓库，需要从 git 历史中完全删除
   - 考虑使用 `git filter-branch` 或 `git filter-repo` 工具清理历史

### 清理 git 历史（如果已推送到远程）

如果敏感文件已经被推送到远程仓库，需要从 git 历史中完全删除：

```bash
# 使用 git filter-repo（推荐）
git filter-repo --path scripts/book-excerpt.zhifu.tech_nginx/ --invert-paths

# 或使用 git filter-branch
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch scripts/book-excerpt.zhifu.tech_nginx/*.key scripts/book-excerpt.zhifu.tech_nginx/*.csr scripts/book-excerpt.zhifu.tech_nginx/*.crt scripts/book-excerpt.zhifu.tech_nginx/*.pem" \
  --prune-empty --tag-name-filter cat -- --all

# 强制推送到远程（⚠️ 警告：这会重写历史）
git push origin --force --all
```

### 当前状态

- ✅ 敏感文件已从 git 跟踪中移除
- ✅ `.gitignore` 已更新，包含 SSL 证书文件规则
- ✅ 本地文件保留（用于部署）
- ⚠️ **需要重新生成证书和私钥**

### 防止未来泄露

`.gitignore` 现在包含以下规则：

```
# SSL Certificates and Private Keys (NEVER commit these!)
*.key
*.csr
*.pem
*.crt
*.p12
*.pfx
*_nginx/
*_ssl/
*_certs/
certificates/
ssl/
certs/
```

**请确保在提交代码前检查 `git status`，确认没有敏感文件被意外添加。**
