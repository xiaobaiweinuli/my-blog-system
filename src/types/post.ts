export interface Post {
  id: string;
  title: string;
  language: string;
  isSticky: boolean;
  status: 'draft' | 'published' | 'archived';
  visibility: 'public' | 'logged-in';
  path: string;
  updatedAt: string;
}
