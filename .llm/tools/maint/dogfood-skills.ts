import { dirname, fromFileUrl, join } from '@std/path';
import { ASPIRE_WORKFLOW_SKILLS } from '../../../packages/cli/src/public/features/agent/init/aspire-agent-initializer.ts';

const repo = dirname(dirname(dirname(dirname(fromFileUrl(import.meta.url)))));
const destination = join(repo, '.agents', 'generated', 'consumer-skills');
const check = Deno.args.includes('--check');

await Deno.mkdir(join(repo, '.llm', 'tmp'), { recursive: true });
const scratch = await Deno.makeTempDir({
  dir: join(repo, '.llm', 'tmp'),
  prefix: 'dogfood-consumer-skills-',
});
const generated = join(scratch, 'consumer-skills');

try {
  await Deno.mkdir(generated);
  await generate(generated);
  await normalizeMcpConfig(generated);
  await assertSurface(generated);
  if (check) {
    const stale = await diffTrees(generated, destination);
    console.log(
      JSON.stringify({
        gate: 'maint:dogfood-skills',
        status: stale.length ? 'FAIL' : 'OK',
        stale,
      }),
    );
    if (stale.length) Deno.exitCode = 1;
  } else {
    await removeIfPresent(destination);
    await Deno.rename(generated, destination);
    console.log(`Consumer agent bundle installed at ${destination}`);
  }
} finally {
  await removeIfPresent(scratch);
}

async function generate(projectRoot: string): Promise<void> {
  const command = new Deno.Command(Deno.execPath(), {
    cwd: projectRoot,
    args: [
      'run',
      '-A',
      join(repo, 'packages', 'cli', 'bin', 'netscript-dev.ts'),
      'agent',
      'init',
      '--host',
      'claude',
      '--editor',
      'none',
    ],
    stdout: 'inherit',
    stderr: 'inherit',
  });
  const result = await command.output();
  if (!result.success) throw new Error(`netscript agent init exited ${result.code}`);
}

async function normalizeMcpConfig(projectRoot: string): Promise<void> {
  const path = join(projectRoot, '.mcp.json');
  const config = object(JSON.parse(await Deno.readTextFile(path)), '.mcp.json');
  const servers = object(Reflect.get(config, 'mcpServers'), 'mcpServers');
  const netscript = object(Reflect.get(servers, 'netscript'), 'mcpServers.netscript');
  const args = Reflect.get(netscript, 'args');
  if (!Array.isArray(args) || !args.every((value) => typeof value === 'string')) {
    throw new Error('mcpServers.netscript.args must be strings');
  }
  const normalized = args.map((value) => {
    if (value === projectRoot) return '.';
    if (value === join(projectRoot, 'deno.json')) return 'deno.json';
    return value;
  });
  await Deno.writeTextFile(
    path,
    `${
      JSON.stringify(
        {
          ...config,
          mcpServers: { ...servers, netscript: { ...netscript, args: normalized } },
        },
        null,
        2,
      )
    }\n`,
  );
}

async function assertSurface(projectRoot: string): Promise<void> {
  const configText = await Deno.readTextFile(join(projectRoot, '.mcp.json'));
  const config = object(JSON.parse(configText), '.mcp.json');
  const servers = object(Reflect.get(config, 'mcpServers'), 'mcpServers');
  const aspire = object(Reflect.get(servers, 'aspire'), 'mcpServers.aspire');
  if (
    Reflect.get(aspire, 'command') !== 'aspire' ||
    JSON.stringify(Reflect.get(aspire, 'args')) !== JSON.stringify(['agent', 'mcp'])
  ) {
    throw new Error('Dogfood MCP config is missing the aspire agent mcp server');
  }
  if (configText.includes('jsr:@netscript/cli@0.0.2')) {
    throw new Error('Dogfood MCP config retained the stale 0.0.2 CLI specifier');
  }
  for (const skill of ASPIRE_WORKFLOW_SKILLS) {
    await Deno.stat(join(projectRoot, '.agents/skills', skill, 'SKILL.md'));
  }
  const claude = await tree(join(projectRoot, '.claude/skills'));
  if (
    claude.size !== 1 ||
    !claude.get(join('repo-skills', 'SKILL.md'))?.includes('.agents/skills/<name>/SKILL.md')
  ) {
    throw new Error('Dogfood Claude skills must contain only the canonical repo-skills bridge');
  }
}

async function diffTrees(expectedRoot: string, actualRoot: string): Promise<string[]> {
  const expected = await tree(expectedRoot);
  const actual = await tree(actualRoot);
  const stale = new Set<string>();
  for (const [path, content] of expected) {
    if (actual.get(path) !== content) stale.add(path);
  }
  for (const path of actual.keys()) {
    if (!expected.has(path)) stale.add(path);
  }
  return [...stale].sort();
}

async function tree(root: string): Promise<Map<string, string>> {
  const files = new Map<string, string>();
  try {
    for await (const path of walk(root, root)) {
      files.set(path.relative, await Deno.readTextFile(path.absolute));
    }
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) throw error;
  }
  return files;
}

async function* walk(
  root: string,
  current: string,
): AsyncGenerator<{ absolute: string; relative: string }> {
  for await (const entry of Deno.readDir(current)) {
    const absolute = join(current, entry.name);
    if (entry.isDirectory) yield* walk(root, absolute);
    else if (entry.isFile) yield { absolute, relative: absolute.slice(root.length + 1) };
  }
}

function object(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} is not an object`);
  }
  return Object.fromEntries(Object.entries(value));
}

async function removeIfPresent(path: string): Promise<void> {
  try {
    await Deno.remove(path, { recursive: true });
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) throw error;
  }
}
