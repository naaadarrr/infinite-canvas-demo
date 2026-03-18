'use client';

import { useState, useRef, useMemo, useEffect } from 'react';
import {
  Filter as FilterIcon,
  ChevronDown,
  ChevronUp,
  Star
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  GENDER_OPTIONS,
  type GenderType,
  type SortingType
} from '../../../../../../ProductAvatar/data/templates';
import { useQueryProductAvatarCategory } from '@/app/board/[id]/components/ToolPanel/feature/Avatar/DesignMyAvatar/hooks/productAvatar/useQueryCategory';
import { useQueryEthnicityList } from '@/app/board/[id]/components/ToolPanel/feature/Avatar/DesignMyAvatar/hooks/productAvatar/useQueryEthnicityList';

interface FilterState {
  ethnicity: string[];
  gender: string[];
  sorting: SortingType;
}

interface CategoryFilterBarProps {
  selectedCategoryId: string;
  onCategoryChange: (categoryId: string) => void;
  onFilterChange?: (filter: {
    ethnicityIds: string;
    genderIds: string[];
    sorting?: SortingType;
  }) => void;
}

export function CategoryFilterBar({
  selectedCategoryId,
  onCategoryChange,
  onFilterChange
}: CategoryFilterBarProps) {
  // 内部状态管理
  const [isExpanded, setIsExpanded] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [filter, setFilter] = useState<FilterState>({
    ethnicity: [],
    gender: [],
    sorting: 'popularity'
  });
  const filterMenuRef = useRef<HTMLDivElement>(null);

  // 使用 hook 获取分类数据
  const {
    categories: apiCategories,
    collectionCategories,
    isLoading: isLoadingCategories,
    collectionLoading: isLoadingCollectionCategories
  } = useQueryProductAvatarCategory();

  // 使用 hook 获取种族列表数据
  const {
    ethnicityList,
    isLoading: isLoadingEthnicity,
    error: ethnicityError
  } = useQueryEthnicityList();

  const isMyAvatarCategory = selectedCategoryId === 'my-product-avatar';

  // 计算激活的筛选器数量
  const activeFilterCount = useMemo(() => {
    return (
      (filter.ethnicity.length > 0 ? 1 : 0) + (filter.gender.length > 0 ? 1 : 0)
    );
  }, [filter]);

  // 当筛选状态变化时，通知父组件
  useEffect(() => {
    if (onFilterChange) {
      const ethnicityIds = filter.ethnicity.join(',');
      const genderIds = filter.gender.map((g) => g);
      onFilterChange({ ethnicityIds, genderIds, sorting: filter.sorting });
    }
  }, [filter]);

  // 内部筛选器处理函数
  const toggleEthnicity = (value: string) => {
    setFilter((prev) => ({
      ...prev,
      ethnicity: prev.ethnicity.includes(value)
        ? prev.ethnicity.filter((e) => e !== value)
        : [...prev.ethnicity, value]
    }));
  };

  const toggleGender = (value: GenderType) => {
    setFilter((prev) => ({
      ...prev,
      gender: prev.gender.includes(value)
        ? prev.gender.filter((g) => g !== value)
        : [...prev.gender, value]
    }));
  };

  const setSorting = (value: SortingType) => {
    setFilter((prev) => ({ ...prev, sorting: value }));
  };

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
          onClick={() => onCategoryChange('my-product-avatar')}
          className={cn(
            'flex-shrink-0 rounded-md border px-2.5 py-1 text-xs font-medium transition-all duration-150',
            selectedCategoryId === 'my-product-avatar'
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
        {isLoadingCollectionCategories && (
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
        {!isLoadingCollectionCategories &&
          categories.map((category) => (
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

      {/* Filter Button - 只在非 My Avatar 分类显示 */}
      {!isMyAvatarCategory && (
        <div
          className='relative'
          ref={filterMenuRef}
        >
          <button
            onClick={() => setShowFilterMenu(!showFilterMenu)}
            className={cn(
              'flex-shrink-0 rounded-lg p-1.5 transition-all duration-150 relative',
              activeFilterCount > 0
                ? 'bg-white/10 text-white'
                : 'text-white/50 hover:bg-white/5 hover:text-white'
            )}
          >
            <FilterIcon className='h-4 w-4' />
            {activeFilterCount > 0 && (
              <span className='absolute -right-1 -top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-indigo-500 text-[9px] text-white'>
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Filter Menu */}
          {showFilterMenu && (
            <div className='absolute right-0 top-full z-50 mt-1 min-w-[240px] rounded-lg border border-white/10 bg-[#252525] py-2 shadow-xl'>
              {/* Ethnicity Section */}
              <div className='px-3 py-2'>
                <div className='text-xs font-medium text-white/60 mb-2'>
                  Ethnicity
                </div>
                <div className='flex flex-wrap gap-1.5'>
                  {isLoadingEthnicity ? (
                    <div className='flex items-center gap-2 text-xs text-white/50'>
                      <div className='animate-spin rounded-full h-3 w-3 border border-white/30 border-t-white/60'></div>
                      Loading ethnicity...
                    </div>
                  ) : ethnicityError ? (
                    <div className='text-xs text-red-400'>
                      Failed to load ethnicity
                    </div>
                  ) : (
                    ethnicityList.map((ethnicity) => (
                      <button
                        key={ethnicity.ethnicityId}
                        onClick={() => toggleEthnicity(ethnicity.ethnicityId)}
                        className={cn(
                          'rounded-md px-2 py-1 text-xs transition-all',
                          filter.ethnicity.includes(ethnicity.ethnicityId)
                            ? 'bg-white/15 text-white border border-white/30'
                            : 'bg-white/5 text-white/60 border border-transparent hover:bg-white/10 hover:text-white'
                        )}
                      >
                        {ethnicity.ethnicityName}
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Gender Section */}
              <div className='px-3 py-2 border-t border-white/5'>
                <div className='text-xs font-medium text-white/60 mb-2'>
                  Gender
                </div>
                <div className='flex gap-1.5'>
                  {GENDER_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => toggleGender(option.value)}
                      className={cn(
                        'rounded-md px-2 py-1 text-xs transition-all',
                        filter.gender.includes(option.value)
                          ? 'bg-white/15 text-white border border-white/30'
                          : 'bg-white/5 text-white/60 border border-transparent hover:bg-white/10 hover:text-white'
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sorting Section */}
              <div className='px-3 py-2 border-t border-white/5'>
                <div className='text-xs font-medium text-white/60 mb-2'>
                  Sorting
                </div>
                <div className='flex gap-1.5'>
                  <button
                    onClick={() => setSorting('popularity')}
                    className={cn(
                      'rounded-md px-2 py-1 text-xs transition-all',
                      filter.sorting === 'popularity'
                        ? 'bg-white/15 text-white border border-white/30'
                        : 'bg-white/5 text-white/60 border border-transparent hover:bg-white/10 hover:text-white'
                    )}
                  >
                    Popularity
                  </button>
                  <button
                    onClick={() => setSorting('newest')}
                    className={cn(
                      'rounded-md px-2 py-1 text-xs transition-all',
                      filter.sorting === 'newest'
                        ? 'bg-white/15 text-white border border-white/30'
                        : 'bg-white/5 text-white/60 border border-transparent hover:bg-white/10 hover:text-white'
                    )}
                  >
                    Newest
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Expand/Collapse Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className='flex-shrink-0 p-1 rounded-md text-white/50 hover:text-white hover:bg-white/10 transition-colors'
        title={isExpanded ? 'Collapse' : 'Expand'}
      >
        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
    </div>
  );
}
