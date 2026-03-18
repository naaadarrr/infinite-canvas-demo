import { useState, useEffect, useMemo, type UIEvent } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTemplatePrompts } from '../../hooks/useTemplatePrompts';

interface SamplePromptsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (prompt: string) => void;
}

export function SamplePromptsModal({
  isOpen,
  onClose,
  onSelect
}: SamplePromptsModalProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { templates, isLoading, error, hasMore, loadMore } =
    useTemplatePrompts();

  // 当模板列表变化且当前选中项已不存在时，重置为 null
  useEffect(() => {
    if (!templates.length) {
      setSelectedId(null);
      return;
    }

    const exists = templates.some((t) => t.templateId === selectedId);

    // 如果当前没有选中项或选中项已不存在，则默认选中第一个
    if (!selectedId || !exists) {
      setSelectedId(templates[0]?.templateId ?? null);
    }
  }, [templates, selectedId]);

  const selectedSample = useMemo(() => {
    if (!selectedId) return null;
    return templates.find((t) => t.templateId === selectedId) ?? null;
  }, [templates, selectedId]);

  const handleScroll = (event: UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
    const distanceToBottom = scrollHeight - scrollTop - clientHeight;

    if (distanceToBottom < 50 && !isLoading && hasMore) {
      loadMore();
    }
  };

  if (!isOpen) return null;

  const handleUsePrompt = () => {
    if (selectedSample) {
      onSelect(selectedSample.templatePrompt);
      onClose();
    }
  };

  const modalContent = (
    <div className='fixed inset-0 z-[9999] flex items-center justify-center p-4'>
      {/* Backdrop */}
      <div
        className='fixed inset-0 bg-black/70'
        onClick={onClose}
      />

      {/* Modal */}
      <div className='relative z-10 flex h-[85vh] w-[1100px] max-w-[95vw] overflow-hidden rounded-2xl bg-[#1a1a1a] shadow-2xl'>
        {/* Close button */}
        <button
          onClick={onClose}
          className='absolute right-4 top-4 z-10 rounded-full p-2 text-white/40 transition hover:bg-white/10 hover:text-white'
        >
          <X className='h-5 w-5' />
        </button>

        {/* Left side - Image grid */}
        <div className='flex flex-1 flex-col'>
          <div className='px-6 pt-6 pb-4'>
            <h2 className='text-lg font-semibold text-white'>
              Select a Sample Prompt
            </h2>
          </div>
          <div
            className='flex-1 overflow-y-auto px-6 pb-6 pt-2'
            onScroll={handleScroll}
          >
            {error ? (
              <div className='flex h-full flex-col items-center justify-center text-sm text-red-400'>
                <div className='mb-2'>Failed to load sample prompts</div>
                <div className='text-xs text-white/40'>{error}</div>
              </div>
            ) : isLoading && !templates.length ? (
              <div className='flex h-full items-center justify-center text-sm text-white/50'>
                Loading sample prompts...
              </div>
            ) : templates.length === 0 ? (
              <div className='flex h-full items-center justify-center text-sm text-white/40'>
                No sample prompts available
              </div>
            ) : (
              <div className='grid grid-cols-6 gap-2.5'>
                {templates.map((template) => (
                  <button
                    key={template.templateId}
                    onClick={() => setSelectedId(template.templateId)}
                    className={cn(
                      'relative aspect-[9/16] overflow-hidden rounded-xl transition-all duration-200',
                      selectedId === template.templateId
                        ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-[#1a1a1a] scale-[1.02]'
                        : 'hover:scale-[1.03] hover:shadow-lg'
                    )}
                  >
                    {template.coverUrl ? (
                      <img
                        src={template.coverUrl}
                        alt={template.templateName}
                        className='h-full w-full object-cover'
                        loading='lazy'
                      />
                    ) : (
                      <div className='flex h-full w-full items-center justify-center bg-white/5 text-xs text-white/40'>
                        No Image
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right side - Prompt preview */}
        <div className='flex w-[280px] flex-col bg-[#141414]'>
          <div className='px-5 pt-6 pb-3'>
            <h3 className='text-sm font-medium text-white/60 uppercase tracking-wide'>
              Prompt
            </h3>
          </div>
          <div className='flex-1 overflow-y-auto px-5'>
            {selectedSample && (
              <p className='text-sm leading-relaxed text-white/70 whitespace-pre-line'>
                {selectedSample.templatePrompt}
              </p>
            )}
          </div>

          {/* Use This Prompt Button */}
          <div className='p-5'>
            <button
              onClick={handleUsePrompt}
              disabled={!selectedSample}
              className='flex w-full h-10 items-center justify-center gap-2 rounded-lg text-sm font-medium text-white transition-all bg-[#4E40F3] hover:bg-[#4030E0] disabled:opacity-70'
            >
              Use This Prompt
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // 使用 Portal 将弹窗渲染到 body，确保遮罩覆盖整个页面
  return createPortal(modalContent, document.body);
}
