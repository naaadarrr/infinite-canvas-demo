'use client';

export function useQueryFavoriteAvatar4Template(options?: {
  sortField?: string;
  sortType?: string;
  pageSize?: number;
}) {
  return {
    templates: [],
    isLoading: false,
    isFetching: false,
    isFetchingNextPage: false,
    error: undefined,
    hasMore: false,
    loadMore: () => {},
    refresh: () => {},
    fetchNextPage: () => {},
    currentPage: 0,
    totalCount: 0,
    allTemplates: []
  };
}

export default useQueryFavoriteAvatar4Template;
