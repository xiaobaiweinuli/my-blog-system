'use client';

import { useState } from 'react';
import AdminSidebar, { SidebarTrigger } from '@/components/admin/AdminSidebar';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { data: session, status } = useSession();
  const router = useRouter();

  // 权限校验
  if (typeof window !== 'undefined' && status !== 'loading') {
    const role = session?.user?.role;
    if (role !== 'admin' && role !== 'collaborator') {
      router.replace('/');
      return null;
    }
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* 移动端侧边栏触发器 */}
      <SidebarTrigger onOpen={() => setIsSidebarOpen(true)} />

      {/* 侧边栏组件 */}
      <AdminSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* 主内容区域 */}
      <main className={`flex-1 p-4 md:p-6 overflow-auto transition-all duration-300 ${isSidebarOpen ? 'md:ml-0' : ''}`}>
        {children}
      </main>

      {/* 移动端遮罩层 */}
      {/* {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )} */}
    </div>
  );
}