import { assertEquals } from '@std/assert';
import { dirname, isAbsolute, join, relative } from '@std/path';

const PUBLISH_ROOTS = ['packages', 'plugins'] as const;
const SOURCE_EXTENSIONS = ['.ts', '.tsx'] as const;
const INTERNAL_CODENAME =
  /\b(?:Group\s+[A-Z][A-Za-z0-9.-]*|Phase\s+(?:[A-Z][A-Za-z0-9.-]*|[0-9]+[A-Za-z])|Wave\s+(?:[A-Z][A-Za-z0-9.-]*|[0-9]+[A-Za-z]?)|Epic\s+(?:#[0-9]+|[A-Z][A-Za-z0-9.-]*|[0-9]+[A-Za-z]?))\b|\b[WT][0-9]+\b|\bnetscript#[0-9]+\b|(?<![A-Za-z])#[0-9]+\b/g;
const JSDOC_BLOCK = /\/\*\*[\s\S]*?\*\//g;
const JSDOC_INLINE_CODE = /`[^`]*`|\{@[^}]+\}/g;
const NON_PUBLISHED_PATH = /\/(?:e2e|fixtures|tests)\/|(?:_test|\.test)\.tsx?$/;
const STATIC_LOCAL_MODULE =
  /\b(?:import|export)\s+(?:type\s+)?(?:[^'";]*?\sfrom\s*)?['"](\.{1,2}\/[^'"]+)['"]/g;
const DYNAMIC_LOCAL_MODULE = /\bimport\s*\(\s*['"](\.{1,2}\/[^'"]+)['"]/g;

type Finding = Readonly<{
  path: string;
  line: number;
  term: string;
}>;

function scanJsdoc(source: string, path: string): readonly Finding[] {
  const findings: Finding[] = [];
  for (const block of source.matchAll(JSDOC_BLOCK)) {
    let inExample = false;
    let inFence = false;
    let blockOffset = 0;
    for (const line of block[0].split('\n')) {
      const prose = line.replace(/^\s*\/\*\*?\s?/, '').replace(/^\s*\*\s?/, '').trimEnd();
      const trimmed = prose.trimStart();
      if (trimmed.startsWith('@example')) inExample = true;
      else if (trimmed.startsWith('@')) inExample = false;
      if (trimmed.startsWith('```')) inFence = !inFence;

      if (!inExample && !inFence && !trimmed.startsWith('@')) {
        const searchable = prose.replaceAll(JSDOC_INLINE_CODE, '');
        for (const match of searchable.matchAll(INTERNAL_CODENAME)) {
          const offset = (block.index ?? 0) + blockOffset + (match.index ?? 0);
          findings.push({
            path,
            line: source.slice(0, offset).split('\n').length,
            term: match[0],
          });
        }
      }
      blockOffset += line.length + 1;
    }
  }
  return findings;
}

async function* packageRoots(root: string): AsyncGenerator<string> {
  for await (const entry of Deno.readDir(root)) {
    if (!entry.isDirectory) continue;
    const packageRoot = `${root}/${entry.name}`;
    try {
      const stat = await Deno.stat(`${packageRoot}/deno.json`);
      if (stat.isFile) yield packageRoot;
    } catch (error) {
      if (!(error instanceof Deno.errors.NotFound)) throw error;
    }
  }
}

function exportTargets(value: unknown): readonly string[] {
  if (typeof value === 'string') return value.startsWith('./') ? [value] : [];
  if (!value || typeof value !== 'object') return [];
  return Object.values(value).flatMap(exportTargets);
}

function localModuleSpecifiers(source: string): readonly string[] {
  return [
    ...source.matchAll(STATIC_LOCAL_MODULE),
    ...source.matchAll(DYNAMIC_LOCAL_MODULE),
  ].flatMap((match) => match[1] ? [match[1]] : []);
}

function isPublishedSourcePath(path: string): boolean {
  return SOURCE_EXTENSIONS.some((extension) => path.endsWith(extension)) &&
    !NON_PUBLISHED_PATH.test(path) &&
    !path.endsWith('.generated.ts');
}

async function collectEntrypointClosure(
  path: string,
  packageRoot: string,
  files: Set<string>,
): Promise<void> {
  if (files.has(path) || !isPublishedSourcePath(path)) return;
  const fromRoot = relative(packageRoot, path);
  if (fromRoot.startsWith('..') || isAbsolute(fromRoot)) return;

  let source: string;
  try {
    source = await Deno.readTextFile(path);
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) return;
    throw error;
  }

  files.add(path);
  for (const specifier of localModuleSpecifiers(source)) {
    const dependency = join(dirname(path), specifier.replace(/[?#].*$/, ''));
    await collectEntrypointClosure(dependency, packageRoot, files);
  }
}

async function publishedSourceFiles(): Promise<readonly string[]> {
  const files = new Set<string>();
  for (const root of PUBLISH_ROOTS) {
    for await (const packageRoot of packageRoots(root)) {
      const config = JSON.parse(await Deno.readTextFile(`${packageRoot}/deno.json`)) as {
        readonly exports?: unknown;
      };
      for (const target of exportTargets(config.exports)) {
        await collectEntrypointClosure(join(packageRoot, target), packageRoot, files);
      }
    }
  }
  return [...files].sort();
}

async function assertPublishedJsdocHasNoInternalCodenames(): Promise<void> {
  const findings: Finding[] = [];
  for (const path of await publishedSourceFiles()) {
    findings.push(...scanJsdoc(await Deno.readTextFile(path), path));
  }
  if (findings.length > 0) {
    throw new Error(
      `Published JSDoc contains internal codenames:\n${
        findings.map((finding) => `${finding.path}:${finding.line} ${finding.term}`).join('\n')
      }`,
    );
  }
}

Deno.test('published JSDoc excludes internal workstream codenames', async () => {
  await assertPublishedJsdocHasNoInternalCodenames();
});

Deno.test('published JSDoc codename scan flags prose and ignores JSDoc code contexts', () => {
  const fixture = [
    '/**',
    ' * Group F, Phase 7d, Wave 6, Epic Aurora, Epic #574, T1, W4, and #1554 are internal.',
    ' * `Pair<T1, T2>` and {@link T1} are code references.',
    ' * @template T1 A generic type parameter.',
    ' * @example',
    ' * ```ts',
    ' * type Pair<T1, T2> = readonly [T1, T2];',
    ' * ```',
    ' */',
  ].join('\n');

  assertEquals(scanJsdoc(fixture, 'fixture.ts'), [
    { path: 'fixture.ts', line: 2, term: 'Group F' },
    { path: 'fixture.ts', line: 2, term: 'Phase 7d' },
    { path: 'fixture.ts', line: 2, term: 'Wave 6' },
    { path: 'fixture.ts', line: 2, term: 'Epic Aurora' },
    { path: 'fixture.ts', line: 2, term: 'Epic #574' },
    { path: 'fixture.ts', line: 2, term: 'T1' },
    { path: 'fixture.ts', line: 2, term: 'W4' },
    { path: 'fixture.ts', line: 2, term: '#1554' },
  ]);
});

Deno.test('published JSDoc codename scan allows numbered algorithm phases', () => {
  const fixture = [
    '/**',
    ' * Phase 1 collects key names before Phase 2 fetches their values.',
    ' * Phase 3 — Publish the transformed result.',
    ' */',
  ].join('\n');

  assertEquals(scanJsdoc(fixture, 'fixture.ts'), []);
});

Deno.test('published source discovery follows package export closures', async () => {
  const files = await publishedSourceFiles();
  const algorithmDocs = [
    'packages/database/scripts/patch-prisma-client.ts',
    'packages/kv/adapters/redis.adapter.ts',
  ];

  assertEquals(
    ['packages/aspire/constants.ts', ...algorithmDocs].map((path) => files.includes(path)),
    [true, true, true],
  );
  for (const path of algorithmDocs) {
    assertEquals(scanJsdoc(await Deno.readTextFile(path), path), []);
  }
});
