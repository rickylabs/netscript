import { assertEquals } from '@std/assert';
import { fromFileUrl } from '@std/path';

// NetScript maintainer tools live under `maint:` / `.llm/tools/maint/`. Agent orchestration
// under `agentic:` / `.llm/tools/agentic/` is leaving NetScript (#2052), so a maintainer tool
// must never depend on it, and neither namespace may run the other's code.

const repo = fromFileUrl(new URL('../../../', import.meta.url)).replace(/\/$/, '');
const maintRoot = `${repo}/.llm/tools/maint`;

async function tasks(): Promise<Record<string, string>> {
  const config = JSON.parse(await Deno.readTextFile(`${repo}/deno.json`)) as {
    tasks: Record<string, string>;
  };
  return config.tasks;
}

async function sources(dir: string): Promise<string[]> {
  const found: string[] = [];
  for await (const entry of Deno.readDir(dir)) {
    const path = `${dir}/${entry.name}`;
    if (entry.isDirectory) found.push(...await sources(path));
    else if (entry.isFile && /\.(ts|tsx)$/.test(entry.name)) found.push(path);
  }
  return found;
}

Deno.test('maint: tasks run maintainer code only', async () => {
  const offenders = Object.entries(await tasks())
    .filter(([name]) => name.startsWith('maint:'))
    .filter(([, command]) =>
      !command.includes('.llm/tools/maint/') || command.includes('.llm/tools/agentic/')
    )
    .map(([name]) => name);
  assertEquals(offenders, []);
});

// Tasks whose entry point is Harness code at a pinned commit (agentic/task-separator_test.ts).
const HARNESS_AGENTIC_TASKS = new Set(['agentic:matrix', 'agentic:pr-checks']);

Deno.test('agentic: tasks run agentic code only, never maintainer code', async () => {
  const offenders = Object.entries(await tasks())
    .filter(([name]) => name.startsWith('agentic:') && !HARNESS_AGENTIC_TASKS.has(name))
    .filter(([, command]) =>
      !command.includes('.llm/tools/agentic/') || command.includes('.llm/tools/maint/')
    )
    .map(([name]) => name);
  assertEquals(offenders, []);
});

Deno.test('maintainer code imports nothing from the agentic tree', async () => {
  const offenders: string[] = [];
  for (const path of await sources(maintRoot)) {
    // Comments may name the old location; only static, side-effect and dynamic imports count.
    const code = (await Deno.readTextFile(path)).split('\n')
      .filter((line) => !/^\s*(\/\/|\*|\/\*)/.test(line)).join('\n');
    const specifiers = [
      ...code.matchAll(/\bfrom\s+['"]([^'"]+)['"]/g),
      ...code.matchAll(/\bimport\s+['"]([^'"]+)['"]/g),
      ...code.matchAll(/\bimport\(\s*['"]([^'"]+)['"]/g),
    ].map((match) => match[1]);
    for (const specifier of specifiers) {
      if (/(^|\/)agentic\//.test(specifier)) {
        offenders.push(`${path.slice(repo.length + 1)} imports ${specifier}`);
      }
    }
  }
  assertEquals(offenders, []);
});
