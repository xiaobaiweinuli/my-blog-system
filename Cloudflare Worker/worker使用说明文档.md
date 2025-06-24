# worker部署后的链接为：https://my-blog.bxiao.workers.dev/

# Cloudflare Workers 详细功能说明与调用指南

## 一、Worker 整体架构与功能概述

该 Cloudflare Worker 实现了一个集成 R2 存储管理与 GitHub OAuth 认证的多功能后端服务，采用模块化设计，主要包含以下核心模块：

- **CORS 处理模块**：统一处理跨域请求，支持动态来源白名单
- **R2 存储操作模块**：完整实现文件上传、列表、删除、查看功能
- **GitHub OAuth 认证模块**：安全的第三方登录流程，生成会话令牌
- **GitHub API 代理模块**：服务器端代理 GitHub 请求，保护访问令牌
- **安全认证模块**：基于 JWT 的会话管理与角色权限控制

## 二、R2 存储功能详解

### 2.1 文件上传功能（`POST /api/r2/upload`）

#### 功能特性

- 支持 `multipart/form-data` 格式文件上传
- 自动处理同名文件冲突，可选择覆盖或生成唯一文件名
- 记录文件元数据（Content-Type 等）
- 生成可公开访问的文件 URL

#### 权限控制

仅允许 `admin` 或 `collaborator` 角色访问，通过 JWT 会话令牌验证

#### 请求结构

**请求头**：

```http
Authorization: Bearer <会话令牌>
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary...
x-override: true (可选，覆盖已有文件)
```

**请求体**：

```form-data
------WebKitFormBoundary...
Content-Disposition: form-data; name="file"; filename="example.jpg"
Content-Type: image/jpeg

<文件二进制数据>
------WebKitFormBoundary...--
```

#### 响应结构

**成功响应（201 Created）**：

```json
{
	"success": true,
	"originalFilename": "example.jpg",
	"filename": "example.jpg",
	"url": "https://your-domain.com/api/r2/view?filename=example.jpg",
	"wasOverridden": false,
	"message": "文件已成功上传"
}
```

**错误响应示例**：

- 403 Forbidden：权限不足
- 415 Unsupport Media Type：非表单数据格式
- 500 Internal Server Error：上传过程异常

### 2.2 文件列表功能（`GET /api/r2/list`）

#### 功能特性

- 支持按文件名前缀过滤（`prefix` 参数）
- 分页查询（`limit` 参数控制每页数量）
- 返回完整文件元数据（大小、修改时间、Content-Type 等）

#### 权限控制

仅允许 `admin` 或 `collaborator` 角色访问

#### 请求参数

```http
GET /api/r2/list?prefix=images/&limit=50 HTTP/1.1
Authorization: Bearer <会话令牌>
```

#### 响应结构

```json
[
	{
		"key": "images/example.jpg",
		"etag": "a1b2c3d4e5f6",
		"size": 123456,
		"modified": "2025-06-17T15:30:00.000Z",
		"httpMetadata": {
			"contentType": "image/jpeg"
		}
	},
	{
		"key": "images/background.png",
		"etag": "f6e5d4c3b2a1",
		"size": 789012,
		"modified": "2025-06-10T08:15:00.000Z",
		"httpMetadata": {
			"contentType": "image/png"
		}
	}
]
```

### 2.3 文件删除功能（`DELETE /api/r2/delete`）

#### 功能特性

- 支持删除指定文件名的文件
- 安全验证机制，防止误删除
- 返回操作成功/失败状态

#### 权限控制

仅允许 `admin` 角色访问

#### 请求结构

**请求头**：

```http
Authorization: Bearer <会话令牌>
Content-Type: application/json
```

**请求体**：

```json
{
	"filename": "images/example.jpg"
}
```

#### 响应结构

**成功响应（200 OK）**：

```json
{
	"success": true,
	"message": "File images/example.jpg deleted successfully"
}
```

### 2.4 文件查看功能（`GET /api/r2/view`）

#### 功能特性

- 支持图片直接展示（返回二进制数据）
- 非图片文件自动设置下载头
- 公开访问，无需身份验证
- 支持文件不存在时返回 404 错误

#### 请求参数

```http
GET /api/r2/view?filename=images/example.jpg HTTP/1.1
```

#### 响应示例

**图片文件响应**：

```http
HTTP/1.1 200 OK
Content-Type: image/jpeg
Access-Control-Allow-Origin: *
...

<图片二进制数据>
```

**非图片文件响应**：

```http
HTTP/1.1 200 OK
Content-Type: application/pdf
Content-Disposition: attachment; filename="document.pdf"
Access-Control-Allow-Origin: *
...

<PDF文件二进制数据>
```

## 三、GitHub OAuth 认证流程

### 3.1 认证流程详解

1. **前端发起认证**  
   前端生成 GitHub 授权链接：

   ```
   https://github.com/login/oauth/authorize?
   client_id={GITHUB_CLIENT_ID}&
   redirect_uri={FRONTEND_URL}/callback&
   scope=user,repo
   ```

2. **用户授权**  
   用户在 GitHub 授权页面同意授权后，GitHub 重定向到指定的 `redirect_uri`，并附带 `code` 参数：

   ```
   {FRONTEND_URL}/callback?code=abc123456789
   ```

3. **后端处理授权码**  
   前端向后端发送请求：

   ```javascript
   fetch(`/api/github/oauth?code=abc123456789&redirect_uri=${FRONTEND_URL}`);
   ```

4. **Worker 处理流程**

   - 验证 GitHub 授权码，获取访问令牌
   - 调用 GitHub API 获取用户信息
   - 根据用户登录名设置角色（`admin`/`collaborator`/`user`）
   - 生成包含用户信息的 JWT 会话令牌
   - 将令牌和用户信息存储到 KV 中

5. **返回响应**  
   后端返回包含会话令牌和用户信息的响应，前端存储令牌用于后续请求

### 3.2 会话令牌机制

#### 令牌生成流程

1. 基于 `env.SESSION_SECRET` 生成 HMAC-SHA256 签名密钥
2. 构建令牌 payload：
   ```json
   {
   	"sub": "123456", // 用户ID
   	"role": "admin", // 角色
   	"iat": 1686902400, // 签发时间
   	"exp": 1686988800 // 过期时间（24小时）
   }
   ```
3. 使用 HMAC 算法对 payload 签名，生成 `payloadBase64.signatureBase64` 格式令牌

#### 令牌验证流程

1. 解析令牌为 payload 和签名两部分
2. 验证签名是否与 payload 匹配
3. 检查令牌是否过期
4. 返回验证通过的用户角色信息

## 四、环境配置与部署指南

### 4.1 必需环境变量配置

| 变量名                 | 类型         | 说明                                                          | 配置示例                                    |
| ---------------------- | ------------ | ------------------------------------------------------------- | ------------------------------------------- |
| `R2_BUCKET`            | R2 Bucket    | R2 存储桶绑定，在 Cloudflare Dashboard 中配置                 | `my-r2-bucket`                              |
| `GITHUB_CLIENT_ID`     | 字符串       | GitHub OAuth 客户端 ID，需在 GitHub Developer Settings 中创建 | `abc1234567890`                             |
| `GITHUB_CLIENT_SECRET` | 字符串       | GitHub OAuth 客户端密钥，需与 Client ID 对应                  | `xyz0987654321`                             |
| `GITHUB_KV`            | KV Namespace | 存储 GitHub 令牌的 KV 命名空间，用于持久化存储                | `github-tokens`                             |
| `SESSION_SECRET`       | 字符串       | 会话令牌签名密钥，需使用强密码（建议 32 位以上随机字符）      | `s3cr3t-k3y-42-charact3rs`                  |
| `ALLOWED_ORIGINS`      | 字符串       | 允许的跨域来源，多个来源用逗号分隔（支持通配符）              | `https://example.com,https://*.example.net` |

### 4.2 可选优化配置

| 变量名           | 类型   | 说明                                             | 默认值                  |
| ---------------- | ------ | ------------------------------------------------ | ----------------------- |
| `FRONTEND_URL`   | 字符串 | 前端应用 URL，用于 OAuth 重定向和 CORS 白名单    | `http://localhost:3000` |
| `R2_BUCKET_NAME` | 字符串 | R2 存储桶名称，用于日志记录                      | 从 `R2_BUCKET` 自动获取 |
| `R2_ACCOUNT_ID`  | 字符串 | R2 账户 ID，用于日志记录                         | 无                      |
| `SESSION_EXPIRE` | 数字   | 会话令牌过期时间（秒），默认 24 小时（86400 秒） | `86400`                 |

### 4.3 部署步骤

1. **创建 Cloudflare Worker**  
   在 Cloudflare Dashboard 中创建新 Worker，粘贴代码并保存。

2. **绑定 R2 存储桶**

   - 进入 Worker 配置页 → **Settings** → **Bindings**
   - 点击 **Add Binding**，选择 **R2 Bucket**
   - 输入变量名 `R2_BUCKET`，选择对应的 R2 存储桶

3. **配置 KV 命名空间**

   - 提前创建 KV 命名空间（如 `github-tokens`）
   - 在 Worker 绑定中添加 KV 绑定，变量名 `GITHUB_KV`

4. **设置环境变量**  
   在 **Settings** → **Environment Variables** 中添加：

   - `GITHUB_CLIENT_ID`
   - `GITHUB_CLIENT_SECRET`
   - `SESSION_SECRET`
   - `ALLOWED_ORIGINS`
   - `FRONTEND_URL`（可选）

5. **部署 Worker**  
   点击 **Save and Deploy**，确保部署状态为成功。

## 五、安全机制与权限控制

### 5.1 角色权限矩阵

| 功能模块         | 操作     | `admin` | `collaborator` | `user` | 未认证 |
| ---------------- | -------- | ------- | -------------- | ------ | ------ |
| **R2 存储**      | 文件上传 | ✅      | ✅             | ❌     | ❌     |
|                  | 文件列表 | ✅      | ✅             | ❌     | ❌     |
|                  | 文件删除 | ✅      | ❌             | ❌     | ❌     |
|                  | 文件查看 | ✅      | ✅             | ✅     | ✅     |
| **GitHub OAuth** | 认证流程 | ✅      | ✅             | ✅     | ✅     |
| **GitHub 代理**  | API 请求 | ✅      | ✅             | ✅     | ❌     |

### 5.2 安全防护措施

1. **CORS 严格控制**

   - 支持动态来源白名单，非白名单来源默认拒绝
   - 限制允许的 HTTP 方法（GET/POST/DELETE 等）
   - 自定义允许的请求头（`Content-Type`, `Authorization` 等）

2. **会话令牌安全**

   - 使用 HMAC-SHA256 签名，防止令牌篡改
   - 合理设置过期时间（24小时），降低泄露风险
   - 令牌内容仅包含必要信息（用户ID、角色），不存储敏感数据

3. **GitHub 令牌保护**
   - 不在前端暴露 GitHub 访问令牌
   - 通过服务器端代理 GitHub API 请求
   - 令牌在 KV 中加密存储（实际代码中可扩展加密逻辑）
   - 设置令牌过期时间（1小时），自动失效

## 六、错误处理与调试指南

### 6.1 常见错误代码与解决方案

| 状态码 | 错误类型               | 可能原因               | 解决方案                                                                         |
| ------ | ---------------------- | ---------------------- | -------------------------------------------------------------------------------- |
| 400    | Bad Request            | 请求参数缺失或格式错误 | 检查请求参数（如 `filename`、`code`），确保格式正确                              |
| 401    | Unauthorized           | 会话令牌无效或过期     | 重新获取会话令牌（通过 GitHub 登录）                                             |
| 403    | Forbidden              | 权限不足               | 确认用户角色（`admin`/`collaborator`），或使用正确权限的账号登录                 |
| 404    | Not Found              | 资源不存在             | 检查文件名或端点路径是否正确                                                     |
| 415    | Unsupported Media Type | 上传文件格式错误       | 确保使用 `multipart/form-data` 格式，且包含 `file` 字段                          |
| 500    | Internal Server Error  | 环境配置错误或代码异常 | 检查环境变量是否正确配置（如 `R2_BUCKET`、`GITHUB_CLIENT_ID`），查看 Worker 日志 |

### 6.2 调试工具与日志分析

1. **Cloudflare Dashboard 日志**

   - 进入 Worker 页面 → **Logs**，查看实时请求日志
   - 关键日志关键词：
     - `CORS 环境变量:` 检查 CORS 配置是否正确
     - `R2 上传错误:` 定位文件上传问题
     - `GitHub OAuth 错误:` 排查认证流程异常
     - `令牌验证失败:` 会话令牌相关问题

2. **本地开发调试**  
   使用 [Wrangler](https://developers.cloudflare.com/workers/wrangler/) 工具本地调试：

   ```bash
   # 安装 Wrangler
   npm install -g @cloudflare/wrangler

   # 配置环境变量（.env 文件）
   R2_BUCKET=my-r2-bucket
   GITHUB_CLIENT_ID=abc123
   # 其他环境变量...

   # 本地运行 Worker
   wrangler dev
   ```

3. **请求模拟测试**  
   使用 Postman 或 curl 测试接口：

   ```bash
   # 测试文件上传（需替换令牌和文件路径）
   curl -X POST "https://your-worker.com/api/r2/upload" \
     -H "Authorization: Bearer <会话令牌>" \
     -F "file=@/path/to/example.jpg"

   # 测试 GitHub OAuth（需替换参数）
   curl "https://your-worker.com/api/github/oauth?code=abc123&redirect_uri=https://example.com"
   ```

## 七、前端集成示例

### 7.1 完整的 GitHub 登录流程

```javascript
// 1. 生成 GitHub 授权链接
function generateGitHubAuthUrl() {
	const clientId = '你的 GitHub Client ID';
	const redirectUri = 'https://your-frontend.com/callback';
	const scope = 'user,repo,read:org';
	return `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;
}

// 2. 处理回调页面的授权码
async function handleAuthCallback(code) {
	try {
		const response = await fetch(`/api/github/oauth?code=${code}&redirect_uri=https://your-frontend.com`);
		const data = await response.json();

		if (data.success) {
			// 存储会话令牌
			localStorage.setItem('sessionToken', data.session_token);
			localStorage.setItem('userRole', data.user.role);
			// 重定向到首页
			window.location.href = '/';
		} else {
			throw new Error(data.message || '认证失败');
		}
	} catch (error) {
		console.error('认证处理错误:', error);
		// 显示错误信息或重定向到登录页
	}
}

// 3. 保护需要权限的接口
async function fetchProtectedResource(endpoint) {
	const sessionToken = localStorage.getItem('sessionToken');
	if (!sessionToken) {
		throw new Error('未登录');
	}

	const response = await fetch(endpoint, {
		headers: {
			Authorization: `Bearer ${sessionToken}`,
		},
	});

	if (!response.ok) {
		if (response.status === 401) {
			// 令牌过期，清除本地存储并重新登录
			localStorage.removeItem('sessionToken');
			localStorage.removeItem('userRole');
			throw new Error('会话已过期，请重新登录');
		}
		throw new Error(await response.text());
	}

	return response.json();
}
```

### 7.2 R2 文件操作集成

```javascript
// 上传文件到 R2
async function uploadFileToR2(file) {
	const formData = new FormData();
	formData.append('file', file);

	const response = await fetch('/api/r2/upload', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${localStorage.getItem('sessionToken')}`,
			'x-override': 'true', // 可选，覆盖已有文件
		},
		body: formData,
	});

	return response.json();
}

// 列出 R2 文件
async function listR2Files(prefix = '') {
	const response = await fetch(`/api/r2/list?prefix=${prefix}`, {
		headers: {
			Authorization: `Bearer ${localStorage.getItem('sessionToken')}`,
		},
	});

	return response.json();
}

// 删除 R2 文件
async function deleteR2File(filename) {
	const response = await fetch('/api/r2/delete', {
		method: 'DELETE',
		headers: {
			Authorization: `Bearer ${localStorage.getItem('sessionToken')}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ filename }),
	});

	return response.json();
}

// 查看 R2 文件
function viewR2File(filename) {
	const url = `/api/r2/view?filename=${encodeURIComponent(filename)}`;
	// 图片直接打开，其他文件下载
	const isImage = filename.match(/\.(jpg|jpeg|png|gif|webp)$/i);
	if (isImage) {
		window.open(url);
	} else {
		const a = document.createElement('a');
		a.href = url;
		a.download = filename;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
	}
}
```

## 八、扩展与优化建议

### 8.1 功能扩展方向

1. **多存储桶支持**  
   修改代码以支持多个 R2 存储桶，通过请求参数或环境变量指定使用的存储桶

2. **文件版本控制**  
   扩展上传逻辑，保留文件历史版本，支持版本回滚

3. **目录管理**  
   实现虚拟目录结构，支持创建/删除目录，按目录组织文件

4. **批量操作**  
   增加批量上传、批量删除功能，提高管理效率

### 8.2 性能优化

1. **请求缓存**  
   对文件列表等非实时数据添加缓存机制，设置合理的缓存时间

2. **并行处理**  
   优化批量操作逻辑，使用并行请求提高处理效率

3. **流式上传**  
   支持大文件流式上传，避免内存溢出

### 8.3 安全增强

1. **双因素认证**  
   为敏感操作（如删除文件）添加二次认证机制

2. **IP 白名单**  
   限制特定 IP 地址访问管理接口

3. **操作审计日志**  
   记录关键操作（如删除、上传）的日志，包括用户、时间、操作内容

通过以上详细说明，您可以全面了解该 Worker 的功能架构、使用方法与安全机制，可以快速掌握系统集成与操作流程。可以全面且正确的理解该 Worker 的功能及正确的调用方式。
