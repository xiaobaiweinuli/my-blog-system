export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold text-red-600">Access Denied</h1>
      <p className="text-xl mt-4">You do not have permission to access this page.</p>
      <a href="/" className="mt-8 text-blue-500 hover:underline">
        Go back to Homepage
      </a>
    </div>
  );
}