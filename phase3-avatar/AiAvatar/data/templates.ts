// Avatar 4 Templates 数据配置

import { PhotoAvatarVideoMode } from '@/server/api/services/avatar4/type';
import type { AiAvatarDTO } from '@/server/api/services/mediaLibrary/aiAvatar/type';

/** Avatar Template 分类 */
export interface AvatarTemplateCategory {
  id: string;
  name: string;
  icon?: string;
}

/** Avatar Template 条目 - 基于 AiAvatarDTO 扩展 */
export interface AvatarTemplateItem extends AiAvatarDTO {
  /** 模板 ID（用于模板数据） */
  avatarId?: string;
  /** 模板名称（用于模板数据） */
  avatarName?: string;
  /** 分类 ID */
  categoryId: string;
  /** 描述 */
  description?: string;
  /** 缩略图 URL */
  thumbnailUrl: string;
  /** 预览视频 URL */
  previewVideoUrl?: string;
  /** 封面图片 URL */
  coverImage?: string;
  /** TTS 文本内容 */
  ttsText?: string;
  /** 语音 ID */
  voiceoverId?: string;
  /** 模式 */
  mode?: PhotoAvatarVideoMode;
  /** 其他参数 */
  parameters?: Record<string, unknown>;
  /** 瀑布流布局用 */
  width?: number;
  height?: number;
  /** 标签 */
  tags?: string[];
  /** 模板名称（兼容字段，优先使用 avatarName） */
  name?: string;
}

/** Avatar Template 分类列表 */
export const AVATAR_TEMPLATE_CATEGORIES: AvatarTemplateCategory[] = [
  { id: 'my-avatar', name: '👤 My Avatar' },
  { id: 'all', name: 'All' },
  { id: 'business', name: '💼 Business' },
  { id: 'marketing', name: '📢 Marketing' },
  { id: 'education', name: '📚 Education' },
  { id: 'entertainment', name: '🎉 Entertainment' },
  { id: 'ecommerce', name: '🛒 E-commerce' },
  { id: 'lifestyle', name: '🌿 Lifestyle' },
  { id: 'technology', name: '💻 Technology' },
  { id: 'healthcare', name: '🏥 Healthcare' }
];

/** Avatar Template 列表 */
export const AVATAR_TEMPLATES: AvatarTemplateItem[] = [
  // Business 分类
  {
    avatarId: 'avatar-tpl-1',
    categoryId: 'business',
    avatarName: 'Professional Pitch',
    description: 'Professional business pitch presentation',
    thumbnailUrl: 'https://picsum.photos/seed/avatar-tpl-1/400/500',
    previewVideoUrl:
      'https://static.heygen.ai/heygen/asset/avatar4_demo_video.mp4',
    coverImage: 'https://picsum.photos/seed/avatar-tpl-1/512/512',
    ttsText:
      "Welcome to our company presentation. Today, I'm excited to share our latest innovations with you.",
    voiceoverId: 'violet',
    mode: PhotoAvatarVideoMode.AVATAR_4,
    tags: ['business', 'pitch', 'professional'],
    width: 400,
    height: 500
  },
  {
    avatarId: 'avatar-tpl-2',
    categoryId: 'business',
    avatarName: 'Corporate Introduction',
    description: 'Formal corporate video introduction',
    thumbnailUrl: 'https://picsum.photos/seed/avatar-tpl-2/400/450',
    coverImage: 'https://picsum.photos/seed/avatar-tpl-2/512/512',
    ttsText:
      "Good morning. I'm here to introduce our company's mission and values that drive everything we do.",
    voiceoverId: 'adam',
    mode: PhotoAvatarVideoMode.AVATAR_4,
    tags: ['corporate', 'introduction', 'formal'],
    width: 400,
    height: 450
  },
  {
    avatarId: 'avatar-tpl-3',
    categoryId: 'business',
    avatarName: 'Meeting Opener',
    description: 'Opening statement for virtual meetings',
    thumbnailUrl: 'https://picsum.photos/seed/avatar-tpl-3/400/400',
    coverImage: 'https://picsum.photos/seed/avatar-tpl-3/512/512',
    ttsText:
      "Thank you for joining today's meeting. Let's get started with our agenda.",
    voiceoverId: 'emma',
    mode: PhotoAvatarVideoMode.AVATAR_4,
    tags: ['meeting', 'opener', 'virtual'],
    width: 400,
    height: 400
  },

  // Marketing 分类
  {
    avatarId: 'avatar-tpl-4',
    categoryId: 'marketing',
    avatarName: 'Product Launch',
    description: 'Exciting product launch announcement',
    thumbnailUrl: 'https://picsum.photos/seed/avatar-tpl-4/400/550',
    previewVideoUrl:
      'https://static.heygen.ai/heygen/asset/avatar4_fast_demo_video.mp4',
    coverImage: 'https://picsum.photos/seed/avatar-tpl-4/512/512',
    ttsText:
      'Introducing our revolutionary new product! This is going to change the way you work.',
    voiceoverId: 'josh',
    mode: PhotoAvatarVideoMode.AVATAR_4,
    tags: ['product', 'launch', 'marketing'],
    width: 400,
    height: 550
  },
  {
    avatarId: 'avatar-tpl-5',
    categoryId: 'marketing',
    avatarName: 'Social Ad Script',
    description: 'Short social media advertisement',
    thumbnailUrl: 'https://picsum.photos/seed/avatar-tpl-5/400/500',
    coverImage: 'https://picsum.photos/seed/avatar-tpl-5/512/512',
    ttsText:
      "Hey! Are you tired of complicated solutions? Try our app today - it's simple, fast, and free!",
    voiceoverId: 'sarah',
    mode: PhotoAvatarVideoMode.AVATAR_4_FAST,
    tags: ['social', 'ad', 'short'],
    width: 400,
    height: 500
  },
  {
    avatarId: 'avatar-tpl-6',
    categoryId: 'marketing',
    avatarName: 'Brand Story',
    description: 'Emotional brand storytelling video',
    thumbnailUrl: 'https://picsum.photos/seed/avatar-tpl-6/400/350',
    coverImage: 'https://picsum.photos/seed/avatar-tpl-6/512/512',
    ttsText:
      'Every great brand has a story. Ours began with a simple idea: making life easier for everyone.',
    voiceoverId: 'lily',
    mode: PhotoAvatarVideoMode.AVATAR_4,
    tags: ['brand', 'story', 'emotional'],
    width: 400,
    height: 350
  },

  // Education 分类
  {
    avatarId: 'avatar-tpl-7',
    categoryId: 'education',
    avatarName: 'Course Introduction',
    description: 'Welcome video for online courses',
    thumbnailUrl: 'https://picsum.photos/seed/avatar-tpl-7/400/500',
    coverImage: 'https://picsum.photos/seed/avatar-tpl-7/512/512',
    ttsText:
      "Welcome to this course! I'm excited to guide you through this learning journey. Let's begin!",
    voiceoverId: 'emma',
    mode: PhotoAvatarVideoMode.AVATAR_4,
    tags: ['course', 'education', 'learning'],
    width: 400,
    height: 500
  },
  {
    avatarId: 'avatar-tpl-8',
    categoryId: 'education',
    avatarName: 'Tutorial Guide',
    description: 'Step-by-step tutorial explanation',
    thumbnailUrl: 'https://picsum.photos/seed/avatar-tpl-8/400/450',
    coverImage: 'https://picsum.photos/seed/avatar-tpl-8/512/512',
    ttsText:
      "In this tutorial, I'll show you how to complete this task step by step. Follow along with me!",
    voiceoverId: 'alex',
    mode: PhotoAvatarVideoMode.AVATAR_4,
    tags: ['tutorial', 'guide', 'step-by-step'],
    width: 400,
    height: 450
  },
  {
    avatarId: 'avatar-tpl-9',
    categoryId: 'education',
    avatarName: 'Quiz Introduction',
    description: 'Introduction to a quiz or assessment',
    thumbnailUrl: 'https://picsum.photos/seed/avatar-tpl-9/400/400',
    coverImage: 'https://picsum.photos/seed/avatar-tpl-9/512/512',
    ttsText:
      "It's time to test what you've learned! This quiz will help reinforce your understanding.",
    voiceoverId: 'violet',
    mode: PhotoAvatarVideoMode.AVATAR_4_FAST,
    tags: ['quiz', 'assessment', 'test'],
    width: 400,
    height: 400
  },

  // Entertainment 分类
  {
    avatarId: 'avatar-tpl-10',
    categoryId: 'entertainment',
    avatarName: 'Fun Greeting',
    description: 'Casual and fun greeting message',
    thumbnailUrl: 'https://picsum.photos/seed/avatar-tpl-10/400/550',
    coverImage: 'https://picsum.photos/seed/avatar-tpl-10/512/512',
    ttsText:
      "Hey there! Hope you're having an amazing day. Just wanted to send some positive vibes your way!",
    voiceoverId: 'sarah',
    mode: PhotoAvatarVideoMode.AVATAR_4,
    tags: ['fun', 'greeting', 'casual'],
    width: 400,
    height: 550
  },
  {
    avatarId: 'avatar-tpl-11',
    categoryId: 'entertainment',
    avatarName: 'Birthday Wish',
    description: 'Special birthday greeting video',
    thumbnailUrl: 'https://picsum.photos/seed/avatar-tpl-11/400/500',
    coverImage: 'https://picsum.photos/seed/avatar-tpl-11/512/512',
    ttsText:
      'Happy Birthday! May your special day be filled with joy, laughter, and wonderful memories!',
    voiceoverId: 'lily',
    mode: PhotoAvatarVideoMode.AVATAR_4,
    tags: ['birthday', 'celebration', 'greeting'],
    width: 400,
    height: 500
  },
  {
    avatarId: 'avatar-tpl-12',
    categoryId: 'entertainment',
    avatarName: 'Holiday Message',
    description: 'Festive holiday greeting',
    thumbnailUrl: 'https://picsum.photos/seed/avatar-tpl-12/400/350',
    coverImage: 'https://picsum.photos/seed/avatar-tpl-12/512/512',
    ttsText:
      'Happy holidays! Wishing you and your loved ones a season filled with warmth and happiness.',
    voiceoverId: 'adam',
    mode: PhotoAvatarVideoMode.AVATAR_4,
    tags: ['holiday', 'festive', 'celebration'],
    width: 400,
    height: 350
  },

  // E-commerce 分类
  {
    avatarId: 'avatar-tpl-13',
    categoryId: 'ecommerce',
    avatarName: 'Product Review',
    description: 'Honest product review and recommendation',
    thumbnailUrl: 'https://picsum.photos/seed/avatar-tpl-13/400/500',
    coverImage: 'https://picsum.photos/seed/avatar-tpl-13/512/512',
    ttsText:
      "I've been using this product for a month now, and I'm impressed! Here's my honest review.",
    voiceoverId: 'josh',
    mode: PhotoAvatarVideoMode.AVATAR_4,
    tags: ['review', 'product', 'recommendation'],
    width: 400,
    height: 500
  },
  {
    avatarId: 'avatar-tpl-14',
    categoryId: 'ecommerce',
    avatarName: 'Flash Sale Alert',
    description: 'Urgent flash sale announcement',
    thumbnailUrl: 'https://picsum.photos/seed/avatar-tpl-14/400/450',
    coverImage: 'https://picsum.photos/seed/avatar-tpl-14/512/512',
    ttsText:
      "Flash sale alert! For the next 24 hours only, get 50% off on all items. Don't miss out!",
    voiceoverId: 'sarah',
    mode: PhotoAvatarVideoMode.AVATAR_4_FAST,
    tags: ['sale', 'flash', 'discount'],
    width: 400,
    height: 450
  },
  {
    avatarId: 'avatar-tpl-15',
    categoryId: 'ecommerce',
    avatarName: 'Unboxing Video',
    description: 'Exciting product unboxing experience',
    thumbnailUrl: 'https://picsum.photos/seed/avatar-tpl-15/400/400',
    coverImage: 'https://picsum.photos/seed/avatar-tpl-15/512/512',
    ttsText:
      "Let's unbox this together! I can't wait to show you what's inside this package.",
    voiceoverId: 'violet',
    mode: PhotoAvatarVideoMode.AVATAR_4,
    tags: ['unboxing', 'product', 'experience'],
    width: 400,
    height: 400
  },

  // Lifestyle 分类
  {
    avatarId: 'avatar-tpl-16',
    categoryId: 'lifestyle',
    avatarName: 'Morning Motivation',
    description: 'Motivational morning message',
    thumbnailUrl: 'https://picsum.photos/seed/avatar-tpl-16/400/550',
    coverImage: 'https://picsum.photos/seed/avatar-tpl-16/512/512',
    ttsText:
      "Good morning! Today is a new opportunity to make your dreams come true. Let's make it count!",
    voiceoverId: 'emma',
    mode: PhotoAvatarVideoMode.AVATAR_4,
    tags: ['motivation', 'morning', 'inspiration'],
    width: 400,
    height: 550
  },
  {
    avatarId: 'avatar-tpl-17',
    categoryId: 'lifestyle',
    avatarName: 'Wellness Tips',
    description: 'Health and wellness advice',
    thumbnailUrl: 'https://picsum.photos/seed/avatar-tpl-17/400/500',
    coverImage: 'https://picsum.photos/seed/avatar-tpl-17/512/512',
    ttsText:
      'Taking care of yourself is important. Here are some simple tips to improve your daily wellness.',
    voiceoverId: 'lily',
    mode: PhotoAvatarVideoMode.AVATAR_4,
    tags: ['wellness', 'health', 'tips'],
    width: 400,
    height: 500
  },
  {
    avatarId: 'avatar-tpl-18',
    categoryId: 'lifestyle',
    avatarName: 'Travel Vlog Intro',
    description: 'Travel vlog introduction',
    thumbnailUrl: 'https://picsum.photos/seed/avatar-tpl-18/400/350',
    coverImage: 'https://picsum.photos/seed/avatar-tpl-18/512/512',
    ttsText:
      "Welcome to my travel vlog! Today I'm exploring this amazing destination. Come along with me!",
    voiceoverId: 'alex',
    mode: PhotoAvatarVideoMode.AVATAR_4,
    tags: ['travel', 'vlog', 'adventure'],
    width: 400,
    height: 350
  },

  // Technology 分类
  {
    avatarId: 'avatar-tpl-19',
    categoryId: 'technology',
    avatarName: 'Tech News Update',
    description: 'Latest technology news briefing',
    thumbnailUrl: 'https://picsum.photos/seed/avatar-tpl-19/400/500',
    coverImage: 'https://picsum.photos/seed/avatar-tpl-19/512/512',
    ttsText:
      "Here's your tech news update. Some exciting developments in the AI world this week!",
    voiceoverId: 'josh',
    mode: PhotoAvatarVideoMode.AVATAR_4,
    tags: ['tech', 'news', 'AI'],
    width: 400,
    height: 500
  },
  {
    avatarId: 'avatar-tpl-20',
    categoryId: 'technology',
    avatarName: 'App Demo',
    description: 'Mobile app demonstration',
    thumbnailUrl: 'https://picsum.photos/seed/avatar-tpl-20/400/450',
    coverImage: 'https://picsum.photos/seed/avatar-tpl-20/512/512',
    ttsText:
      "Let me show you how this app works. It's designed to be intuitive and user-friendly.",
    voiceoverId: 'adam',
    mode: PhotoAvatarVideoMode.AVATAR_4,
    tags: ['app', 'demo', 'mobile'],
    width: 400,
    height: 450
  },
  {
    avatarId: 'avatar-tpl-21',
    categoryId: 'technology',
    avatarName: 'Software Tutorial',
    description: 'Software feature walkthrough',
    thumbnailUrl: 'https://picsum.photos/seed/avatar-tpl-21/400/400',
    coverImage: 'https://picsum.photos/seed/avatar-tpl-21/512/512',
    ttsText:
      "In this tutorial, I'll walk you through the key features of this software. Let's dive in!",
    voiceoverId: 'emma',
    mode: PhotoAvatarVideoMode.AVATAR_4,
    tags: ['software', 'tutorial', 'walkthrough'],
    width: 400,
    height: 400
  },

  // Healthcare 分类
  {
    avatarId: 'avatar-tpl-22',
    categoryId: 'healthcare',
    avatarName: 'Health Reminder',
    description: 'Friendly health reminder message',
    thumbnailUrl: 'https://picsum.photos/seed/avatar-tpl-22/400/550',
    coverImage: 'https://picsum.photos/seed/avatar-tpl-22/512/512',
    ttsText:
      "Don't forget to stay hydrated and take short breaks throughout your day. Your health matters!",
    voiceoverId: 'lily',
    mode: PhotoAvatarVideoMode.AVATAR_4,
    tags: ['health', 'reminder', 'wellness'],
    width: 400,
    height: 550
  },
  {
    avatarId: 'avatar-tpl-23',
    categoryId: 'healthcare',
    avatarName: 'Medical Info',
    description: 'Clear medical information delivery',
    thumbnailUrl: 'https://picsum.photos/seed/avatar-tpl-23/400/500',
    coverImage: 'https://picsum.photos/seed/avatar-tpl-23/512/512',
    ttsText:
      'Understanding your health is important. Let me explain this medical information in simple terms.',
    voiceoverId: 'alex',
    mode: PhotoAvatarVideoMode.AVATAR_4,
    tags: ['medical', 'information', 'healthcare'],
    width: 400,
    height: 500
  },
  {
    avatarId: 'avatar-tpl-24',
    categoryId: 'healthcare',
    avatarName: 'Appointment Reminder',
    description: 'Healthcare appointment reminder',
    thumbnailUrl: 'https://picsum.photos/seed/avatar-tpl-24/400/350',
    coverImage: 'https://picsum.photos/seed/avatar-tpl-24/512/512',
    ttsText:
      'This is a friendly reminder about your upcoming appointment. We look forward to seeing you!',
    voiceoverId: 'violet',
    mode: PhotoAvatarVideoMode.AVATAR_4_FAST,
    tags: ['appointment', 'reminder', 'healthcare'],
    width: 400,
    height: 350
  }
];

/** 获取指定分类的模板 */
export const getTemplatesByCategory = (
  categoryId: string
): AvatarTemplateItem[] => {
  if (categoryId === 'all') {
    return AVATAR_TEMPLATES;
  }
  return AVATAR_TEMPLATES.filter((item) => item.categoryId === categoryId);
};

/** 根据 ID 获取模板 */
export const getTemplateById = (
  templateId: string
): AvatarTemplateItem | undefined => {
  return AVATAR_TEMPLATES.find((item) => item.avatarId === templateId);
};
