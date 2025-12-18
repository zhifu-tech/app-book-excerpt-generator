#!/bin/bash

# ============================================
# SSH 工具函数库
# ============================================
# 提供 SSH 连接和命令执行的共用函数
# 使用方法: source "$(dirname "$0")/scripts/lib/scripts/ssh-utils.sh"
# ============================================

# SSH 密钥配置（统一配置）
readonly SSH_KEY_NAME="id_rsa_zhifu_tech"
readonly SSH_KEY_PATH="$HOME/.ssh/$SSH_KEY_NAME"

# 初始化 SSH 连接参数
# 依赖变量（必须由主脚本定义并导出）:
#   - SERVER_HOST: 服务器地址（如 8.138.183.116）
#   - SERVER_USER: 服务器用户（如 root）
#   - SERVER_PORT: 服务器端口（如 22）
# 设置变量:
#   - SSH_OPTIONS: SSH 选项（如 -i $SSH_KEY_PATH）
#   - SSH_TARGET: SSH 目标（如 root@8.138.183.116）
init_ssh_connection() {
  # 验证必需的变量是否存在（如果 common-utils.sh 已加载）
  if command -v check_required_vars >/dev/null 2>&1; then
    check_required_vars SERVER_HOST SERVER_USER SERVER_PORT || {
      echo "错误: SSH 连接初始化失败，缺少必需的服务器配置变量" >&2
      return 1
    }
  fi
  if [ -f "$SSH_KEY_PATH" ]; then
    SSH_OPTIONS="-i $SSH_KEY_PATH"
    SSH_TARGET="$SERVER_USER@$SERVER_HOST"
  else
    SSH_OPTIONS=""
    SSH_TARGET="$SERVER_USER@$SERVER_HOST"
  fi
}

# 执行 SSH 命令（统一入口）
# 用法: 
#   ssh_exec "command"                    # 执行单个命令
#   ssh_exec << 'ENDSSH' ... ENDSSH       # 执行多行命令（here-document）
# 依赖变量:
#   - SSH_OPTIONS: SSH 选项
#   - SSH_TARGET: SSH 目标
#   - SERVER_PORT: 服务器端口
ssh_exec() {
  if [ $# -eq 0 ]; then
    # 从标准输入读取（用于 here-document）
    ssh $SSH_OPTIONS -p ${SERVER_PORT} ${SSH_TARGET}
  else
    # 直接执行命令
    ssh $SSH_OPTIONS -p ${SERVER_PORT} ${SSH_TARGET} "$@"
  fi
}

# 更新 SSH 公钥到服务器
# 将本地的 SSH 公钥添加到服务器的 authorized_keys 文件中
# 依赖变量:
#   - SSH_KEY_PATH: SSH 私钥路径（用于确定公钥路径）
#   - SERVER_USER: 服务器用户（用于确定服务器上的 home 目录）
#   - SERVER_HOST: 服务器地址
#   - SERVER_PORT: 服务器端口
#   - SSH_OPTIONS: SSH 选项（可能为空，用于首次连接）
#   - SSH_TARGET: SSH 目标
# 返回:
#   0: 成功
#   1: 失败
update_ssh_key_to_server() {
  local pub_key_path="${SSH_KEY_PATH}.pub"
  
  # 检查本地公钥文件是否存在
  if [ ! -f "$pub_key_path" ]; then
    echo "错误: 公钥文件不存在: $pub_key_path" >&2
    echo "提示: 请先生成 SSH 密钥对" >&2
    return 1
  fi
  
  # 读取公钥内容
  local pub_key_content
  pub_key_content=$(cat "$pub_key_path")
  
  if [ -z "$pub_key_content" ]; then
    echo "错误: 公钥文件为空: $pub_key_path" >&2
    return 1
  fi
  
  # 提取公钥的指纹（用于标识）
  local key_fingerprint
  key_fingerprint=$(echo "$pub_key_content" | ssh-keygen -lf - 2>/dev/null | awk '{print $2}' || echo "")
  
  echo "正在更新 SSH 公钥到服务器 ${SERVER_HOST}..."
  echo "公钥指纹: ${key_fingerprint:-未知}"
  
  # 在服务器上执行更新操作
  # 使用 base64 编码传递公钥内容，避免特殊字符问题
  local pub_key_base64
  pub_key_base64=$(echo "$pub_key_content" | base64)
  
  ssh $SSH_OPTIONS -p "${SERVER_PORT}" "$SSH_TARGET" << ENDSSH
set -euo pipefail

# 解码公钥内容
PUB_KEY_CONTENT=\$(echo "$pub_key_base64" | base64 -d)

if [ -z "\$PUB_KEY_CONTENT" ]; then
  echo "错误: 未接收到公钥内容" >&2
  exit 1
fi

# 确保 .ssh 目录存在
SSH_DIR="\$HOME/.ssh"
mkdir -p "\$SSH_DIR"
chmod 700 "\$SSH_DIR"

# 确保 authorized_keys 文件存在
AUTH_KEYS_FILE="\$SSH_DIR/authorized_keys"
touch "\$AUTH_KEYS_FILE"
chmod 600 "\$AUTH_KEYS_FILE"

# 检查公钥是否已存在（通过密钥内容的前100个字符匹配）
KEY_PREFIX=\$(echo "\$PUB_KEY_CONTENT" | cut -c1-100)
KEY_EXISTS=false

if [ -f "\$AUTH_KEYS_FILE" ] && grep -qF "\$KEY_PREFIX" "\$AUTH_KEYS_FILE" 2>/dev/null; then
  KEY_EXISTS=true
fi

if [ "\$KEY_EXISTS" = "true" ]; then
  echo "公钥已存在于 authorized_keys 中，跳过添加"
  echo "如需更新，请手动编辑: \$AUTH_KEYS_FILE"
else
  # 添加公钥到 authorized_keys
  echo "\$PUB_KEY_CONTENT" >> "\$AUTH_KEYS_FILE"
  echo "✓ 公钥已添加到 authorized_keys"
fi

# 设置正确的权限
chmod 600 "\$AUTH_KEYS_FILE"
chown "\$(whoami):\$(whoami)" "\$AUTH_KEYS_FILE" 2>/dev/null || true

# 显示当前 authorized_keys 中的密钥数量
KEY_COUNT=\$(wc -l < "\$AUTH_KEYS_FILE" 2>/dev/null || echo "0")
echo "当前 authorized_keys 包含 \$KEY_COUNT 个密钥"

echo "✓ SSH 公钥更新完成"
ENDSSH

  if [ $? -eq 0 ]; then
    echo "✓ SSH 公钥已成功更新到服务器"
    echo ""
    echo "测试连接:"
    echo "  ssh $SSH_OPTIONS -p ${SERVER_PORT} ${SSH_TARGET} 'echo \"SSH 连接成功\"'"
    return 0
  else
    echo "✗ SSH 公钥更新失败" >&2
    return 1
  fi
}

