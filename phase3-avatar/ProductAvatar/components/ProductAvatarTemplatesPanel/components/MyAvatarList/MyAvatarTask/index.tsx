'use client';

import { useEffect, useRef } from 'react';
import type { ImageCharacterSwapTaskDetailResult } from '@/server/api/services/imageCharacterSwap/type';
import { XCircle, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getResourcePrefixed } from '@/utils/media';
import { useQueryImageCharacterSwapTaskQuery } from '../../../../../data/task/useQueries';
import { extractQueryData } from '@/lib/trpc/helper';
import { useSetRecoilState } from 'recoil-next';
import { imageCharacterSwapTaskListState } from '../../../../../store/characterSwapAtoms';

export interface MyAvatarTaskProps {
  /** 任务对象（初始） */
  task: ImageCharacterSwapTaskDetailResult;
  /** 生成成功回调（可选） */
  onSuccess?: (result: ImageCharacterSwapTaskDetailResult) => void;
}

/**
 * 任务卡片组件 — 会轮询任务详情，任务成功或失败时停止并更新 store；成功时触发 onSuccess（一次）
 */
export function MyAvatarTask({ task, onSuccess }: MyAvatarTaskProps) {
  const bgUrl = getResourcePrefixed(
    task.inputTemplateImagePath || task.inputTemplateImageUrl || ''
  );

  // query to poll task detail
  const query = useQueryImageCharacterSwapTaskQuery(
    { taskId: task.taskId },
    {
      enabled: !!task.taskId,
      refetchOnWindowFocus: false,
      refetchInterval: (q) => {
        try {
          const d = extractQueryData(q.state.data);
          return d?.status === 'success' || d?.status === 'fail' ? false : 3000;
        } catch {
          return 3000;
        }
      }
    }
  );

  const queryData = (() => {
    try {
      return extractQueryData(query.data);
    } catch {
      return undefined;
    }
  })();

  const status = queryData?.status || task.status;
  const isRunning = status === 'running' || status === 'init';
  const isSuccess = status === 'success';
  const isFailed = status === 'fail';

  const calledRef = useRef(false);
  const lastStatusRef = useRef<string | undefined>(task.status);
  const setImageCharacterSwapTaskList = useSetRecoilState(
    imageCharacterSwapTaskListState
  );

  useEffect(() => {
    if (!queryData) return;

    // 只在状态真正变化时才更新 store，避免循环更新
    if (queryData.status !== lastStatusRef.current) {
      lastStatusRef.current = queryData.status;
      setImageCharacterSwapTaskList(
        (prev: ImageCharacterSwapTaskDetailResult[]) => {
          const filtered = prev.filter(
            (t: ImageCharacterSwapTaskDetailResult) =>
              t.taskId !== queryData.taskId
          );
          return [queryData, ...filtered];
        }
      );
    }

    // 如果任务成功且尚未回调，则回调一次
    if (isSuccess && !calledRef.current) {
      calledRef.current = true;
      onSuccess?.(queryData);
    }
  }, [queryData, isSuccess, onSuccess, setImageCharacterSwapTaskList]);

  // 删除失败任务
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImageCharacterSwapTaskList(
      (prev: ImageCharacterSwapTaskDetailResult[]) => {
        return prev.filter(
          (t: ImageCharacterSwapTaskDetailResult) => t.taskId !== task.taskId
        );
      }
    );
  };

  return (
    <div
      className={cn(
        'group relative rounded-xl overflow-hidden border border-white/5',
        'bg-white/5 transition-all'
      )}
      role='button'
    >
      {/* 背景图 - 使用固定宽高比避免高度塌陷 */}
      <div
        className='relative overflow-hidden bg-white/5'
        style={{ aspectRatio: '9/16' }}
      >
        {bgUrl ? (
          <img
            src={bgUrl}
            alt='template'
            draggable={false}
            className='h-full w-full object-cover'
            loading='lazy'
          />
        ) : (
          <div className='absolute inset-0 animate-pulse bg-white/10' />
        )}

        {/* 半透明遮罩 */}
        <div className='absolute inset-0 bg-black/30' />

        {/* 状态层 */}
        <div className='absolute inset-0 flex items-center justify-center'>
          {isRunning && (
            <div className='flex flex-col items-center gap-2'>
              <div className='h-8 w-8 animate-spin rounded-full border-2 border-white/30 border-t-white' />
              <div className='text-sm text-white/90'>Generating...</div>
            </div>
          )}

          {isFailed && (
            <div className='flex flex-col items-center gap-3'>
              <XCircle className='h-8 w-8 text-red-400' />
              <div className='text-sm text-red-300'>Failed</div>
              <button
                onClick={handleDelete}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg',
                  'bg-red-500/20 hover:bg-red-500/30',
                  'text-red-300 hover:text-red-200',
                  'border border-red-500/30 hover:border-red-500/50',
                  'transition-all duration-200',
                  'text-xs font-medium'
                )}
              >
                <Trash2 className='h-3.5 w-3.5' />
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MyAvatarTask;
