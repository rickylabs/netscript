export type ComboboxDirection = 1 | -1 | 'first' | 'last';

/**
 * Resolves the next highlighted option index for a keyboard move.
 *
 * - `first`/`last` jump to the ends.
 * - `1`/`-1` step from the current index; with no current highlight a step
 *   enters from the matching end.
 * - `loop` wraps at the ends, otherwise it clamps.
 *
 * Returns `-1` when there are no options.
 */
export function getNextComboboxIndex(
  direction: ComboboxDirection,
  currentIndex: number,
  length: number,
  loop: boolean,
): number {
  if (length === 0) return -1;
  if (direction === 'first') return 0;
  if (direction === 'last') return length - 1;
  if (currentIndex < 0) return direction === 1 ? 0 : length - 1;

  let next = currentIndex + direction;
  if (next < 0) next = loop ? length - 1 : 0;
  if (next >= length) next = loop ? 0 : length - 1;
  return next;
}

export function getComboboxDataState(open: boolean): 'open' | 'closed' {
  return open ? 'open' : 'closed';
}
