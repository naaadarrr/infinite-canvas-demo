const TOOL_LABELS: Record<string, string> = {
  'text-to-image': 'Text to Image',
  'image-edit': 'Image Edit',
  'inpaint': 'Inpaint',
  'image-character-swap': 'Character Swap',
  'image-face-swap': 'Face Swap',
  'image-upscale': 'Image Upscale',
  'photo-angle-editor': 'Photo Angle',
  'product-photography': 'Product Photo',
  'image-to-video': 'Image to Video',
  'text-to-video': 'Text to Video',
  'omni-reference': 'Omni Reference',
  'video-character-swap': 'Character Swap',
  'video-face-swap': 'Face Swap',
  'video-upscale': 'Video Upscale',
  'motion-control': 'Motion Control',
  'ai-avatar': 'AI Avatar',
  'video-lip-sync': 'Lip Sync',
  'product-avatar': 'Product Avatar',
  'design-avatar': 'Design Avatar',
  'voiceover': 'Voiceover',
  'ai-image': 'AI Image',
  'ai-video': 'AI Video',
  'ai-audio': 'AI Audio',
};

export function getToolLabel(toolId: string | undefined): string | undefined {
  if (!toolId) return undefined;
  return TOOL_LABELS[toolId];
}
