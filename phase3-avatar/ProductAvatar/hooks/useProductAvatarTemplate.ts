/**
 * ProductAvatar 模板相关操作 Hook
 * 提供两种方式设置模板：从模板库选择或用户上传
 */

import { useRecoilCallback } from 'recoil-next';
import type { RESOURCE_SUBS_TYPE } from '@/types/benefit/resources';
import { activeTabIdState } from '@/app/board/[id]/components/ToolPanel/store';
import { productAvatarFormFamily } from '../store/atoms';

/**
 * 模板相关字段操作的 Hook
 * 提供两种方式设置模板：从模板库选择或用户上传
 */
export function useProductAvatarTemplate() {
  /**
   * 从模板库选择模板
   * 设置 avatarId、avatarTemplateUrl、templateMinSubsType，清空用户上传的模板字段
   */
  const setTemplateFromLibrary = useRecoilCallback(
    ({ set, snapshot }) =>
      (values: {
        avatarId: string;
        avatarTemplateUrl: string;
        templateMinSubsType?: RESOURCE_SUBS_TYPE;
      }) => {
        const tabId = snapshot.getLoadable(activeTabIdState).getValue()!;
        set(productAvatarFormFamily(tabId), (prev) => ({
          ...prev,
          avatarId: values.avatarId,
          avatarTemplateUrl: values.avatarTemplateUrl,
          templateMinSubsType: values.templateMinSubsType,
          // 清空用户上传的模板字段
          templateImageUrl: undefined,
          templateImagePath: undefined
        }));
      },
    []
  );

  /**
   * 从用户上传设置模板
   * 设置 templateImagePath 和 templateImageUrl，清空模板库相关字段
   */
  const setTemplateFromUpload = useRecoilCallback(
    ({ set, snapshot }) =>
      (values: { templateImagePath: string; templateImageUrl: string }) => {
        const tabId = snapshot.getLoadable(activeTabIdState).getValue()!;
        set(productAvatarFormFamily(tabId), (prev) => ({
          ...prev,
          templateImagePath: values.templateImagePath,
          templateImageUrl: values.templateImageUrl,
          // 清空模板库相关字段
          avatarId: undefined,
          avatarTemplateUrl: undefined,
          templateMinSubsType: undefined
        }));
      },
    []
  );

  /**
   * 清空模板
   * 清空所有模板相关字段（包括模板库和用户上传的）
   */
  const clearTemplate = useRecoilCallback(
    ({ set, snapshot }) =>
      () => {
        const tabId = snapshot.getLoadable(activeTabIdState).getValue()!;
        set(productAvatarFormFamily(tabId), (prev) => ({
          ...prev,
          // 清空模板库相关字段
          avatarId: undefined,
          avatarTemplateUrl: undefined,
          templateMinSubsType: undefined,
          // 清空用户上传的模板字段
          templateImageUrl: undefined,
          templateImagePath: undefined
        }));
      },
    []
  );

  return {
    setTemplateFromLibrary,
    setTemplateFromUpload,
    clearTemplate
  };
}
