'use client';

import { useEffect, useState } from 'react';

interface DateDisplayProps {
  date: string | Date;
  format?: 'relative' | 'absolute' | 'short' | 'long';
  className?: string;
}

export function DateDisplay({ date, format = 'relative', className = '' }: DateDisplayProps) {
  const [mounted, setMounted] = useState(false);
  const [formattedDate, setFormattedDate] = useState('');

  useEffect(() => {
    setMounted(true);
    
    const formatDate = () => {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      
      if (format === 'relative') {
        const now = new Date();
        const diff = now.getTime() - dateObj.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (minutes < 1) return '刚刚';
        if (minutes < 60) return `${minutes}分钟前`;
        if (hours < 24) return `${hours}小时前`;
        if (days < 7) return `${days}天前`;
        return dateObj.toLocaleDateString('zh-CN');
      }
      
      if (format === 'short') {
        return dateObj.toLocaleDateString('zh-CN', {
          month: 'short',
          day: 'numeric'
        });
      }
      
      if (format === 'long') {
        return dateObj.toLocaleDateString('zh-CN', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
      
      return dateObj.toLocaleDateString('zh-CN');
    };
    
    setFormattedDate(formatDate());
  }, [date, format]);

  if (!mounted) {
    return <span className={className}>加载中...</span>;
  }

  return <span className={className}>{formattedDate}</span>;
} 