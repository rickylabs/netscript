/**
 * Deterministic comparison-surface measurement for pinned, authorized local sources.
 *
 * The tool verifies every source root's Git revision before reading any manifested source file. It emits
 * identifiers, classifications, hashes, and aggregate counts only; source text is never included
 * in output or error messages.
 *
 * Counting policy:
 * - physical lines: UTF-8 text after CRLF/CR normalization; a trailing newline terminates the
 *   final line without adding a phantom line; an empty file has zero lines;
 * - nonblank lines: physical lines containing a non-whitespace code point;
 * - comment lines: nonblank lines whose first non-whitespace token starts `//`, `/*`, or `<!--`,
 *   plus nonblank continuation lines inside those block-comment forms; inline comments after code
 *   are not counted as comment lines;
 * - tokens: Unicode letter/number/underscore runs count as one token and every other
 *   non-whitespace code point counts as one token. Comments and string contents remain inputs.
 *
 * Usage:
 * deno run --allow-read --allow-write --allow-run \
 *   .llm/tools/docs/measure-comparison-surface.ts \
 *   --manifest docs/site/comparisons/evidence/session-source-manifest.json \
 *   --root eis-chat=<authorized-local-root> \
 *   --observed-at <RFC3339> \
 *   --output docs/site/comparisons/evidence/session-measurements.json
 */

import { dirname, isAbsolute, join, relative, resolve } from '@std/path';

export const TOOL_NAME = 'measure-comparison-surface';
export const TOOL_VERSION = '1.0.0';

export const CLASSIFICATIONS = [
  'framework-glue',
  'consumer-orchestration',
  'presentation-domain-held-constant',
  'generated',
  'excluded',
] as const;

export const METRIC_NAMES = [
  'physicalLines',
  'nonblankLines',
  'commentLines',
  'tokens',
] as const;

export type Classification = (typeof CLASSIFICATIONS)[number];
export type MetricName = (typeof METRIC_NAMES)[number];

export interface CountMetrics {
  physicalLines: number;
  nonblankLines: number;
  commentLines: number;
  tokens: number;
}

export interface ManifestFile {
  path: string;
  classification: Classification;
  sha256: string;
}

export interface ManifestSource {
  id: string;
  repository: string;
  revision: string;
  access: 'authorized-private-local-checkout-required';
  requireClean: boolean;
  files: ManifestFile[];
}

export interface DeferredMetric {
  status: 'deferred';
  owner: string;
}

export interface UnmatchedSource {
  id: string;
  framework: string;
  version: string;
  status: 'absent';
  reason: string;
  measurements: Record<MetricName, DeferredMetric>;
}

export interface MeasurementPolicy {
  physicalLines: string;
  nonblankLines: string;
  commentLines: string;
  tokens: string;
  includedTotals: string;
  timestampField: '/observedAt';
}

export interface ReproductionContract {
  precondition: string;
  command: string;
  privateSourcePolicy: string;
}

export interface ComparisonManifest {
  schemaVersion: 1;
  caseId: string;
  toolVersion: string;
  measurementPolicy: MeasurementPolicy;
  reproduction: ReproductionContract;
  sources: ManifestSource[];
  unmatchedSources: UnmatchedSource[];
}

export interface MeasuredFile extends ManifestFile {
  counts: CountMetrics;
}

export interface AggregateMetrics extends CountMetrics {
  fileCount: number;
}

export interface MeasuredSource {
  id: string;
  repository: string;
  revision: string;
  access: ManifestSource['access'];
  status: 'measured';
  files: MeasuredFile[];
  totalsByClassification: Record<Classification, AggregateMetrics>;
  includedTotals: AggregateMetrics;
  presentationHeldConstantTotals: AggregateMetrics;
}

export interface MeasurementOutput {
  schemaVersion: 1;
  caseId: string;
  tool: {
    name: typeof TOOL_NAME;
    version: typeof TOOL_VERSION;
  };
  observedAt: string;
  measurementPolicy: MeasurementPolicy;
  sources: MeasuredSource[];
  unmatchedSources: UnmatchedSource[];
}

interface CliOptions {
  manifestPath: string;
  roots: Map<string, string>;
  observedAt: string;
  outputPath?: string;
}

interface VerifiedRoot {
  path: string;
  realPath: string;
}

export interface RootVerifier {
  revision(sourceId: string, realRoot: string): Promise<string>;
  clean(sourceId: string, realRoot: string): Promise<boolean>;
}

const ZERO_COUNTS: CountMetrics = {
  physicalLines: 0,
  nonblankLines: 0,
  commentLines: 0,
  tokens: 0,
};

function fail(message: string): never {
  throw new Error(message);
}

function objectValue(value: unknown, context: string): Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    fail(`${context} must be an object`);
  }
  return value as Record<string, unknown>;
}

function stringValue(value: unknown, context: string): string {
  if (typeof value !== 'string' || value.length === 0) fail(`${context} must be a nonempty string`);
  return value;
}

function booleanValue(value: unknown, context: string): boolean {
  if (typeof value !== 'boolean') fail(`${context} must be a boolean`);
  return value;
}

function literalValue<T extends string>(value: unknown, literal: T, context: string): T {
  if (value !== literal) fail(`${context} must be ${JSON.stringify(literal)}`);
  return literal;
}

function arrayValue(value: unknown, context: string): unknown[] {
  if (!Array.isArray(value)) fail(`${context} must be an array`);
  return value;
}

function classificationValue(value: unknown, context: string): Classification {
  if (typeof value !== 'string' || !CLASSIFICATIONS.includes(value as Classification)) {
    fail(`${context} must be one of ${CLASSIFICATIONS.join(', ')}`);
  }
  return value as Classification;
}

function validatePath(path: string, context: string): string {
  if (isAbsolute(path) || path.includes('\\')) fail(`${context} must be a portable relative path`);
  const segments = path.split('/');
  if (segments.some((segment) => segment === '' || segment === '.' || segment === '..')) {
    fail(`${context} contains an unsafe path segment`);
  }
  return path;
}

function validateRevision(revision: string, context: string): string {
  if (!/^[0-9a-f]{40}$/.test(revision)) fail(`${context} must be a lowercase 40-character Git SHA`);
  return revision;
}

function validateSha256(hash: string, context: string): string {
  if (!/^[0-9a-f]{64}$/.test(hash)) fail(`${context} must be a lowercase SHA-256 digest`);
  return hash;
}

function parsePolicy(value: unknown): MeasurementPolicy {
  const policy = objectValue(value, 'measurementPolicy');
  return {
    physicalLines: stringValue(policy.physicalLines, 'measurementPolicy.physicalLines'),
    nonblankLines: stringValue(policy.nonblankLines, 'measurementPolicy.nonblankLines'),
    commentLines: stringValue(policy.commentLines, 'measurementPolicy.commentLines'),
    tokens: stringValue(policy.tokens, 'measurementPolicy.tokens'),
    includedTotals: stringValue(policy.includedTotals, 'measurementPolicy.includedTotals'),
    timestampField: literalValue(
      policy.timestampField,
      '/observedAt',
      'measurementPolicy.timestampField',
    ),
  };
}

function parseReproduction(value: unknown): ReproductionContract {
  const reproduction = objectValue(value, 'reproduction');
  return {
    precondition: stringValue(reproduction.precondition, 'reproduction.precondition'),
    command: stringValue(reproduction.command, 'reproduction.command'),
    privateSourcePolicy: stringValue(
      reproduction.privateSourcePolicy,
      'reproduction.privateSourcePolicy',
    ),
  };
}

function parseManifestFile(value: unknown, context: string): ManifestFile {
  const file = objectValue(value, context);
  return {
    path: validatePath(stringValue(file.path, `${context}.path`), `${context}.path`),
    classification: classificationValue(file.classification, `${context}.classification`),
    sha256: validateSha256(stringValue(file.sha256, `${context}.sha256`), `${context}.sha256`),
  };
}

function parseManifestSource(value: unknown, index: number): ManifestSource {
  const context = `sources[${index}]`;
  const source = objectValue(value, context);
  const files = arrayValue(source.files, `${context}.files`).map((file, fileIndex) =>
    parseManifestFile(file, `${context}.files[${fileIndex}]`)
  );
  if (files.length === 0) fail(`${context}.files must not be empty`);
  const paths = new Set<string>();
  for (const file of files) {
    if (paths.has(file.path)) fail(`${context}.files contains duplicate path ${file.path}`);
    paths.add(file.path);
  }
  return {
    id: stringValue(source.id, `${context}.id`),
    repository: stringValue(source.repository, `${context}.repository`),
    revision: validateRevision(
      stringValue(source.revision, `${context}.revision`),
      `${context}.revision`,
    ),
    access: literalValue(
      source.access,
      'authorized-private-local-checkout-required',
      `${context}.access`,
    ),
    requireClean: booleanValue(source.requireClean, `${context}.requireClean`),
    files,
  };
}

function parseDeferredMetric(value: unknown, context: string): DeferredMetric {
  const metric = objectValue(value, context);
  return {
    status: literalValue(metric.status, 'deferred', `${context}.status`),
    owner: stringValue(metric.owner, `${context}.owner`),
  };
}

function parseUnmatchedSource(value: unknown, index: number): UnmatchedSource {
  const context = `unmatchedSources[${index}]`;
  const source = objectValue(value, context);
  const measurements = objectValue(source.measurements, `${context}.measurements`);
  const parsed = {} as Record<MetricName, DeferredMetric>;
  for (const metric of METRIC_NAMES) {
    parsed[metric] = parseDeferredMetric(measurements[metric], `${context}.measurements.${metric}`);
  }
  return {
    id: stringValue(source.id, `${context}.id`),
    framework: stringValue(source.framework, `${context}.framework`),
    version: stringValue(source.version, `${context}.version`),
    status: literalValue(source.status, 'absent', `${context}.status`),
    reason: stringValue(source.reason, `${context}.reason`),
    measurements: parsed,
  };
}

export function parseManifest(value: unknown): ComparisonManifest {
  const manifest = objectValue(value, 'manifest');
  if (manifest.schemaVersion !== 1) fail('schemaVersion must be 1');
  const sources = arrayValue(manifest.sources, 'sources').map(parseManifestSource);
  if (sources.length === 0) fail('sources must not be empty');
  const sourceIds = new Set<string>();
  for (const source of sources) {
    if (sourceIds.has(source.id)) fail(`sources contains duplicate id ${source.id}`);
    sourceIds.add(source.id);
  }
  const unmatchedSources = arrayValue(manifest.unmatchedSources, 'unmatchedSources').map(
    parseUnmatchedSource,
  );
  if (unmatchedSources.length === 0) {
    fail('unmatchedSources must explicitly describe absent inputs');
  }

  const toolVersion = stringValue(manifest.toolVersion, 'toolVersion');
  if (toolVersion !== TOOL_VERSION) {
    fail(`Manifest toolVersion ${toolVersion} does not match tool ${TOOL_VERSION}`);
  }

  return {
    schemaVersion: 1,
    caseId: stringValue(manifest.caseId, 'caseId'),
    toolVersion,
    measurementPolicy: parsePolicy(manifest.measurementPolicy),
    reproduction: parseReproduction(manifest.reproduction),
    sources,
    unmatchedSources,
  };
}

function physicalLines(text: string): string[] {
  const normalized = text.replaceAll('\r\n', '\n').replaceAll('\r', '\n');
  if (normalized.length === 0) return [];
  const withoutTerminalNewline = normalized.endsWith('\n') ? normalized.slice(0, -1) : normalized;
  return withoutTerminalNewline.split('\n');
}

export function countText(text: string): CountMetrics {
  const normalized = text.replaceAll('\r\n', '\n').replaceAll('\r', '\n');
  const lines = physicalLines(normalized);
  let nonblankLines = 0;
  let commentLines = 0;
  let block: 'c-style' | 'html' | undefined;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length === 0) continue;
    nonblankLines++;

    if (block) {
      commentLines++;
      const terminator = block === 'c-style' ? '*/' : '-->';
      if (trimmed.includes(terminator)) block = undefined;
      continue;
    }

    if (trimmed.startsWith('//')) {
      commentLines++;
      continue;
    }
    if (trimmed.startsWith('/*')) {
      commentLines++;
      if (!trimmed.includes('*/', 2)) block = 'c-style';
      continue;
    }
    if (trimmed.startsWith('<!--')) {
      commentLines++;
      if (!trimmed.includes('-->', 4)) block = 'html';
    }
  }

  return {
    physicalLines: lines.length,
    nonblankLines,
    commentLines,
    tokens: normalized.match(/[\p{L}\p{N}_]+|[^\s]/gu)?.length ?? 0,
  };
}

export async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', Uint8Array.from(bytes).buffer);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function emptyAggregate(): AggregateMetrics {
  return { fileCount: 0, ...ZERO_COUNTS };
}

function addCounts(target: AggregateMetrics, counts: CountMetrics): void {
  target.fileCount++;
  for (const metric of METRIC_NAMES) target[metric] += counts[metric];
}

function aggregateClassifications(files: MeasuredFile[]): Record<Classification, AggregateMetrics> {
  const totals = Object.fromEntries(
    CLASSIFICATIONS.map((classification) => [classification, emptyAggregate()]),
  ) as Record<Classification, AggregateMetrics>;
  for (const file of files) addCounts(totals[file.classification], file.counts);
  return totals;
}

function combineAggregates(
  totals: Record<Classification, AggregateMetrics>,
  classifications: Classification[],
): AggregateMetrics {
  const combined = emptyAggregate();
  for (const classification of classifications) {
    const current = totals[classification];
    combined.fileCount += current.fileCount;
    for (const metric of METRIC_NAMES) combined[metric] += current[metric];
  }
  return combined;
}

async function runGit(sourceId: string, root: string, args: string[]): Promise<string> {
  const result = await new Deno.Command('git', {
    args: ['-C', root, ...args],
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  if (!result.success) {
    const detail = new TextDecoder().decode(result.stderr).trim();
    fail(`Git verification failed for source ${sourceId}${detail ? `: ${detail}` : ''}`);
  }
  return new TextDecoder().decode(result.stdout).trim();
}

export const gitRootVerifier: RootVerifier = {
  revision: (sourceId, realRoot) => runGit(sourceId, realRoot, ['rev-parse', 'HEAD']),
  clean: async (sourceId, realRoot) => {
    const status = await runGit(sourceId, realRoot, [
      'status',
      '--porcelain=v1',
      '--untracked-files=all',
    ]);
    return status.length === 0;
  },
};

async function verifyRoots(
  manifest: ComparisonManifest,
  roots: ReadonlyMap<string, string>,
  verifier: RootVerifier,
): Promise<Map<string, VerifiedRoot>> {
  const expectedIds = new Set(manifest.sources.map((source) => source.id));
  for (const id of roots.keys()) {
    if (!expectedIds.has(id)) fail(`Root supplied for unknown source ${id}`);
  }

  const verified = new Map<string, VerifiedRoot>();
  for (const source of manifest.sources) {
    const root = roots.get(source.id);
    if (!root) fail(`Missing authorized local root for source ${source.id}`);
    let realRoot: string;
    try {
      realRoot = await Deno.realPath(root);
    } catch {
      fail(`Authorized local root does not exist for source ${source.id}`);
    }
    const revision = await verifier.revision(source.id, realRoot);
    if (revision !== source.revision) {
      fail(
        `Revision mismatch for source ${source.id}: expected ${source.revision}, observed ${revision}`,
      );
    }
    if (source.requireClean && !(await verifier.clean(source.id, realRoot))) {
      fail(`Authorized local root is not clean for source ${source.id}`);
    }
    verified.set(source.id, { path: root, realPath: realRoot });
  }
  return verified;
}

async function resolveSourceFile(
  sourceId: string,
  root: VerifiedRoot,
  manifestPath: string,
): Promise<string> {
  validatePath(manifestPath, `source ${sourceId} path`);
  const candidate = join(root.realPath, manifestPath);
  let realFile: string;
  try {
    realFile = await Deno.realPath(candidate);
  } catch {
    fail(`Missing source file ${sourceId}:${manifestPath}`);
  }
  const fromRoot = relative(root.realPath, realFile);
  if (fromRoot.startsWith('..') || isAbsolute(fromRoot)) {
    fail(`Source file escapes authorized root ${sourceId}:${manifestPath}`);
  }
  const stat = await Deno.stat(realFile);
  if (!stat.isFile) fail(`Source path is not a file ${sourceId}:${manifestPath}`);
  return realFile;
}

async function measureSource(source: ManifestSource, root: VerifiedRoot): Promise<MeasuredSource> {
  const files: MeasuredFile[] = [];
  for (const manifestFile of source.files) {
    const filePath = await resolveSourceFile(source.id, root, manifestFile.path);
    const bytes = await Deno.readFile(filePath);
    const actualHash = await sha256Hex(bytes);
    if (actualHash !== manifestFile.sha256) {
      fail(
        `Hash mismatch for ${source.id}:${manifestFile.path}: expected ${manifestFile.sha256}, observed ${actualHash}`,
      );
    }
    let text: string;
    try {
      text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    } catch {
      fail(`Source file is not valid UTF-8 ${source.id}:${manifestFile.path}`);
    }
    files.push({ ...manifestFile, counts: countText(text) });
  }

  const totalsByClassification = aggregateClassifications(files);
  return {
    id: source.id,
    repository: source.repository,
    revision: source.revision,
    access: source.access,
    status: 'measured',
    files,
    totalsByClassification,
    includedTotals: combineAggregates(totalsByClassification, [
      'framework-glue',
      'consumer-orchestration',
    ]),
    presentationHeldConstantTotals: combineAggregates(totalsByClassification, [
      'presentation-domain-held-constant',
    ]),
  };
}

function validateObservedAt(value: string): string {
  if (Number.isNaN(Date.parse(value)) || !/^\d{4}-\d{2}-\d{2}T/.test(value)) {
    fail('observedAt must be an RFC3339 timestamp');
  }
  return value;
}

export async function measureComparisonSurface(
  manifest: ComparisonManifest,
  roots: ReadonlyMap<string, string>,
  observedAt: string,
  verifier: RootVerifier = gitRootVerifier,
): Promise<MeasurementOutput> {
  const timestamp = validateObservedAt(observedAt);

  // Verify every root and revision before the first source-file read.
  const verifiedRoots = await verifyRoots(manifest, roots, verifier);
  const sources: MeasuredSource[] = [];
  for (const source of manifest.sources) {
    sources.push(await measureSource(source, verifiedRoots.get(source.id)!));
  }

  return {
    schemaVersion: 1,
    caseId: manifest.caseId,
    tool: { name: TOOL_NAME, version: TOOL_VERSION },
    observedAt: timestamp,
    measurementPolicy: manifest.measurementPolicy,
    sources,
    unmatchedSources: manifest.unmatchedSources,
  };
}

export function serializeMeasurement(output: MeasurementOutput): string {
  return `${JSON.stringify(output, null, 2)}\n`;
}

function printHelp(): void {
  console.log([
    'Usage:',
    `  deno run --allow-read --allow-write --allow-run ${
      import.meta.filename ?? '.llm/tools/docs/measure-comparison-surface.ts'
    } \\`,
    '    --manifest <path> --root <source-id>=<authorized-local-root> \\',
    '    --observed-at <RFC3339> [--output <path>]',
    '',
    'The output contains paths, classifications, hashes, and aggregates only.',
  ].join('\n'));
}

function requireValue(args: string[], index: number, flag: string): string {
  const value = args[index + 1];
  if (!value) fail(`Missing value for ${flag}`);
  return value;
}

function parseCli(args: string[]): CliOptions | undefined {
  if (args.includes('--help')) {
    printHelp();
    return undefined;
  }
  let manifestPath: string | undefined;
  let observedAt: string | undefined;
  let outputPath: string | undefined;
  const roots = new Map<string, string>();

  for (let index = 0; index < args.length; index++) {
    const flag = args[index];
    switch (flag) {
      case '--manifest':
        manifestPath = requireValue(args, index, flag);
        index++;
        break;
      case '--root': {
        const binding = requireValue(args, index, flag);
        index++;
        const separator = binding.indexOf('=');
        if (separator <= 0 || separator === binding.length - 1) {
          fail('--root must be <source-id>=<authorized-local-root>');
        }
        const id = binding.slice(0, separator);
        if (roots.has(id)) fail(`Duplicate root binding for source ${id}`);
        roots.set(id, binding.slice(separator + 1));
        break;
      }
      case '--observed-at':
        observedAt = requireValue(args, index, flag);
        index++;
        break;
      case '--output':
        outputPath = requireValue(args, index, flag);
        index++;
        break;
      default:
        fail(`Unknown argument ${flag}`);
    }
  }

  if (!manifestPath) fail('Missing --manifest');
  if (!observedAt) fail('Missing --observed-at');
  return { manifestPath, roots, observedAt, outputPath };
}

function pathInside(root: string, candidate: string): boolean {
  const fromRoot = relative(root, candidate);
  return fromRoot === '' || (!fromRoot.startsWith('..') && !isAbsolute(fromRoot));
}

async function refuseOutputInsideRoots(outputPath: string, roots: ReadonlyMap<string, string>) {
  const outputParent = await Deno.realPath(dirname(resolve(outputPath)));
  const resolvedOutput = join(outputParent, outputPath.split(/[\\/]/).at(-1)!);
  for (const [id, root] of roots) {
    const realRoot = await Deno.realPath(root);
    if (pathInside(realRoot, resolvedOutput)) {
      fail(`Refusing to write output inside authorized source root ${id}`);
    }
  }
}

if (import.meta.main) {
  try {
    const options = parseCli(Deno.args);
    if (options) {
      if (options.outputPath) await refuseOutputInsideRoots(options.outputPath, options.roots);
      const manifestText = await Deno.readTextFile(options.manifestPath);
      const manifest = parseManifest(JSON.parse(manifestText));
      const output = await measureComparisonSurface(manifest, options.roots, options.observedAt);
      const serialized = serializeMeasurement(output);
      if (options.outputPath) await Deno.writeTextFile(options.outputPath, serialized);
      else await Deno.stdout.write(new TextEncoder().encode(serialized));
    }
  } catch (error) {
    console.error(`${TOOL_NAME}: ${error instanceof Error ? error.message : String(error)}`);
    Deno.exit(1);
  }
}
