'use client';

import { useRecoilState } from 'recoil-next';
import { ChevronDown, ChevronUp, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQueryAvatar4Category } from '../../../hooks/avatar4Template/useQueryCategory';
import {
  avatarTemplateCollectionIdState,
  avatarTemplateCategoryExpandedState,
  avatarTemplateShowFavoritesOnlyState
} from '../../../store/templateAtoms';

export function CategoryFilterBar() {
  const [categoryId, setCategoryId] = useRecoilState(
    avatarTemplateCollectionIdState
  );
  const [isExpanded, setIsExpanded] = useRecoilState(
    avatarTemplateCategoryExpandedState
  );
  const [showFavoritesOnly, setShowFavoritesOnly] = useRecoilState(
    avatarTemplateShowFavoritesOnlyState
  );

  const { collectionCategories, collectionLoading } = useQueryAvatar4Category();
  const categories = collectionCategories;

  const handleCategoryChange = (newCategoryId: string) => {
    setCategoryId(newCategoryId);
    if (showFavoritesOnly) {
      setShowFavoritesOnly(false);
    }
  };

  const handleToggleFavoritesOnly = () => {
    setShowFavoritesOnly(!showFavoritesOnly);
    if (categoryId === 'my-avatar') {
      setCategoryId('all');
    }
  };

  return (
    <div className='flex flex-shrink-0 items-start gap-1.5 pb-3'>
      <div
        className={cn(
          'flex flex-1 gap-1.5',
          isExpanded ? 'flex-wrap' : 'max-h-[26px] overflow-hidden'
        )}
      >
        {/* My Avatar */}
        <button
          onClick={() => handleCategoryChange('my-avatar')}
          className={cn(
            'flex-shrink-0 rounded-md border px-2.5 py-1 text-xs font-medium transition-all duration-150',
            categoryId === 'my-avatar' && !showFavoritesOnly
              ? 'border-white bg-white text-black'
              : 'border-white/20 bg-transparent text-white/70 hover:border-white/40 hover:text-white'
          )}
        >
          👤 My Avatar
        </button>

        {/* Favorite */}
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

        {/* All */}
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

        {/* Loading skeleton */}
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

        {/* Dynamic category list (from hook) */}
        {!collectionLoading &&
          categories.map((category) => (
            <button
              key={category.collectionId}
              onClick={() => handleCategoryChange(category.collectionId)}
              className={cn(
                'flex flex-shrink-0 items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium transition-all duration-150',
                categoryId === category.collectionId && !showFavoritesOnly
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
