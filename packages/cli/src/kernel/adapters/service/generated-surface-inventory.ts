import type {
  GeneratedSurfaceDrift,
  GeneratedSurfaceOutput,
} from '../../domain/generated-surface.ts';
import { readInspectionFile } from './generated-surface-reader.ts';

/** Canonical relative paths avoid traversal, URLs, Windows aliases and case ambiguity. */
export function isProjectPath(path: string): boolean {
  return path.length > 0 && !/[\\:*?"<>|#]/.test(path) &&
    !Array.from(path).some((character) => character.charCodeAt(0) < 32) &&
    path.split('/').every((part) =>
      part.length > 0 && part !== '.' && part !== '..' && !/[. ]$/.test(part)
    );
}

/** Hash exact bytes with a Web Platform digest. */
export async function generatedContentDigest(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', Uint8Array.from(bytes));
  return 'sha256:' +
    Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/** Validate the entire rendered selection before hashing or reading any selected output. */
export async function buildGeneratedOutputs<const Generator extends string>(
  files: readonly {
    readonly path: string;
    readonly content: string;
    readonly generator: Generator;
  }[],
  acceptsPath: (path: string) => boolean,
): Promise<readonly GeneratedSurfaceOutput<Generator>[]> {
  if (files.length > 256) throw new Error('Generated output inventory capacity exceeded.');
  const seen = new Set<string>();
  let bytes = 0;
  for (const file of files) {
    if (
      !isProjectPath(file.path) || !acceptsPath(file.path) ||
      seen.has(file.path.toLowerCase()) ||
      !file.content.startsWith(`// @netscript-generated ${file.generator}\n`)
    ) {
      throw new Error('Generated producer overlap or output ownership violation.');
    }
    seen.add(file.path.toLowerCase());
    const size = new TextEncoder().encode(file.content).byteLength;
    if (size > 16 * 1024 * 1024 || (bytes += size) > 64 * 1024 * 1024) {
      throw new Error('Generated output byte capacity exceeded.');
    }
  }
  const outputs: GeneratedSurfaceOutput<Generator>[] = [];
  for (const file of files) {
    outputs.push({
      generator: file.generator,
      path: file.path,
      ownership: 'generated',
      digest: await generatedContentDigest(new TextEncoder().encode(file.content)),
    });
  }
  return outputs;
}

/** Compare exact producer declarations and bytes through the bounded read-only reader. */
export async function inspectGeneratedOutputs(
  projectRoot: string,
  outputs: readonly GeneratedSurfaceOutput[],
): Promise<GeneratedSurfaceDrift[]> {
  const drift: GeneratedSurfaceDrift[] = [];
  for (const entry of outputs) {
    const bytes = await readInspectionFile(projectRoot, entry.path);
    if (!bytes) {
      drift.push({ path: entry.path, kind: 'missing' });
      continue;
    }
    const marker = new TextEncoder().encode(`// @netscript-generated ${entry.generator}\n`);
    if (!marker.every((byte, index) => bytes[index] === byte)) {
      drift.push({ path: entry.path, kind: 'ownership' });
    }
    if (await generatedContentDigest(bytes) !== entry.digest) {
      drift.push({ path: entry.path, kind: 'bytes' });
    }
  }
  return drift;
}
