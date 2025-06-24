'use client';

import React, { useState, useEffect } from 'react';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  fluid?: boolean;
  noPadding?: boolean;
}

/**
 * 高级响应式布局容器组件
 * 支持断点检测、流体布局和动态内边距调整
 */
export default function ResponsiveLayout({ 
  children, 
  fluid = false, 
  noPadding = false 
}: ResponsiveLayoutProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  // 检测视窗大小变化，更新设备类型状态
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 640);
      setIsTablet(width >= 640 && width < 1024);
      setIsDesktop(width >= 1024);
    };

    // 初始化检测
    handleResize();
    // 监听窗口大小变化
    window.addEventListener('resize', handleResize);
    // 清理函数
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 构建基础容器类名
  const containerClasses = `w-full transition-all duration-300 ease-in-out ${
    fluid ? 'max-w-none' : 'max-w-7xl mx-auto'
  }`;

  // 构建内边距类名
  const paddingClasses = noPadding ? '' : 'px-4 sm:px-6 lg:px-8 py-4 md:py-8';

  return (
    <div 
      className={`${containerClasses} ${paddingClasses}`}
      data-device={isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop'}
    >
      {children}
    </div>
  );
}