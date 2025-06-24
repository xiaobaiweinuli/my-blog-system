// @ts-nocheck
"use strict";

var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/utils.js
function handleCORS(request, env) {
  console.log("CORS 环境变量:", env ? env.ALLOWED_ORIGINS : "env 未定义");
  
  if (!env || !env.ALLOWED_ORIGINS) {
    console.error("env 或者 ALLOWED_ORIGINS 未定义");
    return {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS, HEAD",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, x-override, x-session-token",
      "Access-Control-Max-Age": "86400"
    };
  }
  
  const allowedOrigins = env.ALLOWED_ORIGINS
    .split(",")
    .map(origin => origin.trim().replace(/\/+$/, ""));
  
  const requestOrigin = request.headers.get("origin");
  let allowOrigin = '';
  
  if (requestOrigin && allowedOrigins.includes(requestOrigin.replace(/\/+$/, ""))) {
    allowOrigin = requestOrigin;
  } else {
    console.warn(`请求来源 ${requestOrigin} 不在允许列表中，使用第一个允许的来源`);
    allowOrigin = allowedOrigins[0] || '*';
  }
  
  console.log(`CORS 响应头: Access-Control-Allow-Origin=${allowOrigin}`);
  
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS, HEAD",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, x-override, x-session-token",
    "Access-Control-Max-Age": "86400"
  };
}
__name(handleCORS, "handleCORS");

function handleError(error, request, env) {
  console.error("错误处理:", error);
  return new Response(JSON.stringify({
    success: false,
    error: "Internal server error",
    message: error.message
  }), {
    status: 500,
    headers: {
      "Content-Type": "application/json",
      ...handleCORS(request, env)
    }
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
  const lastDotIndex = filename.lastIndexOf('.');
  return lastDotIndex > 0 ? filename.substring(0, lastDotIndex) : filename;
}

function getExtension(filename) {
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
  if (!user || user.role !== "admin" && user.role !== "collaborator") {
    return new Response(JSON.stringify({ error: "Unauthorized or Insufficient Permissions" }), { status: 403, headers: corsHeaders });
  }
  const url = new URL(request.url);
  const filename = url.searchParams.get("filename");
  if (!filename) {
    return new Response(JSON.stringify({ error: "Filename is required" }), { status: 400, headers: corsHeaders });
  }
  try {
    const { R2_BUCKET } = env;
    const existingFile = await R2_BUCKET.head(filename);
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
async function generateSessionToken(userId, userRole, env) {
  const secret = env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET 未配置");
  
  const payload = {
    sub: userId,
    role: userRole,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 86400 // 24小时过期
  };
  
  const encoder = new TextEncoder();
  const data = encoder.encode(JSON.stringify(payload));
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  
  const signature = await crypto.subtle.sign("HMAC", key, data);
  const sigBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  
  const payloadBase64 = btoa(JSON.stringify(payload))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  
  return `${payloadBase64}.${sigBase64}`;
}

async function verifySessionToken(token, env) {
  if (!token) return null;
  
  try {
    const [payloadBase64, sigBase64] = token.split(".");
    if (!payloadBase64 || !sigBase64) return null;
    
    const payload = JSON.parse(atob(payloadBase64.replace(/-/g, "+").replace(/_/g, "/")));
    const secret = env.SESSION_SECRET;
    
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(payload));
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );
    
    const sigBuffer = Uint8Array.from(atob(sigBase64.replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0));
    const isValid = await crypto.subtle.verify("HMAC", key, sigBuffer, data);
    
    if (!isValid || payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    
    return {
      id: payload.sub,
      role: payload.role
    };
  } catch (error) {
    console.error("令牌验证失败:", error);
    return null;
  }
}

// src/github.js - GitHub OAuth 安全处理
async function handleGitHubOAuth(request, env) {
  console.log("--- 开始 GitHub OAuth 流程 ---");
  
  try {
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
        headers: { "Content-Type": "application/json", ...handleCORS(request, env) }
      });
    }
    
    const { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, GITHUB_KV } = env;
    if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
      throw new Error("GitHub 客户端配置缺失");
    }
    
    console.log("正在请求 GitHub 访问令牌...");
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
      const errorText = await tokenResponse.text();
      throw new Error(`GitHub 令牌请求失败: ${tokenResponse.status} - ${errorText}`);
    }
    
    const tokenData = await tokenResponse.json();
    console.log("GitHub 令牌响应:", tokenData);
    
    if (tokenData.error) {
      throw new Error(`GitHub 错误: ${tokenData.error_description}`);
    }
    
    const { access_token, token_type } = tokenData;
    console.log("已获取 GitHub 访问令牌");
    
    // 测试令牌有效性
    const testResponse = await fetch("https://api.github.com/user", {
      headers: { 
        "Authorization": `${token_type} ${access_token}`,
        "User-Agent": "MyBlog/1.0 (https://my-blog.bxiao.workers.dev)"
      }
    });
    
    console.log("GitHub API 测试响应:", {
      status: testResponse.status,
      headers: Object.fromEntries(testResponse.headers.entries())
    });
    
    if (!testResponse.ok) {
      const testBody = await testResponse.text();
      throw new Error(`令牌测试失败: ${testResponse.status} - ${testBody}`);
    }
    
    // 获取用户信息
    const userResponse = await fetch("https://api.github.com/user", {
      headers: { 
        "Authorization": `${token_type} ${access_token}`,
        "User-Agent": "MyBlog/1.0 (https://my-blog.bxiao.workers.dev)"
      }
    });
    
    // 记录完整响应信息（关键调试步骤）
    const responseText = await userResponse.text();
    console.log("GitHub 用户信息响应:", {
      status: userResponse.status,
      headers: Object.fromEntries(userResponse.headers.entries()),
      body: responseText
    });
    
    if (!userResponse.ok) {
      // 解析 GitHub 错误响应
      let errorData = {};
      try {
        errorData = JSON.parse(responseText);
      } catch {
        errorData.message = responseText;
      }
      
      throw new Error(`GitHub 用户信息请求失败: ${userResponse.status} - ${errorData.message || "未知错误"}`);
    }
    
    const userData = JSON.parse(responseText);
    console.log("用户信息获取成功:", userData.login);
    
    // 设置用户角色 (根据用户名或其他条件)
    let role = "user";
    if (userData.login === "xiaobaiweinuli") {
      role = "admin";
    } else if (userData.login === "collaborator-username") {
      role = "collaborator";
    }
    
    // 将角色添加到用户数据中
    userData.role = role;
    
    // 生成安全的会话令牌（包含用户ID和角色）
    const sessionToken = await generateSessionToken(userData.id, role, env);
    
    // 安全存储 GitHub 访问令牌 (使用 GITHUB_KV 存储)
    await GITHUB_KV.put(
      `github_token:${userData.id}`,
      JSON.stringify({
        token: access_token,
        token_type,
        expires_at: Date.now() + (tokenData.expires_in || 3600) * 1000,
        scopes: tokenData.scope?.split(',') || []
      }),
      { expirationTtl: 3600 } // 1小时过期
    );
    
    // 存储用户信息和角色
    await GITHUB_KV.put(
      `github_user:${userData.id}`,
      JSON.stringify({
        login: userData.login,
        name: userData.name,
        avatar_url: userData.avatar_url,
        email: userData.email || null,
        html_url: userData.html_url,
        role: role
      }),
      { expirationTtl: 86400 } // 24小时过期
    );
    
    // 准备用于前端的用户数据（包含会话令牌）
    const frontendData = {
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
        role: role
      },
      session_token: sessionToken
    };
    
    // 返回JSON响应而非重定向，让前端可以直接处理
    return new Response(JSON.stringify(frontendData), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": new URL(redirectUri).origin,
        "Access-Control-Allow-Credentials": "true",
        ...handleCORS(request, env)
      }
    });
  } catch (error) {
    console.error("GitHub OAuth 错误:", {
      message: error.message,
      stack: error.stack,
      env: Object.keys(env || {})
    });
    
    const redirectUri = new URL(request.url).searchParams.get("redirect_uri") || env.FRONTEND_URL || "http://localhost:3000";
    
    return new Response(JSON.stringify({
      success: false,
      error: "认证失败，请重试",
      message: error.message,
      redirect: `${redirectUri}/login?error=auth_failed`
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...handleCORS(request, env) }
    });
  }
}
__name(handleGitHubOAuth, "handleGitHubOAuth");

// src/github-proxy.js - GitHub API 代理 (防止令牌泄露)
async function handleGitHubAPI(request, env) {
  try {
    // 验证会话令牌
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "未授权" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...handleCORS(request, env) }
      });
    }
    
    const sessionToken = authHeader.split(" ")[1];
    const user = await verifySessionToken(sessionToken, env);
    if (!user) {
      return new Response(JSON.stringify({ error: "无效的会话" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...handleCORS(request, env) }
      });
    }
    
    // 从 KV 存储获取 GitHub 令牌
    const tokenData = await env.GITHUB_KV.get(`github_token:${user.id}`, "json");
    if (!tokenData || !tokenData.token) {
      return new Response(JSON.stringify({ error: "需要重新认证" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...handleCORS(request, env) }
      });
    }
    
    // 检查令牌是否过期
    if (tokenData.expires_at && tokenData.expires_at < Date.now()) {
      return new Response(JSON.stringify({ error: "令牌已过期，请重新认证" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...handleCORS(request, env) }
      });
    }
    
    // 代理请求到 GitHub API
    const url = new URL(request.url);
    const githubPath = url.pathname.replace("/api/github/proxy/", "");
    const githubUrl = `https://api.github.com/${githubPath}${url.search}`;
    
    console.log(`代理请求到 GitHub API: ${githubUrl}`);
    
    const response = await fetch(githubUrl, {
      method: request.method,
      headers: {
        "Authorization": `${tokenData.token_type || "Bearer"} ${tokenData.token}`,
        "Accept": "application/json",
        "User-Agent": "MyBlog/1.0 (https://my-blog.bxiao.workers.dev)",
        ...request.headers
      },
      body: request.body
    });
    
    const contentType = response.headers.get("Content-Type") || "application/json";
    const headers = { ...handleCORS(request, env), "Content-Type": contentType };
    
    return new Response(response.body, {
      status: response.status,
      headers
    });
  } catch (error) {
    console.error("GitHub API 代理错误:", error);
    return new Response(JSON.stringify({ error: "服务器错误" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...handleCORS(request, env) }
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

async function handleRequest(request, env) {
  try {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: handleCORS(request, env) });
    }
    
    const url = new URL(request.url);
    const path = url.pathname;
    
    if (path === "/api/r2/upload" && request.method === "POST") {
      return handleR2Upload(request, env);
    } else if (path === "/api/r2/list" && request.method === "GET") {
      return handleR2List(request, env);
    } else if (path === "/api/r2/delete" && request.method === "DELETE") {
      return handleR2Delete(request, env);
    } else if (path === "/api/r2/check" && request.method === "GET") {
      return handleR2Check(request, env);
    } else if (path === "/api/r2/view" && request.method === "GET") {
      return handleR2View(request, env);
    } else if (path.startsWith("/api/github/oauth")) {
      return handleGitHubOAuth(request, env);
    } else if (path.startsWith("/api/github/proxy/")) {
      return handleGitHubAPI(request, env);
    } else {
      return new Response("未找到路由", {
        status: 404,
        headers: { "Content-Type": "application/json", ...handleCORS(request, env) }
      });
    }
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

// 添加单一的默认导出
export default {
  async fetch(request, env, ctx) {
    try {
      console.log('=== Worker 初始化 ===');
      console.log('环境变量检查:', env ? Object.keys(env) : "无环境变量");
      
      if (!env) {
        return new Response(JSON.stringify({ error: "环境配置缺失" }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }
      
      return handleRequest(request, env);
    } catch (error) {
      console.error("Worker 初始化错误:", error);
      return new Response(JSON.stringify({ error: "内部错误" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  }
};