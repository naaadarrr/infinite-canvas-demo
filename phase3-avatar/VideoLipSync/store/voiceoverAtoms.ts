'use client';

import { atomFamily } from 'recoil-next';

export interface VideoLipSyncVoiceoverUiState {
  /** 模板推荐的音色（待用户确认后才会应用） */
  pendingVoiceoverId?: string;
}

export const videoLipSyncVoiceoverUiFamily = atomFamily<
  VideoLipSyncVoiceoverUiState,
  string
>({
  key: 'VideoLipSyncVoiceoverUi',
  default: {
    pendingVoiceoverId: undefined
  }
});
