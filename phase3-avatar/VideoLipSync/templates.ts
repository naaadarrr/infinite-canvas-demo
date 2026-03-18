// Video Avatar Templates 统一导出文件
// 供外部组件（如 ResultsArea）使用

// 导出数据和类型
export {
  VIDEO_AVATAR_TEMPLATES,
  type VideoAvatarTemplateItem
} from './data/templates';

// 导出 store 状态
export {
  videoAvatarTemplateCategoryIdState,
  videoAvatarTemplateCategoryExpandedState,
  videoAvatarTemplateFavoritesState,
  videoAvatarTemplateShowFavoritesOnlyState,
  videoAvatarTemplateButtonClickedState,
  myVideoAvatarsState,
  myVideoAvatarFavoritesState,
  type MyVideoAvatarItem
} from './store/templateAtoms';

// 导出组件
export { VideoAvatarTemplatesPanel } from './components/VideoAvatarTemplatesPanel';
