import { Textarea } from '@/components/ui/textarea';
import { CUSTOM_MOTION_MAX_LENGTH } from '../../../../config';

interface CustomMotionInputProps {
  /** 正向提示词 */
  value?: string;
  /** 变更回调 */
  onChange: (value: string | undefined) => void;
}

export function CustomMotionInput({ value, onChange }: CustomMotionInputProps) {
  return (
    <div>
      <div className='mb-2 flex items-center gap-2'>
        <label className='text-sm text-white/60'>Custom Motion</label>
        <span className='text-xs text-white/40'>(Optional)</span>
        <span className='rounded bg-indigo-500/20 px-1.5 py-0.5 text-[10px] font-medium text-indigo-400'>
          Beta
        </span>
      </div>
      <Textarea
        placeholder="Describe the avatar's emotional actions, such as excited, discouraged, or cheering."
        value={value || ''}
        onChange={(e) => {
          const newValue = e.target.value;
          if (newValue.length <= CUSTOM_MOTION_MAX_LENGTH) {
            onChange(newValue || undefined);
          }
        }}
        className='min-h-[100px] resize-none'
      />
      <div className='mt-1.5 text-xs text-white/40'>
        {(value || '').length}/{CUSTOM_MOTION_MAX_LENGTH}
      </div>
    </div>
  );
}
