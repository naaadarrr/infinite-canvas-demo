// Manual 模式下的合成画布组件
// 将抠图后的商品图叠加在 Avatar Photo 上，支持拖拽、缩放、旋转

import { useState, useRef, useEffect, useCallback } from 'react';
import type { RectangleCorners } from '@/server/api/services/productAvatar/task/type';

interface ProductTransform {
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

interface TransformWithLocation {
  transform: ProductTransform;
  location: RectangleCorners;
}

interface ManualCompositeCanvasProps {
  /** Avatar 背景图 */
  avatarTemplate: string;
  /** 商品图 */
  productImage: string;
  /** 变换数据变化回调 */
  onTransformChange?: (data: TransformWithLocation) => void;
  /** 清除模板回调 */
  onClearTemplate?: () => void;
}

export function ManualCompositeCanvas({
  avatarTemplate,
  productImage,
  onTransformChange,
  onClearTemplate
}: ManualCompositeCanvasProps) {
  // 商品图变换状态
  const [transform, setTransform] = useState<ProductTransform>({
    x: 0,
    y: 0,
    scale: 1,
    rotation: 0
  });

  // Avatar 图片比例
  const [avatarAspectRatio, setAvatarAspectRatio] = useState<number | null>(
    null
  );

  // 记录上一次的商品图，用于重置变换
  const lastProductImageRef = useRef<string | null>(null);

  // 画布和商品图引用
  const canvasRef = useRef<HTMLDivElement>(null);
  const productRef = useRef<HTMLDivElement>(null);
  const productImageRef = useRef<HTMLImageElement>(null);

  // 拖拽状态
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const transformStart = useRef({ x: 0, y: 0 });

  // 缩放/旋转状态
  const isResizing = useRef(false);
  const resizeCorner = useRef<string | null>(null);
  const resizeStart = useRef({ x: 0, y: 0, scale: 1, rotation: 0 });

  // 当商品图变化时重置变换
  useEffect(() => {
    if (productImage !== lastProductImageRef.current) {
      lastProductImageRef.current = productImage;
      setTransform({ x: 0, y: 0, scale: 1, rotation: 0 });
    }
  }, [productImage]);

  // 保存回调函数的 ref，避免在依赖数组中引用导致无限循环
  const onTransformChangeRef = useRef(onTransformChange);
  onTransformChangeRef.current = onTransformChange;

  // 保存 transform 的 ref，避免在回调中捕获旧值
  const transformRef = useRef(transform);
  transformRef.current = transform;

  // 节流定时器 ref，用于限制 onTransformChange 的调用频率
  const throttleTimerRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * 计算 location（归一化矩形角点坐标）
   * 基于 transform 和画布/产品图的实际尺寸
   * 如果尺寸无效，使用合理的默认值
   * 注意：使用 transformRef.current 而不是 transform，避免闭包问题
   */
  const calculateLocation = useCallback((): RectangleCorners => {
    const canvas = canvasRef.current;
    const productImage = productImageRef.current;
    // 从 ref 中获取最新的 transform，避免闭包捕获旧值
    const currentTransform = transformRef.current;

    // 默认画布尺寸（如果无法获取，使用合理的默认值）
    const defaultCanvasWidth = 800;
    const defaultCanvasHeight = 600;
    const defaultProductWidth = 200;
    const defaultProductHeight = 200;

    let canvasWidth = defaultCanvasWidth;
    let canvasHeight = defaultCanvasHeight;
    let productWidth = defaultProductWidth;
    let productHeight = defaultProductHeight;

    // 优化：如果画布尺寸无效，尝试根据 aspectRatio 计算
    if (canvas && canvas.clientWidth > 0 && canvas.clientHeight > 0) {
      canvasWidth = canvas.clientWidth;
      canvasHeight = canvas.clientHeight;
    } else if (avatarAspectRatio) {
      // 根据 aspectRatio 计算合理的默认画布尺寸
      // 假设宽度为 800，计算高度
      canvasHeight = defaultCanvasWidth / avatarAspectRatio;
    }

    if (
      productImage &&
      productImage.clientWidth > 0 &&
      productImage.clientHeight > 0
    ) {
      productWidth = productImage.clientWidth;
      productHeight = productImage.clientHeight;
    }

    // 步骤 1: 计算产品图中心在画布上的位置（像素坐标）
    // 验证：transform.x 和 transform.y 是相对于画布中心的偏移
    const centerX = canvasWidth / 2 + currentTransform.x;
    const centerY = canvasHeight / 2 + currentTransform.y;

    // 步骤 2: 计算缩放后的产品图尺寸
    const scaledWidth = productWidth * currentTransform.scale;
    const scaledHeight = productHeight * currentTransform.scale;

    // 步骤 3: 计算未旋转时的四个角点（相对于中心点）
    // 角点顺序：left_top, right_top, right_bottom, left_bottom
    // 基于未旋转时的矩形定义，即使旋转后顺序也保持不变
    const halfWidth = scaledWidth / 2;
    const halfHeight = scaledHeight / 2;

    const corners = [
      [-halfWidth, -halfHeight], // left_top: x最小, y最小
      [halfWidth, -halfHeight], // right_top: x最大, y最小
      [halfWidth, halfHeight], // right_bottom: x最大, y最大
      [-halfWidth, halfHeight] // left_bottom: x最小, y最大
    ];

    // 步骤 4: 应用旋转矩阵
    // CSS rotate() 正值是顺时针，数学旋转矩阵逆时针为正，所以需要取负
    // 验证：rotation=90° (顺时针) 对应数学上的 -90° (逆时针)
    const angleRad = -currentTransform.rotation * (Math.PI / 180);
    const cos = Math.cos(angleRad);
    const sin = Math.sin(angleRad);

    // 旋转矩阵（逆时针旋转）：
    // [cos(θ) -sin(θ)] [x]
    // [sin(θ)  cos(θ)] [y]
    const rotatedCorners = corners.map(([x, y]) => {
      const rotatedX = x * cos - y * sin;
      const rotatedY = x * sin + y * cos;
      return [rotatedX, rotatedY];
    });

    // 步骤 5: 转换为画布绝对坐标并归一化
    const normalizedCorners: RectangleCorners = rotatedCorners.map(
      ([dx, dy]) => {
        const absoluteX = centerX + dx;
        const absoluteY = centerY + dy;

        // 归一化到 0-1 范围，并限制在边界内
        // 注意：当产品图超出画布边界时，坐标会被限制在 [0, 1] 范围内
        const normalizedX = Math.max(0, Math.min(1, absoluteX / canvasWidth));
        const normalizedY = Math.max(0, Math.min(1, absoluteY / canvasHeight));

        return [normalizedX, normalizedY];
      }
    );

    // 步骤 6: 边界检查 - 验证计算结果
    const hasOutOfBounds = normalizedCorners.some(([x, y], index) => {
      const [dx, dy] = rotatedCorners[index];
      const absX = centerX + dx;
      const absY = centerY + dy;
      // 检查原始坐标是否超出边界（即使被限制在 [0, 1] 内）
      return absX < 0 || absX > canvasWidth || absY < 0 || absY > canvasHeight;
    });

    if (hasOutOfBounds && process.env.NODE_ENV === 'development') {
      console.warn(
        '[ManualCompositeCanvas] Location coordinates out of bounds, clamping to [0, 1]',
        {
          canvasSize: { width: canvasWidth, height: canvasHeight },
          productSize: { width: productWidth, height: productHeight },
          transform: currentTransform,
          normalizedCorners
        }
      );
    }

    // 步骤 7: 返回按顺序排列的角点 [left_top, right_top, right_bottom, left_bottom]
    // 顺序基于未旋转时的定义，旋转后保持不变
    return normalizedCorners;
  }, [avatarAspectRatio]);

  // 保存 calculateLocation 的 ref，避免在依赖数组中引用
  const calculateLocationRef = useRef(calculateLocation);
  calculateLocationRef.current = calculateLocation;

  // 通知父组件变换数据变化（包含 transform 和 location）
  // 使用节流限制调用频率，避免在拖拽/缩放过程中频繁触发导致无限循环
  useEffect(() => {
    // 清除之前的定时器
    if (throttleTimerRef.current) {
      clearTimeout(throttleTimerRef.current);
    }

    // 使用节流延迟调用，避免频繁触发
    throttleTimerRef.current = setTimeout(() => {
      const location = calculateLocationRef.current();
      onTransformChangeRef.current?.({
        transform: transformRef.current,
        location
      });
      throttleTimerRef.current = null;
    }, 100); // 100ms 节流

    // 清理函数：组件卸载时清除定时器
    return () => {
      if (throttleTimerRef.current) {
        clearTimeout(throttleTimerRef.current);
        throttleTimerRef.current = null;
      }
    };
  }, [transform]);

  // 监听画布尺寸变化，重新计算 location
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeObserver = new ResizeObserver(() => {
      // 画布尺寸变化时，重新计算 location
      // 使用 ref 获取最新的 transform 值，避免闭包捕获旧值
      const location = calculateLocationRef.current();
      onTransformChangeRef.current?.({
        transform: transformRef.current,
        location
      });
    });

    resizeObserver.observe(canvas);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // 处理拖拽开始
  const handleDragStart = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest('[data-resize-handle]')) return;
      e.preventDefault();
      e.stopPropagation();
      isDragging.current = true;
      dragStart.current = { x: e.clientX, y: e.clientY };
      transformStart.current = { x: transform.x, y: transform.y };
    },
    [transform.x, transform.y]
  );

  // 处理缩放/旋转开始
  const handleResizeStart = useCallback(
    (e: React.MouseEvent, corner: string) => {
      e.preventDefault();
      e.stopPropagation();
      isResizing.current = true;
      resizeCorner.current = corner;
      resizeStart.current = {
        x: e.clientX,
        y: e.clientY,
        scale: transform.scale,
        rotation: transform.rotation
      };
    },
    [transform.scale, transform.rotation]
  );

  // 处理鼠标移动
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging.current) {
        const dx = e.clientX - dragStart.current.x;
        const dy = e.clientY - dragStart.current.y;
        setTransform((prev) => ({
          ...prev,
          x: transformStart.current.x + dx,
          y: transformStart.current.y + dy
        }));
      } else if (
        isResizing.current &&
        canvasRef.current &&
        productRef.current
      ) {
        const productRect = productRef.current.getBoundingClientRect();
        const centerX = productRect.left + productRect.width / 2;
        const centerY = productRect.top + productRect.height / 2;

        // 计算从中心到鼠标的距离和角度
        const dx = e.clientX - centerX;
        const dy = e.clientY - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);

        // 计算初始状态下的距离
        const startDx = resizeStart.current.x - centerX;
        const startDy = resizeStart.current.y - centerY;
        const startDistance = Math.sqrt(startDx * startDx + startDy * startDy);
        const startAngle = Math.atan2(startDy, startDx) * (180 / Math.PI);

        // 根据距离变化计算缩放比例
        const newScale = Math.max(
          0.2,
          Math.min(3, resizeStart.current.scale * (distance / startDistance))
        );

        // 根据角度变化计算旋转
        const newRotation = resizeStart.current.rotation + (angle - startAngle);

        setTransform((prev) => ({
          ...prev,
          scale: newScale,
          rotation: newRotation
        }));
      }
    };

    const handleMouseUp = () => {
      // 清除节流定时器
      if (throttleTimerRef.current) {
        clearTimeout(throttleTimerRef.current);
        throttleTimerRef.current = null;
      }

      // 立即通知最终状态
      const location = calculateLocationRef.current();
      onTransformChangeRef.current?.({
        transform: transformRef.current,
        location
      });

      isDragging.current = false;
      isResizing.current = false;
      resizeCorner.current = null;
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // 渲染控制手柄
  const renderHandles = () => {
    const handles = [
      {
        position: 'top-left',
        cursor: 'nwse-resize',
        style: { top: -6, left: -6 }
      },
      {
        position: 'top-right',
        cursor: 'nesw-resize',
        style: { top: -6, right: -6 }
      },
      {
        position: 'bottom-left',
        cursor: 'nesw-resize',
        style: { bottom: -6, left: -6 }
      },
      {
        position: 'bottom-right',
        cursor: 'nwse-resize',
        style: { bottom: -6, right: -6 }
      }
    ];

    return handles.map((handle) => (
      <div
        key={handle.position}
        data-resize-handle
        onMouseDown={(e) => handleResizeStart(e, handle.position)}
        className='absolute h-3 w-3 rounded-full bg-white border-2 border-yellow-400 shadow-md cursor-pointer hover:scale-110 transition-transform'
        style={{
          ...handle.style,
          cursor: handle.cursor
        }}
      />
    ));
  };

  return (
    <div className='space-y-3'>
      <div className='flex items-center justify-between'>
        <label className='text-sm text-white/60'>Preview</label>
        <span className='text-xs text-white/40'>
          Drag to adjust size & position
        </span>
      </div>

      {/* 合成画布 */}
      <div
        ref={canvasRef}
        className='group relative w-full overflow-hidden rounded-lg border border-white/10 bg-black/20'
        style={{
          aspectRatio: avatarAspectRatio ? `${avatarAspectRatio}` : '4/3'
        }}
      >
        {/* Avatar 背景图 */}
        <img
          src={avatarTemplate}
          alt='Avatar'
          className='absolute inset-0 h-full w-full object-cover'
          draggable={false}
          onLoad={(e) => {
            const img = e.currentTarget;
            if (img.naturalWidth && img.naturalHeight) {
              setAvatarAspectRatio(img.naturalWidth / img.naturalHeight);
            }
          }}
        />

        {/* 删除模板按钮 - hover 时显示 */}
        {onClearTemplate && (
          <button
            onClick={onClearTemplate}
            className='absolute right-1 top-1 rounded bg-black/60 p-1 text-white/70 opacity-0 transition hover:bg-black/80 group-hover:opacity-100'
          >
            <svg
              className='h-3 w-3'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
            >
              <path d='M18 6L6 18M6 6l12 12' />
            </svg>
          </button>
        )}

        {/* 商品图层 */}
        <div
          ref={productRef}
          onMouseDown={handleDragStart}
          className='absolute cursor-move'
          style={{
            left: '50%',
            top: '50%',
            transform: `translate(-50%, -50%) translate(${transform.x}px, ${transform.y}px) scale(${transform.scale}) rotate(${transform.rotation}deg)`
          }}
        >
          {/* 选中框 */}
          <div className='relative border-2 border-yellow-400 rounded'>
            {/* 商品图（模拟已抠图） */}
            <img
              ref={productImageRef}
              src={productImage}
              alt='Product'
              className='max-w-[200px] max-h-[200px] object-contain'
              draggable={false}
              style={{
                // 模拟抠图效果 - 实际项目中这里会是已处理的图片
                filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))'
              }}
              onLoad={() => {
                // 图片加载完成后，使用最新的 transform 计算 location
                // 使用 setTimeout 确保 DOM 已更新，尺寸已正确获取
                setTimeout(() => {
                  const location = calculateLocationRef.current();
                  onTransformChangeRef.current?.({
                    transform: transformRef.current,
                    location
                  });
                }, 0);
              }}
            />

            {/* 控制手柄 */}
            {renderHandles()}
          </div>
        </div>
      </div>
    </div>
  );
}
