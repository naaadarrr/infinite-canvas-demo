import { useMemo } from 'react';
import { NodeType } from '@tc/infinite-core';
import type { CanvasNodeData } from '@tc/infinite-core';

export interface MultiSelectInfo {
  count: number;
  nodeIds: string[];
  nodes: CanvasNodeData[];
  typeCounts: Record<string, number>;
  isHomogeneous: boolean;
  primaryType: NodeType | null;
  label: string;
  hasAnyLocked: boolean;
  hasAnyUnlocked: boolean;
  hasAnyHidden: boolean;
  hasAnyVisible: boolean;
}

const TYPE_LABELS: Record<string, string> = {
  [NodeType.IMAGE]: 'image',
  [NodeType.VIDEO]: 'video',
  [NodeType.AUDIO]: 'audio',
  [NodeType.TEXT]: 'text',
};

function pluralize(word: string, count: number): string {
  return count === 1 ? word : `${word}s`;
}

export function useMultiSelectInfo(
  selectedNodes: CanvasNodeData[]
): MultiSelectInfo | null {
  return useMemo(() => {
    if (selectedNodes.length < 2) return null;

    const typeCounts: Record<string, number> = {};
    let hasAnyLocked = false;
    let hasAnyUnlocked = false;
    let hasAnyHidden = false;
    let hasAnyVisible = false;

    for (const node of selectedNodes) {
      const t = node.type;
      typeCounts[t] = (typeCounts[t] || 0) + 1;

      const isLocked = (node as any).draggable === false;
      const isHidden = (node as any).hidden === true;
      if (isLocked) hasAnyLocked = true;
      else hasAnyUnlocked = true;
      if (isHidden) hasAnyHidden = true;
      else hasAnyVisible = true;
    }

    const types = Object.keys(typeCounts);
    const isHomogeneous = types.length === 1;
    const primaryType = isHomogeneous ? (types[0] as NodeType) : null;

    let label: string;
    if (isHomogeneous) {
      const typeLabel = TYPE_LABELS[types[0]] || types[0];
      label = `${selectedNodes.length} ${pluralize(typeLabel, selectedNodes.length)}`;
    } else {
      const parts = Object.entries(typeCounts).map(
        ([type, count]) => `${count} ${pluralize(TYPE_LABELS[type] || type, count)}`
      );
      label = parts.join(', ');
    }

    return {
      count: selectedNodes.length,
      nodeIds: selectedNodes.map((n) => n.id),
      nodes: selectedNodes,
      typeCounts,
      isHomogeneous,
      primaryType,
      label,
      hasAnyLocked,
      hasAnyUnlocked,
      hasAnyHidden,
      hasAnyVisible,
    };
  }, [selectedNodes]);
}
