# 📦 部署指南

## 部署方式对比

ProxyDocker 支持多种部署方式，选择最适合你的：

| 部署方式 | 适合场景 | 难度 | 费用 | 响应速度 |
|---------|---------|------|------|---------|
| **Cloudflare Workers** | 个人使用，无需服务器 | ⭐ 简单 | 免费 | 超快⚡⚡⚡ |
| **Docker 部署** | 有服务器，喜欢容器化 | ⭐⭐ 中等 | 服务器成本 | 快⚡⚡ |
| **Node.js 部署** | 有服务器，需要定制 | ⭐⭐ 中等 | 服务器成本 | 快⚡⚡ |

---

## 方式一：Cloudflare Workers（推荐）

### 优点
- ✅ 完全免费（每天 10 万次请求）
- ✅ 全球 CDN 加速
- ✅ 无需服务器
- ✅ 自动扩展
- ✅ 99.99% 可用性

### 一键部署

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/longzheng268/proxydocker)

### 手动部署

#### 步骤 1: 安装 Wrangler

```bash
npm install -g wrangler
```

#### 步骤 2: 登录 Cloudflare

```bash
wrangler login
```

#### 步骤 3: 部署

```bash
# 克隆仓库
git clone https://github.com/longzheng268/proxydocker.git
cd proxydocker

# 部署
wrangler deploy
```

#### 步骤 4: 获取 URL

部署成功后会显示你的 Worker URL，例如：
```
https://proxydocker.your-subdomain.workers.dev
```

---

## 方式二：Docker 部署

### 优点
- ✅ 完全控制
- ✅ 易于管理
- ✅ 资源隔离
- ✅ 快速启动

### 前置要求
- Docker 和 Docker Compose
- Linux 服务器

### 使用 Docker Compose（推荐）

```bash
# 1. 克隆仓库
git clone https://github.com/longzheng268/proxydocker.git
cd proxydocker

# 2. 启动服务
docker-compose up -d

# 3. 查看日志
docker-compose logs -f

# 4. 停止服务
docker-compose down
```

### 使用 Docker命令

```bash
# 构建镜像
docker build -t proxydocker .

# 运行容器
docker run -d \
  -p 8080:8080 \
  --name proxydocker \
  --restart unless-stopped \
  -e PORT=8080 \
  -e HOST=0.0.0.0 \
  proxydocker

# 查看日志
docker logs -f proxydocker

# 停止并删除
docker stop proxydocker && docker rm proxydocker
```

### 自定义配置

编辑 `docker-compose.yml`:

```yaml
environment:
  - PORT=8080                      # 端口
  - HOST=0.0.0.0                   # 监听地址
  - CUSTOM_URL=nginx               # 自定义首页
  - REDIRECT_URL=https://example.com  # 重定向URL
  - BLOCK_UA=bot,crawler,spider    # 屏蔽UA
```

---

## 方式三：Node.js 直接部署

### 优点
- ✅ 无需 Docker
- ✅ 性能最优
- ✅ 易于调试

### 自动安装（Linux）

```bash
curl -fsSL https://raw.githubusercontent.com/longzheng268/proxydocker/main/install.sh | sudo bash
```

安装脚本会自动完成所有配置。

### 手动安装

#### 步骤 1: 安装 Node.js

访问 https://nodejs.org 下载安装 Node.js 14+

#### 步骤 2: 克隆并安装

```bash
git clone https://github.com/longzheng268/proxydocker.git
cd proxydocker
npm install
```

#### 步骤 3: 启动服务

```bash
# 开发模式
npm start

# 生产模式（后台运行）
nohup npm start > proxydocker.log 2>&1 &
```

### 使用 PM2（生产环境推荐）

```bash
# 安装 PM2
npm install -g pm2

# 启动服务
pm2 start server.js --name proxydocker

# 开机自启
pm2 startup
pm2 save

# 管理命令
pm2 list              # 列表
pm2 logs proxydocker  # 日志
pm2 restart proxydocker  # 重启
pm2 stop proxydocker     # 停止
pm2 delete proxydocker   # 删除
```

### 使用 systemd（Linux 系统服务）

#### 创建服务文件

```bash
sudo nano /etc/systemd/system/proxydocker.service
```

#### 添加配置

```ini
[Unit]
Description=ProxyDocker
After=network.target

[Service]
Type=simple
User=your-username
WorkingDirectory=/path/to/proxydocker
ExecStart=/usr/bin/node /path/to/proxydocker/server.js
Restart=always
RestartSec=10

Environment="NODE_ENV=production"
Environment="PORT=8080"
Environment="HOST=0.0.0.0"

[Install]
WantedBy=multi-user.target
```

#### 启动服务

```bash
sudo systemctl daemon-reload
sudo systemctl enable proxydocker
sudo systemctl start proxydocker
sudo systemctl status proxydocker
```

---

## 环境变量配置

所有部署方式都支持以下环境变量：

| 变量名 | 说明 | 默认值 | 示例 |
|--------|------|--------|------|
| `PORT` | 服务端口 | 8080 | 8080 |
| `HOST` | 监听地址 | 0.0.0.0 | 0.0.0.0 |
| `NODE_ENV` | 运行环境 | development | production |
| `CUSTOM_URL` | 自定义首页URL | - | nginx 或 https://example.com |
| `REDIRECT_URL` | 首页重定向 | - | https://example.com |
| `BLOCK_UA` | 屏蔽User-Agent | - | bot,crawler,spider |

---

## 反向代理配置

### Nginx

如果你想在服务器前面加一层 Nginx：

```nginx
server {
    listen 80;
    server_name docker.yourdomain.com;
    
    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support (if needed)
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Timeouts
        proxy_connect_timeout 600;
        proxy_send_timeout 600;
        proxy_read_timeout 600;
    }
}
```

### Caddy

```caddyfile
docker.yourdomain.com {
    reverse_proxy localhost:8080
}
```

---

## 防火墙配置

### UFW (Ubuntu/Debian)

```bash
sudo ufw allow 8080/tcp
sudo ufw reload
```

### firewalld (CentOS/RHEL)

```bash
sudo firewall-cmd --permanent --add-port=8080/tcp
sudo firewall-cmd --reload
```

---

## 更新部署

### Cloudflare Workers

```bash
cd proxydocker
git pull
wrangler deploy
```

### Docker

```bash
cd proxydocker
git pull
docker-compose down
docker-compose build
docker-compose up -d
```

### Node.js

```bash
cd proxydocker
git pull
npm install

# PM2
pm2 restart proxydocker

# systemd
sudo systemctl restart proxydocker
```

---

## 故障排除

### 检查服务状态

```bash
# Docker
docker ps | grep proxydocker
docker logs proxydocker

# PM2
pm2 list
pm2 logs proxydocker

# systemd
sudo systemctl status proxydocker
sudo journalctl -u proxydocker -f
```

### 检查端口占用

```bash
# 检查端口是否被占用
sudo netstat -tlnp | grep 8080
# 或
sudo lsof -i :8080
```

### 检查网络连接

```bash
# 测试服务是否响应
curl http://localhost:8080/v2/

# 从外部测试
curl http://your-server-ip:8080/v2/
```

---

## 性能优化建议

### 1. 使用反向代理缓存

配置 Nginx 或 Caddy 缓存静态资源。

### 2. 调整 Node.js 内存限制

```bash
NODE_OPTIONS="--max-old-space-size=512" npm start
```

### 3. 使用 Docker 资源限制

```yaml
deploy:
  resources:
    limits:
      cpus: '1'
      memory: 512M
```

### 4. 启用日志轮转

Docker Compose 中已配置：

```yaml
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

---

更多信息请参考主 README 文件。
