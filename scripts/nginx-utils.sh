#!/bin/bash

# ============================================
# Nginx 工具函数库
# ============================================
# 提供 Nginx 和 SSL 证书管理的共用函数
# 使用方法: source "$(dirname "$0")/nginx-utils.sh"
# ============================================

# 查找 Nginx 命令路径
# 返回值: Nginx 命令路径（如果找到）或空字符串
find_nginx_cmd() {
  if command -v nginx &> /dev/null; then
    echo "nginx"
  elif [ -f "/usr/sbin/nginx" ]; then
    echo "/usr/sbin/nginx"
  elif [ -f "/usr/local/sbin/nginx" ]; then
    echo "/usr/local/sbin/nginx"
  elif [ -f "/sbin/nginx" ]; then
    echo "/sbin/nginx"
  else
    echo ""
  fi
}

# 检查 Nginx 服务状态
# 返回值: 0 表示运行中，非 0 表示未运行
check_nginx_status() {
  systemctl is-active --quiet nginx 2>/dev/null || service nginx status &>/dev/null
}

# 准备服务器端 Nginx 环境（备份、创建目录等）
# 参数:
#   $1: Nginx 配置文件路径（服务器端，如 /etc/nginx/conf.d/site-dashboard.conf）
#   $2: SSH 执行函数名（用于远程执行命令，如 ssh_exec）
#   $3: SSH 目标（如 root@8.138.183.116）
prepare_nginx_server() {
  local nginx_conf_path="$1"
  local ssh_exec_func="$2"
  local ssh_target="$3"
  
  local conf_name=$(basename "$nginx_conf_path")
  
  $ssh_exec_func << ENDSSH
set -e
NGINX_CMD=\$(command -v nginx || echo "/usr/sbin/nginx" || echo "/usr/local/sbin/nginx" || echo "/sbin/nginx" || echo "")
[ -n "\$NGINX_CMD" ] && echo "✓ Nginx: \$(\$NGINX_CMD -v 2>&1)" || echo "⚠ Nginx 未找到，将继续上传配置"

mkdir -p /etc/nginx/conf.d/backup
[ -f "$nginx_conf_path" ] && {
  BACKUP_FILE="/etc/nginx/conf.d/backup/${conf_name}.backup.\$(date +%Y%m%d_%H%M%S)"
  cp "$nginx_conf_path" "\$BACKUP_FILE"
  echo "✓ 已备份: \$BACKUP_FILE"
}
mkdir -p /etc/nginx/conf.d
ENDSSH
}

# 测试并应用 Nginx 配置
# 参数:
#   $1: Nginx 配置文件路径（服务器端）
#   $2: SSH 执行函数名
#   $3: SSH 目标
test_and_reload_nginx() {
  local nginx_conf_path="$1"
  local ssh_exec_func="$2"
  local ssh_target="$3"
  
  local conf_name=$(basename "$nginx_conf_path")
  
  $ssh_exec_func << ENDSSH
set -e
NGINX_CMD=\$(command -v nginx || echo "/usr/sbin/nginx" || echo "/usr/local/sbin/nginx" || echo "/sbin/nginx" || echo "")

if [ -n "\$NGINX_CMD" ]; then
  TEST_OUTPUT=\$(\$NGINX_CMD -t 2>&1)
  if echo "\$TEST_OUTPUT" | grep -q "test is successful"; then
    echo "✓ Nginx 配置语法正确"
  else
    echo "⚠ 配置测试失败，尝试兼容模式（移除 http2）..."
    TEMP_CONF=\$(mktemp)
    sed 's/listen 443 ssl http2;/listen 443 ssl;/g' "$nginx_conf_path" > "\$TEMP_CONF"
    if \$NGINX_CMD -t -c "\$TEMP_CONF" 2>&1 | grep -q "test is successful"; then
      echo "⚠ 已移除 http2 支持"
      cp "\$TEMP_CONF" "$nginx_conf_path"
      echo "✓ 已更新为兼容配置"
      rm -f "\$TEMP_CONF"
    else
      echo "✗ Nginx 配置语法错误"
      echo "\$TEST_OUTPUT"
      rm -f "\$TEMP_CONF"
      exit 1
    fi
  fi
fi

chmod 644 "$nginx_conf_path"
chown root:root "$nginx_conf_path"

# 重新加载 Nginx
if systemctl reload nginx 2>/dev/null || service nginx reload 2>/dev/null; then
  echo "✓ Nginx 配置已重新加载"
elif systemctl restart nginx 2>/dev/null || service nginx restart 2>/dev/null; then
  echo "⚠ 使用 restart 方式重新加载"
  echo "✓ Nginx 已重启"
else
  echo "⚠ 无法重新加载 Nginx（可能未运行）"
fi

# 检查状态
if systemctl is-active --quiet nginx 2>/dev/null || service nginx status &>/dev/null; then
  echo "✓ Nginx 正在运行"
else
  echo "⚠ Nginx 未运行，可手动启动: systemctl start nginx"
fi
ENDSSH
}

# 启动 Nginx 服务
# 参数:
#   $1: SSH 执行函数名
#   $2: SSH 目标
start_nginx_service() {
  local ssh_exec_func="$1"
  local ssh_target="$2"
  
  $ssh_exec_func << ENDSSH
set -e
NGINX_CMD=\$(command -v nginx || echo "/usr/sbin/nginx" || echo "/usr/local/sbin/nginx" || echo "/sbin/nginx" || echo "")

[ -z "\$NGINX_CMD" ] && {
  echo "✗ Nginx 未安装"
  [ -f /etc/redhat-release ] && echo "安装: yum install -y nginx"
  [ -f /etc/debian_version ] && echo "安装: apt-get install -y nginx"
  exit 1
}

echo "✓ Nginx: \$(\$NGINX_CMD -v 2>&1)"

# 检查配置语法
\$NGINX_CMD -t 2>&1 || { echo "✗ Nginx 配置语法错误"; exit 1; }
echo "✓ Nginx 配置语法正确"

# 启动 Nginx
if systemctl is-active --quiet nginx 2>/dev/null || service nginx status &>/dev/null; then
  echo "✓ Nginx 已在运行"
else
  echo "⚠ 正在启动 Nginx..."
  systemctl start nginx 2>/dev/null || service nginx start 2>/dev/null || { echo "✗ Nginx 启动失败"; exit 1; }
  sleep 2
  systemctl is-active --quiet nginx 2>/dev/null || service nginx status &>/dev/null || { echo "✗ Nginx 启动失败"; exit 1; }
  echo "✓ Nginx 已成功启动"
fi

# 设置开机自启
systemctl enable nginx 2>/dev/null || chkconfig nginx on 2>/dev/null || true
echo "✓ Nginx 已设置为开机自启"
ENDSSH
}

# 上传 SSL 证书到服务器
# 参数:
#   $1: 证书名称（如 site-dashboard.zhifu.tech）
#   $2: 本地证书目录（包含 .key, _bundle.crt 或 _bundle.pem 文件）
#   $3: 服务器端 SSL 证书目录（如 /etc/nginx/ssl）
#   $4: SSH 选项（如 "-i ~/.ssh/id_rsa"）
#   $5: SSH 端口（如 22）
#   $6: SSH 目标（如 root@8.138.183.116）
#   $7: SSH 执行函数名（用于远程执行命令）
upload_ssl_certificates() {
  local cert_name="$1"
  local local_cert_dir="$2"
  local remote_ssl_dir="$3"
  local ssh_options="$4"
  local ssh_port="$5"
  local ssh_target="$6"
  local ssh_exec_func="$7"
  
  local cert_bundle_crt="${local_cert_dir}/${cert_name}_bundle.crt"
  local cert_bundle_pem="${local_cert_dir}/${cert_name}_bundle.pem"
  local cert_key="${local_cert_dir}/${cert_name}.key"
  
  # 检查证书文件是否存在
  if [ ! -f "$cert_key" ]; then
    echo "⚠ SSL 私钥文件不存在: $cert_key"
    return 1
  fi
  
  local has_bundle=false
  if [ -f "$cert_bundle_crt" ]; then
    has_bundle=true
  elif [ -f "$cert_bundle_pem" ]; then
    has_bundle=true
  fi
  
  if [ "$has_bundle" = false ]; then
    echo "⚠ SSL 证书文件不存在: $cert_bundle_crt 或 $cert_bundle_pem"
    return 1
  fi
  
  # 创建服务器端目录
  $ssh_exec_func "mkdir -p ${remote_ssl_dir}"
  
  # 上传证书文件
  [ -f "$cert_bundle_crt" ] && scp $ssh_options -P ${ssh_port} "$cert_bundle_crt" ${ssh_target}:${remote_ssl_dir}/${cert_name}_bundle.crt
  [ -f "$cert_bundle_pem" ] && scp $ssh_options -P ${ssh_port} "$cert_bundle_pem" ${ssh_target}:${remote_ssl_dir}/${cert_name}_bundle.pem
  scp $ssh_options -P ${ssh_port} "$cert_key" ${ssh_target}:${remote_ssl_dir}/${cert_name}.key
  
  # 设置权限
  $ssh_exec_func "chmod 644 ${remote_ssl_dir}/${cert_name}_bundle.* 2>/dev/null || true; chmod 600 ${remote_ssl_dir}/${cert_name}.key; chown root:root ${remote_ssl_dir}/${cert_name}.*"
  
  echo "✓ SSL 证书已上传"
}

# 更新 Nginx 配置（完整流程）
# 参数:
#   $1: 本地 Nginx 配置文件路径
#   $2: 服务器端 Nginx 配置文件路径（如 /etc/nginx/conf.d/site-dashboard.conf）
#   $3: SSH 选项（如 "-i ~/.ssh/id_rsa"）
#   $4: SSH 端口（如 22）
#   $5: SSH 目标（如 root@8.138.183.116）
#   $6: SSH 执行函数名（用于远程执行命令）
#   $7: SSL 证书名称（可选，如 site-dashboard.zhifu.tech）
#   $8: 本地 SSL 证书目录（可选）
#   $9: 服务器端 SSL 证书目录（可选，默认 /etc/nginx/ssl）
update_nginx_config() {
  local local_conf="$1"
  local remote_conf="$2"
  local ssh_options="$3"
  local ssh_port="$4"
  local ssh_target="$5"
  local ssh_exec_func="$6"
  local ssl_cert_name="${7:-}"
  local local_ssl_dir="${8:-}"
  local remote_ssl_dir="${9:-/etc/nginx/ssl}"
  
  # 检查本地配置文件是否存在
  [ -f "$local_conf" ] || {
    echo "✗ 配置文件不存在: $local_conf"
    return 1
  }
  
  # 准备服务器环境
  prepare_nginx_server "$remote_conf" "$ssh_exec_func" "$ssh_target"
  
  # 上传配置文件
  echo "上传配置文件..."
  scp $ssh_options -P ${ssh_port} "$local_conf" ${ssh_target}:${remote_conf}
  
  # 上传 SSL 证书（如果提供）
  if [ -n "$ssl_cert_name" ] && [ -n "$local_ssl_dir" ] && [ -d "$local_ssl_dir" ]; then
    echo "上传 SSL 证书..."
    upload_ssl_certificates "$ssl_cert_name" "$local_ssl_dir" "$remote_ssl_dir" "$ssh_options" "$ssh_port" "$ssh_target" "$ssh_exec_func"
  fi
  
  # 测试并重新加载配置
  test_and_reload_nginx "$remote_conf" "$ssh_exec_func" "$ssh_target"
  
  echo "✓ Nginx 配置更新完成！"
  echo "配置文件: $remote_conf"
  [ -n "$ssl_cert_name" ] && echo "SSL 证书: $remote_ssl_dir/${ssl_cert_name}.*"
}

