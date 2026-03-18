/**
 * 移除产品图片背景任务控制器
 * 负责轮询任务状态并处理任务结果
 */

import { useEffect } from 'react';
import { useRecoilValue } from 'recoil-next';
import { useActiveTabId } from '@/app/board/[id]/components/ToolPanel/hooks/useActiveTabId';
import { TaskStatus } from '@/server/api/services/_common/type';
import {
  productAvatarFormFamily,
  ProductAvatarGenerateMode,
  removeImageBackgroundTaskFamily
} from '../../store/atoms';
import { useQueryRemoveBackgroundQuery } from '../../data/task/useQueries';
import { useProductImage } from '../../hooks/useProductImage';
import { extractQueryData } from '@/lib/trpc/helper';
import { toast } from '@/hooks/useToast';

export function RemoveProductImageBackgroundController() {
  const tabId = useActiveTabId();
  const formValues = useRecoilValue(productAvatarFormFamily(tabId));
  const removeImageBackgroundTask = useRecoilValue(
    removeImageBackgroundTaskFamily(tabId)
  );

  const {
    handleRemoveImageBackgroundTaskSuccess,
    handleRemoveImageBackgroundTaskError
  } = useProductImage();

  // 判断是否需要轮询任务
  const shouldPoll =
    formValues.mode === ProductAvatarGenerateMode.MANUAL &&
    !!removeImageBackgroundTask.taskId &&
    removeImageBackgroundTask.status === TaskStatus.RUNNING;

  // 轮询任务状态
  const { data } = useQueryRemoveBackgroundQuery(
    { taskId: removeImageBackgroundTask.taskId },
    {
      enabled: shouldPoll,
      refetchInterval: shouldPoll ? 3000 : false // 3秒轮询一次
    }
  );

  // 处理任务结果
  useEffect(() => {
    if (!data) return;

    try {
      const taskData = extractQueryData(data);
      if (!taskData) return;

      const { status } = taskData;

      if (status === TaskStatus.SUCCESS) {
        handleRemoveImageBackgroundTaskSuccess(taskData);
      } else if (status === TaskStatus.FAIL) {
        handleRemoveImageBackgroundTaskError();
        toast({
          title: 'Error',
          description: 'Failed to remove image background. Please try again.',
          variant: 'destructive'
        });
      }
      // 如果状态是 RUNNING，继续轮询（不需要处理）
    } catch (error) {
      // extractQueryData 会在 tRPC 请求失败时抛出异常
      // 这种情况下，任务状态可能仍然是 RUNNING，需要处理错误
      console.error('Query background remove task error:', error);
      // 可以选择：更新任务状态为失败，或者保持 RUNNING 状态继续重试
      // 这里选择保持 RUNNING 状态，让轮询继续，因为可能是临时网络错误
    }
    // 注意：handleRemoveImageBackgroundTaskSuccess 和 handleRemoveImageBackgroundTaskError
    // 是通过 useRecoilCallback 创建的稳定引用，但根据项目规范，不在依赖数组中添加函数
    // 只依赖 data，函数调用是安全的，因为它们是稳定的引用
  }, [data]);

  // 不渲染任何内容，只处理副作用
  return null;
}
