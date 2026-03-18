'use client';
import React from 'react';
import dynamic from 'next/dynamic';

// 动态导入 DrawingCanvas 组件
const DrawingCanvas = dynamic(() => import('./DrawingCanvas'), { ssr: false });

interface MaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  imageUrl: string;
  maskImageUrl?: string;
  onSuccess: ({
    s3Path,
    coordinate
  }: {
    s3Path: string;
    coordinate: { x: number; y: number; w: number; h: number };
  }) => void;
}

function MaskEditor({
  isOpen,
  onClose,
  title,
  imageUrl,
  maskImageUrl,
  onSuccess
}: MaskModalProps) {
  return (
    <DrawingCanvas
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      imageUrl={imageUrl}
      maskImageUrl={maskImageUrl}
      onSuccess={onSuccess}
    />
  );
}

export default MaskEditor;
