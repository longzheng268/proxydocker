# 🐳 ProxyDocker - Docker Hub 反向代理

![License](https://img.shields.io/github/license/longzheng268/proxydocker)
![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-orange)
![GitHub Stars](https://img.shields.io/github/stars/longzheng268/proxydocker)

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/longzheng268/proxydocker)

一个功能完整的 Docker Hub 反向代理服务，支持多种部署方式（Cloudflare Workers、Docker、Node.js）。提供镜像拉取、网页浏览和搜索功能，**客户端无需安装任何额外软件**，只需配置 Docker 镜像源即可使用。

## ✨ 特性

- 🚀 **多种部署方式** - 支持 Cloudflare Workers、Docker、Node.js 直接部署
- 🔄 **完整代理功能** - 支持 Docker 镜像拉取、推送等所有操作
- 🌐 **精美网页界面** - 现代化搜索界面，支持浏览和搜索 Docker 镜像
- 📱 **响应式设计** - 完美适配桌面端和移动设备
- ✨ **动画效果** - 流畅的动画和鼠标追踪效果
- 🛡️ **模块化设计** - UI 模块与核心代理隔离，即使 UI 出错也不影响镜像拉取
- 🌍 **多仓库支持** - 支持 Docker Hub, GCR, Quay.io 等多个镜像仓库
- 💰 **灵活选择** - Cloudflare Workers 免费版或自有服务器部署
- 🔌 **零客户端依赖** - 客户端无需安装任何软件，仅需配置 Docker

## 📋 目录

- [快速开始](#-快速开始)
- [完整部署指南](README_DEPLOYMENT.md) - **包含 Docker、Node.js、systemd 等所有部署方式**
- [客户端配置](#-客户端配置)
- [使用说明](#-使用说明)
- [高级配置](#-高级配置)
- [技术架构](#-技术架构)
- [故障排除](#-故障排除)
- [常见问题](#-常见问题)

## 🚀 快速开始

### 选择部署方式

| 部署方式 | 适合场景 | 难度 | 费用 |
|---------|---------|------|------|
| **Cloudflare Workers** | 个人使用，无需服务器 | ⭐ 简单 | 免费 |
| **Docker** | 有服务器，喜欢容器化 | ⭐⭐ 中等 | 服务器成本 |
| **Node.js** | 有服务器，需要定制 | ⭐⭐ 中等 | 服务器成本 |

### 方式一：Cloudflare Workers（推荐新手）

**一键部署：**

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/longzheng268/proxydocker)

或使用 Wrangler CLI：

```bash
# 安装 Wrangler
npm install -g wrangler

# 登录 Cloudflare
wrangler login

# 克隆并部署
git clone https://github.com/longzheng268/proxydocker.git
cd proxydocker
wrangler deploy
```

### 方式二：Docker 快速部署

```bash
# 使用 Docker Compose
git clone https://github.com/longzheng268/proxydocker.git
cd proxydocker
docker-compose up -d

# 查看日志
docker-compose logs -f
```

### 方式三：Node.js 一键安装

```bash
# Linux 自动安装脚本
curl -fsSL https://raw.githubusercontent.com/longzheng268/proxydocker/main/install.sh | sudo bash
```

### 📚 更多部署选项

查看 **[完整部署指南](README_DEPLOYMENT.md)** 了解：
- systemd 服务配置
- PM2 进程管理
- Nginx 反向代理
- 防火墙配置
- 性能优化
- 故障排除

### 方式四：手动部署（传统方式）

查看 [详细部署指南](#-详细部署指南)

---

## 📚 详细部署指南

### 部署方式 1: Cloudflare Workers（无需服务器）

#### 优点
- ✅ 完全免费（每天 10 万次请求）
- ✅ 全球 CDN 加速
- ✅ 无需维护服务器
- ✅ 自动扩展

#### 步骤 1: 安装 Node.js 和 Wrangler

```bash
# 检查 Node.js 是否已安装
node --version

# 如果未安装，访问 https://nodejs.org 下载安装

# 安装 Wrangler CLI
npm install -g wrangler

# 验证安装
wrangler --version
```

#### 步骤 2: 登录 Cloudflare

```bash
# 登录（会打开浏览器）
wrangler login

# 验证登录状态
wrangler whoami
```

#### 步骤 3: 克隆项目

```bash
# 克隆仓库
git clone https://github.com/longzheng268/proxydocker.git

# 进入目录
cd proxydocker

# 查看文件
ls -la
```

#### 步骤 4: 部署

```bash
# 部署到 Cloudflare Workers
wrangler deploy

# 部署成功后会显示 URL，例如：
# https://proxydocker.your-subdomain.workers.dev
```

#### 步骤 5: 测试

```bash
# 测试代理是否工作
curl https://proxydocker.your-subdomain.workers.dev/v2/

# 在浏览器中访问
# https://proxydocker.your-subdomain.workers.dev
```

---

### 部署方式 2: Docker 容器部署

#### 优点
- ✅ 环境隔离
- ✅ 易于管理
- ✅ 快速部署

#### 前置要求：安装 Docker

**Ubuntu/Debian:**
```bash
# 更新包索引
sudo apt-get update

# 安装依赖
sudo apt-get install -y ca-certificates curl gnupg lsb-release

# 添加 Docker 官方 GPG key
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# 设置仓库
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 安装 Docker Engine
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# 启动 Docker
sudo systemctl start docker
sudo systemctl enable docker

# 验证安装
sudo docker --version
sudo docker compose version
```

**CentOS/RHEL:**
```bash
# 安装依赖
sudo yum install -y yum-utils

# 添加 Docker 仓库
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo

# 安装 Docker
sudo yum install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# 启动 Docker
sudo systemctl start docker
sudo systemctl enable docker

# 验证安装
sudo docker --version
sudo docker compose version
```

#### 使用 Docker Compose（推荐）

```bash
# 1. 克隆项目
git clone https://github.com/longzheng268/proxydocker.git
cd proxydocker

# 2. 启动服务
sudo docker compose up -d

# 3. 查看容器状态
sudo docker compose ps

# 4. 查看日志
sudo docker compose logs -f

# 5. 测试服务
curl http://localhost:8080/v2/

# 6. 停止服务
sudo docker compose down

# 7. 重启服务
sudo docker compose restart

# 8. 查看资源使用
sudo docker stats proxydocker
```

#### 使用 Docker 命令

```bash
# 1. 克隆项目
git clone https://github.com/longzheng268/proxydocker.git
cd proxydocker

# 2. 构建镜像
sudo docker build -t proxydocker:latest .

# 3. 运行容器
sudo docker run -d \
  --name proxydocker \
  -p 8080:8080 \
  --restart unless-stopped \
  -e PORT=8080 \
  -e HOST=0.0.0.0 \
  -e NODE_ENV=production \
  proxydocker:latest

# 4. 查看容器状态
sudo docker ps | grep proxydocker

# 5. 查看日志
sudo docker logs -f proxydocker

# 6. 进入容器
sudo docker exec -it proxydocker sh

# 7. 停止容器
sudo docker stop proxydocker

# 8. 启动容器
sudo docker start proxydocker

# 9. 删除容器
sudo docker rm -f proxydocker

# 10. 删除镜像
sudo docker rmi proxydocker:latest
```

---

### 部署方式 3: Node.js 直接部署（无 Docker）

#### 优点
- ✅ 不依赖 Docker
- ✅ 性能最优
- ✅ 直接控制

#### 方法 A: 自动安装脚本（推荐）

**适用于：Ubuntu/Debian/CentOS**

```bash
# 下载并运行安装脚本
curl -fsSL https://raw.githubusercontent.com/longzheng268/proxydocker/main/install.sh -o install.sh

# 查看脚本内容（可选，建议查看）
cat install.sh

# 运行安装
sudo bash install.sh

# 脚本会自动完成：
# - 安装 Node.js（如果未安装）
# - 安装 Git（如果未安装）  
# - 克隆代码到 /opt/proxydocker
# - 安装依赖
# - 创建 systemd 服务
# - 启动服务
```

#### 方法 B: 手动安装（所有系统）

**步骤 1: 安装 Node.js**

**Ubuntu/Debian:**
```bash
# 方法1: 使用 NodeSource 仓库（推荐）
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 方法2: 使用系统包管理器
sudo apt-get update
sudo apt-get install -y nodejs npm

# 验证安装
node --version
npm --version
```

**CentOS/RHEL:**
```bash
# 使用 NodeSource 仓库
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# 验证安装
node --version
npm --version
```

**macOS:**
```bash
# 使用 Homebrew
brew install node

# 或下载安装包
# 访问 https://nodejs.org
```

**Windows:**
```powershell
# 下载安装包
# 访问 https://nodejs.org

# 或使用 Chocolatey
choco install nodejs

# 验证安装
node --version
npm --version
```

**步骤 2: 克隆项目**

```bash
# 选择安装目录（示例：/opt/proxydocker）
sudo mkdir -p /opt/proxydocker
cd /opt

# 克隆项目
sudo git clone https://github.com/longzheng268/proxydocker.git

# 设置权限（Linux）
sudo chown -R $USER:$USER /opt/proxydocker

# 进入目录
cd /opt/proxydocker

# 查看文件
ls -la
```

**步骤 3: 安装依赖**

```bash
# 安装生产依赖
npm install --production

# 或安装所有依赖（包括开发依赖）
npm install

# 验证依赖
npm list --depth=0
```

**步骤 4: 配置环境变量（可选）**

```bash
# 创建 .env 文件
cat > .env << 'EOF'
PORT=8080
HOST=0.0.0.0
NODE_ENV=production
# CUSTOM_URL=nginx
# REDIRECT_URL=https://example.com
# BLOCK_UA=bot,crawler
EOF

# 查看配置
cat .env
```

**步骤 5: 启动服务**

**临时运行（测试）:**
```bash
# 前台运行
npm start

# 或直接运行
node server.js

# 指定端口
PORT=8080 node server.js

# 按 Ctrl+C 停止
```

**后台运行（生产）:**
```bash
# 方法1: 使用 nohup
nohup npm start > proxydocker.log 2>&1 &

# 查看进程
ps aux | grep node

# 查看日志
tail -f proxydocker.log

# 停止服务
pkill -f "node server.js"
```

**步骤 6: 测试服务**

```bash
# 本地测试
curl http://localhost:8080/v2/

# 外部测试（替换为你的服务器IP）
curl http://your-server-ip:8080/v2/

# 浏览器访问
# http://your-server-ip:8080
```

---

### 部署方式 4: 使用 PM2（生产环境推荐）

#### 优点
- ✅ 进程守护
- ✅ 自动重启
- ✅ 负载均衡
- ✅ 日志管理

#### 完整步骤

**步骤 1: 安装 PM2**

```bash
# 全局安装 PM2
sudo npm install -g pm2

# 验证安装
pm2 --version

# 查看 PM2 位置
which pm2
```

**步骤 2: 启动应用**

```bash
# 进入项目目录
cd /opt/proxydocker

# 启动应用
pm2 start server.js --name proxydocker

# 启动多个实例（负载均衡）
pm2 start server.js --name proxydocker -i 2

# 启动所有CPU核心实例
pm2 start server.js --name proxydocker -i max

# 带环境变量启动
pm2 start server.js --name proxydocker --env production
```

**步骤 3: 管理应用**

```bash
# 查看所有进程
pm2 list

# 查看详细信息
pm2 show proxydocker

# 查看日志
pm2 logs proxydocker

# 实时日志
pm2 logs proxydocker --lines 100

# 清空日志
pm2 flush

# 重启应用
pm2 restart proxydocker

# 重载应用（0秒停机）
pm2 reload proxydocker

# 停止应用
pm2 stop proxydocker

# 删除应用
pm2 delete proxydocker

# 停止所有应用
pm2 stop all

# 重启所有应用
pm2 restart all
```

**步骤 4: 监控**

```bash
# 实时监控
pm2 monit

# Web 监控界面
pm2 web

# CPU 和内存使用
pm2 status
```

**步骤 5: 开机自启动**

```bash
# 生成启动脚本
pm2 startup

# 会输出一条命令，复制并执行，例如：
# sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u your-username --hp /home/your-username

# 保存当前进程列表
pm2 save

# 查看保存的配置
pm2 resurrect

# 取消开机自启
pm2 unstartup systemd
```

**步骤 6: 配置文件方式（高级）**

```bash
# 创建 PM2 配置文件
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'proxydocker',
    script: './server.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 8080,
      HOST: '0.0.0.0'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '500M',
    autorestart: true,
    watch: false
  }]
}
EOF

# 使用配置文件启动
pm2 start ecosystem.config.js

# 重载配置
pm2 reload ecosystem.config.js
```

---

### 部署方式 5: 使用 systemd（Linux 系统服务）

#### 优点
- ✅ 系统级服务
- ✅ 开机自启
- ✅ 日志管理
- ✅ 标准化管理

#### 完整步骤

**步骤 1: 创建服务文件**

```bash
# 创建 systemd 服务文件
sudo nano /etc/systemd/system/proxydocker.service
```

**步骤 2: 添加配置**

```ini
[Unit]
Description=ProxyDocker - Docker Hub Reverse Proxy
Documentation=https://github.com/longzheng268/proxydocker
After=network.target

[Service]
Type=simple
User=root
Group=root
WorkingDirectory=/opt/proxydocker
ExecStart=/usr/bin/node /opt/proxydocker/server.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=proxydocker

# Environment variables
Environment="NODE_ENV=production"
Environment="PORT=8080"
Environment="HOST=0.0.0.0"

# Optional: Uncomment and customize
# Environment="CUSTOM_URL=nginx"
# Environment="REDIRECT_URL=https://example.com"
# Environment="BLOCK_UA=bot,crawler,spider"

# Security settings (optional)
# NoNewPrivileges=true
# PrivateTmp=true
# ProtectSystem=strict
# ProtectHome=true
# ReadWritePaths=/opt/proxydocker

[Install]
WantedBy=multi-user.target
```

保存文件（Ctrl+X, Y, Enter）

**步骤 3: 重载 systemd**

```bash
# 重载 systemd 配置
sudo systemctl daemon-reload

# 验证配置文件
sudo systemctl cat proxydocker.service
```

**步骤 4: 启动服务**

```bash
# 启动服务
sudo systemctl start proxydocker

# 查看状态
sudo systemctl status proxydocker

# 如果失败，查看详细日志
sudo journalctl -u proxydocker -xe
```

**步骤 5: 设置开机自启**

```bash
# 启用开机自启
sudo systemctl enable proxydocker

# 验证是否启用
sudo systemctl is-enabled proxydocker

# 禁用开机自启
sudo systemctl disable proxydocker
```

**步骤 6: 管理服务**

```bash
# 启动服务
sudo systemctl start proxydocker

# 停止服务
sudo systemctl stop proxydocker

# 重启服务
sudo systemctl restart proxydocker

# 重载配置（不中断服务）
sudo systemctl reload proxydocker

# 查看状态
sudo systemctl status proxydocker

# 详细状态
sudo systemctl status proxydocker -l --no-pager

# 查看日志
sudo journalctl -u proxydocker

# 实时日志
sudo journalctl -u proxydocker -f

# 最近100条日志
sudo journalctl -u proxydocker -n 100

# 今天的日志
sudo journalctl -u proxydocker --since today

# 按时间查看日志
sudo journalctl -u proxydocker --since "2024-01-01" --until "2024-01-02"
```

**步骤 7: 更新服务**

```bash
# 1. 停止服务
sudo systemctl stop proxydocker

# 2. 更新代码
cd /opt/proxydocker
sudo git pull

# 3. 安装依赖
sudo npm install --production

# 4. 重启服务
sudo systemctl start proxydocker

# 5. 查看状态
sudo systemctl status proxydocker
```

---

### 部署方式 6: 使用 Nginx 反向代理

#### 适用场景
- 需要 HTTPS
- 需要域名访问
- 需要缓存
- 需要负载均衡

#### 完整步骤

**步骤 1: 安装 Nginx**

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install -y nginx

# 启动 Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# 验证安装
nginx -v
```

**CentOS/RHEL:**
```bash
sudo yum install -y nginx

# 启动 Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# 验证安装
nginx -v
```

**步骤 2: 配置 Nginx**

```bash
# 创建配置文件
sudo nano /etc/nginx/sites-available/proxydocker
```

添加以下配置：

```nginx
# HTTP 配置
server {
    listen 80;
    server_name docker.yourdomain.com;  # 替换为你的域名
    
    # 访问日志
    access_log /var/log/nginx/proxydocker_access.log;
    error_log /var/log/nginx/proxydocker_error.log;
    
    # 代理到 Node.js 应用
    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        
        # 传递原始请求信息
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket 支持（如需要）
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # 超时设置
        proxy_connect_timeout 600;
        proxy_send_timeout 600;
        proxy_read_timeout 600;
        send_timeout 600;
        
        # 缓冲设置
        proxy_buffering off;
        proxy_request_buffering off;
    }
    
    # 健康检查
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
```

**步骤 3: 启用配置**

```bash
# 创建符号链接（Ubuntu/Debian）
sudo ln -s /etc/nginx/sites-available/proxydocker /etc/nginx/sites-enabled/

# 或复制配置文件（CentOS/RHEL）
sudo cp /etc/nginx/sites-available/proxydocker /etc/nginx/conf.d/proxydocker.conf

# 测试配置
sudo nginx -t

# 重载 Nginx
sudo systemctl reload nginx
```

**步骤 4: 配置 HTTPS（使用 Let's Encrypt）**

```bash
# 安装 Certbot
# Ubuntu/Debian
sudo apt-get install -y certbot python3-certbot-nginx

# CentOS/RHEL
sudo yum install -y certbot python3-certbot-nginx

# 获取证书并自动配置
sudo certbot --nginx -d docker.yourdomain.com

# 测试自动续期
sudo certbot renew --dry-run

# 查看证书信息
sudo certbot certificates
```

配置完成后，Nginx 会自动更新配置文件，添加 HTTPS 支持。

**步骤 5: Nginx 管理命令**

```bash
# 测试配置
sudo nginx -t

# 重载配置
sudo systemctl reload nginx

# 重启 Nginx
sudo systemctl restart nginx

# 查看状态
sudo systemctl status nginx

# 查看日志
sudo tail -f /var/log/nginx/proxydocker_access.log
sudo tail -f /var/log/nginx/proxydocker_error.log
```

---

## 📚 详细部署指南

### 前置要求

- 一个 Cloudflare 账号（[免费注册](https://dash.cloudflare.com/sign-up)）
- 一个 GitHub 账号（如果使用自动部署）

### 步骤 1: 获取代码

**选项 A: Fork 仓库（推荐）**
1. 点击本页面右上角的 "Fork" 按钮
2. 等待 Fork 完成

**选项 B: 直接使用本仓库**
- 使用本仓库的代码进行部署

### 步骤 2: 部署到 Cloudflare Workers

#### 使用 Wrangler CLI（推荐）

1. **安装 Node.js**
   - 访问 [Node.js 官网](https://nodejs.org/) 下载并安装（推荐 LTS 版本）
   - 验证安装：打开终端运行 `node --version`

2. **安装 Wrangler**
   ```bash
   npm install -g wrangler
   ```

3. **登录 Cloudflare**
   ```bash
   wrangler login
   ```
   - 会自动打开浏览器，登录你的 Cloudflare 账号并授权

4. **创建 wrangler.toml 配置文件**
   
   在项目根目录创建 `wrangler.toml` 文件：
   ```toml
   name = "proxydocker"
   main = "_worker.js"
   compatibility_date = "2024-01-01"
   
   [env.production]
   workers_dev = true
   ```

5. **部署**
   ```bash
   wrangler deploy
   ```

6. **获取你的 Worker URL**
   - 部署成功后，Wrangler 会显示你的 Worker URL
   - 格式类似：`https://proxydocker.your-subdomain.workers.dev`

#### 使用 Cloudflare Dashboard（图形界面）

1. **登录 Cloudflare Dashboard**
   - 访问 [Cloudflare Dashboard](https://dash.cloudflare.com/)
   - 登录你的账号

2. **进入 Workers & Pages**
   - 点击左侧菜单的 "Workers & Pages"
   - 点击 "Create application"
   - 选择 "Create Worker"

3. **创建 Worker**
   - 输入 Worker 名称（例如：`proxydocker`）
   - 点击 "Deploy"

4. **编辑代码**
   - 点击 "Edit code"
   - 删除默认代码
   - 复制 `_worker.js` 的全部内容并粘贴
   - 点击 "Save and Deploy"

5. **获取 Worker URL**
   - 返回 Worker 详情页
   - 你的 Worker URL 会显示在页面上方

### 步骤 3: 绑定自定义域名（可选）

1. **在 Cloudflare 添加域名**
   - 如果还没有域名，需要先[注册一个域名](https://www.cloudflare.com/products/registrar/)
   - 在 Cloudflare 中添加你的域名

2. **添加 Worker 路由**
   - 进入你的 Worker 设置页面
   - 点击 "Triggers" 标签
   - 点击 "Add Custom Domain"
   - 输入你想使用的域名或子域名（例如：`docker.yourdomain.com`）
   - 点击 "Add Custom Domain"

3. **等待 DNS 生效**
   - 通常需要几分钟到几小时

## 🔧 客户端配置

### Linux / macOS

#### 方法 1: 配置 Docker Daemon（推荐）

1. **编辑或创建 Docker daemon 配置文件**
   ```bash
   sudo mkdir -p /etc/docker
   sudo nano /etc/docker/daemon.json
   ```

2. **添加镜像配置**
   ```json
   {
     "registry-mirrors": ["https://your-worker.your-subdomain.workers.dev"]
   }
   ```
   替换 `your-worker.your-subdomain.workers.dev` 为你的 Worker 域名

3. **重启 Docker**
   ```bash
   sudo systemctl restart docker
   ```

4. **验证配置**
   ```bash
   docker info | grep -A 5 "Registry Mirrors"
   ```

#### 方法 2: 使用完整镜像路径

直接在拉取镜像时指定代理地址：
```bash
docker pull your-worker.your-subdomain.workers.dev/library/nginx:latest
```

### Windows

#### 方法 1: Docker Desktop 图形界面

1. 打开 Docker Desktop
2. 点击设置图标（齿轮）
3. 选择 "Docker Engine"
4. 在 JSON 配置中添加：
   ```json
   {
     "registry-mirrors": ["https://your-worker.your-subdomain.workers.dev"]
   }
   ```
5. 点击 "Apply & Restart"

#### 方法 2: 使用完整镜像路径

```powershell
docker pull your-worker.your-subdomain.workers.dev/library/nginx:latest
```

### 验证配置是否生效

```bash
# 拉取一个测试镜像
docker pull nginx:alpine

# 检查是否通过代理拉取
docker info | grep -A 5 "Registry"
```

## 📖 使用说明

### 拉取镜像

#### 官方镜像
```bash
# 原始命令
docker pull nginx

# 使用代理（如果已配置 daemon.json）
docker pull nginx

# 使用完整路径
docker pull your-worker.workers.dev/library/nginx
```

#### 用户镜像
```bash
# 原始命令
docker pull username/imagename:tag

# 使用代理
docker pull username/imagename:tag

# 使用完整路径
docker pull your-worker.workers.dev/username/imagename:tag
```

### 网页搜索镜像

1. 在浏览器中访问你的 Worker 域名
   - 例如：`https://your-worker.your-subdomain.workers.dev`

2. 在搜索框中输入关键词
   - 例如：`nginx`, `redis`, `mysql`

3. 点击搜索按钮或按回车

4. 浏览搜索结果
   - 可以看到镜像的描述、下载次数、星标数等
   - 点击 "View on Docker Hub" 可以跳转到 Docker Hub 查看详情

### 支持的镜像仓库

通过修改域名前缀可以代理不同的镜像仓库：

- **Docker Hub**: `https://your-worker.workers.dev`
- **GCR**: `https://gcr.your-worker.workers.dev`
- **Quay.io**: `https://quay.your-worker.workers.dev`
- **GitHub Container Registry**: `https://ghcr.your-worker.workers.dev`

## ⚙️ 高级配置

### 环境变量

在 Cloudflare Workers 设置中可以配置环境变量：

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `URL` | 自定义首页 URL 或 "nginx" | `https://example.com` 或 `nginx` |
| `URL302` | 首页重定向 URL | `https://example.com` |
| `UA` | 屏蔽的 User-Agent（逗号分隔） | `bot,crawler,spider` |

#### 配置环境变量步骤

1. 进入 Worker 设置页面
2. 点击 "Settings" 标签
3. 点击 "Variables"
4. 点击 "Add variable"
5. 输入变量名和值
6. 点击 "Save"

### 自定义域名路由

编辑 `_worker.js` 中的 `routeByHosts` 函数：

```javascript
function routeByHosts(host) {
    const routes = {
        "quay": "quay.io",
        "gcr": "gcr.io",
        "k8s": "registry.k8s.io",
        "ghcr": "ghcr.io",
        // 添加自定义路由
        "custom": "custom-registry.com",
    };
    // ...
}
```

## 🏗️ 技术架构

### 模块化设计

ProxyDocker 采用模块化架构，确保核心功能的稳定性：

```
┌─────────────────────────────────────┐
│         Main Handler                │
│  (Error isolation wrapper)          │
└─────────────────────────────────────┘
                 │
    ┌────────────┼────────────┐
    │            │            │
┌───▼────┐  ┌───▼────┐  ┌───▼────┐
│  Core  │  │   UI   │  │ Search │
│ Proxy  │  │ Module │  │ Module │
└────────┘  └────────┘  └────────┘
    │
┌───▼────────────────────────────┐
│ Proxy Helpers                  │
│ - httpHandler                  │
│ - proxy                        │
└────────────────────────────────┘
```

### 核心组件

1. **核心代理模块** - 处理 Docker registry API 请求
2. **UI 模块** - 提供网页搜索界面
3. **搜索模块** - 实现镜像搜索功能
4. **路由模块** - 多仓库路由支持

### 关键特性

- **错误隔离**: UI 错误不会影响镜像拉取功能
- **渐进增强**: 基础功能优先，增强功能为辅
- **响应式设计**: 适配各种屏幕尺寸
- **动画效果**: 流畅的用户体验

## 🐛 故障排除

### 问题 1: 无法拉取镜像

**症状**: `docker pull` 命令失败或超时

**解决方案**:
1. 检查 Worker 是否正常运行
   ```bash
   curl https://your-worker.workers.dev/v2/
   ```
   应该返回 401 或其他认证相关响应

2. 检查 Docker daemon 配置
   ```bash
   docker info | grep -A 5 "Registry Mirrors"
   ```

3. 检查网络连接
   ```bash
   ping your-worker.workers.dev
   ```

4. 尝试使用完整路径
   ```bash
   docker pull your-worker.workers.dev/library/nginx
   ```

### 问题 2: 网页界面无法访问

**症状**: 浏览器访问 Worker 域名显示错误

**解决方案**:
1. 检查 Worker 是否部署成功
   - 登录 Cloudflare Dashboard
   - 查看 Worker 状态

2. 检查 DNS 解析
   ```bash
   nslookup your-worker.workers.dev
   ```

3. 清除浏览器缓存并重试

4. 检查 Worker 日志
   - 在 Cloudflare Dashboard 中查看实时日志

### 问题 3: 部署失败

**症状**: Wrangler deploy 命令失败

**解决方案**:
1. 检查 Wrangler 版本
   ```bash
   wrangler --version
   ```
   确保使用最新版本

2. 重新登录
   ```bash
   wrangler logout
   wrangler login
   ```

3. 检查 `wrangler.toml` 配置
   - 确保文件格式正确
   - 确保 `main` 字段指向 `_worker.js`

4. 查看详细错误信息
   ```bash
   wrangler deploy --verbose
   ```

### 问题 4: 搜索功能不工作

**症状**: 搜索镜像时显示错误或无结果

**解决方案**:
1. 检查网络连接到 Docker Hub API
2. 搜索功能是独立模块，不影响镜像拉取
3. 如果搜索失败，仍可使用 `docker pull` 命令

## ❓ 常见问题

### Q1: 这个服务是免费的吗？

**A**: 是的，基于 Cloudflare Workers 的免费计划：
- 每天 100,000 次请求
- 每次请求最多 10ms CPU 时间
- 对于个人使用完全足够

### Q2: 需要安装什么软件吗？

**A**: 客户端不需要安装任何额外软件！只需要：
- Docker（这是必需的）
- 修改 Docker 配置文件（daemon.json）

服务端部署在 Cloudflare Workers，也不需要服务器。

### Q3: 支持私有镜像吗？

**A**: 支持。只需要在 `docker login` 时使用你的 Worker 域名：
```bash
docker login your-worker.workers.dev
# 输入你的 Docker Hub 用户名和密码
```

### Q4: 为什么要使用代理？

**A**: 主要原因包括：
- 加速镜像拉取速度
- 解决网络访问问题
- 节省带宽成本
- 提供统一的镜像管理入口

### Q5: 如何更新 Worker 代码？

**A**: 
1. 拉取最新代码
   ```bash
   git pull origin main
   ```

2. 重新部署
   ```bash
   wrangler deploy
   ```

### Q6: 支持哪些架构的镜像？

**A**: 支持所有 Docker Hub 支持的架构：
- amd64 (x86_64)
- arm64 (aarch64)
- arm/v7
- 等等

### Q7: 可以同时代理多个仓库吗？

**A**: 可以！通过子域名或路径区分：
- `https://docker.yourdomain.com` - Docker Hub
- `https://gcr.yourdomain.com` - Google Container Registry
- `https://quay.yourdomain.com` - Quay.io

### Q8: 如何监控使用情况？

**A**: 在 Cloudflare Dashboard 中：
1. 进入你的 Worker
2. 查看 "Metrics" 标签
3. 可以看到请求数、错误率、延迟等指标

### Q9: 安全性如何？

**A**: 
- 所有连接使用 HTTPS 加密
- 不存储用户凭证
- 不记录敏感信息
- 开源代码，可审计

### Q10: 如何贡献代码？

**A**: 
1. Fork 本仓库
2. 创建特性分支
3. 提交你的更改
4. 发起 Pull Request

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🤝 贡献

欢迎贡献！请查看 [CONTRIBUTING.md](CONTRIBUTING.md) 了解详情。

## 🔗 相关链接

- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [Docker 官方文档](https://docs.docker.com/)
- [问题反馈](https://github.com/longzheng268/proxydocker/issues)

## 📮 联系方式

如有问题或建议，请：
- 提交 [Issue](https://github.com/longzheng268/proxydocker/issues)
- 发起 [Discussion](https://github.com/longzheng268/proxydocker/discussions)

---

⭐ 如果这个项目对你有帮助，请给个 Star！
