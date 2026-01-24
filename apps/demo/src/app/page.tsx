'use client';

import { useMemo } from 'react';
import { CollaborativeCanvas } from '@tc/infinite-widget';
import { mockData } from './mockData';

export default function Home() {
  const layoutConfig = useMemo(
    () => ({
      columns: 4,
      nodeWidth: 300,
      nodeHeight: 200,
      gap: 50,
      startX: 100,
      startY: 100,
    }),
    []
  );

  const userId = useMemo(() => `user_${Math.random().toString(36).slice(2, 8)}`, []);
  const canvasId = useMemo(() => {
    if (typeof window === 'undefined') {
      return null;
    }
    const params = new URLSearchParams(window.location.search);
    return params.get('canvasId');
  }, []);

  return (
    <CollaborativeCanvas
      canvasId={canvasId}
      userId={userId}
      rawData={mockData}
      layoutConfig={layoutConfig}
    />
  );
}
