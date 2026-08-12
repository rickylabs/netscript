/**
 * Build the checked-in compressed prose source consumed by the CLI asset generator.
 *
 * Normal repository generation reads the rendered Markdown twins in `docs/site/_site`. The legacy
 * external-bundle input remains supported for release tooling. API docs are deliberately excluded:
 * `agent init --with-docs` regenerates them from the exact packages in the initialized project.
 */

import { dirname, fromFileUrl, join, relative, resolve } from 'jsr:@std/path@^1';

const REPO_ROOT = resolve(dirname(fromFileUrl(import.meta.url)), '../../..');
const OUTPUT_ROOT = join(REPO_ROOT, '.llm', 'assets', 'agent-docs');
const PROSE_PATH = join(OUTPUT_ROOT, 'prose.json.gz');
const PROVENANCE_PATH = join(OUTPUT_ROOT, 'provenance.json');

interface AgentDocsProseCorpus {
  readonly schemaVersion: 1;
  readonly files: Readonly<Record<string, string>>;
}

/** Stable metadata supplied when rebuilding the site-derived portion of the corpus. */
export interface AgentDocsSiteMetadata {
  readonly version: string;
  readonly sourceCommit: string;
  readonly extractionTimestamp: string;
  readonly preservedCorpusPath?: string;
}

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

async function gunzip(bytes: Uint8Array): Promise<Uint8Array> {
  const copied = new Uint8Array(bytes.byteLength);
  copied.set(bytes);
  const stream = new Blob([copied.buffer]).stream().pipeThrough(
    new DecompressionStream('gzip'),
  );
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function readCorpus(path: string): Promise<AgentDocsProseCorpus> {
  const decoded = new TextDecoder().decode(await gunzip(await Deno.readFile(path)));
  return JSON.parse(decoded) as AgentDocsProseCorpus;
}

async function writeCorpus(
  contents: Readonly<Record<string, string>>,
  metadata: AgentDocsSiteMetadata,
  outputRoot: string,
): Promise<AgentDocsProseProvenance> {
  const files = Object.keys(contents).sort();
  const orderedContents: Record<string, string> = {};
  for (const path of files) orderedContents[path] = contents[path];
  const encoded = new TextEncoder().encode(
    JSON.stringify({ schemaVersion: 1, files: orderedContents }),
  );
  const compressed = await gzip(encoded);
  const provenance: AgentDocsProseProvenance = {
    schemaVersion: 1,
    version: metadata.version,
    sourceCommit: metadata.sourceCommit,
    extractionTimestamp: metadata.extractionTimestamp,
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
  return await writeCorpus(contents, {
    version,
    sourceCommit,
    extractionTimestamp,
  }, outputRoot);
}

/** Rebuild site-owned entries while retaining corpus members owned outside `docs/site`. */
export async function buildAgentDocsProseFromSite(
  siteRoot: string,
  metadata: AgentDocsSiteMetadata,
  outputRoot: string = OUTPUT_ROOT,
): Promise<AgentDocsProseProvenance> {
  const root = resolve(siteRoot);
  const allFiles = await collectFiles(root);
  if (!allFiles.includes('llms.txt') || !allFiles.includes('llms-full.txt')) {
    throw new Error('Rendered docs site must contain llms.txt and llms-full.txt');
  }

  const preserved = await readCorpus(metadata.preservedCorpusPath ?? PROSE_PATH);
  const contents: Record<string, string> = {};
  for (const [path, content] of Object.entries(preserved.files)) {
    if (path !== 'llms.txt' && path !== 'llms-full.txt' && !path.startsWith('pages/')) {
      contents[path] = content;
    }
  }
  contents['llms.txt'] = await Deno.readTextFile(join(root, 'llms.txt'));
  contents['llms-full.txt'] = await Deno.readTextFile(join(root, 'llms-full.txt'));
  for (const path of allFiles.filter((path) => path === 'index.md' || path.endsWith('/index.md'))) {
    contents[`pages/${path}`] = await Deno.readTextFile(join(root, path));
  }
  if (!/^## Task router$/m.test(contents['llms.txt'])) {
    throw new Error('Rendered docs site does not contain the #1068 task router in llms.txt');
  }
  return await writeCorpus(contents, metadata, outputRoot);
}

async function gitSourceCommit(): Promise<string> {
  const command = new Deno.Command('git', {
    args: ['rev-parse', '--short=9', 'HEAD'],
    cwd: REPO_ROOT,
    stdout: 'piped',
    stderr: 'inherit',
  });
  const output = await command.output();
  if (!output.success) throw new Error('git rev-parse failed while recording corpus provenance');
  return new TextDecoder().decode(output.stdout).trim();
}

if (import.meta.main) {
  if (Deno.args.includes('--help') || Deno.args.includes('-h')) {
    console.log(
      'Usage: build-agent-docs-bundle.ts (--bundle-dir <path> | --site-dir <path>) [--check]',
    );
    Deno.exit(0);
  }
  const bundleIndex = Deno.args.indexOf('--bundle-dir');
  const siteIndex = Deno.args.indexOf('--site-dir');
  const bundleRoot = bundleIndex >= 0 ? Deno.args[bundleIndex + 1] : undefined;
  const siteRoot = siteIndex >= 0 ? Deno.args[siteIndex + 1] : undefined;
  if ((bundleRoot ? 1 : 0) + (siteRoot ? 1 : 0) !== 1) {
    throw new Error('exactly one of --bundle-dir <path> or --site-dir <path> is required');
  }
  if (bundleRoot) {
    console.log(JSON.stringify(await buildAgentDocsProse(bundleRoot)));
  } else {
    const check = Deno.args.includes('--check');
    const previous = JSON.parse(
      await Deno.readTextFile(PROVENANCE_PATH),
    ) as AgentDocsProseProvenance;
    const rootConfig = JSON.parse(
      await Deno.readTextFile(join(REPO_ROOT, 'deno.json')),
    ) as { readonly version?: string };
    const provenance = await buildAgentDocsProseFromSite(siteRoot!, {
      version: check ? previous.version : (rootConfig.version ?? previous.version),
      sourceCommit: check ? previous.sourceCommit : await gitSourceCommit(),
      extractionTimestamp: check ? previous.extractionTimestamp : new Date().toISOString(),
    });
    console.log(JSON.stringify(provenance));
  }
}
