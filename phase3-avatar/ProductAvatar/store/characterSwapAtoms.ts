/**
 * Image Character Swap Store
 * 用于存放 `queryImageCharacterSwap` 接口返回的结果数组
 */

import { atom } from 'recoil-next';
import type { ImageCharacterSwapTaskDetailResult } from '@/server/api/services/imageCharacterSwap/type';

export const imageCharacterSwapTaskListState = atom<
  ImageCharacterSwapTaskDetailResult[]
>({
  key: 'imageCharacterSwapTaskListState',
  default: []
});
