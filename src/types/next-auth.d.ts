// src/types/next-auth.d.ts

import 'next-auth';
import 'next';

// Define our custom role type for use in the application
type UserRole = 'admin' | 'collaborator' | 'user';

// Extend the built-in types
declare module 'next-auth' {
  /**
   * User type with our custom fields
   */
  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    emailVerified?: Date | null;
    image?: string | null;
    role?: string;
    username?: string;
    github_access_token?: string;
    worker_session_token?: string;
  }

  /**
   * Session type with our custom fields
   */
  interface Session {
    user?: User & {
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
    expires: string;
    github_access_token?: string;
    worker_session_token?: string;
  }
}

declare module 'next-auth/jwt' {
  /**
   * JWT type with our custom fields
   */
  interface JWT {
    id: string;
    name?: string | null;
    email?: string | null;
    picture?: string | null;
    sub?: string;
    iat?: number;
    exp?: number;
    jti?: string;
    role?: string;
    username?: string;
    github_access_token?: string;
    worker_session_token?: string;
  }
}

declare module 'next' {
  interface NextApiRequest {
    user?: import('next-auth').User;
    session?: import('next-auth').Session;
  }
}

// Extend NodeJS.ProcessEnv
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NEXTAUTH_URL?: string;
      NEXTAUTH_SECRET?: string;
    }
  }
}

export type { UserRole };
