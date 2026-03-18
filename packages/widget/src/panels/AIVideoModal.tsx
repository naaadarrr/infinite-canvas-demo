/**
 * AIVideoModal — stub placeholder.
 * Full implementation pending Phase 2 integration.
 */
import React from 'react';
import type { VideoToolTab, AIVideoState } from './AIVideoPanel';

export type { VideoToolTab, AIVideoState };

export type AIVideoTab = VideoToolTab;

export interface AIVideoSubmitData {
  actionId: string;
  tab: VideoToolTab;
  state: AIVideoState;
}

interface AIVideoModalProps {
  open: boolean;
  activeTab: AIVideoTab;
  onTabChange: (tab: AIVideoTab) => void;
  onClose: () => void;
  onSelectFromBoard: (context: string) => void;
  onSubmit: (data: AIVideoSubmitData) => void;
  credits?: number;
}

export function AIVideoModal({ open }: AIVideoModalProps) {
  if (!open) return null;
  return null;
}
