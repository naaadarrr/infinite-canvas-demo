'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface MaskColorPickerProps {
  brushColor: string;
  setBrushColor: (color: string) => void;
  tool: string;
}

const MaskColorPicker: React.FC<MaskColorPickerProps> = ({
  brushColor,
  setBrushColor,
  tool
}) => {
  const colors = ['#FEFF5599', '#FFFFFF', '#FF0000'];

  return (
    <>
      {tool === 'brush' && (
        <div>
          <p className='mb-3 text-sm font-medium text-white'>Mask Color</p>
          <div className='flex gap-3'>
            {colors.map((color) => (
              <div
                key={color}
                className={cn(
                  'w-8 h-8 rounded-full border-4 border-transparent cursor-pointer',
                  brushColor === color && 'border-2 border-[#4E40F3] p-[2px]'
                )}
              >
                <div
                  className='w-full h-full rounded-full transition-all hover:scale-105 cursor-pointer'
                  style={{ backgroundColor: color }}
                  onClick={() => setBrushColor(color)}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default MaskColorPicker;
