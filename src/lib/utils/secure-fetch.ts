import { getSession } from 'next-auth/react';
import { getAuthToken, getRefreshToken } from "../auth-utils";

function isFormData(body: any): boolean {
  if (!body) return false
  return (
    (typeof FormData !== 'undefined' && body instanceof FormData) ||
    (typeof body === 'object' &&
      typeof body.append === 'function' &&
      typeof body.get === 'function' &&
      typeof body.has === 'function')
  )
}

export async function secureFetch(input: RequestInfo, init: RequestInit = {}) {
  let headers: Record<string, string> = {
    ...(init.headers as Record<string, string> || {}),
  };
  // 只有不是 FormData 时才加 application/json
  if (!isFormData(init.body)) {
    headers['Content-Type'] = 'application/json';
  } else {
    delete headers['Content-Type'];
  }
  
  let token = null;
  let refreshToken = null;
  // 优先使用NextAuth的session
  const session = await getSession();
  const user = session && session.user ? (session.user as typeof session.user & { refreshToken?: string }) : null;
  if (user?.token) {
    token = user.token;
    refreshToken = user.refreshToken;
  } else {
    token = await getAuthToken();
    refreshToken = await getRefreshToken();
  }
  if (!token) {
    throw new Error('Authentication required');
  }
  headers['Authorization'] = `Bearer ${token}`;
  let response = await fetch(input, { 
    ...init, 
    headers,
    credentials: 'include'
  });
  if (response.status === 401 && refreshToken) {
    // token 过期，尝试刷新
    const refreshRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (refreshRes.ok) {
      const refreshData = await refreshRes.json();
      if (refreshData.success && refreshData.data && refreshData.data.token) {
        // 更新 session（需要自定义刷新 session 逻辑，或强制刷新页面）
        // 这里只能简单重试一次
        headers['Authorization'] = `Bearer ${refreshData.data.token}`;
        response = await fetch(input, { ...init, headers, credentials: 'include' });
      }
    }
  }
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Request failed with status ${response.status}`);
  }
  return response;
}