/**
 * Build the checked-in compressed prose source consumed by the CLI asset generator.
 *
 * The input must be the output of `.briefing/build-docs-bundle.sh`. API docs from that build are
 * deliberately excluded: `agent init --with-docs` regenerates them from the exact packages in the
 * initialized project.
 */

import { dirname, fromFileUrl, join, relative, resolve } from 'jsr:@std/path@^1';

const REPO_ROOT = resolve(dirname(fromFileUrl(import.meta.url)), '../../..');
const OUTPUT_ROOT = join(REPO_ROOT, '.llm', 'assets', 'agent-docs');

/** Metadata kept beside the compressed prose source for reproducible CLI asset generation. */
export interface AgentDocsProseProvenance {
  readonly schemaVersion: 1;
  readonly version: string;
  readonly sourceCommit: string;
  readonly extractionTimestamp: string;
  readonly files: readonly string[];
  readonly uncompressedBytes: number;
  readonly compressedBytes: number;
  readonly sha256: string;
}

async function collectFiles(root: string, directory = root): Promise<string[]> {
  const files: string[] = [];
  for await (const entry of Deno.readDir(directory)) {
    const path = join(directory, entry.name);
    if (entry.isDirectory) files.push(...await collectFiles(root, path));
    else if (entry.isFile) files.push(relative(root, path).replaceAll('\\', '/'));
  }
  return files;
}

function hex(bytes: ArrayBuffer): string {
  return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function gzip(bytes: Uint8Array): Promise<Uint8Array> {
  const copied = new Uint8Array(bytes.byteLength);
  copied.set(bytes);
  const stream = new Blob([copied.buffer]).stream().pipeThrough(new CompressionStream('gzip'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

function manifestValue(manifest: string, label: string): string {
  const row = manifest.split(/\r?\n/).find((line) => line.startsWith(`| ${label} |`));
  const value = row?.split('|')[2]?.trim();
  if (!value) throw new Error(`External docs MANIFEST.md is missing ${label}`);
  return value.replaceAll('`', '').split(/\s+/)[0];
}

/** Refresh the checked-in compressed prose source from an external docs bundle. */
export async function buildAgentDocsProse(
  bundleRoot: string,
  outputRoot: string = OUTPUT_ROOT,
): Promise<AgentDocsProseProvenance> {
  const root = resolve(bundleRoot);
  const allFiles = await collectFiles(root);
  const files = allFiles.filter((path) =>
    path === 'llms.txt' || path === 'llms-full.txt' || path.startsWith('pages/') ||
    path.startsWith('context/')
  ).sort();
  if (!files.includes('llms.txt') || !files.includes('llms-full.txt')) {
    throw new Error('External docs bundle must contain llms.txt and llms-full.txt');
  }
  const contents: Record<string, string> = {};
  for (const path of files) contents[path] = await Deno.readTextFile(join(root, path));
  if (!/^## Task router$/m.test(contents['llms.txt'])) {
    throw new Error('External docs bundle does not contain the #1068 task router in llms.txt');
  }

  const externalManifest = await Deno.readTextFile(join(root, 'MANIFEST.md'));
  const version = manifestValue(externalManifest, 'Framework version');
  const sourceCommit = manifestValue(externalManifest, 'Extracted from commit');
  const extractionTimestamp = manifestValue(externalManifest, 'Extraction timestamp');
  const encoded = new TextEncoder().encode(JSON.stringify({ schemaVersion: 1, files: contents }));
  const compressed = await gzip(encoded);
  const provenance: AgentDocsProseProvenance = {
    schemaVersion: 1,
    version,
    sourceCommit,
    extractionTimestamp,
    files,
    uncompressedBytes: encoded.byteLength,
    compressedBytes: compressed.byteLength,
    sha256: hex(await crypto.subtle.digest('SHA-256', new Uint8Array(compressed).buffer)),
  };

  await Deno.mkdir(outputRoot, { recursive: true });
  await Deno.writeFile(join(outputRoot, 'prose.json.gz'), compressed);
  await Deno.writeTextFile(
    join(outputRoot, 'provenance.json'),
    `${JSON.stringify(provenance, null, 2)}\n`,
  );
  return provenance;
}

if (import.meta.main) {
  if (Deno.args.includes('--help') || Deno.args.includes('-h')) {
    console.log(
      'Usage: deno run --allow-read --allow-write .llm/tools/docs/build-agent-docs-bundle.ts --bundle-dir <path>',
    );
    Deno.exit(0);
  }
  const index = Deno.args.indexOf('--bundle-dir');
  const bundleRoot = index >= 0 ? Deno.args[index + 1] : undefined;
  if (!bundleRoot) throw new Error('--bundle-dir <path> is required');
  console.log(JSON.stringify(await buildAgentDocsProse(bundleRoot)));
}
