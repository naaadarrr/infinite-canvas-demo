// Design My Avatar 工具表单组件

import { useState, useRef, useEffect, useCallback } from 'react';
import { Sparkles } from 'lucide-react';
import { useRecoilState } from 'recoil-next';
import { cn } from '@/lib/utils';
import { RadioParameter } from '@/app/board/[id]/components/ToolPanel/components/inputs/RadioParameter';
import { AvatarStyleParameter } from '@/app/board/[id]/components/ToolPanel/components/avatar/AvatarStyleParameter';
import { DesignMyAvatarFormValues } from './type';

import { STYLE_OPTIONS, RATIO_OPTIONS, DEFAULT_VALUES } from './config';
import { useActiveTabId } from '@/app/board/[id]/components/ToolPanel/hooks/useActiveTabId';
import { GenerateButtonContainer } from '@/app/board/[id]/components/ToolPanel/components/primitives/GenerateButton';
import { designMyAvatarFormFamily } from './store/atoms';
import { UploadAvatarPhoto } from './components/UploadAvatarPhoto';
import { PromptsModeTab } from './components/PromptsModeForm';
import { AvatarFaceFromTypeEnum } from '@/server/api/services/promptToAvatar/type';
import { SamplePromptsModal } from '@/app/board/[id]/components/ToolPanel/feature/Avatar/DesignMyAvatar/components/SamplePromptsModal';
import { GenerateButton } from './components/GenerateButton';

export function DesignMyAvatar() {
  // 获取当前活动的 Tab ID
  const tabId = useActiveTabId();

  // 从模块独立 store 获取状态
  const [formValues, setFormValues] = useRecoilState(
    designMyAvatarFormFamily(tabId)
  );

  // 从 formValues 解构常用字段
  const { faceSource, style, prompt } = formValues;

  // 处理表单值更新
  const handleValueChange = useCallback(
    <K extends keyof DesignMyAvatarFormValues>(
      key: K,
      value: DesignMyAvatarFormValues[K]
    ) => {
      setFormValues((prev) => ({ ...prev, [key]: value }));
    },
    [setFormValues]
  );

  const [showSamplePrompts, setShowSamplePrompts] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 自动调整 textarea 高度
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.max(120, textarea.scrollHeight)}px`;
    }
  };

  // 当 prompt 变化时调整高度
  useEffect(() => {
    adjustTextareaHeight();
  }, [prompt]);

  // 处理 Sample Prompt 选择
  const handleSamplePromptSelect = (selectedPrompt: string) => {
    handleValueChange('prompt', selectedPrompt);
    setShowSamplePrompts(false);
  };

  return (
    <div className='flex h-full flex-col'>
      <div className='flex-1 space-y-5 p-4'>
        {/* Set Avatar Face */}
        <div>
          <label className='mb-2 block text-sm text-white/60'>
            Set Avatar Face
          </label>
          <div className='inline-flex rounded-lg border border-white/10 bg-white/5 p-0.5'>
            <button
              onClick={() =>
                handleValueChange('faceSource', AvatarFaceFromTypeEnum.photo)
              }
              className={cn(
                'rounded-md px-3 py-1 text-xs transition',
                faceSource === AvatarFaceFromTypeEnum.photo
                  ? 'bg-white/10 text-white'
                  : 'text-white/50 hover:text-white'
              )}
            >
              Set From Photo
            </button>
            <button
              onClick={() =>
                handleValueChange('faceSource', AvatarFaceFromTypeEnum.prompt)
              }
              className={cn(
                'rounded-md px-3 py-1 text-xs transition',
                faceSource === AvatarFaceFromTypeEnum.prompt
                  ? 'bg-white/10 text-white'
                  : 'text-white/50 hover:text-white'
              )}
            >
              Set With Prompts
            </button>
          </div>
        </div>

        {/* Upload Avatar Photo */}
        {faceSource === AvatarFaceFromTypeEnum.photo && <UploadAvatarPhoto />}

        {/* Prompts Mode Tab */}
        {faceSource === AvatarFaceFromTypeEnum.prompt && (
          <PromptsModeTab
            formValues={formValues}
            onValueChange={handleValueChange}
          />
        )}

        {/* Describe Avatar Details */}
        <div>
          <label className='mb-2 block text-sm text-white/60'>
            Describe Avatar Details
          </label>
          <div className='relative'>
            <textarea
              ref={textareaRef}
              placeholder="Describe the avatar's pose, background, outfit, and shot type. Need inspiration? Try some sample prompts."
              value={prompt}
              onChange={(e) => {
                const newValue = e.target.value;
                const maxLength = 1500;
                if (newValue.length > maxLength) {
                  handleValueChange('prompt', newValue.slice(0, maxLength));
                } else {
                  handleValueChange('prompt', newValue);
                }
              }}
              className='min-h-[120px] w-full resize-none rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 transition focus:border-white/20 focus:outline-none'
            />
            <div className='flex items-start justify-between'>
              <span className='text-xs text-white/40'>
                {prompt.length}/1500
              </span>
              <button
                onClick={() => setShowSamplePrompts(true)}
                className='flex items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/60 transition hover:border-white/20 hover:text-white'
              >
                <Sparkles className='h-3 w-3' />
                Sample Prompts
              </button>
            </div>
          </div>
        </div>

        {/* Sample Prompts Modal */}
        <SamplePromptsModal
          isOpen={showSamplePrompts}
          onClose={() => setShowSamplePrompts(false)}
          onSelect={handleSamplePromptSelect}
        />

        {/* Style */}
        <AvatarStyleParameter
          label='Style'
          options={[...STYLE_OPTIONS]}
          avatarStyle={style}
          onAvatarStyleChange={(style) =>
            handleValueChange(
              'style',
              style as DesignMyAvatarFormValues['style']
            )
          }
        />

        {/* Ratio */}
        <RadioParameter
          label='Ratio'
          options={RATIO_OPTIONS}
          value={formValues.ratio}
          defaultValue={DEFAULT_VALUES.ratio}
          paramKey='aspectRatio'
          onChange={(value) =>
            handleValueChange(
              'ratio',
              value as DesignMyAvatarFormValues['ratio']
            )
          }
        />
      </div>

      {/* Generate Button */}
      <GenerateButtonContainer>
        <GenerateButton formValues={formValues} />
      </GenerateButtonContainer>
    </div>
  );
}
