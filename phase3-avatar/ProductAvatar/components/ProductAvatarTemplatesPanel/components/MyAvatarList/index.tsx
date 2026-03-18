'use client';

import type { ProductAvatarMetaFrontDTO } from '@/server/api/services/productAvatar/template/type';
import { MyAvatarCard } from './MyAvatarCard';
import MyAvatarTask from './MyAvatarTask';
import type { ImageCharacterSwapTaskDetailResult } from '@/server/api/services/imageCharacterSwap/type';
import { useRecoilValue } from 'recoil-next';
import { imageCharacterSwapTaskListState } from '@/app/board/[id]/components/ToolPanel/feature/Avatar/ProductAvatar/store/characterSwapAtoms';

export interface MyAvatarListProps {
  /** 我的形象模板列表 */
  templates: ProductAvatarMetaFrontDTO[];
  /** 判断是否已收藏 */
  isFavorite: (avatarId: string) => boolean;
  /** 点击使用 */
  onUse: (template: ProductAvatarMetaFrontDTO) => void;
  /** 切换收藏 */
  onToggleFavorite: (avatarId: string) => void;
  /** 删除 */
  onDelete: (template: ProductAvatarMetaFrontDTO) => void;
  /** 任务成功回调（可选） */
  onTaskSuccess?: (task: ImageCharacterSwapTaskDetailResult) => void;
}

/** 我的形象列表组件（支持同时展示任务卡片） */
export function MyAvatarList({
  templates,
  isFavorite,
  onUse,
  onToggleFavorite,
  onDelete,
  onTaskSuccess
}: MyAvatarListProps) {
  const tasks = useRecoilValue(imageCharacterSwapTaskListState);

  return (
    <>
      {/* 先展示任务卡片（最新任务在前） */}
      {tasks.map((task) => (
        <MyAvatarTask
          key={task.taskId}
          task={task}
          onSuccess={onTaskSuccess}
        />
      ))}

      {/* 再展示已完成/已有的模板卡片 */}
      {templates.map((template) => (
        <MyAvatarCard
          key={template.avatarId}
          avatar={template}
          isFavorite={isFavorite(template.avatarId)}
          onUse={() => onUse(template)}
          onToggleFavorite={() => onToggleFavorite(template.avatarId)}
          onDelete={() => onDelete(template)}
        />
      ))}
    </>
  );
}
