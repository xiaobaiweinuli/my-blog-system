import Link from 'next/link';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="w-64 bg-gray-800 text-white p-4 space-y-4">
        <h2 className="text-2xl font-semibold mb-6">管理面板</h2>
        <nav>
          <ul>
            <li>
              <Link href="/admin/posts" className="block py-2 px-3 rounded hover:bg-gray-700">
                文章管理
              </Link>
            </li>
            <li>
              <Link href="/admin/media" className="block py-2 px-3 rounded hover:bg-gray-700">
                媒体管理
              </Link>
            </li>
            <li>
              <Link href="/admin/settings" className="block py-2 px-3 rounded hover:bg-gray-700">
                系统设置
              </Link>
            </li>
          </ul>
        </nav>
      </aside>
      <main className="flex-1 p-6 overflow-auto">
        {children}
      </main>
    </div>
  );
}