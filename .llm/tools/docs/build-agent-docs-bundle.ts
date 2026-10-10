/**
 * Build the checked-in, independently compressed pages shipped by the CLI.
 *
 * Normal repository generation reads the rendered Markdown twins in `docs/site/_site`. The legacy
 * external-bundle input remains supported for release tooling. API docs are deliberately excluded:
 * `agent init --with-docs` regenerates them from the exact packages in the initialized project.
 */

import { agentDocsFullCorpus } from '../../../packages/cli/src/kernel/assets/agent-docs-transport.ts';
import { dirname, fromFileUrl, join, relative, resolve } from 'jsr:@std/path@^1';

const REPO_ROOT = resolve(dirname(fromFileUrl(import.meta.url)), '../../..');
const OUTPUT_ROOT = join(REPO_ROOT, '.llm', 'assets', 'agent-docs');
import {
  AGENT_DOCS_PAGE_CARRIER,
  readAgentDocsPages,
  renderAgentDocsPages,
} from './agent-docs-page-carrier.ts';
const PROSE_PATH = join(REPO_ROOT, AGENT_DOCS_PAGE_CARRIER);
const PROVENANCE_PATH = join(OUTPUT_ROOT, 'provenance.json');

interface AgentDocsProseCorpus {
  readonly schemaVersion: 1;
  readonly files: Readonly<Record<string, string>>;
}

/** Stable metadata supplied when rebuilding the site-derived portion of the corpus. */
export interface AgentDocsSiteMetadata {
  readonly version: string;
  readonly sourceCommit?: string;
  readonly extractionTimestamp?: string;
  readonly preservedCorpusPath?: string;
}

/** Generation report; only schema and version are written to the deterministic sidecar. */
export interface AgentDocsProseProvenance {
  readonly schemaVersion: 1;
  readonly version: string;
  readonly sourceCommit?: string;
  readonly extractionTimestamp?: string;
  readonly files: readonly string[];
  readonly uncompressedBytes: number;
  readonly compressedBytes: number;
  readonly sha256: string;
}

/** Semantic freshness result for a checked-in agent-docs prose corpus. */
export interface AgentDocsProseFreshness {
  readonly fresh: boolean;
  readonly stalePaths: readonly string[];
  readonly provenance: AgentDocsProseProvenance;
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

async function gunzip(bytes: Uint8Array): Promise<Uint8Array> {
  const copied = new Uint8Array(bytes.byteLength);
  copied.set(bytes);
  const stream = new Blob([copied.buffer]).stream().pipeThrough(
    new DecompressionStream('gzip'),
  );
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function readCorpus(path: string, version = '0.0.7'): Promise<AgentDocsProseCorpus> {
  if (!path.endsWith('.gz')) {
    return { schemaVersion: 1, files: await readAgentDocsPages(path, version) };
  }
  const decoded = new TextDecoder().decode(await gunzip(await Deno.readFile(path)));
  return JSON.parse(decoded) as AgentDocsProseCorpus;
}

async function sha256(bytes: Uint8Array): Promise<string> {
  const copy = new Uint8Array(bytes);
  return hex(await crypto.subtle.digest('SHA-256', copy.buffer));
}

function canonicalCorpus(contents: Readonly<Record<string, string>>): {
  readonly files: readonly string[];
  readonly encoded: Uint8Array;
} {
  const files = Object.keys(contents).sort();
  const orderedContents: Record<string, string> = {};
  for (const path of files) orderedContents[path] = contents[path];
  return {
    files,
    encoded: new TextEncoder().encode(JSON.stringify({ schemaVersion: 1, files: orderedContents })),
  };
}

function carrierPath(outputRoot: string): string {
  return outputRoot === OUTPUT_ROOT
    ? PROSE_PATH
    : join(outputRoot, 'agent-docs-prose.generated.ts');
}

async function writeCorpus(
  contents: Readonly<Record<string, string>>,
  metadata: AgentDocsSiteMetadata,
  outputRoot: string,
): Promise<AgentDocsProseProvenance> {
  const source = await renderAgentDocsPages(contents);
  const provenance = { schemaVersion: 1 as const, version: metadata.version };
  await Deno.mkdir(outputRoot, { recursive: true });
  await Deno.writeTextFile(carrierPath(outputRoot), source);
  await Deno.writeTextFile(
    join(outputRoot, 'provenance.json'),
    `${JSON.stringify(provenance, null, 2)}\n`,
  );
  const { files, encoded } = canonicalCorpus(contents);
  return {
    ...provenance,
    files,
    uncompressedBytes: encoded.byteLength,
    compressedBytes: new TextEncoder().encode(source).byteLength,
    sha256: await sha256(encoded),
  };
}

async function checkCorpus(
  contents: Readonly<Record<string, string>>,
  metadata: AgentDocsSiteMetadata,
  outputRoot: string,
): Promise<AgentDocsProseFreshness> {
  const source = await renderAgentDocsPages(contents);
  const stalePaths: string[] = [];
  if (await Deno.readTextFile(carrierPath(outputRoot)).catch(() => '') !== source) {
    stalePaths.push('agent-docs-prose.generated.ts');
  }
  const sidecar = `${JSON.stringify({ schemaVersion: 1, version: metadata.version }, null, 2)}\n`;
  if (await Deno.readTextFile(join(outputRoot, 'provenance.json')).catch(() => '') !== sidecar) {
    stalePaths.push('provenance.json');
  }
  const { files, encoded } = canonicalCorpus(contents);
  const provenance = {
    schemaVersion: 1 as const,
    version: metadata.version,
    files,
    uncompressedBytes: encoded.byteLength,
    compressedBytes: new TextEncoder().encode(source).byteLength,
    sha256: await sha256(encoded),
  };
  return { fresh: stalePaths.length === 0, stalePaths, provenance };
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

  const preserved = await readCorpus(metadata.preservedCorpusPath ?? PROSE_PATH, metadata.version);
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
  if (agentDocsFullCorpus(contents, metadata.version) !== contents['llms-full.txt']) {
    throw new Error(
      'Derived full corpus does not match the rendered site; update the page composition policy',
    );
  }
  return await writeCorpus(contents, metadata, outputRoot);
}

/** Check site-derived corpus freshness by canonical content without mutating checked-in assets. */
export async function checkAgentDocsProseFromSite(
  siteRoot: string,
  metadata: AgentDocsSiteMetadata,
  outputRoot: string = OUTPUT_ROOT,
): Promise<AgentDocsProseFreshness> {
  const root = resolve(siteRoot);
  const allFiles = await collectFiles(root);
  if (!allFiles.includes('llms.txt') || !allFiles.includes('llms-full.txt')) {
    throw new Error('Rendered docs site must contain llms.txt and llms-full.txt');
  }
  const preserved = await readCorpus(metadata.preservedCorpusPath ?? PROSE_PATH, metadata.version);
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
  if (agentDocsFullCorpus(contents, metadata.version) !== contents['llms-full.txt']) {
    throw new Error(
      'Derived full corpus does not match the rendered site; update the page composition policy',
    );
  }
  return await checkCorpus(contents, metadata, outputRoot);
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
    const metadata = {
      version: check ? previous.version : (rootConfig.version ?? previous.version),
    };
    if (check) {
      const freshness = await checkAgentDocsProseFromSite(siteRoot!, metadata);
      console.log(JSON.stringify(freshness));
      if (!freshness.fresh) {
        throw new Error(`Agent docs prose is stale: ${freshness.stalePaths.join(', ')}`);
      }
    } else {
      console.log(JSON.stringify(await buildAgentDocsProseFromSite(siteRoot!, metadata)));
    }
  }
}
