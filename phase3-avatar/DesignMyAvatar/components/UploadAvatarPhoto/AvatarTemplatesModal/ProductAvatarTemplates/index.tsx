'use client';

import { useState, useEffect, useRef, Fragment } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import type { ProductAvatarMetaFrontDTO } from '@/server/api/services/productAvatar/template/type';
import { CategoryFilterBar } from './CategoryFilterBar';
import { ProductTemplates } from './PublicTemplates';
import { FavoritesList } from './FavoritesList';
import { CustomAvatars } from './CustomAvatars';
import { getResourcePrefixed } from '@/utils/path';

interface ProductAvatarTemplatesProps {
  onSelectAvatar: (imageUrl: string, path: string) => void;
  onClose: () => void;
  /** 是否只渲染内容部分（不包含弹窗结构），用于 Tab 切换场景 */
  contentOnly?: boolean;
}

export function ProductAvatarTemplates({
  onSelectAvatar,
  onClose,
  contentOnly = false
}: ProductAvatarTemplatesProps) {
  const [categoryId, setCategoryId] = useState('all'); //合集

  const [filterParams, setFilterParams] = useState<{
    ethnicityIds?: string;
    gender?: string[];
    sorting?: string;
  }>({});

  const modalRef = useRef<HTMLDivElement>(null);

  // 是否是 My Avatar 分类
  const isMyAvatarCategory = categoryId === 'my-product-avatar';

  // 选择模板
  const handleSelect = (template: ProductAvatarMetaFrontDTO) => {
    // 处理不同类型的数据，提取图片URL
    let imageUrl = getResourcePrefixed(template.avatarImagePath || '');

    onSelectAvatar(imageUrl, template.avatarImagePath || '');
    onClose();
  };

  // 选择 My Product Avatar
  const handleSelectMyAvatar = (avatar: ProductAvatarMetaFrontDTO) => {
    let imageUrl = getResourcePrefixed(avatar.avatarImagePath || '');
    onSelectAvatar(imageUrl, avatar.avatarImagePath || '');
    onClose();
  };

  // 筛选条件变化处理
  const handleFilterChange = (filter: {
    ethnicityIds: string;
    genderIds: string[];
    sorting?: string;
  }) => {
    setFilterParams({
      ethnicityIds: filter.ethnicityIds || undefined,
      gender: filter.genderIds || [],
      sorting: filter.sorting
    });
  };

  // 关闭弹窗
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  // 内容部分
  const content = (
    <>
      {/* Category Filter Bar */}
      <CategoryFilterBar
        selectedCategoryId={categoryId}
        onCategoryChange={setCategoryId}
        onFilterChange={handleFilterChange}
      />

      {/* Content */}
      <div className='flex-1 overflow-y-auto p-6'>
        {/* Content Grid - 根据分类显示不同内容 */}
        {isMyAvatarCategory ? (
          // My Avatar 分类 - 只显示用户自定义头像
          <CustomAvatars onSelect={handleSelectMyAvatar} />
        ) : categoryId === 'favorites' ? (
          // 收藏视图 - 显示收藏的产品头像模板
          <FavoritesList onSelect={handleSelect} />
        ) : (
          // 普通视图 - 显示产品头像模板（支持分类筛选）
          <ProductTemplates
            categoryIds={categoryId !== 'all' ? categoryId : undefined}
            ethnicityIds={filterParams.ethnicityIds}
            gender={filterParams.gender}
            sorting={filterParams.sorting as 'popularity' | 'newest'}
            onSelect={handleSelect}
          />
        )}
      </div>

      {/* Footer */}
      <div className='flex items-center justify-end border-t border-white/10 px-6 py-4'>
        <button
          onClick={onClose}
          className='rounded-lg bg-white/10 px-4 py-2 text-sm text-white transition hover:bg-white/20'
        >
          Cancel
        </button>
      </div>
    </>
  );

  if (contentOnly) {
    return <div className='flex h-full flex-col'>{content}</div>;
  }

  if (typeof window === 'undefined') return null;

  return createPortal(
    <div className='fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-300'>
      <div
        ref={modalRef}
        className='relative flex h-[85vh] w-[1100px] flex-col rounded-2xl bg-[#1a1a1a] shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-2 duration-300'
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className='flex items-center justify-between border-b border-white/10 px-6 py-4'>
          <h2 className='text-lg font-semibold text-white'>
            Select Product Avatar
          </h2>

          {/* Close Button */}
          <button
            onClick={onClose}
            className='flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/70 transition hover:bg-white/20 hover:text-white'
          >
            <X className='h-4 w-4' />
          </button>
        </div>

        {content}
      </div>
    </div>,
    document.body
  );
}
