'use client';

import { useState, useRef, useCallback } from 'react';
import { useRecoilValue } from 'recoil-next';
import {
  videoAvatarTemplateCategoryIdState,
  videoAvatarTemplateShowFavoritesOnlyState
} from '../../store/templateAtoms';
import type { AiAvatarDTO } from '@/server/api/services/mediaLibrary/aiAvatar/type';
import { useViewMode } from '@/app/board/[id]/components/ToolPanel/hooks/useViewMode';
import { useVideoLipSyncTemplate } from '../../hooks/useVideoLipSyncTemplate';
import { CategoryFilterBar } from './CategoryFilterBar';
import { PublicTemplates } from './PublicTemplates';
import { CustomAvatars } from './CustomAvatars';
import { FavoritesList } from './FavoritesList';
import { useTemplateFilter } from '../../hooks/useTemplateFilter';
import { ProductAvatarFilterMenu } from '@/app/board/[id]/components/ToolPanel/components/avatar/ProductAvatarFilterMenu';

/** Video Avatar Templates 面板组件 */
export function VideoAvatarTemplatesPanel() {
  const { switchToBoard } = useViewMode();
  const { setTemplateFromLibrary, suggestTemplateVoiceover } =
    useVideoLipSyncTemplate();
  const categoryId = useRecoilValue(videoAvatarTemplateCategoryIdState);
  const showFavoritesOnly = useRecoilValue(
    videoAvatarTemplateShowFavoritesOnlyState
  );

  // 筛选相关
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const {
    filter,
    isFavorite,
    toggleFavorite,
    toggleEthnicity,
    toggleGender,
    setSorting
  } = useTemplateFilter();

  // 避免在依赖数组中放函数引用：用 ref 保持最新引用
  const switchToBoardRef = useRef(switchToBoard);
  switchToBoardRef.current = switchToBoard;

  // 是否显示 My Video Avatar 分类
  const isMyAvatarCategory = categoryId === 'my-video-avatar';

  // 是否显示筛选按钮
  const showFilterButton = !isMyAvatarCategory && !showFavoritesOnly;

  // 构建筛选参数用于 API 请求
  const getFilterParams = useCallback(() => {
    const params: {
      ethnicityIds?: string;
      gender?: string;
      sortField?: string;
      sortType?: string;
    } = {};

    // 处理 ethnicity 数组为逗号分隔的字符串
    if (filter.ethnicity.length > 0) {
      params.ethnicityIds = filter.ethnicity.join(',');
    }

    // 处理 gender 数组（单选）
    if (filter.gender.length > 0) {
      params.gender = filter.gender[0];
    }

    // 处理排序
    params.sortField = 'sort';
    params.sortType = filter.sorting === 'popularity' ? 'desc' : 'asc';

    return params;
  }, [filter]);

  const filterParams = getFilterParams();

  // 公共模板：统一在外层处理"使用模板"
  const handleUseTemplate = useCallback(
    (avatar: AiAvatarDTO) => {
      const videoUrl = avatar.previewVideoUrl || avatar.inputVideoPlayUrl;
      setTemplateFromLibrary({
        aiavatarId: avatar.aiavatarId,
        videoUrl
      });
      suggestTemplateVoiceover(avatar.voiceoverIdDefault);
      switchToBoardRef.current();
    },
    [setTemplateFromLibrary, suggestTemplateVoiceover]
  );

  // My Video Avatar：统一在外层处理"使用头像"
  const handleUseMyAvatar = useCallback(
    (avatar: AiAvatarDTO) => {
      const videoUrl = avatar.previewVideoUrl || avatar.inputVideoPlayUrl;

      setTemplateFromLibrary({
        aiavatarId: 'aiavatarId' in avatar ? avatar.aiavatarId : undefined,
        videoUrl
      });
      suggestTemplateVoiceover(avatar.voiceoverIdDefault);

      switchToBoardRef.current();
    },
    [setTemplateFromLibrary, suggestTemplateVoiceover]
  );

  return (
    <div className='flex flex-col h-full'>
      {/* Category Filter Bar */}
      <CategoryFilterBar
        filterButton={
          showFilterButton ? (
            <ProductAvatarFilterMenu
              filter={filter}
              isOpen={showFilterMenu}
              onToggle={() => setShowFilterMenu(!showFilterMenu)}
              onClose={() => setShowFilterMenu(false)}
              onToggleEthnicity={toggleEthnicity}
              onToggleGender={toggleGender}
              onSetSorting={setSorting}
            />
          ) : undefined
        }
      />

      {/* Content */}
      {showFavoritesOnly && !isMyAvatarCategory ? (
        // 收藏列表
        <FavoritesList onUseTemplate={handleUseTemplate} />
      ) : isMyAvatarCategory ? (
        // My Video Avatar 列表
        <CustomAvatars onUseMyAvatar={handleUseMyAvatar} />
      ) : (
        // 公共模板列表
        <PublicTemplates
          onUseTemplate={handleUseTemplate}
          onToggleFavorite={toggleFavorite}
          ethnicityIds={filterParams.ethnicityIds}
          gender={filterParams.gender}
          sortField={filterParams.sortField}
          sortType={filterParams.sortType}
        />
      )}
    </div>
  );
}

export default VideoAvatarTemplatesPanel;
