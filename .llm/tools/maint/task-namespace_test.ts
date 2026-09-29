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

Deno.test('agentic: tasks never run maintainer code', async () => {
  const offenders = Object.entries(await tasks())
    .filter(([name, command]) =>
      name.startsWith('agentic:') && command.includes('.llm/tools/maint/')
    )
    .map(([name]) => name);
  assertEquals(offenders, []);
});

Deno.test('maintainer code imports nothing from the agentic tree', async () => {
  const offenders: string[] = [];
  for (const path of await sources(maintRoot)) {
    const source = await Deno.readTextFile(path);
    for (const match of source.matchAll(/from\s+['"]([^'"]+)['"]/g)) {
      if (/(^|\/)agentic\//.test(match[1])) {
        offenders.push(`${path.slice(repo.length + 1)} imports ${match[1]}`);
      }
    }
  }
  assertEquals(offenders, []);
});
