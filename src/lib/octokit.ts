import { Octokit } from '@octokit/rest';

/**
 * 初始化并返回Octokit客户端实例
 * @param accessToken - GitHub访问令牌
 * @returns Octokit实例
 * @throws {Error} 如果访问令牌未提供
 */
export function getOctokit(accessToken: string): Octokit {
  if (!accessToken) {
    throw new Error("GitHub访问令牌未提供");
  }

  return new Octokit({
    auth: accessToken,
    userAgent: 'My Blog System v1.0.0',
    baseUrl: 'https://api.github.com',
  });
}