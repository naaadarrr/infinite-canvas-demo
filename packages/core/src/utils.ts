import type { Position, Size, CanvasNodeData } from './types';

/**
 * 生成唯一 ID
 */
export function generateId(): string {
  return `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 计算两点之间的距离
 */
export function calculateDistance(p1: Position, p2: Position): number {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

/**
 * 检查点是否在矩形内
 */
export function isPointInRect(
  point: Position,
  rect: Position & Size
): boolean {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  );
}

/**
 * 限制数值在范围内
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * 按 zIndex 排序节点
 */
export function sortNodesByZIndex(nodes: CanvasNodeData[]): CanvasNodeData[] {
  return [...nodes].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
}

/**
 * 计算节点的边界框
 */
export function getNodeBounds(node: CanvasNodeData) {
  return {
    left: node.position.x,
    top: node.position.y,
    right: node.position.x + node.size.width,
    bottom: node.position.y + node.size.height,
  };
}
