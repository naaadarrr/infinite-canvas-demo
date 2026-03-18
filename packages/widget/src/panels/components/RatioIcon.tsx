import React from 'react';

export function getRatioIcon(ratio: string) {
  const parts = ratio.split(':');
  let w = 12;
  let h = 12;
  if (parts.length === 2) {
    const rw = parseFloat(parts[0]);
    const rh = parseFloat(parts[1]);
    if (!isNaN(rw) && !isNaN(rh) && rw > 0 && rh > 0) {
      if (rw >= rh) { w = 14; h = (14 * rh) / rw; }
      else { h = 14; w = (14 * rw) / rh; }
    }
  }
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.6, flexShrink: 0 }}>
      <rect x={8 - w / 2} y={8 - h / 2} width={w} height={h} rx="1.5" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}
