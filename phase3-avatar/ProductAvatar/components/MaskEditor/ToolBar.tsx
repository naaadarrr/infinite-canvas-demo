'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getResourcePrefixed } from '@/utils/media';

interface ToolBarProps {
  tool: string;
  brushColor?: string;
  setTool: (tool: 'brush' | 'eraser') => void;
  setBrushColor?: (color: string) => void;
  showClearBtn?: boolean;
  onClear?: () => void;
}

const COMMON_EDIT_BUTTON_STYLE =
  'w-10 h-10 min-w-[40px] border border-[#434343] bg-transparent rounded-lg hover:bg-[#4E40F3] hover:border-[#4E40F3] transition-colors';
const COMMON_EDIT_BUTTON_HIGHT_STYLE = 'bg-[#4E40F3] border-[#4E40F3]';

const ToolBar: React.FC<ToolBarProps> = ({
  tool,
  setTool,
  onClear,
  showClearBtn = true
}) => {
  return (
    <div className='flex flex-col gap-10'>
      <div className='flex gap-4 items-center'>
        <Button
          variant='ghost'
          size='icon'
          aria-label='Brush'
          onClick={() => setTool('brush')}
          className={cn(
            COMMON_EDIT_BUTTON_STYLE,
            tool === 'brush' && COMMON_EDIT_BUTTON_HIGHT_STYLE
          )}
        >
          <img
            src={getResourcePrefixed('board/public/productAvatar/pen.svg')}
            alt='Pen'
            className='w-5 h-5'
          />
        </Button>
        <Button
          variant='ghost'
          size='icon'
          aria-label='Eraser'
          onClick={() => setTool('eraser')}
          className={cn(
            COMMON_EDIT_BUTTON_STYLE,
            tool === 'eraser' && COMMON_EDIT_BUTTON_HIGHT_STYLE
          )}
        >
          <img
            src={getResourcePrefixed('board/public/productAvatar/eraser.svg')}
            alt='Eraser'
            className='w-5 h-5'
          />
        </Button>
        {showClearBtn && (
          <Button
            className='text-white bg-[#272729] border-none h-10 text-sm font-normal px-4 hover:bg-[#272729] hover:text-white'
            onClick={onClear}
          >
            Clear All
          </Button>
        )}
      </div>
    </div>
  );
};

export default ToolBar;
