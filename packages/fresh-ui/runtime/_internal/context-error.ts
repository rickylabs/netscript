/**
 * Error thrown when a composable runtime part is rendered outside its owning root.
 */
export class FreshUiContextError extends TypeError {
  /**
   * Creates a strongly typed runtime composition error.
   * @param partName The part that was rendered without the required provider.
   * @param ownerName The owning root component that must wrap the part.
   */
  constructor(partName: string, ownerName: string) {
    super(`${partName} must be used inside <${ownerName}>.`);
    this.name = 'FreshUiContextError';
  }
}

/**
 * Returns a required context value or throws a typed package error.
 * @param value The current context value.
 * @param partName The part that requires the context.
 * @param ownerName The owning root component name.
 * @returns The resolved context value.
 */
export function requireFreshUiContext<T>(
  value: T | null,
  partName: string,
  ownerName: string,
): T {
  if (value === null) {
    throw new FreshUiContextError(partName, ownerName);
  }

  return value;
}
