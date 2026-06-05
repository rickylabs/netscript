/**
 * @module infra/scaffold/template-adapter
 *
 * Thin `{{var | pipe}}` template engine backed by `@std/text` case transforms.
 *
 * The {@link StringTemplateAdapter} implements {@link TemplatePort} with a
 * simple regex-based replacer. Variables are resolved from a flat
 * `Record<string, string>` context and optionally piped through one of the
 * built-in case-transform functions.
 *
 * Supported pipe names: `camelCase`, `pascalCase`, `kebabCase`, `snakeCase`,
 * `upperCase`, `lowerCase`.
 *
 * @example
 * ```typescript
 * import { DenoFileSystem } from '../runtime/file-system/deno-file-system.ts';
 * import { StringTemplateAdapter } from './template-adapter.ts';
 *
 * const fs = new DenoFileSystem();
 * const tpl = new StringTemplateAdapter(fs);
 * const out = await tpl.render('Hello {{name | pascalCase}}!', { name: 'my-app' });
 * // → 'Hello MyApp!'
 * ```
 */

import { toCamelCase, toKebabCase, toPascalCase, toSnakeCase } from '@std/text';
import type { FileSystemPort } from '../../ports/file-system-port.ts';
import type { TemplatePort } from '../../ports/template-port.ts';

// ============================================================================
// PIPES
// ============================================================================

/**
 * Built-in pipe transforms available inside `{{var | pipe}}` expressions.
 *
 * Each key is the pipe name used in templates; each value is the pure
 * transform function applied to the resolved variable value.
 */
const PIPES: Readonly<Record<string, (s: string) => string>> = {
  camelCase: toCamelCase,
  pascalCase: toPascalCase,
  kebabCase: toKebabCase,
  snakeCase: toSnakeCase,
  upperCase: (s: string) => s.toUpperCase(),
  lowerCase: (s: string) => s.toLowerCase(),
};

/**
 * Regex that matches `{{variable}}` and `{{variable | pipe}}` placeholders.
 *
 * Capture groups:
 * 1. Variable name (`\w+`)
 * 2. Optional pipe name (`\w+`)
 */
const PLACEHOLDER_RE = /\{\{\s*(\w+)(?:\s*\|\s*(\w+))?\s*\}\}/g;

// ============================================================================
// PURE RENDER FUNCTION
// ============================================================================

/**
 * Render a template string by replacing `{{var}}` / `{{var | pipe}}`
 * placeholders with values from the given context.
 *
 * This is a **pure function** — it has no side-effects and does not depend
 * on any adapter instance. The {@link StringTemplateAdapter} delegates here
 * so that the core logic remains independently testable.
 *
 * @param template - Template string containing `{{var}}` placeholders.
 * @param context  - Key-value pairs for variable substitution.
 * @returns The fully rendered string.
 *
 * @throws {Error} If a placeholder references a variable not present in
 *   `context`.
 * @throws {Error} If a placeholder uses a pipe name that is not registered
 *   in {@link PIPES}.
 *
 * @example
 * ```typescript
 * renderTemplate('{{name | pascalCase}}Service', { name: 'user-auth' });
 * // → 'UserAuthService'
 * ```
 */
export function renderTemplate(
  template: string,
  context: Record<string, string>,
): string {
  return template.replace(
    PLACEHOLDER_RE,
    (_match: string, key: string, pipe?: string): string => {
      if (!(key in context)) {
        throw new Error(
          `Template variable "{{${key}}}" is not defined in context. ` +
            `Available: ${Object.keys(context).join(', ')}`,
        );
      }

      const value = context[key];

      if (pipe) {
        const transform = PIPES[pipe];
        if (!transform) {
          throw new Error(
            `Unknown pipe "${pipe}" in "{{${key} | ${pipe}}}". ` +
              `Available: ${Object.keys(PIPES).join(', ')}`,
          );
        }
        return transform(value);
      }

      return value;
    },
  );
}

// ============================================================================
// ADAPTER CLASS
// ============================================================================

/**
 * Template adapter that uses simple `{{var | pipe}}` string replacement.
 *
 * Implements the {@link TemplatePort} contract so the scaffolder is
 * decoupled from the specific template engine. This adapter is intentionally
 * minimal — it covers `Plan 1` needs without pulling in a full Handlebars
 * or EJS dependency.
 *
 * @example
 * ```typescript
 * const fs = new DenoFileSystem();
 * const adapter = new StringTemplateAdapter(fs);
 *
 * const result = await adapter.render(
 *   'export class {{name | pascalCase}}Service {}',
 *   { name: 'user-auth' },
 * );
 * // → 'export class UserAuthService {}'
 * ```
 */
export class StringTemplateAdapter implements TemplatePort {
  /** Human-readable engine identifier for logging and debugging. */
  readonly engine: string = 'string-template';

  /**
   * Create a new `StringTemplateAdapter`.
   *
   * @param fs - Filesystem adapter used by {@link renderFile} to read
   *   template files from disk (or memory in tests).
   */
  constructor(private readonly fs: FileSystemPort) {}

  /**
   * Render a template string with the given context variables.
   *
   * Delegates to the pure {@link renderTemplate} function and wraps the
   * result in a `Promise` for interface compatibility.
   *
   * @param template - Template string containing `{{var}}` placeholders.
   * @param context  - Key-value pairs for variable substitution.
   * @returns Rendered string.
   * @throws If a placeholder references an undefined variable or unknown pipe.
   */
  render(
    template: string,
    context: Record<string, string>,
  ): Promise<string> {
    return Promise.resolve(renderTemplate(template, context));
  }

  /**
   * Read a template file from the filesystem and render it with context
   * variables.
   *
   * @param templatePath - Absolute path to the template file.
   * @param context      - Key-value pairs for variable substitution.
   * @returns Rendered string.
   * @throws If the file cannot be read or a placeholder is invalid.
   */
  async renderFile(
    templatePath: string,
    context: Record<string, string>,
  ): Promise<string> {
    const content = await this.fs.readFile(templatePath);
    return renderTemplate(content, context);
  }
}
