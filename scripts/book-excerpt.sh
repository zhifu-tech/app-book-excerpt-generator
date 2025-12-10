#!/bin/bash

# ============================================
# Book Excerpt Generator - 统一管理脚本
# ============================================
# 整合所有部署和管理功能
# 使用方法: ./book-excerpt.sh [command] [options]
# ============================================

set -e

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ============================================
# 配置变量
# ============================================

# 服务器配置
SERVER_HOST="8.138.183.116"
SERVER_USER="root"
SERVER_PORT="22"

# 应用目录配置
APP_DIR="/var/www/html/book-excerpt-generator"
NGINX_CONF_PATH="/etc/nginx/conf.d/book-excerpt-generator.conf"
BACKUP_DIR="/etc/nginx/conf.d/backup"
SSL_CERT_DIR="/etc/nginx/ssl"

# SSH 配置
SSH_KEY_NAME="id_rsa_book_excerpt"
SSH_KEY_PATH="$HOME/.ssh/$SSH_KEY_NAME"
SSH_ALIAS="book-excerpt-server"

# 初始化 SSH 连接参数
init_ssh_connection() {
  if [ -f "$SSH_KEY_PATH" ]; then
    SSH_OPTIONS="-i $SSH_KEY_PATH"
    SSH_TARGET="$SERVER_USER@$SERVER_HOST"
  elif ssh -o ConnectTimeout=1 -o BatchMode=yes "$SSH_ALIAS" "echo" &>/dev/null 2>&1; then
    SSH_OPTIONS=""
    SSH_TARGET="$SSH_ALIAS"
  else
    SSH_OPTIONS=""
    SSH_TARGET="$SERVER_USER@$SERVER_HOST"
  fi
}

# 自动初始化 SSH 连接
init_ssh_connection

# 颜色输出定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ============================================
# 工具函数
# ============================================

# 打印成功消息
print_success() {
  echo -e "${GREEN}✓ $1${NC}"
}

# 打印警告消息
print_warning() {
  echo -e "${YELLOW}⚠ $1${NC}"
}

# 打印错误消息
print_error() {
  echo -e "${RED}✗ $1${NC}"
}

# 打印信息消息
print_info() {
  echo -e "${BLUE}ℹ $1${NC}"
}

# 打印标题
print_title() {
  echo -e "${CYAN}==========================================${NC}"
  echo -e "${CYAN}$1${NC}"
  echo -e "${CYAN}==========================================${NC}"
}

# ============================================
# Nginx 相关函数
# ============================================

# 查找 nginx 命令路径
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

# 检查 Nginx 是否安装
check_nginx_installed() {
  local nginx_cmd=$(find_nginx_cmd)
  if [ -z "$nginx_cmd" ]; then
    return 1
  else
    return 0
  fi
}

# 检查 Nginx 配置语法
check_nginx_config() {
  local nginx_cmd=$(find_nginx_cmd)
  if [ -z "$nginx_cmd" ]; then
    echo "Nginx 未安装"
    return 1
  fi
  
  if $nginx_cmd -t 2>&1; then
    return 0
  else
    return 1
  fi
}

# 检查 Nginx 服务状态
check_nginx_status() {
  if systemctl is-active --quiet nginx 2>/dev/null || service nginx status &>/dev/null; then
    return 0
  else
    return 1
  fi
}

# 检查端口是否被占用
check_port_in_use() {
  local port=$1
  local pid=""
  
  if command -v lsof &> /dev/null; then
    pid=$(lsof -ti:$port 2>/dev/null || echo "")
  elif command -v netstat &> /dev/null; then
    pid=$(netstat -tlnp 2>/dev/null | grep ":$port " | awk '{print $7}' | cut -d'/' -f1 | head -1)
  elif command -v ss &> /dev/null; then
    pid=$(ss -tlnp 2>/dev/null | grep ":$port " | sed 's/.*pid=\([0-9]*\).*/\1/' | head -1)
  fi
  
  if [ -n "$pid" ]; then
    echo "$pid"
    return 0
  else
    return 1
  fi
}

# 获取占用端口的进程信息
get_port_process_info() {
  local port=$1
  local pid=$(check_port_in_use "$port")
  
  if [ -n "$pid" ]; then
    local process=$(ps -p $pid -o comm= 2>/dev/null || echo "unknown")
    echo "$pid|$process"
    return 0
  else
    return 1
  fi
}

# 检查端口监听（用于 Nginx）
check_nginx_listening() {
  local ports="${1:-80 443 8080}"
  local found=false
  
  for port in $ports; do
    if netstat -tlnp 2>/dev/null | grep -E "nginx.*:$port" > /dev/null || \
       ss -tlnp 2>/dev/null | grep -E "nginx.*:$port" > /dev/null; then
      found=true
      break
    fi
  done
  
  if [ "$found" = true ]; then
    return 0
  else
    return 1
  fi
}

# 检查 Apache 是否安装
check_apache_installed() {
  if command -v apache2 &> /dev/null || command -v httpd &> /dev/null; then
    return 0
  else
    return 1
  fi
}

# 检查 Apache 服务状态
check_apache_status() {
  if systemctl is-active --quiet apache2 2>/dev/null || \
     systemctl is-active --quiet httpd 2>/dev/null || \
     service apache2 status &>/dev/null || \
     service httpd status &>/dev/null; then
    return 0
  else
    return 1
  fi
}

# 检查文件是否存在
check_file_exists() {
  local file=$1
  if [ -f "$file" ]; then
    return 0
  else
    return 1
  fi
}

# 检查目录是否存在
check_dir_exists() {
  local dir=$1
  if [ -d "$dir" ]; then
    return 0
  else
    return 1
  fi
}

# 在远程服务器执行命令（带错误处理）
remote_exec() {
  local cmd=$1
  ssh $SSH_OPTIONS -t -p ${SERVER_PORT} ${SSH_TARGET} "$cmd"
}

# 在远程服务器执行多行命令
remote_exec_heredoc() {
  local heredoc_content=$1
  ssh $SSH_OPTIONS -t -p ${SERVER_PORT} ${SSH_TARGET} << ENDSSH
$heredoc_content
ENDSSH
}

# ============================================
# 欢迎界面
# ============================================
show_welcome() {
  echo ""
  echo -e "${CYAN}"
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
  echo -e "${NC}"
  echo -e "${CYAN}              Generator - 书摘卡片生成器@Zhifu's Tech${NC}"
  echo ""
  local cmd="${1:-help}"
  echo -e "${YELLOW}版本: 1.0.0${NC}"
  echo -e "${YELLOW}服务器: ${SERVER_HOST}${NC}"
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
  echo -e "  ${GREEN}deploy${NC}             部署前端应用到服务器"
  echo -e "  ${GREEN}update-nginx${NC}       更新 Nginx 配置文件"
  echo -e "  ${GREEN}start-nginx${NC}        启动 Nginx 服务"
  echo -e "  ${GREEN}fix-port${NC}           修复端口占用问题"
  echo -e "  ${GREEN}check${NC}              检查部署状态和配置"
  echo -e "  ${GREEN}help${NC}               显示此帮助信息"
  echo ""
  echo -e "${YELLOW}示例:${NC}"
  echo "  ./book-excerpt.sh deploy"
  echo "  ./book-excerpt.sh update-nginx"
  echo "  ./book-excerpt.sh check"
  echo ""
}

# ============================================
# 部署功能
# ============================================
cmd_deploy() {
  echo -e "${GREEN}开始部署前端应用到服务器 ${SERVER_HOST}...${NC}"
  echo ""
  
  # 检查本地文件
  if [ ! -f "index.html" ]; then
    echo -e "${RED}错误: 未找到 index.html，请确保在项目根目录执行${NC}"
    exit 1
  fi

  if [ ! -d "js" ]; then
    echo -e "${RED}错误: 未找到 js/ 目录，请确保在项目根目录执行${NC}"
    exit 1
  fi

  # 创建临时部署目录
  TEMP_DIR=$(mktemp -d)
  echo -e "${YELLOW}创建临时目录: ${TEMP_DIR}${NC}"

  # 复制必要文件
  echo -e "${YELLOW}复制文件...${NC}"

  # 复制核心文件
  cp index.html style.css "$TEMP_DIR/" 2>/dev/null || true

  # 复制 JavaScript 目录
  if [ -d "js" ]; then
    cp -r js "$TEMP_DIR/"
    echo -e "${GREEN}✓ 已复制 js/ 目录${NC}"
  fi

  # 复制截图目录（如果存在）
  if [ -d "screenshots" ]; then
    cp -r screenshots "$TEMP_DIR/" 2>/dev/null || true
    echo -e "${GREEN}✓ 已复制 screenshots/ 目录${NC}"
  fi

  # 复制其他可能需要的文件
  if [ -f "package.json" ]; then
    cp package.json "$TEMP_DIR/" 2>/dev/null || true
  fi

  if [ -f "README.md" ]; then
    cp README.md "$TEMP_DIR/" 2>/dev/null || true
  fi

  # 上传文件到服务器
  echo -e "${YELLOW}上传文件到服务器...${NC}"
  ssh $SSH_OPTIONS -p ${SERVER_PORT} ${SSH_TARGET} "mkdir -p ${APP_DIR}"
  scp $SSH_OPTIONS -r -P ${SERVER_PORT} "$TEMP_DIR"/* ${SSH_TARGET}:${APP_DIR}/

  # 清理临时目录
  rm -rf "$TEMP_DIR"

  # 在服务器上执行部署后操作
  echo -e "${YELLOW}在服务器上配置权限和验证部署...${NC}"
  ssh $SSH_OPTIONS -t -p ${SERVER_PORT} ${SSH_TARGET} << ENDSSH
cd ${APP_DIR}

# 设置文件权限
echo "设置文件权限..."
chmod -R 755 ${APP_DIR}
chown -R nginx:nginx ${APP_DIR} 2>/dev/null || chown -R www-data:www-data ${APP_DIR} 2>/dev/null || echo "无法设置文件所有者（可能需要手动设置）"

# 验证关键文件
echo ""
echo "验证部署文件..."
if [ -f "index.html" ]; then
  echo -e "\033[0;32m✓ index.html 存在\033[0m"
else
  echo -e "\033[0;31m✗ index.html 不存在\033[0m"
fi

if [ -f "style.css" ]; then
  echo -e "\033[0;32m✓ style.css 存在\033[0m"
else
  echo -e "\033[0;31m✗ style.css 不存在\033[0m"
fi

if [ -d "js" ]; then
  echo -e "\033[0;32m✓ js/ 目录存在\033[0m"
  echo "  JavaScript 文件数量: \$(find js -type f -name '*.js' | wc -l)"
else
  echo -e "\033[0;31m✗ js/ 目录不存在\033[0m"
fi
ENDSSH

  echo ""
  echo -e "${GREEN}部署完成！${NC}"
  echo -e "${YELLOW}访问地址:${NC}"
  echo -e "  ${GREEN}http://${SERVER_HOST}${NC}"
  echo -e "  ${GREEN}https://${SERVER_HOST}${NC}"
}

# ============================================
# 更新 Nginx 配置
# ============================================
cmd_update_nginx() {
  # 确定配置文件路径
  if [ -n "$1" ]; then
    LOCAL_CONF="$1"
  else
    LOCAL_CONF="$SCRIPT_DIR/nginx.conf"
  fi

  # 检查本地配置文件是否存在
  if [ ! -f "$LOCAL_CONF" ]; then
    echo -e "${RED}错误: 配置文件不存在: ${LOCAL_CONF}${NC}"
    exit 1
  fi

  # 确定证书文件路径
  CERT_DIR="$SCRIPT_DIR/book-excerpt.zhifu.tech_nginx"
  CERT_BUNDLE_CRT="$CERT_DIR/book-excerpt.zhifu.tech_bundle.crt"
  CERT_BUNDLE_PEM="$CERT_DIR/book-excerpt.zhifu.tech_bundle.pem"
  CERT_KEY="$CERT_DIR/book-excerpt.zhifu.tech.key"

  # 检查证书文件是否存在
  CERT_FILES_EXIST=false
  if [ -f "$CERT_BUNDLE_CRT" ] && [ -f "$CERT_KEY" ]; then
    CERT_FILES_EXIST=true
    CERT_FILE="$CERT_BUNDLE_CRT"
  elif [ -f "$CERT_BUNDLE_PEM" ] && [ -f "$CERT_KEY" ]; then
    CERT_FILES_EXIST=true
    CERT_FILE="$CERT_BUNDLE_PEM"
  fi

  if [ "$CERT_FILES_EXIST" = true ]; then
    echo -e "${GREEN}✓ 找到证书文件${NC}"
    echo -e "${YELLOW}  证书文件: ${CERT_FILE}${NC}"
    echo -e "${YELLOW}  私钥文件: ${CERT_KEY}${NC}"
  else
    echo -e "${YELLOW}⚠ 未找到证书文件，将跳过证书上传${NC}"
    echo -e "${YELLOW}  预期位置: ${CERT_DIR}${NC}"
  fi

  echo -e "${GREEN}开始更新 Nginx 配置到服务器 ${SERVER_HOST}...${NC}"
  echo -e "${YELLOW}本地配置文件: ${LOCAL_CONF}${NC}"
  echo -e "${YELLOW}服务器配置文件: ${NGINX_CONF_PATH}${NC}"

  # 在服务器上执行更新操作
  ssh $SSH_OPTIONS -t -p ${SERVER_PORT} ${SSH_TARGET} << 'ENDSSH'
set -e

# 查找 nginx 命令路径
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

# 检查 Nginx 是否安装
if [ -z "$NGINX_CMD" ]; then
  echo -e "\033[0;33m⚠ Nginx 未安装或未找到，将继续上传配置文件\033[0m"
  echo "可以稍后安装 Nginx 并测试配置"
else
  echo -e "\033[0;32m✓ Nginx 已安装: $($NGINX_CMD -v 2>&1)\033[0m"
fi

# 创建备份目录
mkdir -p /etc/nginx/conf.d/backup
echo -e "\033[0;32m✓ 备份目录已创建\033[0m"

# 备份现有配置（如果存在）
if [ -f "/etc/nginx/conf.d/book-excerpt-generator.conf" ]; then
  BACKUP_FILE="/etc/nginx/conf.d/backup/book-excerpt-generator.conf.backup.$(date +%Y%m%d_%H%M%S)"
  cp /etc/nginx/conf.d/book-excerpt-generator.conf "$BACKUP_FILE"
  echo -e "\033[0;32m✓ 已备份现有配置到: $BACKUP_FILE\033[0m"
else
  echo -e "\033[0;33m⚠ 配置文件不存在，将创建新配置\033[0m"
fi

# 创建配置目录（如果不存在）
mkdir -p /etc/nginx/conf.d
echo -e "\033[0;32m✓ 配置目录已准备\033[0m"
ENDSSH

  # 上传配置文件
  echo -e "${YELLOW}上传配置文件到服务器...${NC}"
  scp $SSH_OPTIONS -P ${SERVER_PORT} "$LOCAL_CONF" ${SSH_TARGET}:${NGINX_CONF_PATH}

  # 上传证书文件（如果存在）
  if [ "$CERT_FILES_EXIST" = true ]; then
    echo -e "${YELLOW}上传 SSL 证书到服务器...${NC}"
    
    # 在服务器上创建 SSL 证书目录
    ssh $SSH_OPTIONS -t -p ${SERVER_PORT} ${SSH_TARGET} << ENDSSH
set -e
mkdir -p ${SSL_CERT_DIR}
echo -e "\033[0;32m✓ SSL 证书目录已创建: ${SSL_CERT_DIR}\033[0m"
ENDSSH
    
    # 上传证书文件
    CERT_NAME="book-excerpt.zhifu.tech"
    if [ -f "$CERT_BUNDLE_CRT" ]; then
      scp $SSH_OPTIONS -P ${SERVER_PORT} "$CERT_BUNDLE_CRT" ${SSH_TARGET}:${SSL_CERT_DIR}/${CERT_NAME}_bundle.crt
      echo -e "${GREEN}✓ 证书文件已上传${NC}"
    elif [ -f "$CERT_BUNDLE_PEM" ]; then
      scp $SSH_OPTIONS -P ${SERVER_PORT} "$CERT_BUNDLE_PEM" ${SSH_TARGET}:${SSL_CERT_DIR}/${CERT_NAME}_bundle.pem
      echo -e "${GREEN}✓ 证书文件已上传${NC}"
    fi
    
    # 上传私钥文件
    scp $SSH_OPTIONS -P ${SERVER_PORT} "$CERT_KEY" ${SSH_TARGET}:${SSL_CERT_DIR}/${CERT_NAME}.key
    echo -e "${GREEN}✓ 私钥文件已上传${NC}"
    
    # 设置证书文件权限
    ssh $SSH_OPTIONS -t -p ${SERVER_PORT} ${SSH_TARGET} << ENDSSH
set -e
# 设置证书文件权限（644）
chmod 644 ${SSL_CERT_DIR}/${CERT_NAME}_bundle.* 2>/dev/null || true
# 设置私钥文件权限（600，只有所有者可读）
chmod 600 ${SSL_CERT_DIR}/${CERT_NAME}.key
# 设置所有者
chown root:root ${SSL_CERT_DIR}/${CERT_NAME}.*
echo -e "\033[0;32m✓ 证书文件权限已设置\033[0m"
ENDSSH
  fi

  # 在服务器上验证和应用配置
  ssh $SSH_OPTIONS -t -p ${SERVER_PORT} ${SSH_TARGET} << 'ENDSSH'
set -e

# 检查主配置文件是否包含 conf.d
echo "检查主配置文件..."
if ! grep -q "include.*conf.d" /etc/nginx/nginx.conf 2>/dev/null; then
  echo -e "\033[0;33m⚠ 主配置文件未包含 conf.d 目录\033[0m"
  echo "检查是否需要添加 include 指令..."
  
  # 检查是否有 http 块
  if grep -q "http {" /etc/nginx/nginx.conf; then
    echo "主配置文件包含 http 块，但可能缺少 include 指令"
    echo "建议手动添加: include /etc/nginx/conf.d/*.conf;"
    echo "位置: 在 http {} 块内"
  fi
else
  echo -e "\033[0;32m✓ 主配置文件已包含 conf.d 目录\033[0m"
fi

# 确保 conf.d 目录存在
if [ ! -d "/etc/nginx/conf.d" ]; then
  echo "创建 conf.d 目录..."
  mkdir -p /etc/nginx/conf.d
  echo -e "\033[0;32m✓ conf.d 目录已创建\033[0m"
fi

# 设置文件权限
chmod 644 /etc/nginx/conf.d/book-excerpt-generator.conf
chown root:root /etc/nginx/conf.d/book-excerpt-generator.conf
echo -e "\033[0;32m✓ 文件权限已设置\033[0m"
ENDSSH

  # 测试 Nginx 配置
  echo ""
  echo "=========================================="
  echo "测试 Nginx 配置..."
  echo "=========================================="
  ssh $SSH_OPTIONS -t -p ${SERVER_PORT} ${SSH_TARGET} << 'ENDSSH'
set -e

# 查找 nginx 命令路径
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
  if $NGINX_CMD -t 2>&1; then
    echo -e "\033[0;32m✓ Nginx 配置语法正确\033[0m"
  else
    echo -e "\033[0;31m✗ Nginx 配置语法错误\033[0m"
    echo ""
    echo "如果配置有误，可以从备份恢复："
    echo "  ls -lt /etc/nginx/conf.d/backup/book-excerpt-generator.conf.backup.* | head -1"
    exit 1
  fi
else
  echo -e "\033[0;33m⚠ 未找到 nginx 命令，跳过配置测试\033[0m"
  echo "配置文件已上传，但无法验证语法"
  echo "可以手动测试: /usr/sbin/nginx -t 或 systemctl status nginx"
fi
ENDSSH

  # 重新加载 Nginx
  echo ""
  echo "=========================================="
  echo "重新加载 Nginx 配置"
  echo "=========================================="
  ssh $SSH_OPTIONS -t -p ${SERVER_PORT} ${SSH_TARGET} << 'ENDSSH'
set -e

# 尝试重新加载（不中断服务）
if systemctl reload nginx 2>/dev/null || service nginx reload 2>/dev/null; then
  echo -e "\033[0;32m✓ Nginx 配置已重新加载\033[0m"
elif systemctl restart nginx 2>/dev/null || service nginx restart 2>/dev/null; then
  echo -e "\033[0;33m⚠ 使用 restart 方式重新加载（服务会短暂中断）\033[0m"
  echo -e "\033[0;32m✓ Nginx 已重启\033[0m"
else
  echo -e "\033[0;33m⚠ 无法重新加载 Nginx（可能未运行）\033[0m"
  echo "配置文件已上传，可以手动启动:"
  echo "  systemctl start nginx"
fi

# 检查 Nginx 状态
echo ""
echo "=========================================="
echo "检查 Nginx 状态"
echo "=========================================="
if systemctl is-active --quiet nginx 2>/dev/null || service nginx status &>/dev/null; then
  echo -e "\033[0;32m✓ Nginx 正在运行\033[0m"
  systemctl status nginx --no-pager -l 2>/dev/null | head -10 || service nginx status 2>/dev/null | head -10
else
  echo -e "\033[0;33m⚠ Nginx 未运行\033[0m"
  echo "配置文件已上传，可以手动启动:"
  echo "  systemctl start nginx"
fi

# 检查端口监听
echo ""
echo "=========================================="
echo "检查端口监听"
echo "=========================================="
if netstat -tlnp 2>/dev/null | grep -E 'nginx.*:(80|443|8080)' > /dev/null || \
   ss -tlnp 2>/dev/null | grep -E 'nginx.*:(80|443|8080)' > /dev/null; then
  echo -e "\033[0;32m✓ Nginx 端口正在监听\033[0m"
  netstat -tlnp 2>/dev/null | grep -E 'nginx.*:(80|443|8080)' || \
  ss -tlnp 2>/dev/null | grep -E 'nginx.*:(80|443|8080)'
else
  echo -e "\033[0;33m⚠ 未检测到 Nginx 端口监听\033[0m"
fi

echo ""
echo "=========================================="
echo "配置更新完成"
echo "=========================================="
ENDSSH

  echo ""
  echo -e "${GREEN}Nginx 配置更新完成！${NC}"
  echo -e "${BLUE}========================================${NC}"
  echo -e "${YELLOW}配置文件位置:${NC}"
  echo -e "  ${GREEN}${NGINX_CONF_PATH}${NC}"
  if [ "$CERT_FILES_EXIST" = true ]; then
    echo ""
    echo -e "${YELLOW}SSL 证书位置:${NC}"
    echo -e "  ${GREEN}${SSL_CERT_DIR}/book-excerpt.zhifu.tech_bundle.*${NC}"
    echo -e "  ${GREEN}${SSL_CERT_DIR}/book-excerpt.zhifu.tech.key${NC}"
  fi
}

# ============================================
# 启动 Nginx
# ============================================
cmd_start_nginx() {
  echo -e "${GREEN}检查并启动 Nginx...${NC}"
  
  ssh $SSH_OPTIONS -t -p ${SERVER_PORT} ${SSH_TARGET} << 'ENDSSH'
set -e

# 查找 nginx 命令路径
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

# 检查 Nginx 是否安装
if [ -z "$NGINX_CMD" ]; then
  echo -e "\033[0;31m✗ Nginx 未安装或未找到\033[0m"
  echo ""
  echo "安装 Nginx:"
  if [ -f /etc/redhat-release ]; then
    echo "  yum install -y nginx"
  elif [ -f /etc/debian_version ]; then
    echo "  apt-get install -y nginx"
  fi
  exit 1
fi

NGINX_VERSION=$($NGINX_CMD -v 2>&1)
echo -e "\033[0;32m✓ Nginx 已安装: $NGINX_VERSION\033[0m"

# 检查配置语法
echo ""
echo "检查 Nginx 配置语法..."
if $NGINX_CMD -t 2>&1; then
  echo -e "\033[0;32m✓ Nginx 配置语法正确\033[0m"
else
  echo -e "\033[0;31m✗ Nginx 配置语法错误\033[0m"
  echo ""
  echo "详细错误信息:"
  $NGINX_CMD -t 2>&1 || true
  echo ""
  echo "请修复配置错误后重试"
  echo "配置文件位置:"
  echo "  /etc/nginx/nginx.conf"
  echo "  /etc/nginx/conf.d/*.conf"
  exit 1
fi

# 检查端口占用
echo ""
echo "检查端口占用..."
# 从 Nginx 配置中提取端口号
CONFIG_PORTS=$(grep -h "listen" /etc/nginx/nginx.conf /etc/nginx/conf.d/*.conf 2>/dev/null | grep -oE "[0-9]+" | sort -u || echo "")
if [ -z "$CONFIG_PORTS" ]; then
  CONFIG_PORTS="80 443"
fi

for PORT in $CONFIG_PORTS; do
  PORT_IN_USE=false
  PID=""
  
  # 检查端口是否被占用
  if command -v lsof &> /dev/null; then
    if lsof -ti:$PORT > /dev/null 2>&1; then
      PORT_IN_USE=true
      PID=$(lsof -ti:$PORT 2>/dev/null | head -1)
    fi
  elif command -v netstat &> /dev/null; then
    if netstat -tlnp 2>/dev/null | grep ":$PORT " > /dev/null; then
      PORT_IN_USE=true
      PID=$(netstat -tlnp 2>/dev/null | grep ":$PORT " | awk '{print $7}' | cut -d'/' -f1 | head -1)
    fi
  elif command -v ss &> /dev/null; then
    if ss -tlnp 2>/dev/null | grep ":$PORT " > /dev/null; then
      PORT_IN_USE=true
      PID=$(ss -tlnp 2>/dev/null | grep ":$PORT " | sed 's/.*pid=\([0-9]*\).*/\1/' | head -1)
    fi
  fi
  
  if [ "$PORT_IN_USE" = "true" ]; then
    PROCESS=$(ps -p $PID -o comm= 2>/dev/null || echo "unknown")
    echo -e "\033[0;33m⚠ 端口 $PORT 被进程占用 (PID: $PID, 进程: $PROCESS)\033[0m"
    
    # 如果是 80 端口，尝试停止常见的占用进程
    if [ "$PORT" = "80" ]; then
      echo "尝试停止可能占用 80 端口的服务..."
      
      # 尝试停止 Apache
      if systemctl is-active --quiet httpd 2>/dev/null || systemctl is-active --quiet apache2 2>/dev/null; then
        echo "停止 Apache..."
        systemctl stop httpd 2>/dev/null || systemctl stop apache2 2>/dev/null || true
        sleep 2
      fi
      
      # 再次检查端口
      if command -v lsof &> /dev/null; then
        if lsof -ti:$PORT > /dev/null 2>&1; then
          echo -e "\033[0;33m⚠ 端口 $PORT 仍被占用\033[0m"
          echo "运行 ./book-excerpt.sh fix-port 来检查和修复端口占用问题"
          exit 1
        fi
      fi
    else
      echo -e "\033[0;31m✗ 端口 $PORT 被占用，无法启动 Nginx\033[0m"
      echo "运行 ./book-excerpt.sh fix-port $PORT 来检查和修复端口占用问题"
      exit 1
    fi
  else
    echo -e "\033[0;32m✓ 端口 $PORT 未被占用\033[0m"
  fi
done

# 检查 Nginx 是否运行
echo ""
if systemctl is-active --quiet nginx 2>/dev/null || service nginx status &>/dev/null; then
  echo -e "\033[0;32m✓ Nginx 已在运行\033[0m"
  systemctl status nginx --no-pager -l 2>/dev/null | head -10 || service nginx status 2>/dev/null | head -10
else
  echo -e "\033[0;33m⚠ Nginx 未运行，正在启动...\033[0m"
  
  # 尝试启动
  if systemctl start nginx 2>/dev/null || service nginx start 2>/dev/null; then
    sleep 2
    
    # 再次检查
    if systemctl is-active --quiet nginx 2>/dev/null || service nginx status &>/dev/null; then
      echo -e "\033[0;32m✓ Nginx 已成功启动\033[0m"
      systemctl status nginx --no-pager -l 2>/dev/null | head -10 || service nginx status 2>/dev/null | head -10
    else
      echo -e "\033[0;31m✗ Nginx 启动失败\033[0m"
      echo ""
      echo "查看错误日志:"
      journalctl -u nginx -n 20 --no-pager 2>/dev/null || tail -20 /var/log/nginx/error.log 2>/dev/null || echo "无法读取日志"
      exit 1
    fi
  else
    echo -e "\033[0;31m✗ 无法启动 Nginx\033[0m"
    echo ""
    echo "请手动检查:"
    echo "  systemctl status nginx"
    echo "  journalctl -u nginx -n 50"
    exit 1
  fi
fi

# 检查端口监听
echo ""
echo "检查端口监听..."
if netstat -tlnp 2>/dev/null | grep -E 'nginx.*:(80|443)' > /dev/null || \
   ss -tlnp 2>/dev/null | grep -E 'nginx.*:(80|443)' > /dev/null; then
  echo -e "\033[0;32m✓ Nginx 端口正在监听\033[0m"
  netstat -tlnp 2>/dev/null | grep -E 'nginx.*:(80|443)' || \
  ss -tlnp 2>/dev/null | grep -E 'nginx.*:(80|443)'
else
  echo -e "\033[0;33m⚠ 未检测到 Nginx 端口监听\033[0m"
fi

# 设置开机自启
echo ""
echo "设置开机自启..."
if systemctl enable nginx 2>/dev/null || chkconfig nginx on 2>/dev/null; then
  echo -e "\033[0;32m✓ Nginx 已设置为开机自启\033[0m"
else
  echo -e "\033[0;33m⚠ 无法设置开机自启（可能需要手动设置）\033[0m"
fi

echo ""
echo "=========================================="
echo "Nginx 启动完成"
echo "=========================================="
ENDSSH

  echo ""
  echo -e "${GREEN}Nginx 启动完成！${NC}"
  echo -e "${YELLOW}测试访问:${NC}"
  echo -e "  ${GREEN}curl http://${SERVER_HOST}${NC}"
}

# ============================================
# 修复端口占用
# ============================================
cmd_fix_port() {
  # 要检查的端口（默认 80 和 443）
  PORTS="${1:-80 443}"

  echo -e "${GREEN}检查并修复端口占用问题...${NC}"

  ssh $SSH_OPTIONS -t -p ${SERVER_PORT} ${SSH_TARGET} << ENDSSH
set -e

echo "=========================================="
echo "检查端口占用情况"
echo "=========================================="

for PORT in ${PORTS}; do
  echo ""
  echo "检查端口 \${PORT}..."
  
  # 查找占用端口的进程
  PID=""
  PROCESS=""
  
  if command -v lsof &> /dev/null; then
    PID=\$(lsof -ti:\${PORT} 2>/dev/null || true)
    if [ ! -z "\$PID" ]; then
      PROCESS=\$(ps -p \$PID -o comm= 2>/dev/null || echo "unknown")
      echo -e "\033[0;33m⚠ 端口 \${PORT} 被进程占用\033[0m"
      echo "  PID: \$PID"
      echo "  进程: \$PROCESS"
      echo "  详细信息:"
      ps -fp \$PID 2>/dev/null || echo "无法获取进程信息"
    else
      echo -e "\033[0;32m✓ 端口 \${PORT} 未被占用\033[0m"
    fi
  elif command -v netstat &> /dev/null; then
    PID=\$(netstat -tlnp 2>/dev/null | grep ":\${PORT} " | awk '{print \$7}' | cut -d'/' -f1 | head -1)
    if [ ! -z "\$PID" ]; then
      PROCESS=\$(ps -p \$PID -o comm= 2>/dev/null || echo "unknown")
      echo -e "\033[0;33m⚠ 端口 \${PORT} 被进程占用\033[0m"
      echo "  PID: \$PID"
      echo "  进程: \$PROCESS"
    else
      echo -e "\033[0;32m✓ 端口 \${PORT} 未被占用\033[0m"
    fi
  elif command -v ss &> /dev/null; then
    PID=\$(ss -tlnp 2>/dev/null | grep ":\${PORT} " | sed 's/.*pid=\([0-9]*\).*/\1/' | head -1)
    if [ ! -z "\$PID" ]; then
      PROCESS=\$(ps -p \$PID -o comm= 2>/dev/null || echo "unknown")
      echo -e "\033[0;33m⚠ 端口 \${PORT} 被进程占用\033[0m"
      echo "  PID: \$PID"
      echo "  进程: \$PROCESS"
    else
      echo -e "\033[0;32m✓ 端口 \${PORT} 未被占用\033[0m"
    fi
  else
    echo -e "\033[0;33m⚠ 无法检查端口占用（未安装 lsof/netstat/ss）\033[0m"
  fi
  
  # 如果是 80 端口被占用，提供解决方案
  if [ "\${PORT}" = "80" ] && [ ! -z "\$PID" ]; then
    echo ""
    echo "=========================================="
    echo "端口 80 被占用，提供解决方案："
    echo "=========================================="
    echo ""
    echo "选项 1: 停止占用端口的进程（如果不需要）"
    echo "  kill -9 \$PID"
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
    echo "选项 4: 使用非标准端口（8080）"
    echo "  修改 Nginx 配置，使用 8080 端口"
    echo ""
    read -p "是否要停止占用端口 \${PORT} 的进程？(y/N): " -n 1 -r
    echo
    if [[ \$REPLY =~ ^[Yy]\$ ]]; then
      echo "停止进程 \$PID..."
      if kill -9 \$PID 2>/dev/null; then
        echo -e "\033[0;32m✓ 进程已停止\033[0m"
        sleep 2
        # 再次检查
        if lsof -ti:\${PORT} > /dev/null 2>&1 || netstat -tlnp 2>/dev/null | grep ":\${PORT} " > /dev/null; then
          echo -e "\033[0;33m⚠ 端口仍被占用，可能需要强制清理\033[0m"
        else
          echo -e "\033[0;32m✓ 端口 \${PORT} 已释放\033[0m"
        fi
      else
        echo -e "\033[0;31m✗ 无法停止进程，可能需要 root 权限\033[0m"
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
  echo -e "${GREEN}端口检查完成！${NC}"
  echo ""
  echo -e "${YELLOW}如果端口已释放，可以启动 Nginx:${NC}"
  echo -e "  ${BLUE}./book-excerpt.sh start-nginx${NC}"
}

# ============================================
# 检查状态
# ============================================
cmd_check() {
  echo -e "${BLUE}检查前端应用部署状态...${NC}"

  ssh $SSH_OPTIONS -t -p ${SERVER_PORT} ${SSH_TARGET} << 'ENDSSH'
echo "=========================================="
echo "1. 检查部署目录"
echo "=========================================="
if [ -d "/var/www/html/book-excerpt-generator" ]; then
  echo -e "\033[0;32m✓ 部署目录存在\033[0m"
  echo "目录大小: $(du -sh /var/www/html/book-excerpt-generator 2>/dev/null | cut -f1)"
  echo ""
  echo "文件列表:"
  ls -lah /var/www/html/book-excerpt-generator | head -15
else
  echo -e "\033[0;31m✗ 部署目录不存在\033[0m"
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
    echo -e "\033[0;32m✓ $file 存在 (${size} bytes)\033[0m"
  else
    echo -e "\033[0;31m✗ $file 不存在\033[0m"
  fi
done

echo ""
echo "=========================================="
echo "3. 检查 JavaScript 文件"
echo "=========================================="
if [ -d "js" ]; then
  js_count=$(find js -type f -name "*.js" 2>/dev/null | wc -l)
  echo -e "\033[0;32m✓ js/ 目录存在，包含 $js_count 个 JavaScript 文件\033[0m"
  echo ""
  echo "JavaScript 文件列表:"
  find js -type f -name "*.js" 2>/dev/null | head -10
else
  echo -e "\033[0;31m✗ js/ 目录不存在\033[0m"
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
  echo -e "\033[0;32m✓ Nginx 已安装\033[0m"
  if systemctl is-active --quiet nginx 2>/dev/null || service nginx status &>/dev/null; then
    echo -e "\033[0;32m✓ Nginx 正在运行\033[0m"
  else
    echo -e "\033[0;33m⚠ Nginx 未运行\033[0m"
    echo ""
    echo "启动 Nginx:"
    echo "  方法1: 运行 ./book-excerpt.sh start-nginx"
    echo "  方法2: ssh ${SERVER_USER}@${SERVER_HOST} 'systemctl start nginx'"
  fi
elif [ -f "/etc/nginx/nginx.conf" ]; then
  echo -e "\033[0;33m⚠ Nginx 配置文件存在但命令不可用\033[0m"
else
  echo -e "\033[0;33m⚠ Nginx 未安装\033[0m"
  echo ""
  echo "安装 Nginx:"
  echo "  CentOS/RHEL: yum install -y nginx"
  echo "  Ubuntu/Debian: apt-get install -y nginx"
fi

# 检查 Apache
if command -v apache2 &> /dev/null || command -v httpd &> /dev/null; then
  echo -e "\033[0;32m✓ Apache 已安装\033[0m"
  if systemctl is-active --quiet apache2 2>/dev/null || systemctl is-active --quiet httpd 2>/dev/null || service apache2 status &>/dev/null || service httpd status &>/dev/null; then
    echo -e "\033[0;32m✓ Apache 正在运行\033[0m"
  else
    echo -e "\033[0;33m⚠ Apache 未运行\033[0m"
  fi
fi

echo ""
echo "=========================================="
echo "6. 检查端口监听"
echo "=========================================="
if netstat -tlnp 2>/dev/null | grep -E ':(80|443)' > /dev/null || ss -tlnp 2>/dev/null | grep -E ':(80|443)' > /dev/null; then
  echo -e "\033[0;32m✓ Web 服务器端口正在监听\033[0m"
  netstat -tlnp 2>/dev/null | grep -E ':(80|443)' || ss -tlnp 2>/dev/null | grep -E ':(80|443)'
else
  echo -e "\033[0;31m✗ 未检测到 Web 服务器端口监听（80 或 443）\033[0m"
fi

echo ""
echo "=========================================="
echo "7. 测试 HTTP 访问"
echo "=========================================="
cd /var/www/html/book-excerpt-generator 2>/dev/null || echo "无法进入部署目录"

# 测试本地访问
if curl -s -o /dev/null -w "%{http_code}" http://localhost/ 2>/dev/null | grep -q "200\|301\|302"; then
  echo -e "\033[0;32m✓ 本地 HTTP 访问成功\033[0m"
  curl -s http://localhost/ | head -5
elif curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1/ 2>/dev/null | grep -q "200\|301\|302"; then
  echo -e "\033[0;32m✓ 本地 HTTP 访问成功\033[0m"
else
  echo -e "\033[0;33m⚠ 本地 HTTP 访问失败（可能需要配置 Web 服务器）\033[0m"
fi

echo ""
echo "=========================================="
echo "8. 检查 Nginx 配置结构"
echo "=========================================="
if [ -f "/etc/nginx/nginx.conf" ]; then
  echo -e "\033[0;32m✓ 主配置文件存在: /etc/nginx/nginx.conf\033[0m"
  
  # 检查是否包含 conf.d
  if grep -q "include.*conf.d" /etc/nginx/nginx.conf; then
    echo -e "\033[0;32m✓ 主配置文件包含 conf.d 目录\033[0m"
  else
    echo -e "\033[0;33m⚠ 主配置文件未包含 conf.d 目录\033[0m"
    echo "需要在 /etc/nginx/nginx.conf 的 http {} 块内添加:"
    echo "  include /etc/nginx/conf.d/*.conf;"
  fi
  
  # 检查 conf.d 目录
  if [ -d "/etc/nginx/conf.d" ]; then
    echo -e "\033[0;32m✓ conf.d 目录存在\033[0m"
    echo "配置文件列表:"
    ls -lah /etc/nginx/conf.d/*.conf 2>/dev/null || echo "  无配置文件"
  else
    echo -e "\033[0;33m⚠ conf.d 目录不存在\033[0m"
  fi
  
  # 检查我们的配置文件
  if [ -f "/etc/nginx/conf.d/book-excerpt-generator.conf" ]; then
    echo -e "\033[0;32m✓ 应用配置文件存在\033[0m"
    echo ""
    echo "配置文件内容（前20行）:"
    head -20 /etc/nginx/conf.d/book-excerpt-generator.conf
  else
    echo -e "\033[0;33m⚠ 应用配置文件不存在\033[0m"
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
      echo -e "\033[0;32m✓ Nginx 配置语法正确\033[0m"
    else
      echo -e "\033[0;31m✗ Nginx 配置语法错误\033[0m"
    fi
  else
    echo -e "\033[0;33m⚠ Nginx 未安装或未找到\033[0m"
  fi
else
  echo -e "\033[0;33m⚠ Nginx 主配置文件不存在\033[0m"
fi

echo ""
echo "=========================================="
echo "检查完成"
echo "=========================================="
ENDSSH

  echo ""
  echo -e "${GREEN}状态检查完成！${NC}"
  echo ""
  echo -e "${YELLOW}访问地址:${NC}"
  echo -e "  ${GREEN}http://${SERVER_HOST}${NC}"
  echo -e "  ${GREEN}https://${SERVER_HOST}${NC}"
  echo ""
  echo -e "${YELLOW}如果无法访问，请检查:${NC}"
  echo -e "  1. Web 服务器（Nginx/Apache）是否运行"
  echo -e "  2. Web 服务器配置是否正确"
  echo -e "  3. 防火墙是否开放端口"
  echo -e "  4. 文件权限是否正确"
}

# ============================================
# 主函数
# ============================================
main() {
  # 显示欢迎界面
  show_welcome

  # 解析命令
  COMMAND="${1:-help}"

  case "$COMMAND" in
    deploy)
      cmd_deploy
      ;;
    update-nginx)
      cmd_update_nginx "$2"
      ;;
    start-nginx)
      cmd_start_nginx
      ;;
    fix-port)
      cmd_fix_port "$2"
      ;;
    check)
      cmd_check
      ;;
    help|--help|-h)
      show_help
      ;;
    *)
      echo -e "${RED}错误: 未知命令 '$COMMAND'${NC}"
      echo ""
      show_help
      exit 1
      ;;
  esac
}

# 执行主函数
main "$@"
