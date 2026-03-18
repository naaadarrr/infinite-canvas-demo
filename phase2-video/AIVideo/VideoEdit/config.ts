// Video Edit 表单配置

export const videoEditConfig = {
  /** 视频编辑模式选项 */
  videoEditModeOptions: [
    { value: 'edit', label: 'Edit the original video' },
    { value: 'reference', label: 'Original video for reference only' }
  ],

  /** 默认编辑模式 */
  defaultVideoEditMode: 'edit',

  /** 分辨率选项 */
  resolutionOptions: [{ value: '1080p', label: '1080p' }],

  /** 默认分辨率 */
  defaultResolution: '1080p',

  /** 生成数量配置 */
  generatingCount: {
    min: 1,
    max: 4,
    step: 1,
    defaultValue: 1
  }
} as const;
