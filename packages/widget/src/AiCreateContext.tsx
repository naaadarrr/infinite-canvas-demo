import React from 'react';
import type { ImageToolTab, TextToImageState } from './panels/TextToImagePanel';
import type { VideoToolTab, AIVideoState } from './panels/AIVideoPanel';

export interface AiCreateState {
  type: 'ai-image' | 'ai-video' | 'ai-avatar' | 'ai-audio';
  subActionId: string;
  nodeId: string;
  prompt: string;
  referenceImageUrl?: string;
}

export interface AiCreateContextValue {
  aiCreateMode: AiCreateState | null;
  credits: number;
  onSubmit: (tab: ImageToolTab, state: TextToImageState, withWatermark: boolean) => void;
  onVideoSubmit: (tab: VideoToolTab, state: AIVideoState) => void;
  onDismiss: () => void;
  onUploadReference?: (nodeId: string) => void;
  onUploadFirstFrame?: (nodeId: string) => void;
  onUploadEndFrame?: (nodeId: string) => void;
  onUploadMedia?: (nodeId: string) => void;
  onSelectFromBoard?: (nodeId: string) => void;
  enterRemixMode?: (nodeId: string, imageUrl: string) => void;
}

const AiCreateContext = React.createContext<AiCreateContextValue>({
  aiCreateMode: null,
  credits: 0,
  onSubmit: () => {},
  onVideoSubmit: () => {},
  onDismiss: () => {},
});

export const AiCreateProvider = AiCreateContext.Provider;

export const useAiCreate = () => React.useContext(AiCreateContext);
