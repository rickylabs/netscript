/** Canonical lexical vocabulary for first-party NetScript JSR specifiers. */

export const NETSCRIPT_PACKAGE_NAME_PATTERN: string = '[a-z0-9][a-z0-9-]*';
export const NETSCRIPT_SEMVER_PATTERN: string =
  '(?:0|[1-9]\\d*)\\.(?:0|[1-9]\\d*)\\.(?:0|[1-9]\\d*)' +
  '(?:-[0-9A-Za-z-]+(?:\\.[0-9A-Za-z-]+)*)?';
export const NETSCRIPT_RANGE_OPERATOR_PATTERN: string = '(?:\\^|~|>=|<=|>|<|=)';
export const NETSCRIPT_VERSION_BOUNDARY_PATTERN: string = '(?=[^0-9A-Za-z.+-]|$)';

const TEMPLATE_VERSION_PATTERN = '(?:<version>|\\$\\{[^}\\r\\n]+\\}|\\{\\{[^}\\r\\n]+\\}\\})';
const SUBPATH_PATTERN = '[a-z0-9][a-z0-9./-]*';
// A terminal prose period is punctuation. A period followed by another version identifier is not.
const SPECIFIER_TERMINATOR_PATTERN = '(?![0-9A-Za-z+-]|\\.[0-9A-Za-z-])';

/** Parsed components used by release currency and export checks. */
export interface NetscriptJsrSpecifier {
  readonly name: string;
  readonly version: string;
  readonly rangeOperator: string;
  readonly subpath: string;
}

/** Create a fresh global matcher; captures package, range operator, version, and export subpath. */
export function createNetscriptJsrSpecifierRegExp(): RegExp {
  return new RegExp(
    `jsr:@netscript\\/(${NETSCRIPT_PACKAGE_NAME_PATTERN})` +
      `(?:@(${NETSCRIPT_RANGE_OPERATOR_PATTERN})?(${NETSCRIPT_SEMVER_PATTERN}|${TEMPLATE_VERSION_PATTERN})` +
      `(?:\\/(${SUBPATH_PATTERN}))?${SPECIFIER_TERMINATOR_PATTERN}` +
      `|(?!@)${SPECIFIER_TERMINATOR_PATTERN})`,
    'g',
  );
}

/** Parse one complete canonical NetScript JSR specifier. */
export function parseNetscriptJsrSpecifier(
  specifier: string,
): NetscriptJsrSpecifier | undefined {
  const match = createNetscriptJsrSpecifierRegExp().exec(specifier);
  if (!match || match.index !== 0 || match[0] !== specifier) return undefined;
  return {
    name: `@netscript/${match[1]}`,
    rangeOperator: match[2] ?? '',
    version: match[3] ?? '',
    subpath: match[4] ?? '',
  };
}

/** Create the exact-version rewrite matcher used by coordinated version updates. */
export function createNetscriptVersionRewriteRegExp(version: string): RegExp {
  const escaped = version.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(
    `((?:jsr|npm):@netscript/[A-Za-z0-9._-]+@(?:\\^|~|>=|<=|>|<|=)?)` +
      `${escaped}${NETSCRIPT_VERSION_BOUNDARY_PATTERN}`,
    'g',
  );
}
