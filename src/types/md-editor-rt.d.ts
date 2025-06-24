// src/types/md-editor-rt.d.ts

// 定义md-editor-rt组件的类型声明
declare module 'md-editor-rt' {
  import React from 'react';

  // 编辑器配置项类型 (根据 md-editor-rt 实际文档，通常是 editorConfig)
  // 您可以根据 md-editor-rt 的官方文档添加更多配置项
  interface EditorConfig {
    height?: string; // 编辑器高度，例如 '500px'
    preview?: boolean; // 是否显示预览
    mode?: 'split' | 'editor' | 'preview'; // 支持分栏/编辑/预览模式
    toolbar?: string[]; // 工具栏配置（按钮名称数组）
    // 例如：
    // theme?: 'dark' | 'light';
    // previewTheme?: string; // 预览主题，例如 'github'
    // tabSize?: number;
    // placeholder?: string;
    // ... 其他 md-editor-rt 支持的配置
  }

  // 组件属性类型
  interface MdEditorProps extends React.RefAttributes<unknown> {
    modelValue: string; // 当前编辑器内容 (md-editor-rt 通常用 modelValue)
    onChange: (content: string) => void; // 内容变化回调
    editorConfig?: EditorConfig; // 编辑器配置 (注意：这里是 editorConfig，不是 options)
    className?: string; // 自定义类名
    // ... 添加其他 md-editor-rt 支持的 props
    // 例如：
    // theme?: 'dark' | 'light';
    // previewTheme?: string;
    // toolbars?: string[];
    // footers?: string[];
    // ...
  }

  // 导出React函数组件 (md-editor-rt 是命名导出)
  const MdEditor: React.FC<MdEditorProps>;
  export { MdEditor }; // <-- 修正为命名导出
}
