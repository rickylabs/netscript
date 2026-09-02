import { assertEquals } from '@std/assert';
import { relative } from '@std/path';

const aspireStopAll = ['aspire stop ', '--all'].join('');
const forbidden = [
  ['docker ps ', '-aq'].join(''),
  ['docker rm -f ', '$('].join(''),
  ['docker container ', 'prune'].join(''),
  ['docker system ', 'prune'].join(''),
  aspireStopAll,
];
const xargsDockerRemove = new RegExp(['xargs', '.*docker', 'rm'].join('\\s+'), 'i');

Deno.test('repository contains no shared-host bulk teardown command', async () => {
  const root = new URL('../../../../', import.meta.url).pathname;
  const findings: string[] = [];
  for await (const entry of walk(root, root)) {
    const path = relative(root, entry);
    if (path.startsWith('.llm/runs/') || path.startsWith('.git/')) continue;
    const text = await Deno.readTextFile(entry).catch(() => '');
    for (const phrase of forbidden) if (text.includes(phrase)) findings.push(`${path}: ${phrase}`);
    if (xargsDockerRemove.test(text)) findings.push(`${path}: xargs docker removal`);
  }
  assertEquals(findings, []);
});

/** Directories with no scannable source, skipped before descending rather than after yielding. */
const WALK_SKIP = new Set(['.git', 'node_modules', '_fresh', '.netscript', 'runs']);

async function* walk(root: string, repositoryRoot: string): AsyncGenerator<string> {
  for await (const entry of Deno.readDir(root)) {
    const path = `${root}/${entry.name}`;
    const repositoryPath = relative(repositoryRoot, path);
    if (
      entry.isDirectory &&
      (WALK_SKIP.has(entry.name) || repositoryPath === '.llm/tmp')
    ) continue;
    if (entry.isDirectory) yield* walk(path, repositoryRoot);
    else if (entry.isFile) yield path;
  }
}
