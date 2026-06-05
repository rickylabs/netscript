/**
 * Prompt port shared by CLI presentation and application services.
 */

/** User prompt abstraction. */
export interface PromptPort {
  /** Ask for free-form text input. */
  input(message: string, options?: { readonly defaultValue?: string }): Promise<string>;

  /** Ask for a yes/no answer. */
  confirm(message: string, options?: { readonly defaultValue?: boolean }): Promise<boolean>;

  /** Ask the user to select one option. */
  select<T extends string>(
    message: string,
    options: readonly T[],
    config?: { readonly defaultValue?: T },
  ): Promise<T>;
}
