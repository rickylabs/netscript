/**
 * Compose external and internal event handlers while preserving
 * `event.defaultPrevented` as the cancellation boundary.
 */
export function composeEventHandlers<T>(
  externalHandler: ((event: T) => void) | undefined,
  internalHandler: ((event: T) => void) | undefined,
): (event: T) => void {
  return (event: T) => {
    externalHandler?.(event);

    const defaultPrevented =
      typeof event === 'object' && event !== null && 'defaultPrevented' in event
        ? Boolean((event as { defaultPrevented?: boolean }).defaultPrevented)
        : false;

    if (!defaultPrevented) {
      internalHandler?.(event);
    }
  };
}
