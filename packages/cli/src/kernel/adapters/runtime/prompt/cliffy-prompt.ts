/**
 * Cliffy-backed prompt adapter for CLI workflows.
 */

import { Confirm, Input, Select } from '@cliffy/prompt';

import type { PromptPort } from '../../../ports/prompt-port.ts';

/** Prompt adapter backed by Cliffy prompt primitives. */
export class CliffyPrompt implements PromptPort {
  /** Ask for free-form text input. */
  input(message: string, options?: { readonly defaultValue?: string }): Promise<string> {
    return Input.prompt({ message, default: options?.defaultValue });
  }

  /** Ask for a yes/no answer. */
  confirm(message: string, options?: { readonly defaultValue?: boolean }): Promise<boolean> {
    return Confirm.prompt({ message, default: options?.defaultValue });
  }

  /** Ask the user to select one option. */
  select<T extends string>(
    message: string,
    options: readonly T[],
    config?: { readonly defaultValue?: T },
  ): Promise<T> {
    return Select.prompt({
      message,
      options: options.map((option) => ({ name: option, value: option })),
      default: config?.defaultValue,
    }) as Promise<T>;
  }
}
