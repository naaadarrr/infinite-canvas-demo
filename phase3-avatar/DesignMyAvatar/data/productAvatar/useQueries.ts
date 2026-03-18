'use client';

/**
 * Product Avatar 模板相关 Query Hooks
 *
 * 对应 Router: productAvatar.template
 * - getMetaList: 查询产品数字人模板列表
 * - getMetaListInfinite: 查询产品数字人模板列表（无限滚动）
 * - getCategoryList: 查询产品数字人模板分类
 * - getFavoriteList: 查询收藏的模板列表
 * - getFavoriteListInfinite: 查询收藏的模板列表（无限滚动）
 */

import { trpc } from '@/lib/trpc/client';

/**
 * 查询产品数字人模板分类
 */
export const useGetCategoryListQuery =
  trpc.productAvatar.template.getCategoryList.useQuery;

/**
 * 无限滚动查询模板列表（公共模板和私有模板）
 */
export const useGetMetaListInfiniteQuery =
  trpc.productAvatar.template.getMetaListInfinite.useInfiniteQuery;

/**
 * 无限滚动查询收藏的模板列表（需登录）
 */
export const useGetFavoriteListInfiniteQuery =
  trpc.productAvatar.template.getFavoriteListInfinite.useInfiniteQuery;

/**
 * 查询产品数字人模板合集列表
 * 获取所有可用的产品数字人模板合集
 */
export const useGetCollectionListQuery =
  trpc.productAvatar.template.getCollectionList.useQuery;

/**
 * 查询产品数字人合集模板列表
 * 根据合集ID获取产品数字人模板
 */
export const useGetCollectionMetaListQuery =
  trpc.productAvatar.template.getCollectionMetaList.useQuery;

/**
 * 无限滚动查询产品数字人合集模板列表
 * 根据合集ID获取产品数字人模板（支持无限滚动）
 */
export const useGetCollectionMetaListInfiniteQuery =
  trpc.productAvatar.template.getCollectionMetaListInfinite.useInfiniteQuery;

/**
 * 查询AI头像种族列表
 * 获取可用的种族分类
 */
export const useGetEthnicityListQuery =
  trpc.mediaLibrary.aiAvatar.getEthnicityList.useQuery;
