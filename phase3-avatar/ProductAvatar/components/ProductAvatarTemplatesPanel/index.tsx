'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useRecoilValue } from 'recoil-next';
import {
  productAvatarTemplateCategoryIdState,
  productAvatarTemplateCollectionIdState,
  productAvatarTemplateShowFavoritesOnlyState
} from '../../store/templateAtoms';
import { ProductAvatarCategoryId } from '../../type';
import type { ProductAvatarMetaFrontDTO } from '@/server/api/services/productAvatar/template/type';
import { RESOURCE_TYPE } from '@/server/api/services/common/favorite/type';
import { getResourcePrefixed } from '@/utils/media';
import { useViewMode } from '@/app/board/[id]/components/ToolPanel/hooks/useViewMode';
import { useProductAvatarTemplate } from '../../hooks/useProductAvatarTemplate';
import { useTemplateFilter } from './hooks/useTemplateFilter';
import { useProductAvatarTemplates } from './hooks/useProductAvatarTemplates';
import {
  useDeleteCustomMetaMutation,
  useAddFavoriteMutation,
  useCancelFavoriteMutation
} from '../../data/template/useMutations';
import { extractErrorInfo, extractQueryData } from '@/lib/trpc/helper';
import { toast } from '@/hooks/useToast';
import { useSetRecoilState } from 'recoil-next';
import { imageCharacterSwapTaskListState } from '../../store/characterSwapAtoms';
import { useQueryImageCharacterSwapTaskUnfinishedQuery } from '../../data/task/useQueries';
import {
  ImageCharacterSwapTaskSourceEnum,
  type ImageCharacterSwapTaskDetailResult
} from '@/server/api/services/imageCharacterSwap/type';
import { CategoryFilterBar } from './components/CategoryFilterBar';
import { ProductAvatarFilterMenu } from '@/app/board/[id]/components/ToolPanel/components/avatar/ProductAvatarFilterMenu';
import { EmptyState, EmptyStateType } from './components/EmptyState';
import { TemplateCard } from './components/TemplateCard';
import { TemplateCardSkeleton } from './components/TemplateCardSkeleton';
import { MyAvatarList } from './components/MyAvatarList';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { CharacterSwapModal } from './components/CharacterSwapModal';

/** Product Avatar Templates 面板 Props */
export interface ProductAvatarTemplatesPanelProps {
  /** Grid 列数 */
  gridColumns?: number;
}

/** Product Avatar Templates 面板组件 */
export function ProductAvatarTemplatesPanel({
  gridColumns = 4
}: ProductAvatarTemplatesPanelProps) {
  // ========== State ==========
  // 从 store 读取分类状态（用于过滤模板）
  const categoryId = useRecoilValue(productAvatarTemplateCollectionIdState); //合集id
  const showFavoritesOnly = useRecoilValue(
    productAvatarTemplateShowFavoritesOnlyState
  );

  // Modal states
  const [deleteConfirmAvatar, setDeleteConfirmAvatar] =
    useState<ProductAvatarMetaFrontDTO | null>(null);
  const [characterSwapTemplate, setCharacterSwapTemplate] =
    useState<ProductAvatarMetaFrontDTO | null>(null);
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  // Scroll container ref for infinite scroll
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // ========== Derived State ==========
  const isMyAvatarCategory =
    categoryId === ProductAvatarCategoryId.MY_PRODUCT_AVATAR;
  const showFilterButton = !isMyAvatarCategory && !showFavoritesOnly;

  // ========== Hooks ==========
  const { setTemplateFromLibrary } = useProductAvatarTemplate();
  const { switchToBoard } = useViewMode();
  const {
    filter,
    isFavorite,
    toggleFavorite,
    toggleEthnicity,
    toggleGender,
    setSorting
  } = useTemplateFilter();

  // 使用无限滚动查询模板数据
  const {
    templates,
    isLoading,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch
  } = useProductAvatarTemplates({
    categoryId,
    showFavoritesOnly,
    filter,
    isMyAvatarCategory
  });

  // 初始化时拉取未完成的 character-swap 任务并写入 store
  // 分别读取和更新 tasks，避免循环更新
  const tasks = useRecoilValue(imageCharacterSwapTaskListState);
  const setImageCharacterSwapTaskList = useSetRecoilState(
    imageCharacterSwapTaskListState
  );
  const unfinishedQuery = useQueryImageCharacterSwapTaskUnfinishedQuery(
    { source: ImageCharacterSwapTaskSourceEnum.ProductAvatar },
    { enabled: true, refetchOnWindowFocus: false }
  );

  // 当查询到未完成任务时，写入 store；出错显示 toast
  // 使用 ref 防止重复设置相同数据导致的循环更新
  const hasInitializedTasksRef = useRef(false);
  useEffect(() => {
    if (!unfinishedQuery.data || hasInitializedTasksRef.current) return;
    try {
      const results = extractQueryData(unfinishedQuery.data as any) as
        | ImageCharacterSwapTaskDetailResult[]
        | undefined;
      if (results && results.length > 0) {
        hasInitializedTasksRef.current = true;
        setImageCharacterSwapTaskList(results);
      }
    } catch (err) {
      const { errorMessage } = extractErrorInfo(err);
      toast.error(errorMessage || 'Failed to load unfinished tasks');
    }
  }, [unfinishedQuery.data, setImageCharacterSwapTaskList]);

  const handleTaskSuccess = async (
    task: ImageCharacterSwapTaskDetailResult
  ) => {
    try {
      // 延迟移除成功的任务，让用户能看到成功状态
      setTimeout(() => {
        setImageCharacterSwapTaskList((prev) =>
          prev.filter((t) => t.taskId !== task.taskId)
        );
        // 移除后刷新模板列表
        refetch();
      }, 2000);
    } catch (err) {
      const { errorMessage } = extractErrorInfo(err);
      toast.error(errorMessage || 'Failed to refresh templates');
    }
  };

  // 删除自定义模板 mutation
  const deleteCustomMetaMutation = useDeleteCustomMetaMutation();

  // 收藏相关 mutations
  const addFavoriteMutation = useAddFavoriteMutation();
  const cancelFavoriteMutation = useCancelFavoriteMutation();

  // Favorite 视图是否有内容
  const hasFavoriteContent = showFavoritesOnly && templates.length > 0;

  // ========== Empty State ==========
  const emptyStateType = useMemo<EmptyStateType | null>(() => {
    if (isLoading) return null;

    const isEmpty = templates.length === 0;
    const hasNoTasks = tasks.length === 0;

    // My Avatar 分类：templates 和 tasks 都为空才显示空状态
    if (isMyAvatarCategory) {
      if (isEmpty && hasNoTasks) return EmptyStateType.MY_AVATAR;
      return null; // 有 tasks 或有 templates 就不显示空状态
    }

    // 非 My Avatar 分类
    if (showFavoritesOnly && isEmpty) return EmptyStateType.FAVORITE;
    if (isEmpty) return EmptyStateType.NO_RESULTS;

    return null;
  }, [
    isLoading,
    isMyAvatarCategory,
    templates.length,
    tasks.length,
    showFavoritesOnly
  ]);

  // ========== Infinite Scroll ==========
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      // 当距离底部 200px 时加载更多
      if (
        scrollHeight - scrollTop - clientHeight < 200 &&
        hasNextPage &&
        !isFetchingNextPage
      ) {
        fetchNextPage();
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // ========== Handlers ==========
  const handleUseTemplate = useCallback(
    (template: ProductAvatarMetaFrontDTO) => {
      // API 字段映射到表单字段：
      // avatarId → avatarId
      // avatarImagePathWithoutProduct → avatarTemplateUrl (需要转换为完整 URL)
      setTemplateFromLibrary({
        avatarId: template.avatarId,
        avatarTemplateUrl: getResourcePrefixed(
          template.avatarImagePathWithoutProduct || ''
        ),
        templateMinSubsType: template.minSubsType
      });
      // Switch to Board view
      switchToBoard();
    },
    [setTemplateFromLibrary, switchToBoard]
  );

  const handleUseMyAvatar = useCallback(
    (template: ProductAvatarMetaFrontDTO) => {
      // My Avatar 也是从模板库选择的，使用 setTemplateFromLibrary
      setTemplateFromLibrary({
        avatarId: template.avatarId,
        avatarTemplateUrl: getResourcePrefixed(
          template.avatarImagePathWithoutProduct || ''
        ),
        templateMinSubsType: template.minSubsType
      });
      // Switch to Board view
      switchToBoard();
    },
    [setTemplateFromLibrary, switchToBoard]
  );

  const handleCharacterSwap = useCallback(
    (template: ProductAvatarMetaFrontDTO) => {
      setCharacterSwapTemplate(template);
    },
    []
  );

  const deleteMyAvatar = useCallback(
    async (avatarId: string) => {
      try {
        await deleteCustomMetaMutation.mutateAsync({ avatarId });
        toast.success('Delete success');
        // 关闭删除确认弹窗
        setDeleteConfirmAvatar(null);
        // 刷新列表
        await refetch();
      } catch (error) {
        const { errorMessage } = extractErrorInfo(error);
        toast.error(errorMessage || 'Delete failed, please try again later');
      }
    },
    [deleteCustomMetaMutation, refetch]
  );

  // 切换收藏状态（调用 API）
  const handleToggleFavorite = useCallback(
    async (templateId: string) => {
      // 直接使用 favorites 状态判断
      const isCurrentlyFavorite = isFavorite(templateId);

      // 乐观更新：先更新本地状态
      toggleFavorite(templateId);

      try {
        if (isCurrentlyFavorite) {
          // 取消收藏
          await cancelFavoriteMutation.mutateAsync({
            resourceId: templateId,
            type: RESOURCE_TYPE.PRODUCT_AVATAR
          });
        } else {
          // 添加收藏
          await addFavoriteMutation.mutateAsync({
            resourceId: templateId,
            type: RESOURCE_TYPE.PRODUCT_AVATAR
          });
        }
        // 如果是在收藏视图，刷新列表
        if (showFavoritesOnly) {
          await refetch();
        }
      } catch (error) {
        // API 调用失败，回滚本地状态
        toggleFavorite(templateId);
        const { errorMessage } = extractErrorInfo(error);
        toast.error(
          errorMessage ||
            (isCurrentlyFavorite
              ? 'Failed to unfavorite, please try again later'
              : 'Failed to favorite, please try again later')
        );
      }
    },
    [
      toggleFavorite,
      addFavoriteMutation,
      cancelFavoriteMutation,
      showFavoritesOnly,
      refetch
    ]
  );

  // ========== Derived State ==========
  // 当有 emptyStateType 时，不显示 Grid
  const shouldShowGrid =
    !emptyStateType &&
    (templates.length > 0 ||
      tasks.length > 0 ||
      hasFavoriteContent ||
      isLoading ||
      !showFavoritesOnly);

  return (
    <div className='flex h-full flex-col'>
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

      {/* Empty State */}
      {emptyStateType && <EmptyState type={emptyStateType} />}

      {/* Grid Layout - 按行填充 */}
      {shouldShowGrid && (
        <div
          ref={scrollContainerRef}
          className='relative grid flex-1 items-start gap-3 overflow-y-auto pr-1'
          style={{
            gridTemplateColumns: `repeat(${Math.min(gridColumns, 5)}, 1fr)`,
            gridAutoRows: 'min-content'
          }}
        >
          {/* Loading Skeleton - 首次加载或切换分类时显示（但不包括加载下一页） */}
          {(isLoading || (isFetching && !isFetchingNextPage)) &&
            Array.from({ length: Math.min(gridColumns, 5) * 3 }).map(
              (_, index) => <TemplateCardSkeleton key={`skeleton-${index}`} />
            )}

          {/* 显示数据：非首次加载，且（非刷新 或 正在加载下一页） */}
          {!isLoading && (!isFetching || isFetchingNextPage) && (
            <>
              {/* My Product Avatar Cards - 当 isMyAvatarCategory 为 true 时使用 MyAvatarList */}
              {isMyAvatarCategory && (
                <MyAvatarList
                  templates={templates}
                  isFavorite={isFavorite}
                  onUse={handleUseMyAvatar}
                  onToggleFavorite={handleToggleFavorite}
                  onDelete={setDeleteConfirmAvatar}
                  onTaskSuccess={handleTaskSuccess}
                />
              )}

              {/* Template Cards - 普通分类和 Favorite 视图使用 TemplateCard */}
              {!isMyAvatarCategory &&
                templates.map((template) => (
                  <TemplateCard
                    key={template.avatarId}
                    template={template}
                    isFavorite={isFavorite(template.avatarId)}
                    onUse={() => handleUseTemplate(template)}
                    onToggleFavorite={() =>
                      handleToggleFavorite(template.avatarId)
                    }
                    onCharacterSwap={() => handleCharacterSwap(template)}
                  />
                ))}
            </>
          )}

          {/* Loading indicator for infinite scroll */}
          {isFetchingNextPage && (
            <div className='col-span-full mb-3 flex justify-center py-4'>
              <div className='text-sm text-white/50'>Loading more...</div>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirmAvatar && (
        <DeleteConfirmModal
          isOpen={!!deleteConfirmAvatar}
          onClose={() => setDeleteConfirmAvatar(null)}
          onConfirm={() => deleteMyAvatar(deleteConfirmAvatar.avatarId)}
        />
      )}

      {/* Character Swap Modal */}
      {characterSwapTemplate && (
        <CharacterSwapModal
          isOpen={!!characterSwapTemplate}
          onClose={() => setCharacterSwapTemplate(null)}
          template={characterSwapTemplate}
        />
      )}
    </div>
  );
}

export default ProductAvatarTemplatesPanel;
