// AI Avatar More Settings 组件

import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SubtitleStyleSelector } from './components/SubtitleStyleSelector';
import { CustomMotionInput } from './components/CustomMotionInput';
import { OffPeakModeToggle } from './components/OffPeakModeToggle';

interface MoreSettingsProps {
  /** 字幕 key */
  captionKey?: string;
  /** 字幕 key 变更回调 */
  onCaptionKeyChange: (key: string | undefined) => void;
  /** 正向提示词 */
  positivePrompt?: string;
  /** 正向提示词变更回调 */
  onPositivePromptChange: (value: string | undefined) => void;
  /** 是否非高峰 */
  offPeak?: boolean;
  /** 是否非高峰变更回调 */
  onOffPeakChange: (value: boolean | undefined) => void;
}

export function MoreSettings({
  captionKey,
  onCaptionKeyChange,
  positivePrompt,
  onPositivePromptChange,
  offPeak,
  onOffPeakChange
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

          <CustomMotionInput
            value={positivePrompt}
            onChange={onPositivePromptChange}
          />

          <OffPeakModeToggle
            value={offPeak}
            onChange={onOffPeakChange}
          />
        </div>
      </div>
    </div>
  );
}
