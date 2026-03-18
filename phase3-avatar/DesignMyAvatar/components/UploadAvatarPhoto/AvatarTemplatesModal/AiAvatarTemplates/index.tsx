'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import type { AiAvatarDTO } from '@/server/api/services/mediaLibrary/aiAvatar/type';
import type { AigcPhotoAvatar4TemplateDTO } from '@/server/api/services/avatar4/type';
import { CategoryFilterBar } from './CategoryFilterBar';
import { CustomAvatars } from './CustomAvatars';
import { PublicTemplates } from './PublicTemplates';
import { FavoritesList } from './FavoritesList';
import { getResourcePrefixed } from '@/utils/path';
interface AiAvatarTemplatesProps {
  onSelectAvatar: (imageUrl: string, path: string) => void;
  onClose: () => void;
  /** 是否只渲染内容部分（不包含弹窗结构），用于 Tab 切换场景 */
  contentOnly?: boolean;
}

export function AiAvatarTemplates({
  onSelectAvatar,
  onClose,
  contentOnly = false
}: AiAvatarTemplatesProps) {
  const [categoryId, setCategoryId] = useState('all');

  const modalRef = useRef<HTMLDivElement>(null);

  // 是否是 My Avatar 分类
  const isMyAvatarCategory = categoryId === 'my-avatar';

  // 是否是收藏分类
  const isFavoritesCategory = categoryId === 'favorites';

  // 分类切换处理
  const handleCategoryChange = (newCategoryId: string) => {
    setCategoryId(newCategoryId);
  };

  // 选择模板
  const handleSelectTemplate = (template: AigcPhotoAvatar4TemplateDTO) => {
    let imageUrl = getResourcePrefixed(template.imageS3Path || '');
    onSelectAvatar(imageUrl, template.imageS3Path || '');
    onClose();
  };

  // 选择自定义头像 (API 数据)
  const handleSelectCustomAvatar = (avatar: AiAvatarDTO) => {
    onSelectAvatar(avatar.coverDefaultUrl || '', avatar.coverDefault || '');
    onClose();
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
        onCategoryChange={handleCategoryChange}
      />

      {/* Content */}
      <div className='flex-1 overflow-y-auto p-6'>
        {/* 根据分类显示不同内容 */}
        {isFavoritesCategory ? (
          // 收藏列表
          <FavoritesList
            onSelectTemplate={handleSelectTemplate}
            onSelectCustomAvatar={handleSelectCustomAvatar}
          />
        ) : isMyAvatarCategory ? (
          // 自定义头像
          <CustomAvatars onSelectCustomAvatar={handleSelectCustomAvatar} />
        ) : (
          // 公共模板
          <PublicTemplates
            categoryId={categoryId}
            onSelectTemplate={handleSelectTemplate}
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
          <h2 className='text-lg font-semibold text-white'>Select AI Avatar</h2>

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
