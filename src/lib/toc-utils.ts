import { unified } from 'unified';
import remarkParse from 'remark-parse';
import { visit } from 'unist-util-visit';
import type { TocHeading } from '@/components/TocSidebar';
import GithubSlugger from 'github-slugger';

export function extractTocHeadings(markdown: string, maxDepth = 3): TocHeading[] {
  const tree = unified().use(remarkParse).parse(markdown);
  const flat: TocHeading[] = [];
  const slugger = new GithubSlugger();
  visit(tree, 'heading', (node: any) => {
    if (node.depth > maxDepth) return;
    const text = node.children.map((n: any) => n.value || '').join('');
    const id = slugger.slug(text);
    flat.push({ id, text, depth: node.depth });
  });
  // 转为树状结构
  const toTree = (list: TocHeading[]): TocHeading[] => {
    const result: TocHeading[] = [];
    const stack: TocHeading[] = [];
    for (const item of list) {
      while (stack.length && item.depth <= stack[stack.length - 1].depth) {
        stack.pop();
      }
      if (stack.length === 0) {
        result.push(item);
        stack.push(item);
      } else {
        const parent = stack[stack.length - 1];
        if (!parent.children) parent.children = [];
        parent.children.push(item);
        stack.push(item);
      }
    }
    return result;
  };
  return toTree(flat);
} 