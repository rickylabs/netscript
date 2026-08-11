import { join, resolve } from '@std/path';
import { toFileUrl } from '@std/path/to-file-url';

/** Resolve a configured plugin specifier exactly as the runtime loader does. */
export function resolvePluginImportSpecifier(projectRoot: string, spec: string): string {
  if (spec.startsWith('.') || spec.startsWith('/')) {
    const resolved = resolve(projectRoot, spec);
    const modulePath = resolved.endsWith('.ts') ? resolved : join(resolved, 'mod.ts');
    return toFileUrl(modulePath).href;
  }
  return spec;
}
