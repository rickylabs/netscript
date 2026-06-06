/**
 * Validation constraints for scaffold inputs.
 */
export const SCAFFOLD_VALIDATION: {
  readonly NAME_MAX_LENGTH: number;
  readonly NAME_PATTERN: RegExp;
  readonly RESERVED_NAMES: readonly string[];
} = {
  NAME_MAX_LENGTH: 64,
  NAME_PATTERN: /^[a-z][a-z0-9-]*$/,
  RESERVED_NAMES: [
    'test',
    'build',
    'dist',
    'node_modules',
    'src',
    'lib',
    'packages',
    'scripts',
    'dotnet',
    'aspire',
    'netscript',
  ] as const,
} as const;
