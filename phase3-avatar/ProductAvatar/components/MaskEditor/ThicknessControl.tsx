'use client';

import React from 'react';

import { cn } from '@/lib/utils';
import * as SliderPrimitive from '@radix-ui/react-slider';

interface ThicknessControlProps {
  value: number;
  onChange: (size: number) => void;
  tool: string;
}

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      'relative flex w-full touch-none select-none items-center',
      className
    )}
    {...props}
  >
    <SliderPrimitive.Track className='relative h-2 w-full grow overflow-hidden rounded-full bg-[#353537]'>
      <SliderPrimitive.Range className='absolute h-full bg-white' />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className='block h-5 w-5 rounded-full bg-white border-0 ring-0 focus-visible:outline-none focus-visible:ring-0 disabled:pointer-events-none disabled:opacity-50' />
  </SliderPrimitive.Root>
));

Slider.displayName = SliderPrimitive.Root.displayName;

const ThicknessControl: React.FC<ThicknessControlProps> = ({
  value,
  onChange,
  tool
}) => {
  const label = tool === 'eraser' ? 'Eraser Thickness' : 'Brush Thickness';

  return (
    <div>
      <p className='mb-3 text-sm font-medium text-white'>{label}</p>
      <Slider
        min={1}
        max={50}
        step={1}
        value={[value]}
        onValueChange={(values) => onChange(values[0])}
        className='w-full'
      />
    </div>
  );
};

export default ThicknessControl;
