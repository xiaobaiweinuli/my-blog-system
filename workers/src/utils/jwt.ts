import { JWTPayload, User, ApiError } from '../types';

/**
 * JWT 工具类
 */
export class JWT {
  private secret: string;

  constructor(secret: string) {
    this.secret = secret;
  }

  /**
   * 生成访问 Token
   */
  async signAccessToken(payload: Omit<JWTPayload, 'iat' | 'exp' | 'type'>, expiresIn: number = 15 * 60): Promise<string> {
    return this.sign({ ...payload, type: 'access' }, expiresIn);
  }

  /**
   * 生成刷新 Token
   */
  async signRefreshToken(payload: Omit<JWTPayload, 'iat' | 'exp' | 'type' | 'jti'>, expiresIn: number = 7 * 24 * 60 * 60): Promise<string> {
    const jti = crypto.randomUUID();
    return this.sign({ ...payload, type: 'refresh', jti }, expiresIn);
  }

  /**
   * 生成 JWT Token
   */
  async sign(payload: Omit<JWTPayload, 'iat' | 'exp'>, expiresIn: number = 7 * 24 * 60 * 60): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    const fullPayload: JWTPayload = {
      ...payload,
      iat: now,
      exp: now + expiresIn,
    };

    const header = {
      alg: 'HS256',
      typ: 'JWT',
    };

    const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
    const encodedPayload = this.base64UrlEncode(JSON.stringify(fullPayload));
    
    const signature = await this.sign256(`${encodedHeader}.${encodedPayload}`);
    
    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  /**
   * 验证访问 Token
   */
  async verifyAccessToken(token: string): Promise<JWTPayload> {
    const payload = await this.verify(token);
    if (payload.type !== 'access') {
      throw new ApiError('Invalid access token', 401);
    }
    return payload;
  }

  /**
   * 验证刷新 Token
   */
  async verifyRefreshToken(token: string): Promise<JWTPayload> {
    const payload = await this.verify(token);
    if (payload.type !== 'refresh') {
      throw new ApiError('Invalid refresh token', 401);
    }
    return payload;
  }

  /**
   * 验证 JWT Token
   */
  async verify(token: string): Promise<JWTPayload> {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new ApiError('Invalid token format', 401);
    }

    const [encodedHeader, encodedPayload, signature] = parts;
    
    // 验证签名
    const expectedSignature = await this.sign256(`${encodedHeader}.${encodedPayload}`);
    if (signature !== expectedSignature) {
      throw new ApiError('Invalid token signature', 401);
    }

    // 解析载荷
    const payload: JWTPayload = JSON.parse(this.base64UrlDecode(encodedPayload));
    
    // 检查过期时间
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      throw new ApiError('Token has expired', 401);
    }

    return payload;
  }

  /**
   * 从用户信息生成 Token
   */
  async generateUserToken(user: Partial<User> & { id: string; username: string; email: string; role: string }): Promise<string> {
    return this.sign({
      username: user.username,
      email: user.email,
      role: user.role,
      userId: user.id, // 兼容保留
    });
  }

  /**
   * Base64 URL 编码
   */
  private base64UrlEncode(str: string): string {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const base64 = btoa(String.fromCharCode(...data));
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }

  /**
   * Base64 URL 解码
   */
  private base64UrlDecode(str: string): string {
    // 添加填充
    str += '='.repeat((4 - str.length % 4) % 4);
    // 替换字符
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    
    const binary = atob(str);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    
    const decoder = new TextDecoder();
    return decoder.decode(bytes);
  }

  /**
   * HMAC SHA256 签名
   */
  private async sign256(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(this.secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
    const signatureArray = Array.from(new Uint8Array(signature));
    const base64 = btoa(String.fromCharCode(...signatureArray));
    
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }
}

/**
 * 从请求头中提取 Token
 */
export function extractTokenFromHeader(request: Request): string | null {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.slice(7);
}

/**
 * 验证用户权限
 */
export function hasPermission(userRole: string, requiredRole: string): boolean {
  const roleHierarchy = {
    'user': 0,
    'collaborator': 1,
    'admin': 2,
  };

  const userLevel = roleHierarchy[userRole as keyof typeof roleHierarchy] ?? -1;
  const requiredLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] ?? 999;

  return userLevel >= requiredLevel;
}

/**
 * 检查是否为管理员邮箱
 */
export function isAdminEmail(email: string, adminEmails: string[]): boolean {
  return adminEmails.includes(email);
}

/**
 * Token 管理器
 */
export class TokenManager {
  private jwt: JWT;
  private refreshTokenStore: Map<string, { userId: string; expiresAt: number }>;

  constructor(secret: string) {
    this.jwt = new JWT(secret);
    this.refreshTokenStore = new Map();
  }

  /**
   * 生成访问和刷新token对
   */
  async generateTokenPair(user: { userId: string; username: string; email: string; role: string }): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    const accessTokenExpiresIn = 15 * 60; // 15分钟
    const refreshTokenExpiresIn = 7 * 24 * 60 * 60; // 7天

    const accessToken = await this.jwt.signAccessToken(user, accessTokenExpiresIn);
    const refreshToken = await this.jwt.signRefreshToken(user, refreshTokenExpiresIn);

    // 存储刷新token
    this.refreshTokenStore.set(refreshToken, {
        userId: user.userId,
      expiresAt: Math.floor(Date.now() / 1000) + refreshTokenExpiresIn,
      });

    return {
      accessToken,
      refreshToken,
      expiresIn: accessTokenExpiresIn,
    };
  }

  /**
   * 使用刷新token获取新的访问token
   */
  async refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string;
    expiresIn: number;
  }> {
    const storedToken = this.refreshTokenStore.get(refreshToken);
    if (!storedToken) {
        throw new ApiError('Invalid refresh token', 401);
      }

    const now = Math.floor(Date.now() / 1000);
    if (storedToken.expiresAt < now) {
      this.refreshTokenStore.delete(refreshToken);
      throw new ApiError('Refresh token has expired', 401);
      }

    // 验证刷新token
    const payload = await this.jwt.verifyRefreshToken(refreshToken);

      // 生成新的访问token
      const accessTokenExpiresIn = 15 * 60; // 15分钟
      const accessToken = await this.jwt.signAccessToken({
      userId: payload.userId,
      username: payload.username,
      email: payload.email,
      role: payload.role,
      }, accessTokenExpiresIn);

      return {
        accessToken,
        expiresIn: accessTokenExpiresIn,
      };
  }

  /**
   * 撤销刷新token
   */
  async revokeRefreshToken(refreshToken: string): Promise<void> {
    this.refreshTokenStore.delete(refreshToken);
  }

  /**
   * 撤销用户的所有token
   */
  revokeAllUserTokens(userId: string): void {
    for (const [token, data] of this.refreshTokenStore.entries()) {
      if (data.userId === userId) {
        this.refreshTokenStore.delete(token);
      }
    }
  }

  /**
   * 清理过期的token
   */
  cleanupExpiredTokens(): void {
    const now = Math.floor(Date.now() / 1000);
    for (const [token, data] of this.refreshTokenStore.entries()) {
      if (data.expiresAt < now) {
        this.refreshTokenStore.delete(token);
      }
    }
  }

  /**
   * 验证访问token
   */
  async verifyAccessToken(token: string): Promise<JWTPayload> {
    return this.jwt.verifyAccessToken(token);
  }

  /**
   * 验证刷新token
   */
  async verifyRefreshToken(token: string): Promise<JWTPayload> {
    return this.jwt.verifyRefreshToken(token);
  }
}

// 全局token管理器实例
let tokenManager: TokenManager | null = null;

export function getTokenManager(secret: string): TokenManager {
  if (!tokenManager) {
    tokenManager = new TokenManager(secret);
  }
  return tokenManager;
}
