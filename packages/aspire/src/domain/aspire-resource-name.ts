/**
 * Aspire 13.4.6 default resource-name grammar.
 *
 * Names contain 1–64 ASCII characters, start with a letter, use only letters,
 * digits, or hyphens, and contain neither consecutive nor trailing hyphens.
 */
export const ASPIRE_RESOURCE_NAME_PATTERN: RegExp =
  /^(?=[A-Za-z0-9-]{1,64}$)[A-Za-z](?:[A-Za-z0-9]|-(?=[A-Za-z0-9]))*$/;

/** Canonical diagnostic text for the Aspire default resource-name grammar. */
export const ASPIRE_RESOURCE_NAME_RULE: string =
  'Aspire resource names must be 1-64 characters, start with an ASCII letter, contain only ASCII letters, digits, or hyphens, and contain no consecutive or trailing hyphens.';
