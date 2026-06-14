export type CollectionOrientation = 'horizontal' | 'vertical';

const HORIZONTAL_KEYS = new Set(['ArrowLeft', 'ArrowRight', 'Home', 'End']);
const VERTICAL_KEYS = new Set(['ArrowUp', 'ArrowDown', 'Home', 'End']);

function clampIndex(index: number, count: number): number {
  if (count <= 0) {
    return -1;
  }

  if (index < 0) {
    return 0;
  }

  if (index >= count) {
    return count - 1;
  }

  return index;
}

export function getNextCollectionIndex(
  key: string,
  currentIndex: number,
  count: number,
  orientation: CollectionOrientation,
  loop = true,
): number {
  if (count <= 0) {
    return -1;
  }

  const isSupportedKey = orientation === 'vertical'
    ? VERTICAL_KEYS.has(key)
    : HORIZONTAL_KEYS.has(key);

  if (!isSupportedKey) {
    return currentIndex;
  }

  if (key === 'Home') {
    return 0;
  }

  if (key === 'End') {
    return count - 1;
  }

  if (currentIndex < 0) {
    return key === 'ArrowLeft' || key === 'ArrowUp' ? count - 1 : 0;
  }

  const delta = key === 'ArrowLeft' || key === 'ArrowUp' ? -1 : 1;
  const nextIndex = currentIndex + delta;

  if (loop) {
    return (nextIndex + count) % count;
  }

  return clampIndex(nextIndex, count);
}
