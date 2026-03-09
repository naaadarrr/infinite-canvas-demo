import React from 'react';
import { useStore } from '@xyflow/react';

export function useToolbarVisibility(selected: boolean | undefined, dragging: boolean | undefined) {
  const zoom = useStore((state) => state.transform[2] ?? 1);

  const [isZooming, setIsZooming] = React.useState(false);
  const zoomRef = React.useRef(zoom);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    if (zoom === zoomRef.current) return;
    zoomRef.current = zoom;
    setIsZooming(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setIsZooming(false), 150);
  }, [zoom]);

  React.useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  // Show toolbar whenever this node is selected and not being dragged or zoomed.
  // We intentionally drop the `selectedCount === 1` check — it relied on a Zustand
  // store that can lag in controlled mode, causing the toolbar to never appear.
  // Each node independently decides to show its own toolbar based on its own `selected` prop.
  return Boolean(selected && !dragging && !isZooming);
}
