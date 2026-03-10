export function useToolbarVisibility(selected: boolean | undefined, dragging: boolean | undefined) {
  // Show toolbar whenever this node is selected and not being dragged.
  // The toolbar scales with zoom via CSS transform, so no need to hide during zoom.
  return Boolean(selected && !dragging);
}
