'use client';

/**
 * Avatar4 相关 Query Hooks
 *
 * 对应 Router: mediaLibrary.aiAvatar & avatar4
 * - getCustomAiAvatarList: 查询用户自定义头像列表
 * - getAiAvatarListV2: 查询AI头像列表V2
 * - getPhotoAvatar4CategoryList: 查询头像分类列表
 * - getPhotoAvatar4TemplateList: 查询头像模板列表
 * - getFavoritePhotoAvatar4Templates: 查询收藏的头像模板列表
 */

import { trpc } from '@/lib/trpc/client';

/**
 * 查询用户自定义的 Avatar4 数字人列表
 * 获取当前用户创建的自定义头像
 *
 */
export const useGetCustomAiAvatarListQuery =
  trpc.mediaLibrary.aiAvatar.getCustomAiAvatarList.useQuery;

/**
 * 查询 Avatar4 分类列表
 * 获取头像模板的分类信息
 */
export const useGetPhotoAvatar4CategoryListQuery =
  trpc.avatar4.getPhotoAvatar4CategoryList.useQuery;

/**
 * 无限滚动查询 Avatar4 模板列表
 * 根据分类获取头像模板（支持无限滚动）
 */
export const useGetPhotoAvatar4TemplateListInfiniteQuery =
  trpc.avatar4.getPhotoAvatar4TemplateListInfinite.useInfiniteQuery;

/**
 * 无限滚动查询收藏的 Avatar4 模板列表
 * 获取用户收藏的头像模板（支持无限滚动）
 */
export const useGetFavoritePhotoAvatar4TemplatesInfiniteQuery =
  trpc.avatar4.getFavoritePhotoAvatar4TemplatesInfinite.useInfiniteQuery;

/**
 * 无限滚动查询合集中的 Avatar4 模板列表
 * 根据合集ID获取头像模板（支持无限滚动）
 */
export const useGetPhotoAvatar4CollectionTemplatesInfiniteQuery =
  trpc.avatar4.getPhotoAvatar4CollectionTemplatesInfinite.useInfiniteQuery;

/**
 * 查询所有 Avatar4 合集列表
 * 获取所有可用的头像模板合集
 */
export const useGetAllCollectionsQuery =
  trpc.avatar4.getAllCollections.useQuery;
