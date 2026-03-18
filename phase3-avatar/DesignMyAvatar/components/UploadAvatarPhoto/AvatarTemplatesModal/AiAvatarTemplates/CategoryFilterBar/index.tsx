'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

import { useQueryAvatar4Category } from '@/app/board/[id]/components/ToolPanel/feature/Avatar/DesignMyAvatar/hooks/avatar4/useQueryCategory';

export interface CategoryItem {
  id: string;
  name: string;
}

interface CategoryFilterBarProps {
  selectedCategoryId: string;
  onCategoryChange: (categoryId: string) => void;
}

export function CategoryFilterBar({
  selectedCategoryId,
  onCategoryChange
}: CategoryFilterBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // 从 API 获取分类数据
  const {
    categories: apiCategories,
    isLoading: isLoadingCategories,
    collectionCategories,
    collectionLoading
  } = useQueryAvatar4Category();

  // 构建完整的分类列表：仅 API 分类（固定分类已单独渲染）
  const categories = collectionCategories;

  // 判断是否是 Favorites 模式
  const isFavoritesMode = selectedCategoryId === 'favorites';
  return (
    <div className='flex items-start gap-1.5 border-b border-white/10 px-6 py-3'>
      <div
        className={cn(
          'flex flex-1 gap-1.5',
          isExpanded ? 'flex-wrap' : 'max-h-[26px] overflow-hidden'
        )}
      >
        {/* My Avatar 按钮（始终显示在第一位） */}
        <button
          onClick={() => onCategoryChange('my-avatar')}
          className={cn(
            'flex-shrink-0 rounded-md border px-2.5 py-1 text-xs font-medium transition-all duration-150',
            selectedCategoryId === 'my-avatar'
              ? 'border-white bg-white text-black'
              : 'border-white/20 bg-transparent text-white/70 hover:border-white/40 hover:text-white'
          )}
        >
          👤 My Avatar
        </button>

        {/* Favorite 按钮（在 My Avatar 之后） */}
        <button
          onClick={() => onCategoryChange('favorites')}
          className={cn(
            'flex flex-shrink-0 items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium transition-all duration-150',
            isFavoritesMode
              ? 'border-white bg-white text-black'
              : 'border-white/20 bg-transparent text-white/70 hover:border-white/40 hover:text-white'
          )}
        >
          <Star
            size={12}
            className={isFavoritesMode ? 'fill-current' : ''}
          />
          Favorites
        </button>

        {/* All 按钮 */}
        <button
          onClick={() => onCategoryChange('all')}
          className={cn(
            'flex-shrink-0 rounded-md border px-2.5 py-1 text-xs font-medium transition-all duration-150',
            selectedCategoryId === 'all'
              ? 'border-white bg-white text-black'
              : 'border-white/20 bg-transparent text-white/70 hover:border-white/40 hover:text-white'
          )}
        >
          All
        </button>

        {/* 加载骨架屏 */}
        {collectionLoading && (
          <>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className='h-[26px] w-20 animate-pulse rounded-md bg-white/10'
              />
            ))}
          </>
        )}

        {/* 动态分类列表（来自 API） */}
        {!collectionLoading &&
          (categories as any[])?.map?.((category: any) => (
            <button
              key={category.collectionId}
              onClick={() => onCategoryChange(category.collectionId)}
              className={cn(
                'flex flex-shrink-0 items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium transition-all duration-150',
                selectedCategoryId === category.collectionId
                  ? 'border-white bg-white text-black'
                  : 'border-white/20 bg-transparent text-white/70 hover:border-white/40 hover:text-white'
              )}
            >
              {category.collectionName}
            </button>
          ))}
      </div>

      {/* Expand/Collapse Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className='flex-shrink-0 rounded-md p-1 text-white/50 transition-colors hover:bg-white/10 hover:text-white'
        title={isExpanded ? 'Collapse' : 'Expand'}
      >
        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
    </div>
  );
}
