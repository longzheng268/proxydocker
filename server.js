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
        resolve(new Request(url, init));
      });
    });
  }
  
  return Promise.resolve(new Request(url, init));
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
    // Convert Node.js request to Worker request
    const workerRequest = await nodeRequestToWorkerRequest(req);
    
    // Create mock env and ctx for worker
    const env = {
      // Environment variables from process.env
      URL: process.env.CUSTOM_URL,
      URL302: process.env.REDIRECT_URL,
      UA: process.env.BLOCK_UA,
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
