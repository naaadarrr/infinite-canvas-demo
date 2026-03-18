/**
 * DesignMyAvatar 模块对外暴露的 Hooks
 */

import { useRecoilCallback } from 'recoil-next';
import {
  designMyAvatarFormFamily,
  DEFAULT_DESIGN_MY_AVATAR_VALUES
} from '../store/atoms';
import { DesignMyAvatarFormValues } from '@/app/board/[id]/components/ToolPanel/feature/Avatar/DesignMyAvatar/type';

export function useDesignMyAvatarFormCleanup() {
  return useRecoilCallback(
    ({ reset }) =>
      (tabId: string) => {
        reset(designMyAvatarFormFamily(tabId));
      },
    []
  );
}

export function useDesignMyAvatarFormInitializer() {
  return useRecoilCallback(
    ({ set }) =>
      (tabId: string, initialValues?: Partial<DesignMyAvatarFormValues>) => {
        set(designMyAvatarFormFamily(tabId), {
          ...DEFAULT_DESIGN_MY_AVATAR_VALUES,
          ...initialValues
        });
      },
    []
  );
}
