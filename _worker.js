// _worker.js
// Modular Docker Hub Reverse Proxy for Cloudflare Workers
// Core functionality is isolated to ensure basic operations always work

// ============================================================================
// CORE CONFIGURATION - Critical for basic proxy functionality
// ============================================================================

// Docker镜像仓库主机地址
let hub_host = 'registry-1.docker.io';
// Docker认证服务器地址
const auth_url = 'https://auth.docker.io';
// 自定义的工作服务器地址
let workers_url = 'https://proxydocker.lz-0315.com';

let 屏蔽爬虫UA = ['netcraft'];

// ============================================================================
// CORE ROUTING - Essential for proxy functionality
// ============================================================================

/**
 * 根据主机名选择对应的上游地址
 * @param {string} host 主机名
 * @returns {Array} [upstream_host, needs_fake_page]
 */
function routeByHosts(host) {
	// 定义路由表
	const routes = {
		// 生产环境
		"quay": "quay.io",
		"gcr": "gcr.io",
		"k8s-gcr": "k8s.gcr.io",
		"k8s": "registry.k8s.io",
		"ghcr": "ghcr.io",
		"cloudsmith": "docker.cloudsmith.io",
		"nvcr": "nvcr.io",
		
		// 测试环境
		"test": "registry-1.docker.io",
	};

	if (host in routes) return [ routes[host], false ];
	else return [ hub_host, true ];
}

// ============================================================================
// CORE UTILITIES - Essential helper functions
// ============================================================================

/** @type {RequestInit} */
const PREFLIGHT_INIT = {
	// 预检请求配置
	headers: new Headers({
		'access-control-allow-origin': '*', // 允许所有来源
		'access-control-allow-methods': 'GET,POST,PUT,PATCH,TRACE,DELETE,HEAD,OPTIONS', // 允许的HTTP方法
		'access-control-max-age': '1728000', // 预检请求的缓存时间
	}),
}

/**
 * 构造响应
 * @param {any} body 响应体
 * @param {number} status 响应状态码
 * @param {Object<string, string>} headers 响应头
 */
function makeRes(body, status = 200, headers = {}) {
	headers['access-control-allow-origin'] = '*' // 允许所有来源
	return new Response(body, { status, headers }) // 返回新构造的响应
}

/**
 * 构造新的URL对象
 * @param {string} urlStr URL字符串
 */
function newUrl(urlStr) {
	try {
		return new URL(urlStr) // 尝试构造新的URL对象
	} catch (err) {
		return null // 构造失败返回null
	}
}

/**
 * 检查是否为UUID格式
 * @param {string} uuid UUID字符串
 * @returns {boolean}
 */
function isUUID(uuid) {
	// 定义一个正则表达式来匹配 UUID 格式
	const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[4][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
	
	// 使用正则表达式测试 UUID 字符串
	return uuidRegex.test(uuid);
}

/**
 * 解析环境变量配置
 * @param {string} envadd 环境变量内容
 * @returns {Array<string>}
 */
async function ADD(envadd) {
	var addtext = envadd.replace(/[	 |"'\r\n]+/g, ',').replace(/,+/g, ',');	// 将空格、双引号、单引号和换行符替换为逗号
	if (addtext.charAt(0) == ',') addtext = addtext.slice(1);
	if (addtext.charAt(addtext.length - 1) == ',') addtext = addtext.slice(0, addtext.length - 1);
	const add = addtext.split(',');
	return add;
}

// ============================================================================
// UI MODULE - Web interface (isolated, won't affect proxy functionality)
// ============================================================================

// ============================================================================
// UI MODULE - Web interface (isolated, won't affect proxy functionality)
// ============================================================================

/**
 * Nginx伪装页面 - 用于爬虫访问时的伪装
 * @returns {Promise<string>}
 */
async function nginx() {
	const text = `
	<!DOCTYPE html>
	<html>
	<head>
	<title>Welcome to nginx!</title>
	<style>
		body {
			width: 35em;
			margin: 0 auto;
			font-family: Tahoma, Verdana, Arial, sans-serif;
		}
	</style>
	</head>
	<body>
	<h1>Welcome to nginx!</h1>
	<p>If you see this page, the nginx web server is successfully installed and
	working. Further configuration is required.</p>
	
	<p>For online documentation and support please refer to
	<a href="http://nginx.org/">nginx.org</a>.<br/>
	Commercial support is available at
	<a href="http://nginx.com/">nginx.com</a>.</p>
	
	<p><em>Thank you for using nginx.</em></p>
	</body>
	</html>
	`
	return text;
}

/**
 * 搜索界面 - 带动画效果和响应式设计
 * @param {string} hostname 当前主机名
 * @returns {Promise<string>}
 */
/**
 * 增强的搜索界面 - 包含使用说明和镜像转换器
 * @param {string} hostname 当前主机名
 * @returns {Promise<string>}
 */
async function searchInterface(hostname) {
	const proxyDomain = hostname || 'your-proxy.workers.dev';
	
	const text = `
	<!DOCTYPE html>
	<html lang="zh-CN">
	<head>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<title>Docker Hub 代理服务 - 使用说明</title>
		<style>
		* {
			margin: 0;
			padding: 0;
			box-sizing: border-box;
		}
		
		body {
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
			background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
			min-height: 100vh;
			padding: 20px;
		}
		
		.container {
			max-width: 1200px;
			margin: 0 auto;
			position: relative;
			z-index: 2;
		}
		
		/* 头部 */
		.header {
			text-align: center;
			padding: 40px 20px;
			animation: fadeInDown 0.8s ease-out;
		}
		
		@keyframes fadeInDown {
			from {
				opacity: 0;
				transform: translateY(-30px);
			}
			to {
				opacity: 1;
				transform: translateY(0);
			}
		}
		
		.logo {
			margin-bottom: 20px;
			animation: float 3s ease-in-out infinite;
		}
		
		@keyframes float {
			0%, 100% { transform: translateY(0px); }
			50% { transform: translateY(-10px); }
		}
		
		.logo svg {
			filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1));
		}
		
		h1 {
			color: white;
			font-size: 2.5em;
			margin-bottom: 10px;
			text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
		}
		
		.subtitle {
			color: rgba(255, 255, 255, 0.95);
			font-size: 1.2em;
			margin-bottom: 30px;
		}
		
		/* 内容卡片 */
		.card {
			background: rgba(255, 255, 255, 0.95);
			backdrop-filter: blur(10px);
			border-radius: 15px;
			padding: 30px;
			margin-bottom: 20px;
			box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
			animation: fadeInUp 0.6s ease-out;
			animation-fill-mode: both;
		}
		
		@keyframes fadeInUp {
			from {
				opacity: 0;
				transform: translateY(20px);
			}
			to {
				opacity: 1;
				transform: translateY(0);
			}
		}
		
		.card:nth-child(2) { animation-delay: 0.1s; }
		.card:nth-child(3) { animation-delay: 0.2s; }
		.card:nth-child(4) { animation-delay: 0.3s; }
		.card:nth-child(5) { animation-delay: 0.4s; }
		
		.card h2 {
			color: #333;
			font-size: 1.8em;
			margin-bottom: 20px;
			border-bottom: 3px solid #667eea;
			padding-bottom: 10px;
		}
		
		.card h3 {
			color: #555;
			font-size: 1.3em;
			margin: 20px 0 10px 0;
		}
		
		.card p {
			color: #666;
			line-height: 1.8;
			margin-bottom: 15px;
		}
		
		/* 搜索区域 */
		.search-section {
			display: flex;
			align-items: center;
			gap: 15px;
			margin: 20px 0;
		}
		
		.search-input {
			flex: 1;
			padding: 16px 24px;
			font-size: 16px;
			border: 2px solid #ddd;
			border-radius: 50px;
			background: white;
			transition: all 0.3s ease;
			outline: none;
		}
		
		.search-input:focus {
			border-color: #667eea;
			box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
		}
		
		.search-button {
			padding: 16px 32px;
			background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
			color: white;
			border: none;
			border-radius: 50px;
			font-size: 16px;
			font-weight: 600;
			cursor: pointer;
			transition: all 0.3s ease;
		}
		
		.search-button:hover {
			transform: translateY(-2px);
			box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
		}
		
		/* 转换器区域 */
		.converter {
			background: #f8f9fa;
			padding: 20px;
			border-radius: 10px;
			margin: 20px 0;
		}
		
		.converter-input {
			width: 100%;
			padding: 14px 20px;
			font-size: 15px;
			border: 2px solid #ddd;
			border-radius: 8px;
			margin-bottom: 15px;
			font-family: 'Courier New', monospace;
		}
		
		.converter-output {
			background: #fff;
			border: 2px solid #667eea;
			border-radius: 8px;
			padding: 14px 20px;
			font-family: 'Courier New', monospace;
			font-size: 14px;
			color: #333;
			min-height: 50px;
			word-break: break-all;
			display: none;
		}
		
		.converter-output.show {
			display: block;
		}
		
		.copy-button {
			background: #667eea;
			color: white;
			border: none;
			padding: 8px 16px;
			border-radius: 6px;
			cursor: pointer;
			margin-top: 10px;
			font-size: 14px;
			transition: all 0.3s ease;
		}
		
		.copy-button:hover {
			background: #5568d3;
		}
		
		.copy-button:active {
			transform: scale(0.95);
		}
		
		/* 代码块 */
		.code-block {
			background: #2d2d2d;
			color: #f8f8f2;
			padding: 20px;
			border-radius: 8px;
			margin: 15px 0;
			overflow-x: auto;
			font-family: 'Courier New', monospace;
			font-size: 14px;
			line-height: 1.6;
			position: relative;
		}
		
		.code-block code {
			display: block;
		}
		
		.code-block .copy-code {
			position: absolute;
			top: 10px;
			right: 10px;
			background: rgba(255, 255, 255, 0.1);
			color: white;
			border: 1px solid rgba(255, 255, 255, 0.2);
			padding: 6px 12px;
			border-radius: 4px;
			cursor: pointer;
			font-size: 12px;
			transition: all 0.3s ease;
		}
		
		.code-block .copy-code:hover {
			background: rgba(255, 255, 255, 0.2);
		}
		
		.command {
			color: #50fa7b;
		}
		
		.comment {
			color: #6272a4;
		}
		
		/* 提示框 */
		.tip {
			background: #e7f3ff;
			border-left: 4px solid #2196F3;
			padding: 15px;
			margin: 15px 0;
			border-radius: 4px;
		}
		
		.tip strong {
			color: #1976D2;
		}
		
		.warning {
			background: #fff3e0;
			border-left: 4px solid #ff9800;
			padding: 15px;
			margin: 15px 0;
			border-radius: 4px;
		}
		
		.warning strong {
			color: #f57c00;
		}
		
		/* 功能列表 */
		.features {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
			gap: 15px;
			margin: 20px 0;
		}
		
		.feature-item {
			background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
			color: white;
			padding: 20px;
			border-radius: 10px;
			transition: all 0.3s ease;
		}
		
		.feature-item:hover {
			transform: translateY(-5px);
			box-shadow: 0 10px 25px rgba(102, 126, 234, 0.3);
		}
		
		.feature-item h4 {
			font-size: 1.1em;
			margin-bottom: 8px;
		}
		
		.feature-item p {
			color: rgba(255, 255, 255, 0.9);
			font-size: 0.9em;
			margin: 0;
		}
		
		/* 响应式 */
		@media (max-width: 768px) {
			h1 { font-size: 2em; }
			.card { padding: 20px; }
			.search-section {
				flex-direction: column;
			}
			.search-input {
				width: 100%;
			}
		}
		
		@media (max-width: 480px) {
			h1 { font-size: 1.6em; }
			.subtitle { font-size: 1em; }
			.card h2 { font-size: 1.4em; }
		}
		</style>
	</head>
	<body>
		<div class="container">
			<!-- 头部 -->
			<div class="header">
				<div class="logo">
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 18" fill="#ffffff" width="120" height="90">
						<path d="M23.763 6.886c-.065-.053-.673-.512-1.954-.512-.32 0-.659.03-1.01.087-.248-1.703-1.651-2.533-1.716-2.57l-.345-.2-.227.328a4.596 4.596 0 0 0-.611 1.433c-.23.972-.09 1.884.403 2.666-.596.331-1.546.418-1.744.42H.752a.753.753 0 0 0-.75.749c-.007 1.456.233 2.864.692 4.07.545 1.43 1.355 2.483 2.409 3.13 1.181.725 3.104 1.14 5.276 1.14 1.016 0 2.03-.092 2.93-.266 1.417-.273 2.705-.742 3.826-1.391a10.497 10.497 0 0 0 2.61-2.14c1.252-1.42 1.998-3.005 2.553-4.408.075.003.148.005.221.005 1.371 0 2.215-.55 2.68-1.01.505-.5.685-.998.704-1.053L24 7.076l-.237-.19Z"></path>
						<path d="M2.216 8.075h2.119a.186.186 0 0 0 .185-.186V6a.186.186 0 0 0-.185-.186H2.216A.186.186 0 0 0 2.031 6v1.89c0 .103.083.186.185.186Zm2.92 0h2.118a.185.185 0 0 0 .185-.186V6a.185.185 0 0 0-.185-.186H5.136A.185.185 0 0 0 4.95 6v1.89c0 .103.083.186.186.186Zm2.964 0h2.118a.186.186 0 0 0 .185-.186V6a.186.186 0 0 0-.185-.186H8.1A.185.185 0 0 0 7.914 6v1.89c0 .103.083.186.186.186Zm2.928 0h2.119a.185.185 0 0 0 .185-.186V6a.185.185 0 0 0-.185-.186h-2.119a.186.186 0 0 0-.185.186v1.89c0 .103.083.186.185.186Zm-5.892-2.72h2.118a.185.185 0 0 0 .185-.186V3.28a.186.186 0 0 0-.185-.186H5.136a.186.186 0 0 0-.186.186v1.89c0 .103.083.186.186.186Zm2.964 0h2.118a.186.186 0 0 0 .185-.186V3.28a.186.186 0 0 0-.185-.186H8.1a.186.186 0 0 0-.186.186v1.89c0 .103.083.186.186.186Zm2.928 0h2.119a.185.185 0 0 0 .185-.186V3.28a.186.186 0 0 0-.185-.186h-2.119a.186.186 0 0 0-.185.186v1.89c0 .103.083.186.185.186Zm0-2.72h2.119a.186.186 0 0 0 .185-.186V.56a.185.185 0 0 0-.185-.186h-2.119a.186.186 0 0 0-.185.186v1.89c0 .103.083.186.185.186Zm2.955 5.44h2.118a.185.185 0 0 0 .186-.186V6a.185.185 0 0 0-.186-.186h-2.118a.185.185 0 0 0-.185.186v1.89c0 .103.083.186.185.186Z"></path>
					</svg>
				</div>
				<h1>Docker Hub 代理服务</h1>
				<p class="subtitle">🚀 快速、安全、免费的 Docker 镜像代理</p>
			</div>
			
			<!-- 搜索镜像 -->
			<div class="card">
				<h2>🔍 搜索 Docker 镜像</h2>
				<p>输入关键词搜索 Docker Hub 上的镜像：</p>
				<div class="search-section">
					<input type="text" id="search-input" class="search-input" placeholder="例如：nginx, redis, mysql..." autocomplete="off">
					<button id="search-button" class="search-button">搜索</button>
				</div>
			</div>
			
			<!-- 镜像转换器 -->
			<div class="card">
				<h2>🔄 镜像地址转换器</h2>
				<p>已知官方镜像名称或链接？快速生成代理地址和拉取命令：</p>
				
				<div class="converter">
					<input type="text" id="convert-input" class="converter-input" placeholder="输入官方镜像名称或链接，例如：nginx:latest 或 library/nginx:latest">
					<div id="convert-output" class="converter-output"></div>
				</div>
			</div>
			
			<!-- 快速开始 -->
			<div class="card">
				<h2>⚡ 快速开始</h2>
				
				<h3>方法一：配置 Docker 镜像加速器（推荐）</h3>
				<p>一次配置，全局生效，无需修改拉取命令。</p>
				
				<div class="code-block">
					<button class="copy-code" onclick="copyCode(this)">复制</button>
					<code><span class="comment"># 1. 编辑 Docker 配置文件</span>
sudo nano /etc/docker/daemon.json

<span class="comment"># 2. 添加以下内容</span>
{
  "registry-mirrors": ["https://${proxyDomain}"]
}

<span class="comment"># 3. 重启 Docker 服务</span>
sudo systemctl daemon-reload
sudo systemctl restart docker

<span class="comment"># 4. 验证配置</span>
docker info | grep "Registry Mirrors"</code>
				</div>
				
				<div class="tip">
					<strong>💡 提示：</strong> 配置后，所有 <code>docker pull</code> 命令都会自动使用代理，无需修改命令。
				</div>
				
				<h3>方法二：直接使用代理地址</h3>
				<p>无需配置，直接在拉取命令中指定代理地址。</p>
				
				<div class="code-block">
					<button class="copy-code" onclick="copyCode(this)">复制</button>
					<code><span class="comment"># 官方镜像</span>
<span class="command">docker pull ${proxyDomain}/library/nginx:latest</span>

<span class="comment"># 用户镜像</span>
<span class="command">docker pull ${proxyDomain}/username/imagename:tag</span></code>
				</div>
			</div>
			
			<!-- 使用示例 -->
			<div class="card">
				<h2>📝 使用示例</h2>
				
				<h3>拉取官方镜像</h3>
				<div class="code-block">
					<button class="copy-code" onclick="copyCode(this)">复制</button>
					<code><span class="comment"># Nginx</span>
<span class="command">docker pull ${proxyDomain}/library/nginx:alpine</span>

<span class="comment"># Redis</span>
<span class="command">docker pull ${proxyDomain}/library/redis:latest</span>

<span class="comment"># MySQL</span>
<span class="command">docker pull ${proxyDomain}/library/mysql:8.0</span></code>
				</div>
				
				<h3>拉取用户镜像</h3>
				<div class="code-block">
					<button class="copy-code" onclick="copyCode(this)">复制</button>
					<code><span class="command">docker pull ${proxyDomain}/bitnami/postgresql:latest</span>
<span class="command">docker pull ${proxyDomain}/grafana/grafana:latest</span></code>
				</div>
			</div>
			
			<!-- 主要功能 -->
			<div class="card">
				<h2>✨ 主要功能</h2>
				<div class="features">
					<div class="feature-item">
						<h4>🚀 全球加速</h4>
						<p>Cloudflare CDN 加速，全球访问飞快</p>
					</div>
					<div class="feature-item">
						<h4>🔒 安全可靠</h4>
						<p>HTTPS 加密传输，保护您的数据安全</p>
					</div>
					<div class="feature-item">
						<h4>💰 完全免费</h4>
						<p>基于 Cloudflare Workers，免费使用</p>
					</div>
					<div class="feature-item">
						<h4>🌍 多仓库支持</h4>
						<p>支持 Docker Hub, GCR, Quay 等</p>
					</div>
				</div>
			</div>
			
			<!-- 常见问题 -->
			<div class="card">
				<h2>❓ 常见问题</h2>
				
				<h3>如何拉取私有镜像？</h3>
				<p>首先登录到代理服务器：</p>
				<div class="code-block">
					<button class="copy-code" onclick="copyCode(this)">复制</button>
					<code><span class="command">docker login ${proxyDomain}</span>
<span class="comment"># 输入您的 Docker Hub 用户名和密码</span></code>
				</div>
				
				<h3>支持哪些镜像仓库？</h3>
				<p>目前支持以下镜像仓库：</p>
				<ul style="margin-left: 20px; line-height: 2;">
					<li>Docker Hub (默认)</li>
					<li>Google Container Registry (gcr.io)</li>
					<li>Quay.io</li>
					<li>GitHub Container Registry (ghcr.io)</li>
					<li>Kubernetes Registry (registry.k8s.io)</li>
				</ul>
			</div>
		</div>
		
		<script>
		// 搜索功能
		function performSearch() {
			const query = document.getElementById('search-input').value.trim();
			if (query) {
				window.location.href = '/search?q=' + encodeURIComponent(query) + '&page=1';
			}
		}
		
		document.getElementById('search-button').addEventListener('click', performSearch);
		document.getElementById('search-input').addEventListener('keypress', function(event) {
			if (event.key === 'Enter') {
				performSearch();
			}
		});
		
		// 镜像转换器
		document.getElementById('convert-input').addEventListener('input', function() {
			const input = this.value.trim();
			const output = document.getElementById('convert-output');
			
			if (!input) {
				output.classList.remove('show');
				return;
			}
			
			let imageName = input;
			
			// 处理Docker Hub链接
			if (input.includes('hub.docker.com')) {
				const match = input.match(/hub\\.docker\\.com\\/(?:_\\/)?([^/]+)\\/([^/\\s]+)/);
				if (match) {
					imageName = match[1] + '/' + match[2].replace(/\\/.*$/, '');
				}
			}
			
			// 处理镜像名称
			let proxyImage = imageName;
			
			// 如果没有斜杠，说明是官方镜像，加上 library 前缀
			if (!imageName.includes('/')) {
				proxyImage = 'library/' + imageName;
			}
			
			// 生成代理地址和命令
			const proxyDomain = '${proxyDomain}';
			const pullCommand = \`docker pull \${proxyDomain}/\${proxyImage}\`;
			
			output.innerHTML = \`
				<div style="margin-bottom: 10px;">
					<strong>代理地址：</strong><br>
					<code>\${proxyDomain}/\${proxyImage}</code>
				</div>
				<div>
					<strong>拉取命令：</strong><br>
					<code>\${pullCommand}</code>
				</div>
				<button class="copy-button" onclick="copyToClipboard('\${pullCommand}')">复制命令</button>
			\`;
			
			output.classList.add('show');
		});
		
		// 复制代码块
		function copyCode(button) {
			const codeBlock = button.parentElement.querySelector('code');
			const text = codeBlock.textContent;
			copyToClipboard(text);
			
			const originalText = button.textContent;
			button.textContent = '已复制！';
			setTimeout(() => {
				button.textContent = originalText;
			}, 2000);
		}
		
		// 复制到剪贴板
		function copyToClipboard(text) {
			if (navigator.clipboard && navigator.clipboard.writeText) {
				navigator.clipboard.writeText(text).then(() => {
					console.log('Copied to clipboard');
				}).catch(err => {
					console.error('Failed to copy: ', err);
					fallbackCopyTextToClipboard(text);
				});
			} else {
				fallbackCopyTextToClipboard(text);
			}
		}
		
		function fallbackCopyTextToClipboard(text) {
			const textArea = document.createElement("textarea");
			textArea.value = text;
			textArea.style.position = "fixed";
			textArea.style.top = "-9999px";
			document.body.appendChild(textArea);
			textArea.focus();
			textArea.select();
			
			try {
				document.execCommand('copy');
				console.log('Fallback: Copied to clipboard');
			} catch (err) {
				console.error('Fallback: Failed to copy', err);
			}
			
			document.body.removeChild(textArea);
		}
		</script>
	</body>
	</html>
	`;
	return text;
}
/**
 * 搜索结果页面 - 展示Docker镜像搜索结果（带分页）
 * @param {string} query 搜索关键词
 * @param {Array} results 搜索结果
 * @param {number} page 当前页码
 * @param {number} totalCount 总结果数
 * @param {string} hostname 当前主机名
 * @returns {Promise<string>}
 */
async function searchResultsPage(query, results, page = 1, totalCount = 0, hostname = 'your-proxy.workers.dev') {
	const proxyDomain = hostname || 'your-proxy.workers.dev';
	const pageSize = 20;
	const totalPages = Math.ceil(totalCount / pageSize);
	
	const resultsHTML = results.map((result, index) => {
		const imageName = result.name || 'Unknown';
		const isOfficial = !imageName.includes('/');
		const proxyImage = isOfficial ? `library/${imageName}` : imageName;
		const pullCommand = `docker pull ${proxyDomain}/${proxyImage}`;
		
		return `
		<div class="result-card" style="animation-delay: ${index * 0.05}s">
			<div class="result-header">
				<h3>${imageName}</h3>
				<span class="stars">⭐ ${result.star_count || 0}</span>
			</div>
			<p class="description">${result.description || 'No description available'}</p>
			<div class="pull-command">
				<code>${pullCommand}</code>
				<button class="copy-btn" onclick="copyToClipboard('${pullCommand}', this)">
					<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
						<path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/>
						<path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/>
					</svg>
				</button>
			</div>
			<div class="result-footer">
				<span class="pulls">📥 ${formatNumber(result.pull_count || 0)} pulls</span>
				<span class="official-badge">${isOfficial ? '🏅 Official' : ''}</span>
				<a href="https://hub.docker.com/r/${imageName}" target="_blank" rel="noopener noreferrer" class="view-link">Docker Hub →</a>
			</div>
		</div>
	`;
	}).join('');
	
	// Generate pagination HTML
	let paginationHTML = '';
	if (totalPages > 1) {
		const maxVisiblePages = 7;
		let startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2));
		let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
		
		if (endPage - startPage < maxVisiblePages - 1) {
			startPage = Math.max(1, endPage - maxVisiblePages + 1);
		}
		
		paginationHTML = '<div class="pagination">';
		
		// Previous button
		if (page > 1) {
			paginationHTML += `<a href="/search?q=${encodeURIComponent(query)}&page=${page - 1}" class="page-btn">« 上一页</a>`;
		}
		
		// First page
		if (startPage > 1) {
			paginationHTML += `<a href="/search?q=${encodeURIComponent(query)}&page=1" class="page-btn">1</a>`;
			if (startPage > 2) {
				paginationHTML += '<span class="page-dots">...</span>';
			}
		}
		
		// Page numbers
		for (let i = startPage; i <= endPage; i++) {
			if (i === page) {
				paginationHTML += `<span class="page-btn active">${i}</span>`;
			} else {
				paginationHTML += `<a href="/search?q=${encodeURIComponent(query)}&page=${i}" class="page-btn">${i}</a>`;
			}
		}
		
		// Last page
		if (endPage < totalPages) {
			if (endPage < totalPages - 1) {
				paginationHTML += '<span class="page-dots">...</span>';
			}
			paginationHTML += `<a href="/search?q=${encodeURIComponent(query)}&page=${totalPages}" class="page-btn">${totalPages}</a>`;
		}
		
		// Next button
		if (page < totalPages) {
			paginationHTML += `<a href="/search?q=${encodeURIComponent(query)}&page=${page + 1}" class="page-btn">下一页 »</a>`;
		}
		
		paginationHTML += '</div>';
	}

	const text = `
	<!DOCTYPE html>
	<html lang="zh-CN">
	<head>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<title>搜索结果 - ${query}</title>
		<style>
		* {
			margin: 0;
			padding: 0;
			box-sizing: border-box;
		}
		
		body {
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
			background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
			min-height: 100vh;
			padding: 20px;
		}
		
		.container {
			max-width: 1200px;
			margin: 0 auto;
		}
		
		.header {
			background: rgba(255, 255, 255, 0.95);
			backdrop-filter: blur(10px);
			padding: 20px 30px;
			border-radius: 15px;
			margin-bottom: 30px;
			box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
			display: flex;
			justify-content: space-between;
			align-items: center;
			animation: slideDown 0.5s ease-out;
		}
		
		@keyframes slideDown {
			from {
				opacity: 0;
				transform: translateY(-20px);
			}
			to {
				opacity: 1;
				transform: translateY(0);
			}
		}
		
		.search-info h1 {
			font-size: 1.8em;
			color: #333;
			margin-bottom: 5px;
		}
		
		.search-query {
			color: #667eea;
			font-weight: bold;
		}
		
		.search-meta {
			color: #666;
			font-size: 0.9em;
			margin-top: 5px;
		}
		
		.back-link {
			background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
			color: white;
			text-decoration: none;
			padding: 12px 24px;
			border-radius: 25px;
			transition: all 0.3s ease;
			display: inline-block;
		}
		
		.back-link:hover {
			transform: translateY(-2px);
			box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
		}
		
		.results-container {
			display: grid;
			grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
			gap: 20px;
			animation: fadeIn 0.8s ease-out;
			margin-bottom: 30px;
		}
		
		@keyframes fadeIn {
			from { opacity: 0; }
			to { opacity: 1; }
		}
		
		.result-card {
			background: rgba(255, 255, 255, 0.95);
			backdrop-filter: blur(10px);
			border-radius: 15px;
			padding: 25px;
			box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
			transition: all 0.3s ease;
			animation: fadeInUp 0.6s ease-out;
			animation-fill-mode: both;
		}
		
		@keyframes fadeInUp {
			from {
				opacity: 0;
				transform: translateY(20px);
			}
			to {
				opacity: 1;
				transform: translateY(0);
			}
		}
		
		.result-card:hover {
			transform: translateY(-5px);
			box-shadow: 0 12px 48px rgba(0, 0, 0, 0.15);
		}
		
		.result-header {
			display: flex;
			justify-content: space-between;
			align-items: start;
			margin-bottom: 15px;
		}
		
		.result-header h3 {
			color: #333;
			font-size: 1.3em;
			word-break: break-word;
			flex: 1;
		}
		
		.stars {
			background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
			color: #333;
			padding: 5px 12px;
			border-radius: 20px;
			font-size: 0.9em;
			white-space: nowrap;
			margin-left: 10px;
		}
		
		.description {
			color: #666;
			line-height: 1.6;
			margin-bottom: 15px;
			min-height: 48px;
		}
		
		.pull-command {
			background: #2d2d2d;
			color: #50fa7b;
			padding: 12px 15px;
			border-radius: 8px;
			margin-bottom: 15px;
			font-family: 'Courier New', monospace;
			font-size: 13px;
			display: flex;
			align-items: center;
			gap: 10px;
			position: relative;
		}
		
		.pull-command code {
			flex: 1;
			word-break: break-all;
		}
		
		.copy-btn {
			background: rgba(255, 255, 255, 0.1);
			border: 1px solid rgba(255, 255, 255, 0.2);
			color: #fff;
			padding: 6px 10px;
			border-radius: 4px;
			cursor: pointer;
			transition: all 0.3s ease;
			display: flex;
			align-items: center;
			gap: 5px;
		}
		
		.copy-btn:hover {
			background: rgba(255, 255, 255, 0.2);
		}
		
		.copy-btn.copied {
			background: #50fa7b;
			color: #2d2d2d;
		}
		
		.result-footer {
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding-top: 15px;
			border-top: 1px solid rgba(0, 0, 0, 0.1);
			flex-wrap: wrap;
			gap: 10px;
		}
		
		.pulls {
			color: #999;
			font-size: 0.9em;
		}
		
		.official-badge {
			color: #667eea;
			font-size: 0.85em;
			font-weight: 600;
		}
		
		.view-link {
			color: #667eea;
			text-decoration: none;
			font-weight: 500;
			transition: all 0.3s ease;
		}
		
		.view-link:hover {
			color: #764ba2;
		}
		
		.no-results {
			background: rgba(255, 255, 255, 0.95);
			backdrop-filter: blur(10px);
			padding: 60px 40px;
			border-radius: 15px;
			text-align: center;
			box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
		}
		
		.no-results h2 {
			color: #333;
			margin-bottom: 15px;
		}
		
		.no-results p {
			color: #666;
		}
		
		/* Pagination */
		.pagination {
			display: flex;
			justify-content: center;
			align-items: center;
			gap: 8px;
			margin: 30px 0;
			flex-wrap: wrap;
		}
		
		.page-btn {
			background: rgba(255, 255, 255, 0.95);
			color: #667eea;
			padding: 10px 16px;
			border-radius: 8px;
			text-decoration: none;
			transition: all 0.3s ease;
			font-weight: 500;
			box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		}
		
		.page-btn:hover {
			background: #667eea;
			color: white;
			transform: translateY(-2px);
			box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
		}
		
		.page-btn.active {
			background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
			color: white;
			cursor: default;
		}
		
		.page-dots {
			color: rgba(255, 255, 255, 0.8);
			padding: 0 5px;
		}
		
		@media (max-width: 768px) {
			.header {
				flex-direction: column;
				gap: 15px;
				padding: 15px 20px;
			}
			
			.search-info h1 {
				font-size: 1.4em;
			}
			
			.results-container {
				grid-template-columns: 1fr;
			}
			
			.result-card {
				padding: 20px;
			}
			
			.pull-command {
				font-size: 11px;
			}
		}
		
		@media (max-width: 480px) {
			.search-info h1 {
				font-size: 1.2em;
			}
			
			.result-header {
				flex-direction: column;
				gap: 10px;
			}
			
			.stars {
				align-self: flex-start;
			}
		}
		</style>
	</head>
	<body>
		<div class="container">
			<div class="header">
				<div class="search-info">
					<h1>搜索结果: <span class="search-query">"${query}"</span></h1>
					<div class="search-meta">共找到 ${totalCount} 个结果 - 第 ${page} 页</div>
				</div>
				<a href="/" class="back-link">← 返回首页</a>
			</div>
			
			${results.length > 0 ? `
				<div class="results-container">
					${resultsHTML}
				</div>
				${paginationHTML}
			` : `
				<div class="no-results">
					<h2>未找到结果</h2>
					<p>请尝试其他关键词搜索</p>
				</div>
			`}
		</div>
		
		<script>
		function copyToClipboard(text, button) {
			if (navigator.clipboard && navigator.clipboard.writeText) {
				navigator.clipboard.writeText(text).then(() => {
					button.classList.add('copied');
					button.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/></svg>';
					setTimeout(() => {
						button.classList.remove('copied');
						button.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/><path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/></svg>';
					}, 2000);
				}).catch(err => {
					console.error('Failed to copy:', err);
					fallbackCopyTextToClipboard(text);
				});
			} else {
				fallbackCopyTextToClipboard(text);
			}
		}
		
		function fallbackCopyTextToClipboard(text) {
			const textArea = document.createElement("textarea");
			textArea.value = text;
			textArea.style.position = "fixed";
			textArea.style.top = "-9999px";
			document.body.appendChild(textArea);
			textArea.focus();
			textArea.select();
			
			try {
				document.execCommand('copy');
				console.log('Fallback: Copied to clipboard');
			} catch (err) {
				console.error('Fallback: Failed to copy', err);
			}
			
			document.body.removeChild(textArea);
		}
		</script>
	</body>
	</html>
	`;
	return text;
}
function formatNumber(num) {
	if (num >= 1000000000) {
		return (num / 1000000000).toFixed(1) + 'B';
	}
	if (num >= 1000000) {
		return (num / 1000000).toFixed(1) + 'M';
	}
	if (num >= 1000) {
		return (num / 1000).toFixed(1) + 'K';
	}
	return num.toString();
}

// ============================================================================
// MAIN HANDLER - Core proxy logic with error isolation
// ============================================================================

export default {
	async fetch(request, env, ctx) {
		try {
			// 核心代理逻辑包装在 try-catch 中，确保基本功能不受UI模块影响
			return await handleRequest(request, env, ctx);
		} catch (error) {
			console.error('Worker error:', error);
			// 即使出错也返回友好的错误页面
			return new Response('Service temporarily unavailable. Docker registry proxy is still functional for pull operations.', {
				status: 503,
				headers: {
					'Content-Type': 'text/plain; charset=UTF-8',
				},
			});
		}
	}
};

/**
 * 主请求处理函数
 * @param {Request} request 请求对象
 * @param {Object} env 环境变量
 * @param {Object} ctx 上下文
 * @returns {Promise<Response>}
 */
async function handleRequest(request, env, ctx) {
		const getReqHeader = (key) => request.headers.get(key); // 获取请求头

		let url = new URL(request.url); // 解析请求URL
		const userAgentHeader = request.headers.get('User-Agent');
		const userAgent = userAgentHeader ? userAgentHeader.toLowerCase() : "null";
		if (env.UA) 屏蔽爬虫UA = 屏蔽爬虫UA.concat(await ADD(env.UA));
		workers_url = `https://${url.hostname}`;
		const pathname = url.pathname;

		// 获取请求参数中的 ns
		const ns = url.searchParams.get('ns'); 
		const hostname = url.searchParams.get('hubhost') || url.hostname;
		const hostTop = hostname.split('.')[0]; // 获取主机名的第一部分

		let checkHost; // 在这里定义 checkHost 变量
		// 如果存在 ns 参数，优先使用它来确定 hub_host
		if (ns) {
			if (ns === 'docker.io') {
				hub_host = 'registry-1.docker.io'; // 设置上游地址为 registry-1.docker.io
			} else {
				hub_host = ns; // 直接使用 ns 作为 hub_host
			}
		} else {
			checkHost = routeByHosts(hostTop);
			hub_host = checkHost[0]; // 获取上游地址
		}

		const fakePage = checkHost ? checkHost[1] : false; // 确保 fakePage 不为 undefined
		console.log(`域名头部: ${hostTop}\n反代地址: ${hub_host}\n伪装首页: ${fakePage}`);
		const isUuid = isUUID(pathname.split('/')[1].split('/')[0]);

		// ========================================================================
		// SEARCH MODULE - 搜索功能 (isolated, won't break proxy)
		// ========================================================================
		
		// 处理搜索请求
		if (pathname === '/search') {
			try {
				const query = url.searchParams.get('q');
				const page = parseInt(url.searchParams.get('page') || '1');
				if (query) {
					// 调用 Docker Hub API 搜索 - 使用自定义分页
					const searchUrl = `https://registry.hub.docker.com/v2/search/repositories/?query=${encodeURIComponent(query)}&page=${page}&page_size=20`;
					const searchResponse = await fetch(searchUrl, { 
						headers: { 'User-Agent': getReqHeader("User-Agent") || 'Mozilla/5.0' }
					});
					const searchData = await searchResponse.json();
					
					const results = searchData.results || [];
					const totalCount = searchData.count || 0;
					return new Response(await searchResultsPage(query, results, page, totalCount, url.hostname), {
						headers: {
							'Content-Type': 'text/html; charset=UTF-8',
						},
					});
				}
			} catch (error) {
				console.error('Search error:', error);
				// 搜索失败也返回空结果页面
				const query = url.searchParams.get('q') || '';
				const page = parseInt(url.searchParams.get('page') || '1');
				return new Response(await searchResultsPage(query, [], page, 0, url.hostname), {
					headers: {
						'Content-Type': 'text/html; charset=UTF-8',
					},
				});
			}
		}

		// ========================================================================
		// CRAWLER PROTECTION - 爬虫屏蔽 (optional feature)
		// ========================================================================

		// ========================================================================
		// CRAWLER PROTECTION - 爬虫屏蔽 (optional feature)
		// ========================================================================
		
		if (屏蔽爬虫UA.some(fxxk => userAgent.includes(fxxk)) && 屏蔽爬虫UA.length > 0) {
			try {
				// 首页改成一个nginx伪装页
				return new Response(await nginx(), {
					headers: {
						'Content-Type': 'text/html; charset=UTF-8',
					},
				});
			} catch (error) {
				console.error('Nginx page error:', error);
				// 如果伪装页面失败，返回简单的响应
				return new Response('Welcome', { status: 200 });
			}
		}

		// ========================================================================
		// WEB UI ROUTES - 网页界面路由 (isolated from proxy logic)
		// ========================================================================

		// ========================================================================
		// WEB UI ROUTES - 网页界面路由 (isolated from proxy logic)
		// ========================================================================

		const conditions = [
			isUuid,
			pathname.includes('/_'),
			pathname.includes('/r/'),
			pathname.includes('/v2/repositories'),
			pathname.includes('/v2/user'),
			pathname.includes('/v2/orgs'),
			pathname.includes('/v2/_catalog'),
			pathname.includes('/v2/categories'),
			pathname.includes('/v2/feature-flags'),
			pathname.includes('source'),
			pathname == '/',
			pathname == '/favicon.ico',
			pathname == '/auth/profile',
		];

		if (conditions.some(condition => condition) && (fakePage === true || hostTop == 'docker')) {
			try {
				if (env.URL302) {
					return Response.redirect(env.URL302, 302);
				} else if (env.URL) {
					if (env.URL.toLowerCase() == 'nginx') {
						//首页改成一个nginx伪装页
						return new Response(await nginx(), {
							headers: {
								'Content-Type': 'text/html; charset=UTF-8',
							},
						});
					} else return fetch(new Request(env.URL, request));
				} else if (url.pathname == '/'){
					// 显示搜索界面
					return new Response(await searchInterface(url.hostname), {
						headers: {
						  'Content-Type': 'text/html; charset=UTF-8',
						},
					});
				}
			} catch (error) {
				console.error('UI route error:', error);
				// UI错误不影响代理功能，继续处理
			}
			
			// Docker Hub API 代理 - 用于网页浏览和搜索
			try {
				const newUrl = new URL("https://registry.hub.docker.com" + pathname + url.search);

				// 复制原始请求的标头
				const headers = new Headers(request.headers);

				// 确保 Host 头部被替换为 hub.docker.com
				headers.set('Host', 'registry.hub.docker.com');

				const newRequest = new Request(newUrl, {
						method: request.method,
						headers: headers,
						body: request.method !== 'GET' && request.method !== 'HEAD' ? await request.blob() : null,
						redirect: 'follow'
				});

				return fetch(newRequest);
			} catch (error) {
				console.error('Docker Hub API proxy error:', error);
				return new Response('Unable to fetch from Docker Hub', { status: 502 });
			}
		}

		// ========================================================================
		// CORE PROXY LOGIC - 核心代理逻辑 (critical path, must always work)
		// ========================================================================

		// 修改包含 %2F 和 %3A 的请求
		if (!/%2F/.test(url.search) && /%3A/.test(url.toString())) {
			let modifiedUrl = url.toString().replace(/%3A(?=.*?&)/, '%3Alibrary%2F');
			url = new URL(modifiedUrl);
			console.log(`handle_url: ${url}`);
		}

		// 处理token请求
		if (url.pathname.includes('/token')) {
			let token_parameter = {
				headers: {
					'Host': 'auth.docker.io',
					'User-Agent': getReqHeader("User-Agent"),
					'Accept': getReqHeader("Accept"),
					'Accept-Language': getReqHeader("Accept-Language"),
					'Accept-Encoding': getReqHeader("Accept-Encoding"),
					'Connection': 'keep-alive',
					'Cache-Control': 'max-age=0'
				}
			};
			let token_url = auth_url + url.pathname + url.search;
			return fetch(new Request(token_url, request), token_parameter);
		}

		// 修改 /v2/ 请求路径
		if ( hub_host == 'registry-1.docker.io' && /^\/v2\/[^/]+\/[^/]+\/[^/]+$/.test(url.pathname) && !/^\/v2\/library/.test(url.pathname)) {
			//url.pathname = url.pathname.replace(/\/v2\//, '/v2/library/');
			url.pathname = '/v2/library/' + url.pathname.split('/v2/')[1];
			console.log(`modified_url: ${url.pathname}`);
		}

		// 更改请求的主机名
		url.hostname = hub_host;

		// 构造请求参数
		let parameter = {
			headers: {
				'Host': hub_host,
				'User-Agent': getReqHeader("User-Agent"),
				'Accept': getReqHeader("Accept"),
				'Accept-Language': getReqHeader("Accept-Language"),
				'Accept-Encoding': getReqHeader("Accept-Encoding"),
				'Connection': 'keep-alive',
				'Cache-Control': 'max-age=0'
			},
			cacheTtl: 3600 // 缓存时间
		};

		// 添加Authorization头
		if (request.headers.has("Authorization")) {
			parameter.headers.Authorization = getReqHeader("Authorization");
		}

		// 发起请求并处理响应
		let original_response = await fetch(new Request(url, request), parameter);
		let original_response_clone = original_response.clone();
		let original_text = original_response_clone.body;
		let response_headers = original_response.headers;
		let new_response_headers = new Headers(response_headers);
		let status = original_response.status;

		// 修改 Www-Authenticate 头
		if (new_response_headers.get("Www-Authenticate")) {
			let auth = new_response_headers.get("Www-Authenticate");
			let re = new RegExp(auth_url, 'g');
			new_response_headers.set("Www-Authenticate", response_headers.get("Www-Authenticate").replace(re, workers_url));
		}

		// 处理重定向
		if (new_response_headers.get("Location")) {
			return httpHandler(request, new_response_headers.get("Location"));
		}

		// 返回修改后的响应
		let response = new Response(original_text, {
			status,
			headers: new_response_headers
		});
		return response;
	} catch (error) {
		console.error('Core proxy error:', error);
		return new Response('Proxy error', { status: 502 });
	}
}

// ============================================================================
// PROXY HELPERS - 代理辅助函数
// ============================================================================

/**
 * 处理HTTP请求
 * @param {Request} req 请求对象
 * @param {string} pathname 请求路径
 */
function httpHandler(req, pathname) {
	const reqHdrRaw = req.headers;

	// 处理预检请求
	if (req.method === 'OPTIONS' &&
		reqHdrRaw.has('access-control-request-headers')
	) {
		return new Response(null, PREFLIGHT_INIT);
	}

	let rawLen = '';

	const reqHdrNew = new Headers(reqHdrRaw);

	const refer = reqHdrNew.get('referer');

	let urlStr = pathname;

	const urlObj = newUrl(urlStr);

	/** @type {RequestInit} */
	const reqInit = {
		method: req.method,
		headers: reqHdrNew,
		redirect: 'follow',
		body: req.body
	};
	return proxy(urlObj, reqInit, rawLen);
}

/**
 * 代理请求
 * @param {URL} urlObj URL对象
 * @param {RequestInit} reqInit 请求初始化对象
 * @param {string} rawLen 原始长度
 */
async function proxy(urlObj, reqInit, rawLen) {
	const res = await fetch(urlObj.href, reqInit);
	const resHdrOld = res.headers;
	const resHdrNew = new Headers(resHdrOld);

	// 验证长度
	if (rawLen) {
		const newLen = resHdrOld.get('content-length') || '';
		const badLen = (rawLen !== newLen);

		if (badLen) {
			return makeRes(res.body, 400, {
				'--error': `bad len: ${newLen}, except: ${rawLen}`,
				'access-control-expose-headers': '--error',
			});
		}
	}
	const status = res.status;
	resHdrNew.set('access-control-expose-headers', '*');
	resHdrNew.set('access-control-allow-origin', '*');
	resHdrNew.set('Cache-Control', 'max-age=1500');

	// 删除不必要的头
	resHdrNew.delete('content-security-policy');
	resHdrNew.delete('content-security-policy-report-only');
	resHdrNew.delete('clear-site-data');

	return new Response(res.body, {
		status,
		headers: resHdrNew
	});
}
