'use client';

import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Download } from 'lucide-react';
import type { AiAvatarDTO } from '@/server/api/services/mediaLibrary/aiAvatar/type';
import { getResourcePrefixed } from '@/utils/path';
import { CommonVoiceoverSelect } from '@/app/board/[id]/components/ToolPanel/components/inputs/CommonVoiceoverSelect';
import { useUpdateAvatarVoiceMutation } from '@/app/board/[id]/components/ToolPanel/feature/Avatar/VideoLipSync/data/mediaLibrary/useMutations';

/**
 * 检查头像是否有预览视频
 */
function hasPreviewVideo(avatar: AiAvatarDTO): boolean {
  return !!avatar.previewVideoUrl || !!avatar.previewVideoS3Path;
}

/**
 * 获取预览视频 URL
 */
function getPreviewVideoUrl(avatar: AiAvatarDTO): string {
  if (avatar.previewVideoUrl) {
    return avatar.previewVideoUrl;
  }
  if (avatar.previewVideoS3Path) {
    return getResourcePrefixed(avatar.previewVideoS3Path);
  }
  return '';
}

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

  // 视频播放相关状态
  const videoRef = useRef<HTMLVideoElement>(null);
  const hasVideo = hasPreviewVideo(avatar);

  // 模态框打开时自动播放视频，关闭时重置
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isOpen) {
      // 模态框打开时自动播放
      const playPromise = video.play();
      // 处理可能被浏览器阻止的自动播放
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.warn('Autoplay prevented:', error);
        });
      }
    } else {
      // 模态框关闭时暂停并重置
      video.pause();
      video.currentTime = 0;
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDownload = async () => {
    let url = '';
    let filename = '';

    if (hasVideo) {
      // 优先下载视频
      url = getPreviewVideoUrl(avatar);
      filename = `avatar-${avatar.aiavatarId}.mp4`;
    } else if (imageUrl) {
      // 下载图片
      url = imageUrl;
      filename = `avatar-${avatar.aiavatarId}.png`;
    }

    if (!url) return;

    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Download failed:', error);
      // Fallback: open in new tab
      window.open(url, '_blank');
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

        {/* Media Preview Section */}
        <div className='p-5 relative'>
          {hasVideo ? (
            /* 视频播放器 - 自动播放，无控件 */
            <video
              ref={videoRef}
              src={getPreviewVideoUrl(avatar)}
              muted
              loop
              playsInline
              autoPlay
              className='w-full object-contain max-h-[520px] rounded-lg'
            />
          ) : (
            /* 图片展示 */
            <img
              src={imageUrl}
              alt={avatar.aiavatarName || 'My Avatar'}
              className='w-full object-contain max-h-[520px] rounded-lg'
            />
          )}
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
