# IP 地理位置限制指南 / IP Geolocation Restriction Guide

## 📋 概述 / Overview

为了防止滥用和避免来自国外的投诉，ProxyDocker 现在支持基于 IP 地理位置的访问限制。此功能可以限制只允许来自特定国家/地区的访问。

To prevent abuse and avoid complaints from abroad, ProxyDocker now supports IP geolocation-based access restrictions. This feature can restrict access to only allow visitors from specific countries/regions.

## ✨ 功能特性 / Features

- 🌍 **基于国家代码的访问控制** - 使用 ISO 3166-1 alpha-2 国家代码
- 🔧 **灵活配置** - 可通过环境变量轻松启用/禁用
- 🚀 **零性能损耗** (Cloudflare Workers) - 使用 Cloudflare 内置的地理位置信息
- 📦 **可选依赖** (Node.js) - 使用 geoip-lite 库（可选安装）
- 🛡️ **友好的错误提示** - 被拒绝的访问会显示美观的错误页面

## 🚀 快速开始 / Quick Start

### Cloudflare Workers 部署

#### 方式 1: 通过 wrangler.toml 配置

编辑 `wrangler.toml` 文件：

```toml
[vars]
ENABLE_IP_RESTRICTION = "true"
ALLOWED_COUNTRIES = "CN"
```

#### 方式 2: 通过 Cloudflare Dashboard 配置

1. 登录 Cloudflare Dashboard
2. 进入你的 Worker 设置页面
3. 点击 "Settings" → "Variables"
4. 添加以下环境变量：
   - `ENABLE_IP_RESTRICTION`: `true`
   - `ALLOWED_COUNTRIES`: `CN`

### Node.js 服务器部署

#### 步骤 1: 安装 geoip-lite 依赖（可选但推荐）

```bash
npm install geoip-lite
```

**注意**: 如果不安装 `geoip-lite`，IP 限制功能将自动禁用，服务仍可正常运行。

#### 步骤 2: 配置环境变量

**方法 A: 使用 .env 文件**

```bash
cat > .env << 'EOF'
ENABLE_IP_RESTRICTION=true
ALLOWED_COUNTRIES=CN
NODE_ENV=production
EOF
```

**方法 B: 在启动命令中设置**

```bash
ENABLE_IP_RESTRICTION=true ALLOWED_COUNTRIES=CN node server.js
```

**方法 C: 在 systemd 服务中配置**

编辑 `/etc/systemd/system/proxydocker.service`：

```ini
[Service]
Environment="ENABLE_IP_RESTRICTION=true"
Environment="ALLOWED_COUNTRIES=CN"
```

#### 步骤 3: 重启服务

```bash
# 如果使用 systemd
sudo systemctl restart proxydocker

# 如果使用 PM2
pm2 restart proxydocker

# 如果直接运行
# 停止并重新启动 node server.js
```

## ⚙️ 配置选项 / Configuration Options

### 环境变量说明

| 变量名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `ENABLE_IP_RESTRICTION` | boolean | `true` | 是否启用 IP 限制功能 |
| `ALLOWED_COUNTRIES` | string | `"CN"` | 允许访问的国家代码列表，用逗号分隔 |

### 国家代码列表 (ISO 3166-1 alpha-2)

#### 常用国家代码

| 国家/地区 | 代码 | English Name |
|-----------|------|--------------|
| 中国大陆 | CN | China |
| 香港 | HK | Hong Kong |
| 台湾 | TW | Taiwan |
| 澳门 | MO | Macau |
| 日本 | JP | Japan |
| 韩国 | KR | Korea |
| 新加坡 | SG | Singapore |
| 美国 | US | United States |
| 英国 | GB | United Kingdom |
| 德国 | DE | Germany |
| 法国 | FR | France |
| 加拿大 | CA | Canada |
| 澳大利亚 | AU | Australia |

完整列表请参考: [ISO 3166-1 alpha-2](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2)

## 📝 配置示例 / Configuration Examples

### 示例 1: 只允许中国大陆访问

```bash
ENABLE_IP_RESTRICTION=true
ALLOWED_COUNTRIES=CN
```

### 示例 2: 允许大中华地区访问

```bash
ENABLE_IP_RESTRICTION=true
ALLOWED_COUNTRIES=CN,HK,TW,MO
```

### 示例 3: 允许多个亚洲国家访问

```bash
ENABLE_IP_RESTRICTION=true
ALLOWED_COUNTRIES=CN,HK,TW,MO,JP,KR,SG
```

### 示例 4: 禁用 IP 限制（允许全球访问）

```bash
ENABLE_IP_RESTRICTION=false
```

或者直接不设置该环境变量。

## 🔍 测试验证 / Testing

### 测试步骤

1. **启用 IP 限制**
   ```bash
   ENABLE_IP_RESTRICTION=true ALLOWED_COUNTRIES=CN node server.js
   ```

2. **从允许的地区访问**
   - 应该能够正常访问服务
   - Docker 镜像拉取应该正常工作

3. **从不允许的地区访问**
   - 应该看到 "Access Denied" 错误页面
   - HTTP 状态码应该是 403

### 使用代理测试不同地区

你可以使用代理服务器模拟不同地区的访问来测试：

```bash
# 使用 curl 通过代理测试
curl -x http://proxy-server:port http://your-server:8080/

# 检查返回的状态码
curl -I -x http://proxy-server:port http://your-server:8080/
```

## 🐛 故障排除 / Troubleshooting

### 问题 1: Node.js 环境下所有请求都被拒绝

**可能原因**: 未安装 `geoip-lite` 库，且处于生产环境

**解决方案**:
```bash
npm install geoip-lite
```

或者临时禁用 IP 限制:
```bash
ENABLE_IP_RESTRICTION=false node server.js
```

### 问题 2: 本地测试时无法访问

**可能原因**: 本地 IP (127.0.0.1) 被识别为非中国 IP

**解决方案**: 
1. 设置环境变量为开发模式:
   ```bash
   NODE_ENV=development node server.js
   ```

2. 或者临时禁用 IP 限制:
   ```bash
   ENABLE_IP_RESTRICTION=false node server.js
   ```

### 问题 3: Cloudflare Workers 中无法获取国家信息

**可能原因**: 在某些边缘情况下，Cloudflare 可能无法确定 IP 的国家

**解决方案**: 代码已经处理了这种情况。在开发/测试环境会允许访问，在生产环境会拒绝访问。

### 问题 4: 需要允许 CDN 或代理服务器访问

**解决方案**: 如果你使用了 CDN 或反向代理，需要在 `ALLOWED_COUNTRIES` 中添加这些服务器所在的国家代码。

## 🔒 安全建议 / Security Recommendations

1. **仅在必要时启用 IP 限制** - 如果你没有收到滥用投诉，可以保持禁用状态
2. **定期检查日志** - 监控被拒绝的访问，了解访问模式
3. **合理配置允许列表** - 根据实际用户分布配置国家列表
4. **使用 HTTPS** - 始终使用 HTTPS 保护数据传输
5. **结合其他安全措施** - IP 限制只是一层防护，还应结合其他安全措施

## 📊 监控与日志 / Monitoring and Logging

### Cloudflare Workers

在 Cloudflare Dashboard 中查看 Worker 日志：
1. 进入 Worker 页面
2. 点击 "Logs" 标签
3. 查看实时日志，包含被拒绝的访问记录

### Node.js 服务器

查看控制台输出或日志文件：

```bash
# 如果使用 systemd
sudo journalctl -u proxydocker -f

# 如果使用 PM2
pm2 logs proxydocker

# 如果直接运行
# 查看控制台输出
```

被拒绝的访问会记录如下信息：
```
Access denied from IP: xxx.xxx.xxx.xxx, Country: XX
```

## 🌐 与 Nginx 配置结合 / Integration with Nginx

如果你使用 Nginx 作为反向代理，需要确保真实 IP 被正确传递：

```nginx
location / {
    proxy_pass http://localhost:8080;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header Host $host;
}
```

## 📚 相关资源 / Related Resources

- [Cloudflare Workers Request CF Properties](https://developers.cloudflare.com/workers/runtime-apis/request/#incomingrequestcfproperties)
- [geoip-lite GitHub Repository](https://github.com/bluesmoon/node-geoip)
- [ISO 3166-1 alpha-2 Country Codes](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2)

## ❓ 常见问题 / FAQ

### Q1: IP 限制会影响 Docker 镜像拉取速度吗？

**A**: 不会。Cloudflare Workers 使用内置的地理位置信息，几乎零性能损耗。Node.js 使用内存中的 IP 数据库，查询非常快速。

### Q2: 可以同时允许多个国家访问吗？

**A**: 可以。在 `ALLOWED_COUNTRIES` 中用逗号分隔多个国家代码，例如：`CN,HK,TW,MO,JP`

### Q3: 如何临时禁用 IP 限制？

**A**: 设置环境变量 `ENABLE_IP_RESTRICTION=false` 即可。

### Q4: 如果用户使用 VPN 会怎样？

**A**: IP 限制基于检测到的 IP 地址。如果用户使用 VPN，系统会检测到 VPN 服务器的位置，而不是用户的真实位置。

### Q5: Docker 部署时如何配置？

**A**: 在 `docker-compose.yml` 或 `docker run` 命令中设置环境变量：

```yaml
environment:
  - ENABLE_IP_RESTRICTION=true
  - ALLOWED_COUNTRIES=CN
```

或

```bash
docker run -e ENABLE_IP_RESTRICTION=true -e ALLOWED_COUNTRIES=CN ...
```

---

如有任何问题或建议，请提交 [Issue](https://github.com/longzheng268/proxydocker/issues) 或 [Discussion](https://github.com/longzheng268/proxydocker/discussions)。
