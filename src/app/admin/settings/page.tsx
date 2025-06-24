'use client';

import { useState, useEffect } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface Settings {
  siteTitle: string;
  siteDescription: string;
  footerText: string;
  socialLinks: {
    twitter: string;
    github: string;
    linkedin: string;
  };
  avatarUrl: string;
  avatarPreview?: string;
  keywords: string;
  ogImage: string;
  favicon: string;
  robots: string;
  [key: string]: any;
}

export default function AdminSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;
    if (!session || session.user?.role !== 'admin') {
      router.replace('/'); // 或显示无权限提示
    }
  }, [session, status, router]);

  // 状态管理
  const [settings, setSettings] = useState<Settings>({
    siteTitle: '我的博客',
    siteDescription: '这是一个使用Next.js构建的博客系统',
    footerText: '© 2023 我的博客. 保留所有权利.',
    socialLinks: {
      twitter: '',
      github: '',
      linkedin: ''
    },
    avatarUrl: '',
    keywords: '',
    ogImage: '',
    favicon: '',
    robots: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  // 页面加载时获取设置
  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => setSettings(data))
      .catch(() => {});
  }, []);

  // 处理输入变化
  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setSettings(prev => ({ ...prev, [parent]: { ...prev[parent], [child]: value } }));
    } else {
      setSettings(prev => ({ ...prev, [name]: value }));
    }
  };

  // 处理头像上传
  const handleAvatarUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setAvatarFile(files[0]);
      setSettings(prev => ({ ...prev, avatarPreview: URL.createObjectURL(files[0]) }));
    }
  };

  // 提交表单
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      let avatarUrl = settings.avatarUrl;
      if (avatarFile) {
        const formData = new FormData();
        formData.append('avatar', avatarFile);
        const res = await fetch('/api/settings/avatar', { method: 'POST', body: formData });
        const data = await res.json();
        avatarUrl = data.url;
      }
      const saveData = { ...settings, avatarUrl };
      delete saveData.avatarPreview;
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saveData),
      });
      setSettings({ ...saveData, avatarPreview: avatarUrl });
      setSaveSuccess(true);
    } catch (error) {
      console.error('保存设置失败:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">系统设置</h1>

      {saveSuccess && (
        <Alert className="bg-green-50 text-green-800 border-green-200">
          <AlertDescription>设置已成功保存！</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>网站基本信息</CardTitle>
          <CardDescription>配置您的博客网站基本信息和元数据</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="siteTitle">网站标题</Label>
              <Input
                id="siteTitle"
                name="siteTitle"
                value={settings.siteTitle}
                onChange={handleInputChange}
                placeholder="输入网站标题"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="siteDescription">网站描述</Label>
              <Textarea
                id="siteDescription"
                name="siteDescription"
                value={settings.siteDescription}
                onChange={handleInputChange}
                placeholder="输入网站描述"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="footerText">页脚文本</Label>
              <Input
                id="footerText"
                name="footerText"
                value={settings.footerText}
                onChange={handleInputChange}
                placeholder="输入页脚文本"
              />
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-medium mb-4">社交媒体链接</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="socialLinks.twitter">Twitter</Label>
                  <Input
                    id="socialLinks.twitter"
                    name="socialLinks.twitter"
                    value={settings.socialLinks.twitter}
                    onChange={handleInputChange}
                    placeholder="Twitter 用户名"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="socialLinks.github">GitHub</Label>
                  <Input
                    id="socialLinks.github"
                    name="socialLinks.github"
                    value={settings.socialLinks.github}
                    onChange={handleInputChange}
                    placeholder="GitHub 用户名"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="socialLinks.linkedin">LinkedIn</Label>
                  <Input
                    id="socialLinks.linkedin"
                    name="socialLinks.linkedin"
                    value={settings.socialLinks.linkedin}
                    onChange={handleInputChange}
                    placeholder="LinkedIn 用户名"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="avatar">网站头像</Label>
              <Input id="avatar" name="avatar" type="file" accept="image/*" onChange={handleAvatarUpload} />
              {(settings.avatarPreview || settings.avatarUrl) && (
                <img src={settings.avatarPreview || settings.avatarUrl} alt="网站头像" className="w-16 h-16 rounded-full mt-2" />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="keywords">SEO关键词</Label>
              <Input id="keywords" name="keywords" value={settings.keywords} onChange={handleInputChange} placeholder="用逗号分隔，如：博客,Next.js,技术" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ogImage">OG图片URL</Label>
              <Input id="ogImage" name="ogImage" value={settings.ogImage} onChange={handleInputChange} placeholder="用于社交分享的图片URL" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="favicon">Favicon URL</Label>
              <Input id="favicon" name="favicon" value={settings.favicon} onChange={handleInputChange} placeholder="网站 Favicon 图标 URL" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="robots">Robots</Label>
              <Input id="robots" name="robots" value={settings.robots} onChange={handleInputChange} placeholder="如：index, follow" />
            </div>
            <Button
              type="submit"
              disabled={isSaving}
              className="ml-auto"
            >
              {isSaving ? '保存中...' : '保存设置'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}