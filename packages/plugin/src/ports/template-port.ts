/** Template renderer port used by plugin scaffolders. */
export interface TemplatePort {
  render(template: string, values: Record<string, string>): string;
}
