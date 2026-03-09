import React from 'react';

/**
 * Tracks node selection via both React Flow props and local pointer state.
 * Uses pointerdown instead of click to fire before React Flow's drag
 * threshold logic, which can suppress click events in edit mode.
 */
export function useNodeSelection(
  selected: boolean | undefined,
  containerRef: React.RefObject<HTMLElement | null>
) {
  const [localSelected, setLocalSelected] = React.useState(false);

  React.useEffect(() => {
    setLocalSelected(!!selected);
  }, [selected]);

  const handlePointerDown = React.useCallback(() => {
    setLocalSelected(true);
  }, []);

  React.useEffect(() => {
    if (!localSelected) return;
    const handler = (e: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setLocalSelected(false);
      }
    };
    document.addEventListener('pointerdown', handler);
    return () => document.removeEventListener('pointerdown', handler);
  }, [localSelected, containerRef]);

  return {
    effectiveSelected: localSelected || !!selected,
    handlePointerDown,
  };
}
