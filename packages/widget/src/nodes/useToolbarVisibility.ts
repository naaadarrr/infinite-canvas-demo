import { useStore } from '@xyflow/react';

/** Whether the per-node quick action toolbar should show (hidden when dragging or multi-selected). */
export function useToolbarVisibility(selected: boolean | undefined, dragging: boolean | undefined) {
  const multipleSelected = useStore((state) => {
    if (!selected) return false;
    let count = 0;
    for (const [, node] of state.nodeLookup) {
      if (node.selected) {
        count++;
        if (count > 1) return true;
      }
    }
    return false;
  });

  // Hide per-node toolbar when multiple nodes are selected;
  // the MultiSelectToolbar takes over in that case.
  return Boolean(selected && !dragging && !multipleSelected);
}

/** Whether the node label bar (素材类型信息) should show. Visible when selected and not multi-selected, including during drag. */
export function useLabelBarVisibility(selected: boolean | undefined) {
  const multipleSelected = useStore((state) => {
    if (!selected) return false;
    let count = 0;
    for (const [, node] of state.nodeLookup) {
      if (node.selected) {
        count++;
        if (count > 1) return true;
      }
    }
    return false;
  });
  return Boolean(selected && !multipleSelected);
}
