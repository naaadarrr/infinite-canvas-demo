/**
 * 节点类型枚举
 */
export enum NodeType {
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  TEXT = 'text',
}

/**
 * 基础位置信息
 */
export interface Position {
  x: number;
  y: number;
}

/**
 * 尺寸信息
 */
export interface Size {
  width: number;
  height: number;
}

/**
 * 基础节点数据
 */
export interface BaseNodeData extends Record<string, unknown> {
  id: string;
  type: NodeType;
  position: Position;
  size: Size;
  zIndex?: number;
  rotation?: number;
}

/**
 * 图片节点数据
 */
export interface ImageNodeData extends BaseNodeData {
  type: NodeType.IMAGE;
  url: string;
  alt?: string;
}

/**
 * 视频节点数据
 */
export interface VideoNodeData extends BaseNodeData {
  type: NodeType.VIDEO;
  url: string;
  poster?: string;
  autoplay?: boolean;
  loop?: boolean;
  muted?: boolean;
}

/**
 * 音频节点数据
 */
export interface AudioNodeData extends BaseNodeData {
  type: NodeType.AUDIO;
  url: string;
  title?: string;
  artist?: string;
  autoplay?: boolean;
  loop?: boolean;
}

/**
 * 文本对齐方式
 */
export type TextAlign = 'left' | 'center' | 'right';

/**
 * 文本节点数据
 */
export interface TextNodeData extends BaseNodeData {
  type: NodeType.TEXT;
  content: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: 'normal' | 'bold';
  textAlign?: TextAlign;
  color?: string;
  backgroundColor?: string;
  backgroundOpacity?: number;
  scale?: number;
}

/**
 * 联合节点数据类型
 */
export type CanvasNodeData = ImageNodeData | VideoNodeData | AudioNodeData | TextNodeData;

/**
 * 视口状态
 */
export interface ViewportState {
  x: number;
  y: number;
  zoom: number;
}

/**
 * 画布配置
 */
export interface CanvasConfig {
  minZoom?: number;
  maxZoom?: number;
  defaultZoom?: number;
  snapToGrid?: boolean;
  gridSize?: number;
  snapToNodes?: boolean;
  snapThreshold?: number;
  showSnapLines?: boolean;
}
