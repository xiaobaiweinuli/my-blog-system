// @ts-nocheck
"use strict";

var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/utils.js
function handleCORS(request, env) {
  const corsConfig = {
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS, HEAD, PUT, PATCH",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, x-override, x-session-token, Cache-Control",
    "Access-Control-Max-Age": "86400",
    "Access-Control-Allow-Credentials": "true"
  };
  
  if (!env?.ALLOWED_ORIGINS) {
    return { "Access-Control-Allow-Origin": "*", ...corsConfig };
  }
  
  const allowedOrigins = env.ALLOWED_ORIGINS.split(",").map(origin => origin.trim().replace(/\/+$/, ""));
  const requestOrigin = request.headers.get("origin");
  
  // 如果请求源在允许列表中，使用该源，否则使用第一个允许的源或*
  const allowOrigin = (requestOrigin && allowedOrigins.includes(requestOrigin.replace(/\/+$/, "")))
    ? requestOrigin 
    : (allowedOrigins[0] || '*');
  
  return { "Access-Control-Allow-Origin": allowOrigin, ...corsConfig };
}
__name(handleCORS, "handleCORS");

function handleError(error, request, env) {
  console.error("错误处理:", error);
  return new Response(JSON.stringify({
    success: false,
    error: "Internal server error",
    message: error.message,
    stack: env?.DEBUG === "true" ? error.stack : undefined
  }), {
    status: 500,
    headers: { "Content-Type": "application/json", ...handleCORS(request, env) }
  });
}
__name(handleError, "handleError");

// src/r2.js
async function handleR2Upload(request, env) {
  const corsHeaders = handleCORS(request, env);

  // 1. 验证会话令牌并获取用户角色
  const authHeader = request.headers.get("Authorization");
  const sessionToken = authHeader?.replace("Bearer ", "");
  const user = sessionToken ? await verifyUserRole(sessionToken, env) : null;

  if (!user || (user.role !== "admin" && user.role !== "collaborator")) {
    return new Response(JSON.stringify({ error: "Unauthorized or Insufficient Permissions" }), { status: 403, headers: corsHeaders });
  }
  
  try {
    const { R2_BUCKET } = env;
    if (!R2_BUCKET) {
      throw new Error("R2_BUCKET binding is not configured or env is undefined.");
    }
    
    const contentType = request.headers.get("content-type");
    if (!contentType || !contentType.startsWith("multipart/form-data")) {
      return new Response("Invalid content type, expected multipart/form-data", {
        status: 415,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      });
    }
    
    const formData = await request.formData();
    const file = formData.get("file");
    if (!file || file.size === 0) {
      return new Response("No file provided", {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      });
    }
    
    const originalFilename = file.name;
    let filename = originalFilename;
    
    const shouldOverride = request.headers.get("x-override") === "true";
    let existingFile = await R2_BUCKET.head(filename).catch(() => null);
    
    if (existingFile && !shouldOverride) {
      filename = generateUniqueFilename(originalFilename);
      let counter = 2;
      while (await R2_BUCKET.head(filename).catch(() => null)) {
        filename = `${getBaseName(originalFilename)} (${counter})${getExtension(originalFilename)}`;
        counter++;
      }
    }
    
    await R2_BUCKET.put(filename, file, {
      httpMetadata: { contentType: file.type }
    });
    
    // 构建文件的公共 URL
    const publicUrl = `${new URL(request.url).origin}/api/r2/view?filename=${encodeURIComponent(filename)}`;
    
    return new Response(JSON.stringify({
      success: true,
      originalFilename,
      filename,
      url: publicUrl,
      wasOverridden: shouldOverride,
      message: shouldOverride 
        ? "文件已成功覆盖" 
        : filename === originalFilename 
          ? "文件已成功上传" 
          : `文件已重命名为 ${filename} 并上传`
    }), {
      status: 201,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
  } catch (error) {
    console.error("R2 上传错误:", error);
    return new Response(JSON.stringify({
      success: false,
      error: "Failed to upload file",
      message: error.message
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
  }
}
__name(handleR2Upload, "handleR2Upload");

function generateUniqueFilename(originalFilename) {
  const baseName = getBaseName(originalFilename);
  const extension = getExtension(originalFilename);
  return `${baseName} (1)${extension}`;
}

function getBaseName(filename) {
  if (!filename) return '';
  const lastDotIndex = filename.lastIndexOf('.');
  return lastDotIndex > 0 ? filename.substring(0, lastDotIndex) : filename;
}

function getExtension(filename) {
  if (!filename) return '';
  const lastDotIndex = filename.lastIndexOf('.');
  return lastDotIndex > 0 ? filename.substring(lastDotIndex) : '';
}

async function handleR2List(request, env) {
  const corsHeaders = handleCORS(request, env);
  
  // 验证会话令牌并获取用户角色
  const authHeader = request.headers.get("Authorization");
  const sessionToken = authHeader?.replace("Bearer ", "");
  const user = sessionToken ? await verifyUserRole(sessionToken, env) : null;

  if (!user || (user.role !== "admin" && user.role !== "collaborator")) {
    return new Response(JSON.stringify({ error: "Unauthorized or Insufficient Permissions" }), { status: 403, headers: corsHeaders });
  }
  
  try {
    const { R2_BUCKET } = env;
    if (!R2_BUCKET) {
      throw new Error("R2_BUCKET binding is not configured or env is undefined.");
    }
    
    const url = new URL(request.url);
    const prefix = url.searchParams.get("prefix") || "";
    const limit = parseInt(url.searchParams.get("limit")) || 100;
    const objects = [];
    let cursor;
    
    do {
      const listOptions = { prefix, limit };
      if (typeof cursor === 'string' && cursor.trim() !== '') {
        listOptions.cursor = cursor;
      }
      
      const result = await R2_BUCKET.list(listOptions);
      objects.push(...result.objects);
      cursor = typeof result.cursor === 'string' ? result.cursor : undefined;
    } while (cursor && objects.length < limit);
    
    return new Response(JSON.stringify(objects), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
  } catch (error) {
    console.error("R2 列表错误:", error);
    return new Response(JSON.stringify({
      success: false,
      error: "Failed to list R2 objects",
      message: error.message
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
  }
}
__name(handleR2List, "handleR2List");

async function handleR2Delete(request, env) {
  const corsHeaders = handleCORS(request, env);
  
  // 验证会话令牌并获取用户角色
  const authHeader = request.headers.get("Authorization");
  const sessionToken = authHeader?.replace("Bearer ", "");
  const user = sessionToken ? await verifyUserRole(sessionToken, env) : null;

  // 只有管理员可以删除文件
  if (!user || user.role !== "admin") {
    return new Response(JSON.stringify({ error: "Unauthorized or Insufficient Permissions" }), { status: 403, headers: corsHeaders });
  }
  
  try {
    const { R2_BUCKET } = env;
    if (!R2_BUCKET) {
      throw new Error("R2_BUCKET binding is not configured or env is undefined.");
    }
    
    const { filename } = await request.json();
    if (!filename) {
      return new Response("Filename not provided", {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      });
    }
    
    await R2_BUCKET.delete(filename);
    return new Response(JSON.stringify({
      success: true,
      message: `File ${filename} deleted successfully`
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
  } catch (error) {
    console.error("R2 删除错误:", error);
    return new Response(JSON.stringify({
      success: false,
      error: "Failed to delete file",
      message: error.message
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
  }
}
__name(handleR2Delete, "handleR2Delete");

async function handleR2Check(request, env) {
  const corsHeaders = handleCORS(request, env);
  const authHeader = request.headers.get("Authorization");
  const sessionToken = authHeader?.replace("Bearer ", "");
  const user = sessionToken ? await verifyUserRole(sessionToken, env) : null;
  if (!user || (user.role !== "admin" && user.role !== "collaborator")) {
    return new Response(JSON.stringify({ error: "Unauthorized or Insufficient Permissions" }), { status: 403, headers: corsHeaders });
  }
  const url = new URL(request.url);
  const filename = url.searchParams.get("filename");
  if (!filename) {
    return new Response(JSON.stringify({ error: "Filename is required" }), { status: 400, headers: corsHeaders });
  }
  try {
    const { R2_BUCKET } = env;
    if (!R2_BUCKET) {
      throw new Error("R2_BUCKET binding is not configured or env is undefined.");
    }
    const existingFile = await R2_BUCKET.head(filename).catch(() => null);
    return new Response(JSON.stringify({ exists: existingFile !== null }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("R2 check error:", error);
    return new Response(JSON.stringify({ error: "Failed to check file existence", message: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
}
__name(handleR2Check, "handleR2Check");

// 新增：查看R2文件内容（图片直接展示，其他文件作为下载链接）
async function handleR2View(request, env) {
  const corsHeaders = handleCORS(request, env);
  
  // 任何人都可以查看文件，无需验证身份
  // 这是因为博客需要向所有访问者展示文件内容
  
  try {
    const { R2_BUCKET } = env;
    if (!R2_BUCKET) {
      throw new Error("R2_BUCKET binding is not configured or env is undefined.");
    }
    
    const url = new URL(request.url);
    const filename = url.searchParams.get("filename");
    
    if (!filename) {
      return new Response("Filename not provided", {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      });
    }
    
    // 检查文件是否存在
    const object = await R2_BUCKET.head(filename).catch(() => null);
    if (!object) {
      return new Response(`File ${filename} not found`, {
        status: 404,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      });
    }
    
    // 获取文件内容
    const file = await R2_BUCKET.get(filename);
    if (!file) {
      return new Response(`Failed to retrieve file ${filename}`, {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      });
    }
    
    // 确定响应类型
    const contentType = file.httpMetadata?.contentType || "application/octet-stream";
    const isImage = contentType.startsWith("image/");
    
    let headers = corsHeaders;
    headers["Content-Type"] = contentType;
    
    if (isImage) {
      // 图片直接返回二进制内容
      return new Response(file.body, {
        status: 200,
        headers
      });
    } else {
      // 非图片文件设置下载头
      headers["Content-Disposition"] = `attachment; filename="${encodeURIComponent(filename)}"`;
      return new Response(file.body, {
        status: 200,
        headers
      });
    }
  } catch (error) {
    console.error("R2 查看文件错误:", error);
    return new Response(JSON.stringify({
      success: false,
      error: "Failed to view file",
      message: error.message
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
  }
}
__name(handleR2View, "handleR2View");

// src/auth.js - 安全认证模块
// JWT相关工具函数
const base64UrlEncode = str => btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const base64UrlDecode = str => atob(str.replace(/-/g, "+").replace(/_/g, "/"));

async function generateSessionToken(userId, userRole, env) {
  const secret = env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET 未配置");
  
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: userId,
    role: userRole,
    iat: now,
    exp: now + 86400 // 24小时过期
  };
  
  const encoder = new TextEncoder();
  const data = encoder.encode(JSON.stringify(payload));
  const key = await crypto.subtle.importKey(
    "raw", encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false, ["sign"]
  );
  
  const signature = await crypto.subtle.sign("HMAC", key, data);
  const sigBase64 = base64UrlEncode(String.fromCharCode(...new Uint8Array(signature)));
  const payloadBase64 = base64UrlEncode(JSON.stringify(payload));
  
  return `${payloadBase64}.${sigBase64}`;
}

async function verifySessionToken(token, env) {
  if (!token) return null;
  
  try {
    const [payloadBase64, sigBase64] = token.split(".");
    if (!payloadBase64 || !sigBase64) return null;
    
    const payload = JSON.parse(base64UrlDecode(payloadBase64));
    if (!env.SESSION_SECRET) throw new Error("SESSION_SECRET 未配置");
    
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(payload));
    const key = await crypto.subtle.importKey(
      "raw", encoder.encode(env.SESSION_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false, ["verify"]
    );
    
    const sigBuffer = Uint8Array.from(base64UrlDecode(sigBase64), c => c.charCodeAt(0));
    const isValid = await crypto.subtle.verify("HMAC", key, sigBuffer, data);
    
    if (!isValid || payload.exp < Math.floor(Date.now() / 1000)) return null;
    
    return { id: payload.sub, role: payload.role };
  } catch (error) {
    console.error("令牌验证失败:", error);
    return null;
  }
}

// src/github.js - GitHub OAuth 安全处理
async function handleGitHubOAuth(request, env) {
  const corsHeaders = handleCORS(request, env);
  const isDebug = env?.DEBUG === "true";
  
  try {
    // 1. 验证请求参数
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const redirectUri = url.searchParams.get("redirect_uri") || env.FRONTEND_URL || "http://localhost:3000";
    
    if (!code) {
      return new Response(JSON.stringify({
        success: false,
        error: "缺少授权码",
        redirect: `${redirectUri}/login?error=missing_code`
      }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
    
    // 2. 验证环境配置
    const { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, GITHUB_KV } = env;
    if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET || !GITHUB_KV) {
      throw new Error("GitHub 配置缺失");
    }
    
    // 3. 获取访问令牌
    if (isDebug) console.log("请求GitHub访问令牌...");
    
    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json"
      },
      body: new URLSearchParams({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code
      })
    });
    
    if (!tokenResponse.ok) {
      throw new Error(`GitHub令牌请求失败: ${tokenResponse.status}`);
    }
    
    const tokenData = await tokenResponse.json();
    if (isDebug) console.log("令牌响应状态码:", tokenResponse.status);
    
    if (tokenData.error) {
      throw new Error(`GitHub错误: ${tokenData.error_description}`);
    }
    
    const { access_token, token_type } = tokenData;
    
    // 4. 获取用户信息
    const userHeaders = {
      "Authorization": `${token_type} ${access_token}`,
      "User-Agent": "MyBlog/1.0",
      "Accept": "application/json"
    };
    
    const userResponse = await fetch("https://api.github.com/user", { headers: userHeaders });
    
    if (!userResponse.ok) {
      throw new Error(`用户信息请求失败: ${userResponse.status}`);
    }
    
    const userData = await userResponse.json();
    if (isDebug) console.log("用户认证成功:", userData.login);
    
    // 5. 设置用户角色
    let role = "user";
    const adminUsers = [env.ADMIN_USERNAME, "xiaobaiweinuli"].filter(Boolean);
    const collaborators = env.COLLABORATORS_LIST ? 
                        env.COLLABORATORS_LIST.split(',').map(s => s.trim()) : [];
    
    if (adminUsers.includes(userData.login)) {
      role = "admin";
    } else if (env.COLLABORATOR_USERNAME === userData.login || collaborators.includes(userData.login)) {
      role = "collaborator";
    }
    
    // 6. 生成会话令牌
    const sessionToken = await generateSessionToken(userData.id, role, env);
    
    // 7. 存储Token和用户信息
    try {
      const tasks = [
        GITHUB_KV.put(`github_token:${userData.id}`, JSON.stringify({
          token: access_token,
          token_type,
          expires_at: Date.now() + (tokenData.expires_in || 3600) * 1000,
          scopes: tokenData.scope?.split(',') || []
        }), { expirationTtl: 3600 }),
        
        GITHUB_KV.put(`github_user:${userData.id}`, JSON.stringify({
          login: userData.login,
          name: userData.name,
          avatar_url: userData.avatar_url,
          email: userData.email || null,
          html_url: userData.html_url,
          role
        }), { expirationTtl: 86400 })
      ];
      
      await Promise.all(tasks);
    } catch (kvError) {
      console.error("KV存储错误:", kvError);
      // 继续执行流程
    }
    
    // 8. 返回用户数据
    return new Response(JSON.stringify({
      success: true,
      access_token,
      token_type,
      user: {
        id: userData.id,
        login: userData.login,
        name: userData.name,
        avatar_url: userData.avatar_url,
        email: userData.email || null,
        html_url: userData.html_url,
        role
      },
      session_token: sessionToken
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
  } catch (error) {
    console.error("GitHub OAuth错误:", error.message);
    
    const redirectUri = new URL(request.url).searchParams.get("redirect_uri") || 
                       env.FRONTEND_URL || "http://localhost:3000";
    
    return new Response(JSON.stringify({
      success: false,
      error: "认证失败，请重试",
      message: isDebug ? error.message : undefined,
      redirect: `${redirectUri}/login?error=auth_failed`
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
}
__name(handleGitHubOAuth, "handleGitHubOAuth");

// src/github-proxy.js - GitHub API 代理 (防止令牌泄露)
async function handleGitHubAPI(request, env) {
  const corsHeaders = handleCORS(request, env);
  
  try {
    // 1. 验证用户请求
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "未授权" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
    
    const sessionToken = authHeader.split(" ")[1];
    const user = await verifySessionToken(sessionToken, env);
    if (!user) {
      return new Response(JSON.stringify({ error: "无效的会话" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
    
    // 2. 检查环境和令牌
    if (!env.GITHUB_KV) {
      throw new Error("GITHUB_KV 未配置");
    }
    
    const tokenData = await env.GITHUB_KV.get(`github_token:${user.id}`, "json").catch(() => null);
    if (!tokenData?.token) {
      return new Response(JSON.stringify({ error: "需要重新认证" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
    
    if (tokenData.expires_at && tokenData.expires_at < Date.now()) {
      return new Response(JSON.stringify({ error: "令牌已过期，请重新认证" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
    
    // 3. 构建并发送GitHub API请求
    const url = new URL(request.url);
    const cleanPath = url.pathname.replace("/api/github/proxy/", "").replace(/^\//, "");
    const githubUrl = `https://api.github.com/${cleanPath}${url.search}`;
    
    // 设置安全的请求头
    const requestHeaders = new Headers();
    requestHeaders.set("Authorization", `${tokenData.token_type || "Bearer"} ${tokenData.token}`);
    requestHeaders.set("Accept", "application/json");
    requestHeaders.set("User-Agent", "MyBlog/1.0");
    
    // 复制安全的头部
    const safeHeaders = ['content-type', 'if-none-match', 'if-modified-since', 'cache-control'];
    for (const [key, value] of request.headers.entries()) {
      if (safeHeaders.includes(key.toLowerCase())) {
        requestHeaders.set(key, value);
      }
    }
    
    // 发送请求
    const response = await fetch(githubUrl, {
      method: request.method,
      headers: requestHeaders,
      body: ['GET', 'HEAD'].includes(request.method) ? null : request.body
    });
    
    // 4. 构建响应
    const headers = new Headers(corsHeaders);
    headers.set("Content-Type", response.headers.get("Content-Type") || "application/json");
    
    // 只复制安全的响应头
    const safeResponseHeaders = [
      'etag', 'cache-control', 'content-type', 'last-modified', 
      'x-ratelimit-limit', 'x-ratelimit-remaining', 'x-ratelimit-reset',
      'x-github-request-id', 'x-github-api-version'
    ];
    
    for (const [key, value] of response.headers.entries()) {
      if (safeResponseHeaders.includes(key.toLowerCase())) {
        headers.set(key, value);
      }
    }
    
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers
    });
    
  } catch (error) {
    console.error("GitHub API 代理错误:", error);
    return new Response(JSON.stringify({ error: "服务器错误", message: env?.DEBUG === "true" ? error.message : undefined }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
}
__name(handleGitHubAPI, "handleGitHubAPI");

// src/index.js - 主入口
/**
 * @typedef {Object} Env
 * @property {R2Bucket} R2_BUCKET - R2存储桶绑定
 * @property {string} R2_BUCKET_NAME - R2存储桶名称
 * @property {string} R2_ACCOUNT_ID - R2账户ID
 * @property {string} GITHUB_CLIENT_ID - GitHub OAuth客户端ID
 * @property {string} GITHUB_CLIENT_SECRET - GitHub OAuth客户端密钥
 * @property {KVNamespace} GITHUB_KV - 存储GitHub令牌的KV命名空间
 * @property {string} SESSION_SECRET - 会话签名密钥
 * @property {string} ALLOWED_ORIGINS - 允许的跨域来源
 * @property {string} FRONTEND_URL - 前端应用URL
 */

// 路由映射表
const routes = {
  "/api/r2/upload": { handler: handleR2Upload, methods: ["POST"] },
  "/api/r2/list": { handler: handleR2List, methods: ["GET"] },
  "/api/r2/delete": { handler: handleR2Delete, methods: ["DELETE"] },
  "/api/r2/check": { handler: handleR2Check, methods: ["GET"] },
  "/api/r2/view": { handler: handleR2View, methods: ["GET"] },
  "/api/health": { handler: handleHealth, methods: ["GET"] },
  "/health": { handler: handleHealth, methods: ["GET"] }
};

// 健康检查端点
async function handleHealth(request, env) {
  return new Response(JSON.stringify({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "1.1.0"
  }), {
    status: 200,
    headers: { "Content-Type": "application/json", ...handleCORS(request, env) }
  });
}

async function handleRequest(request, env) {
  try {
    // 处理预检请求
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: handleCORS(request, env) });
    }
    
    const url = new URL(request.url);
    const path = url.pathname;
    
    // 1. 检查精确匹配路由
    const route = routes[path];
    if (route && route.methods.includes(request.method)) {
      return route.handler(request, env);
    }
    
    // 2. 检查前缀匹配路由
    if (path.startsWith("/api/github/oauth")) {
      return handleGitHubOAuth(request, env);
    }
    
    if (path.startsWith("/api/github/proxy/")) {
      return handleGitHubAPI(request, env);
    }
    
    // 3. 没有匹配的路由
    return new Response(JSON.stringify({
      error: "Not Found",
      message: "请求的端点不存在",
      path: path
    }), {
      status: 404,
      headers: { "Content-Type": "application/json", ...handleCORS(request, env) }
    });
    
  } catch (error) {
    console.error("请求处理错误:", error);
    return handleError(error, request, env);
  }
}
__name(handleRequest, "handleRequest");

// 添加用户角色验证函数
async function verifyUserRole(sessionToken, env) {
  if (!sessionToken) return null;
  
  try {
    // 验证会话令牌
    const user = await verifySessionToken(sessionToken, env);
    if (!user) return null;
    
    return user;
  } catch (error) {
    console.error("角色验证失败:", error);
    return null;
  }
}

// 导出Worker
export default {
  async fetch(request, env, ctx) {
    const isDebug = env?.DEBUG === "true";
    const isPerf = env?.PERF_MONITORING === "true";
    
    try {
      if (isDebug) {
        console.log('=== Worker 初始化 ===');
        console.log('环境变量:', Object.keys(env || {}));
      }
      
      if (!env) {
        return new Response(JSON.stringify({ 
          error: "环境配置缺失",
          message: "Worker环境变量未正确配置" 
        }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }
      
      // 性能监控
      const startTime = isPerf || isDebug ? Date.now() : 0;
      let response;
      
      try {
        // 设置请求超时处理
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒超时
        
        const fetchPromise = handleRequest(request, env);
        response = await Promise.race([
          fetchPromise,
          new Promise((_, reject) => {
            controller.signal.addEventListener('abort', 
              () => reject(new Error('请求超时')));
          })
        ]);
        
        clearTimeout(timeoutId);
      } finally {
        if (isPerf || isDebug) {
          const duration = Date.now() - startTime;
          console.log(`请求处理: ${duration}ms, 路径: ${new URL(request.url).pathname}`);
        }
      }
      
      return response;
    } catch (error) {
      console.error("Worker错误:", error);
      return new Response(JSON.stringify({ 
        error: "内部错误", 
        message: error.message,
        stack: isDebug ? error.stack : undefined
      }), {
        status: error.message === '请求超时' ? 408 : 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  }
};