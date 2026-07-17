import { walk } from 'jsr:@std/fs@^1.0.0/walk';
import { normalize, relative } from 'jsr:@std/path@^1.0.0';
import { discoverWorkspaceMembers as discoverDeclaredWorkspaceMembers } from '../deps/workspace.ts';
import { discoverWorkspaceMembers, type PublishableMember } from './publish-workspace.ts';

type JsonObject = Record<string, unknown>;

export interface IntentionalPublishExclusion {
  readonly path: string;
  readonly reason: string;
}

export interface PublishSetAuditResult {
  readonly intended: readonly PublishableMember[];
  readonly effective: readonly PublishableMember[];
  readonly excluded: readonly IntentionalPublishExclusion[];
  readonly missing: readonly PublishableMember[];
  readonly extra: readonly PublishableMember[];
}

export interface MarkdownPinFinding {
  readonly path: string;
  readonly line: number;
  readonly packageName: string;
  readonly pinnedVersion: string;
  readonly deferred: boolean;
}

export interface MarkdownPreflightResult {
  readonly violations: readonly MarkdownPinFinding[];
  readonly deferred: readonly MarkdownPinFinding[];
}

export interface ReleasePreflightResult {
  readonly publishSet: PublishSetAuditResult;
  readonly markdown: MarkdownPreflightResult;
}

const JSR_SCOPE = '@netscript/';
const DEFERRED_MARKDOWN_PREFIX = normalize('docs/site/');
const MARKDOWN_PIN_PATTERN = /(@netscript\/[a-z0-9-]+)@\^?(0\.0\.1-[a-z]+\.\d+)/g;

// A release member may be omitted only here, with a durable explanation. The
// intended set is deliberately discovered without consulting `publish:false`,
// so an accidental opt-out becomes a failing delta instead of disappearing.
export const INTENTIONAL_PUBLISH_EXCLUSIONS: readonly IntentionalPublishExclusion[] = [
  {
    path: 'packages/bench',
    reason: 'internal benchmark workspace; it is not a supported JSR consumer surface',
  },
  {
    path: 'packages/cli/e2e',
    reason: 'internal production-E2E fixture workspace; it is never published as a JSR package',
  },
];

/** Audit the effective publisher set against every intended scoped release member. */
export async function auditPublishSet(
  root: string = Deno.cwd(),
  exclusions: readonly IntentionalPublishExclusion[] = INTENTIONAL_PUBLISH_EXCLUSIONS,
): Promise<PublishSetAuditResult> {
  validateExclusions(exclusions);
  const discoveredIntent = await discoverIntendedMembers(root);
  const excludedPaths = new Set(exclusions.map((entry) => normalize(entry.path)));
  const intended = discoveredIntent.filter((member) => !excludedPaths.has(normalize(member.path)));
  const effective = (await discoverWorkspaceMembers(root)).filter((member) =>
    member.name.startsWith(JSR_SCOPE)
  );
  const effectiveKeys = new Set(effective.map(memberKey));
  const intendedKeys = new Set(intended.map(memberKey));
  const missing = intended.filter((member) => !effectiveKeys.has(memberKey(member)));
  const extra = effective.filter((member) => !intendedKeys.has(memberKey(member)));
  return { intended, effective, excluded: exclusions, missing, extra };
}

/** Find stale NetScript prerelease pins in owned and deferred markdown. */
export async function auditMarkdownPins(
  root: string,
  targetVersion: string,
): Promise<MarkdownPreflightResult> {
  const violations: MarkdownPinFinding[] = [];
  const deferred: MarkdownPinFinding[] = [];
  for await (
    const entry of walk(root, {
      includeDirs: false,
      exts: ['.md'],
      skip: [
        /(?:^|[/\\])\.git(?:[/\\]|$)/,
        /(?:^|[/\\])node_modules(?:[/\\]|$)/,
        /(?:^|[/\\])\.llm[/\\](?:runs|tmp)(?:[/\\]|$)/,
        /(?:^|[/\\])\.claude[/\\]worktrees(?:[/\\]|$)/,
        /(?:^|[/\\])\.data(?:[/\\]|$)/,
      ],
    })
  ) {
    const path = normalize(relative(root, entry.path));
    const source = await Deno.readTextFile(entry.path);
    for (const match of source.matchAll(MARKDOWN_PIN_PATTERN)) {
      const pinnedVersion = match[2];
      if (compareSemver(pinnedVersion, targetVersion) >= 0) continue;
      const finding: MarkdownPinFinding = {
        path,
        line: lineNumberAt(source, match.index),
        packageName: match[1],
        pinnedVersion,
        deferred: path.startsWith(DEFERRED_MARKDOWN_PREFIX),
      };
      (finding.deferred ? deferred : violations).push(finding);
    }
  }
  return { violations, deferred };
}

/** Run and print the read-only release-set and markdown policy audits. */
export async function runReleasePreflight(
  root: string,
  targetVersion: string,
): Promise<ReleasePreflightResult> {
  const publishSet = await auditPublishSet(root);
  console.log(`release:preflight publish-set — ${publishSet.effective.length} effective members`);
  for (const member of publishSet.effective) console.log(`  - ${member.name} (${member.path})`);
  for (const exclusion of publishSet.excluded) {
    console.log(`  - EXCLUDED ${exclusion.path}: ${exclusion.reason}`);
  }
  if (publishSet.missing.length || publishSet.extra.length) {
    throw new Error(formatPublishSetDelta(publishSet));
  }
  console.log('release:preflight publish-set — PASS (0 unexplained deltas)');

  const markdown = await auditMarkdownPins(root, targetVersion);
  for (const finding of markdown.deferred) {
    console.warn(
      `release:preflight markdown-pins — DEFERRED ${formatMarkdownFinding(finding)}`,
    );
  }
  if (markdown.violations.length) {
    throw new Error(
      `release:preflight markdown-pins — FAIL\n${
        markdown.violations.map((finding) => `  - ${formatMarkdownFinding(finding)}`).join('\n')
      }`,
    );
  }
  console.log(
    `release:preflight markdown-pins — PASS (0 blocking, ${markdown.deferred.length} deferred docs/site findings)`,
  );
  return { publishSet, markdown };
}

async function discoverIntendedMembers(root: string): Promise<PublishableMember[]> {
  return (await discoverDeclaredWorkspaceMembers(root))
    .filter((member) => member.name.startsWith(JSR_SCOPE))
    .map((member) => ({ path: member.root, name: member.name }))
    .sort((left, right) => left.path.localeCompare(right.path));
}

function validateExclusions(exclusions: readonly IntentionalPublishExclusion[]): void {
  for (const exclusion of exclusions) {
    if (!exclusion.path.trim() || !exclusion.reason.trim()) {
      throw new Error('Intentional publish exclusions require non-empty path and reason fields.');
    }
  }
}

function memberKey(member: PublishableMember): string {
  return `${normalize(member.path)}\0${member.name}`;
}

function formatPublishSetDelta(result: PublishSetAuditResult): string {
  return [
    'release:preflight publish-set — FAIL',
    ...result.missing.map((member) => `  - MISSING ${member.name} (${member.path})`),
    ...result.extra.map((member) => `  - EXTRA ${member.name} (${member.path})`),
  ].join('\n');
}

function formatMarkdownFinding(finding: MarkdownPinFinding): string {
  return `${finding.path}:${finding.line} ${finding.packageName}@${finding.pinnedVersion}; use a version-neutral snippet`;
}

function lineNumberAt(source: string, index: number): number {
  return source.slice(0, index).split('\n').length;
}

function parseJson(source: string): JsonObject {
  const value: unknown = JSON.parse(source);
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error('Expected a JSON object.');
  }
  return value as JsonObject;
}

function compareSemver(left: string, right: string): number {
  const parse = (value: string): { core: number[]; prerelease: Array<string | number> } => {
    const [core, prerelease = ''] = value.split('-', 2);
    return {
      core: core.split('.').map(Number),
      prerelease: prerelease.length
        ? prerelease.split('.').map((part) => /^\d+$/.test(part) ? Number(part) : part)
        : [],
    };
  };
  const a = parse(left);
  const b = parse(right);
  for (let index = 0; index < 3; index++) {
    if (a.core[index] !== b.core[index]) return a.core[index] > b.core[index] ? 1 : -1;
  }
  if (!a.prerelease.length || !b.prerelease.length) {
    return a.prerelease.length === b.prerelease.length ? 0 : a.prerelease.length ? -1 : 1;
  }
  for (let index = 0; index < Math.max(a.prerelease.length, b.prerelease.length); index++) {
    const leftPart = a.prerelease[index];
    const rightPart = b.prerelease[index];
    if (leftPart === rightPart) continue;
    if (leftPart === undefined) return -1;
    if (rightPart === undefined) return 1;
    if (typeof leftPart === 'number' && typeof rightPart === 'number') {
      return leftPart > rightPart ? 1 : -1;
    }
    if (typeof leftPart === 'number') return -1;
    if (typeof rightPart === 'number') return 1;
    return leftPart > rightPart ? 1 : -1;
  }
  return 0;
}

if (import.meta.main) {
  const root = Deno.args[0] ?? Deno.cwd();
  const config = parseJson(await Deno.readTextFile(`${root}/deno.json`));
  if (typeof config.version !== 'string') throw new Error('Root deno.json requires version.');
  await runReleasePreflight(root, Deno.args[1] ?? config.version);
}
