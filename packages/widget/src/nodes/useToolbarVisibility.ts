import React from 'react';
import { useStore } from '@xyflow/react';

const getSelectedCount = (state: any) => {
  if (Array.isArray(state.selectedNodes)) {
    return state.selectedNodes.length;
  }

  if (Array.isArray(state.nodes)) {
    let count = 0;
    for (const node of state.nodes) {
      if (node?.selected) {
        count += 1;
      }
    }
    return count;
  }

  const internals = state.nodeInternals ?? state.nodeLookup;
  if (internals && typeof internals.forEach === 'function') {
    let count = 0;
    internals.forEach((node: any) => {
      if (node?.selected) {
        count += 1;
      }
    });
    return count;
  }

  return 0;
};

export function useToolbarVisibility(selected: boolean | undefined, dragging: boolean | undefined) {
  const selectedCount = useStore(getSelectedCount);
  const elementsSelectable = useStore((state) => state.elementsSelectable ?? true);
  const zoom = useStore((state) => state.transform[2] ?? 1);
  const [isZooming, setIsZooming] = React.useState(false);
  const zoomRef = React.useRef(zoom);
  const zoomTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    if (zoom === zoomRef.current) {
      return;
    }

    zoomRef.current = zoom;
    setIsZooming(true);

    if (zoomTimerRef.current) {
      clearTimeout(zoomTimerRef.current);
    }

    zoomTimerRef.current = setTimeout(() => {
      setIsZooming(false);
    }, 150);
  }, [zoom]);

  React.useEffect(() => {
    return () => {
      if (zoomTimerRef.current) {
        clearTimeout(zoomTimerRef.current);
      }
    };
  }, []);

  const isSingleSelected = selected && selectedCount === 1;
  return elementsSelectable && isSingleSelected && !dragging && !isZooming;
}
