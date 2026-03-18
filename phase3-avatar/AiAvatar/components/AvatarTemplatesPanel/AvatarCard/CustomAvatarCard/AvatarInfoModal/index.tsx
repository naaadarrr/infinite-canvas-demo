'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Download } from 'lucide-react';
import type { AiAvatarDTO } from '@/server/api/services/mediaLibrary/aiAvatar/type';
import { getResourcePrefixed } from '@/utils/path';
import { CommonVoiceoverSelect } from '@/app/board/[id]/components/ToolPanel/components/inputs/CommonVoiceoverSelect';
import { useUpdateAvatarVoiceMutation } from '@/app/board/[id]/components/ToolPanel/feature/Avatar/AiAvatar/data/mediaLibrary/useMutation';

export interface AvatarInfoModalProps {
  avatar: AiAvatarDTO;
  isOpen: boolean;
  onClose: () => void;
}

export function AvatarInfoModal({
  avatar,
  isOpen,
  onClose
}: AvatarInfoModalProps) {
  const { mutateAsync: updateAvatarVoice } = useUpdateAvatarVoiceMutation();
  const [voiceoverId, setVoiceoverId] = useState(
    avatar.voiceoverIdDefault || ''
  );

  useEffect(() => {
    setVoiceoverId(avatar.voiceoverIdDefault || '');
  }, [avatar.voiceoverIdDefault]);

  // 获取头像图片 URL
  const imageUrl =
    avatar.coverDefaultUrl ||
    (avatar.coverDefault ? getResourcePrefixed(avatar.coverDefault) : '');

  if (!isOpen) return null;

  const handleDownload = async () => {
    if (!imageUrl) return;
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `avatar-${avatar.aiavatarId}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      // Fallback: open in new tab
      window.open(imageUrl, '_blank');
    }
  };

  const handleVoiceChange = async (voiceId: string) => {
    setVoiceoverId(voiceId);
    try {
      await updateAvatarVoice({
        aiavatarUniqueId: avatar.aiavatarUniqueId,
        voiceoverIdDefault: voiceId
      });
    } catch (error) {
      console.error('Update avatar voice failed:', error);
    }
  };

  return createPortal(
    <div
      className='fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm'
      onClick={onClose}
    >
      <div
        className='relative w-full max-w-xl mx-4 bg-[#1e1e1e] rounded-2xl border border-white/10 shadow-2xl overflow-hidden'
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className='absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 text-white/70 hover:text-white hover:bg-black/70 transition-colors'
        >
          <X size={20} />
        </button>

        {/* Image Preview Section */}
        <div className='p-5'>
          <img
            src={imageUrl}
            alt={avatar.aiavatarName || 'My Avatar'}
            className='w-full object-contain max-h-[520px] rounded-lg'
          />
        </div>

        {/* Download Button */}
        <div className='px-5 flex justify-center'>
          <button
            onClick={handleDownload}
            className='flex items-center gap-2 px-6 py-2 rounded-lg bg-white/10 text-white/80 hover:bg-white/20 hover:text-white transition-colors'
          >
            <Download size={16} />
            <span className='text-sm'>Download</span>
          </button>
        </div>

        {/* Settings Panel */}
        <div className='p-5 pt-4'>
          <label className='text-sm text-white/60 mb-2 block'>
            Set Default Voiceover
          </label>
          <CommonVoiceoverSelect
            voiceoverId={voiceoverId}
            onVoiceoverChange={handleVoiceChange}
          />
        </div>
      </div>
    </div>,
    document.body
  );
}
