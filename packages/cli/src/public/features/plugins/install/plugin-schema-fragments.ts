import { join, relative } from '@std/path';
import type { FileSystemPort } from '../../../../kernel/ports/file-system-port.ts';
import type { ResolvedPluginSchemaFragment } from '../../../../kernel/adapters/plugin/db-integration.ts';
import {
  fetchJsrPackageSchemaFragments,
  type JsrPackageFileFetcher,
} from '../../../infra/jsr/verify-jsr-package-integrity.ts';
import type { ResolvedPluginBeforePlanning } from './install-plugin.ts';

/** Read selected source-package schemas, retaining integrity verification for JSR packages. */
export async function resolvePluginSchemaFragments(
  plugin: ResolvedPluginBeforePlanning,
  fs: FileSystemPort,
  fetcher?: JsrPackageFileFetcher,
): Promise<readonly ResolvedPluginSchemaFragment[]> {
  if (plugin.source.kind === 'jsr') {
    return await fetchJsrPackageSchemaFragments(plugin.descriptor, fetcher);
  }
  const root = join(plugin.source.path, 'database');
  if (!await fs.exists(root)) return [];
  const fragments: ResolvedPluginSchemaFragment[] = [];
  for await (const entry of fs.walk(root)) {
    if (entry.isFile && /\.(?:prisma|migration\.sql)$/.test(entry.path)) {
      fragments.push({
        path: relative(plugin.source.path, entry.path).replaceAll('\\', '/'),
        content: await fs.readFile(entry.path),
      });
    }
  }
  return fragments.sort((left, right) => left.path.localeCompare(right.path));
}
