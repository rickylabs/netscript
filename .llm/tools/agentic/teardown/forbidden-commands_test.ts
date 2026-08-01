import { assertEquals } from '@std/assert';
import { relative } from '@std/path';

const forbidden = [
  ['docker ps ', '-aq'].join(''),
  ['docker rm -f ', '$('].join(''),
  ['docker container ', 'prune'].join(''),
  ['docker system ', 'prune'].join(''),
  ['aspire stop ', '--all'].join(''),
];
const xargsDockerRemove = new RegExp(['xargs', '.*docker', 'rm'].join('\\s+'), 'i');

Deno.test('repository contains no shared-host bulk teardown command', async () => {
  const root = new URL('../../../../', import.meta.url).pathname;
  const findings: string[] = [];
  for await (const entry of walk(root)) {
    const path = relative(root, entry);
    if (path.startsWith('.llm/runs/') || path.startsWith('.git/')) continue;
    const text = await Deno.readTextFile(entry).catch(() => '');
    for (const phrase of forbidden) if (text.includes(phrase)) findings.push(`${path}: ${phrase}`);
    if (xargsDockerRemove.test(text)) findings.push(`${path}: xargs docker removal`);
  }
  assertEquals(findings, []);
});

async function* walk(root: string): AsyncGenerator<string> {
  for await (const entry of Deno.readDir(root)) {
    const path = `${root}/${entry.name}`;
    if (entry.isDirectory) yield* walk(path);
    else if (entry.isFile) yield path;
  }
}
