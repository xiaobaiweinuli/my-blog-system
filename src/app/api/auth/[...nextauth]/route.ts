import NextAuth from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import { Octokit } from "@octokit/rest";

export const authOptions = {
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_ID as string,
      clientSecret: process.env.GITHUB_SECRET as string,
      authorization: { params: { scope: "read:user repo" } }, // Request repo scope
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET as string,
  useSecureCookies: process.env.NODE_ENV === "production",
  callbacks: {
    async jwt({ token, account, profile }: any) {
      // If account is present and has an access_token, update the token.
      // This covers initial sign-in and token refresh.
      if (account?.access_token) {
        token.accessToken = account.access_token;
      }

      // If profile is present (typically on initial sign-in), update user details and permissions.
      if (profile) {
        token.user = {
          ...token.user, // Preserve any existing user data in token
          id: profile.id,
          name: profile.name,
          email: profile.email,
          image: profile.avatar_url,
          username: profile.login,
        };
        console.log("[JWT Callback] Profile data processed for user:", profile.login);

        // Perform permission check if accessToken is available in the token
        if (token.accessToken) {
          const octokit = new Octokit({ auth: token.accessToken });
          try {
            console.log("[JWT Callback] Fetching permission for repo:", process.env.GITHUB_BLOG_REPO_OWNER, "/", process.env.GITHUB_BLOG_REPO_NAME, "for user:", profile.login);
            const { data: permission } = await octokit.repos.getCollaboratorPermissionLevel({
              owner: process.env.GITHUB_BLOG_REPO_OWNER as string,
              repo: process.env.GITHUB_BLOG_REPO_NAME as string,
              username: profile.login,
            });
            console.log("[JWT Callback] Permission data received:", permission);

            if (permission.permission === "admin") {
              token.user.role = "admin";
            } else if (permission.permission === "write") {
              token.user.role = "collaborator";
            } else {
              token.user.role = "user";
            }
            console.log("[JWT Callback] Assigned role:", token.user.role);
          } catch (error) {
            console.error("[JWT Callback] Error fetching repository permission:", error);
            token.user.role = "user"; // Default to 'user' on error
          }
        } else {
          console.log("[JWT Callback] No access token in token when profile was present; skipping permission check. Assigning default role.");
          // Ensure role is set, defaulting to 'user' if not determined by permissions
          token.user.role = token.user.role || "user";
        }
      }
      // For subsequent calls where account/profile might not be present (e.g., session validation),
      // the existing token (with accessToken and user details if previously set) is returned.
      console.log("[JWT Callback] Returning token:", JSON.stringify(token, null, 2));
      return token;
    },
    async session({ session, token }: any) {
      session.accessToken = token.accessToken;
      if (token.user) {
        session.user = token.user; // Ensure role is passed to session
      }
      console.log("[Session Callback] Returning session:", session);
      return session;
    },
  },
};


const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

// Import NextAuth default types for extension
import { DefaultSession, DefaultJWT } from "next-auth";

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    accessToken?: string; // <-- Ensure this line exists
    user?: {
      id?: string | number; // Add id to user object
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string; // <-- Ensure this line exists
      username?: string; // Add username to user object
    } & DefaultSession["user"]; // Extend default user properties
  }

  /**
   * Returned by the `jwt` callback and `getToken`, and received as a prop on the `SessionProvider` React Context
   */
  interface JWT {
    accessToken?: string; // <-- Ensure this line exists
    user?: {
      id?: string | number; // Add id to user object
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string; // <-- Ensure this line exists
      username?: string; // Add username to user object
    } & DefaultJWT["user"]; // Extend default user properties
  }
}