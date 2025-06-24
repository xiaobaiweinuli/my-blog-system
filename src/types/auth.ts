// 集中定义NextAuth相关类型声明，避免重复定义

import { DefaultSession, DefaultUser } from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  interface User extends DefaultUser {
    role?: string;
    username?: string;
  }

  interface Session extends DefaultSession {
    user?: User & DefaultSession["user"];
    accessToken?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    user?: import("next-auth").User;
    accessToken?: string;
  }
}

// 补充DefaultJWT类型定义（如果next-auth未提供）
declare module "next-auth/jwt" {
  interface DefaultJWT {
    sub?: string;
    iat?: number;
    exp?: number;
  }
}