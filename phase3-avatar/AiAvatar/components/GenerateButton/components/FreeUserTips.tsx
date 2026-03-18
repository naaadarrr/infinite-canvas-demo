/**
 * 免费用户提示组件
 */
'use client';

import { PhotoAvatarVideoMode } from '@/server/api/services/avatar4/type';
import { AVATAR_4_MODE_MAX_INPUT_AUDIO_DURATION_FREE } from '../../../config/index';

interface FreeUserTipsProps {
  /** 是否为免费用户 */
  isFreeUser: boolean;
  /** 当前选择的视频生成模式 */
  selectedVideoGenerationMode: PhotoAvatarVideoMode;
  /** 用户免费次数 */
  userFreeCount: number;
}

/**
 * 判断是否为 Avatar 4 兼容模式
 */
function isAvatar4CompatibleMode(mode: PhotoAvatarVideoMode): boolean {
  return (
    mode === PhotoAvatarVideoMode.AVATAR_4 ||
    mode === PhotoAvatarVideoMode.AVATAR_4_FAST
  );
}

/**
 * 免费用户提示组件
 */
export function FreeUserTips({
  isFreeUser,
  selectedVideoGenerationMode,
  userFreeCount
}: FreeUserTipsProps) {
  if (!isFreeUser || !isAvatar4CompatibleMode(selectedVideoGenerationMode)) {
    return null;
  }

  if (userFreeCount > 0) {
    return (
      <>
        Free trial tips:{' '}
        <span className='text-[#00CA30]'>
          {AVATAR_4_MODE_MAX_INPUT_AUDIO_DURATION_FREE}s
        </span>
      </>
    );
  } else {
    return <>Trial used. Upgrade to generate more.</>;
  }
}
