// Video Avatar Templates 数据配置

/** Video Avatar Template 条目 */
export interface VideoAvatarTemplateItem {
  id: string;
  categoryId: string;
  name: string;
  description?: string;
  /** 缩略图 URL（视频首帧） */
  thumbnailUrl: string;
  /** 预览视频 URL */
  previewVideoUrl: string;
  /** 原视频 URL（用于 Lip Sync） */
  sourceVideoUrl: string;
  /** 脚本内容 */
  scriptText?: string;
  /** 语音 ID */
  voiceId?: string;
  /** 其他参数 */
  parameters?: Record<string, unknown>;
  /** 瀑布流布局用 */
  width?: number;
  height?: number;
  /** 视频时长（秒） */
  duration?: number;
  /** 标签 */
  tags?: string[];
  /** 是否为 Premium（仅会员可用） */
  isPremium?: boolean;
  /** 是否为新模板 */
  isNew?: boolean;
  /** 热度（用于排序） */
  popularity?: number;
}

/** Video Avatar Template 列表 */
export const VIDEO_AVATAR_TEMPLATES: VideoAvatarTemplateItem[] = [
  // Talking Head 分类
  {
    id: 'video-tpl-1',
    categoryId: 'talking-head',
    name: 'Professional Speaker',
    description: 'Clean professional talking head video',
    thumbnailUrl: 'https://picsum.photos/seed/video-tpl-1/270/480',
    previewVideoUrl:
      'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4',
    sourceVideoUrl:
      'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4',
    scriptText:
      "Welcome to our channel! Today I'm going to share something exciting with you.",
    voiceId: 'violet',
    tags: ['professional', 'clean', 'corporate'],
    width: 9,
    height: 16,
    duration: 15,
    popularity: 95
  },
  {
    id: 'video-tpl-2',
    categoryId: 'talking-head',
    name: 'Casual Vlogger',
    description: 'Relaxed casual vlog style',
    thumbnailUrl: 'https://picsum.photos/seed/video-tpl-2/270/480',
    previewVideoUrl:
      'https://test-videos.co.uk/vids/jellyfish/mp4/h264/360/Jellyfish_360_10s_1MB.mp4',
    sourceVideoUrl:
      'https://test-videos.co.uk/vids/jellyfish/mp4/h264/360/Jellyfish_360_10s_1MB.mp4',
    scriptText: 'Hey everyone! So today I wanted to talk about...',
    voiceId: 'adam',
    tags: ['casual', 'vlog', 'friendly'],
    width: 9,
    height: 16,
    duration: 12,
    popularity: 88
  },
  {
    id: 'video-tpl-3',
    categoryId: 'talking-head',
    name: 'Energetic Host',
    description: 'High energy presentation style',
    thumbnailUrl: 'https://picsum.photos/seed/video-tpl-3/270/480',
    previewVideoUrl:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    sourceVideoUrl:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    scriptText: "Let's GO! I'm so excited to show you this!",
    voiceId: 'josh',
    tags: ['energetic', 'fun', 'exciting'],
    width: 9,
    height: 16,
    duration: 10,
    isPremium: true,
    popularity: 92
  },

  // Presentation 分类
  {
    id: 'video-tpl-4',
    categoryId: 'presentation',
    name: 'Business Pitch',
    description: 'Professional business presentation',
    thumbnailUrl: 'https://picsum.photos/seed/video-tpl-4/270/480',
    previewVideoUrl:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    sourceVideoUrl:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    scriptText:
      'Our solution will revolutionize the way you work. Let me explain how.',
    voiceId: 'emma',
    tags: ['business', 'pitch', 'professional'],
    width: 9,
    height: 16,
    duration: 20,
    isPremium: true,
    popularity: 85
  },
  {
    id: 'video-tpl-5',
    categoryId: 'presentation',
    name: 'Product Demo',
    description: 'Product demonstration style',
    thumbnailUrl: 'https://picsum.photos/seed/video-tpl-5/400/600',
    previewVideoUrl:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
    sourceVideoUrl:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
    scriptText:
      'Let me walk you through the key features of this amazing product.',
    voiceId: 'sarah',
    tags: ['demo', 'product', 'walkthrough'],
    width: 400,
    height: 600,
    duration: 18,
    popularity: 90
  },

  // Interview 分类
  {
    id: 'video-tpl-6',
    categoryId: 'interview',
    name: 'Expert Interview',
    description: 'Professional interview setting',
    thumbnailUrl: 'https://picsum.photos/seed/video-tpl-6/400/550',
    previewVideoUrl:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    sourceVideoUrl:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    scriptText: "That's a great question. In my experience...",
    voiceId: 'alex',
    tags: ['interview', 'expert', 'professional'],
    width: 400,
    height: 550,
    duration: 25,
    popularity: 78
  },
  {
    id: 'video-tpl-7',
    categoryId: 'interview',
    name: 'Podcast Style',
    description: 'Casual podcast interview',
    thumbnailUrl: 'https://picsum.photos/seed/video-tpl-7/400/550',
    previewVideoUrl:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4',
    sourceVideoUrl:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4',
    scriptText: 'So tell me more about how you got started...',
    voiceId: 'lily',
    tags: ['podcast', 'casual', 'interview'],
    width: 400,
    height: 550,
    duration: 22,
    isPremium: true,
    popularity: 82
  },

  // Tutorial 分类
  {
    id: 'video-tpl-8',
    categoryId: 'tutorial',
    name: 'Step-by-Step Guide',
    description: 'Clear instructional tutorial',
    thumbnailUrl: 'https://picsum.photos/seed/video-tpl-8/400/720',
    previewVideoUrl:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    sourceVideoUrl:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    scriptText: "Step one: Let's start by setting up the basics...",
    voiceId: 'emma',
    tags: ['tutorial', 'guide', 'educational'],
    width: 400,
    height: 720,
    duration: 30,
    popularity: 91
  },
  {
    id: 'video-tpl-9',
    categoryId: 'tutorial',
    name: 'Quick Tips',
    description: 'Short helpful tips format',
    thumbnailUrl: 'https://picsum.photos/seed/video-tpl-9/400/720',
    previewVideoUrl:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/VolkswagenGTIReview.mp4',
    sourceVideoUrl:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/VolkswagenGTIReview.mp4',
    scriptText: "Here's a quick tip that will save you tons of time!",
    voiceId: 'violet',
    tags: ['tips', 'quick', 'helpful'],
    width: 400,
    height: 720,
    duration: 8,
    popularity: 87
  },

  // News 分类
  {
    id: 'video-tpl-10',
    categoryId: 'news',
    name: 'News Anchor',
    description: 'Professional news anchor style',
    thumbnailUrl: 'https://picsum.photos/seed/video-tpl-10/400/600',
    previewVideoUrl:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
    sourceVideoUrl:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
    scriptText: "Good evening. Tonight's top story...",
    voiceId: 'adam',
    tags: ['news', 'anchor', 'professional'],
    width: 400,
    height: 600,
    duration: 15,
    isPremium: true,
    popularity: 75
  },
  {
    id: 'video-tpl-11',
    categoryId: 'news',
    name: 'Breaking News',
    description: 'Urgent news announcement style',
    thumbnailUrl: 'https://picsum.photos/seed/video-tpl-11/400/600',
    previewVideoUrl:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4',
    sourceVideoUrl:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4',
    scriptText: 'Breaking news: We have just received word that...',
    voiceId: 'sarah',
    tags: ['breaking', 'news', 'urgent'],
    width: 400,
    height: 600,
    duration: 12,
    popularity: 70
  },

  // Storytelling 分类
  {
    id: 'video-tpl-12',
    categoryId: 'storytelling',
    name: 'Personal Story',
    description: 'Intimate storytelling format',
    thumbnailUrl: 'https://picsum.photos/seed/video-tpl-12/400/720',
    previewVideoUrl:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    sourceVideoUrl:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    scriptText: 'Let me tell you about the time when everything changed...',
    voiceId: 'lily',
    tags: ['story', 'personal', 'emotional'],
    width: 400,
    height: 720,
    duration: 20,
    popularity: 89
  },
  {
    id: 'video-tpl-13',
    categoryId: 'storytelling',
    name: 'Brand Story',
    description: 'Company brand storytelling',
    thumbnailUrl: 'https://picsum.photos/seed/video-tpl-13/400/720',
    previewVideoUrl:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    sourceVideoUrl:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    scriptText: 'Our journey began with a simple idea...',
    voiceId: 'alex',
    tags: ['brand', 'story', 'corporate'],
    width: 400,
    height: 720,
    duration: 25,
    isPremium: true,
    popularity: 83
  },

  // 批量生成更多模板
  ...Array.from({ length: 15 }, (_, i) => ({
    id: `video-tpl-extra-${i + 14}`,
    categoryId: [
      'talking-head',
      'presentation',
      'interview',
      'tutorial',
      'news',
      'storytelling'
    ][i % 6],
    name: `Video Template ${i + 14}`,
    description: `Professional video template #${i + 14}`,
    thumbnailUrl: `https://picsum.photos/seed/video-tpl-e${i + 14}/${350 + (i % 3) * 50}/${600 + (i % 3) * 60}`,
    previewVideoUrl:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    sourceVideoUrl:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    scriptText: 'This is a sample script for the video template.',
    voiceId: ['violet', 'adam', 'emma', 'josh', 'sarah', 'lily'][i % 6],
    tags: ['video', 'template'],
    width: 350 + (i % 3) * 50,
    height: 600 + (i % 3) * 60,
    duration: 10 + (i % 5) * 5,
    isPremium: i % 3 === 0,
    popularity: 50 + Math.floor(Math.random() * 45)
  }))
];
