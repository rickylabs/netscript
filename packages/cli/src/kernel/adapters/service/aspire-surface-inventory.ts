import { basename, join } from '@std/path';
import { normalize } from '@std/path/posix';
import { generateAspireCliTaskRunner } from '../../templates/workspace/aspire-cli-task.ts';
import {
  ASPIRE_SURFACE_GENERATOR,
  ASPIRE_SURFACE_MARKER,
  ASPIRE_SURFACE_VERSION,
  type AspireGeneratedOutput,
  type AspireSurfaceInventory,
} from '../../domain/aspire-generated-surface.ts';
import type { GeneratedSourceFormatterPort } from '../../ports/generated-source-formatter-port.ts';
import type { GeneratedFile } from '../../templates/aspire/helpers/types.ts';

/** Validate the generator namespace, producer uniqueness and canonical bytes before any write. */
export async function canonicalizeAspireOutputs(
  projectRoot: string,
  files: readonly GeneratedFile[],
  formatter: GeneratedSourceFormatterPort,
): Promise<readonly GeneratedFile[]> {
  if (files.length >= 256) throw new Error('Aspire output inventory exceeds its bounded capacity.');
  const helper = { path: '.netscript/aspire-cli.ts', content: generateAspireCliTaskRunner() };
  const outputs = [...files.map((file) => ({ ...file, path: `aspire/${file.path}` })), helper];
  const seen = new Set<string>();
  const canonical: GeneratedFile[] = [];
  for (const file of outputs) {
    const path = file.path;
    if (!isAspireOutputPath(path) || seen.has(path.toLowerCase())) {
      throw new Error('Aspire producer overlap or authored output ownership violation.');
    }
    seen.add(path.toLowerCase());
    if (file.content.length > 16 * 1024 * 1024) throw new Error('Aspire output capacity exceeded.');
    const content = ASPIRE_SURFACE_MARKER + file.content;
    canonical.push({
      path,
      content,
    });
  }
  const contents = await formatter.formatContents(canonical.map((file) => ({
    targetPath: join(projectRoot, file.path),
    content: file.content,
  })));
  if (contents.length !== canonical.length) throw new Error('Incomplete Aspire formatting batch.');
  return canonical.map((file, index) => ({ path: file.path, content: contents[index] }));
}

/** Reserved generation scope; authored config and Aspire SDK modules cannot be claimed. */
export function isAspireOutputPath(path: string): boolean {
  return basename(path) !== 'appsettings.json' && !path.includes('\\') &&
    normalize(path) === path &&
    (path === '.netscript/aspire-cli.ts' || path === 'aspire/apphost.mts' ||
      (path.startsWith('aspire/.helpers/') && !path.endsWith('/')));
}

/** Hash exact bytes with a Web Platform digest. */
export async function aspireContentDigest(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', Uint8Array.from(bytes));
  return 'sha256:' +
    Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/** Describe all selected files; authored inputs are appended by the reader. */
export async function buildAspireInventory(
  files: readonly GeneratedFile[],
): Promise<AspireSurfaceInventory> {
  const outputs: AspireGeneratedOutput[] = [];
  for (const file of files) {
    outputs.push({
      generator: ASPIRE_SURFACE_GENERATOR,
      path: file.path,
      ownership: 'generated' as const,
      digest: await aspireContentDigest(new TextEncoder().encode(file.content)),
    });
  }
  return {
    version: ASPIRE_SURFACE_VERSION,
    generator: ASPIRE_SURFACE_GENERATOR,
    outputs,
    inputs: [],
  };
}
