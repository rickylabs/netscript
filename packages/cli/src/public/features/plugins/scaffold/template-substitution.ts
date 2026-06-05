/**
 * @module
 *
 * Template substitution for host-side plugin package scaffolding.
 */

/** Template variable matcher for `{{var}}` placeholders. */
export const TEMPLATE_VARIABLE_PATTERN = /\{\{([\w-]+)\}\}/g;

/** Variables available to plugin skeleton templates. */
export type TemplateVariables = Readonly<Record<string, string>> & {
  /** Full package name, for example `@acme/plugin-billing`. */
  readonly pluginName: string;
  /** Package scope, for example `@acme`. */
  readonly pluginScope: string;
  /** Domain base name, for example `billing`. */
  readonly pluginBaseName: string;
  /** PascalCase class stem, for example `Billing`. */
  readonly className: string;
  /** PascalCase class stem for templates that use an upper-case key. */
  readonly ClassName: string;
  /** Kebab-case domain name, for example `billing`. */
  readonly pluginNameKebab: string;
  /** Unscoped package name, for example `plugin-billing`. */
  readonly 'plugin-name': string;
};

/** Port for replacing template variables in strings. */
export interface TemplateSubstitutionPort {
  /** Expand all `{{var}}` placeholders in a template string. */
  expand(template: string, variables: TemplateVariables): string;
}

/** Expand `{{var}}` placeholders using the supplied variables. */
export function expandTemplate(template: string, variables: TemplateVariables): string {
  return template.replace(TEMPLATE_VARIABLE_PATTERN, (match, key: string) => {
    const value = variables[key];
    if (value === undefined) {
      throw new Error(`Template variable "${key}" is not defined.`);
    }
    return value;
  });
}

/** Return whether a string still contains unresolved template variables. */
export function hasTemplateVariables(value: string): boolean {
  return value.match(TEMPLATE_VARIABLE_PATTERN) !== null;
}

/** Create the default template substitution port. */
export function createTemplateSubstitutionPort(): TemplateSubstitutionPort {
  return { expand: expandTemplate };
}
