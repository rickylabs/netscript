/** Check the exact comparison snippets against local public exports as consumer code. */
interface Config {
  name?: string;
  exports?: Record<string, string>;
  imports?: Record<string, string>;
  catalog?: Record<string, string>;
  compilerOptions?: Record<string, unknown>;
}
const root = new URL('../../', import.meta.url);
const config: Config = JSON.parse(await Deno.readTextFile(new URL('deno.json', root)));
const imports: Record<string, string> = {};
for (const [name, target] of Object.entries(config.imports ?? {})) {
  imports[name] = target.startsWith('.') ? new URL(target, root).href : target;
}
for (const area of ['packages', 'plugins']) {
  const directory = new URL(`${area}/`, root);
  const entries = await Array.fromAsync(Deno.readDir(directory));
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (!entry.isDirectory) continue;
    const packageRoot = new URL(`${entry.name}/`, directory);
    let member: Config;
    try {
      member = JSON.parse(await Deno.readTextFile(new URL('deno.json', packageRoot)));
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) continue;
      throw error;
    }
    if (!member.name) continue;
    for (const [subpath, target] of Object.entries(member.exports ?? {})) {
      imports[member.name + (subpath === '.' ? '' : subpath.slice(1))] =
        new URL(target, packageRoot).href;
    }
    for (const [name, target] of Object.entries(member.imports ?? {})) {
      if (!name.startsWith('@netscript/') && !target.startsWith('.') && !imports[name]) {
        imports[name] = target;
      }
    }
  }
}
for (const [name, version] of Object.entries(config.catalog ?? {})) {
  imports[name] ??= `npm:${name}@${version}`;
}
const scratch = await Deno.makeTempDir({ prefix: 'comparison-consumer-' });
try {
  const consumerConfig = `${scratch}/deno.json`;
  await Deno.writeTextFile(
    consumerConfig,
    JSON.stringify({
      workspace: [],
      lock: false,
      catalog: config.catalog,
      imports,
      compilerOptions: {
        ...config.compilerOptions,
        // App examples are consumers, not isolated declaration publication units.
        isolatedDeclarations: false,
        jsx: 'react-jsx',
        jsxImportSource: 'preact',
      },
    }),
  );
  const result = await new Deno.Command(Deno.execPath(), {
    args: [
      'run',
      '--allow-read',
      '--allow-run',
      new URL('.llm/tools/run-deno-check.ts', root).pathname,
      '--root',
      new URL('docs/site/comparisons/_examples/', root).pathname,
      '--ext',
      'ts,tsx',
      '--deno-arg',
      '--config',
      '--deno-arg',
      consumerConfig,
    ],
    cwd: root,
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  await Deno.stdout.write(result.stdout);
  await Deno.stderr.write(result.stderr);
  if (!result.success) Deno.exitCode = result.code;
} finally {
  await Deno.remove(scratch, { recursive: true });
}
