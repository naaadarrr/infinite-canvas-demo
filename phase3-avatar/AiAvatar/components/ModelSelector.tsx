// AI Avatar 模型选择器组件 - 带 hover 浮窗

import { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PhotoAvatarVideoMode } from '@/server/api/services/avatar4/type';
import { AI_AVATAR_MODELS, getModelConfigByMode } from '../config';
import type { AiAvatarModelConfig } from '../config';

interface ModelSelectorProps {
  value: PhotoAvatarVideoMode | undefined;
  onChange: (value: PhotoAvatarVideoMode) => void;
}

// 可用的模式列表（只显示 AVATAR_4 和 AVATAR_4_FAST）
const AVAILABLE_MODES = [
  PhotoAvatarVideoMode.AVATAR_4,
  PhotoAvatarVideoMode.AVATAR_4_FAST
];

export function ModelSelector({ value, onChange }: ModelSelectorProps) {
  const [hoveredModel, setHoveredModel] = useState<AiAvatarModelConfig | null>(
    null
  );
  const [tooltipPosition, setTooltipPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isTooltipHovered, setIsTooltipHovered] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const selectedMode = value || PhotoAvatarVideoMode.AVATAR_4;

  // 计算 tooltip 位置
  const calculateTooltipPosition = (
    buttonRect: DOMRect
  ): { top: number; left: number } => {
    const tooltipWidth = 320;
    const tooltipHeight = 280;
    const gap = 8;

    let left = buttonRect.left + buttonRect.width / 2 - tooltipWidth / 2;
    let top = buttonRect.bottom + gap;

    // 检查右边界
    if (left + tooltipWidth > window.innerWidth - 10) {
      left = window.innerWidth - tooltipWidth - 10;
    }

    // 检查左边界
    if (left < 10) {
      left = 10;
    }

    // 检查下边界，如果超出则显示在上方
    if (top + tooltipHeight > window.innerHeight - 10) {
      top = buttonRect.top - tooltipHeight - gap;
    }

    return { top, left };
  };

  const handleMouseEnter = (
    model: AiAvatarModelConfig,
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    // 清除隐藏定时器
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
    // 清除之前的显示定时器
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }

    // 在 setTimeout 之前获取位置，因为 event.currentTarget 在异步回调中会变成 null
    const buttonRect = event.currentTarget.getBoundingClientRect();

    // 延迟显示 tooltip，避免快速滑过时闪烁
    hoverTimeoutRef.current = setTimeout(() => {
      const position = calculateTooltipPosition(buttonRect);
      setTooltipPosition(position);
      setHoveredModel(model);
    }, 1000);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }

    // 延迟隐藏，给用户时间将鼠标移动到 tooltip 上
    hideTimeoutRef.current = setTimeout(() => {
      if (!isTooltipHovered) {
        setHoveredModel(null);
        setTooltipPosition(null);
        setIsMuted(true);
      }
    }, 150);
  };

  const handleTooltipMouseEnter = () => {
    setIsTooltipHovered(true);
    // 清除隐藏定时器
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
  };

  const handleTooltipMouseLeave = () => {
    setIsTooltipHovered(false);
    setHoveredModel(null);
    setTooltipPosition(null);
    setIsMuted(true);
  };

  // 当 hoveredModel 变化时，重置视频
  useEffect(() => {
    if (videoRef.current && hoveredModel) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {
        // 忽略自动播放失败的错误
      });
    }
  }, [hoveredModel]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div ref={containerRef}>
      <label className='mb-2 block text-sm text-white/60'>Model</label>
      <div className='flex flex-wrap gap-2'>
        {AVAILABLE_MODES.map((mode) => {
          const model = getModelConfigByMode(mode);
          if (!model) return null;
          const isSelected = mode === selectedMode;
          return (
            <button
              key={mode}
              onClick={() => onChange(mode)}
              onMouseEnter={(e) => handleMouseEnter(model, e)}
              onMouseLeave={handleMouseLeave}
              className={cn(
                'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition',
                isSelected
                  ? 'border-white/20 bg-white/5 text-white'
                  : 'border-white/10 text-white/50 hover:border-white/20 hover:text-white'
              )}
            >
              <span>{model.name}</span>
              {model.tag && (
                <span className='rounded bg-indigo-500 px-1.5 py-0.5 text-[10px] font-medium text-white'>
                  {model.tag}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Hover Tooltip */}
      {hoveredModel && tooltipPosition && (
        <div
          className='fixed z-50 w-80 overflow-hidden rounded-lg border border-white/10 bg-[#2d2d2d] shadow-xl'
          style={{
            top: tooltipPosition.top,
            left: tooltipPosition.left
          }}
          onMouseEnter={handleTooltipMouseEnter}
          onMouseLeave={handleTooltipMouseLeave}
        >
          {/* Video Preview */}
          <div className='relative aspect-video w-full bg-black'>
            <video
              ref={videoRef}
              src={hoveredModel.previewVideoUrl}
              poster={hoveredModel.posterUrl}
              className='h-full w-full object-cover'
              autoPlay
              loop
              muted={isMuted}
              playsInline
            />
            {/* Mute/Unmute Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsMuted(!isMuted);
              }}
              className='absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white/80 transition hover:bg-black/80'
            >
              {isMuted ? (
                <VolumeX className='h-4 w-4' />
              ) : (
                <Volume2 className='h-4 w-4' />
              )}
            </button>
          </div>

          {/* Features List */}
          <div className='p-3'>
            <ul className='space-y-1.5'>
              {hoveredModel.features.map((feature, index) => (
                <li
                  key={index}
                  className='flex items-start gap-2 text-xs text-white/70'
                >
                  <span className='mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-white/40' />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
