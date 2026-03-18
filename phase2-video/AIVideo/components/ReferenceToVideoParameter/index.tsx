// Reference to Video 参数组件
// 组合 MultiImagesUploadBase + MentionUploadedResources 形成业务组件

import { useRef, useEffect, useCallback } from 'react';
import {
  MentionUploadedResources,
  type MentionUploadedResourcesRef,
  type MentionUploadedResourcesProps
} from '@/app/board/[id]/components/ToolPanel/components/inputs/MentionUploadedResources';
import { MultiImagesUploadBase } from '@/app/board/[id]/components/ToolPanel/components/uploads/MultiImagesUploadBase';

/**
 * ReferenceToVideoParameter Props
 * 继承 MentionUploadedResources 的部分属性，并扩展业务特有属性
 */
export interface ReferenceToVideoParameterProps extends Pick<
  MentionUploadedResourcesProps,
  'placeholder' | 'value' | 'onChange' | 'images' | 'normalizeTag'
> {
  /** 图片上传区域标签 */
  label: string;
  /** 最大图片数量 */
  maxImages?: number;
  /** 更新图片列表 */
  setImages: (images: string[] | ((prev: string[]) => string[])) => void;
  // Video Edit 专用
  /** 上传的视频 URL */
  uploadedVideo?: string | null;
  /** 更新上传的视频 */
  setUploadedVideo?: (video: string | null) => void;
  /** 是否为 Video Edit 模式 */
  isVideoEdit?: boolean;
  /** 外部传入的 ref（用于 VideoEdit 的自动追加标签） */
  promptRef?: React.RefObject<HTMLDivElement>;
}

export function ReferenceToVideoParameter({
  label,
  placeholder,
  value,
  maxImages = 7,
  images,
  setImages,
  onChange,
  uploadedVideo,
  isVideoEdit = false,
  promptRef: promptRefProp,
  normalizeTag
}: ReferenceToVideoParameterProps) {
  const mentionRef = useRef<MentionUploadedResourcesRef>(null);

  // 计算 videos 数组（目前只支持单个视频）
  const videos = isVideoEdit && uploadedVideo ? [uploadedVideo] : [];

  // 处理图片添加 - 通知 MentionUploadedResources 追加标签
  const handleImageAdd = useCallback((index: number, url: string) => {
    // 使用 setTimeout 避免在 Recoil 更新函数中触发 DOM 操作导致的副作用
    setTimeout(() => {
      mentionRef.current?.appendImageTag(index, url);
    }, 0);
  }, []);

  // 处理图片删除 - 通知 MentionUploadedResources 移除标签并重编号
  const handleImageRemove = useCallback(
    (index: number) => {
      // 使用 setTimeout 确保在图片数组更新后再操作 DOM
      setTimeout(() => {
        mentionRef.current?.removeImageTagAndRenumber(index, images.length);
      }, 0);
    },
    [images.length]
  );

  // 处理图片列表变化（包装 setImages）
  const handleImagesChange = useCallback(
    (newImages: string[]) => {
      setImages(newImages);
    },
    [setImages]
  );

  // Video Edit 专用：视频上传/删除时自动添加/移除 @Video 标签
  useEffect(() => {
    const editor = mentionRef.current?.getEditorElement();
    if (!editor) return;

    // 如果不是 Video Edit 模式，清理所有 video tag
    if (!isVideoEdit) {
      const videoTags = editor.querySelectorAll('[data-image-tag^="@Video"]');
      if (videoTags.length > 0) {
        videoTags.forEach((tag) => tag.remove());
        // 触发 prompt 更新
        const event = new Event('input', { bubbles: true });
        editor.dispatchEvent(event);
      }
      return;
    }

    // Video Edit 模式下处理视频标签
    if (uploadedVideo) {
      // 检查 DOM 中是否已经存在 @Video 标签（避免重复添加）
      const existingVideoTag = editor.querySelector(
        '[data-image-tag^="@Video"]'
      );
      if (existingVideoTag) return;

      // 延迟添加标签，等待 DOM 更新
      const timer = setTimeout(() => {
        if (!isVideoEdit) return;
        const checkTag = editor.querySelector('[data-image-tag^="@Video"]');
        if (!checkTag) {
          mentionRef.current?.appendVideoTag(0, uploadedVideo);
        }
      }, 100);
      return () => clearTimeout(timer);
    } else {
      // 移除所有 @Video 标签
      const videoTags = editor.querySelectorAll('[data-image-tag^="@Video"]');
      if (videoTags.length > 0) {
        videoTags.forEach((tag) => tag.remove());
        // 触发 prompt 更新
        const event = new Event('input', { bubbles: true });
        editor.dispatchEvent(event);
      }
    }
  }, [uploadedVideo, isVideoEdit]);

  // 同步外部 ref（用于 VideoEdit 的自动追加标签）
  useEffect(() => {
    if (promptRefProp && mentionRef.current) {
      const editorElement = mentionRef.current.getEditorElement();
      if (editorElement) {
        // TypeScript workaround: 直接赋值 current
        (
          promptRefProp as React.MutableRefObject<HTMLDivElement | null>
        ).current = editorElement;
      }
    }
  }, [promptRefProp]);

  return (
    <div className='space-y-4'>
      {/* Reference Images - 使用 MultiImagesUploadBase */}
      <MultiImagesUploadBase
        indexEcho
        label={label}
        maxImages={maxImages}
        images={images}
        onImagesChange={handleImagesChange}
        onImageAdd={handleImageAdd}
        onImageRemove={handleImageRemove}
        showSelectFromBoard={true}
      />

      {/* Prompt with @ mention - 使用 MentionUploadedResources */}
      <MentionUploadedResources
        ref={mentionRef}
        label='Prompt'
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        images={images}
        videos={videos}
        maxLength={1500}
        charCountThreshold={1000}
        normalizeTag={normalizeTag}
      />
    </div>
  );
}
