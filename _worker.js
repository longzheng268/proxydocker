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

/**
 * Docker Hub 专注的赛博朋克风格界面 - 增强版
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
		<title>🐳 Docker Hub 加速代理 - 专业版</title>
		<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 18' fill='%2300ffff'%3E%3Cpath d='M23.763 6.886c-.065-.053-.673-.512-1.954-.512-.32 0-.659.03-1.01.087-.248-1.703-1.651-2.533-1.716-2.57l-.345-.2-.227.328a4.596 4.596 0 0 0-.611 1.433c-.23.972-.09 1.884.403 2.666-.596.331-1.546.418-1.744.42H.752a.753.753 0 0 0-.75.749c-.007 1.456.233 2.864.692 4.07.545 1.43 1.355 2.483 2.409 3.13 1.181.725 3.104 1.14 5.276 1.14 1.016 0 2.03-.092 2.93-.266 1.417-.273 2.705-.742 3.826-1.391a10.497 10.497 0 0 0 2.61-2.14c1.252-1.42 1.998-3.005 2.553-4.408.075.003.148.005.221.005 1.371 0 2.215-.55 2.68-1.01.505-.5.685-.998.704-1.053L24 7.076l-.237-.19Z'/%3E%3C/svg%3E">
		<style>
		* {
			margin: 0;
			padding: 0;
			box-sizing: border-box;
		}

		body {
			font-family: 'Courier New', 'Consolas', monospace;
			background: #0a0e27;
			min-height: 100vh;
			padding: 20px;
			position: relative;
			overflow-x: hidden;
		}

		/* 赛博朋克网格背景 */
		body::before {
			content: '';
			position: fixed;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			background: 
				linear-gradient(90deg, rgba(0, 255, 255, 0.03) 1px, transparent 1px),
				linear-gradient(rgba(0, 255, 255, 0.03) 1px, transparent 1px);
			background-size: 50px 50px;
			animation: grid-move 20s linear infinite;
			z-index: 0;
		}

		@keyframes grid-move {
			0% { transform: translateY(0); }
			100% { transform: translateY(50px); }
		}

		/* 扫描线效果 */
		body::after {
			content: '';
			position: fixed;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			background: linear-gradient(
				transparent 0%,
				rgba(0, 255, 255, 0.05) 50%,
				transparent 100%
			);
			background-size: 100% 4px;
			animation: scan 8s linear infinite;
			pointer-events: none;
			z-index: 999;
		}

		@keyframes scan {
			0% { transform: translateY(-100%); }
			100% { transform: translateY(100vh); }
		}

		/* 鼠标追踪光效 */
		#cursor-glow {
			position: fixed;
			width: 600px;
			height: 600px;
			border-radius: 50%;
			background: radial-gradient(
				circle,
				rgba(0, 255, 255, 0.3) 0%,
				rgba(255, 0, 255, 0.2) 30%,
				rgba(0, 255, 255, 0.1) 50%,
				transparent 70%
			);
			pointer-events: none;
			transform: translate(-50%, -50%);
			z-index: 1;
			transition: opacity 0.3s ease;
			opacity: 0;
			filter: blur(40px);
			mix-blend-mode: screen;
		}

		body:hover #cursor-glow {
			opacity: 1;
		}

		/* 主容器 */
		.container {
			background: rgba(10, 14, 39, 0.85);
			border: 2px solid rgba(0, 255, 255, 0.3);
			box-shadow: 
				0 0 40px rgba(0, 255, 255, 0.3),
				0 0 80px rgba(255, 0, 255, 0.2),
				inset 0 0 60px rgba(0, 255, 255, 0.05);
			max-width: 1400px;
			width: 100%;
			margin: 0 auto;
			padding: 40px;
			backdrop-filter: blur(20px);
			position: relative;
			z-index: 2;
			animation: container-glitch 0.8s ease-out;
			clip-path: polygon(
				0 0, 
				calc(100% - 20px) 0, 
				100% 20px, 
				100% 100%, 
				20px 100%, 
				0 calc(100% - 20px)
			);
		}

		/* 容器边角装饰 */
		.container::before,
		.container::after {
			content: '';
			position: absolute;
			width: 30px;
			height: 30px;
			border: 2px solid rgba(0, 255, 255, 0.8);
			animation: corner-pulse 2s ease-in-out infinite;
		}

		.container::before {
			top: -2px;
			left: -2px;
			border-right: none;
			border-bottom: none;
			box-shadow: -5px -5px 20px rgba(0, 255, 255, 0.5);
		}

		.container::after {
			bottom: -2px;
			right: -2px;
			border-left: none;
			border-top: none;
			box-shadow: 5px 5px 20px rgba(255, 0, 255, 0.5);
		}

		@keyframes corner-pulse {
			0%, 100% { opacity: 1; }
			50% { opacity: 0.5; }
		}

		@keyframes container-glitch {
			0% {
				opacity: 0;
				transform: translateX(-20px) skew(-5deg);
			}
			20% {
				transform: translateX(10px) skew(5deg);
			}
			100% {
				opacity: 1;
				transform: translateX(0) skew(0);
			}
		}

		h1 {
			text-align: center;
			color: #00ffff;
			margin-bottom: 10px;
			font-size: 2.5em;
			font-weight: 700;
			text-transform: uppercase;
			letter-spacing: 4px;
			animation: title-glitch 0.8s ease-out, neon-glow 2s ease-in-out infinite;
			text-shadow: 
				0 0 10px rgba(0, 255, 255, 0.8),
				0 0 20px rgba(0, 255, 255, 0.6),
				0 0 30px rgba(0, 255, 255, 0.4);
		}

		@keyframes neon-glow {
			0%, 100% {
				text-shadow: 
					0 0 10px rgba(0, 255, 255, 0.8),
					0 0 20px rgba(0, 255, 255, 0.6),
					0 0 30px rgba(0, 255, 255, 0.4);
			}
			50% {
				text-shadow: 
					0 0 20px rgba(0, 255, 255, 1),
					0 0 30px rgba(0, 255, 255, 0.8),
					0 0 40px rgba(0, 255, 255, 0.6),
					0 0 60px rgba(255, 0, 255, 0.4);
			}
		}

		.subtitle {
			text-align: center;
			color: #ff00ff;
			margin-bottom: 40px;
			font-size: 1.1em;
			text-transform: uppercase;
			letter-spacing: 3px;
			font-weight: 600;
			animation: subtitle-flicker 3s ease-in-out infinite;
			text-shadow: 0 0 10px rgba(255, 0, 255, 0.8);
		}

		@keyframes subtitle-flicker {
			0%, 100% { opacity: 1; }
			50% { opacity: 0.8; }
		}

		/* 标签页 */
		.tabs {
			display: flex;
			gap: 10px;
			margin-bottom: 30px;
			border-bottom: 2px solid rgba(0, 255, 255, 0.3);
			flex-wrap: wrap;
		}

		.tab {
			padding: 12px 24px;
			background: transparent;
			border: 2px solid rgba(0, 255, 255, 0.3);
			color: #00ffff;
			font-size: 14px;
			cursor: pointer;
			transition: all 0.3s ease;
			font-weight: 600;
			text-transform: uppercase;
			letter-spacing: 2px;
			clip-path: polygon(10px 0, 100% 0, calc(100% - 10px) 100%, 0 100%);
			white-space: nowrap;
		}

		.tab:hover {
			border-color: rgba(0, 255, 255, 0.8);
			text-shadow: 0 0 10px rgba(0, 255, 255, 0.8);
			transform: translateY(-2px);
			box-shadow: 0 5px 15px rgba(0, 255, 255, 0.3);
		}

		.tab.active {
			background: rgba(0, 255, 255, 0.2);
			border-color: rgba(0, 255, 255, 0.8);
			text-shadow: 0 0 10px rgba(0, 255, 255, 1);
			box-shadow: 
				0 0 20px rgba(0, 255, 255, 0.5),
				inset 0 0 20px rgba(0, 255, 255, 0.2);
		}

		.tab-content {
			display: none;
		}

		.tab-content.active {
			display: block;
			animation: fadeIn 0.3s ease;
		}

		@keyframes fadeIn {
			from { opacity: 0; transform: translateY(10px); }
			to { opacity: 1; transform: translateY(0); }
		}

		/* 搜索容器 */
		.search-container {
			display: flex;
			gap: 10px;
			margin: 30px 0;
		}

		.search-input {
			flex: 1;
			padding: 15px 20px;
			background: rgba(0, 0, 0, 0.5);
			border: 2px solid rgba(0, 255, 255, 0.3);
			color: #00ffff;
			font-size: 16px;
			font-family: 'Courier New', monospace;
			transition: all 0.3s ease;
			box-shadow: inset 0 0 20px rgba(0, 255, 255, 0.1);
		}

		.search-input::placeholder {
			color: rgba(0, 255, 255, 0.5);
		}

		.search-input:focus {
			outline: none;
			border-color: rgba(0, 255, 255, 0.8);
			box-shadow: 
				0 0 20px rgba(0, 255, 255, 0.3),
				inset 0 0 20px rgba(0, 255, 255, 0.2);
			text-shadow: 0 0 5px rgba(0, 255, 255, 0.5);
		}

		.search-button {
			padding: 15px 30px;
			background: linear-gradient(135deg, rgba(0, 255, 255, 0.3) 0%, rgba(255, 0, 255, 0.3) 100%);
			color: #00ffff;
			border: 2px solid rgba(0, 255, 255, 0.5);
			font-size: 16px;
			font-weight: 700;
			cursor: pointer;
			transition: all 0.3s ease;
			position: relative;
			overflow: hidden;
			text-transform: uppercase;
			letter-spacing: 2px;
			clip-path: polygon(10px 0, 100% 0, calc(100% - 10px) 100%, 0 100%);
			box-shadow: 0 0 20px rgba(0, 255, 255, 0.3);
			white-space: nowrap;
		}

		.search-button:hover {
			transform: translateY(-3px) scale(1.05);
			box-shadow: 
				0 0 30px rgba(0, 255, 255, 0.6),
				0 0 60px rgba(255, 0, 255, 0.3);
			border-color: rgba(0, 255, 255, 1);
			text-shadow: 0 0 10px rgba(0, 255, 255, 1);
		}

		/* 使用说明区域 */
		.usage-section {
			background: rgba(0, 20, 40, 0.6);
			padding: 25px;
			border: 1px solid rgba(0, 255, 255, 0.3);
			margin-bottom: 20px;
			box-shadow: inset 0 0 30px rgba(0, 255, 255, 0.1);
			clip-path: polygon(0 0, calc(100% - 15px) 0, 100% 15px, 100% 100%, 0 100%);
		}

		.usage-section h3 {
			color: #00ffff;
			margin-bottom: 15px;
			font-size: 1.3em;
			display: flex;
			align-items: center;
			gap: 10px;
			text-transform: uppercase;
			letter-spacing: 2px;
			text-shadow: 0 0 10px rgba(0, 255, 255, 0.8);
		}

		.usage-section h3::before {
			content: '▶';
			color: #ff00ff;
			animation: blink 1.5s ease-in-out infinite;
		}

		@keyframes blink {
			0%, 100% { opacity: 1; }
			50% { opacity: 0.3; }
		}

		/* 代码块 */
		.code-block {
			background: rgba(0, 0, 0, 0.8);
			color: #00ff00;
			padding: 15px;
			border: 1px solid rgba(0, 255, 0, 0.3);
			border-left: 3px solid rgba(0, 255, 255, 0.8);
			margin: 10px 0;
			overflow-x: auto;
			font-family: 'Courier New', monospace;
			font-size: 14px;
			line-height: 1.6;
			position: relative;
			box-shadow: 
				0 0 20px rgba(0, 255, 0, 0.2),
				inset 0 0 20px rgba(0, 255, 255, 0.05);
		}

		.code-block code {
			color: #00ff00;
			text-shadow: 0 0 5px rgba(0, 255, 0, 0.5);
		}

		.copy-button {
			position: absolute;
			top: 10px;
			right: 10px;
			padding: 5px 15px;
			background: rgba(0, 255, 255, 0.2);
			border: 1px solid rgba(0, 255, 255, 0.5);
			color: #00ffff;
			font-size: 12px;
			cursor: pointer;
			transition: all 0.3s ease;
			text-transform: uppercase;
			letter-spacing: 1px;
			z-index: 10;
		}

		.copy-button:hover {
			background: rgba(0, 255, 255, 0.4);
			box-shadow: 0 0 15px rgba(0, 255, 255, 0.6);
		}

		/* 功能卡片 */
		.feature-grid {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
			gap: 15px;
			margin-top: 20px;
		}

		.feature-card {
			background: rgba(0, 20, 40, 0.8);
			padding: 20px;
			border: 2px solid rgba(0, 255, 255, 0.3);
			box-shadow: 0 0 20px rgba(0, 255, 255, 0.2);
			transition: all 0.3s ease;
			cursor: pointer;
			clip-path: polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px);
		}

		.feature-card:hover {
			transform: translateY(-5px) scale(1.02);
			box-shadow: 
				0 0 30px rgba(0, 255, 255, 0.4),
				0 0 60px rgba(255, 0, 255, 0.2);
			border-color: rgba(0, 255, 255, 0.8);
		}

		.feature-card h4 {
			color: #00ffff;
			margin-bottom: 10px;
			font-size: 1.1em;
			text-transform: uppercase;
			letter-spacing: 2px;
			text-shadow: 0 0 10px rgba(0, 255, 255, 0.8);
		}

		.feature-card p {
			color: #a0a0ff;
			line-height: 1.6;
			font-size: 0.9em;
		}

		.example {
			margin: 15px 0;
		}

		.example-label {
			color: #ff00ff;
			font-weight: 600;
			margin-bottom: 8px;
			display: flex;
			align-items: center;
			gap: 8px;
		}

		.example-label::before {
			content: '▸';
			font-size: 1.2em;
		}

		.registry-list {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
			gap: 15px;
			margin-top: 15px;
		}

		.registry-item {
			background: rgba(0, 0, 0, 0.6);
			padding: 15px;
			border: 1px solid rgba(0, 255, 255, 0.3);
			border-left: 3px solid rgba(255, 0, 255, 0.8);
		}

		.registry-item h4 {
			color: #ff00ff;
			margin-bottom: 8px;
			font-size: 1.1em;
		}

		.registry-item p {
			color: #a0a0ff;
			font-size: 0.9em;
			margin-bottom: 8px;
		}

		.registry-item .code-inline {
			background: rgba(0, 255, 255, 0.1);
			color: #00ff00;
			padding: 2px 8px;
			border-radius: 3px;
			font-family: 'Courier New', monospace;
			font-size: 0.85em;
		}

		.footer {
			text-align: center;
			margin-top: 40px;
			padding-top: 20px;
			border-top: 1px solid rgba(0, 255, 255, 0.3);
			color: #00ffff;
			font-size: 0.9em;
			text-shadow: 0 0 5px rgba(0, 255, 255, 0.5);
		}

		.footer a {
			color: #ff00ff;
			text-decoration: none;
			text-shadow: 0 0 5px rgba(255, 0, 255, 0.5);
			transition: all 0.3s ease;
		}

		.footer a:hover {
			color: #00ffff;
			text-shadow: 0 0 10px rgba(0, 255, 255, 0.8);
		}

		.two-column {
			display: grid;
			grid-template-columns: 1fr 1fr;
			gap: 20px;
		}

		@media (max-width: 1024px) {
			.two-column { grid-template-columns: 1fr; }
		}

		@media (max-width: 768px) {
			.container { padding: 20px; }
			h1 { font-size: 1.8em; }
			.search-container { flex-direction: column; }
			.feature-grid { grid-template-columns: 1fr; }
			.tabs { overflow-x: auto; }
			.registry-list { grid-template-columns: 1fr; }
		}
		</style>
	</head>
	<body>
		<!-- 鼠标追踪光效 -->
		<div id="cursor-glow"></div>
		
		<div class="container">
			<h1>🐳 Docker Hub 加速代理</h1>
			<p class="subtitle">专业的 Docker 镜像代理服务 - 快速 · 稳定 · 免费</p>

			<div class="tabs">
				<button class="tab active" onclick="switchTab('search')">🔍 搜索镜像</button>
				<button class="tab" onclick="switchTab('convert')">🔄 镜像转换</button>
				<button class="tab" onclick="switchTab('config')">⚙️ 配置指南</button>
				<button class="tab" onclick="switchTab('compose')">📦 Docker Compose</button>
				<button class="tab" onclick="switchTab('registry')">🌐 多仓库支持</button>
				<button class="tab" onclick="switchTab('advanced')">🚀 高级功能</button>
			</div>

			<!-- 搜索镜像标签页 -->
			<div id="search-content" class="tab-content active">
				<div class="search-container">
					<input type="text" class="search-input" id="search-input" placeholder="搜索 Docker 镜像，例如：nginx, redis, mysql, postgres...">
					<button class="search-button" onclick="performSearch()"><span>🔍 搜索</span></button>
				</div>

				<div class="usage-section">
					<h3>热门镜像</h3>
					<div class="feature-grid">
						<div class="feature-card" onclick="quickSearch('nginx')">
							<h4>🌐 Nginx</h4>
							<p>高性能 Web 服务器</p>
						</div>
						<div class="feature-card" onclick="quickSearch('redis')">
							<h4>💾 Redis</h4>
							<p>内存数据库</p>
						</div>
						<div class="feature-card" onclick="quickSearch('mysql')">
							<h4>🗄️ MySQL</h4>
							<p>关系型数据库</p>
						</div>
						<div class="feature-card" onclick="quickSearch('postgres')">
							<h4>🐘 PostgreSQL</h4>
							<p>高级数据库</p>
						</div>
						<div class="feature-card" onclick="quickSearch('node')">
							<h4>⬢ Node.js</h4>
							<p>JavaScript 运行时</p>
						</div>
						<div class="feature-card" onclick="quickSearch('python')">
							<h4>🐍 Python</h4>
							<p>Python 环境</p>
						</div>
						<div class="feature-card" onclick="quickSearch('golang')">
							<h4>🔷 Golang</h4>
							<p>Go 语言环境</p>
						</div>
						<div class="feature-card" onclick="quickSearch('alpine')">
							<h4>⛰️ Alpine</h4>
							<p>轻量级基础镜像</p>
						</div>
					</div>
				</div>

				<div class="usage-section">
					<h3>快速拉取示例</h3>
					<div class="two-column">
						<div>
							<div class="example">
								<div class="example-label">Web 服务器</div>
								<div class="code-block" style="position:relative;">
									<code>docker pull ${proxyDomain}/library/nginx:alpine</code>
									<button class="copy-button" onclick="copyText(this.previousElementSibling)">复制</button>
								</div>
							</div>
							<div class="example">
								<div class="example-label">数据库</div>
								<div class="code-block" style="position:relative;">
									<code>docker pull ${proxyDomain}/library/postgres:15</code>
									<button class="copy-button" onclick="copyText(this.previousElementSibling)">复制</button>
								</div>
							</div>
						</div>
						<div>
							<div class="example">
								<div class="example-label">缓存系统</div>
								<div class="code-block" style="position:relative;">
									<code>docker pull ${proxyDomain}/library/redis:7-alpine</code>
									<button class="copy-button" onclick="copyText(this.previousElementSibling)">复制</button>
								</div>
							</div>
							<div class="example">
								<div class="example-label">开发环境</div>
								<div class="code-block" style="position:relative;">
									<code>docker pull ${proxyDomain}/library/node:20-alpine</code>
									<button class="copy-button" onclick="copyText(this.previousElementSibling)">复制</button>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- 镜像转换标签页 -->
			<div id="convert-content" class="tab-content">
				<div class="search-container">
					<input type="text" class="search-input" id="convert-input" placeholder="输入镜像名称或 Docker Hub 链接，例如：nginx:latest, library/redis:alpine, https://hub.docker.com/_/mysql">
					<button class="search-button" onclick="convertImage()"><span>🔄 转换</span></button>
				</div>

				<div id="convert-result" style="display:none; margin-top: 20px;">
					<div class="usage-section">
						<h3>代理镜像地址</h3>
						<div class="code-block" style="position:relative;">
							<code id="proxy-address"></code>
							<button class="copy-button" onclick="copyText('proxy-address')">复制</button>
						</div>

						<h3 style="margin-top: 20px;">Docker 拉取命令</h3>
						<div class="code-block" style="position:relative;">
							<code id="pull-command"></code>
							<button class="copy-button" onclick="copyText('pull-command')">复制</button>
						</div>

						<h3 style="margin-top: 20px;">在 Docker Compose 中使用</h3>
						<div class="code-block" style="position:relative;">
							<code id="compose-usage"></code>
							<button class="copy-button" onclick="copyText('compose-usage')">复制</button>
						</div>
					</div>
				</div>

				<div class="usage-section">
					<h3>支持的输入格式</h3>
					<div class="example">
						<div class="example-label">官方镜像（简写）</div>
						<div class="code-block"><code>nginx:latest
redis:alpine
mysql:8.0</code></div>
					</div>
					<div class="example">
						<div class="example-label">官方镜像（完整）</div>
						<div class="code-block"><code>library/nginx:latest
library/redis:alpine</code></div>
					</div>
					<div class="example">
						<div class="example-label">用户镜像</div>
						<div class="code-block"><code>bitnami/postgresql:latest
grafana/grafana:latest</code></div>
					</div>
					<div class="example">
						<div class="example-label">Docker Hub 链接</div>
						<div class="code-block"><code>https://hub.docker.com/_/nginx
https://hub.docker.com/r/grafana/grafana</code></div>
					</div>
				</div>
			</div>

			<!-- 配置指南标签页 -->
			<div id="config-content" class="tab-content">
				<div class="usage-section">
					<h3>方法一：配置 Docker 镜像加速器（推荐）</h3>
					<p style="color: #a0a0ff; margin-bottom: 15px;">一次配置，全局生效。所有 docker pull 命令自动使用代理。</p>
					
					<div class="example">
						<div class="example-label">Step 1: 编辑配置文件</div>
						<div class="code-block" style="position:relative;">
							<code>sudo nano /etc/docker/daemon.json</code>
							<button class="copy-button" onclick="copyText(this.previousElementSibling)">复制</button>
						</div>
					</div>

					<div class="example">
						<div class="example-label">Step 2: 添加镜像源配置</div>
						<div class="code-block" style="position:relative;">
							<code>{
  "registry-mirrors": ["https://${proxyDomain}"],
  "max-concurrent-downloads": 10,
  "max-concurrent-uploads": 10
}</code>
							<button class="copy-button" onclick="copyText(this.previousElementSibling)">复制</button>
						</div>
					</div>

					<div class="example">
						<div class="example-label">Step 3: 重启 Docker 服务</div>
						<div class="code-block" style="position:relative;">
							<code>sudo systemctl daemon-reload
sudo systemctl restart docker

# 验证配置
docker info | grep "Registry Mirrors" -A 1</code>
							<button class="copy-button" onclick="copyText(this.previousElementSibling)">复制</button>
						</div>
					</div>
				</div>

				<div class="usage-section">
					<h3>方法二：直接使用代理地址</h3>
					<p style="color: #a0a0ff; margin-bottom: 15px;">无需配置，直接在命令中指定代理域名。</p>
					
					<div class="two-column">
						<div>
							<div class="example">
								<div class="example-label">拉取官方镜像</div>
								<div class="code-block" style="position:relative;">
									<code>docker pull ${proxyDomain}/library/nginx:latest</code>
									<button class="copy-button" onclick="copyText(this.previousElementSibling)">复制</button>
								</div>
							</div>
							<div class="example">
								<div class="example-label">拉取用户镜像</div>
								<div class="code-block" style="position:relative;">
									<code>docker pull ${proxyDomain}/bitnami/postgresql:latest</code>
									<button class="copy-button" onclick="copyText(this.previousElementSibling)">复制</button>
								</div>
							</div>
						</div>
						<div>
							<div class="example">
								<div class="example-label">运行容器</div>
								<div class="code-block" style="position:relative;">
									<code>docker run -d -p 80:80 \\
  ${proxyDomain}/library/nginx:alpine</code>
									<button class="copy-button" onclick="copyText(this.previousElementSibling)">复制</button>
								</div>
							</div>
							<div class="example">
								<div class="example-label">构建镜像时使用</div>
								<div class="code-block" style="position:relative;">
									<code>FROM ${proxyDomain}/library/node:20-alpine
WORKDIR /app
COPY . .
RUN npm install</code>
									<button class="copy-button" onclick="copyText(this.previousElementSibling)">复制</button>
								</div>
							</div>
						</div>
					</div>
				</div>

				<div class="usage-section">
					<h3>Windows Docker Desktop 配置</h3>
					<div class="example">
						<div class="example-label">通过图形界面配置</div>
						<p style="color: #a0a0ff; margin: 10px 0;">1. 打开 Docker Desktop</p>
						<p style="color: #a0a0ff; margin: 10px 0;">2. 点击设置（Settings）→ Docker Engine</p>
						<p style="color: #a0a0ff; margin: 10px 0;">3. 在 JSON 配置中添加：</p>
						<div class="code-block" style="position:relative;">
							<code>{
  "registry-mirrors": ["https://${proxyDomain}"]
}</code>
							<button class="copy-button" onclick="copyText(this.previousElementSibling)">复制</button>
						</div>
						<p style="color: #a0a0ff; margin: 10px 0;">4. 点击 "Apply & Restart"</p>
					</div>
				</div>
			</div>

			<!-- Docker Compose 标签页 -->
			<div id="compose-content" class="tab-content">
				<div class="usage-section">
					<h3>Docker Compose 使用示例</h3>
					<p style="color: #a0a0ff; margin-bottom: 15px;">在 docker-compose.yml 中直接使用代理镜像地址</p>

					<div class="example">
						<div class="example-label">完整的 LAMP 堆栈示例</div>
						<div class="code-block" style="position:relative;">
							<code>version: '3.8'

services:
  web:
    image: ${proxyDomain}/library/nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./html:/usr/share/nginx/html
    depends_on:
      - php

  php:
    image: ${proxyDomain}/library/php:8.2-fpm
    volumes:
      - ./html:/var/www/html

  mysql:
    image: ${proxyDomain}/library/mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: rootpass
      MYSQL_DATABASE: mydb
    volumes:
      - mysql_data:/var/lib/mysql

volumes:
  mysql_data:</code>
							<button class="copy-button" onclick="copyText(this.previousElementSibling)">复制</button>
						</div>
					</div>

					<div class="example">
						<div class="example-label">WordPress + MySQL 示例</div>
						<div class="code-block" style="position:relative;">
							<code>version: '3.8'

services:
  wordpress:
    image: ${proxyDomain}/library/wordpress:latest
    ports:
      - "8080:80"
    environment:
      WORDPRESS_DB_HOST: db
      WORDPRESS_DB_USER: wordpress
      WORDPRESS_DB_PASSWORD: wordpress
      WORDPRESS_DB_NAME: wordpress
    depends_on:
      - db

  db:
    image: ${proxyDomain}/library/mysql:8.0
    environment:
      MYSQL_DATABASE: wordpress
      MYSQL_USER: wordpress
      MYSQL_PASSWORD: wordpress
      MYSQL_ROOT_PASSWORD: rootpass
    volumes:
      - db_data:/var/lib/mysql

volumes:
  db_data:</code>
							<button class="copy-button" onclick="copyText(this.previousElementSibling)">复制</button>
						</div>
					</div>

					<div class="example">
						<div class="example-label">Node.js + MongoDB + Redis 示例</div>
						<div class="code-block" style="position:relative;">
							<code>version: '3.8'

services:
  app:
    image: ${proxyDomain}/library/node:20-alpine
    working_dir: /app
    volumes:
      - ./app:/app
    command: npm start
    ports:
      - "3000:3000"
    depends_on:
      - mongodb
      - redis

  mongodb:
    image: ${proxyDomain}/library/mongo:7
    volumes:
      - mongo_data:/data/db
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password

  redis:
    image: ${proxyDomain}/library/redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data

volumes:
  mongo_data:
  redis_data:</code>
							<button class="copy-button" onclick="copyText(this.previousElementSibling)">复制</button>
						</div>
					</div>
				</div>

				<div class="usage-section">
					<h3>Docker Compose 常用命令</h3>
					<div class="two-column">
						<div>
							<div class="example">
								<div class="example-label">启动服务</div>
								<div class="code-block" style="position:relative;">
									<code>docker-compose up -d</code>
									<button class="copy-button" onclick="copyText(this.previousElementSibling)">复制</button>
								</div>
							</div>
							<div class="example">
								<div class="example-label">查看日志</div>
								<div class="code-block" style="position:relative;">
									<code>docker-compose logs -f</code>
									<button class="copy-button" onclick="copyText(this.previousElementSibling)">复制</button>
								</div>
							</div>
							<div class="example">
								<div class="example-label">停止服务</div>
								<div class="code-block" style="position:relative;">
									<code>docker-compose down</code>
									<button class="copy-button" onclick="copyText(this.previousElementSibling)">复制</button>
								</div>
							</div>
						</div>
						<div>
							<div class="example">
								<div class="example-label">重启服务</div>
								<div class="code-block" style="position:relative;">
									<code>docker-compose restart</code>
									<button class="copy-button" onclick="copyText(this.previousElementSibling)">复制</button>
								</div>
							</div>
							<div class="example">
								<div class="example-label">查看状态</div>
								<div class="code-block" style="position:relative;">
									<code>docker-compose ps</code>
									<button class="copy-button" onclick="copyText(this.previousElementSibling)">复制</button>
								</div>
							</div>
							<div class="example">
								<div class="example-label">拉取镜像</div>
								<div class="code-block" style="position:relative;">
									<code>docker-compose pull</code>
									<button class="copy-button" onclick="copyText(this.previousElementSibling)">复制</button>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- 多仓库支持标签页 -->
			<div id="registry-content" class="tab-content">
				<div class="usage-section">
					<h3>支持的镜像仓库</h3>
					<p style="color: #a0a0ff; margin-bottom: 15px;">本代理服务支持多个主流容器镜像仓库</p>

					<div class="registry-list">
						<div class="registry-item">
							<h4>🐳 Docker Hub（默认）</h4>
							<p>全球最大的容器镜像仓库</p>
							<div class="code-block" style="margin-top: 10px;"><code>docker pull ${proxyDomain}/library/nginx
docker pull ${proxyDomain}/grafana/grafana</code></div>
						</div>

						<div class="registry-item">
							<h4>🔷 Google Container Registry</h4>
							<p>Google 提供的容器镜像服务</p>
							<div class="code-block" style="margin-top: 10px;"><code># 使用 gcr 子域名
docker pull gcr.${proxyDomain}/google-containers/pause</code></div>
						</div>

						<div class="registry-item">
							<h4>🟣 Quay.io</h4>
							<p>Red Hat 提供的容器镜像仓库</p>
							<div class="code-block" style="margin-top: 10px;"><code># 使用 quay 子域名
docker pull quay.${proxyDomain}/prometheus/prometheus</code></div>
						</div>

						<div class="registry-item">
							<h4>🐙 GitHub Container Registry</h4>
							<p>GitHub 的容器镜像服务</p>
							<div class="code-block" style="margin-top: 10px;"><code># 使用 ghcr 子域名
docker pull ghcr.${proxyDomain}/owner/image</code></div>
						</div>

						<div class="registry-item">
							<h4>☸️ Kubernetes Registry</h4>
							<p>Kubernetes 官方镜像仓库</p>
							<div class="code-block" style="margin-top: 10px;"><code># 使用 k8s 子域名
docker pull k8s.${proxyDomain}/kube-apiserver</code></div>
						</div>

						<div class="registry-item">
							<h4>🔧 其他仓库</h4>
							<p>支持更多镜像仓库</p>
							<p style="margin-top: 10px;">Amazon ECR, Azure CR, 阿里云等</p>
						</div>
					</div>
				</div>

				<div class="usage-section">
					<h3>私有镜像仓库配置</h3>
					<div class="example">
						<div class="example-label">登录私有仓库</div>
						<div class="code-block" style="position:relative;">
							<code># 登录到代理服务
docker login ${proxyDomain}

# 输入您的 Docker Hub 用户名和密码
Username: your-username
Password: your-password</code>
							<button class="copy-button" onclick="copyText(this.previousElementSibling)">复制</button>
						</div>
					</div>

					<div class="example">
						<div class="example-label">拉取私有镜像</div>
						<div class="code-block" style="position:relative;">
							<code>docker pull ${proxyDomain}/your-username/private-image:tag</code>
							<button class="copy-button" onclick="copyText(this.previousElementSibling)">复制</button>
						</div>
					</div>
				</div>
			</div>

			<!-- 高级功能标签页 -->
			<div id="advanced-content" class="tab-content">
				<div class="usage-section">
					<h3>Dockerfile 最佳实践</h3>
					<div class="example">
						<div class="example-label">多阶段构建示例</div>
						<div class="code-block" style="position:relative;">
							<code># 构建阶段
FROM ${proxyDomain}/library/node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

# 生产阶段
FROM ${proxyDomain}/library/nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]</code>
							<button class="copy-button" onclick="copyText(this.previousElementSibling)">复制</button>
						</div>
					</div>

					<div class="example">
						<div class="example-label">Python 应用 Dockerfile</div>
						<div class="code-block" style="position:relative;">
							<code>FROM ${proxyDomain}/library/python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["python", "app.py"]</code>
							<button class="copy-button" onclick="copyText(this.previousElementSibling)">复制</button>
						</div>
					</div>
				</div>

				<div class="usage-section">
					<h3>性能优化技巧</h3>
					<div class="feature-grid">
						<div class="feature-card">
							<h4>📥 并行下载</h4>
							<p>配置 max-concurrent-downloads 提升下载速度</p>
						</div>
						<div class="feature-card">
							<h4>💾 使用缓存</h4>
							<p>利用 Docker layer 缓存加速构建</p>
						</div>
						<div class="feature-card">
							<h4>🗜️ 镜像精简</h4>
							<p>使用 Alpine 基础镜像减小体积</p>
						</div>
						<div class="feature-card">
							<h4>⚡ 多阶段构建</h4>
							<p>分离构建和运行环境</p>
						</div>
					</div>
				</div>

				<div class="usage-section">
					<h3>常用镜像标签说明</h3>
					<div class="two-column">
						<div>
							<div class="example">
								<div class="example-label">Alpine 版本</div>
								<p style="color: #a0a0ff; margin: 10px 0;">基于 Alpine Linux 的最小化镜像，体积小</p>
								<div class="code-block"><code>nginx:alpine
node:20-alpine
python:3.11-alpine</code></div>
							</div>
							<div class="example">
								<div class="example-label">Slim 版本</div>
								<p style="color: #a0a0ff; margin: 10px 0;">精简版 Debian 镜像，比完整版小</p>
								<div class="code-block"><code>python:3.11-slim
node:20-slim</code></div>
							</div>
						</div>
						<div>
							<div class="example">
								<div class="example-label">Latest 标签</div>
								<p style="color: #a0a0ff; margin: 10px 0;">最新稳定版本，不推荐生产使用</p>
								<div class="code-block"><code>nginx:latest
redis:latest</code></div>
							</div>
							<div class="example">
								<div class="example-label">版本号标签</div>
								<p style="color: #a0a0ff; margin: 10px 0;">指定版本号，推荐生产使用</p>
								<div class="code-block"><code>nginx:1.25.3
redis:7.2.3
mysql:8.0.35</code></div>
							</div>
						</div>
					</div>
				</div>

				<div class="usage-section">
					<h3>故障排查命令</h3>
					<div class="two-column">
						<div>
							<div class="example">
								<div class="example-label">查看镜像信息</div>
								<div class="code-block" style="position:relative;">
									<code>docker images
docker inspect image:tag</code>
									<button class="copy-button" onclick="copyText(this.previousElementSibling)">复制</button>
								</div>
							</div>
							<div class="example">
								<div class="example-label">清理无用镜像</div>
								<div class="code-block" style="position:relative;">
									<code>docker image prune -a</code>
									<button class="copy-button" onclick="copyText(this.previousElementSibling)">复制</button>
								</div>
							</div>
						</div>
						<div>
							<div class="example">
								<div class="example-label">查看容器日志</div>
								<div class="code-block" style="position:relative;">
									<code>docker logs -f container_name</code>
									<button class="copy-button" onclick="copyText(this.previousElementSibling)">复制</button>
								</div>
							</div>
							<div class="example">
								<div class="example-label">进入容器</div>
								<div class="code-block" style="position:relative;">
									<code>docker exec -it container_name sh</code>
									<button class="copy-button" onclick="copyText(this.previousElementSibling)">复制</button>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			<div class="footer">
				<p>🚀 由 <a href="https://www.cloudflare.com" target="_blank">Cloudflare Workers</a> 强力驱动</p>
				<p style="margin-top: 5px;">⚡ 全球 CDN 加速 · 7x24 稳定运行 · 完全免费</p>
			</div>
		</div>

		<script>
		// 鼠标追踪效果
		document.addEventListener('mousemove', (e) => {
			const glow = document.getElementById('cursor-glow');
			glow.style.left = e.clientX + 'px';
			glow.style.top = e.clientY + 'px';
		});

		// 标签页切换
		function switchTab(tab) {
			document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
			document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
			
			event.target.classList.add('active');
			document.getElementById(tab + '-content').classList.add('active');
		}

		// 搜索功能
		function performSearch() {
			const query = document.getElementById('search-input').value.trim();
			if (query) {
				window.location.href = '/search?q=' + encodeURIComponent(query) + '&page=1';
			}
		}

		function quickSearch(query) {
			document.getElementById('search-input').value = query;
			performSearch();
		}

		document.getElementById('search-input').addEventListener('keypress', (e) => {
			if (e.key === 'Enter') performSearch();
		});

		// 镜像转换功能
		function convertImage() {
			const input = document.getElementById('convert-input').value.trim();
			if (!input) return;

			let imageName = input;

			// 处理 Docker Hub 链接
			if (input.includes('hub.docker.com')) {
				const match = input.match(/hub\\.docker\\.com\\/(?:_\\/)?([^/]+)\\/([^/\\s]+)/);
				if (match) {
					imageName = match[1] === '_' ? match[2] : match[1] + '/' + match[2].replace(/\\/.*$/, '');
				}
			}

			// 处理镜像名称
			let proxyImage = imageName;
			if (!imageName.includes('/')) {
				proxyImage = 'library/' + imageName;
			}

			const proxyAddress = '${proxyDomain}/' + proxyImage;
			const pullCommand = 'docker pull ' + proxyAddress;
			const composeUsage = 'services:\\n  myapp:\\n    image: ' + proxyAddress;

			document.getElementById('proxy-address').textContent = proxyAddress;
			document.getElementById('pull-command').textContent = pullCommand;
			document.getElementById('compose-usage').textContent = composeUsage;
			document.getElementById('convert-result').style.display = 'block';
		}

		document.getElementById('convert-input').addEventListener('keypress', (e) => {
			if (e.key === 'Enter') convertImage();
		});

		// 复制功能
		function copyText(element) {
			const text = typeof element === 'string' ? 
				document.getElementById(element).textContent : 
				element.textContent;
			
			navigator.clipboard.writeText(text).then(() => {
				const btn = event.target;
				const originalText = btn.textContent;
				btn.textContent = '✓ 已复制';
				btn.style.background = 'rgba(0, 255, 0, 0.3)';
				btn.style.borderColor = 'rgba(0, 255, 0, 0.5)';
				setTimeout(() => {
					btn.textContent = originalText;
					btn.style.background = '';
					btn.style.borderColor = '';
				}, 2000);
			}).catch(() => {
				alert('复制失败，请手动复制');
			});
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
