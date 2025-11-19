#!/usr/bin/env node

/**
 * ProxyDocker - Node.js Server Adapter
 * Adapts the Cloudflare Worker code to run on regular Node.js servers
 */

const http = require('http');
const https = require('https');
const { URL } = require('url');

// Configuration
const PORT = process.env.PORT || 8080;
const HOST = process.env.HOST || '0.0.0.0';

// IP地理位置限制配置
const ENABLE_IP_RESTRICTION = process.env.ENABLE_IP_RESTRICTION !== 'false' && process.env.ENABLE_IP_RESTRICTION !== '0';
const ALLOWED_COUNTRIES = process.env.ALLOWED_COUNTRIES ? process.env.ALLOWED_COUNTRIES.split(',').map(c => c.trim().toUpperCase()) : ['CN'];

/**
 * 从请求中提取真实客户端IP
 * 支持通过代理服务器（如Nginx）传递的真实IP
 */
function getClientIP(req) {
  // 优先使用 X-Forwarded-For 头（如果通过代理）
  const xForwardedFor = req.headers['x-forwarded-for'];
  if (xForwardedFor) {
    // X-Forwarded-For 可能包含多个IP，取第一个
    const ips = xForwardedFor.split(',').map(ip => ip.trim());
    return ips[0];
  }
  
  // 使用 X-Real-IP 头（Nginx常用）
  if (req.headers['x-real-ip']) {
    return req.headers['x-real-ip'];
  }
  
  // 使用连接的远程地址
  return req.connection.remoteAddress || req.socket.remoteAddress;
}

/**
 * 使用 geoip-lite 库进行IP地理位置查询（无需外部API调用）
 * 注意：此功能需要安装 geoip-lite 包
 * 如果未安装，将允许所有访问
 */
let geoip = null;
try {
  geoip = require('geoip-lite');
} catch (error) {
  console.warn('geoip-lite not installed. IP geolocation restriction will be disabled in Node.js mode.');
  console.warn('To enable IP restriction, run: npm install geoip-lite');
}

/**
 * 检查IP是否被允许访问（Node.js版本）
 */
function isIPAllowedNodeJS(clientIP) {
  // 如果未启用IP限制，允许所有访问
  if (!ENABLE_IP_RESTRICTION) {
    return { allowed: true, country: null };
  }
  
  // 如果geoip库未安装，为了不影响服务，允许访问
  if (!geoip) {
    return { allowed: true, country: null };
  }
  
  // 本地IP总是允许访问
  if (clientIP === '127.0.0.1' || clientIP === '::1' || clientIP === '::ffff:127.0.0.1' || clientIP.startsWith('192.168.') || clientIP.startsWith('10.')) {
    return { allowed: true, country: 'LOCAL' };
  }
  
  try {
    // 移除 IPv6 前缀（如果存在）
    const cleanIP = clientIP.replace(/^::ffff:/, '');
    
    // 查询IP地理位置
    const geo = geoip.lookup(cleanIP);
    
    if (!geo || !geo.country) {
      // 无法确定地理位置，为安全起见在生产环境拒绝访问
      if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
        return { allowed: true, country: 'UNKNOWN' };
      }
      return { allowed: false, country: 'UNKNOWN' };
    }
    
    const country = geo.country.toUpperCase();
    const allowed = ALLOWED_COUNTRIES.includes(country);
    
    return { allowed, country };
  } catch (error) {
    console.error('Error checking IP geolocation:', error);
    // 出错时为了不影响服务，在开发环境允许访问
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
      return { allowed: true, country: 'ERROR' };
    }
    return { allowed: false, country: 'ERROR' };
  }
}

// Import the worker logic (we'll need to adapt it)
// Since _worker.js uses Cloudflare Workers APIs, we need to create adapters

/**
 * Adapter to make fetch work in Node.js environment
 */
const fetch = require('node-fetch');
global.fetch = fetch;
global.Response = fetch.Response;
global.Request = fetch.Request;
global.Headers = fetch.Headers;

// Load the worker code
let workerCode;
try {
  workerCode = require('./_worker.js');
} catch (error) {
  console.error('Error loading worker code:', error);
  process.exit(1);
}

/**
 * Convert Node.js request to Cloudflare Workers Request
 */
function nodeRequestToWorkerRequest(req) {
  const protocol = req.connection.encrypted ? 'https' : 'http';
  const host = req.headers.host || `${HOST}:${PORT}`;
  const url = `${protocol}://${host}${req.url}`;
  
  const headers = new Headers();
  Object.keys(req.headers).forEach(key => {
    headers.set(key, req.headers[key]);
  });
  
  const init = {
    method: req.method,
    headers: headers,
  };
  
  // Handle request body for POST/PUT requests
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return new Promise((resolve) => {
      const chunks = [];
      req.on('data', chunk => chunks.push(chunk));
      req.on('end', () => {
        init.body = Buffer.concat(chunks);
        const request = new Request(url, init);
        
        // 添加模拟的 cf 对象用于IP地理位置检查
        // 对于本地IP和已经在Node.js层面检查通过的IP，设置为CN以通过Worker的检查
        const clientIP = getClientIP(req);
        const { allowed, country } = isIPAllowedNodeJS(clientIP);
        // 如果Node.js层面允许访问，将country设置为CN，这样Worker层面也会允许
        request.cf = { country: allowed ? 'CN' : (country || 'XX') };
        
        resolve(request);
      });
    });
  }
  
  const request = new Request(url, init);
  
  // 添加模拟的 cf 对象用于IP地理位置检查
  // 对于本地IP和已经在Node.js层面检查通过的IP，设置为CN以通过Worker的检查
  const clientIP = getClientIP(req);
  const { allowed, country } = isIPAllowedNodeJS(clientIP);
  // 如果Node.js层面允许访问，将country设置为CN，这样Worker层面也会允许
  request.cf = { country: allowed ? 'CN' : (country || 'XX') };
  
  return Promise.resolve(request);
}

/**
 * Convert Cloudflare Workers Response to Node.js response
 */
async function workerResponseToNodeResponse(workerResponse, nodeRes) {
  // Set status code
  nodeRes.statusCode = workerResponse.status;
  
  // Set headers
  workerResponse.headers.forEach((value, key) => {
    nodeRes.setHeader(key, value);
  });
  
  // Send body
  if (workerResponse.body) {
    // node-fetch v2 doesn't have getReader(), use buffer() or text()
    try {
      const buffer = await workerResponse.buffer();
      nodeRes.end(buffer);
    } catch (error) {
      console.error('Error reading response body:', error);
      nodeRes.end();
    }
  } else {
    nodeRes.end();
  }
}

/**
 * Main request handler
 */
async function handleRequest(req, res) {
  try {
    // ========================================================================
    // IP GEOLOCATION RESTRICTION - 检查IP地理位置限制（Node.js版本）
    // ========================================================================
    
    const clientIP = getClientIP(req);
    const { allowed, country } = isIPAllowedNodeJS(clientIP);
    
    if (!allowed) {
      console.log(`Access denied from IP: ${clientIP}, Country: ${country}`);
      res.statusCode = 403;
      res.setHeader('Content-Type', 'text/html; charset=UTF-8');
      res.end(`<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Access Denied - 访问被拒绝</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 15px;
      padding: 40px;
      max-width: 600px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      text-align: center;
    }
    .icon { font-size: 64px; margin-bottom: 20px; }
    h1 { color: #333; margin-bottom: 15px; font-size: 28px; }
    p { color: #666; line-height: 1.6; margin-bottom: 10px; }
    .country { color: #667eea; font-weight: bold; }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #eee;
      color: #999;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">🚫</div>
    <h1>Access Denied - 访问被拒绝</h1>
    <p>抱歉，此服务目前仅对特定地区开放。</p>
    <p>Sorry, this service is currently only available in specific regions.</p>
    ${country ? `<p style="margin-top: 20px;">检测到的地区 / Detected region: <span class="country">${country}</span></p>` : ''}
    <div class="footer">
      如有疑问，请联系管理员<br>
      If you have any questions, please contact the administrator
    </div>
  </div>
</body>
</html>`);
      return;
    }
    
    // Convert Node.js request to Worker request
    const workerRequest = await nodeRequestToWorkerRequest(req);
    
    // Create mock env and ctx for worker
    const env = {
      // Environment variables from process.env
      URL: process.env.CUSTOM_URL,
      URL302: process.env.REDIRECT_URL,
      UA: process.env.BLOCK_UA,
      ALLOWED_COUNTRIES: process.env.ALLOWED_COUNTRIES,
      ENABLE_IP_RESTRICTION: process.env.ENABLE_IP_RESTRICTION,
      NODE_ENV: process.env.NODE_ENV,
    };
    
    const ctx = {
      waitUntil: (promise) => {
        // In Node.js, we can just let promises resolve naturally
        promise.catch(err => console.error('Background task error:', err));
      },
      passThroughOnException: () => {
        // Not applicable in Node.js environment
      },
    };
    
    // Call the worker's fetch handler
    const workerResponse = await workerCode.default.fetch(workerRequest, env, ctx);
    
    // Convert Worker response to Node.js response
    await workerResponseToNodeResponse(workerResponse, res);
    
  } catch (error) {
    console.error('Request handling error:', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/plain');
    res.end('Internal Server Error');
  }
}

/**
 * Create and start the server
 */
const server = http.createServer(handleRequest);

server.listen(PORT, HOST, () => {
  console.log('='.repeat(60));
  console.log('🐳 ProxyDocker Server Started');
  console.log('='.repeat(60));
  console.log(`Server running at http://${HOST}:${PORT}/`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('');
  console.log('Configuration:');
  console.log(`  - Custom URL: ${process.env.CUSTOM_URL || 'Not set'}`);
  console.log(`  - Redirect URL: ${process.env.REDIRECT_URL || 'Not set'}`);
  console.log(`  - Block UA: ${process.env.BLOCK_UA || 'Not set'}`);
  console.log('');
  console.log('Usage:');
  console.log(`  docker pull ${HOST}:${PORT}/library/nginx:latest`);
  console.log(`  Open browser: http://${HOST}:${PORT}/`);
  console.log('='.repeat(60));
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\nSIGINT received, closing server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});
