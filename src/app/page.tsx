'use client';
import { useSession, signIn, signOut } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function Home() {
  const { data: session, status } = useSession();
  const [site, setSite] = useState({
    siteTitle: '',
    siteDescription: '',
    avatarUrl: '',
    footerText: '',
  });
  useEffect(() => {
    fetch('/api/settings').then(res => res.json()).then(data => setSite(data));
  }, []);

  const handleWorkerSignIn = () => {
    // The GitHub App's client ID
    const clientId = process.env.NEXT_PUBLIC_GITHUB_ID;
    // The callback URL registered in your GitHub App settings
    const redirectUri = 'http://localhost:3000/auth/worker/callback';
    // Construct the GitHub authorization URL
    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=read:user,repo`;
    // Redirect the user to GitHub for authorization
    window.location.href = githubAuthUrl;
  };

  if (status === 'loading') {
    return <div className="flex min-h-screen items-center justify-center text-xl">加载中...</div>;
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
      <div className="w-full max-w-xl mx-auto bg-white/80 dark:bg-gray-900/80 rounded-2xl shadow-xl p-8 flex flex-col items-center mt-16">
        {site.avatarUrl && (
          <Image src={site.avatarUrl} alt="网站头像" width={80} height={80} className="rounded-full border-4 border-blue-200 shadow-md mb-4" />
        )}
        <h1 className="text-4xl font-extrabold mb-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-transparent bg-clip-text">{site.siteTitle || '欢迎来到我的博客系统'}</h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 text-center">{site.siteDescription || '记录、分享、交流，发现更多精彩内容。'}</p>
        <div className="w-full flex flex-col items-center mb-8">
          {session ? (
            <div className="flex flex-col items-center gap-2 w-full">
              {session.user?.image && (
                <Image
                  src={session.user.image}
                  alt="User Avatar"
                  width={80}
                  height={80}
                  className="rounded-full border-4 border-blue-200 shadow-md"
                />
              )}
              <div className="text-xl font-bold mt-2">{session.user?.name || session.user?.username}</div>
              <div className="text-sm text-gray-500 mb-2">角色：{session.user?.role || '用户'}</div>
              <div className="flex gap-4 mt-2">
                <button
                  onClick={() => signOut()}
                  className="rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600 transition"
                >
                  退出登录
                </button>
                <Link href="/blog" className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 transition">
                  进入博客
                </Link>
                {session.user?.role === 'admin' && (
                  <Link href="/admin" className="rounded bg-green-500 px-4 py-2 text-white hover:bg-green-600 transition">
                    管理后台
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 w-full">
              <div className="text-lg text-gray-700 dark:text-gray-200">你还未登录</div>
              <button
                onClick={handleWorkerSignIn}
                className="rounded bg-blue-500 px-6 py-2 text-white text-lg hover:bg-blue-600 transition"
              >
                使用 GitHub 登录
              </button>
              <Link href="/blog" className="rounded bg-gray-400 px-4 py-2 text-white hover:bg-gray-500 transition">
                先去逛逛博客
              </Link>
            </div>
          )}
        </div>
      </div>
      <footer className="mt-12 text-gray-400 text-sm text-center">
        {site.footerText || `© ${new Date().getFullYear()} 我的博客系统 | 由 Next.js & Tailwind CSS 强力驱动`}
      </footer>
    </main>
  );
}
