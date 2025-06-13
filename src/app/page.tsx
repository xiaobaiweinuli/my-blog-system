"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import Image from 'next/image';
import { useRouter } from 'next/navigation'; // 导入 useRouter
import { useEffect } from 'react'; // 导入 useEffect

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter(); // 初始化 useRouter

  // 在组件加载或 session 变化时检查角色并重定向
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'admin') {
      // 如果用户已认证且角色是 admin，则重定向到 /admin
      router.push('/admin');
    }
  }, [session, status, router]); // 依赖项

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8">
        Welcome to Manus Blog System!
      </h1>
      {status === "loading" && <p>Loading...</p>}
      {status === "unauthenticated" && (
        <button
          onClick={() => signIn("github")}
          className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
        >
          Sign in with GitHub
        </button>
      )}
      {status === "authenticated" && session && (
        <div className="flex flex-col items-center">
          {session.user?.image && (
            <Image
              src={session.user.image}
              alt={session.user.name || "User avatar"}
              width={80}
              height={80}
              className="rounded-full mb-4"
            />
          )}
          <p className="text-xl mb-2">Signed in as {session.user?.name}</p>
          <p className="text-lg mb-4">Role: {session.user?.role}</p> {/* Display user role */}
          <button
            onClick={() => signOut()}
            className="bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-4 rounded"
          >
            Sign out
          </button>
        </div>
      )}
    </main>
  );
}

// Add type definition for session user to include role
declare module "next-auth" {
  interface Session {
    user?: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string | null; // Add role to Session user type
      id?: string | null;
      username?: string | null;
    };
  }
  interface JWT {
    user?: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string | null; // Add role to JWT user type
      id?: string | null;
      username?: string | null;
    };
  }
}
