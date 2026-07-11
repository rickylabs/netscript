/**
 * Deterministic system-prompt composition contracts.
 *
 * Section content is opaque and remains caller-owned. This module owns only
 * validation, ordering, omission, and separation.
 *
 * @module
 */

import { AiError } from './errors.ts';

/** The stable boundary inserted between rendered system-prompt sections. */
export const SYSTEM_PROMPT_SECTION_SEPARATOR = '\n\n';

/** A named, ordered block of caller-owned system-prompt content. */
export interface PromptSection {
  /** Identity used to detect conflicting contributions. */
  readonly name: string;
  /** Opaque prompt text. Whitespace-only content is omitted. */
  readonly content: string;
  /** Ordering rank; lower values render first. */
  readonly precedence: number;
}

/** Raised when an assembly contains more than one section with the same name. */
export class DuplicatePromptSectionError extends AiError {
  /** The section name that appeared more than once. */
  readonly sectionName: string;

  /** Construct an error for a duplicated `sectionName`. */
  constructor(sectionName: string) {
    super(`System-prompt section "${sectionName}" was contributed more than once.`);
    this.name = 'DuplicatePromptSectionError';
    this.sectionName = sectionName;
  }
}

/**
 * Compose named sections into a deterministic system prompt.
 *
 * Lower precedence values render first. Equal values retain insertion order.
 * Blank sections are dropped; retained content is trimmed and separated by
 * exactly {@linkcode SYSTEM_PROMPT_SECTION_SEPARATOR}. Duplicate names throw
 * before rendering, including when a duplicate section is blank.
 *
 * @param sections - Caller-owned prompt sections to validate and compose.
 * @returns The assembled prompt, or an empty string when every section is blank.
 * @throws {DuplicatePromptSectionError} When a section name occurs more than once.
 *
 * @example Compose catalog, skills, and app instructions
 * ```ts
 * const system = composeSystemPrompt([
 *   { name: "catalog", precedence: 20, content: componentCatalog },
 *   { name: "skills", precedence: 10, content: skillsSystemBlock },
 *   { name: "app", precedence: 30, content: appInstructions },
 * ]);
 * ```
 */
export function composeSystemPrompt(sections: readonly PromptSection[]): string {
  const names = new Set<string>();
  for (const section of sections) {
    if (names.has(section.name)) {
      throw new DuplicatePromptSectionError(section.name);
    }
    names.add(section.name);
  }

  return sections
    .map((section, insertionOrder) => ({ section, insertionOrder }))
    .filter(({ section }) => section.content.trim().length > 0)
    .sort((left, right) =>
      left.section.precedence - right.section.precedence ||
      left.insertionOrder - right.insertionOrder
    )
    .map(({ section }) => section.content.trim())
    .join(SYSTEM_PROMPT_SECTION_SEPARATOR);
}

/** An immutable object seam over {@linkcode composeSystemPrompt}. */
export class PromptAssembler {
  readonly #sections: readonly PromptSection[];

  /** Capture a snapshot of the sections this assembler will compose. */
  constructor(sections: readonly PromptSection[]) {
    this.#sections = [...sections];
  }

  /** Compose this assembler's captured sections into a system prompt. */
  compose(): string {
    return composeSystemPrompt(this.#sections);
  }
}
