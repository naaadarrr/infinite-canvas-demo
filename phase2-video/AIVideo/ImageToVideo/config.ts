// Image to Video 表单配置

export const imageToVideoConfig = {
  /** 宽高比选项 */
  aspectRatioOptions: [
    { value: '9:16', label: '9:16' },
    { value: '1:1', label: '1:1' },
    { value: '16:9', label: '16:9' },
    { value: '3:4', label: '3:4' },
    { value: '4:3', label: '4:3' }
  ],

  /** 默认宽高比 */
  defaultAspectRatio: '16:9',

  /** 分辨率选项 */
  resolutionOptions: [
    { value: '720p', label: '720p' },
    { value: '1080p', label: '1080p' }
  ],

  /** 默认分辨率 */
  defaultResolution: '720p',

  /** 默认时长 */
  defaultDuration: 5,

  /** 生成数量配置 */
  generationCount: {
    min: 1,
    max: 4,
    step: 1,
    defaultValue: 1
  }
} as const;
