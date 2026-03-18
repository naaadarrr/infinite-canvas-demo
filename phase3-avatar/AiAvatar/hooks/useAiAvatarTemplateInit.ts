/**
 * AI Avatar 模板初始化 Hook
 *
 * 用于处理从 Home 页跳转时携带的 templateId 参数：
 * 1. 读取 URL 中的 templateId 参数
 * 2. 根据 templateId 从 API 获取模板数据
 * 3. 填充模板信息到表单（头像 + 音色）
 * 4. 清除 URL 中的 templateId 参数
 */

import { useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useFetchPhotoAvatar4ById } from '../data/avatar4Template/useQueries';
import { useAiAvatarTemplate } from './useAiAvatarTemplate';
import { getResourcePrefixed } from '@/utils/resource';
import { extractQueryData } from '@/lib/trpc/helper';
import { PhotoAvatarType } from '@/server/api/services/avatar4/type';

// URL 参数名
const TEMPLATE_ID_PARAM = 'templateId';

/**
 * 模板初始化 Hook
 * 自动检测 URL 中的 templateId 参数，获取模板数据并填充到表单
 *
 * @param tabId 当前活动的 Tab ID
 */
export function useAiAvatarTemplateInit(tabId: string) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const fetchTemplateById = useFetchPhotoAvatar4ById();
  const { setTemplateFromLibrary, suggestTemplateVoiceover } =
    useAiAvatarTemplate();

  // 标记是否已经初始化（避免重复执行）
  const isInitializedRef = useRef(false);

  // 清除 URL 中的 templateId 参数
  const clearTemplateIdFromUrl = useCallback(() => {
    const newSearchParams = new URLSearchParams(searchParams.toString());
    newSearchParams.delete(TEMPLATE_ID_PARAM);

    const newUrl = newSearchParams.toString()
      ? `${pathname}?${newSearchParams.toString()}`
      : pathname;

    router.replace(newUrl, { scroll: false });
  }, [searchParams, pathname, router]);

  // 初始化逻辑：检测 templateId 并获取模板数据
  useEffect(() => {
    // 只执行一次
    if (isInitializedRef.current) return;

    const templateId = searchParams.get(TEMPLATE_ID_PARAM);
    if (!templateId) return;

    // 标记已初始化
    isInitializedRef.current = true;

    // 异步获取模板数据并填充
    const initTemplate = async () => {
      try {
        const result = await fetchTemplateById({ avatarId: templateId });
        const templateData = extractQueryData(result);

        if (templateData) {
          setTemplateFromLibrary({
            aiavatarId: templateData.avatarId,
            avatarTemplateUrl: getResourcePrefixed(
              templateData.imageCompressPath
            ),
            avatarType: PhotoAvatarType.PUBLIC
          });
          suggestTemplateVoiceover(templateData.voiceoverId);
        } else {
          console.warn(
            `[useAiAvatarTemplateInit] Template not found: ${templateId}`
          );
        }
      } catch (error) {
        console.error(
          '[useAiAvatarTemplateInit] Failed to fetch template:',
          error
        );
      } finally {
        // 无论成功与否，都清除 URL 中的 templateId 参数
        clearTemplateIdFromUrl();
      }
    };

    void initTemplate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 只在首次挂载时执行
}
