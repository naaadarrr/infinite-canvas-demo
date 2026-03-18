import { cn } from '@/lib/utils';
import { Tooltip } from '@/components/ui/tooltip';
import { ProductAvatarGenerateMode } from '../../store/atoms';

export interface ModeSwitchProps {
  mode: ProductAvatarGenerateMode;
  onModeChange: (mode: ProductAvatarGenerateMode) => void;
}

export function ModeSwitch({ mode, onModeChange }: ModeSwitchProps) {
  return (
    <div>
      <div className='inline-flex rounded-lg border border-white/10 bg-white/5 p-0.5'>
        <Tooltip
          content='Product size is set automatically.'
          position='bottom'
        >
          <button
            onClick={() => onModeChange(ProductAvatarGenerateMode.AUTO)}
            className={cn(
              'rounded-md px-3 py-1 text-xs transition',
              mode === ProductAvatarGenerateMode.AUTO
                ? 'bg-white/10 text-white'
                : 'text-white/50 hover:text-white'
            )}
          >
            Auto Mode
          </button>
        </Tooltip>
        <Tooltip
          content='Manually adjust product size.'
          position='bottom'
        >
          <button
            onClick={() => onModeChange(ProductAvatarGenerateMode.MANUAL)}
            className={cn(
              'rounded-md px-3 py-1 text-xs transition',
              mode === ProductAvatarGenerateMode.MANUAL
                ? 'bg-white/10 text-white'
                : 'text-white/50 hover:text-white'
            )}
          >
            Manual Mode
          </button>
        </Tooltip>
      </div>
    </div>
  );
}
