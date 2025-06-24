import React, { useEffect, useState, useCallback } from 'react';

export interface TocHeading {
  id: string;
  text: string;
  depth: number;
  children?: TocHeading[];
}

interface TocSidebarProps {
  headings: TocHeading[];
  activeId: string;
  onHeadingClick: (id: string) => void;
  onBackToTop: () => void;
  isMobile?: boolean;
  show: boolean;
  onClose?: () => void;
}

function renderTree(headings: TocHeading[], activeId: string, onHeadingClick: (id: string) => void, expandedIds: Set<string>, setExpandedIds: (ids: Set<string>) => void, prefix: number | string = 1): React.ReactNode {
  return headings.map((h, idx) => {
    const numbering = Array.isArray(prefix) ? [...prefix, idx + 1].join('.') : `${prefix}.${idx + 1}`;
    return (
      <li key={h.id} className={`toc-item toc-h${h.depth}`.trim()} style={{ marginLeft: `${(h.depth - 1) * 20}px` }}>
        <div
          className={
            `toc-link flex items-center cursor-pointer rounded px-2 py-1 transition hover:bg-blue-50 dark:hover:bg-gray-800` +
            (activeId === h.id ? ' bg-blue-100 text-blue-600 font-bold border-l-4 border-blue-500' : '')
          }
          onClick={() => {
            onHeadingClick(h.id);
            if (h.children && h.children.length > 0) {
              const newSet = new Set(expandedIds);
              if (expandedIds.has(h.id)) {
                newSet.delete(h.id);
              } else {
                newSet.add(h.id);
              }
              setExpandedIds(newSet);
            }
          }}
        >
          {h.children && h.children.length > 0 && (
            <span className="mr-1 select-none">
              {expandedIds.has(h.id) ? '▼' : '▶'}
            </span>
          )}
          <span className="mr-2 text-gray-400 text-xs">{numbering}</span>
          <span>{h.text}</span>
        </div>
        {h.children && h.children.length > 0 && expandedIds.has(h.id) && (
          <ol className="ml-2 border-l border-gray-200 dark:border-gray-700 pl-2">
            {renderTree(h.children, activeId, onHeadingClick, expandedIds, setExpandedIds, numbering)}
          </ol>
        )}
      </li>
    );
  });
}

const TocSidebar: React.FC<TocSidebarProps> = ({ headings, activeId, onHeadingClick, onBackToTop, isMobile, show, onClose }) => {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    // 自动展开当前 activeId 所在的所有父级
    function expandToActive(headings: TocHeading[], id: string, path: string[] = []): string[] | null {
      for (const h of headings) {
        if (h.id === id) return [...path, h.id];
        if (h.children) {
          const res = expandToActive(h.children, id, [...path, h.id]);
          if (res) return res;
        }
      }
      return null;
    }
    if (activeId) {
      const path = expandToActive(headings, activeId);
      if (path) setExpandedIds(new Set(path));
    }
  }, [activeId, headings]);

  // 响应式样式
  const sidebarClass = isMobile
    ? `fixed top-0 right-0 w-72 h-full bg-white dark:bg-gray-900 shadow-lg z-50 transition-transform ${show ? 'translate-x-0' : 'translate-x-full'}`
    : 'sticky top-24 w-[300px] h-[80vh] overflow-y-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-4 rounded-xl shadow-lg hidden lg:block';

  return (
    <aside className={sidebarClass} style={{ minWidth: 220 }}>
      {isMobile && (
        <button className="absolute top-2 right-2 text-xl" onClick={onClose}>×</button>
      )}
      <div className="font-bold mb-4 text-xl">目录</div>
      {headings.length === 0 ? (
        <div className="text-gray-400">暂无目录</div>
      ) : (
        <ol className="toc-list">
          {renderTree(headings, activeId, onHeadingClick, expandedIds, setExpandedIds, 1)}
        </ol>
      )}
      <button
        className="mt-6 w-full py-2 bg-blue-500 hover:bg-blue-600 text-white rounded shadow transition"
        onClick={onBackToTop}
      >
        返回顶部
      </button>
    </aside>
  );
};

export default TocSidebar;

// 样式建议：
// .toc-list { list-style: none; padding-left: 0; }
// .toc-item { margin-bottom: 4px; }
// .toc-link { padding: 2px 0; }
// .toc-active { color: #2563eb; font-weight: bold; border-left: 3px solid #2563eb; background: #f0f6ff; }
// .toc-h2 { margin-left: 0.5em; }
// .toc-h3 { margin-left: 1.5em; }
// .toc-h4 { margin-left: 2.5em; }
