'use client';

import { useRecoilState } from 'recoil-next';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  videoAvatarTemplateCategoryIdState,
  videoAvatarTemplateShowFavoritesOnlyState
} from '../../../store/templateAtoms';

export interface CategoryFilterBarProps {
  /** Filter 按钮插槽 */
  filterButton?: React.ReactNode;
}

export function CategoryFilterBar({ filterButton }: CategoryFilterBarProps) {
  // ========== State ==========
  const [categoryId, setCategoryId] = useRecoilState(
    videoAvatarTemplateCategoryIdState
  );
  const [showFavoritesOnly, setShowFavoritesOnly] = useRecoilState(
    videoAvatarTemplateShowFavoritesOnlyState
  );

  // ========== Handlers ==========
  const handleCategoryChange = (newCategoryId: string) => {
    setCategoryId(newCategoryId);
    if (showFavoritesOnly) {
      setShowFavoritesOnly(false);
    }
  };

  const handleToggleFavoritesOnly = () => {
    setShowFavoritesOnly(!showFavoritesOnly);
    if (categoryId === 'my-video-avatar') {
      setCategoryId('all');
    }
  };

  return (
    <div className='flex flex-shrink-0 items-center gap-1.5 pb-3'>
      {/* 分类按钮组 */}
      <div className='flex flex-1 items-center gap-1.5'>
        {/* My Video Avatar Button */}
        <button
          onClick={() => handleCategoryChange('my-video-avatar')}
          className={cn(
            'flex-shrink-0 rounded-md border px-2.5 py-1 text-xs font-medium transition-all duration-150',
            categoryId === 'my-video-avatar' && !showFavoritesOnly
              ? 'border-white bg-white text-black'
              : 'border-white/20 bg-transparent text-white/70 hover:border-white/40 hover:text-white'
          )}
        >
          👤 My Video Avatar
        </button>

        {/* Favorite Button */}
        <button
          onClick={handleToggleFavoritesOnly}
          className={cn(
            'flex flex-shrink-0 items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium transition-all duration-150',
            showFavoritesOnly
              ? 'border-white bg-white text-black'
              : 'border-white/20 bg-transparent text-white/70 hover:border-white/40 hover:text-white'
          )}
        >
          <Star
            size={12}
            className={showFavoritesOnly ? 'fill-current' : ''}
          />
          Favorite
        </button>

        {/* All Button */}
        <button
          onClick={() => handleCategoryChange('all')}
          className={cn(
            'flex-shrink-0 rounded-md border px-2.5 py-1 text-xs font-medium transition-all duration-150',
            categoryId === 'all' && !showFavoritesOnly
              ? 'border-white bg-white text-black'
              : 'border-white/20 bg-transparent text-white/70 hover:border-white/40 hover:text-white'
          )}
        >
          All
        </button>
      </div>

      {/* Filter Button Slot (固定在右侧) */}
      {filterButton}
    </div>
  );
}
