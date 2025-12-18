#!/bin/bash

# ============================================
# Book Excerpt Generator - 统一管理脚本 (v2.1)
# ============================================
# 整合前端 (app) 和后端 (server) 的所有管理功能
# ============================================

set -euo pipefail

# 获取脚本所在目录
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR_LOCAL="$PROJECT_ROOT/app"
SERVER_DIR_LOCAL="$PROJECT_ROOT/server"
LIB_DIR="$PROJECT_ROOT/scripts"

# ============================================
# 颜色输出定义
# ============================================
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly RED='\033[0;31m'
readonly BLUE='\033[0;34m'
readonly CYAN='\033[0;36m'
readonly NC='\033[0m' # No Color

# ============================================
# 工具函数
# ============================================

print_success() { echo -e "${GREEN}✓ $1${NC}" >&2; }
print_error() { echo -e "${RED}✗ $1${NC}" >&2; }
print_warning() { echo -e "${YELLOW}⚠ $1${NC}" >&2; }
print_info() { echo -e "${CYAN}ℹ $1${NC}" >&2; }
print_debug() { [ "${DEBUG:-false}" = "true" ] && echo -e "${BLUE}🐛 $1${NC}" >&2 || true; }

# 安全退出函数（清理资源）
safe_exit() {
    local exit_code="${1:-0}"
    if [ -n "${CLEANUP_FILES:-}" ]; then
        for file in $CLEANUP_FILES; do
            if [ -f "$file" ] || [ -d "$file" ]; then
                rm -rf "$file" 2>/dev/null || true
                [ "${DEBUG:-false}" = "true" ] && echo "已清理临时文件: $file" >&2 || true
            fi
        done
    fi
    exit "$exit_code"
}

# 注册清理函数（用于 trap）
register_cleanup() {
    local file="$1"
    CLEANUP_FILES="${CLEANUP_FILES:-} $file"
}

# 检查命令是否存在
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# ============================================
# 配置变量
# ============================================

# 服务器配置
export SERVER_HOST="${SERVER_HOST:-8.138.183.116}"
export SERVER_USER="${SERVER_USER:-root}"
export SERVER_PORT="${SERVER_PORT:-22}"

# 前端 (App) 配置
APP_REMOTE_DIR="/var/www/html/book-excerpt-generator"
APP_NGINX_CONF="/etc/nginx/conf.d/book-excerpt-generator.conf"
APP_DOCKER_IMAGE="book-excerpt-generator"
APP_DOCKER_CONTAINER="book-excerpt-generator"

# 后端 (Server) 配置
SERVER_REMOTE_DIR="/opt/book-excerpt-generator-server"
SERVER_PORT_API="3001"
SERVER_NGINX_CONF="/etc/nginx/conf.d/book-excerpt-generator-server.conf"
SERVER_DOCKER_IMAGE="book-excerpt-generator-server"
SERVER_DOCKER_CONTAINER="book-excerpt-generator-server"

# 通用配置
SSL_CERT_BASE_DIR="/etc/nginx/ssl"

# ============================================
# 工具函数加载
# ============================================

if [ -f "$LIB_DIR/ssh-utils.sh" ]; then
    source "$LIB_DIR/ssh-utils.sh"
    source "$LIB_DIR/nginx-utils.sh"
else
    echo "Error: utility scripts not found at $LIB_DIR"
    exit 1
fi

# 初始化 SSH 连接
init_ssh_connection

# 设置清理 trap
trap 'safe_exit $?' EXIT INT TERM

# ============================================
# 欢迎界面与帮助
# ============================================

show_welcome() {
    local module="${1:-}"
    local cmd="${2:-}"
    echo -e "${CYAN}"
    echo " ________  __        _     ___           _________               __       "
    echo "|  __   _|[  |      (_)  .' ..]         |  _   _  |             [  |      "
    echo "|_/  / /   | |--.   __  _| |_  __   _   |_/ | | \_|.---.  .---.  | |--.   "
    echo "   .'.' _  | .-. | [  |'-| |-'[  | | |      | |   / /__\\\\/ /'\`\\] | .-. |  "
    echo " _/ /__/ | | | | |  | |  | |   | \_/ |,    _| |_  | \__.,| \__.  | | | |  "
    echo "|________|[___]|__][___][___]  '.__.'_/   |_____|  '.__.''.___.'[___]|__] "
    echo "                                                                          "
    echo -e "${NC}"
    echo -e "${YELLOW}模块: ${module:-ALL} | 命令: ${cmd:-help}${NC}"
    echo ""
}

show_help() {
    echo -e "${CYAN}用法: ./run.sh [module] [command] [options]${NC}"
    echo ""
    echo -e "${YELLOW}全局命令:${NC}"
    echo "  update-ssh-key    更新 SSH 公钥到服务器"
    echo ""
    echo -e "${YELLOW}前端应用 (app) 命令:${NC}"
    echo "  app docker-deploy 使用 Docker 部署前端"
    echo "  app update-nginx  更新前端 Nginx 配置"
    echo "  app start-nginx   启动前端 Nginx"
    echo "  app restart-nginx 重启前端 Nginx"
    echo "  app check         检查前端状态"
    echo "  app dev           本地开发模式运行 (非 Docker)"
    echo "  app docker-dev    本地 Docker 容器运行"
    echo ""
    echo -e "${YELLOW}后端服务 (server) 命令:${NC}"
    echo "  server deploy        使用 PM2 部署后端"
    echo "  server docker-deploy 使用 Docker 部署后端"
    echo "  server restart       重启后端服务"
    echo "  server status        检查后端状态"
    echo "  server logs [lines]  查看后端日志"
    echo "  server sync-data     同步数据 (up/down)"
    echo "  server update-nginx  更新后端 Nginx 配置"
    echo "  server dev           本地开发模式运行 (非 Docker)"
    echo "  server docker-dev    本地 Docker 容器运行"
    echo ""
}

# ============================================
# 通用功能实现
# ============================================

cmd_update_ssh_key() {
    print_info "更新 SSH 公钥到服务器 ${SERVER_HOST}..."
    update_ssh_key_to_server && print_success "SSH 密钥已更新"
}

# ============================================
# App (前端) 功能实现
# ============================================

app_update_nginx() {
    local conf="${1:-$APP_DIR_LOCAL/scripts/nginx.conf}"
    local cert_dir="$APP_DIR_LOCAL/scripts/book-excerpt.zhifu.tech_nginx"
    print_info "更新前端 Nginx 配置..."
    update_nginx_config "$conf" "$APP_NGINX_CONF" "$SSH_OPTIONS" "$SERVER_PORT" "$SSH_TARGET" "ssh_exec" "book-excerpt.zhifu.tech" "$cert_dir" "$SSL_CERT_BASE_DIR"
}

app_docker_deploy() {
    print_info "开始前端 Docker 部署..."
    cd "$APP_DIR_LOCAL"
    
    # 1. 构建镜像
    docker build --platform linux/amd64 -t "$APP_DOCKER_IMAGE:latest" .
    
    # 2. 导出并上传
    local tmp_tar
    tmp_tar=$(mktemp).tar.gz
    register_cleanup "$tmp_tar"
    docker save "$APP_DOCKER_IMAGE:latest" | gzip > "$tmp_tar"
    scp $SSH_OPTIONS -P "$SERVER_PORT" "$tmp_tar" "$SSH_TARGET:/tmp/app.tar.gz"
    
    # 3. 服务器运行
    ssh_exec << ENDSSH
docker load < /tmp/app.tar.gz
docker stop $APP_DOCKER_CONTAINER 2>/dev/null || true
docker rm $APP_DOCKER_CONTAINER 2>/dev/null || true
docker run -d --name $APP_DOCKER_CONTAINER --restart unless-stopped -p 127.0.0.1:8081:80 $APP_DOCKER_IMAGE:latest
rm -f /tmp/app.tar.gz
ENDSSH
    
    # 4. 更新 Nginx
    app_update_nginx "$APP_DIR_LOCAL/scripts/book-excerpt.nginx.docker.conf"
    print_success "前端部署完成"
}

app_check() {
    print_info "检查前端状态..."
    ssh_exec << ENDSSH
echo "--- 目录检查 ---"
ls -ld $APP_REMOTE_DIR || echo "目录不存在"
echo "--- Nginx 配置 ---"
cat $APP_NGINX_CONF | grep "server_name" || echo "配置不存在"
echo "--- Docker 容器 ---"
docker ps | grep $APP_DOCKER_CONTAINER || echo "容器未运行"
ENDSSH
}

app_dev() {
    print_info "启动前端本地开发服务器 (非 Docker)..."
    cd "$APP_DIR_LOCAL"
    if command_exists npx; then
        npx serve . -l 8081
    elif command_exists python3; then
        python3 -m http.server 8081
    else
        print_error "未找到 npx 或 python3，请手动运行本地服务器"
    fi
}

app_docker_dev() {
    print_info "启动前端本地 Docker 容器..."
    cd "$APP_DIR_LOCAL"
    docker-compose up
}

# ============================================
# Server (后端) 功能实现
# ============================================

server_update_nginx() {
    local conf="${1:-$SERVER_DIR_LOCAL/scripts/nginx.conf}"
    local cert_dir="$SERVER_DIR_LOCAL/scripts/api.book-excerpt.zhifu.tech_nginx"
    print_info "更新后端 Nginx 配置..."
    update_nginx_config "$conf" "$SERVER_NGINX_CONF" "$SSH_OPTIONS" "$SERVER_PORT" "$SSH_TARGET" "ssh_exec" "api.book-excerpt.zhifu.tech" "$cert_dir" "$SSL_CERT_BASE_DIR"
}

server_deploy_pm2() {
    print_info "开始后端 PM2 部署..."
    local tmp_dir
    tmp_dir=$(mktemp -d)
    register_cleanup "$tmp_dir"
    
    cp -r "$SERVER_DIR_LOCAL/server.js" "$SERVER_DIR_LOCAL/package.json" "$SERVER_DIR_LOCAL/src" "$SERVER_DIR_LOCAL/ecosystem.config.cjs" "$tmp_dir/"
    
    ssh_exec "mkdir -p $SERVER_REMOTE_DIR"
    scp $SSH_OPTIONS -r -P "$SERVER_PORT" "$tmp_dir"/* "$SSH_TARGET:$SERVER_REMOTE_DIR/"
    
    ssh_exec << ENDSSH
cd $SERVER_REMOTE_DIR
npm install --production
pm2 delete $SERVER_DOCKER_CONTAINER 2>/dev/null || true
pm2 start ecosystem.config.cjs
pm2 save
ENDSSH
    
    server_update_nginx
    print_success "后端部署完成"
}

server_docker_deploy() {
    print_info "开始后端 Docker 部署..."
    cd "$SERVER_DIR_LOCAL"
    docker build --platform linux/amd64 -t "$SERVER_DOCKER_IMAGE:latest" .
    local tmp_tar
    tmp_tar=$(mktemp).tar.gz
    register_cleanup "$tmp_tar"
    docker save "$SERVER_DOCKER_IMAGE:latest" | gzip > "$tmp_tar"
    scp $SSH_OPTIONS -P "$SERVER_PORT" "$tmp_tar" "$SSH_TARGET:/tmp/server.tar.gz"
    
    ssh_exec << ENDSSH
docker load < /tmp/server.tar.gz
docker stop $SERVER_DOCKER_CONTAINER 2>/dev/null || true
docker rm $SERVER_DOCKER_CONTAINER 2>/dev/null || true
docker run -d --name $SERVER_DOCKER_CONTAINER --restart unless-stopped -p 127.0.0.1:3001:3001 $SERVER_DOCKER_IMAGE:latest
rm -f /tmp/server.tar.gz
ENDSSH
    print_success "后端 Docker 部署完成"
}

server_status() {
    print_info "检查后端状态..."
    ssh_exec << ENDSSH
echo "--- PM2 状态 ---"
pm2 status $SERVER_DOCKER_CONTAINER 2>/dev/null || echo "PM2 未运行该应用"
echo "--- 端口监听 ---"
netstat -tlnp | grep $SERVER_PORT_API || echo "端口未监听"
echo "--- 健康检查 ---"
curl -s http://localhost:$SERVER_PORT_API/health || echo "无法访问健康检查接口"
ENDSSH
}

server_logs() {
    local lines="${1:-50}"
    ssh_exec "pm2 logs $SERVER_DOCKER_CONTAINER --lines $lines --nostream"
}

server_sync_data() {
    local direction="${1:-up}"
    if [ "$direction" == "up" ]; then
        print_info "上传本地数据到服务器..."
        scp $SSH_OPTIONS -r -P "$SERVER_PORT" "$SERVER_DIR_LOCAL/data"/* "$SSH_TARGET:$SERVER_REMOTE_DIR/data/"
    else
        print_info "从服务器下载数据..."
        mkdir -p "$SERVER_DIR_LOCAL/data"
        scp $SSH_OPTIONS -r -P "$SERVER_PORT" "$SSH_TARGET:$SERVER_REMOTE_DIR/data/*" "$SERVER_DIR_LOCAL/data/"
    fi
}

server_dev() {
    print_info "启动后端本地开发模式 (非 Docker)..."
    cd "$SERVER_DIR_LOCAL"
    npm run dev
}

server_docker_dev() {
    print_info "启动后端本地 Docker 容器..."
    cd "$SERVER_DIR_LOCAL"
    docker-compose up
}

# ============================================
# 主逻辑入口
# ============================================

MODULE="${1:-help}"
shift || true

show_welcome "$MODULE" "${1:-}"

case "$MODULE" in
    update-ssh-key) cmd_update_ssh_key ;;
    
    app)
        COMMAND="${1:-help}"
        shift || true
        case "$COMMAND" in
            docker-deploy) app_docker_deploy ;;
            update-nginx)  app_update_nginx "${1:-}" ;;
            start-nginx)   start_nginx_service "ssh_exec" "$SSH_TARGET" ;;
            restart-nginx) ssh_exec "systemctl restart nginx || service nginx restart" ;;
            check)         app_check ;;
            dev)           app_dev ;;
            docker-dev)    app_docker_dev ;;
            *)             show_help ;;
        esac
        ;;
        
    server)
        COMMAND="${1:-help}"
        shift || true
        case "$COMMAND" in
            deploy)        server_deploy_pm2 ;;
            docker-deploy) server_docker_deploy ;;
            restart)       ssh_exec "pm2 restart $SERVER_DOCKER_CONTAINER" ;;
            status)        server_status ;;
            logs)          server_logs "${1:-}" ;;
            sync-data)     server_sync_data "${1:-up}" ;;
            update-nginx)  server_update_nginx "${1:-}" ;;
            dev)           server_dev ;;
            docker-dev)    server_docker_dev ;;
            *)             show_help ;;
        esac
        ;;
        
    help|--help|-h) show_help ;;
    *)
        print_error "未知模块 '$MODULE'"
        show_help
        exit 1
        ;;
esac
