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
 * @returns {Promise<string>}
 */
async function searchInterface() {
	const text = `
	<!DOCTYPE html>
	<html lang="en">
	<head>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<title>Docker Hub Proxy - Search Images</title>
		<style>
		* {
			margin: 0;
			padding: 0;
			box-sizing: border-box;
		}
		
		body {
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			min-height: 100vh;
			margin: 0;
			background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
			overflow: hidden;
			position: relative;
		}
		
		/* 动态背景效果 */
		.background-animation {
			position: absolute;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			overflow: hidden;
			z-index: 0;
		}
		
		.bubble {
			position: absolute;
			bottom: -100px;
			background: rgba(255, 255, 255, 0.1);
			border-radius: 50%;
			animation: rise 15s infinite ease-in;
		}
		
		.bubble:nth-child(1) { left: 10%; width: 80px; height: 80px; animation-delay: 0s; }
		.bubble:nth-child(2) { left: 20%; width: 60px; height: 60px; animation-delay: 2s; }
		.bubble:nth-child(3) { left: 30%; width: 100px; height: 100px; animation-delay: 4s; }
		.bubble:nth-child(4) { left: 50%; width: 70px; height: 70px; animation-delay: 6s; }
		.bubble:nth-child(5) { left: 70%; width: 90px; height: 90px; animation-delay: 8s; }
		.bubble:nth-child(6) { left: 80%; width: 65px; height: 65px; animation-delay: 10s; }
		
		@keyframes rise {
			0% {
				bottom: -100px;
				transform: translateX(0) rotate(0deg);
				opacity: 0;
			}
			50% {
				opacity: 0.4;
			}
			100% {
				bottom: 110%;
				transform: translateX(100px) rotate(360deg);
				opacity: 0;
			}
		}
		
		/* 鼠标追踪光晕效果 */
		.cursor-glow {
			position: fixed;
			width: 300px;
			height: 300px;
			background: radial-gradient(circle, rgba(255, 255, 255, 0.2) 0%, transparent 70%);
			border-radius: 50%;
			pointer-events: none;
			z-index: 1;
			transform: translate(-50%, -50%);
			transition: opacity 0.3s ease;
			opacity: 0;
		}
		
		/* 主容器 */
		.container {
			position: relative;
			z-index: 2;
			text-align: center;
			animation: fadeInUp 1s ease-out;
		}
		
		@keyframes fadeInUp {
			from {
				opacity: 0;
				transform: translateY(30px);
			}
			to {
				opacity: 1;
				transform: translateY(0);
			}
		}
		
		.logo {
			margin-bottom: 30px;
			animation: float 3s ease-in-out infinite;
		}
		
		@keyframes float {
			0%, 100% {
				transform: translateY(0px);
			}
			50% {
				transform: translateY(-10px);
			}
		}
		
		.logo svg {
			filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1));
			transition: transform 0.3s ease;
		}
		
		.logo:hover svg {
			transform: scale(1.1) rotate(5deg);
		}
		
		h1 {
			color: white;
			font-size: 2.5em;
			margin-bottom: 15px;
			text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
			animation: slideInDown 0.8s ease-out;
		}
		
		@keyframes slideInDown {
			from {
				opacity: 0;
				transform: translateY(-30px);
			}
			to {
				opacity: 1;
				transform: translateY(0);
			}
		}
		
		.subtitle {
			color: rgba(255, 255, 255, 0.9);
			font-size: 1.1em;
			margin-bottom: 40px;
			animation: fadeIn 1.2s ease-out;
		}
		
		@keyframes fadeIn {
			from { opacity: 0; }
			to { opacity: 1; }
		}
		
		.search-container {
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 15px;
			margin-bottom: 30px;
		}
		
		.search-wrapper {
			position: relative;
		}
		
		#search-input {
			padding: 16px 24px;
			font-size: 16px;
			border: 2px solid rgba(255, 255, 255, 0.3);
			border-radius: 50px;
			width: 400px;
			background: rgba(255, 255, 255, 0.95);
			backdrop-filter: blur(10px);
			transition: all 0.3s ease;
			outline: none;
			box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		}
		
		#search-input:focus {
			border-color: rgba(255, 255, 255, 0.8);
			box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2), 0 0 0 4px rgba(255, 255, 255, 0.2);
			transform: translateY(-2px);
		}
		
		#search-input::placeholder {
			color: #999;
		}
		
		#search-button {
			padding: 16px;
			background: rgba(255, 255, 255, 0.25);
			border: 2px solid rgba(255, 255, 255, 0.3);
			border-radius: 50%;
			cursor: pointer;
			width: 56px;
			height: 56px;
			display: flex;
			align-items: center;
			justify-content: center;
			transition: all 0.3s ease;
			backdrop-filter: blur(10px);
			box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		}
		
		#search-button:hover {
			background: rgba(255, 255, 255, 0.35);
			transform: scale(1.1) rotate(15deg);
			box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
		}
		
		#search-button:active {
			transform: scale(0.95);
		}
		
		#search-button svg {
			width: 24px;
			height: 24px;
			transition: transform 0.3s ease;
		}
		
		#search-button:hover svg {
			transform: scale(1.1);
		}
		
		.info-cards {
			display: flex;
			gap: 20px;
			margin-top: 50px;
			flex-wrap: wrap;
			justify-content: center;
		}
		
		.info-card {
			background: rgba(255, 255, 255, 0.15);
			backdrop-filter: blur(10px);
			border: 1px solid rgba(255, 255, 255, 0.2);
			border-radius: 15px;
			padding: 25px;
			width: 200px;
			transition: all 0.3s ease;
			animation: fadeInUp 1s ease-out;
			animation-fill-mode: both;
		}
		
		.info-card:nth-child(1) { animation-delay: 0.2s; }
		.info-card:nth-child(2) { animation-delay: 0.4s; }
		.info-card:nth-child(3) { animation-delay: 0.6s; }
		
		.info-card:hover {
			background: rgba(255, 255, 255, 0.25);
			transform: translateY(-10px);
			box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
		}
		
		.info-card h3 {
			color: white;
			font-size: 1.2em;
			margin-bottom: 10px;
		}
		
		.info-card p {
			color: rgba(255, 255, 255, 0.9);
			font-size: 0.9em;
			line-height: 1.5;
		}
		
		.footer {
			position: fixed;
			bottom: 20px;
			color: rgba(255, 255, 255, 0.7);
			font-size: 0.9em;
			z-index: 2;
		}
		
		@media (max-width: 768px) {
			h1 { font-size: 2em; }
			#search-input { width: 280px; font-size: 14px; padding: 14px 20px; }
			#search-button { width: 50px; height: 50px; }
			.info-cards { flex-direction: column; align-items: center; margin-top: 30px; }
			.info-card { width: 90%; max-width: 300px; }
			.subtitle { font-size: 1em; }
		}
		
		@media (max-width: 480px) {
			h1 { font-size: 1.5em; }
			#search-input { width: 220px; font-size: 14px; }
			.info-card { padding: 20px; }
		}
		</style>
	</head>
	<body>
		<!-- 鼠标追踪光晕 -->
		<div class="cursor-glow" id="cursorGlow"></div>
		
		<!-- 背景动画气泡 -->
		<div class="background-animation">
			<div class="bubble"></div>
			<div class="bubble"></div>
			<div class="bubble"></div>
			<div class="bubble"></div>
			<div class="bubble"></div>
			<div class="bubble"></div>
		</div>
		
		<!-- 主内容 -->
		<div class="container">
			<div class="logo">
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 18" fill="#ffffff" width="120" height="90">
					<path d="M23.763 6.886c-.065-.053-.673-.512-1.954-.512-.32 0-.659.03-1.01.087-.248-1.703-1.651-2.533-1.716-2.57l-.345-.2-.227.328a4.596 4.596 0 0 0-.611 1.433c-.23.972-.09 1.884.403 2.666-.596.331-1.546.418-1.744.42H.752a.753.753 0 0 0-.75.749c-.007 1.456.233 2.864.692 4.07.545 1.43 1.355 2.483 2.409 3.13 1.181.725 3.104 1.14 5.276 1.14 1.016 0 2.03-.092 2.93-.266 1.417-.273 2.705-.742 3.826-1.391a10.497 10.497 0 0 0 2.61-2.14c1.252-1.42 1.998-3.005 2.553-4.408.075.003.148.005.221.005 1.371 0 2.215-.55 2.68-1.01.505-.5.685-.998.704-1.053L24 7.076l-.237-.19Z"></path>
					<path d="M2.216 8.075h2.119a.186.186 0 0 0 .185-.186V6a.186.186 0 0 0-.185-.186H2.216A.186.186 0 0 0 2.031 6v1.89c0 .103.083.186.185.186Zm2.92 0h2.118a.185.185 0 0 0 .185-.186V6a.185.185 0 0 0-.185-.186H5.136A.185.185 0 0 0 4.95 6v1.89c0 .103.083.186.186.186Zm2.964 0h2.118a.186.186 0 0 0 .185-.186V6a.186.186 0 0 0-.185-.186H8.1A.185.185 0 0 0 7.914 6v1.89c0 .103.083.186.186.186Zm2.928 0h2.119a.185.185 0 0 0 .185-.186V6a.185.185 0 0 0-.185-.186h-2.119a.186.186 0 0 0-.185.186v1.89c0 .103.083.186.185.186Zm-5.892-2.72h2.118a.185.185 0 0 0 .185-.186V3.28a.186.186 0 0 0-.185-.186H5.136a.186.186 0 0 0-.186.186v1.89c0 .103.083.186.186.186Zm2.964 0h2.118a.186.186 0 0 0 .185-.186V3.28a.186.186 0 0 0-.185-.186H8.1a.186.186 0 0 0-.186.186v1.89c0 .103.083.186.186.186Zm2.928 0h2.119a.185.185 0 0 0 .185-.186V3.28a.186.186 0 0 0-.185-.186h-2.119a.186.186 0 0 0-.185.186v1.89c0 .103.083.186.185.186Zm0-2.72h2.119a.186.186 0 0 0 .185-.186V.56a.185.185 0 0 0-.185-.186h-2.119a.186.186 0 0 0-.185.186v1.89c0 .103.083.186.185.186Zm2.955 5.44h2.118a.185.185 0 0 0 .186-.186V6a.185.185 0 0 0-.186-.186h-2.118a.185.185 0 0 0-.185.186v1.89c0 .103.083.186.185.186Z"></path>
				</svg>
			</div>
			
			<h1>Docker Hub Proxy</h1>
			<p class="subtitle">Fast and reliable Docker image registry proxy</p>
			
			<div class="search-container">
				<div class="search-wrapper">
					<input type="text" id="search-input" placeholder="Search for Docker images..." autocomplete="off">
				</div>
				<button id="search-button" title="Search">
					<svg focusable="false" aria-hidden="true" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
						<path d="M21 21L16.65 16.65M19 11C19 15.4183 15.4183 19 11 19C6.58172 19 3 15.4183 3 11C3 6.58172 6.58172 3 11 3C15.4183 3 19 6.58172 19 11Z" stroke="white" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
					</svg>
				</button>
			</div>
			
			<div class="info-cards">
				<div class="info-card">
					<h3>🚀 Fast</h3>
					<p>Optimized caching for faster image pulls</p>
				</div>
				<div class="info-card">
					<h3>🔒 Secure</h3>
					<p>Secure proxy with SSL/TLS support</p>
				</div>
				<div class="info-card">
					<h3>🌐 Global</h3>
					<p>Access Docker Hub from anywhere</p>
				</div>
			</div>
		</div>
		
		<div class="footer">
			Docker Hub Proxy Service
		</div>
		
		<script>
		// 鼠标追踪效果
		const cursorGlow = document.getElementById('cursorGlow');
		let mouseX = 0, mouseY = 0;
		let glowX = 0, glowY = 0;
		
		document.addEventListener('mousemove', (e) => {
			mouseX = e.clientX;
			mouseY = e.clientY;
			cursorGlow.style.opacity = '1';
		});
		
		document.addEventListener('mouseleave', () => {
			cursorGlow.style.opacity = '0';
		});
		
		// 平滑动画效果
		function animateGlow() {
			glowX += (mouseX - glowX) * 0.1;
			glowY += (mouseY - glowY) * 0.1;
			
			cursorGlow.style.left = glowX + 'px';
			cursorGlow.style.top = glowY + 'px';
			
			requestAnimationFrame(animateGlow);
		}
		animateGlow();
		
		// 搜索功能
		function performSearch() {
			const query = document.getElementById('search-input').value.trim();
			if (query) {
				// 添加加载动画
				const button = document.getElementById('search-button');
				button.style.transform = 'rotate(360deg)';
				setTimeout(() => {
					window.location.href = '/search?q=' + encodeURIComponent(query);
				}, 300);
			}
		}
		
		document.getElementById('search-button').addEventListener('click', performSearch);
		document.getElementById('search-input').addEventListener('keypress', function(event) {
			if (event.key === 'Enter') {
				performSearch();
			}
		});
		
		// 输入框动画效果
		const searchInput = document.getElementById('search-input');
		searchInput.addEventListener('input', function() {
			if (this.value) {
				this.style.borderColor = 'rgba(255, 255, 255, 0.6)';
			} else {
				this.style.borderColor = 'rgba(255, 255, 255, 0.3)';
			}
		});
		</script>
	</body>
	</html>
	`;
	return text;
}

/**
 * 搜索结果页面 - 展示Docker镜像搜索结果
 * @param {string} query 搜索关键词
 * @param {Array} results 搜索结果
 * @returns {Promise<string>}
 */
async function searchResultsPage(query, results) {
	const resultsHTML = results.map((result, index) => `
		<div class="result-card" style="animation-delay: ${index * 0.1}s">
			<div class="result-header">
				<h3>${result.name || 'Unknown'}</h3>
				<span class="stars">⭐ ${result.star_count || 0}</span>
			</div>
			<p class="description">${result.description || 'No description available'}</p>
			<div class="result-footer">
				<span class="pulls">📥 ${formatNumber(result.pull_count || 0)} pulls</span>
				<a href="https://hub.docker.com/r/${result.name}" target="_blank" rel="noopener noreferrer" class="view-link">View on Docker Hub →</a>
			</div>
		</div>
	`).join('');

	const text = `
	<!DOCTYPE html>
	<html lang="en">
	<head>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<title>Search Results - ${query}</title>
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
		}
		
		.stars {
			background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
			color: #333;
			padding: 5px 12px;
			border-radius: 20px;
			font-size: 0.9em;
			white-space: nowrap;
		}
		
		.description {
			color: #666;
			line-height: 1.6;
			margin-bottom: 15px;
			min-height: 60px;
		}
		
		.result-footer {
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding-top: 15px;
			border-top: 1px solid rgba(0, 0, 0, 0.1);
		}
		
		.pulls {
			color: #999;
			font-size: 0.9em;
		}
		
		.view-link {
			color: #667eea;
			text-decoration: none;
			font-weight: 500;
			transition: all 0.3s ease;
		}
		
		.view-link:hover {
			color: #764ba2;
			transform: translateX(5px);
			display: inline-block;
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
					<h1>Search Results for <span class="search-query">"${query}"</span></h1>
					<p>${results.length} results found</p>
				</div>
				<a href="/" class="back-link">← Back to Search</a>
			</div>
			
			${results.length > 0 ? `
				<div class="results-container">
					${resultsHTML}
				</div>
			` : `
				<div class="no-results">
					<h2>No results found</h2>
					<p>Try searching with different keywords</p>
				</div>
			`}
		</div>
	</body>
	</html>
	`;
	return text;
}

/**
 * 格式化数字 - 将大数字转换为可读格式 (1000 -> 1K, 1000000 -> 1M)
 * @param {number} num 数字
 * @returns {string}
 */
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
				if (query) {
					// 调用 Docker Hub API 搜索
					const searchUrl = `https://registry.hub.docker.com/v2/search/repositories/?query=${encodeURIComponent(query)}&page_size=25`;
					const searchResponse = await fetch(searchUrl, { 
						headers: { 'User-Agent': getReqHeader("User-Agent") || 'Mozilla/5.0' }
					});
					const searchData = await searchResponse.json();
					
					const results = searchData.results || [];
					return new Response(await searchResultsPage(query, results), {
						headers: {
							'Content-Type': 'text/html; charset=UTF-8',
						},
					});
				}
			} catch (error) {
				console.error('Search error:', error);
				// 搜索失败也返回空结果页面
				const query = url.searchParams.get('q') || '';
				return new Response(await searchResultsPage(query, []), {
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
					return new Response(await searchInterface(), {
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
