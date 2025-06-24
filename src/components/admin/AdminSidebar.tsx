'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AdminSidebarProps {
  onClose?: () => void;
  isOpen: boolean;
}

export default function AdminSidebar({ onClose, isOpen }: AdminSidebarProps) {
  const pathname = usePathname();

  // 判断是否为移动端
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  const navigation = [
    { label: '仪表盘', href: '/admin', icon: '📊' },
    { label: '文章管理', href: '/admin/posts', icon: '📝' },
    { label: '媒体库', href: '/admin/media', icon: '🖼️' },
    { label: '系统设置', href: '/admin/settings', icon: '⚙️' },
  ];

  return (
    <div
      className={`fixed md:static inset-y-0 left-0 z-50 w-56 bg-white text-gray-900 transform transition-transform duration-300 ease-in-out border-r border-gray-200 shadow-lg ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      onMouseLeave={() => { if (isMobile && onClose) onClose(); }}
    >
      <div className="flex items-center justify-between p-4 border-b border-gray-200 md:hidden">
        <h2 className="text-lg font-bold">管理面板</h2>
        <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-900 hover:bg-gray-100">
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="p-4">
        <nav className="space-y-1">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${pathname === item.href ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
              onClick={onClose}
            >
              <span className="mr-3">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}

// 移动端侧边栏触发器组件
interface SidebarTriggerProps {
  onOpen: () => void;
}

export function SidebarTrigger({ onOpen }: SidebarTriggerProps) {
  return (
    <Button variant="ghost" size="icon" onClick={onOpen} className="md:hidden">
      <Menu className="h-5 w-5" />
    </Button>
  );
}