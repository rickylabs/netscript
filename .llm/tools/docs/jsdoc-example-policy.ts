import { dirname, fromFileUrl, isAbsolute, join, normalize, relative, toFileUrl } from '@std/path';
import {
  type JsdocDeferredExample,
  type JsdocExampleAnalysis,
  type JsdocExampleBlock,
  type JsdocExampleCensus,
  type JsdocExampleFinding,
  type JsdocExampleOwner,
  type PublicSymbolBinding,
} from './jsdoc-example-contract.ts';
import { extractFencedBlocks } from './snippet-extractor.ts';
import {
  discoverPublishedSourceFiles,
  type PublishedSourceFile,
} from '../release/preflight-text-imports.ts';
import { readJsonFile } from '../deps/workspace.ts';

type JsonObject = Record<string, unknown>;

/** Reviewed GREEN coverage floors and coordinator-owned deferred-class ceilings. */
export const JSDOC_EXAMPLE_RATCHET = {
  minimumExamples: 349,
  minimumCandidates: 348,
  minimumChecked: 348,
  maximumExempt: 0,
  maximumDeferredUnboundName: 116,
  maximumDeferredTypeError: 14,
} as const;

/** Return every coverage/deferred ratchet violation without hiding sibling failures. */
export function jsdocExampleRatchetFailures(
  census: JsdocExampleCensus,
  deferredExamples: readonly JsdocDeferredExample[],
): string[] {
  const failures: string[] = [];
  if (census.examples < JSDOC_EXAMPLE_RATCHET.minimumExamples) {
    failures.push(
      `examples ${census.examples} < ${JSDOC_EXAMPLE_RATCHET.minimumExamples}`,
    );
  }
  if (census.candidates < JSDOC_EXAMPLE_RATCHET.minimumCandidates) {
    failures.push(
      `candidates ${census.candidates} < ${JSDOC_EXAMPLE_RATCHET.minimumCandidates}`,
    );
  }
  if (census.checked < JSDOC_EXAMPLE_RATCHET.minimumChecked) {
    failures.push(`checked ${census.checked} < ${JSDOC_EXAMPLE_RATCHET.minimumChecked}`);
  }
  if (census.exempt > JSDOC_EXAMPLE_RATCHET.maximumExempt) {
    failures.push(`exempt ${census.exempt} > ${JSDOC_EXAMPLE_RATCHET.maximumExempt}`);
  }
  const unboundName = deferredExamples.filter((entry) => entry.failureClass === 'unboundName')
    .length;
  const typeError = deferredExamples.length - unboundName;
  if (unboundName > JSDOC_EXAMPLE_RATCHET.maximumDeferredUnboundName) {
    failures.push(
      `deferred unboundName ${unboundName} > ${JSDOC_EXAMPLE_RATCHET.maximumDeferredUnboundName}`,
    );
  }
  if (typeError > JSDOC_EXAMPLE_RATCHET.maximumDeferredTypeError) {
    failures.push(
      `deferred typeError ${typeError} > ${JSDOC_EXAMPLE_RATCHET.maximumDeferredTypeError}`,
    );
  }
  return failures;
}

interface ExportEntry {
  memberName: string;
  memberRoot: string;
  specifier: string;
  path: string;
}

interface SymbolExample {
  owner: JsdocExampleOwner;
  declarationPath: string;
  declarationLine: number;
  tags: unknown[];
}

/** Injectable Deno-doc loader used by semantic tests and the real command edge. */
export type DenoDocLoader = (path: string) => Promise<unknown>;

async function loadConcurrently<T>(
  values: readonly T[],
  concurrency: number,
  load: (value: T) => Promise<unknown>,
): Promise<void> {
  let cursor = 0;
  const workers = Array.from({ length: Math.min(concurrency, values.length) }, async () => {
    while (cursor < values.length) {
      const value = values[cursor++];
      await load(value);
    }
  });
  await Promise.all(workers);
}

function isObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function objects(value: unknown): JsonObject[] {
  return Array.isArray(value) ? value.filter(isObject) : [];
}

function tags(value: unknown): unknown[] {
  return isObject(value) && Array.isArray(value.tags) ? value.tags : [];
}

function exampleDocs(value: unknown): string[] {
  return tags(value).flatMap((tag) =>
    isObject(tag) && tag.kind === 'example' && typeof tag.doc === 'string' ? [tag.doc] : []
  );
}

function exportTarget(value: unknown, label: string): string {
  if (typeof value === 'string') return value;
  if (!isObject(value)) throw new Error(`${label}: expected export target`);
  for (const condition of ['deno', 'import', 'default']) {
    if (condition in value) return exportTarget(value[condition], `${label}.${condition}`);
  }
  throw new Error(`${label}: no deno/import/default export target`);
}

async function exportedEntrypoints(
  repositoryRoot: string,
  files: PublishedSourceFile[],
): Promise<ExportEntry[]> {
  const memberRoots = new Map(files.map((file) => [file.member.root, file.member]));
  const entries: ExportEntry[] = [];
  for (const member of [...memberRoots.values()].sort((a, b) => a.root.localeCompare(b.root))) {
    const config = await readJsonFile(join(repositoryRoot, member.denoJsonPath));
    if (typeof config.name !== 'string') continue;
    const add = (key: string, target: unknown): void => {
      const specifier = key === '.' ? config.name as string : `${config.name}/${key.slice(2)}`;
      entries.push({
        memberName: config.name as string,
        memberRoot: member.root,
        specifier,
        path: join(
          repositoryRoot,
          member.root,
          exportTarget(target, `${member.denoJsonPath}.${key}`),
        ),
      });
    };
    if (typeof config.exports === 'string') add('.', config.exports);
    else if (isObject(config.exports)) {
      for (const [key, target] of Object.entries(config.exports)) {
        if (key === '.' || key.startsWith('./')) add(key, target);
      }
    }
  }
  return entries.sort((a, b) => a.specifier.localeCompare(b.specifier));
}

/** Load Deno's structured documentation JSON without executing the documented module. */
export async function loadDenoDocJson(path: string): Promise<unknown> {
  const output = await new Deno.Command(Deno.execPath(), {
    args: ['doc', '--json', path],
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  if (output.code !== 0) {
    throw new Error(
      `deno doc --json failed for ${path}: ${new TextDecoder().decode(output.stderr).trim()}`,
    );
  }
  return JSON.parse(new TextDecoder().decode(output.stdout)) as unknown;
}

function docModule(value: unknown, path: string): JsonObject | undefined {
  if (!isObject(value) || !isObject(value.nodes)) return undefined;
  const canonical = toFileUrl(path).href;
  const node = value.nodes[canonical] ?? value.nodes[path];
  return isObject(node) ? node : undefined;
}

function declarationKind(kind: unknown): 'value' | 'type' | 'class' {
  if (kind === 'typeAlias' || kind === 'interface') return 'type';
  if (kind === 'class') return 'class';
  return 'value';
}

function sourcePath(repositoryRoot: string, filename: string): string {
  const path = filename.startsWith('file:') ? fromFileUrl(filename) : filename;
  return normalize(relative(repositoryRoot, path));
}

function symbolExamples(
  repositoryRoot: string,
  entry: ExportEntry,
  doc: unknown,
): SymbolExample[] {
  const module = docModule(doc, entry.path);
  if (!module) return [];
  const result: SymbolExample[] = [];
  for (const symbol of objects(module.symbols)) {
    if (typeof symbol.name !== 'string') continue;
    for (const declaration of objects(symbol.declarations)) {
      const docs = isObject(declaration.jsDoc) ? declaration.jsDoc : undefined;
      const docsTags = docs ? tags(docs) : [];
      if (exampleDocs(docs).length === 0) continue;
      const location = isObject(declaration.location) ? declaration.location : undefined;
      if (!location || typeof location.filename !== 'string') continue;
      const path = sourcePath(repositoryRoot, location.filename);
      const kind = declarationKind(declaration.kind);
      result.push({
        owner: {
          memberName: entry.memberName,
          memberRoot: entry.memberRoot,
          sourcePath: path,
          kind: 'symbol',
          symbol: symbol.name,
          publicSpecifier: entry.specifier,
          declarationKind: kind,
        },
        declarationPath: path,
        declarationLine: typeof location.line === 'number' ? location.line : 1,
        tags: docsTags,
      });
    }
  }
  return result;
}

function bindingPreference(a: SymbolExample, b: SymbolExample): number {
  const aSpecifier = a.owner.publicSpecifier ?? '';
  const bSpecifier = b.owner.publicSpecifier ?? '';
  return aSpecifier.length - bSpecifier.length || aSpecifier.localeCompare(bSpecifier);
}

function dedupeSymbols(examples: SymbolExample[]): SymbolExample[] {
  const selected = new Map<string, SymbolExample>();
  for (const example of examples.sort(bindingPreference)) {
    const key = `${example.declarationPath}:${example.declarationLine}:${example.owner.symbol}`;
    if (!selected.has(key)) selected.set(key, example);
  }
  return [...selected.values()].sort((a, b) =>
    a.declarationPath.localeCompare(b.declarationPath) ||
    a.declarationLine - b.declarationLine ||
    (a.owner.symbol ?? '').localeCompare(b.owner.symbol ?? '')
  );
}

function analyzeTag(
  doc: string,
  owner: JsdocExampleOwner,
  exampleOrdinal: number,
  blocks: JsdocExampleBlock[],
  findings: JsdocExampleFinding[],
): void {
  const label = `${owner.sourcePath} · ${owner.kind}${
    owner.symbol ? ` ${owner.symbol}` : ''
  } · example ${exampleOrdinal}`;
  let fences;
  try {
    fences = extractFencedBlocks(doc, label);
  } catch (error) {
    findings.push({
      disposition: 'malformed',
      owner,
      exampleOrdinal,
      reason: error instanceof Error ? error.message : String(error),
    });
    return;
  }
  if (fences.length === 0) {
    findings.push({
      disposition: 'unfenced',
      owner,
      exampleOrdinal,
      reason: 'example has no fence',
    });
    return;
  }
  for (const fence of fences) {
    if (fence.infoString.length === 0) {
      findings.push({
        disposition: 'malformed',
        owner,
        exampleOrdinal,
        fenceOrdinal: fence.fenceOrdinal,
        reason: 'fence has no language',
      });
      continue;
    }
    if (!fence.checkedLanguage) {
      findings.push({
        disposition: 'nonTypeScript',
        owner,
        exampleOrdinal,
        fenceOrdinal: fence.fenceOrdinal,
        reason: fence.language,
      });
      continue;
    }
    const block: JsdocExampleBlock = {
      owner,
      exampleOrdinal,
      fenceOrdinal: fence.fenceOrdinal,
      openingLine: fence.openingLine,
      codeStartLine: fence.codeStartLine,
      language: fence.language,
      checkedLanguage: fence.checkedLanguage,
      compilationExtension: fence.compilationExtension,
      exemptionReason: fence.exemptionReason,
      body: fence.body,
    };
    blocks.push(block);
    findings.push({
      disposition: fence.exemptionReason ? 'exempt' : 'checked',
      owner,
      exampleOrdinal,
      fenceOrdinal: fence.fenceOrdinal,
      reason: fence.exemptionReason,
    });
  }
}

/** Classify one structured JSDoc example tag with the repository's fence policy. */
export function classifyJsdocExampleTag(
  doc: string,
  owner: JsdocExampleOwner,
  exampleOrdinal: number,
): Pick<JsdocExampleAnalysis, 'blocks' | 'findings'> {
  const blocks: JsdocExampleBlock[] = [];
  const findings: JsdocExampleFinding[] = [];
  analyzeTag(doc, owner, exampleOrdinal, blocks, findings);
  return { blocks, findings };
}

function moduleExampleOwner(file: PublishedSourceFile, repositoryRoot: string): JsdocExampleOwner {
  return {
    memberName: file.member.name,
    memberRoot: file.member.root,
    sourcePath: normalize(relative(repositoryRoot, file.path)),
    kind: 'module',
  };
}

/** Discover and classify the published JSDoc example corpus from Deno's JSON documentation. */
export async function analyzeJsdocExamples(
  repositoryRoot: string,
  options: { loadDoc?: DenoDocLoader } = {},
): Promise<JsdocExampleAnalysis> {
  const loadDoc = options.loadDoc ?? loadDenoDocJson;
  const files = await discoverPublishedSourceFiles(repositoryRoot);
  const entries = await exportedEntrypoints(repositoryRoot, files);
  const cache = new Map<string, Promise<unknown>>();
  const getDoc = (path: string): Promise<unknown> => {
    const canonical = isAbsolute(path) ? path : join(repositoryRoot, path);
    const existing = cache.get(canonical);
    if (existing) return existing;
    const loaded = loadDoc(canonical);
    cache.set(canonical, loaded);
    return loaded;
  };
  await loadConcurrently(
    [...new Set([...files.map((file) => file.path), ...entries.map((entry) => entry.path)])],
    8,
    getDoc,
  );

  const blocks: JsdocExampleBlock[] = [];
  const findings: JsdocExampleFinding[] = [];
  const publishedPaths = new Set(
    files.map((file) => normalize(relative(repositoryRoot, file.path))),
  );
  for (const file of files) {
    const module = docModule(await getDoc(file.path), file.path);
    const owner = moduleExampleOwner(file, repositoryRoot);
    for (const [index, doc] of exampleDocs(module?.module_doc).entries()) {
      analyzeTag(doc, owner, index + 1, blocks, findings);
    }
  }

  const publicSymbols: SymbolExample[] = [];
  for (const entry of entries) {
    publicSymbols.push(
      ...symbolExamples(repositoryRoot, entry, await getDoc(entry.path)).filter((example) =>
        publishedPaths.has(example.declarationPath)
      ),
    );
  }
  for (const symbol of dedupeSymbols(publicSymbols)) {
    for (const [index, doc] of exampleDocs({ tags: symbol.tags }).entries()) {
      analyzeTag(doc, symbol.owner, index + 1, blocks, findings);
    }
  }

  const exemptions = blocks.filter((block) => block.exemptionReason !== undefined);
  const members = new Set(files.map((file) => file.member.name)).size;
  const census: JsdocExampleCensus = {
    members,
    files: files.length,
    examples: new Set(
      findings.map((finding) =>
        `${finding.owner.sourcePath}:${finding.owner.kind}:${
          finding.owner.symbol ?? ''
        }:${finding.exampleOrdinal}`
      ),
    ).size,
    candidates: blocks.length,
    checked: blocks.length - exemptions.length,
    exempt: exemptions.length,
    nonTypeScript: findings.filter((finding) => finding.disposition === 'nonTypeScript').length,
    unfenced: findings.filter((finding) => finding.disposition === 'unfenced').length,
    malformed: findings.filter((finding) => finding.disposition === 'malformed').length,
    failures: 0,
  };
  return { blocks, findings, exemptions, census };
}

/** Public declaration bindings selected by the same exact-owner policy as the corpus. */
export function publicSymbolBindings(analysis: JsdocExampleAnalysis): PublicSymbolBinding[] {
  return analysis.blocks.flatMap((block) => {
    const owner = block.owner;
    if (
      owner.kind !== 'symbol' || !owner.symbol || !owner.publicSpecifier || !owner.declarationKind
    ) return [];
    return [{
      symbol: owner.symbol,
      declarationPath: owner.sourcePath,
      declarationKind: owner.declarationKind,
      publicSpecifier: owner.publicSpecifier,
    }];
  });
}

/** Render the stable census line consumed by local and durable gate evidence. */
export function formatJsdocExampleCensus(
  census: JsdocExampleCensus,
  status: 'PASS' | 'FAIL',
): string {
  return `jsdoc examples: ${status} members=${census.members} files=${census.files} examples=${census.examples} candidates=${census.candidates} checked=${census.checked} exempt=${census.exempt} non_ts=${census.nonTypeScript} unfenced=${census.unfenced} malformed=${census.malformed} failures=${census.failures}`;
}
