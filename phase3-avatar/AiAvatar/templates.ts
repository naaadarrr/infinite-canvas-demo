// Avatar Templates 统一导出文件
// 供外部组件（如 ResultsArea）使用

// 导出数据和类型
export {
  AVATAR_TEMPLATE_CATEGORIES,
  AVATAR_TEMPLATES,
  getTemplatesByCategory,
  getTemplateById,
  type AvatarTemplateCategory,
  type AvatarTemplateItem
} from './data/templates';

// 导出 store 状态
export {
  avatarTemplateCategoryExpandedState,
  avatarTemplateFavoritesState,
  avatarTemplateShowFavoritesOnlyState,
  myAvatarsState,
  myAvatarFavoritesState,
  avatarTemplateButtonClickedState,
  type MyAvatarItem
} from './store/templateAtoms';

// 导出组件
export { AvatarTemplatesPanel } from './components/AvatarTemplatesPanel';
