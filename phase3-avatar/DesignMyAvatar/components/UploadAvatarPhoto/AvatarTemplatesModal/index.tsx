'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AiAvatarTemplates } from './AiAvatarTemplates';
import { ProductAvatarTemplates } from './ProductAvatarTemplates/index';

type TabType = 'ai-avatar' | 'product-avatar';

interface AvatarTemplatesModalProps {
  onSelectAvatar: (imageUrl: string, path: string) => void;
  onClose: () => void;
}

export function AvatarTemplatesModal({
  onSelectAvatar,
  onClose
}: AvatarTemplatesModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('ai-avatar');

  if (typeof window === 'undefined') return null;

  return createPortal(
    <div className='fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-300'>
      <div className='relative flex h-[85vh] w-[1100px] flex-col rounded-2xl bg-[#1a1a1a] shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-2 duration-300'>
        {/* Header - Tab Switcher */}
        <div className='flex items-center justify-between border-b border-white/10 px-6 py-4'>
          <div className='inline-flex rounded-lg border border-white/10 bg-white/5 p-0.5'>
            <button
              onClick={() => setActiveTab('ai-avatar')}
              className={cn(
                'rounded-md px-3 py-1 text-xs transition',
                activeTab === 'ai-avatar'
                  ? 'bg-white/10 text-white'
                  : 'text-white/50 hover:text-white'
              )}
            >
              AI Avatar
            </button>
            <button
              onClick={() => setActiveTab('product-avatar')}
              className={cn(
                'rounded-md px-3 py-1 text-xs transition',
                activeTab === 'product-avatar'
                  ? 'bg-white/10 text-white'
                  : 'text-white/50 hover:text-white'
              )}
            >
              Product Avatar
            </button>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className='flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/70 transition hover:bg-white/20 hover:text-white'
          >
            <X className='h-4 w-4' />
          </button>
        </div>

        {/* Content - 根据 tab 显示对应组件的内容 */}
        <div className='flex-1 overflow-hidden'>
          {activeTab === 'ai-avatar' ? (
            <AiAvatarTemplates
              onSelectAvatar={onSelectAvatar}
              onClose={onClose}
              contentOnly={true}
            />
          ) : (
            <ProductAvatarTemplates
              onSelectAvatar={onSelectAvatar}
              onClose={onClose}
              contentOnly={true}
            />
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
