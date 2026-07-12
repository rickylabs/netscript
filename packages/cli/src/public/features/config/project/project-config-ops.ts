import { inspectConfig, type NetScriptConfig } from '@netscript/config';
import { join } from '@std/path';

import type { FileSystemPort } from '../../../../kernel/ports/file-system-port.ts';

/** Read a dotted value from a JSON-like object. */
export function getDottedValue(target: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((value, part) =>
    value && typeof value === 'object' ? (value as Record<string, unknown>)[part] : undefined,
  target);
}

/** Inspect a loaded project config through the package diagnostic seam. */
export function inspectProjectConfig(config: NetScriptConfig): ReturnType<typeof inspectConfig> {
  return inspectConfig(config);
}

/** Persist a dotted value into generated appsettings.json. */
export async function setProjectConfigValue(
  fs: FileSystemPort,
  projectRoot: string,
  dottedPath: string,
  value: unknown,
): Promise<void> {
  const path = join(projectRoot, 'appsettings.json');
  if (!await fs.exists(path)) throw new Error(`appsettings.json not found under ${projectRoot}`);
  const document = JSON.parse(await fs.readFile(path)) as Record<string, unknown>;
  const parts = appsettingsPath(dottedPath);
  let current = document;
  for (const part of parts.slice(0, -1)) {
    const child = current[part];
    current = child && typeof child === 'object' && !Array.isArray(child)
      ? child as Record<string, unknown>
      : (current[part] = {}) as Record<string, unknown>;
  }
  current[parts.at(-1)!] = value;
  await fs.writeFile(path, `${JSON.stringify(document, null, 2)}\n`);
}

/** Map dashboard-friendly paths onto generated AppSettings casing. */
export function appsettingsPath(path: string): string[] {
  if (path === 'telemetry.otlpEndpoint') return ['NetScript', 'Otel', 'HttpEndpoint'];
  const parts = path.split('.');
  return ['NetScript', ...parts.map((part) => part ? part[0].toUpperCase() + part.slice(1) : part)];
}
