// Type definitions for custom modules
declare module '@/lib/markdown-utils' {
  export function parseMarkdown<T = Record<string, any>>(content: string): { frontmatter: T; content: string };
  export function stringifyMarkdown(frontmatter: Record<string, any>, content: string): string;
  export function validateFrontmatter<T>(data: unknown, schema: any): T;
  export function parseAndValidateMarkdown<T>(
    content: string,
    schema: any
  ): { frontmatter: T; content: string };
}

declare module '@/lib/auth-utils' {
  export function validateUserSession(session: any): asserts session is { user: any };
  export function isAdmin(session: any): boolean;
  export function isCollaboratorOrAdmin(session: any): boolean;
  export function getCurrentUserSession(): Promise<any>;
  export function requireAdmin(): Promise<any>;
  export function requireCollaboratorOrAdmin(): Promise<any>;
}

// Add any other custom module declarations here
