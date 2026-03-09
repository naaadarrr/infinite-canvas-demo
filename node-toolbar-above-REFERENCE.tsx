/**
 * =============================================================================
 * 点击素材后上方出现工具栏 - 参考代码
 * =============================================================================
 *
 * 用法：把本文件与 node-toolbar-above-REFERENCE.md 一起复制到你的项目，
 *       让 AI 按你项目的技术栈实现「点击素材 → 上方出现工具栏」。
 *
 * 原始实现：components/nodes/VideoNode.tsx 约 141-161 行
 *          components/nodes/ImageNode.tsx 约 156-174 行
 * =============================================================================
 */

import React from 'react';

/* ========== 方案 A：使用 @xyflow/react 时 ==========
 *
 * 1. 从 @xyflow/react 引入：NodeToolbar, Position
 * 2. 在自定义节点组件里解构 selected（NodeProps 传入）
 * 3. 在节点 return 里写下面的 NodeToolbar，子元素按需改成你的按钮
 *
 * <NodeToolbar
 *   isVisible={selected}
 *   position={Position.Top}
 *   offset={16}
 *   className="flex items-center gap-1 bg-white p-1 rounded-lg shadow-[0_4px_20px_-4px_rgba(0,0,0,0.15)] border border-slate-200"
 * >
 *   <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-100">Upscale</button>
 *   <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-100">Remove bg</button>
 *   <div className="w-px h-4 bg-slate-200 mx-1" />
 *   <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-100">Download</button>
 * </NodeToolbar>
 */

/* ========== 方案 A 完整示例（复制到你的节点组件里） ==========
 *
 * import { NodeToolbar, Position } from '@xyflow/react';
 *
 * 在节点内：
 *   {status === 'done' && (
 *     <NodeToolbar
 *       isVisible={selected}
 *       position={Position.Top}
 *       offset={16}
 *       className="flex items-center gap-1 bg-white p-1 rounded-lg shadow-[0_4px_20px_-4px_rgba(0,0,0,0.15)] border border-slate-200"
 *     >
 *       <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors">Upscale</button>
 *       <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors">Remove bg</button>
 *       <div className="w-px h-4 bg-slate-200 mx-1" />
 *       <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors">Download</button>
 *     </NodeToolbar>
 *   )}
 */

/* ========== 方案 B：不用 React Flow 时的可复用组件 ==========
 *
 * 你的产品自己维护 selectedId，当前素材 id === selectedId 时传 selected={true}。
 * 工具栏用绝对定位放在「素材容器」上方，样式与 NodeToolbar 一致。
 */
export function NodeToolbarAboveStandalone({
  selected,
  onUpscale,
  onRemoveBg,
  onDownload,
  children,
}: {
  selected: boolean;
  onUpscale?: () => void;
  onRemoveBg?: () => void;
  onDownload?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="relative w-full h-full">
      {selected && (
        <div
          className="absolute left-1/2 -translate-x-1/2 -translate-y-full flex items-center gap-1 bg-white p-1 rounded-lg shadow-[0_4px_20px_-4px_rgba(0,0,0,0.15)] border border-slate-200 z-[1001]"
          style={{ marginTop: '-8px' }}
        >
          <button
            type="button"
            onClick={onUpscale}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
          >
            Upscale
          </button>
          <button
            type="button"
            onClick={onRemoveBg}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
          >
            Remove bg
          </button>
          <div className="w-px h-4 bg-slate-200 mx-1" />
          <button
            type="button"
            onClick={onDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
          >
            Download
          </button>
        </div>
      )}
      {children}
    </div>
  );
}

/* ========== 样式类名（与 DOM 中 react-flow__node-toolbar 一致，便于复刻） ==========
 *
 * 容器: flex items-center gap-1 bg-white p-1 rounded-lg shadow-[0_4px_20px_-4px_rgba(0,0,0,0.15)] border border-slate-200
 * 按钮: flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors
 * 分隔线: w-px h-4 bg-slate-200 mx-1
 */
