/** Render only this slice into an isolated consumer workspace using existing dependency pins. */
import { dirname, fromFileUrl, join, resolve, toFileUrl } from '@std/path';

export const repository = fromFileUrl(new URL('../../../../', import.meta.url));
export const assets = join(repository, 'packages/cli/src/kernel/assets/showcase/ai');

export const destinations: Readonly<Record<string, string>> = {
  'app/loader.ts.template': 'apps/portal/lib/showcase-ai.ts',
  'app/page.tsx.template': 'apps/portal/routes/ai.tsx',
  'app/NorthwindChat.tsx.template': 'apps/portal/islands/NorthwindChat.tsx',
  'app/showcase-ai.css.template': 'apps/portal/assets/showcase-ai.css',
  'app/threads-route.ts.template': 'apps/portal/routes/api/showcase/chat.ts',
  'app/session-route.ts.template': 'apps/portal/routes/api/showcase/chat/[sessionId].ts',
  'app/mcp-route.ts.template': 'apps/portal/routes/api/showcase/mcp.ts',
  'integration/stream-secret.ts.template': 'showcase/stream-secret.ts',
  'integration/streams-host.ts.template': 'showcase/streams-host.ts',
};

/** Materialize real framework consumers without changing root imports or the root lock. */
export async function createFixture(): Promise<
  { root: string; write(path: string, source: string): Promise<void>; close(): Promise<void> }
> {
  const root = await Deno.makeTempDir({ prefix: 'showcase-ai-' });
  async function write(path: string, source: string): Promise<void> {
    await Deno.mkdir(dirname(join(root, path)), { recursive: true });
    await Deno.writeTextFile(join(root, path), source);
  }
  for (const folder of ['server', 'app', 'integration']) {
    for await (const file of Deno.readDir(join(assets, folder))) {
      const input = `${folder}/${file.name}`;
      const target = destinations[input] ?? `ai/showcase/${file.name.replace(/\.template$/, '')}`;
      const source = (await Deno.readTextFile(join(assets, input)))
        .replaceAll('{{projectName}}', 'northwind').replaceAll('{{appName}}', 'portal');
      await write(target, source);
    }
  }
  await write(
    'fixtures/auth-bff.ts',
    (await Deno.readTextFile(
      join(repository, 'packages/cli/src/kernel/assets/auth/bff.ts.template'),
    ))
      .replaceAll('{{authServiceName}}', "'auth-api'"),
  );
  const rootConfig = JSON.parse(await Deno.readTextFile(join(repository, 'deno.json')));
  const imports: Record<string, string> = { ...rootConfig.imports };
  for (const [name, version] of Object.entries(rootConfig.catalog)) {
    imports[name] = `npm:${name}@${version}`;
  }
  const packages: Array<{ name: string; directory: string; exports: Record<string, string> }> = [];
  for await (const entry of Deno.readDir(join(repository, 'packages'))) {
    if (!entry.isDirectory) continue;
    const directory = join(repository, 'packages', entry.name);
    let config;
    try {
      config = JSON.parse(await Deno.readTextFile(join(directory, 'deno.json')));
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) continue;
      throw error;
    }
    for (const [name, target] of Object.entries<string>(config.imports ?? {})) {
      if (target === 'catalog:') imports[name] = `npm:${name}@${rootConfig.catalog[name]}`;
      else if (/^(npm:|jsr:)/.test(target)) imports[name] = target;
    }
    if (typeof config.name === 'string') {
      packages.push({
        name: config.name,
        directory,
        exports: typeof config.exports === 'string'
          ? { '.': config.exports }
          : config.exports ?? {},
      });
    }
  }
  // Exact workspace exports override published aliases, including aliases written as jsr: URLs.
  for (const pkg of packages) {
    for (const [subpath, path] of Object.entries(pkg.exports)) {
      const name = pkg.name + (subpath === '.' ? '' : subpath.slice(1));
      const target = toFileUrl(resolve(pkg.directory, path)).href;
      imports[name] = target;
      imports[`jsr:${name.replace(pkg.name, `${pkg.name}@0.0.8`)}`] = target;
    }
  }
  const streamsRoot = join(repository, 'plugins/streams');
  const streamsConfig = JSON.parse(await Deno.readTextFile(join(streamsRoot, 'deno.json')));
  for (const [name, target] of Object.entries<string>(streamsConfig.imports)) {
    if (!(name in imports) && /^(npm:|jsr:)/.test(target)) imports[name] = target;
  }
  imports['@netscript/plugin-streams/service'] =
    toFileUrl(join(streamsRoot, 'services/mod.ts')).href;
  imports['@durable-streams/server'] = `npm:@durable-streams/server@${
    rootConfig.catalog['@durable-streams/server']
  }`;
  const registryRoot = join(repository, 'packages/fresh-ui/registry');
  const registry = JSON.parse(
    await Deno.readTextFile(join(repository, 'packages/fresh-ui/registry.json')),
  );
  for (const item of registry.items) {
    for (const dependency of item.dependencies ?? []) {
      const parsed = /^npm:(@[^/]+\/[^@]+|[^@]+)@(.+)$/.exec(dependency);
      if (parsed) imports[parsed[1]] = dependency;
    }
  }
  // Consumer probes reuse the repository's resolved pins rather than resolving open ranges anew.
  const pins = JSON.parse(await Deno.readTextFile(join(repository, 'deno.lock'))).specifiers;
  for (const [name, specifier] of Object.entries(imports)) {
    const parsed = /^(npm:(?:@[^/]+\/)?[^@/]+)@([^/]+)(\/.*)?$/.exec(specifier);
    if (!parsed) continue;
    const pin = pins[`${parsed[1]}@${parsed[2]}`];
    if (typeof pin === 'string') {
      imports[name] = `${parsed[1]}@${pin.split('_')[0]}${parsed[3] ?? ''}`;
    }
  }
  const copied = new Set<string>();
  async function copyUi(path: string): Promise<void> {
    if (copied.has(path)) return;
    copied.add(path);
    let source;
    try {
      source = await Deno.readTextFile(join(registryRoot, path));
    } catch (error) {
      if (!(error instanceof Deno.errors.NotFound)) throw error;
      source = await Deno.readTextFile(join(registryRoot, `${path}.template`));
    }
    await write(`apps/portal/${path}`, source);
    for (const match of source.matchAll(/(?:from\s*|import\s*)['"](\.[^'"]+)['"]/g)) {
      await copyUi(resolve('/', dirname(path), match[1]).slice(1));
    }
  }
  for (const name of ['markdown', 'prompt-input', 'tool-call-card']) {
    await copyUi(`components/ui/${name}.tsx`);
  }
  await write(
    'deno.json',
    JSON.stringify({
      imports,
      catalog: rootConfig.catalog,
      fmt: { lineWidth: 100, indentWidth: 2, semiColons: true, singleQuote: true },
      compilerOptions: {
        strict: true,
        lib: ['deno.ns', 'deno.unstable', 'dom', 'dom.iterable'],
        jsx: 'react-jsx',
        jsxImportSource: 'preact',
      },
    }),
  );
  await write(
    'ai/models.ts',
    "export const DEFAULT_CHAT_MODEL: string = 'anthropic:claude-sonnet-5-5';\n",
  );
  await write(
    'contracts/versions/v1/orders.contract.ts',
    `import { createCrudContract } from '@netscript/contracts/crud';
import { z } from 'zod';
const entity = z.object({ id: z.number(), reference: z.string(), name: z.string(), ownerName: z.string(), ownerEmail: z.string(), status: z.enum(['pending', 'awaiting_payment', 'paid', 'shipped', 'refunded', 'cancelled']), amount: z.number(), currency: z.string(), createdAt: z.string(), updatedAt: z.string() });
export const OrdersContractV1 = createCrudContract({ resource: 'orders', entitySchema: entity, createSchema: entity.omit({id:true}), updateSchema: entity.partial(), filterSchema: z.object({ search: z.string().optional(), status: entity.shape.status.optional() }) });\n`,
  );
  await write(
    'apps/portal/utils.ts',
    "import { createDefine } from 'fresh';\nexport const define = createDefine();\n",
  );
  return { root, write, close: () => Deno.remove(root, { recursive: true }) };
}
