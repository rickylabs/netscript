import { assertEquals, assertRejects } from '@std/assert';

const PUBLISH_ROOTS = ['packages', 'plugins'] as const;
const SOURCE_EXTENSIONS = ['.ts', '.tsx'] as const;
const INTERNAL_CODENAME = /Group [A-Z]\b|\bT[0-9]\b/g;
const JSDOC_BLOCK = /\/\*\*[\s\S]*?\*\//g;

type Finding = Readonly<{
  path: string;
  line: number;
  term: string;
}>;

function scanJsdoc(source: string, path: string): readonly Finding[] {
  const findings: Finding[] = [];
  for (const block of source.matchAll(JSDOC_BLOCK)) {
    for (const match of block[0].matchAll(INTERNAL_CODENAME)) {
      const offset = (block.index ?? 0) + (match.index ?? 0);
      findings.push({
        path,
        line: source.slice(0, offset).split('\n').length,
        term: match[0],
      });
    }
  }
  return findings;
}

async function* sourceFiles(root: string): AsyncGenerator<string> {
  for await (const entry of Deno.readDir(root)) {
    const path = `${root}/${entry.name}`;
    if (entry.isDirectory) {
      yield* sourceFiles(path);
      continue;
    }
    if (
      path.includes('/src/') &&
      SOURCE_EXTENSIONS.some((extension) => path.endsWith(extension)) &&
      !path.endsWith('.generated.ts')
    ) {
      yield path;
    }
  }
}

async function assertPublishedJsdocHasNoInternalCodenames(): Promise<void> {
  const findings: Finding[] = [];
  for (const root of PUBLISH_ROOTS) {
    for await (const path of sourceFiles(root)) {
      findings.push(...scanJsdoc(await Deno.readTextFile(path), path));
    }
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

Deno.test('published JSDoc codename scan rejects prose but ignores code identifiers', async () => {
  const fixture = [
    '/** Trigger definitions known by Group F. */',
    'export type Pair<T1, T2> = readonly [T1, T2];',
  ].join('\n');

  assertEquals(scanJsdoc(fixture, 'fixture.ts'), [
    { path: 'fixture.ts', line: 1, term: 'Group F' },
  ]);
  await assertRejects(
    () =>
      Promise.resolve(scanJsdoc('/** T1 processor. */', 'fixture.ts')).then((findings) => {
        if (findings.length > 0) throw new Error(findings[0].term);
      }),
    Error,
    'T1',
  );
});
