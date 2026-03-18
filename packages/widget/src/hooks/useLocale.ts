/**
 * Adapter: useLocale for product-photography (resolves @/hooks/useLocale)
 */
import type { TransModule } from '../types/locale';

const LABELS: Record<string, string> = {
  cancel: 'Cancel',
  confirm: 'Confirm',
  refineCutout: 'Manually mask product',
  manuallyMaskProduct: 'Manually Mask Product',
  brushThickness: 'Brush thickness',
  eraserThickness: 'Eraser thickness',
};

export function useLocale(_modules: TransModule[]) {
  const t = (key: string) => LABELS[key] ?? key;
  return { t };
}
