import { useCallback } from 'react';
import { useRecoilState } from 'recoil-next';
import {
  videoAvatarFilterState,
  videoAvatarTemplateFavoritesState
} from '../store/templateAtoms';
import type { GenderType, SortingType } from '../store/templateAtoms';

export function useTemplateFilter() {
  const [favorites, setFavorites] = useRecoilState(
    videoAvatarTemplateFavoritesState
  );
  const [filter, setFilter] = useRecoilState(videoAvatarFilterState);

  // 切换模板收藏状态
  const toggleFavorite = useCallback(
    (templateId: string) => {
      if (favorites.includes(templateId)) {
        setFavorites(favorites.filter((id) => id !== templateId));
      } else {
        setFavorites([...favorites, templateId]);
      }
    },
    [favorites, setFavorites]
  );

  // 检查模板是否已收藏
  const isFavorite = useCallback(
    (templateId: string) => favorites.includes(templateId),
    [favorites]
  );

  // 切换 Ethnicity 筛选
  const toggleEthnicity = useCallback(
    (value: string) => {
      setFilter((prev) => ({
        ...prev,
        ethnicity: prev.ethnicity.includes(value)
          ? prev.ethnicity.filter((e) => e !== value)
          : [...prev.ethnicity, value]
      }));
    },
    [setFilter]
  );

  // 切换 Gender 筛选
  const toggleGender = useCallback(
    (value: GenderType) => {
      setFilter((prev) => ({
        ...prev,
        gender: prev.gender.includes(value)
          ? prev.gender.filter((g) => g !== value)
          : [...prev.gender, value]
      }));
    },
    [setFilter]
  );

  // 设置排序
  const setSorting = useCallback(
    (value: SortingType) => {
      setFilter((prev) => ({ ...prev, sorting: value }));
    },
    [setFilter]
  );

  return {
    filter,
    favorites,
    toggleFavorite,
    isFavorite,
    toggleEthnicity,
    toggleGender,
    setSorting
  };
}
