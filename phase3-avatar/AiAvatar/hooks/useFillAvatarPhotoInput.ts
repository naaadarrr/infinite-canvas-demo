/**
 * useFillAvatarPhotoInput - 填充 AiAvatar 头像照片输入
 *
 * 从 Board 素材填充头像照片到 AiAvatar 表单
 * 用于 Gallery 右键菜单 "AI Avatar" 操作
 */

import { useRecoilCallback } from 'recoil-next';
import { activeTabIdState } from '@/app/board/[id]/components/ToolPanel/store';
import { aiAvatarFormFamily } from '../store/atoms';
import { AssetInputSource } from '@/app/board/[id]/components/ToolPanel/components/avatar/types';

interface FillAvatarPhotoInputParams {
  /** 图片 CDN URL（用于预览显示）*/
  imageUrl?: string;
  /** 图片 S3 路径（用于任务提交）*/
  imageS3Path?: string;
}

/**
 * 填充头像照片输入
 *
 * @example
 * ```tsx
 * const fillAvatarPhotoInput = useFillAvatarPhotoInput();
 * fillAvatarPhotoInput({
 *   imageUrl: 'https://cdn.example.com/image.jpg',
 *   imageS3Path: 'path/to/image.jpg',
 * });
 * ```
 */
export function useFillAvatarPhotoInput() {
  return useRecoilCallback(
    ({ snapshot, set }) =>
      (input: FillAvatarPhotoInputParams) => {
        const tabId = snapshot.getLoadable(activeTabIdState).getValue();
        if (!tabId) return;

        set(aiAvatarFormFamily(tabId), (prev) => ({
          ...prev,
          // 填充素材（用户上传类型）
          templateImageUrl: input.imageUrl,
          imageS3Path: input.imageS3Path,
          // 标记来源为 Board 素材
          avatarPhotoInputSource: AssetInputSource.BOARD_ASSET,
          // Board 素材不需要入库到 My Avatar
          shouldSaveToMyAvatar: false,
          // 清空模板库相关字段（因为是新素材，不再关联模板库）
          aiavatarId: undefined,
          avatarType: undefined,
          avatarTemplateUrl: undefined
        }));
      },
    []
  );
}
