import { getNextCollectionIndex } from '../_internal/collection-navigation.ts';
import type { TabsOrientation } from './tabs.types.ts';

export function getNextTabsIndex(
  key: string,
  currentIndex: number,
  count: number,
  orientation: TabsOrientation,
  loop = true,
  direction: 'ltr' | 'rtl' = 'ltr',
): number {
  const mapped = orientation === 'horizontal' && direction === 'rtl'
    ? key === 'ArrowLeft' ? 'ArrowRight' : key === 'ArrowRight' ? 'ArrowLeft' : key
    : key;
  return getNextCollectionIndex(mapped, currentIndex, count, orientation, loop);
}
