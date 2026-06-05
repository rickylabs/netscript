import { getNextCollectionIndex } from '../_internal/collection-navigation.ts';
import type { TabsOrientation } from './tabs.types.ts';

export function getNextTabsIndex(
  key: string,
  currentIndex: number,
  count: number,
  orientation: TabsOrientation,
  loop = true,
): number {
  return getNextCollectionIndex(key, currentIndex, count, orientation, loop);
}