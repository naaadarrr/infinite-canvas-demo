'use client';

import { useCallback, useRef } from 'react';
import { useRecoilValue } from 'recoil-next';
import {
  avatarTemplateCollectionIdState,
  avatarTemplateShowFavoritesOnlyState
} from '../../store/templateAtoms';
import type { AiAvatarDTO } from '@/server/api/services/mediaLibrary/aiAvatar/type';
import {
  type AigcPhotoAvatar4TemplateDTO,
  PhotoAvatarType
} from '@/server/api/services/avatar4/type';
import { useViewMode } from '@/app/board/[id]/components/ToolPanel/hooks/useViewMode';
import { getResourcePrefixed } from '@/utils/path';
import { useAiAvatarTemplate } from '../../hooks/useAiAvatarTemplate';
import { CategoryFilterBar } from './CategoryFilterBar';
import { PublicTemplates } from './PublicTemplates';
import { FavoritesList } from './FavoritesList';
import { CustomAvatars } from './CustomAvatars';

/** Avatar Templates 面板组件 */
export function AvatarTemplatesPanel() {
  const categoryId = useRecoilValue(avatarTemplateCollectionIdState);
  const showFavoritesOnly = useRecoilValue(
    avatarTemplateShowFavoritesOnlyState
  );

  const { switchToBoard } = useViewMode();
  const { setTemplateFromLibrary, suggestTemplateVoiceover } =
    useAiAvatarTemplate();

  // 避免在依赖数组中放函数引用：用 ref 保持最新引用
  const switchToBoardRef = useRef(switchToBoard);
  switchToBoardRef.current = switchToBoard;

  // 是否显示 My Avatar 分类
  const isMyAvatarCategory = categoryId === 'my-avatar';

  // 公共模板：统一在外层处理“使用模板”
  const handleUsePublicTemplate = useCallback(
    (template: AigcPhotoAvatar4TemplateDTO) => {
      const avatarTemplateUrl = template.imageCompressPath
        ? getResourcePrefixed(template.imageCompressPath)
        : template.imageS3Path
          ? getResourcePrefixed(template.imageS3Path)
          : '';

      setTemplateFromLibrary({
        aiavatarId: template.avatarId,
        avatarTemplateUrl,
        avatarType: PhotoAvatarType.PUBLIC
      });
      suggestTemplateVoiceover(template.voiceoverId);
      switchToBoardRef.current();
    },
    [setTemplateFromLibrary, suggestTemplateVoiceover]
  );

  // My Avatar：统一在外层处理“使用头像”
  const handleUseMyAvatar = useCallback(
    (avatar: AiAvatarDTO) => {
      const avatarTemplateUrl =
        avatar.coverDefaultUrl ||
        (avatar.coverDefault ? getResourcePrefixed(avatar.coverDefault) : '');

      setTemplateFromLibrary({
        aiavatarId: avatar.aiavatarId,
        avatarTemplateUrl,
        avatarType: PhotoAvatarType.PRIVATE
      });
      suggestTemplateVoiceover(avatar.voiceoverIdDefault);

      switchToBoardRef.current();
    },
    [setTemplateFromLibrary, suggestTemplateVoiceover]
  );

  return (
    <div className='flex flex-col h-full'>
      {/* Category Filter Bar */}
      <CategoryFilterBar />

      {/* Content */}
      {showFavoritesOnly && !isMyAvatarCategory ? (
        // 收藏列表
        <FavoritesList
          onUseTemplate={handleUsePublicTemplate}
          onUseMyAvatar={handleUseMyAvatar}
        />
      ) : isMyAvatarCategory ? (
        // My Avatar 列表
        <CustomAvatars onUseMyAvatar={handleUseMyAvatar} />
      ) : (
        // 公共模板列表
        <PublicTemplates onUseTemplate={handleUsePublicTemplate} />
      )}
    </div>
  );
}

export default AvatarTemplatesPanel;
