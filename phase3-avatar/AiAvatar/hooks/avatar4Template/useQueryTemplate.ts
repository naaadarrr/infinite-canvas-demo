'use client';

import { COMMON_INT_BOOLEAN } from '@/server/api/services/_common/type';

const STATIC_AVATARS = [
  { avatarId: 'a1', imageCompressPath: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&q=80', imageS3Path: '', voiceoverId: 'violet', isFavorite: COMMON_INT_BOOLEAN.FALSE },
  { avatarId: 'a2', imageCompressPath: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80', imageS3Path: '', voiceoverId: 'adam', isFavorite: COMMON_INT_BOOLEAN.FALSE },
  { avatarId: 'a3', imageCompressPath: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80', imageS3Path: '', voiceoverId: 'emma', isFavorite: COMMON_INT_BOOLEAN.FALSE },
  { avatarId: 'a4', imageCompressPath: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80', imageS3Path: '', voiceoverId: 'josh', isFavorite: COMMON_INT_BOOLEAN.FALSE },
  { avatarId: 'a5', imageCompressPath: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&q=80', imageS3Path: '', voiceoverId: 'sarah', isFavorite: COMMON_INT_BOOLEAN.FALSE },
  { avatarId: 'a6', imageCompressPath: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80', imageS3Path: '', voiceoverId: 'alex', isFavorite: COMMON_INT_BOOLEAN.FALSE },
  { avatarId: 'a7', imageCompressPath: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80', imageS3Path: '', voiceoverId: 'lily', isFavorite: COMMON_INT_BOOLEAN.FALSE },
  { avatarId: 'a8', imageCompressPath: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&q=80', imageS3Path: '', voiceoverId: 'violet', isFavorite: COMMON_INT_BOOLEAN.FALSE },
  { avatarId: 'a9', imageCompressPath: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=80', imageS3Path: '', voiceoverId: 'emma', isFavorite: COMMON_INT_BOOLEAN.FALSE },
  { avatarId: 'a10', imageCompressPath: 'https://images.unsplash.com/photo-1552374196-c4e7ffc6e126?w=400&q=80', imageS3Path: '', voiceoverId: 'adam', isFavorite: COMMON_INT_BOOLEAN.FALSE },
  { avatarId: 'a11', imageCompressPath: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&q=80', imageS3Path: '', voiceoverId: 'sarah', isFavorite: COMMON_INT_BOOLEAN.FALSE },
  { avatarId: 'a12', imageCompressPath: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&q=80', imageS3Path: '', voiceoverId: 'josh', isFavorite: COMMON_INT_BOOLEAN.FALSE },
];

export function useQueryAvatar4Template(options?: {
  avatarId?: string;
  categories?: string;
  sortField?: string;
  sortType?: string;
  pageSize?: number;
}) {
  return {
    templates: STATIC_AVATARS,
    isLoading: false,
    isFetching: false,
    isFetchingNextPage: false,
    error: undefined,
    hasMore: false,
    loadMore: () => {},
    refresh: () => {},
    fetchNextPage: () => {},
    currentPage: 1,
    totalCount: STATIC_AVATARS.length,
    allTemplates: STATIC_AVATARS
  };
}

export default useQueryAvatar4Template;
