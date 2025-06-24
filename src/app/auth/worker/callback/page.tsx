'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';

function Callback() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const code = searchParams.get('code');
    if (code) {
      const workerUrl = `https://my-blog.bxiao.workers.dev/api/github/oauth?code=${code}`;

      fetch(workerUrl)
        .then(res => {
            if (!res.ok) {
                throw new Error(`Worker API responded with status: ${res.status}`);
            }
            return res.json();
        })
        .then(data => {
          if (data.success && data.user) {
            signIn('credentials', {
              redirect: false,
              user: JSON.stringify(data.user),
              github_access_token: data.access_token,
              worker_session_token: data.session_token,
            }).then(result => {
              if (result?.ok) {
                router.push('/');
              } else {
                console.error('NextAuth sign-in failed:', result?.error);
                router.push(`/auth/error?error=${result?.error || 'SignInError'}`);
              }
            });
          } else {
            console.error('Worker API error:', data.error);
            router.push(`/auth/error?error=${data.error || 'WorkerApiError'}`);
          }
        })
        .catch(error => {
          console.error('Fetch error:', error);
          router.push(`/auth/error?error=${error.message || 'FetchError'}`);
        });
    } else {
        console.error('No authorization code found in URL');
        router.push('/auth/error?error=NoCode');
    }
  }, [searchParams, router]);

  return <div>Authenticating... Please wait.</div>;
}

export default function CallbackPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <Callback />
        </Suspense>
    );
}
