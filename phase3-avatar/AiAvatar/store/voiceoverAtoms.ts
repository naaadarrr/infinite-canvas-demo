'use client';

import { atomFamily } from 'recoil-next';

export interface AiAvatarVoiceoverUiState {
  /** 模板推荐的音色（待用户确认后才会应用） */
  pendingVoiceoverId?: string;
}

export const aiAvatarVoiceoverUiFamily = atomFamily<
  AiAvatarVoiceoverUiState,
  string
>({
  key: 'AiAvatarVoiceoverUi',
  default: {
    pendingVoiceoverId: undefined
  }
});
