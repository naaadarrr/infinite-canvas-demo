'use client';

import { useEffect, useMemo, useState } from 'react';
import { CollaborativeCanvas, widgetBridge } from '@tc/infinite-widget';
import type { BoardTaskItem, MediaResourceInfo } from '@tc/infinite-core';
import { mockData } from './mockData';

const DEMO_MEDIA_URL_ENDPOINT = '/api/media-url';

type MediaUrlResolveResponse = {
  result?: {
    fileUrl?: string;
  };
};

const mediaUrlPromiseCache = new Map<string, Promise<string | undefined>>();
let resolvedMockDataPromise: Promise<BoardTaskItem[]> | null = null;

function normalizeMediaResourceUrls(
  resource: MediaResourceInfo | undefined,
  resolvedUrlMap: Map<string, string>
): MediaResourceInfo | undefined {
  if (!resource) {
    return undefined;
  }
  const nextUrl = (resource.filePath && resolvedUrlMap.get(resource.filePath)) ?? resource.url;
  const resolvedCoverUrl = resource.coverPath && resolvedUrlMap.get(resource.coverPath);
  const nextCoverPath = resolvedCoverUrl ?? resource.coverPath;
  const nextCoverUrl = resolvedCoverUrl ?? resource.coverUrl;
  if (
    nextUrl === resource.url &&
    nextCoverPath === resource.coverPath &&
    nextCoverUrl === resource.coverUrl
  ) {
    return resource;
  }
  return {
    ...resource,
    url: nextUrl,
    coverPath: nextCoverPath,
    coverUrl: nextCoverUrl,
  };
}

function collectMockMediaPaths(items: BoardTaskItem[]): string[] {
  const paths = new Set<string>();

  for (const item of items) {
    const result = item.result;
    if (!result) {
      continue;
    }
    const resources = [result.compressedImage, result.originImage, result.originVideo, result.originAudio];
    for (const resource of resources) {
      if (!resource) {
        continue;
      }
      if (resource.filePath) {
        paths.add(resource.filePath);
      }
      if (resource.coverPath) {
        paths.add(resource.coverPath);
      }
    }
  }

  return [...paths];
}

async function resolveMediaUrlByFilePath(filePath: string): Promise<string | undefined> {
  const cached = mediaUrlPromiseCache.get(filePath);
  if (cached) {
    return cached;
  }

  const requestPromise = (async () => {
    try {
      const response = await fetch(
        `${DEMO_MEDIA_URL_ENDPOINT}?filePath=${encodeURIComponent(filePath)}`,
        {
          method: 'GET',
        }
      );
      if (!response.ok) {
        console.warn('[demo] failed to resolve media url', filePath, response.status);
        return undefined;
      }
      const data = (await response.json()) as MediaUrlResolveResponse;
      const fileUrl = data?.result?.fileUrl;
      if (typeof fileUrl !== 'string' || fileUrl.length === 0) {
        console.warn('[demo] invalid media url response', filePath, data);
        return undefined;
      }
      return fileUrl;
    } catch (error) {
      console.warn('[demo] error resolving media url', filePath, error);
      return undefined;
    }
  })();

  mediaUrlPromiseCache.set(filePath, requestPromise);
  return requestPromise;
}

async function buildResolvedMediaUrlMap(items: BoardTaskItem[]): Promise<Map<string, string>> {
  const paths = collectMockMediaPaths(items);
  const entries = await Promise.all(
    paths.map(async (filePath) => {
      const fileUrl = await resolveMediaUrlByFilePath(filePath);
      return [filePath, fileUrl] as const;
    })
  );

  const resolvedUrlMap = new Map<string, string>();
  for (const [filePath, fileUrl] of entries) {
    if (fileUrl) {
      resolvedUrlMap.set(filePath, fileUrl);
    }
  }
  return resolvedUrlMap;
}

function applyResolvedMediaUrlsToMockData(
  items: BoardTaskItem[],
  resolvedUrlMap: Map<string, string>
): BoardTaskItem[] {
  return items.map((item) => {
    if (!item.result) {
      return item;
    }
    return {
      ...item,
      result: {
        ...item.result,
        compressedImage: normalizeMediaResourceUrls(item.result.compressedImage, resolvedUrlMap),
        originImage: normalizeMediaResourceUrls(item.result.originImage, resolvedUrlMap),
        originVideo: normalizeMediaResourceUrls(item.result.originVideo, resolvedUrlMap),
        originAudio: normalizeMediaResourceUrls(item.result.originAudio, resolvedUrlMap),
      },
    };
  });
}

function getResolvedMockDataForDemo(): Promise<BoardTaskItem[]> {
  if (!resolvedMockDataPromise) {
    resolvedMockDataPromise = (async () => {
      const resolvedUrlMap = await buildResolvedMediaUrlMap(mockData);
      return applyResolvedMediaUrlsToMockData(mockData, resolvedUrlMap);
    })().catch((error) => {
      resolvedMockDataPromise = null;
      throw error;
    });
  }
  return resolvedMockDataPromise;
}

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

  const [mounted, setMounted] = useState(false);
  const [userId, setUserId] = useState('');
  const [canvasId, setCanvasId] = useState<string | null>(null);
  const [invisible, setInvisible] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setUserId(params.get('userId') || `user_${Math.random().toString(36).slice(2, 8)}`);
    setCanvasId(params.get('canvasId'));
    setInvisible(params.get('adminMode') === 'true');
    setMounted(true);
  }, []);

  const [resolvedLocalMockData, setResolvedLocalMockData] = useState<BoardTaskItem[] | null>(null);

  useEffect(() => {
    if (canvasId) {
      return;
    }

    let cancelled = false;

    void getResolvedMockDataForDemo()
      .then((data) => {
        if (!cancelled) {
          setResolvedLocalMockData(data);
        }
      })
      .catch((error) => {
        console.error('[demo] failed to preload media URLs from backend-test', error);
        if (!cancelled) {
          setResolvedLocalMockData(mockData);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [canvasId]);

  const initialRawData = useMemo(() => {
    if (canvasId) {
      return [];
    }
    return resolvedLocalMockData ?? [];
  }, [canvasId, resolvedLocalMockData]);

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
    const unsubscribeBatchDeleteRequest = widgetBridge.on<{ nodeIds?: string[] }>('NODE_BATCH_DELETE_REQUEST', (event) => {
      console.log('[Widget Event] NODE_BATCH_DELETE_REQUEST', event);
      const nodeIds = event.payload?.nodeIds;
      if (Array.isArray(nodeIds) && nodeIds.length > 0) {
        widgetBridge.command('NODE_BATCH_DELETE_CONFIRM', { nodeIds });
      }
    });
    const unsubscribeDeleted = widgetBridge.on('NODE_DELETED', (event) => {
      console.log('[Widget Event] NODE_DELETED', event);
    });

    return () => {
      unsubscribeQuickAction();
      unsubscribeDeleteRequest();
      unsubscribeBatchDeleteRequest();
      unsubscribeDeleted();
    };
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <CollaborativeCanvas
      canvasId={canvasId}
      userId={userId}
      rawData={initialRawData}
      layoutConfig={layoutConfig}
      dependencyEdgesVisible={true}
      invisible={invisible}
      topBarLogoUrl="/logo.svg"
      userCredits={25}
    />
  );
}
