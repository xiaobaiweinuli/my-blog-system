'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import dynamic from 'next/dynamic';

const MdEditor = dynamic(
  () => import('md-editor-rt').then((mod) => mod.MdEditor),
  { ssr: false }
);

import 'md-editor-rt/lib/style.css';

export interface PostFormData {
  title: string;
  slug: string;
  description: string;
  tags: string;
  coverImageUrl: string;
  language: string;
  sticky: boolean;
  status: 'draft' | 'published' | 'archived';
  visibility: 'public' | 'logged_in';
  content: string;
}

interface PostFormProps {
  initialData?: Partial<PostFormData>;
  onSubmit: (data: PostFormData) => void;
  isSubmitting: boolean;
  onCancel: () => void;
  submitButtonText?: string;
  title: string;
  isEditMode?: boolean;
  onTitleChange?: (title: string) => void;
  onSlugChange?: (slug: string) => void;
  titleError?: string | null;
  slugError?: string | null;
  onDataChange?: (data: PostFormData) => void;
}

const generateSlug = (title: string) => {
  if (!title) return '';
  return title
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/&/g, '-and-') // Replace & with 'and'
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-'); // Replace multiple - with single -
};

export default function PostForm({
  initialData,
  onSubmit,
  isSubmitting,
  onCancel,
  submitButtonText = '保存',
  title,
  isEditMode = false,
  onTitleChange,
  onSlugChange,
  titleError,
  slugError,
  onDataChange,
}: PostFormProps) {
  const [editorKey, setEditorKey] = useState(0);
  const [formData, setFormData] = useState<PostFormData>({
    title: '',
    slug: '',
    description: '',
    tags: '',
    coverImageUrl: '',
    language: 'zh',
    sticky: false,
    status: 'draft',
    visibility: 'public',
    content: '',
    ...initialData,
  });
  const [userEditedSlug, setUserEditedSlug] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData((prev) => ({
        ...prev,
        ...initialData,
        tags: Array.isArray(initialData.tags) ? initialData.tags.join(',') : (initialData.tags || ''),
      }));
      if (isEditMode && initialData.slug) {
        setUserEditedSlug(true);
      }
    }
  }, [initialData, isEditMode]);

  useEffect(() => {
    if (onDataChange) {
      onDataChange(formData);
    }
  }, [formData, onDataChange]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setEditorKey(prevKey => prevKey + 1);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const form = useForm();

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    if (name === 'title') {
      onTitleChange?.(value);
      if (!userEditedSlug) {
        const newSlug = generateSlug(value);
        setFormData(prev => ({ ...prev, title: value, slug: newSlug }));
        onSlugChange?.(newSlug);
      } else {
        setFormData(prev => ({ ...prev, title: value }));
      }
    } else if (name === 'slug') {
      setUserEditedSlug(true);
      const newSlug = generateSlug(value);
      setFormData(prev => ({ ...prev, slug: newSlug }));
      onSlugChange?.(newSlug);
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleContentChange = (value: string) => {
    setFormData((prev) => ({ ...prev, content: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-6">
                <FormField
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>标题</FormLabel>
                      <FormControl>
                        <Input {...field} name="title" value={formData.title} onChange={handleChange} placeholder="文章标题" />
                      </FormControl>
                      {titleError && <p className="text-sm font-medium text-destructive pt-1">{titleError}</p>}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slug (路径)</FormLabel>
                      <FormControl>
                        <Input {...field} name="slug" value={formData.slug} onChange={handleChange} placeholder="custom-post-slug" disabled={isEditMode} />
                      </FormControl>
                      <FormDescription>用于URL的唯一标识，只能包含小写字母、数字和连字符。</FormDescription>
                      {slugError && <p className="text-sm font-medium text-destructive pt-1">{slugError}</p>}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>摘要</FormLabel>
                      <FormControl>
                        <Textarea {...field} name="description" value={formData.description} onChange={handleChange} placeholder="文章摘要" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="space-y-6">
                <FormField
                  name="language"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>语言</FormLabel>
                      <Select value={formData.language} onValueChange={(value) => handleSelectChange('language', value)}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="选择语言" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="zh">中文</SelectItem>
                          <SelectItem value="en">English</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>标签</FormLabel>
                      <FormControl>
                        <Input {...field} name="tags" value={formData.tags} onChange={handleChange} placeholder="Tag1, Tag2, Tag3" />
                      </FormControl>
                      <FormDescription>多个标签请用英文逗号分隔。</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  name="coverImageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>封面图URL</FormLabel>
                      <FormControl>
                        <Input {...field} name="coverImageUrl" value={formData.coverImageUrl} onChange={handleChange} placeholder="https://example.com/image.jpg" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <FormField
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>状态</FormLabel>
                    <Select value={formData.status} onValueChange={(value) => handleSelectChange('status', value)}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="选择状态" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="draft">草稿</SelectItem>
                        <SelectItem value="published">发布</SelectItem>
                        <SelectItem value="archived">归档</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="visibility"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>访问权限</FormLabel>
                    <Select value={formData.visibility} onValueChange={(value) => handleSelectChange('visibility', value)}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="选择访问权限" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="public">公开</SelectItem>
                        <SelectItem value="logged_in">登录用户</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              name="sticky"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-lg border p-3 mt-6">
                  <FormControl>
                    <Checkbox name="sticky" checked={formData.sticky} onCheckedChange={(checked) => setFormData(prev => ({...prev, sticky: checked as boolean}))} />
                  </FormControl>
                  <div className="space-y-0.5 leading-none">
                    <FormLabel>置顶</FormLabel>
                    <FormDescription>将文章固定在列表顶部</FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              name="content"
              render={({ field }) => (
                <FormItem className="mt-6">
                  <FormLabel>文章内容</FormLabel>
                  <FormControl>
                    <div style={{ height: 600 }}>
                      <MdEditor
                        key={editorKey}
                        modelValue={formData.content}
                        onChange={handleContentChange}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </Form>
        </CardContent>
        <CardFooter className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onCancel}>
            取消
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? '保存中...' : submitButtonText}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
