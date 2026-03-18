'use client';

import { useMemo } from 'react';
import { useRecoilState } from 'recoil-next';
import { ChevronDown, ChevronUp, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { extractQueryData } from '@/lib/trpc/helper';
import {
  productAvatarTemplateCollectionIdState,
  productAvatarTemplateCategoryExpandedState,
  productAvatarTemplateShowFavoritesOnlyState
} from '../../../../store/templateAtoms';
import { ProductAvatarCategoryId } from '../../../../type';
import { useGetCollectionListQuery } from '../../../../data/template/useQueries';
import type { CollectionVO } from '@/server/api/services/_common/type';

export interface CategoryFilterBarProps {
  /** Filter 按钮插槽 */
  filterButton?: React.ReactNode;
}

export function CategoryFilterBar({ filterButton }: CategoryFilterBarProps) {
  // ========== State ==========
  const [collectionId, setCollectionId] = useRecoilState(
    productAvatarTemplateCollectionIdState
  );

  const [isExpanded, setIsExpanded] = useRecoilState(
    productAvatarTemplateCategoryExpandedState
  );
  const [showFavoritesOnly, setShowFavoritesOnly] = useRecoilState(
    productAvatarTemplateShowFavoritesOnlyState
  );

  // ========== Data Fetching ==========
  const { data: collectionData, isLoading: collectionLoading } =
    useGetCollectionListQuery(undefined, { refetchOnWindowFocus: false });

  // 合集数据
  const collectionCategories = useMemo(() => {
    const result = extractQueryData(collectionData);
    return result || [];
  }, [collectionData]);

  // ========== Handlers ==========
  const handleCollectionChange = (newCollectionId: string) => {
    setCollectionId(newCollectionId);
    if (showFavoritesOnly) {
      setShowFavoritesOnly(false);
    }
  };

  const handleToggleFavoritesOnly = () => {
    setShowFavoritesOnly(!showFavoritesOnly);
    if (collectionId === ProductAvatarCategoryId.MY_PRODUCT_AVATAR) {
      setCollectionId(ProductAvatarCategoryId.ALL);
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
        {/* My Product Avatar 按钮（始终显示在第一位） */}
        <button
          onClick={() =>
            handleCollectionChange(ProductAvatarCategoryId.MY_PRODUCT_AVATAR)
          }
          className={cn(
            'flex-shrink-0 rounded-md border px-2.5 py-1 text-xs font-medium transition-all duration-150',
            collectionId === ProductAvatarCategoryId.MY_PRODUCT_AVATAR &&
              !showFavoritesOnly
              ? 'border-white bg-white text-black'
              : 'border-white/20 bg-transparent text-white/70 hover:border-white/40 hover:text-white'
          )}
        >
          👤 My Product Avatar
        </button>

        {/* Favorite 按钮（在 My Product Avatar 之后） */}
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

        {/* All 按钮 */}
        <button
          onClick={() => handleCollectionChange(ProductAvatarCategoryId.ALL)}
          className={cn(
            'flex-shrink-0 rounded-md border px-2.5 py-1 text-xs font-medium transition-all duration-150',
            collectionId === ProductAvatarCategoryId.ALL && !showFavoritesOnly
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
          (collectionCategories as CollectionVO<any>[])?.map?.(
            (category: CollectionVO<any>) => (
              <button
                key={category.collectionId}
                onClick={() =>
                  handleCollectionChange(category?.collectionId || '')
                }
                className={cn(
                  'flex flex-shrink-0 items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium transition-all duration-150',
                  collectionId === category.collectionId && !showFavoritesOnly
                    ? 'border-white bg-white text-black'
                    : 'border-white/20 bg-transparent text-white/70 hover:border-white/40 hover:text-white'
                )}
              >
                {category.collectionName}
              </button>
            )
          )}
      </div>

      {/* Filter Button Slot */}
      {filterButton}

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
