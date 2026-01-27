import type { BoardTaskItem, MediaResourceInfo } from './boardTaskItem';
import type { CanvasNodeData, NodeType } from './types';
import { generateId } from './utils';

/**
 * 原始数据项接口
 */
export interface RawDataItem extends BoardTaskItem {
  [key: string]: unknown;
}

/**
 * 布局配置
 */
export interface LayoutConfig {
  columns?: number; // 每行列数，默认 4
  nodeWidth?: number; // 布局基准宽度，默认 300
  nodeHeight?: number; // 布局基准高度，默认 200
  gap?: number; // 节点间距，默认 50
  startX?: number; // 起始 X 坐标，默认 100
  startY?: number; // 起始 Y 坐标，默认 100
  cdnBaseUrl?: string; // CDN 基础 URL，用于构建资源完整路径
  includeRawData?: boolean; // 是否在节点上附带原始数据
}

const ABSOLUTE_URL_PATTERN = /^https?:\/\//i;
const ASPECT_RATIO_PATTERN = /^(\d+(?:\.\d+)?)\s*[:/]\s*(\d+(?:\.\d+)?)$/;

function joinCdnUrl(base: string, path: string): string {
  if (!base) {
    return path;
  }
  const trimmedBase = base.endsWith('/') ? base.slice(0, -1) : base;
  const trimmedPath = path.startsWith('/') ? path.slice(1) : path;
  return `${trimmedBase}/${trimmedPath}`;
}

function resolveUrl(value: string | undefined, cdnBaseUrl: string): string | undefined {
  if (!value) {
    return undefined;
  }
  if (ABSOLUTE_URL_PATTERN.test(value)) {
    return value;
  }
  return joinCdnUrl(cdnBaseUrl, value);
}

function resolveMediaUrl(
  resource: MediaResourceInfo | undefined,
  cdnBaseUrl: string
): string | undefined {
  return resolveUrl(resource?.url, cdnBaseUrl) ?? resolveUrl(resource?.filePath, cdnBaseUrl);
}

function resolveMediaUrlFrom(
  resources: Array<MediaResourceInfo | undefined>,
  cdnBaseUrl: string
): string | undefined {
  for (const resource of resources) {
    const url = resolveMediaUrl(resource, cdnBaseUrl);
    if (url) {
      return url;
    }
  }
  return undefined;
}

function resolveCoverUrl(
  resource: MediaResourceInfo | undefined,
  cdnBaseUrl: string
): string | undefined {
  return resolveUrl(resource?.coverPath, cdnBaseUrl);
}

function resolveTitle(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function parseAspectRatio(value: unknown): number | undefined {
  if (typeof value === 'number') {
    return Number.isFinite(value) && value > 0 ? value : undefined;
  }
  if (typeof value !== 'string') {
    return undefined;
  }
  const match = ASPECT_RATIO_PATTERN.exec(value.trim());
  if (!match) {
    return undefined;
  }
  const width = Number(match[1]);
  const height = Number(match[2]);
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return undefined;
  }
  return width / height;
}

function resolveAspectRatioFromParameters(parameters: RawDataItem['parameters'] | undefined): number | undefined {
  if (!parameters || typeof parameters !== 'object') {
    return undefined;
  }
  const record = parameters as Record<string, unknown>;
  return parseAspectRatio(record.aspectRatio ?? record.aspect_ratio);
}

function resolveAspectRatioFromResources(
  resources: Array<MediaResourceInfo | undefined>
): number | undefined {
  for (const resource of resources) {
    const width = resource?.width;
    const height = resource?.height;
    if (typeof width === 'number' && typeof height === 'number' && width > 0 && height > 0) {
      return width / height;
    }
  }
  return undefined;
}

function resolveNodeSize(
  nodeWidth: number,
  nodeHeight: number,
  aspectRatio?: number
): { width: number; height: number } {
  if (!aspectRatio || !Number.isFinite(aspectRatio) || aspectRatio <= 0) {
    return { width: nodeWidth, height: nodeHeight };
  }
  const containerRatio = nodeWidth / nodeHeight;
  if (aspectRatio >= containerRatio) {
    return { width: nodeWidth, height: nodeWidth / aspectRatio };
  }
  return { width: nodeHeight * aspectRatio, height: nodeHeight };
}

function resolveCenteredPosition(
  cellX: number,
  cellY: number,
  cellWidth: number,
  cellHeight: number,
  nodeSize: { width: number; height: number }
): { x: number; y: number } {
  return {
    x: cellX + (cellWidth - nodeSize.width) / 2,
    y: cellY + (cellHeight - nodeSize.height) / 2,
  };
}

/**
 * 解析原始数据为画布节点
 */
export function parseRawData(
  rawData: RawDataItem[],
  layoutConfig: LayoutConfig = {}
): CanvasNodeData[] {
  const {
    columns = 4,
    nodeWidth = 300,
    nodeHeight = 200,
    gap = 50,
    startX = 100,
    startY = 100,
    cdnBaseUrl = 'https://dr1coeak04nbk.cloudfront.net',
    includeRawData = false,
  } = layoutConfig;

  const nodes: CanvasNodeData[] = [];
  let nodeIndex = 0;
  const layoutSide = Math.max(nodeWidth, nodeHeight);

  for (const item of rawData) {
    const status = String(item.status ?? '').toLowerCase();
    const isInit = status === 'init';
    const isSuccess = status === 'success';
    const isFail = status === 'fail';
    // 只处理 status 为 success / init / fail 的项
    if (!isInit && !isSuccess && !isFail) {
      continue;
    }

    const mediaType = String(item.mediaType ?? '').toUpperCase();
    let node: CanvasNodeData | null = null;
    const result = item.result ?? undefined;

    // 计算位置（4*n 布局）
    const row = Math.floor(nodeIndex / columns);
    const col = nodeIndex % columns;
    const cellX = startX + col * (layoutSide + gap);
    const cellY = startY + row * (layoutSide + gap);

    switch (mediaType) {
      case 'IMAGE':
        const imageUrl = resolveMediaUrlFrom(
          [result?.originImage, result?.compressedImage],
          cdnBaseUrl
        );
        if (imageUrl || isInit || isFail) {
          const aspectRatio =
            resolveAspectRatioFromParameters(item.parameters) ??
            resolveAspectRatioFromResources([result?.originImage, result?.compressedImage]);
          const size = resolveNodeSize(layoutSide, layoutSide, aspectRatio);
          node = {
            id: generateId(),
            type: 'image' as NodeType.IMAGE,
            position: resolveCenteredPosition(cellX, cellY, layoutSide, layoutSide, size),
            size,
            url: imageUrl ?? '',
            zIndex: 1,
          };
        }
        break;

      case 'VIDEO':
        const videoUrl = resolveMediaUrlFrom(
          [result?.originVideo, result?.originImage],
          cdnBaseUrl
        );
        if (videoUrl || isInit || isFail) {
          const poster =
            resolveCoverUrl(result?.originVideo, cdnBaseUrl) ??
            resolveCoverUrl(result?.originImage, cdnBaseUrl);
          const aspectRatio =
            resolveAspectRatioFromParameters(item.parameters) ??
            resolveAspectRatioFromResources([result?.originVideo, result?.originImage]);
          const size = resolveNodeSize(layoutSide, layoutSide, aspectRatio);
          node = {
            id: generateId(),
            type: 'video' as NodeType.VIDEO,
            position: resolveCenteredPosition(cellX, cellY, layoutSide, layoutSide, size),
            size,
            url: videoUrl ?? '',
            poster,
            loop: true,
            muted: true,
            zIndex: 1,
          };
        }
        break;

      case 'AUDIO':
        const audioUrl = resolveMediaUrl(result?.originAudio, cdnBaseUrl);
        if (audioUrl || isInit || isFail) {
          const title =
            resolveTitle(item.parameters?.fileName) ??
            resolveTitle(item.title) ??
            '音频文件';
          const size = { width: layoutSide, height: 120 };
          node = {
            id: generateId(),
            type: 'audio' as NodeType.AUDIO,
            position: resolveCenteredPosition(cellX, cellY, layoutSide, layoutSide, size),
            size, // 音频节点高度较小
            url: audioUrl ?? '',
            title,
            zIndex: 1,
          };
        }
        break;
    }

    if (node) {
      if (includeRawData) {
        (node as CanvasNodeData & { raw: RawDataItem }).raw = item;
      }
      nodes.push(node);
      nodeIndex++;
    }
  }

  return nodes;
}
