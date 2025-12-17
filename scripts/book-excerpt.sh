#!/bin/bash

# ============================================
# Book Excerpt Generator - 统一管理脚本
# ============================================
# 整合所有部署和管理功能
# 使用方法: ./book-excerpt.sh [command] [options]
# ============================================

# 严格模式：遇到错误立即退出，使用未定义变量报错，管道中任一命令失败则整个管道失败
set -euo pipefail

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# ============================================
# 配置变量
# ============================================

# 服务器配置（导出供共用脚本使用）
export SERVER_HOST="${SERVER_HOST:-8.138.183.116}"
export SERVER_USER="${SERVER_USER:-root}"
export SERVER_PORT="${SERVER_PORT:-22}"

# 应用目录配置
APP_DIR="/var/www/html/book-excerpt-generator"
NGINX_CONF_PATH="/etc/nginx/conf.d/book-excerpt-generator.conf"
SSL_CERT_DIR="/etc/nginx/ssl"

# Docker 配置
readonly DOCKER_IMAGE_NAME="book-excerpt-generator"
readonly DOCKER_CONTAINER_NAME="book-excerpt-generator"
readonly DOCKER_COMPOSE_FILE="$PROJECT_ROOT/docker-compose.yml"

# ============================================
# 工具函数
# ============================================

# 加载共用脚本库（必须在 trap 之前加载，以便使用 safe_exit）
APP_COMMON_DIR="$(cd "$PROJECT_ROOT/../app-common" && pwd)"
[ -f "$APP_COMMON_DIR/scripts/common-utils.sh" ] && source "$APP_COMMON_DIR/scripts/common-utils.sh"
[ -f "$APP_COMMON_DIR/scripts/ssh-utils.sh" ] && source "$APP_COMMON_DIR/scripts/ssh-utils.sh"
[ -f "$APP_COMMON_DIR/scripts/nginx-utils.sh" ] && source "$APP_COMMON_DIR/scripts/nginx-utils.sh"
[ -f "$APP_COMMON_DIR/scripts/nginx-update.sh" ] && source "$APP_COMMON_DIR/scripts/nginx-update.sh"

# 设置清理 trap（脚本退出时清理临时文件，必须在加载 common-utils.sh 之后）
trap 'safe_exit $?' EXIT INT TERM

# ============================================
# 欢迎界面
# ============================================
show_welcome() {
  echo ""
  echo -e "${CYAN}"
  # 从 welcome.txt 读取欢迎画面
  local welcome_file="$APP_COMMON_DIR/welcome.txt"
  if [ -f "$welcome_file" ]; then
    cat "$welcome_file"
  else
    # 如果文件不存在，使用默认的 ASCII 艺术字
    cat << "EOF"
                                                                                                                                   
               ,----..       ,----..          ,--.                                                                                 
    ,---,.    /   /   \     /   /   \     ,--/  /|            ,---,.                                                       ___     
  ,'  .'  \  /   .     :   /   .     : ,---,': / '          ,'  .' |                                         ,-.----.    ,--.'|_   
,---.' .' | .   /   ;.  \ .   /   ;.  \:   : '/ /         ,---.'   |                                  __  ,-.\    /  \   |  | :,'  
|   |  |: |.   ;   /  ` ;.   ;   /  ` ;|   '   ,          |   |   .' ,--,  ,--,                     ,' ,'/ /||   :    |  :  : ' :  
:   :  :  /;   |  ; \ ; |;   |  ; \ ; |'   |  /           :   :  |-, |'. \/ .`|    ,---.     ,---.  '  | |' ||   | .\ :.;__,'  /   
:   |    ; |   :  | ; | '|   :  | ; | '|   ;  ;           :   |  ;/| '  \/  / ;   /     \   /     \ |  |   ,'.   : |: ||  |   |    
|   :     \.   |  ' ' ' :.   |  ' ' ' ::   '   \          |   :   .'  \  \.' /   /    / '  /    /  |'  :  /  |   |  \ ::__,'| :    
|   |   . |'   ;  \; /  |'   ;  \; /  ||   |    '         |   |  |-,   \  ;  ;  .    ' /  .    ' / ||  | '   |   : .  |  '  : |__  
'   :  '; | \   \  ',  /  \   \  ',  / '   : |.  \        '   :  ;/|  / \  \  \ '   ; :__ '   ;   /|;  : |   :     |`-'  |  | '.'| 
|   |  | ;   ;   :    /    ;   :    /  |   | '_\.'        |   |    \./__;   ;  \'   | '.'|'   |  / ||  , ;   :   : :     ;  :    ; 
|   :   /     \   \ .'      \   \ .'   '   : |            |   :   .'|   :/\  \ ;|   :    :|   :    | ---'    |   | :     |  ,   /  
|   | ,'       `---`         `---`     ;   |,'            |   | ,'  `---'  `--`  \   \  /  \   \  /          `---'.|      ---`-'   
`----'                                 '---'              `----'                  `----'    `----'             `---`               
                                                                                                                                                                                                                                                     
EOF
  fi
  echo -e "${NC}"
  echo -e "${CYAN}              Generator - 书摘卡片生成器@Zhifu's Tech${NC}"
  echo ""
  local cmd="${1:-help}"
  echo -e "${YELLOW}版本: 1.0.0${NC}"
  echo -e "${YELLOW}服务器: ${SERVER_HOST:-未配置}${NC}"
  echo -e "${YELLOW}命令: ${cmd}${NC}"
  echo ""
}

# ============================================
# 帮助信息
# ============================================
show_help() {
  echo -e "${CYAN}Book Excerpt Generator - 使用帮助${NC}"
  echo ""
  echo -e "${YELLOW}用法:${NC}"
  echo "  ./book-excerpt.sh [command] [options]"
  echo ""
  echo -e "${YELLOW}可用命令:${NC}"
  echo ""
  echo -e "  ${GREEN}SSH 配置:${NC}"
  echo -e "  ${GREEN}update-ssh-key${NC}     更新 SSH 公钥到服务器"
  echo ""
  echo -e "  ${GREEN}Nginx 配置:${NC}"
  echo -e "  ${GREEN}update-nginx${NC}       更新 Nginx 配置文件"
  echo -e "  ${GREEN}start-nginx${NC}        启动 Nginx 服务"
  echo -e "  ${GREEN}restart-nginx${NC}      重启 Nginx 服务"
  echo ""
  echo -e "  ${GREEN}部署:${NC}"
  echo -e "  ${GREEN}docker-deploy${NC}       使用 Docker 部署到服务器（推荐）"
  echo ""
  echo -e "  ${GREEN}Docker 命令:${NC}"
  echo -e "  ${GREEN}docker-build${NC}        构建 Docker 镜像"
  echo -e "  ${GREEN}docker-up${NC}           启动 Docker 容器（本地调试）"
  echo -e "  ${GREEN}docker-down${NC}         停止 Docker 容器"
  echo -e "  ${GREEN}docker-logs${NC}         查看 Docker 容器日志"
  echo -e "  ${GREEN}docker-shell${NC}        进入 Docker 容器 shell"
  echo -e "  ${GREEN}docker-restart${NC}      重启 Docker 容器"
  echo ""
  echo -e "  ${GREEN}工具:${NC}"
  echo -e "  ${GREEN}fix-port${NC}           修复端口占用问题"
  echo -e "  ${GREEN}check${NC}              检查部署状态和配置"
  echo -e "  ${GREEN}clear-cache${NC}        清除服务器缓存（如果使用）"
  echo ""
  echo -e "  ${GREEN}help${NC}               显示此帮助信息"
  echo ""
  echo -e "${YELLOW}示例:${NC}"
  echo "  ./book-excerpt.sh update-ssh-key"
  echo "  ./book-excerpt.sh docker-deploy"
  echo "  ./book-excerpt.sh update-nginx"
  echo "  ./book-excerpt.sh restart-nginx"
  echo "  ./book-excerpt.sh docker-up"
  echo ""
}

# ============================================
# 更新 SSH 公钥到服务器
# ============================================
cmd_update_ssh_key() {
  print_info "更新 SSH 公钥到服务器 ${SERVER_HOST}..."
  echo ""
  
  if ! update_ssh_key_to_server; then
    print_error "SSH 公钥更新失败"
    return 1
  fi
  
  echo ""
  print_success "SSH 登录认证信息已更新！"
  print_info "现在可以使用 SSH 密钥无密码登录服务器"
}

# ============================================
# 更新 Nginx 配置
# ============================================
cmd_update_nginx() {
  # 确定配置文件路径
  local nginx_local_conf="${1:-$SCRIPT_DIR/nginx.conf}"
  check_file_exists "$nginx_local_conf" "配置文件不存在" || return 1

  local ssl_cert_local_dir="$APP_COMMON_DIR/ssl/book-excerpt.zhifu.tech_nginx"
  local ssl_cert_name="book-excerpt.zhifu.tech"
  local ssl_cert_key="$ssl_cert_local_dir/${ssl_cert_name}.key"
  local ssl_cert_bundle_crt="$ssl_cert_local_dir/${ssl_cert_name}_bundle.crt"
  local ssl_cert_bundle_pem="$ssl_cert_local_dir/${ssl_cert_name}_bundle.pem"

  print_info "更新 Nginx 配置到服务器 ${SERVER_HOST}..."

  # 检查 SSL 证书是否存在
  local ssl_cert_files_exist=false
  if [ -f "$ssl_cert_key" ] && ([ -f "$ssl_cert_bundle_crt" ] || [ -f "$ssl_cert_bundle_pem" ]); then
    ssl_cert_files_exist=true
  fi

  # 使用共用脚本库更新配置
  if [ "$ssl_cert_files_exist" = "true" ]; then
    update_nginx_config \
      "$nginx_local_conf" \
      "$NGINX_CONF_PATH" \
      "$SSH_OPTIONS" \
      "$SERVER_PORT" \
      "$SSH_TARGET" \
      "ssh_exec" \
      "$ssl_cert_name" \
      "$ssl_cert_local_dir" \
      "$SSL_CERT_DIR"
  else
    # 不使用 SSL 证书的简化版本
    prepare_nginx_server "$NGINX_CONF_PATH" "ssh_exec" "$SSH_TARGET"
    print_info "上传配置文件..."
    scp $SSH_OPTIONS -P "${SERVER_PORT}" "$nginx_local_conf" "${SSH_TARGET}:${NGINX_CONF_PATH}"
    test_and_reload_nginx "$NGINX_CONF_PATH" "ssh_exec" "$SSH_TARGET"
  fi

  echo ""
  print_success "Nginx 配置更新完成！"
  print_info "配置文件: ${NGINX_CONF_PATH}"
  [ "$ssl_cert_files_exist" = "true" ] && print_info "SSL 证书: ${SSL_CERT_DIR}/${ssl_cert_name}.*"
}

# ============================================
# 启动 Nginx
# ============================================
cmd_start_nginx() {
  print_info "检查并启动 Nginx..."
  start_nginx_service "ssh_exec" "$SSH_TARGET"
  echo ""
  print_success "Nginx 启动完成！"
}

# ============================================
# 重启 Nginx
# ============================================
cmd_restart_nginx() {
  print_info "重启 Nginx 服务..."
  
  ssh_exec << 'ENDSSH'
set -e

NGINX_CMD=$(command -v nginx || echo "/usr/sbin/nginx" || echo "/usr/local/sbin/nginx" || echo "/sbin/nginx" || echo "")

[ -z "$NGINX_CMD" ] && {
  echo "✗ Nginx 未安装"
  [ -f /etc/redhat-release ] && echo "安装: yum install -y nginx"
  [ -f /etc/debian_version ] && echo "安装: apt-get install -y nginx"
  exit 1
}

echo "✓ Nginx: $($NGINX_CMD -v 2>&1)"

# 检查配置语法
echo "检查 Nginx 配置语法..."
$NGINX_CMD -t 2>&1 || { echo "✗ Nginx 配置语法错误"; exit 1; }
echo "✓ Nginx 配置语法正确"

# 重启 Nginx
echo ""
echo "正在重启 Nginx..."
if systemctl restart nginx 2>/dev/null || service nginx restart 2>/dev/null; then
  echo "✓ Nginx 重启命令已执行"
  sleep 2
  
  # 检查状态
  if systemctl is-active --quiet nginx 2>/dev/null || service nginx status &>/dev/null; then
    echo "✓ Nginx 已成功重启并正在运行"
  else
    echo "⚠ Nginx 重启后未运行，尝试启动..."
    systemctl start nginx 2>/dev/null || service nginx start 2>/dev/null || { echo "✗ Nginx 启动失败"; exit 1; }
    echo "✓ Nginx 已启动"
  fi
else
  echo "✗ Nginx 重启失败"
  exit 1
fi

# 显示状态
echo ""
echo "Nginx 服务状态:"
systemctl status nginx --no-pager -l 2>/dev/null | head -10 || service nginx status 2>/dev/null | head -10 || echo "无法获取详细状态"
ENDSSH

  echo ""
  print_success "Nginx 重启完成！"
}

# ============================================
# 修复端口占用
# ============================================
cmd_fix_port() {
  # 要检查的端口（默认 80 和 443）
  local ports="${1:-80 443}"

  print_info "检查并修复端口占用问题..."

  ssh_exec << ENDSSH
set -e

echo "=========================================="
echo "检查端口占用情况"
echo "=========================================="

for PORT in ${ports}; do
  echo ""
  echo "检查端口 \${PORT}..."
  
  # 查找占用端口的进程
  local pid=""
  local process=""
  
  if command -v lsof &> /dev/null; then
    pid=\$(lsof -ti:\${PORT} 2>/dev/null || true)
    if [ ! -z "\$pid" ]; then
      process=\$(ps -p \$pid -o comm= 2>/dev/null || echo "unknown")
      echo "⚠ 端口 \${PORT} 被进程占用"
      echo "  PID: \$pid"
      echo "  进程: \$process"
      echo "  详细信息:"
      ps -fp \$pid 2>/dev/null || echo "无法获取进程信息"
    else
      echo "✓ 端口 \${PORT} 未被占用"
    fi
  elif command -v netstat &> /dev/null; then
    pid=\$(netstat -tlnp 2>/dev/null | grep ":\${PORT} " | awk '{print \$7}' | cut -d'/' -f1 | head -1)
    if [ ! -z "\$pid" ]; then
      process=\$(ps -p \$pid -o comm= 2>/dev/null || echo "unknown")
      echo "⚠ 端口 \${PORT} 被进程占用"
      echo "  PID: \$pid"
      echo "  进程: \$process"
    else
      echo "✓ 端口 \${PORT} 未被占用"
    fi
  elif command -v ss &> /dev/null; then
    pid=\$(ss -tlnp 2>/dev/null | grep ":\${PORT} " | sed 's/.*pid=\([0-9]*\).*/\1/' | head -1)
    if [ ! -z "\$pid" ]; then
      process=\$(ps -p \$pid -o comm= 2>/dev/null || echo "unknown")
      echo "⚠ 端口 \${PORT} 被进程占用"
      echo "  PID: \$pid"
      echo "  进程: \$process"
    else
      echo "✓ 端口 \${PORT} 未被占用"
    fi
  else
    echo "⚠ 无法检查端口占用（未安装 lsof/netstat/ss）"
  fi
  
  # 如果是 80 端口被占用，提供解决方案
  if [ "\${PORT}" = "80" ] && [ ! -z "\$pid" ]; then
    echo ""
    echo "=========================================="
    echo "端口 80 被占用，提供解决方案："
    echo "=========================================="
    echo ""
    echo "选项 1: 停止占用端口的进程（如果不需要）"
    echo "  kill -9 \$pid"
    echo ""
    echo "选项 2: 如果占用进程是 Apache，停止 Apache"
    if command -v systemctl &> /dev/null; then
      echo "  systemctl stop httpd  # CentOS/RHEL"
      echo "  systemctl stop apache2  # Ubuntu/Debian"
    else
      echo "  service httpd stop  # CentOS/RHEL"
      echo "  service apache2 stop  # Ubuntu/Debian"
    fi
    echo ""
    echo "选项 3: 如果占用进程是其他 Nginx 实例，停止它"
    echo "  systemctl stop nginx"
    echo "  或"
    echo "  pkill -f nginx"
    echo ""
    echo "选项 4: 使用非标准端口（8081）"
    echo "  修改 Nginx 配置，使用 8081 端口"
    echo ""
    read -p "是否要停止占用端口 \${PORT} 的进程？(y/N): " -n 1 -r
    echo
    if [[ \$REPLY =~ ^[Yy]\$ ]]; then
      echo "停止进程 \$pid..."
      if kill -9 \$pid 2>/dev/null; then
        echo "✓ 进程已停止"
        sleep 2
        # 再次检查
        if lsof -ti:\${PORT} > /dev/null 2>&1 || netstat -tlnp 2>/dev/null | grep ":\${PORT} " > /dev/null; then
          echo "⚠ 端口仍被占用，可能需要强制清理"
        else
          echo "✓ 端口 \${PORT} 已释放"
        fi
      else
        echo "✗ 无法停止进程，可能需要 root 权限"
      fi
    fi
  fi
done

echo ""
echo "=========================================="
echo "检查完成"
echo "=========================================="
echo ""
echo "如果端口已释放，可以尝试启动 Nginx:"
echo "  systemctl start nginx"
echo "  或运行: ./book-excerpt.sh start-nginx"
ENDSSH

  echo ""
  print_success "端口检查完成！"
  echo ""
  print_info "如果端口已释放，可以启动 Nginx:"
  echo -e "  ${BLUE}./book-excerpt.sh start-nginx${NC}"
}

# ============================================
# 检查状态
# ============================================
cmd_check() {
  print_info "检查前端应用部署状态..."

  ssh_exec << 'ENDSSH'
echo "=========================================="
echo "1. 检查部署目录"
echo "=========================================="
if [ -d "/var/www/html/book-excerpt-generator" ]; then
  echo "✓ 部署目录存在"
  echo "目录大小: $(du -sh /var/www/html/book-excerpt-generator 2>/dev/null | cut -f1)"
  echo ""
  echo "文件列表:"
  ls -lah /var/www/html/book-excerpt-generator | head -15
else
  echo "✗ 部署目录不存在"
fi

echo ""
echo "=========================================="
echo "2. 检查关键文件"
echo "=========================================="
cd /var/www/html/book-excerpt-generator 2>/dev/null || echo "无法进入部署目录"

FILES=("index.html" "style.css" "js/index.js")
for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    size=$(stat -c%s "$file" 2>/dev/null || stat -f%z "$file" 2>/dev/null || echo "unknown")
    echo "✓ $file 存在 (${size} bytes)"
  else
    echo "✗ $file 不存在"
  fi
done

echo ""
echo "=========================================="
echo "3. 检查 JavaScript 文件"
echo "=========================================="
if [ -d "js" ]; then
  js_count=$(find js -type f -name "*.js" 2>/dev/null | wc -l)
  echo "✓ js/ 目录存在，包含 $js_count 个 JavaScript 文件"
  echo ""
  echo "JavaScript 文件列表:"
  find js -type f -name "*.js" 2>/dev/null | head -10
else
  echo "✗ js/ 目录不存在"
fi

echo ""
echo "=========================================="
echo "4. 检查文件权限"
echo "=========================================="
if [ -d "/var/www/html/book-excerpt-generator" ]; then
  perms=$(stat -c "%a" /var/www/html/book-excerpt-generator 2>/dev/null || stat -f "%OLp" /var/www/html/book-excerpt-generator 2>/dev/null || echo "unknown")
  owner=$(stat -c "%U:%G" /var/www/html/book-excerpt-generator 2>/dev/null || stat -f "%Su:%Sg" /var/www/html/book-excerpt-generator 2>/dev/null || echo "unknown")
  echo "目录权限: $perms"
  echo "目录所有者: $owner"
  
  if [ -f "index.html" ]; then
    file_perms=$(stat -c "%a" index.html 2>/dev/null || stat -f "%OLp" index.html 2>/dev/null || echo "unknown")
    echo "index.html 权限: $file_perms"
  fi
fi

echo ""
echo "=========================================="
echo "5. 检查 Web 服务器"
echo "=========================================="

# 检查 Nginx
if command -v nginx &> /dev/null; then
  echo "✓ Nginx 已安装"
  if systemctl is-active --quiet nginx 2>/dev/null || service nginx status &>/dev/null; then
    echo "✓ Nginx 正在运行"
  else
    echo "⚠ Nginx 未运行"
    echo ""
    echo "启动 Nginx:"
    echo "  方法1: 运行 ./book-excerpt.sh start-nginx"
    echo "  方法2: ssh ${SERVER_USER}@${SERVER_HOST} 'systemctl start nginx'"
  fi
elif [ -f "/etc/nginx/nginx.conf" ]; then
  echo "⚠ Nginx 配置文件存在但命令不可用"
else
  echo "⚠ Nginx 未安装"
  echo ""
  echo "安装 Nginx:"
  echo "  CentOS/RHEL: yum install -y nginx"
  echo "  Ubuntu/Debian: apt-get install -y nginx"
fi

# 检查 Apache
if command -v apache2 &> /dev/null || command -v httpd &> /dev/null; then
  echo "✓ Apache 已安装"
  if systemctl is-active --quiet apache2 2>/dev/null || systemctl is-active --quiet httpd 2>/dev/null || service apache2 status &>/dev/null || service httpd status &>/dev/null; then
    echo "✓ Apache 正在运行"
  else
    echo "⚠ Apache 未运行"
  fi
fi

echo ""
echo "=========================================="
echo "6. 检查端口监听"
echo "=========================================="
if netstat -tlnp 2>/dev/null | grep -E ':(80|443)' > /dev/null || ss -tlnp 2>/dev/null | grep -E ':(80|443)' > /dev/null; then
  echo "✓ Web 服务器端口正在监听"
  netstat -tlnp 2>/dev/null | grep -E ':(80|443)' || ss -tlnp 2>/dev/null | grep -E ':(80|443)'
else
  echo "✗ 未检测到 Web 服务器端口监听（80 或 443）"
fi

echo ""
echo "=========================================="
echo "7. 测试 HTTP 访问"
echo "=========================================="
cd /var/www/html/book-excerpt-generator 2>/dev/null || echo "无法进入部署目录"

# 测试本地访问
if curl -s -o /dev/null -w "%{http_code}" http://localhost/ 2>/dev/null | grep -q "200\|301\|302"; then
  echo "✓ 本地 HTTP 访问成功"
  curl -s http://localhost/ | head -5
elif curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1/ 2>/dev/null | grep -q "200\|301\|302"; then
  echo "✓ 本地 HTTP 访问成功"
else
  echo "⚠ 本地 HTTP 访问失败（可能需要配置 Web 服务器）"
fi

echo ""
echo "=========================================="
echo "8. 检查 Nginx 配置结构"
echo "=========================================="
if [ -f "/etc/nginx/nginx.conf" ]; then
  echo "✓ 主配置文件存在: /etc/nginx/nginx.conf"
  
  # 检查是否包含 conf.d
  if grep -q "include.*conf.d" /etc/nginx/nginx.conf; then
    echo "✓ 主配置文件包含 conf.d 目录"
  else
    echo "⚠ 主配置文件未包含 conf.d 目录"
    echo "需要在 /etc/nginx/nginx.conf 的 http {} 块内添加:"
    echo "  include /etc/nginx/conf.d/*.conf;"
  fi
  
  # 检查 conf.d 目录
  if [ -d "/etc/nginx/conf.d" ]; then
    echo "✓ conf.d 目录存在"
    echo "配置文件列表:"
    ls -lah /etc/nginx/conf.d/*.conf 2>/dev/null || echo "  无配置文件"
  else
    echo "⚠ conf.d 目录不存在"
  fi
  
  # 检查我们的配置文件
  if [ -f "/etc/nginx/conf.d/book-excerpt-generator.conf" ]; then
    echo "✓ 应用配置文件存在"
    echo ""
    echo "配置文件内容（前20行）:"
    head -20 /etc/nginx/conf.d/book-excerpt-generator.conf
  else
    echo "⚠ 应用配置文件不存在"
    echo "运行 ./book-excerpt.sh update-nginx 来上传配置"
  fi
  
  # 测试配置语法
  echo ""
  echo "测试 Nginx 配置语法..."
  NGINX_CMD=""
  if command -v nginx &> /dev/null; then
    NGINX_CMD="nginx"
  elif [ -f "/usr/sbin/nginx" ]; then
    NGINX_CMD="/usr/sbin/nginx"
  elif [ -f "/usr/local/sbin/nginx" ]; then
    NGINX_CMD="/usr/local/sbin/nginx"
  elif [ -f "/sbin/nginx" ]; then
    NGINX_CMD="/sbin/nginx"
  fi
  
  if [ ! -z "$NGINX_CMD" ]; then
    if $NGINX_CMD -t 2>&1 | head -5; then
      echo "✓ Nginx 配置语法正确"
    else
      echo "✗ Nginx 配置语法错误"
    fi
  else
    echo "⚠ Nginx 未安装或未找到"
  fi
else
  echo "⚠ Nginx 主配置文件不存在"
fi

echo ""
echo "=========================================="
echo "检查完成"
echo "=========================================="
ENDSSH

  echo ""
  print_success "状态检查完成！"
  echo ""
  print_info "访问地址:"
  echo -e "  ${GREEN}http://${SERVER_HOST}${NC}"
  echo -e "  ${GREEN}https://${SERVER_HOST}${NC}"
  echo ""
  print_info "如果无法访问，请检查:"
  echo -e "  1. Web 服务器（Nginx/Apache）是否运行"
  echo -e "  2. Web 服务器配置是否正确"
  echo -e "  3. 防火墙是否开放端口"
  echo -e "  4. 文件权限是否正确"
}

# ============================================
# 清除缓存
# ============================================
cmd_clear_cache() {
  print_title "清除服务器缓存"
  
  print_warning "注意: 此操作主要清除服务器端缓存（如果有）"
  print_info "浏览器缓存需要用户手动清除或强制刷新"
  echo ""
  
  ssh_exec << 'ENDSSH'
set -e

echo "检查并清除可能的缓存..."

# 清除 Nginx 缓存（如果配置了）
if [ -d "/var/cache/nginx" ]; then
  echo "清除 Nginx 缓存..."
  rm -rf /var/cache/nginx/*
  echo "✓ Nginx 缓存已清除"
else
  echo "⚠ Nginx 缓存目录不存在（可能未启用缓存）"
fi

# 重新加载 Nginx（使配置生效）
if systemctl is-active --quiet nginx 2>/dev/null || service nginx status &>/dev/null; then
  echo ""
  echo "重新加载 Nginx 配置..."
  if systemctl reload nginx 2>/dev/null || service nginx reload 2>/dev/null; then
    echo "✓ Nginx 已重新加载"
  else
    echo "⚠ Nginx 重新加载失败（可能不需要）"
  fi
fi

echo ""
echo "=========================================="
echo "服务器端缓存清除完成"
echo "=========================================="
echo ""
echo "⚠️  重要提示："
echo "1. 浏览器缓存需要用户手动清除"
echo "2. 使用强制刷新: Ctrl+Shift+R (Windows/Linux) 或 Cmd+Shift+R (macOS)"
echo "3. 或者清除浏览器的缓存和 Cookie"
ENDSSH

  echo ""
  print_success "缓存清除完成！"
  echo ""
  print_info "下一步操作:"
  echo -e "  1. 在浏览器中强制刷新页面 (Ctrl+Shift+R 或 Cmd+Shift+R)"
  echo -e "  2. 或清除浏览器缓存"
  echo -e "  3. 或使用无痕模式访问网站"
}

# ============================================
# Docker 相关函数
# ============================================

# 构建 Docker 镜像
cmd_docker_build() {
  print_info "构建 Docker 镜像..."
  echo ""
  
  cd "$PROJECT_ROOT" || return 1
  check_file_exists "Dockerfile" "未找到 Dockerfile" || return 1

  local base_image="nginx:1.25-alpine"
  local build_platform="${BUILD_PLATFORM:-linux/amd64}"
  
  # 检查基础镜像是否存在
  if ! docker images --format "{{.Repository}}:{{.Tag}}" | grep -q "^${base_image}$"; then
    print_info "拉取基础镜像..."
    if ! docker pull --platform "$build_platform" "$base_image"; then
      print_error "基础镜像拉取失败，请手动拉取: docker pull --platform $build_platform $base_image"
      return 1
    fi
  fi

  local build_msg="构建镜像（平台: ${build_platform}）..."
  print_info "$build_msg"
  if ! docker build --platform "$build_platform" -t "${DOCKER_IMAGE_NAME}:latest" .; then
    print_error "Docker 镜像构建失败"
    return 1
  fi
  
  print_success "Docker 镜像构建完成！"
  docker images | grep "$DOCKER_IMAGE_NAME" || true
}

# 启动 Docker 容器（本地调试）
cmd_docker_up() {
  print_info "启动 Docker 容器（本地调试模式）..."
  echo ""
  
  cd "$PROJECT_ROOT" || return 1
  check_file_exists "docker-compose.yml" "未找到 docker-compose.yml" || return 1
  
  local port="${PORT:-8081}"
  if is_port_in_use "$port"; then
    print_warning "端口 $port 已被占用"
    echo "使用自定义端口: PORT=8081 ./scripts/book-excerpt.sh docker-up"
    return 1
  fi
  
  if ! docker-compose -f "$DOCKER_COMPOSE_FILE" up -d; then
    print_error "Docker 容器启动失败"
    return 1
  fi
  
  echo ""
  print_success "Docker 容器已启动！"
  print_info "访问地址: http://localhost:${port}"
  print_info "查看日志: ./scripts/book-excerpt.sh docker-logs"
  print_info "停止容器: ./scripts/book-excerpt.sh docker-down"
}

# 停止 Docker 容器
cmd_docker_down() {
  print_info "停止 Docker 容器..."
  echo ""
  
  cd "$PROJECT_ROOT" || return 1
  docker-compose -f "$DOCKER_COMPOSE_FILE" down
  
  echo ""
  print_success "Docker 容器已停止！"
}

# 查看 Docker 容器日志
cmd_docker_logs() {
  print_info "查看 Docker 容器日志..."
  echo ""
  
  cd "$PROJECT_ROOT" || return 1
  docker-compose -f "$DOCKER_COMPOSE_FILE" logs -f --tail=100
}

# 进入 Docker 容器 shell
cmd_docker_shell() {
  print_info "进入 Docker 容器 shell..."
  echo ""
  
  cd "$PROJECT_ROOT" || return 1
  
  if ! docker ps --format "{{.Names}}" | grep -q "^${DOCKER_CONTAINER_NAME}$"; then
    print_error "容器未运行，请先启动容器"
    echo "启动容器: ./scripts/book-excerpt.sh docker-up"
    return 1
  fi
  
  docker exec -it "$DOCKER_CONTAINER_NAME" /bin/sh
}

# 重启 Docker 容器
cmd_docker_restart() {
  print_info "重启 Docker 容器..."
  echo ""
  
  cd "$PROJECT_ROOT" || return 1
  docker-compose -f "$DOCKER_COMPOSE_FILE" restart
  
  echo ""
  print_success "Docker 容器已重启！"
}

# 使用 Docker 部署到服务器
cmd_docker_deploy() {
  print_info "使用 Docker 部署到服务器 ${SERVER_HOST}..."
  echo ""
  
  cd "$PROJECT_ROOT" || return 1
  
  # 检查必要文件
  check_file_exists "Dockerfile" "未找到 Dockerfile" || return 1
  check_file_exists "scripts/book-excerpt.nginx.docker.conf" "未找到 Nginx Docker 配置文件" || return 1
  
  # 1. 构建镜像
  print_info "[1/5] 构建 Docker 镜像..."
  if ! cmd_docker_build; then
    return 1
  fi
  
  # 2. 导出镜像
  print_info "[2/5] 导出镜像..."
  local temp_image_file
  temp_image_file=$(mktemp).tar.gz
  register_cleanup "$temp_image_file"
  
  if ! docker save "${DOCKER_IMAGE_NAME}:latest" | gzip > "$temp_image_file"; then
    print_error "镜像导出失败"
    return 1
  fi
  
  # 3. 上传镜像
  print_info "[3/5] 上传镜像到服务器..."
  local remote_image_file="/tmp/book-excerpt-generator-image.tar.gz"
  if ! scp $SSH_OPTIONS -P "${SERVER_PORT}" "$temp_image_file" "${SSH_TARGET}:${remote_image_file}"; then
    print_error "镜像上传失败"
    return 1
  fi
  
  # 4. 在服务器上加载并运行容器
  print_info "[4/5] 在服务器上加载镜像并运行容器..."
  ssh_exec << ENDSSH
set -euo pipefail

echo "加载 Docker 镜像..."
docker load < ${remote_image_file}
rm -f ${remote_image_file}

echo "停止并删除旧容器（如果存在）..."
docker stop ${DOCKER_CONTAINER_NAME} 2>/dev/null || true
docker rm ${DOCKER_CONTAINER_NAME} 2>/dev/null || true

echo "启动新容器..."
docker run -d \
  --name ${DOCKER_CONTAINER_NAME} \
  --restart unless-stopped \
  -p 127.0.0.1:8081:80 \
  ${DOCKER_IMAGE_NAME}:latest

echo "等待容器启动..."
sleep 3

echo "检查容器状态..."
if docker ps | grep -q ${DOCKER_CONTAINER_NAME}; then
  echo "✓ 容器已成功启动"
  docker ps | grep ${DOCKER_CONTAINER_NAME}
else
  echo "✗ 容器启动失败"
  echo "容器日志:"
  docker logs ${DOCKER_CONTAINER_NAME} 2>&1 | tail -20
  exit 1
fi

echo "检查容器健康状态..."
if docker inspect --format='{{.State.Health.Status}}' ${DOCKER_CONTAINER_NAME} 2>/dev/null | grep -q "healthy\|none"; then
  echo "✓ 容器运行正常"
else
  echo "⚠ 容器健康检查未通过，但容器正在运行"
fi

echo "测试容器 HTTP 访问..."
if curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8081/ | grep -q "200\|301\|302"; then
  echo "✓ 容器 HTTP 服务正常"
else
  echo "⚠ 容器 HTTP 服务可能未就绪，请稍后重试"
fi
ENDSSH
  
  if [ $? -ne 0 ]; then
    print_error "容器部署失败"
    return 1
  fi
  
  # 5. 更新 Nginx 配置并重启
  print_info "[5/5] 更新 Nginx 配置并重启服务..."
  local nginx_docker_conf="$SCRIPT_DIR/book-excerpt.nginx.docker.conf"
  if ! cmd_update_nginx "$nginx_docker_conf"; then
    print_warning "Nginx 配置更新失败，但容器已部署"
    print_info "可以手动运行: ./scripts/book-excerpt.sh update-nginx scripts/book-excerpt.nginx.docker.conf"
  else
    # 重启 Nginx 确保配置生效
    if ! cmd_restart_nginx; then
      print_warning "Nginx 重启失败，但容器已部署"
      print_info "可以手动运行: ./scripts/book-excerpt.sh restart-nginx"
    fi
  fi
  
  echo ""
  print_success "Docker 部署完成！"
  echo ""
  print_info "部署信息:"
  echo -e "  容器名称: ${BLUE}${DOCKER_CONTAINER_NAME}${NC}"
  echo -e "  容器端口: ${BLUE}127.0.0.1:8081${NC}"
  echo -e "  访问地址:"
  echo -e "    ${GREEN}http://${SERVER_HOST}${NC}"
  echo -e "    ${GREEN}https://${SERVER_HOST}${NC}"
  echo ""
  print_info "管理命令:"
  echo -e "  查看日志: ${BLUE}ssh ${SERVER_USER}@${SERVER_HOST} 'docker logs -f ${DOCKER_CONTAINER_NAME}'${NC}"
  echo -e "  重启容器: ${BLUE}ssh ${SERVER_USER}@${SERVER_HOST} 'docker restart ${DOCKER_CONTAINER_NAME}'${NC}"
  echo -e "  查看状态: ${BLUE}ssh ${SERVER_USER}@${SERVER_HOST} 'docker ps | grep ${DOCKER_CONTAINER_NAME}'${NC}"
}

# ============================================
# 主函数
# ============================================
main() {
  show_welcome "${1:-}"
  COMMAND="${1:-help}"

  case "$COMMAND" in
    update-ssh-key)
      cmd_update_ssh_key
      ;;
    update-nginx)
      cmd_update_nginx "${2:-}"
      ;;
    start-nginx)
      cmd_start_nginx
      ;;
    restart-nginx)
      cmd_restart_nginx
      ;;
    fix-port)
      cmd_fix_port "${2:-}"
      ;;
    check)
      cmd_check
      ;;
    clear-cache)
      cmd_clear_cache
      ;;
    docker-build)
      cmd_docker_build
      ;;
    docker-up)
      cmd_docker_up
      ;;
    docker-down)
      cmd_docker_down
      ;;
    docker-logs)
      cmd_docker_logs
      ;;
    docker-shell)
      cmd_docker_shell
      ;;
    docker-restart)
      cmd_docker_restart
      ;;
    docker-deploy)
      cmd_docker_deploy
      ;;
    help|--help|-h)
      show_help
      ;;
    *)
      print_error "未知命令 '$COMMAND'"
      echo ""
      show_help
      exit 1
      ;;
  esac
}

# 初始化 SSH 连接（在加载共用脚本后）
init_ssh_connection

# 执行主函数
main "$@"
