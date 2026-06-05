import type { TemplatePort } from '../ports/mod.ts';

/** String replacement template adapter. */
export class StringTemplateAdapter implements TemplatePort {
  render(template: string, values: Record<string, string>): string {
    return template.replaceAll(/\{\{\s*(\w+)\s*\}\}/g, (_match, key: string) => values[key] ?? '');
  }
}
