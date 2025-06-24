"use client";

import { SessionProvider } from "next-auth/react";
import { Session } from "next-auth";
import dynamic from 'next/dynamic';
import { handleClientError } from '@/lib/error';
import { useEffect } from 'react';

const ErrorBoundary = dynamic(
  () => import('react-error-boundary').then((mod) => mod.ErrorBoundary),
  { ssr: false }
);

interface NextAuthSessionProviderProps {
  children: React.ReactNode;
  session?: Session | null;
}

function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Session Error:', error);
  }, [error]);

  return (
    <div role="alert" className="p-4 bg-red-50 border-l-4 border-red-400">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <p className="text-sm text-red-700">
            There was a problem with the session. Please try again later.
            <button
              onClick={resetErrorBoundary}
              className="ml-2 text-sm font-medium text-red-700 underline hover:text-red-600"
            >
              Retry
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function NextAuthSessionProvider({
  children,
  session,
}: NextAuthSessionProviderProps) {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error) => {
        // Handle the error in your preferred way
        handleClientError(error);
      }}
    >
      <SessionProvider session={session} refetchInterval={5 * 60}>
        {children}
      </SessionProvider>
    </ErrorBoundary>
  );
}

// Add display name for debugging
NextAuthSessionProvider.displayName = 'NextAuthSessionProvider';