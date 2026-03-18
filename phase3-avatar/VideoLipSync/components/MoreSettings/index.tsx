// Video Lip Sync More Settings 组件

import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SubtitleStyleSelector } from '@/app/board/[id]/components/ToolPanel/feature/Avatar/AiAvatar/components/MoreSettings/components/SubtitleStyleSelector';

interface MoreSettingsProps {
  /** 字幕 key */
  captionKey?: string;
  /** 字幕 key 变更回调 */
  onCaptionKeyChange: (key: string | undefined) => void;
  /** 是否保存到私模（仅 version=V2 时适用） */
  saveToPrivate?: boolean;
  /** 保存到私模变更回调 */
  onSaveToPrivateChange: (value: boolean | undefined) => void;
  /** 是否是用户上传的视频（用于控制 Save to Private 选项是否显示） */
  isUserUploadedVideo?: boolean;
}

export function MoreSettings({
  captionKey,
  onCaptionKeyChange,
  saveToPrivate,
  onSaveToPrivateChange,
  isUserUploadedVideo = false
}: MoreSettingsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className='border-t border-white/10 pt-4'>
      {/* Header - Click to expand/collapse */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className='flex w-full items-center gap-1 text-sm text-white/80 hover:text-white transition-colors'
      >
        <ChevronRight
          className={cn(
            'h-4 w-4 transition-transform duration-200',
            isExpanded && 'rotate-90'
          )}
        />
        <span>More Settings</span>
      </button>

      {/* Expandable Content */}
      <div
        className={cn(
          'overflow-hidden transition-all duration-200',
          isExpanded ? 'mt-4 max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        <div className='space-y-5'>
          <SubtitleStyleSelector
            captionKey={captionKey}
            onCaptionKeyChange={onCaptionKeyChange}
          />

          {/* Save to Private (VideoLipSync 特有) */}
          {isUserUploadedVideo && (
            <div className='flex items-center justify-between'>
              <label className='text-sm text-white/60'>
                Save to My Video Avatar
              </label>
              <button
                type='button'
                role='switch'
                aria-checked={saveToPrivate}
                onClick={() => onSaveToPrivateChange(!saveToPrivate)}
                className={cn(
                  'relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out',
                  saveToPrivate ? 'bg-indigo-500' : 'bg-white/20'
                )}
              >
                <span
                  className={cn(
                    'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out mt-0.5',
                    saveToPrivate ? 'translate-x-4' : 'translate-x-0.5'
                  )}
                />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
