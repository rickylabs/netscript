import { fileURLToPath } from 'node:url';

/** Build real registry/runtime sources with the workspace's current dependency catalog. */
const configUrl = new URL('./gap.deno.json', import.meta.url);
const config: { imports: Record<string, string>; catalog?: unknown } = JSON.parse(
  await Deno.readTextFile(configUrl),
);
const workspace: { catalog: Record<string, string> } = JSON.parse(
  await Deno.readTextFile(new URL('../../deno.json', import.meta.url)),
);
// Referencing a workspace entry from a standalone config also resolves its catalog imports.
// Derive the catalog each run so browser fixtures cannot pin a second dependency inventory.
config.catalog = workspace.catalog;
// This browser tool is outside the workspace; materialize its SSR renderer from the one root catalog.
config.imports['preact-render-to-string'] = `npm:preact-render-to-string@${
  workspace.catalog['preact-render-to-string']
}`;
for (const [name, target] of Object.entries(config.imports)) {
  if (target.startsWith('.')) config.imports[name] = new URL(target, configUrl).href;
}
await Deno.mkdir('test-results', { recursive: true });
const generatedConfig = 'test-results/gap.bundle.deno.json';
await Deno.writeTextFile(generatedConfig, JSON.stringify(config));
// Render the copy-only Markdown template through a real temporary consumer first.
const prose = await new Deno.Command(Deno.execPath(), {
  args: [
    'run',
    '--no-lock',
    '--config',
    fileURLToPath(new URL('../../deno.json', import.meta.url)),
    '--allow-read',
    '--allow-write',
    '--allow-run',
    'gap-prose-build.ts',
  ],
}).output();
if (!prose.success) {
  await Deno.stderr.write(prose.stderr);
  Deno.exit(prose.code);
}
const shell = await new Deno.Command(Deno.execPath(), {
  args: [
    'run',
    '--no-lock',
    '--config',
    generatedConfig,
    '--allow-read',
    '--allow-write=test-results',
    'gap-shell-ssr.tsx',
  ],
}).output();
if (!shell.success) {
  await Deno.stderr.write(shell.stderr);
  Deno.exit(shell.code);
}
const result = await new Deno.Command(Deno.execPath(), {
  args: [
    'bundle',
    '--no-lock',
    '--config',
    generatedConfig,
    '--platform',
    'browser',
    '--output',
    'test-results/gap-fixture.js',
    'gap-fixture.tsx',
  ],
}).output();
await Deno.stdout.write(result.stdout);
await Deno.stderr.write(result.stderr);
Deno.exit(result.code);
