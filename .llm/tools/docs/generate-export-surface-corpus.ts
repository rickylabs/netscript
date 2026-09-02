/** Generate the version-pinned MCP export corpus from Deno's structured documentation surface. */

import { dirname, fromFileUrl, join, resolve, toFileUrl } from '@std/path';

const REPO_ROOT = resolve(dirname(fromFileUrl(import.meta.url)), '../../..');
/** Repository-relative generated corpus staged by release preparation. */
export const EXPORT_SURFACE_CORPUS_OUTPUT =
  'packages/mcp/src/infrastructure/export-surfaces/export-surface-corpus.generated.ts';
const OUTPUT_PATH = join(REPO_ROOT, EXPORT_SURFACE_CORPUS_OUTPUT);

interface PackageManifest {
  readonly name?: unknown;
  readonly version?: unknown;
  readonly exports?: unknown;
  readonly publish?: unknown;
}

interface SurfaceSource {
  readonly packageName: string;
  readonly packageVersion: string;
  readonly subpath: string;
  readonly entrypoint: string;
}

interface ExportSurfaceSubpath {
  readonly packageName: string;
  readonly subpath: string;
}

/** One normalized declaration stored in the generated corpus. */
export interface GeneratedExportSurfaceEntry {
  readonly packageName: string;
  readonly subpath: string;
  readonly symbol: string;
  readonly kind: string;
  readonly signature: string;
  readonly jsDoc: string;
}

/** Normalized JSON payload stored in the generated corpus. */
export interface GeneratedExportSurfaceCorpus {
  readonly schemaVersion: 1;
  readonly frameworkVersion: string;
  readonly surfaces: readonly ExportSurfaceSubpath[];
  readonly entries: readonly GeneratedExportSurfaceEntry[];
}

/** Integrity and cardinality metadata rendered beside the embedded payload. */
export interface GeneratedExportSurfaceProvenance {
  readonly schemaVersion: 1;
  readonly frameworkVersion: string;
  readonly sha256: string;
  readonly uncompressedBytes: number;
  readonly compressedBytes: number;
  readonly packageCount: number;
  readonly subpathCount: number;
  readonly symbolCount: number;
}

interface GeneratedAsset {
  readonly source: string;
  readonly provenance: GeneratedExportSurfaceProvenance;
}

/** Normalize one Deno 2.9 JSON documentation node into exported declarations. */
export function normalizeDenoDocNode(
  node: unknown,
  packageName: string,
  subpath: string,
): GeneratedExportSurfaceEntry[] {
  if (!isRecord(node) || !Array.isArray(node.symbols)) {
    throw new Error(`deno doc node for ${packageName}${displaySubpath(subpath)} has no symbols`);
  }
  return node.symbols.map((rawSymbol) => {
    if (
      !isRecord(rawSymbol) || typeof rawSymbol.name !== 'string' ||
      !Array.isArray(rawSymbol.declarations)
    ) {
      throw new Error(
        `deno doc emitted an invalid symbol for ${packageName}${displaySubpath(subpath)}`,
      );
    }
    const declarations = rawSymbol.declarations.filter(isRecord);
    const kinds = [
      ...new Set(
        declarations.map((declaration) => declaration.kind).filter(
          (kind): kind is string => typeof kind === 'string',
        ),
      ),
    ];
    const signatures = declarations.map((declaration) =>
      renderDeclarationSignature(rawSymbol.name as string, declaration)
    );
    const docs = declarations.map((declaration) => renderJsDoc(declaration.jsDoc)).filter(Boolean);
    return {
      packageName,
      subpath,
      symbol: rawSymbol.name as string,
      kind: kinds.join('+') || 'unknown',
      signature: [...new Set(signatures)].join('\n'),
      jsDoc: [...new Set(docs)].join('\n\n'),
    };
  }).sort(compareEntries);
}

/** Render one compact public declaration signature from a Deno JSON declaration. */
export function renderDeclarationSignature(name: string, declaration: unknown): string {
  if (!isRecord(declaration)) return `unknown ${name}`;
  const kind = typeof declaration.kind === 'string' ? declaration.kind : 'unknown';
  const definition = isRecord(declaration.def) ? declaration.def : {};
  const typeParameters = renderTypeParameters(definition.typeParams);
  switch (kind) {
    case 'function':
      return `${definition.isAsync === true ? 'async ' : ''}function ${name}${typeParameters}(` +
        `${renderParameters(definition.params)}): ${renderType(definition.returnType, 'unknown')}`;
    case 'variable': {
      const variableKind = typeof definition.kind === 'string' ? definition.kind : 'const';
      return `${variableKind} ${name}: ${renderType(definition.tsType, 'unknown')}`;
    }
    case 'typeAlias':
      return `type ${name}${typeParameters} = ${renderType(definition.tsType, 'unknown')}`;
    case 'interface':
      return renderInterface(name, definition, typeParameters);
    case 'class':
      return renderClass(name, definition, typeParameters);
    case 'enum': {
      const members = Array.isArray(definition.members)
        ? definition.members.filter(isRecord).map((member) => String(member.name ?? '')).filter(
          Boolean,
        )
        : [];
      return `enum ${name} { ${members.join(', ')} }`;
    }
    case 'namespace':
      return `namespace ${name}`;
    default: {
      const renderedType = renderType(definition.tsType, '');
      return `${kind} ${name}${renderedType ? `: ${renderedType}` : ''}`;
    }
  }
}

/** Build the deterministic compressed TypeScript asset for a normalized corpus. */
export async function createGeneratedAsset(
  corpus: GeneratedExportSurfaceCorpus,
): Promise<GeneratedAsset> {
  const serialized = new TextEncoder().encode(JSON.stringify(corpus));
  const compressed = await gzip(serialized);
  const compressedCopy = new Uint8Array(compressed.byteLength);
  compressedCopy.set(compressed);
  const packages = new Set(corpus.surfaces.map((surface) => surface.packageName));
  const provenance: GeneratedExportSurfaceProvenance = {
    schemaVersion: 1,
    frameworkVersion: corpus.frameworkVersion,
    sha256: hex(await crypto.subtle.digest('SHA-256', compressedCopy.buffer)),
    uncompressedBytes: serialized.byteLength,
    compressedBytes: compressed.byteLength,
    packageCount: packages.size,
    subpathCount: corpus.surfaces.length,
    symbolCount: corpus.entries.length,
  };
  const encoded = compressed.toBase64();
  const source = `// @generated by .llm/tools/docs/generate-export-surface-corpus.ts
// Do not edit by hand. Run \`deno task gen:mcp-export-corpus\`.

import type { ExportSurfaceCorpusProvenance } from '../../ports/export-surface-corpus-port.ts';

/** Gzip/base64 encoded Deno JSON export-surface corpus. */
export const EXPORT_SURFACE_CORPUS_GZIP_BASE64: string = ${JSON.stringify(encoded)};

/** Pinned corpus integrity, version, byte-size, and cardinality metadata. */
export const EXPORT_SURFACE_CORPUS_PROVENANCE: ExportSurfaceCorpusProvenance = ${
    JSON.stringify(provenance, null, 2)
  };
`;
  return { source: await formatTypeScript(source), provenance };
}

/** Generate the complete first-party export corpus from current package export maps. */
export async function buildExportSurfaceCorpus(
  root: string = REPO_ROOT,
): Promise<GeneratedExportSurfaceCorpus> {
  const rootManifest = await readManifest(join(root, 'deno.json'));
  if (typeof rootManifest.version !== 'string' || !rootManifest.version.trim()) {
    throw new Error('root deno.json requires a non-empty version');
  }
  const sources = await discoverSurfaceSources(root);
  for (const source of sources) {
    if (source.packageVersion !== rootManifest.version) {
      throw new Error(
        `${source.packageName} is ${source.packageVersion}; expected ${rootManifest.version}`,
      );
    }
  }

  const entries: GeneratedExportSurfaceEntry[] = [];
  for (const packageName of [...new Set(sources.map((source) => source.packageName))].sort()) {
    const packageSources = sources.filter((source) => source.packageName === packageName);
    const command = new Deno.Command(Deno.execPath(), {
      args: ['doc', '--json', ...packageSources.map((source) => source.entrypoint)],
      cwd: root,
      env: colorInvariantChildEnv(),
      clearEnv: true,
      stdout: 'piped',
      stderr: 'piped',
    });
    const output = await command.output();
    if (!output.success) {
      throw new Error(
        `deno doc failed for ${packageName}: ${new TextDecoder().decode(output.stderr).trim()}`,
      );
    }
    const document = JSON.parse(new TextDecoder().decode(output.stdout)) as unknown;
    if (!isRecord(document) || document.version !== 2 || !isRecord(document.nodes)) {
      throw new Error(`deno doc for ${packageName} did not emit the Deno 2.9 version-2 JSON shape`);
    }
    for (const source of packageSources) {
      const nodeUrl = toFileUrl(source.entrypoint).href;
      const node = document.nodes[nodeUrl];
      if (node === undefined) {
        throw new Error(`deno doc omitted ${source.packageName}${displaySubpath(source.subpath)}`);
      }
      entries.push(...normalizeDenoDocNode(node, source.packageName, source.subpath));
    }
  }

  return {
    schemaVersion: 1,
    frameworkVersion: rootManifest.version,
    surfaces: sources.map(({ packageName, subpath }) => ({ packageName, subpath })),
    entries: entries.sort(compareEntries),
  };
}

async function discoverSurfaceSources(root: string): Promise<SurfaceSource[]> {
  const sources: SurfaceSource[] = [];
  for (const collection of ['packages', 'plugins']) {
    const collectionRoot = join(root, collection);
    for await (const directory of Deno.readDir(collectionRoot)) {
      if (!directory.isDirectory) continue;
      const packageRoot = join(collectionRoot, directory.name);
      const manifest = await readManifest(join(packageRoot, 'deno.json')).catch(() => undefined);
      if (
        !manifest || manifest.publish === false || typeof manifest.name !== 'string' ||
        !manifest.name.startsWith('@netscript/') || typeof manifest.version !== 'string'
      ) {
        continue;
      }
      const exported = normalizeExports(manifest.exports);
      for (const [subpath, target] of exported) {
        sources.push({
          packageName: manifest.name,
          packageVersion: manifest.version,
          subpath,
          entrypoint: resolve(packageRoot, target),
        });
      }
    }
  }
  return sources.sort((left, right) =>
    left.packageName.localeCompare(right.packageName) || left.subpath.localeCompare(right.subpath)
  );
}

function normalizeExports(exportsValue: unknown): Array<[string, string]> {
  if (typeof exportsValue === 'string') return [['.', exportsValue]];
  if (!isRecord(exportsValue)) return [];
  return Object.entries(exportsValue).map(([subpath, target]) => {
    if (typeof target !== 'string') throw new Error(`unsupported conditional export: ${subpath}`);
    return [subpath, target] as [string, string];
  }).sort(([left], [right]) => left.localeCompare(right));
}

async function readManifest(path: string): Promise<PackageManifest> {
  return JSON.parse(await Deno.readTextFile(path)) as PackageManifest;
}

function renderInterface(
  name: string,
  definition: Record<string, unknown>,
  typeParameters: string,
): string {
  const extensions = renderTypeList(definition.extends);
  const members = [
    ...renderProperties(definition.properties),
    ...renderMethods(definition.methods),
    ...renderCallSignatures(definition.callSignatures),
    ...renderIndexSignatures(definition.indexSignatures),
  ];
  return `interface ${name}${typeParameters}${extensions ? ` extends ${extensions}` : ''} { ${
    members.join('; ')
  } }`;
}

function renderClass(
  name: string,
  definition: Record<string, unknown>,
  typeParameters: string,
): string {
  const extension = renderType(definition.extends, '');
  const implementations = renderTypeList(definition.implements);
  const constructors = Array.isArray(definition.constructors)
    ? definition.constructors.filter(isRecord).map((constructor) =>
      `constructor(${renderParameters(constructor.params)})`
    )
    : [];
  const members = [
    ...constructors,
    ...renderProperties(definition.properties),
    ...renderMethods(definition.methods),
  ];
  return `class ${name}${typeParameters}${extension ? ` extends ${extension}` : ''}` +
    `${implementations ? ` implements ${implementations}` : ''} { ${members.join('; ')} }`;
}

function renderProperties(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isRecord).map((property) =>
    `${property.readonly === true ? 'readonly ' : ''}${String(property.name ?? 'property')}` +
    `${property.optional === true ? '?' : ''}: ${renderType(property.tsType, 'unknown')}`
  );
}

function renderMethods(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isRecord).map((method) =>
    `${method.isStatic === true ? 'static ' : ''}${String(method.name ?? 'method')}` +
    `${renderTypeParameters(method.typeParams)}(${renderParameters(method.params)}): ` +
    renderType(method.returnType, 'unknown')
  );
}

function renderCallSignatures(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isRecord).map((signature) =>
    `${renderTypeParameters(signature.typeParams)}(${renderParameters(signature.params)}): ` +
    renderType(signature.returnType, 'unknown')
  );
}

function renderIndexSignatures(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isRecord).map((signature) =>
    `[${String(signature.name ?? 'key')}: ${renderType(signature.params, 'string')}]: ` +
    renderType(signature.tsType ?? signature.returnType, 'unknown')
  );
}

function renderParameters(value: unknown): string {
  if (!Array.isArray(value)) return '';
  return value.filter(isRecord).map((parameter, index) => {
    const name = typeof parameter.name === 'string' ? parameter.name : `arg${index}`;
    const prefix = parameter.kind === 'rest' ? '...' : '';
    const optional = parameter.optional === true ? '?' : '';
    return `${prefix}${name}${optional}: ${renderType(parameter.tsType, 'unknown')}`;
  }).join(', ');
}

function renderTypeParameters(value: unknown): string {
  if (!Array.isArray(value) || value.length === 0) return '';
  const parameters = value.filter(isRecord).map((parameter) => {
    const name = String(parameter.name ?? 'T');
    const constraint = renderType(parameter.constraint, '');
    const fallback = renderType(parameter.default, '');
    return `${name}${constraint ? ` extends ${constraint}` : ''}${
      fallback ? ` = ${fallback}` : ''
    }`;
  });
  return `<${parameters.join(', ')}>`;
}

function renderType(value: unknown, fallback: string): string {
  if (!isRecord(value)) return fallback;
  if (value.kind === 'literal' && isRecord(value.value)) {
    if (value.value.kind === 'string') return JSON.stringify(value.value.string);
    if (value.value.kind === 'number' || value.value.kind === 'boolean') {
      return String(value.value[value.value.kind]);
    }
  }
  if (value.kind === 'typeRef' && isRecord(value.value)) {
    const name = typeof value.value.typeName === 'string'
      ? value.value.typeName
      : typeof value.repr === 'string'
      ? value.repr
      : fallback;
    const parameters = Array.isArray(value.value.typeParams)
      ? `<${
        value.value.typeParams.map((parameter) => renderType(parameter, 'unknown')).join(', ')
      }>`
      : '';
    return `${name}${parameters}`;
  }
  if (value.kind === 'fnOrConstructor' && isRecord(value.value)) {
    const prefix = Reflect.get(value.value, 'constructor') === true ? 'new ' : '';
    return `${prefix}(${renderParameters(value.value.params)}) => ` +
      renderType(value.value.tsType, 'unknown');
  }
  return typeof value.repr === 'string' ? value.repr : fallback;
}

function renderTypeList(value: unknown): string {
  if (!Array.isArray(value)) return '';
  return value.map((entry) => renderType(entry, '')).filter(Boolean).join(', ');
}

function renderJsDoc(value: unknown): string {
  if (!isRecord(value)) return '';
  const lines: string[] = typeof value.doc === 'string' && value.doc.trim()
    ? [value.doc.trim()]
    : [];
  if (Array.isArray(value.tags)) {
    for (const tag of value.tags.filter(isRecord)) {
      const kind = typeof tag.kind === 'string' ? tag.kind : 'tag';
      const name = typeof tag.name === 'string' ? ` ${tag.name}` : '';
      const doc = typeof tag.doc === 'string' && tag.doc.trim() ? ` ${tag.doc.trim()}` : '';
      lines.push(`@${kind}${name}${doc}`);
    }
  }
  return lines.join('\n');
}

function compareEntries(
  left: GeneratedExportSurfaceEntry,
  right: GeneratedExportSurfaceEntry,
): number {
  return left.packageName.localeCompare(right.packageName) ||
    left.subpath.localeCompare(right.subpath) ||
    left.symbol.localeCompare(right.symbol) ||
    left.kind.localeCompare(right.kind);
}

function displaySubpath(subpath: string): string {
  return subpath === '.' ? '' : subpath.slice(1);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

async function gzip(bytes: Uint8Array): Promise<Uint8Array> {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  const stream = new Blob([copy.buffer]).stream().pipeThrough(new CompressionStream('gzip'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

function hex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Canonical child environment for nested `deno` invocations.
 *
 * `deno doc --json` embeds ANSI escape sequences in its emitted strings when colour is
 * enabled, so the corpus content would otherwise depend on the *caller's* terminal
 * environment: `NO_COLOR=1` and `FORCE_COLOR=1` produced two different committed blobs.
 * `FORCE_COLOR` takes precedence over `NO_COLOR`, and even `FORCE_COLOR=0` forces colour,
 * so it must be **removed** from the child environment rather than overridden.
 */
export function colorInvariantChildEnv(): Record<string, string> {
  const env = Deno.env.toObject();
  delete env.FORCE_COLOR;
  delete env.CLICOLOR_FORCE;
  env.NO_COLOR = '1';
  return env;
}

async function formatTypeScript(source: string): Promise<string> {
  const child = new Deno.Command(Deno.execPath(), {
    args: ['fmt', '--ext', 'ts', '-'],
    cwd: REPO_ROOT,
    env: colorInvariantChildEnv(),
    clearEnv: true,
    stdin: 'piped',
    stdout: 'piped',
    stderr: 'piped',
  }).spawn();
  const writer = child.stdin.getWriter();
  await writer.write(new TextEncoder().encode(source));
  await writer.close();
  const output = await child.output();
  if (!output.success) {
    throw new Error(`deno fmt failed: ${new TextDecoder().decode(output.stderr).trim()}`);
  }
  return new TextDecoder().decode(output.stdout);
}

if (import.meta.main) {
  const check = Deno.args.includes('--check');
  const unknown = Deno.args.filter((argument) => argument !== '--check');
  if (unknown.length > 0) throw new Error(`unknown argument: ${unknown[0]}`);
  const asset = await createGeneratedAsset(await buildExportSurfaceCorpus());
  if (check) {
    const current = await Deno.readTextFile(OUTPUT_PATH).catch(() => '');
    if (current !== asset.source) {
      throw new Error('MCP export-surface corpus is stale; run deno task gen:mcp-export-corpus');
    }
  } else {
    await Deno.writeTextFile(OUTPUT_PATH, asset.source);
  }
  console.log(JSON.stringify(asset.provenance));
}
