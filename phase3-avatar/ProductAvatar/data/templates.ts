// Product Avatar Templates 数据配置

import { ProductAvatarCategoryId } from '../type';

/** Product Avatar Template 分类 */
export interface ProductAvatarTemplateCategory {
  id: string;
  name: string;
  icon?: string;
}

/** 人种类型 */
export type EthnicityType =
  | 'black-african-american'
  | 'white-western-european'
  | 'white-eastern-european'
  | 'hispanic-latino'
  | 'middle-eastern-north-african'
  | 'east-asian'
  | 'southeast-asian'
  | 'south-asian';

/** 性别类型 */
export type GenderType = 'female' | 'male';

/** 排序类型 */
export type SortingType = 'popularity' | 'newest';

/** Product Avatar Template 条目 */
export interface ProductAvatarTemplateItem {
  id: string;
  categoryId: string;
  name: string;
  description?: string;
  /** 缩略图 URL */
  thumbnailUrl: string;
  /** 预览视频 URL */
  previewVideoUrl?: string;
  /** Avatar 照片 URL */
  avatarPhotoUrl: string;
  /** 产品图片 URL */
  productImageUrl?: string;
  /** 脚本内容 */
  scriptText?: string;
  /** 语音 ID */
  voiceId?: string;
  /** 模型 ID */
  modelId?: string;
  /** 其他参数 */
  parameters?: Record<string, unknown>;
  /** 瀑布流布局用 */
  width?: number;
  height?: number;
  /** 标签 */
  tags?: string[];
  /** 是否为 Premium（仅会员可用） */
  isPremium?: boolean;
  /** 是否为新模板 */
  isNew?: boolean;
  /** 人种 */
  ethnicity?: EthnicityType;
  /** 性别 */
  gender?: GenderType;
  /** 热度（用于排序） */
  popularity?: number;
}

/** 人种选项列表 */
export const ETHNICITY_OPTIONS: { value: EthnicityType; label: string }[] = [
  { value: 'black-african-american', label: 'Black or African American' },
  { value: 'white-western-european', label: 'White (Western European)' },
  { value: 'white-eastern-european', label: 'White (Eastern European)' },
  { value: 'hispanic-latino', label: 'Hispanic or Latino' },
  {
    value: 'middle-eastern-north-african',
    label: 'Middle Eastern or North African'
  },
  { value: 'east-asian', label: 'East Asian' },
  { value: 'southeast-asian', label: 'Southeast Asian' },
  { value: 'south-asian', label: 'South Asian' }
];

/** 性别选项列表 */
export const GENDER_OPTIONS: { value: GenderType; label: string }[] = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' }
];

/** Product Avatar Template 分类列表 */
export const PRODUCT_AVATAR_TEMPLATE_CATEGORIES: ProductAvatarTemplateCategory[] =
  [
    {
      id: ProductAvatarCategoryId.MY_PRODUCT_AVATAR,
      name: '👤 My Product Avatar'
    },
    { id: ProductAvatarCategoryId.ALL, name: 'All' },
    { id: 'electronics', name: '📱 Electronics' },
    { id: 'fashion', name: '👗 Fashion' },
    { id: 'beauty', name: '💄 Beauty' },
    { id: 'food', name: '🍔 Food & Beverage' },
    { id: 'home', name: '🏠 Home & Living' },
    { id: 'sports', name: '⚽ Sports' },
    { id: 'toys', name: '🧸 Toys & Games' },
    { id: 'automotive', name: '🚗 Automotive' }
  ];

/** Product Avatar Template 列表 */
export const PRODUCT_AVATAR_TEMPLATES: ProductAvatarTemplateItem[] = [
  // Electronics 分类
  {
    id: 'product-tpl-1',
    categoryId: 'electronics',
    name: 'Smartphone Showcase',
    description: 'Professional smartphone product presentation',
    thumbnailUrl: 'https://picsum.photos/seed/product-tpl-1/400/500',
    avatarPhotoUrl: 'https://picsum.photos/seed/product-avatar-1/512/512',
    productImageUrl: 'https://picsum.photos/seed/product-img-1/512/512',
    scriptText:
      'Introducing the latest smartphone with cutting-edge features. Let me show you what makes it special.',
    voiceId: 'violet',
    tags: ['electronics', 'smartphone', 'tech'],
    width: 400,
    height: 500,
    isNew: true,
    ethnicity: 'white-western-european',
    gender: 'female',
    popularity: 95
  },
  {
    id: 'product-tpl-2',
    categoryId: 'electronics',
    name: 'Laptop Review',
    description: 'In-depth laptop product review',
    thumbnailUrl: 'https://picsum.photos/seed/product-tpl-2/400/450',
    avatarPhotoUrl: 'https://picsum.photos/seed/product-avatar-2/512/512',
    productImageUrl: 'https://picsum.photos/seed/product-img-2/512/512',
    scriptText:
      "This laptop combines power and portability perfectly. Here's everything you need to know.",
    voiceId: 'adam',
    tags: ['electronics', 'laptop', 'review'],
    width: 400,
    height: 450,
    isPremium: true,
    ethnicity: 'east-asian',
    gender: 'male',
    popularity: 88
  },
  {
    id: 'product-tpl-3',
    categoryId: 'electronics',
    name: 'Headphones Demo',
    description: 'Premium headphones demonstration',
    thumbnailUrl: 'https://picsum.photos/seed/product-tpl-3/400/400',
    avatarPhotoUrl: 'https://picsum.photos/seed/product-avatar-3/512/512',
    productImageUrl: 'https://picsum.photos/seed/product-img-3/512/512',
    scriptText:
      'Experience audio like never before with these premium wireless headphones.',
    voiceId: 'emma',
    tags: ['electronics', 'headphones', 'audio'],
    width: 400,
    height: 400,
    isPremium: true,
    isNew: true,
    ethnicity: 'black-african-american',
    gender: 'female',
    popularity: 92
  },

  // Fashion 分类
  {
    id: 'product-tpl-4',
    categoryId: 'fashion',
    name: 'Fashion Collection',
    description: 'New fashion collection showcase',
    thumbnailUrl: 'https://picsum.photos/seed/product-tpl-4/400/550',
    avatarPhotoUrl: 'https://picsum.photos/seed/product-avatar-4/512/512',
    productImageUrl: 'https://picsum.photos/seed/product-img-4/512/512',
    scriptText:
      'Welcome to our new collection! These pieces are designed to make you stand out.',
    voiceId: 'sarah',
    tags: ['fashion', 'collection', 'style'],
    width: 400,
    height: 550,
    isNew: true,
    ethnicity: 'hispanic-latino',
    gender: 'female',
    popularity: 97
  },
  {
    id: 'product-tpl-5',
    categoryId: 'fashion',
    name: 'Sneaker Launch',
    description: 'Limited edition sneaker release',
    thumbnailUrl: 'https://picsum.photos/seed/product-tpl-5/400/500',
    avatarPhotoUrl: 'https://picsum.photos/seed/product-avatar-5/512/512',
    productImageUrl: 'https://picsum.photos/seed/product-img-5/512/512',
    scriptText:
      'Check out these limited edition sneakers! Only available for a short time.',
    voiceId: 'josh',
    tags: ['fashion', 'sneakers', 'limited'],
    width: 400,
    height: 500,
    isPremium: true,
    ethnicity: 'black-african-american',
    gender: 'male',
    popularity: 85
  },
  {
    id: 'product-tpl-6',
    categoryId: 'fashion',
    name: 'Watch Showcase',
    description: 'Luxury watch presentation',
    thumbnailUrl: 'https://picsum.photos/seed/product-tpl-6/400/350',
    avatarPhotoUrl: 'https://picsum.photos/seed/product-avatar-6/512/512',
    productImageUrl: 'https://picsum.photos/seed/product-img-6/512/512',
    scriptText:
      'This timepiece combines elegance with precision craftsmanship.',
    voiceId: 'lily',
    tags: ['fashion', 'watch', 'luxury'],
    width: 400,
    height: 350,
    isPremium: true,
    ethnicity: 'south-asian',
    gender: 'female',
    popularity: 78
  },

  // Beauty 分类
  {
    id: 'product-tpl-7',
    categoryId: 'beauty',
    name: 'Skincare Routine',
    description: 'Complete skincare product routine',
    thumbnailUrl: 'https://picsum.photos/seed/product-tpl-7/400/500',
    avatarPhotoUrl: 'https://picsum.photos/seed/product-avatar-7/512/512',
    productImageUrl: 'https://picsum.photos/seed/product-img-7/512/512',
    scriptText:
      'Transform your skincare routine with these amazing products. Your skin will thank you!',
    voiceId: 'emma',
    tags: ['beauty', 'skincare', 'routine'],
    width: 400,
    height: 500,
    isNew: true,
    ethnicity: 'southeast-asian',
    gender: 'female',
    popularity: 91
  },
  {
    id: 'product-tpl-8',
    categoryId: 'beauty',
    name: 'Makeup Tutorial',
    description: 'Professional makeup product tutorial',
    thumbnailUrl: 'https://picsum.photos/seed/product-tpl-8/400/450',
    avatarPhotoUrl: 'https://picsum.photos/seed/product-avatar-8/512/512',
    productImageUrl: 'https://picsum.photos/seed/product-img-8/512/512',
    scriptText:
      'Let me show you how to achieve this stunning look with our new makeup collection.',
    voiceId: 'violet',
    tags: ['beauty', 'makeup', 'tutorial'],
    width: 400,
    height: 450,
    isPremium: true,
    isNew: true,
    ethnicity: 'middle-eastern-north-african',
    gender: 'female',
    popularity: 89
  },
  {
    id: 'product-tpl-9',
    categoryId: 'beauty',
    name: 'Fragrance Launch',
    description: 'New fragrance introduction',
    thumbnailUrl: 'https://picsum.photos/seed/product-tpl-9/400/400',
    avatarPhotoUrl: 'https://picsum.photos/seed/product-avatar-9/512/512',
    productImageUrl: 'https://picsum.photos/seed/product-img-9/512/512',
    scriptText:
      'Introducing our signature fragrance. A scent that captures the essence of elegance.',
    voiceId: 'lily',
    tags: ['beauty', 'fragrance', 'perfume'],
    width: 400,
    height: 400
  },

  // Food & Beverage 分类
  {
    id: 'product-tpl-10',
    categoryId: 'food',
    name: 'Restaurant Special',
    description: 'Featured dish presentation',
    thumbnailUrl: 'https://picsum.photos/seed/product-tpl-10/400/550',
    avatarPhotoUrl: 'https://picsum.photos/seed/product-avatar-10/512/512',
    productImageUrl: 'https://picsum.photos/seed/product-img-10/512/512',
    scriptText:
      "Today's special is absolutely delicious! Let me tell you about the ingredients.",
    voiceId: 'sarah',
    tags: ['food', 'restaurant', 'special'],
    width: 400,
    height: 550
  },
  {
    id: 'product-tpl-11',
    categoryId: 'food',
    name: 'Coffee Brand',
    description: 'Premium coffee brand showcase',
    thumbnailUrl: 'https://picsum.photos/seed/product-tpl-11/400/500',
    avatarPhotoUrl: 'https://picsum.photos/seed/product-avatar-11/512/512',
    productImageUrl: 'https://picsum.photos/seed/product-img-11/512/512',
    scriptText:
      'Start your day with the perfect cup of coffee. Freshly roasted, perfectly brewed.',
    voiceId: 'adam',
    tags: ['food', 'coffee', 'beverage'],
    width: 400,
    height: 500
  },
  {
    id: 'product-tpl-12',
    categoryId: 'food',
    name: 'Snack Review',
    description: 'Delicious snack product review',
    thumbnailUrl: 'https://picsum.photos/seed/product-tpl-12/400/350',
    avatarPhotoUrl: 'https://picsum.photos/seed/product-avatar-12/512/512',
    productImageUrl: 'https://picsum.photos/seed/product-img-12/512/512',
    scriptText:
      'These snacks are absolutely addictive! Perfect for any occasion.',
    voiceId: 'josh',
    tags: ['food', 'snacks', 'review'],
    width: 400,
    height: 350
  },

  // Home & Living 分类
  {
    id: 'product-tpl-13',
    categoryId: 'home',
    name: 'Furniture Showcase',
    description: 'Modern furniture presentation',
    thumbnailUrl: 'https://picsum.photos/seed/product-tpl-13/400/500',
    avatarPhotoUrl: 'https://picsum.photos/seed/product-avatar-13/512/512',
    productImageUrl: 'https://picsum.photos/seed/product-img-13/512/512',
    scriptText:
      'Transform your living space with this beautifully designed furniture piece.',
    voiceId: 'emma',
    tags: ['home', 'furniture', 'design'],
    width: 400,
    height: 500
  },
  {
    id: 'product-tpl-14',
    categoryId: 'home',
    name: 'Smart Home Device',
    description: 'Smart home gadget demo',
    thumbnailUrl: 'https://picsum.photos/seed/product-tpl-14/400/450',
    avatarPhotoUrl: 'https://picsum.photos/seed/product-avatar-14/512/512',
    productImageUrl: 'https://picsum.photos/seed/product-img-14/512/512',
    scriptText:
      'Make your home smarter with this incredible device. Easy setup, powerful features.',
    voiceId: 'alex',
    tags: ['home', 'smart', 'gadget'],
    width: 400,
    height: 450
  },
  {
    id: 'product-tpl-15',
    categoryId: 'home',
    name: 'Kitchen Appliance',
    description: 'Kitchen appliance demonstration',
    thumbnailUrl: 'https://picsum.photos/seed/product-tpl-15/400/400',
    avatarPhotoUrl: 'https://picsum.photos/seed/product-avatar-15/512/512',
    productImageUrl: 'https://picsum.photos/seed/product-img-15/512/512',
    scriptText:
      'Cooking just got easier with this amazing kitchen appliance. Let me show you how it works.',
    voiceId: 'violet',
    tags: ['home', 'kitchen', 'appliance'],
    width: 400,
    height: 400
  },

  // Sports 分类
  {
    id: 'product-tpl-16',
    categoryId: 'sports',
    name: 'Running Shoes',
    description: 'Performance running shoes review',
    thumbnailUrl: 'https://picsum.photos/seed/product-tpl-16/400/550',
    avatarPhotoUrl: 'https://picsum.photos/seed/product-avatar-16/512/512',
    productImageUrl: 'https://picsum.photos/seed/product-img-16/512/512',
    scriptText:
      'These running shoes are designed for peak performance. Feel the difference with every step.',
    voiceId: 'josh',
    tags: ['sports', 'running', 'shoes'],
    width: 400,
    height: 550
  },
  {
    id: 'product-tpl-17',
    categoryId: 'sports',
    name: 'Fitness Equipment',
    description: 'Home fitness equipment showcase',
    thumbnailUrl: 'https://picsum.photos/seed/product-tpl-17/400/500',
    avatarPhotoUrl: 'https://picsum.photos/seed/product-avatar-17/512/512',
    productImageUrl: 'https://picsum.photos/seed/product-img-17/512/512',
    scriptText:
      'Get fit at home with this professional-grade fitness equipment.',
    voiceId: 'adam',
    tags: ['sports', 'fitness', 'equipment'],
    width: 400,
    height: 500
  },
  {
    id: 'product-tpl-18',
    categoryId: 'sports',
    name: 'Sports Gear',
    description: 'Professional sports gear review',
    thumbnailUrl: 'https://picsum.photos/seed/product-tpl-18/400/350',
    avatarPhotoUrl: 'https://picsum.photos/seed/product-avatar-18/512/512',
    productImageUrl: 'https://picsum.photos/seed/product-img-18/512/512',
    scriptText: 'Upgrade your game with this professional-grade sports gear.',
    voiceId: 'sarah',
    tags: ['sports', 'gear', 'professional'],
    width: 400,
    height: 350
  },

  // Toys & Games 分类
  {
    id: 'product-tpl-19',
    categoryId: 'toys',
    name: 'Educational Toy',
    description: 'Fun educational toy presentation',
    thumbnailUrl: 'https://picsum.photos/seed/product-tpl-19/400/500',
    avatarPhotoUrl: 'https://picsum.photos/seed/product-avatar-19/512/512',
    productImageUrl: 'https://picsum.photos/seed/product-img-19/512/512',
    scriptText:
      'Learning has never been this fun! This toy makes education an adventure.',
    voiceId: 'lily',
    tags: ['toys', 'educational', 'kids'],
    width: 400,
    height: 500
  },
  {
    id: 'product-tpl-20',
    categoryId: 'toys',
    name: 'Board Game',
    description: 'Family board game showcase',
    thumbnailUrl: 'https://picsum.photos/seed/product-tpl-20/400/450',
    avatarPhotoUrl: 'https://picsum.photos/seed/product-avatar-20/512/512',
    productImageUrl: 'https://picsum.photos/seed/product-img-20/512/512',
    scriptText:
      'Bring your family together with this exciting board game. Hours of fun guaranteed!',
    voiceId: 'emma',
    tags: ['toys', 'board game', 'family'],
    width: 400,
    height: 450
  },
  {
    id: 'product-tpl-21',
    categoryId: 'toys',
    name: 'Video Game',
    description: 'New video game release',
    thumbnailUrl: 'https://picsum.photos/seed/product-tpl-21/400/400',
    avatarPhotoUrl: 'https://picsum.photos/seed/product-avatar-21/512/512',
    productImageUrl: 'https://picsum.photos/seed/product-img-21/512/512',
    scriptText:
      'Get ready for the gaming experience of a lifetime with this new release!',
    voiceId: 'josh',
    tags: ['toys', 'video game', 'gaming'],
    width: 400,
    height: 400
  },

  // Automotive 分类
  {
    id: 'product-tpl-22',
    categoryId: 'automotive',
    name: 'Car Accessories',
    description: 'Premium car accessories showcase',
    thumbnailUrl: 'https://picsum.photos/seed/product-tpl-22/400/550',
    avatarPhotoUrl: 'https://picsum.photos/seed/product-avatar-22/512/512',
    productImageUrl: 'https://picsum.photos/seed/product-img-22/512/512',
    scriptText:
      'Upgrade your ride with these premium car accessories. Quality you can trust.',
    voiceId: 'adam',
    tags: ['automotive', 'accessories', 'car'],
    width: 400,
    height: 550
  },
  {
    id: 'product-tpl-23',
    categoryId: 'automotive',
    name: 'Car Care Products',
    description: 'Professional car care products',
    thumbnailUrl: 'https://picsum.photos/seed/product-tpl-23/400/500',
    avatarPhotoUrl: 'https://picsum.photos/seed/product-avatar-23/512/512',
    productImageUrl: 'https://picsum.photos/seed/product-img-23/512/512',
    scriptText:
      'Keep your car looking brand new with our professional-grade car care products.',
    voiceId: 'alex',
    tags: ['automotive', 'car care', 'cleaning'],
    width: 400,
    height: 500
  },
  {
    id: 'product-tpl-24',
    categoryId: 'automotive',
    name: 'Electric Vehicle',
    description: 'EV showcase and features',
    thumbnailUrl: 'https://picsum.photos/seed/product-tpl-24/400/350',
    avatarPhotoUrl: 'https://picsum.photos/seed/product-avatar-24/512/512',
    productImageUrl: 'https://picsum.photos/seed/product-img-24/512/512',
    scriptText:
      'Experience the future of driving with this incredible electric vehicle.',
    voiceId: 'violet',
    tags: ['automotive', 'electric', 'EV'],
    width: 400,
    height: 350,
    ethnicity: 'white-eastern-european',
    gender: 'male',
    popularity: 72
  },

  // ========== 批量生成的额外模板数据 ==========
  // Electronics 额外
  ...Array.from({ length: 10 }, (_, i) => ({
    id: `product-tpl-electronics-${i + 25}`,
    categoryId: 'electronics',
    name: `Tech Product ${i + 1}`,
    description: `Amazing tech product showcase #${i + 1}`,
    thumbnailUrl: `https://picsum.photos/seed/product-tpl-e${i + 25}/${350 + (i % 3) * 50}/${400 + (i % 4) * 50}`,
    avatarPhotoUrl: `https://picsum.photos/seed/product-avatar-e${i + 25}/512/512`,
    productImageUrl: `https://picsum.photos/seed/product-img-e${i + 25}/512/512`,
    scriptText: `Check out this amazing tech product! It's perfect for your daily needs.`,
    voiceId: ['violet', 'adam', 'emma', 'josh'][i % 4],
    tags: ['electronics', 'tech'],
    width: 350 + (i % 3) * 50,
    height: 400 + (i % 4) * 50,
    isPremium: i % 3 === 0,
    isNew: i % 5 === 0,
    ethnicity: (
      [
        'white-western-european',
        'east-asian',
        'black-african-american',
        'hispanic-latino',
        'south-asian',
        'southeast-asian',
        'middle-eastern-north-african',
        'white-eastern-european'
      ] as EthnicityType[]
    )[i % 8],
    gender: (['female', 'male'] as GenderType[])[i % 2],
    popularity: 60 + Math.floor(Math.random() * 35)
  })),

  // Fashion 额外
  ...Array.from({ length: 12 }, (_, i) => ({
    id: `product-tpl-fashion-${i + 35}`,
    categoryId: 'fashion',
    name: `Fashion Style ${i + 1}`,
    description: `Trendy fashion item showcase #${i + 1}`,
    thumbnailUrl: `https://picsum.photos/seed/product-tpl-f${i + 35}/${350 + (i % 3) * 50}/${450 + (i % 4) * 50}`,
    avatarPhotoUrl: `https://picsum.photos/seed/product-avatar-f${i + 35}/512/512`,
    productImageUrl: `https://picsum.photos/seed/product-img-f${i + 35}/512/512`,
    scriptText: `This fashion piece is absolutely stunning! Perfect for any occasion.`,
    voiceId: ['sarah', 'lily', 'emma', 'violet'][i % 4],
    tags: ['fashion', 'style'],
    width: 350 + (i % 3) * 50,
    height: 450 + (i % 4) * 50,
    isPremium: i % 4 === 0,
    isNew: i % 3 === 0,
    ethnicity: (
      [
        'hispanic-latino',
        'black-african-american',
        'white-western-european',
        'east-asian',
        'south-asian',
        'southeast-asian',
        'middle-eastern-north-african',
        'white-eastern-european'
      ] as EthnicityType[]
    )[i % 8],
    gender: (['female', 'male'] as GenderType[])[i % 2],
    popularity: 55 + Math.floor(Math.random() * 40)
  })),

  // Beauty 额外
  ...Array.from({ length: 10 }, (_, i) => ({
    id: `product-tpl-beauty-${i + 47}`,
    categoryId: 'beauty',
    name: `Beauty Product ${i + 1}`,
    description: `Premium beauty product showcase #${i + 1}`,
    thumbnailUrl: `https://picsum.photos/seed/product-tpl-b${i + 47}/${350 + (i % 3) * 50}/${400 + (i % 4) * 50}`,
    avatarPhotoUrl: `https://picsum.photos/seed/product-avatar-b${i + 47}/512/512`,
    productImageUrl: `https://picsum.photos/seed/product-img-b${i + 47}/512/512`,
    scriptText: `This beauty product will transform your routine! You'll love the results.`,
    voiceId: ['emma', 'violet', 'lily', 'sarah'][i % 4],
    tags: ['beauty', 'skincare'],
    width: 350 + (i % 3) * 50,
    height: 400 + (i % 4) * 50,
    isPremium: i % 2 === 0,
    isNew: i % 4 === 0,
    ethnicity: (
      [
        'southeast-asian',
        'middle-eastern-north-african',
        'white-western-european',
        'east-asian',
        'black-african-american',
        'hispanic-latino',
        'south-asian',
        'white-eastern-european'
      ] as EthnicityType[]
    )[i % 8],
    gender: (['female', 'male'] as GenderType[])[i % 2],
    popularity: 65 + Math.floor(Math.random() * 30)
  })),

  // Food 额外
  ...Array.from({ length: 8 }, (_, i) => ({
    id: `product-tpl-food-${i + 57}`,
    categoryId: 'food',
    name: `Delicious Food ${i + 1}`,
    description: `Tasty food product showcase #${i + 1}`,
    thumbnailUrl: `https://picsum.photos/seed/product-tpl-fd${i + 57}/${350 + (i % 3) * 50}/${400 + (i % 4) * 50}`,
    avatarPhotoUrl: `https://picsum.photos/seed/product-avatar-fd${i + 57}/512/512`,
    productImageUrl: `https://picsum.photos/seed/product-img-fd${i + 57}/512/512`,
    scriptText: `This food product is absolutely delicious! You have to try it.`,
    voiceId: ['sarah', 'adam', 'josh', 'emma'][i % 4],
    tags: ['food', 'delicious'],
    width: 350 + (i % 3) * 50,
    height: 400 + (i % 4) * 50,
    isPremium: i % 3 === 0,
    isNew: i % 2 === 0,
    ethnicity: (
      [
        'east-asian',
        'hispanic-latino',
        'white-western-european',
        'south-asian',
        'black-african-american',
        'southeast-asian',
        'middle-eastern-north-african',
        'white-eastern-european'
      ] as EthnicityType[]
    )[i % 8],
    gender: (['male', 'female'] as GenderType[])[i % 2],
    popularity: 50 + Math.floor(Math.random() * 45)
  })),

  // Home 额外
  ...Array.from({ length: 8 }, (_, i) => ({
    id: `product-tpl-home-${i + 65}`,
    categoryId: 'home',
    name: `Home Decor ${i + 1}`,
    description: `Beautiful home product showcase #${i + 1}`,
    thumbnailUrl: `https://picsum.photos/seed/product-tpl-h${i + 65}/${350 + (i % 3) * 50}/${400 + (i % 4) * 50}`,
    avatarPhotoUrl: `https://picsum.photos/seed/product-avatar-h${i + 65}/512/512`,
    productImageUrl: `https://picsum.photos/seed/product-img-h${i + 65}/512/512`,
    scriptText: `Transform your home with this amazing product! It's perfect for any space.`,
    voiceId: ['emma', 'alex', 'violet', 'lily'][i % 4],
    tags: ['home', 'decor'],
    width: 350 + (i % 3) * 50,
    height: 400 + (i % 4) * 50,
    isPremium: i % 4 === 0,
    isNew: i % 3 === 0,
    ethnicity: (
      [
        'white-western-european',
        'east-asian',
        'black-african-american',
        'hispanic-latino',
        'south-asian',
        'southeast-asian',
        'middle-eastern-north-african',
        'white-eastern-european'
      ] as EthnicityType[]
    )[i % 8],
    gender: (['female', 'male'] as GenderType[])[i % 2],
    popularity: 45 + Math.floor(Math.random() * 50)
  })),

  // Sports 额外
  ...Array.from({ length: 10 }, (_, i) => ({
    id: `product-tpl-sports-${i + 73}`,
    categoryId: 'sports',
    name: `Sports Gear ${i + 1}`,
    description: `Professional sports product showcase #${i + 1}`,
    thumbnailUrl: `https://picsum.photos/seed/product-tpl-s${i + 73}/${350 + (i % 3) * 50}/${450 + (i % 4) * 50}`,
    avatarPhotoUrl: `https://picsum.photos/seed/product-avatar-s${i + 73}/512/512`,
    productImageUrl: `https://picsum.photos/seed/product-img-s${i + 73}/512/512`,
    scriptText: `Take your game to the next level with this incredible sports product!`,
    voiceId: ['josh', 'adam', 'sarah', 'alex'][i % 4],
    tags: ['sports', 'fitness'],
    width: 350 + (i % 3) * 50,
    height: 450 + (i % 4) * 50,
    isPremium: i % 2 === 0,
    isNew: i % 5 === 0,
    ethnicity: (
      [
        'black-african-american',
        'white-western-european',
        'east-asian',
        'hispanic-latino',
        'south-asian',
        'southeast-asian',
        'middle-eastern-north-african',
        'white-eastern-european'
      ] as EthnicityType[]
    )[i % 8],
    gender: (['male', 'female'] as GenderType[])[i % 2],
    popularity: 55 + Math.floor(Math.random() * 40)
  })),

  // Toys 额外
  ...Array.from({ length: 8 }, (_, i) => ({
    id: `product-tpl-toys-${i + 83}`,
    categoryId: 'toys',
    name: `Fun Toy ${i + 1}`,
    description: `Exciting toy product showcase #${i + 1}`,
    thumbnailUrl: `https://picsum.photos/seed/product-tpl-t${i + 83}/${350 + (i % 3) * 50}/${400 + (i % 4) * 50}`,
    avatarPhotoUrl: `https://picsum.photos/seed/product-avatar-t${i + 83}/512/512`,
    productImageUrl: `https://picsum.photos/seed/product-img-t${i + 83}/512/512`,
    scriptText: `Kids will love this amazing toy! Hours of fun guaranteed.`,
    voiceId: ['lily', 'emma', 'sarah', 'violet'][i % 4],
    tags: ['toys', 'fun'],
    width: 350 + (i % 3) * 50,
    height: 400 + (i % 4) * 50,
    isPremium: i % 3 === 0,
    isNew: i % 2 === 0,
    ethnicity: (
      [
        'white-western-european',
        'east-asian',
        'black-african-american',
        'hispanic-latino',
        'south-asian',
        'southeast-asian',
        'middle-eastern-north-african',
        'white-eastern-european'
      ] as EthnicityType[]
    )[i % 8],
    gender: (['female', 'male'] as GenderType[])[i % 2],
    popularity: 40 + Math.floor(Math.random() * 55)
  })),

  // Automotive 额外
  ...Array.from({ length: 8 }, (_, i) => ({
    id: `product-tpl-auto-${i + 91}`,
    categoryId: 'automotive',
    name: `Auto Product ${i + 1}`,
    description: `Premium automotive product showcase #${i + 1}`,
    thumbnailUrl: `https://picsum.photos/seed/product-tpl-a${i + 91}/${350 + (i % 3) * 50}/${400 + (i % 4) * 50}`,
    avatarPhotoUrl: `https://picsum.photos/seed/product-avatar-a${i + 91}/512/512`,
    productImageUrl: `https://picsum.photos/seed/product-img-a${i + 91}/512/512`,
    scriptText: `Upgrade your vehicle with this fantastic automotive product!`,
    voiceId: ['adam', 'alex', 'josh', 'emma'][i % 4],
    tags: ['automotive', 'car'],
    width: 350 + (i % 3) * 50,
    height: 400 + (i % 4) * 50,
    isPremium: i % 2 === 0,
    isNew: i % 4 === 0,
    ethnicity: (
      [
        'white-eastern-european',
        'white-western-european',
        'east-asian',
        'black-african-american',
        'hispanic-latino',
        'south-asian',
        'southeast-asian',
        'middle-eastern-north-african'
      ] as EthnicityType[]
    )[i % 8],
    gender: (['male', 'female'] as GenderType[])[i % 2],
    popularity: 50 + Math.floor(Math.random() * 45)
  }))
];

/** 获取指定分类的模板 */
export const getProductAvatarTemplatesByCategory = (
  categoryId: string
): ProductAvatarTemplateItem[] => {
  if (categoryId === ProductAvatarCategoryId.ALL) {
    return PRODUCT_AVATAR_TEMPLATES;
  }
  return PRODUCT_AVATAR_TEMPLATES.filter(
    (item) => item.categoryId === categoryId
  );
};

/** 根据 ID 获取模板 */
export const getProductAvatarTemplateById = (
  templateId: string
): ProductAvatarTemplateItem | undefined => {
  return PRODUCT_AVATAR_TEMPLATES.find((item) => item.id === templateId);
};
