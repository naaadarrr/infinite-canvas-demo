import { Info } from 'lucide-react';
import { Tooltip } from '@/components/ui/tooltip';
import { Switch } from '@/components/ui/switch';

interface OffPeakModeToggleProps {
  /** 是否非高峰 */
  value?: boolean;
  /** 变更回调 */
  onChange: (value: boolean | undefined) => void;
}

export function OffPeakModeToggle({ value, onChange }: OffPeakModeToggleProps) {
  return (
    <div className='flex items-center justify-between'>
      <div className='flex items-center gap-1'>
        <label className='text-sm text-white/60'>Off-Peak Mode</label>
        {/* Crown icon for Business tier feature */}
        <svg
          className='h-4 w-4 text-purple-400'
          viewBox='0 0 24 24'
          fill='currentColor'
        >
          <path d='M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm0 3h14v2H5v-2z' />
        </svg>
        <Tooltip
          content={
            <div className='max-w-[200px] space-y-1 text-left'>
              <div className='flex items-center gap-1.5'>
                <span className='text-green-400'>Save 50%</span>
                <span>credits</span>
              </div>
              <div>Processed in idle hours</div>
              <div>Guaranteed within 24h</div>
            </div>
          }
          position='top'
          asChild
        >
          <Info className='h-3.5 w-3.5 cursor-help text-white/30 hover:text-white/50 transition-colors' />
        </Tooltip>
      </div>
      <Switch
        checked={!!value}
        onCheckedChange={(checked) => onChange(checked)}
      />
    </div>
  );
}
