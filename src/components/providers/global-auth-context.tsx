'use client'
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// 定义 Session 和 User 类型
interface User {
  id: string;
  name?: string;
  role: string;
  token?: string;
  [key: string]: any;
}

interface Session {
  user: User | null;
  expires?: string;
}

interface AuthContextType {
  session: Session | null;
  setSession: (session: Session | null) => void;
  loading: boolean;
  status: "loading" | "authenticated" | "unauthenticated";
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<"loading" | "authenticated" | "unauthenticated">("loading");

  useEffect(() => {
    // 初次加载
    const cacheStr = localStorage.getItem('global_session_cache');
    if (cacheStr) {
      try {
        const cache = JSON.parse(cacheStr);
        setSession(cache);
        setStatus("authenticated");
      } catch {
        setStatus("unauthenticated");
      }
    } else {
      setStatus("unauthenticated");
    }
    setLoading(false);
    // 监听 localStorage 变化
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'global_session_cache') {
        if (e.newValue) {
          try {
            setSession(JSON.parse(e.newValue));
            setStatus("authenticated");
          } catch {
            setStatus("unauthenticated");
          }
        } else {
          setSession(null);
          setStatus("unauthenticated");
        }
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  return (
    <AuthContext.Provider value={{ session, setSession, loading, status }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth 必须在 AuthProvider 内部使用');
  }
  return context;
} 