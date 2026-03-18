/**
 * ProductAvatar Re-edit 处理 Hook
 * 将 task.parameters 映射为 ProductAvatarFormValues
 * 在 Handler 层集中获取所有 URL，然后一次性设置 formValues
 */

import { useRecoilCallback } from 'recoil-next';
import { activeTabIdState } from '@/app/board/[id]/components/ToolPanel/store';
import {
  productAvatarFormFamily,
  reEditLoadingFamily,
  ProductAvatarGenerateMode,
  type ProductAvatarAutoModeFormValues,
  type ProductAvatarManualModeFormValues
} from '../store/atoms';
import { useFetchMetaById } from '../data/template/useQueries';
import { getResourcePrefixed } from '@/utils/media';
import useAwsS3 from '@/hooks/useAwsS3';
import type { TaskParameters } from '@/server/api/services/board/common';
import type {
  RectangleCorners,
  PromptReplaceProductTaskType
} from '@/server/api/services/productAvatar/task/type';

/**
 * ProductAvatar 任务参数类型（task.parameters 的精确定义）
 */
interface ProductAvatarTaskParameters extends TaskParameters {
  generateImageMode?: ProductAvatarGenerateMode;
  avatarId?: string;
  productImagePath?: string;
  templateImagePath?: string;
  inputImageResourceId?: string;
  productImageWithoutBackground?: string;
  location?: RectangleCorners;
  type?: PromptReplaceProductTaskType;
}

export function useProductAvatarReEditHandler() {
  const { getCdnUrls } = useAwsS3();
  const fetchMetaById = useFetchMetaById();

  return useRecoilCallback(
    ({ snapshot, set }) =>
      async (parameters: TaskParameters) => {
        const activeTabId = snapshot.getLoadable(activeTabIdState).getValue();
        if (!activeTabId) return;

        // 类型断言为精确的 ProductAvatar 参数类型
        const params = parameters as ProductAvatarTaskParameters;
        const isManualMode =
          params.generateImageMode === ProductAvatarGenerateMode.MANUAL;

        // 1. 设置 loading 状态
        set(reEditLoadingFamily(activeTabId), true);

        try {
          if (isManualMode) {
            // Manual 模式：所有资源都是用户资源，统一用 getCdnUrls
            const urls = await getCdnUrls({
              templateImageUrl: params.templateImagePath ?? '',
              productImageUrl: params.productImagePath ?? '',
              cutoutImageUrl: params.productImageWithoutBackground ?? ''
            });

            const formValues: ProductAvatarManualModeFormValues = {
              mode: ProductAvatarGenerateMode.MANUAL,
              templateImagePath: params.templateImagePath,
              templateImageUrl: urls.templateImageUrl,
              productImagePath: params.productImagePath,
              productImageUrl: urls.productImageUrl,
              productImageWithoutBackground:
                params.productImageWithoutBackground,
              productImageWithoutBackgroundUrl: urls.cutoutImageUrl,
              inputImageResourceId: params.inputImageResourceId ?? '',
              location: params.location,
              type: params.type
            };
            set(productAvatarFormFamily(activeTabId), formValues);
          } else {
            // Auto 模式
            let avatarTemplateUrl: string | undefined;

            if (params.avatarId) {
              // 通过 data 层封装的 fetch 查询模板信息
              const templateResult = await fetchMetaById({
                avatarId: params.avatarId
              });

              // avatarImagePathWithoutProduct 是模板资源，用 getResourcePrefixed 同步拼接
              if (templateResult.data?.avatarImagePathWithoutProduct) {
                avatarTemplateUrl = getResourcePrefixed(
                  templateResult.data.avatarImagePathWithoutProduct
                );
              }
            }

            // productImagePath 是用户资源，需要 getCdnUrls
            const productUrls = await getCdnUrls({
              productImageUrl: params.productImagePath ?? ''
            });

            const formValues: ProductAvatarAutoModeFormValues = {
              mode: ProductAvatarGenerateMode.AUTO,
              avatarId: params.avatarId,
              avatarTemplateUrl,
              productImagePath: params.productImagePath,
              productImageUrl: productUrls.productImageUrl
            };
            set(productAvatarFormFamily(activeTabId), formValues);
          }
        } catch (error) {
          console.error('[ProductAvatarReEdit] Failed to fetch URLs:', error);
          // 即使失败也设置基本的 path 信息，让用户可以看到部分数据
          if (isManualMode) {
            set(productAvatarFormFamily(activeTabId), {
              mode: ProductAvatarGenerateMode.MANUAL,
              templateImagePath: params.templateImagePath,
              productImagePath: params.productImagePath,
              productImageWithoutBackground:
                params.productImageWithoutBackground,
              inputImageResourceId: params.inputImageResourceId ?? '',
              location: params.location,
              type: params.type
            });
          } else {
            set(productAvatarFormFamily(activeTabId), {
              mode: ProductAvatarGenerateMode.AUTO,
              avatarId: params.avatarId,
              productImagePath: params.productImagePath
            });
          }
        } finally {
          // 清除 loading 状态
          set(reEditLoadingFamily(activeTabId), false);
        }
      },
    [getCdnUrls, fetchMetaById]
  );
}
