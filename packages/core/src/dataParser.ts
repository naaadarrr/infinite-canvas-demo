import type { CanvasNodeData, NodeType } from './types';
import { generateId } from './utils';

/**
 * 原始数据项接口
 */
export interface RawDataItem {
  status: string;
  mediaType: string;
  result?: {
    originImage?: {
      url?: string;
    };
    originVideo?: {
      filePath?: string;
    };
    originAudio?: {
      filePath?: string;
    };
  };
  [key: string]: any;
}

/**
 * 布局配置
 */
export interface LayoutConfig {
  columns?: number; // 每行列数，默认 4
  nodeWidth?: number; // 节点宽度，默认 300
  nodeHeight?: number; // 节点高度，默认 200
  gap?: number; // 节点间距，默认 50
  startX?: number; // 起始 X 坐标，默认 100
  startY?: number; // 起始 Y 坐标，默认 100
  cdnBaseUrl?: string; // CDN 基础 URL，用于构建资源完整路径
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
  } = layoutConfig;

  const nodes: CanvasNodeData[] = [];
  let nodeIndex = 0;

  for (const item of rawData) {
    // 只处理 status 为 success 的项
    if (item.status !== 'success') {
      continue;
    }

    const mediaType = item.mediaType?.toUpperCase();
    let node: CanvasNodeData | null = null;

    // 计算位置（4*n 布局）
    const row = Math.floor(nodeIndex / columns);
    const col = nodeIndex % columns;
    const x = startX + col * (nodeWidth + gap);
    const y = startY + row * (nodeHeight + gap);

    switch (mediaType) {
      case 'IMAGE':
        const imageUrl = item.result?.originImage?.url;
        if (imageUrl) {
          node = {
            id: generateId(),
            type: 'image' as NodeType.IMAGE,
            position: { x, y },
            size: { width: nodeWidth, height: nodeHeight },
            url: imageUrl,
            zIndex: 1,
          };
        }
        break;

      case 'VIDEO':
        const videoFilePath = item.result?.originVideo?.filePath;
        if (videoFilePath) {
          // 构建完整的视频 URL
          const videoUrl =  videoFilePath 
          
          node = {
            id: generateId(),
            type: 'video' as NodeType.VIDEO,
            position: { x, y },
            size: { width: nodeWidth, height: nodeHeight },
            url: videoUrl,
            loop: true,
            muted: true,
            zIndex: 1,
          };
        }
        break;

      case 'AUDIO':
        const audioFilePath = item.result?.originAudio?.filePath;
        if (audioFilePath) {
          // 构建完整的音频 URL
          const audioUrl =  audioFilePath 
          
          node = {
            id: generateId(),
            type: 'audio' as NodeType.AUDIO,
            position: { x, y },
            size: { width: nodeWidth, height: 120 }, // 音频节点高度较小
            url: audioUrl,
            title: item.parameters?.fileName || item.title || '音频文件',
            zIndex: 1,
          };
        }
        break;
    }

    if (node) {
      nodes.push(node);
      nodeIndex++;
    }
  }

  return nodes;
}
