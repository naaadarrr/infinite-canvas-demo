'use client';

import { useEffect, useMemo } from 'react';
import { CollaborativeCanvas, widgetBridge } from '@tc/infinite-widget';
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

  useEffect(() => {
    const unsubscribeQuickAction = widgetBridge.on('NODE_QUICK_ACTION', (event) => {
      console.log('[Widget Event] NODE_QUICK_ACTION', event);
    });
    const unsubscribeDeleteRequest = widgetBridge.on<{ nodeId?: string }>('NODE_DELETE_REQUEST', (event) => {
      console.log('[Widget Event] NODE_DELETE_REQUEST', event);
      const nodeId = event.payload?.nodeId;
      if (typeof nodeId === 'string') {
        widgetBridge.command('NODE_DELETE_CONFIRM', { nodeId });
      }
    });
    const unsubscribeDeleted = widgetBridge.on('NODE_DELETED', (event) => {
      console.log('[Widget Event] NODE_DELETED', event);
    });

    return () => {
      unsubscribeQuickAction();
      unsubscribeDeleteRequest();
      unsubscribeDeleted();
    };
  }, []);

  return (
    <CollaborativeCanvas
      canvasId={canvasId}
      userId={userId}
      rawData={[]}
      layoutConfig={layoutConfig}
      dependencyEdgesVisible={true}
    />
  );
}
