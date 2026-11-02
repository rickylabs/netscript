import { dirname, fromFileUrl, join, relative, toFileUrl } from '@std/path';
import { componentContracts } from '../../../packages/fresh-ui/contracts.ts';
import { TOKEN_PRESETS } from '../../../packages/fresh-ui/src/tokens/domain/token-presets.ts';
import { encodeUiPreset } from '../../../packages/cli/src/kernel/domain/ui/ui-preset.ts';
import { componentExample } from './examples.ts';
import {
  type ComponentCatalog,
  type ComponentPage,
  presetCatalog,
  type PresetChoice,
  WORKSPACE_COMPONENTS,
} from './catalog.ts';
import { implementationProps, record, typeText } from './read-props.ts';

export const ROOT: string = fromFileUrl(new URL('../../../', import.meta.url));
export const OUTPUT: string = join(ROOT, '.llm/tmp/fresh-ui-docs');
const REGISTRY = 'packages/fresh-ui/registry';

export interface RegistryItem {
  name: string;
  type: string;
  description?: string;
  dependencies?: string[];
  files?: { path: string; type: string; target?: string }[];
}

export async function registryItems(): Promise<RegistryItem[]> {
  return JSON.parse(await Deno.readTextFile(join(ROOT, 'packages/fresh-ui/registry.json'))).items;
}

export function documentedItems(items: readonly RegistryItem[]): RegistryItem[] {
  return items.filter((item) => ['registry:component', 'registry:block'].includes(item.type))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Hash the entire declared input surface, so a stale build cannot certify changed sources. */
export async function inputHash(): Promise<string> {
  const paths: string[] = [
    'deno.json',
    'docs/site/deno.json',
    'docs/site/design-system/components.page.ts',
    'docs/site/_plugins/escape-html.ts',
    'packages/fresh-ui/registry.json',
    'packages/fresh-ui/src/tokens/domain/token-presets.ts',
    'packages/cli/src/kernel/domain/ui/ui-preset.ts',
    'packages/mcp/src/domain/docs/doc-retrieval-contract.ts',
  ];
  for (const root of [REGISTRY, 'packages/fresh-ui/src/contracts', 'tools/docs-site/fresh-ui']) {
    for await (const file of sourceFiles(join(ROOT, root))) {
      paths.push(relative(ROOT, file).replaceAll('\\', '/'));
    }
  }
  const content = await Promise.all(
    paths.sort().map(async (path) => `${path}\0${await Deno.readTextFile(join(ROOT, path))}`),
  );
  return new Uint8Array(
    await crypto.subtle.digest('SHA-256', new TextEncoder().encode(content.join('\0'))),
  )
    .toHex();
}

async function run(args: string[]): Promise<string> {
  const result = await new Deno.Command(Deno.execPath(), {
    args,
    cwd: ROOT,
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  if (!result.success) throw new Error(new TextDecoder().decode(result.stderr));
  return new TextDecoder().decode(result.stdout);
}

function exportName(item: RegistryItem, source: string): string {
  return source.match(/@component\s+(\w+)/)?.[1] ??
    item.name.split('-').map((part) => part[0].toUpperCase() + part.slice(1)).join('');
}

/** Enumerate build inputs with the platform filesystem API; no new workspace dependency. */
async function* sourceFiles(root: string): AsyncGenerator<string> {
  for await (const entry of Deno.readDir(root)) {
    const path = join(root, entry.name);
    if (entry.isDirectory) yield* sourceFiles(path);
    else if (entry.isFile) yield path;
  }
}

async function prepareSources(items: readonly RegistryItem[]): Promise<string> {
  for await (const file of sourceFiles(join(ROOT, REGISTRY))) {
    const target = join(OUTPUT, 'source', relative(join(ROOT, REGISTRY), file))
      .replace(/\.template$/, '');
    await Deno.mkdir(dirname(target), { recursive: true });
    await Deno.copyFile(file, target);
  }
  const root = JSON.parse(await Deno.readTextFile(join(ROOT, 'deno.json')));
  const site = JSON.parse(await Deno.readTextFile(join(ROOT, 'docs/site/deno.json')));
  const imports: Record<string, string> = {
    ...root.imports,
    'lume/': site.imports['lume/'],
    ...Object.fromEntries(
      Object.entries(root.catalog).map(([name, version]) => [name, `npm:${name}@${version}`]),
    ),
    preact: 'npm:preact@^10.29.2',
    'preact/hooks': 'npm:preact@^10.29.2/hooks',
    'preact/jsx-runtime': 'npm:preact@^10.29.2/jsx-runtime',
    '@preact/signals': root.imports['@preact/signals'] ?? 'npm:@preact/signals@2.11.3',
    zod: `npm:zod@${root.catalog.zod}`,
    '@netscript/fresh-ui/interactive':
      toFileUrl(join(ROOT, 'packages/fresh-ui/interactive.ts')).href,
    '@netscript/sdk/desktop': toFileUrl(join(ROOT, 'packages/sdk/src/desktop/mod.ts')).href,
    '@netscript/sdk/auto-update': toFileUrl(join(ROOT, 'packages/sdk/src/auto-update/mod.ts')).href,
  };
  for (const item of items) {
    for (const dependency of item.dependencies ?? []) {
      const match = dependency.match(/^npm:((?:@[^/]+\/)?[^@]+)@(.+)$/);
      if (match) imports[match[1]] = dependency;
    }
  }
  // Import-map package keys need explicit subpaths for copied consumer sources.
  for await (
    const file of sourceFiles(join(OUTPUT, 'source'))
  ) {
    if (!/\.tsx?$/.test(file)) continue;
    const source = await Deno.readTextFile(file);
    for (const match of source.matchAll(/from\s+['"]([^.'"][^'"]*)['"]/g)) {
      if (imports[match[1]]) continue;
      const base = Object.keys(imports).filter((key) => match[1].startsWith(`${key}/`))
        .sort((a, b) => b.length - a.length)[0];
      if (base && imports[base].startsWith('npm:')) {
        imports[match[1]] = imports[base] + match[1].slice(base.length);
      }
    }
  }
  const config = join(OUTPUT, 'deno.json');
  await Deno.writeTextFile(
    config,
    JSON.stringify(
      {
        imports,
        catalog: root.catalog,
        lock: false,
        compilerOptions: {
          jsx: 'react-jsx',
          jsxImportSource: 'preact',
          lib: ['dom', 'dom.iterable', 'deno.ns'],
        },
      },
      null,
      2,
    ),
  );
  return config;
}

async function presetChoices(): Promise<PresetChoice[]> {
  const manifest = JSON.parse(await Deno.readTextFile(join(ROOT, REGISTRY, 'theme/tokens.json')));
  return TOKEN_PRESETS.map((preset) => ({
    id: preset.id,
    code: encodeUiPreset({ version: 1, theme: preset.id, style: 'style-utility' }),
    language: preset.language,
    flavor: preset.flavor,
    accent: preset.accentMode,
    density: preset.density,
    sourceDensity: preset.sourceDensity,
    values: manifest.presets[preset.id].schemes.light,
  }));
}

/** Build-only source preparation preserves relative registry imports and removes template suffixes. */
export async function generate(): Promise<ComponentCatalog> {
  const items = await registryItems();
  await Deno.mkdir(OUTPUT, { recursive: true });
  const config = await prepareSources(items);
  const entries = await Promise.all(
    documentedItems(items).map(async (item) => {
      const path = item.files?.find((file) => /\.tsx(?:\.template)?$/.test(file.path))?.path;
      if (!path) throw new Error(`No component source for registry item ${item.name}`);
      const source = await Deno.readTextFile(join(ROOT, path));
      return {
        item,
        path,
        source,
        symbol: exportName(item, source),
        prepared: join(OUTPUT, 'source', path.slice(REGISTRY.length + 1)).replace(
          /\.template$/,
          '',
        ),
      };
    }),
  );
  const docs = JSON.parse(
    await run([
      'doc',
      '--config',
      config,
      '--import-map',
      config,
      '--json',
      '--private',
      ...entries.map((e) => e.prepared),
    ]),
  );
  const components: ComponentPage[] = [];
  const imports: string[] = [];
  for (const entry of entries) {
    const { item, path, source, symbol, prepared } = entry;
    const node = docs.nodes[toFileUrl(prepared).href];
    const props = implementationProps(node);
    const signatures: string[] = [];
    for (const raw of node.symbols) {
      if (!record(raw) || !Array.isArray(raw.declarations)) continue;
      if (typeof raw.name !== 'string') continue;
      for (const declaration of raw.declarations.filter(record)) {
        if (!record(declaration.def)) continue;
        if (/Props$/.test(raw.name) && Array.isArray(declaration.def.extends)) {
          signatures.push(
            `${raw.name} extends ${declaration.def.extends.map(typeText).join(', ')}`,
          );
        } else if (
          declaration.declarationKind === 'export' && declaration.kind === 'typeAlias' &&
          !/Props$/.test(raw.name)
        ) {
          signatures.push(`type ${raw.name} = ${typeText(declaration.def.tsType)}`);
        }
      }
    }
    const css = (await Promise.all(
      (item.files ?? []).filter((f) => f.path.endsWith('.css'))
        .map((f) => Deno.readTextFile(join(ROOT, f.path))),
    )).join('\n');
    imports.push(
      source.includes(`export default function ${symbol}`)
        ? `import ${symbol} from ${JSON.stringify(toFileUrl(prepared).href)};`
        : `import { ${symbol} } from ${JSON.stringify(toFileUrl(prepared).href)};`,
    );
    const target = item.files?.find((file) => file.path === path)?.target ?? '';
    const importPath = target.replace('@ui/', '@app/components/ui/').replace(
      '@islands/',
      '@app/islands/ui/',
    );
    const isDefault = source.includes(`export default function ${symbol}`);
    components.push({
      name: item.name,
      symbol,
      source: path,
      description: item.description ??
        source.match(/@description\s+([^*]+)/)?.[1].replace(/\s+/g, ' ').trim() ?? symbol,
      importStatement: `import ${isDefault ? symbol : `{ ${symbol} }`} from '${importPath}';`,
      example: componentExample(item.name, symbol, props).replaceAll('{{', '{ {').replaceAll(
        '}}',
        '} }',
      ),
      props,
      signatures,
      contract: componentContracts.components.find((contract) => contract.name === item.name),
      cssTokens: [...new Set([...css.matchAll(/var\((--ns-[\w-]+)/g)].map((m) => m[1]))].sort(),
    });
  }
  const cssPaths = new Set(items.flatMap((item) =>
    (item.files ?? [])
      .filter((file) => file.path.endsWith('.css') && !file.path.includes('/theme/'))
      .map((file) => file.path)
  ));
  const catalog = {
    inputHash: await inputHash(),
    componentCssSources: [...cssPaths].sort(),
    components,
    presets: await presetChoices(),
  };
  await Deno.writeTextFile(join(OUTPUT, 'catalog.json'), JSON.stringify(catalog));
  await Deno.writeTextFile(join(OUTPUT, 'presets.json'), JSON.stringify(presetCatalog(catalog)));
  const examplesDir = join(OUTPUT, 'examples');
  await Deno.mkdir(examplesDir, { recursive: true });
  for (const page of components) {
    const usedImports = components.flatMap((candidate, index) =>
      new RegExp(`<${candidate.symbol}(?:[.\\s/>])`).test(page.example) ? [imports[index]] : []
    );
    await Deno.writeTextFile(
      join(examplesDir, page.name + '.tsx'),
      `${usedImports.join('\n')}
import { useState } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
export const examples: Record<string, () => ComponentChildren> = {
  ${JSON.stringify(page.name)}: () => { const [value, setValue] = useState('standard');
    const [open, setOpen] = useState(false); const [notice, report] = useState('');
    return <><div class="demo-example">${page.example}</div><p role="status">{notice}</p></>; }
};`,
    );
  }
  await Deno.writeTextFile(
    join(examplesDir, 'workspace.tsx'),
    WORKSPACE_COMPONENTS.map((name, index) =>
      `import { examples as e${index} } from './${name}.tsx';`
    ).join('\n') + '\nexport const examples = {' +
      WORKSPACE_COMPONENTS.map((_, index) => `...e${index}`).join(',') + '};\n',
  );
  const entry = `import { start } from ${
    JSON.stringify(new URL('./preview.tsx', import.meta.url).href)
  };
const loaders = {
${
    [...components.map((page) => page.name), 'workspace'].map((name) =>
      `${JSON.stringify(name)}: () => import('./examples/${name}.tsx')`
    ).join(',\n')
  }
};
const name = new URL(location.href).searchParams.get('component') ?? 'workspace';
if (!Object.hasOwn(loaders, name)) throw new Error('Unknown component preview: ' + name);
await start((await loaders[name as keyof typeof loaders]()).examples);`;
  await Deno.writeTextFile(join(OUTPUT, 'preview.tsx'), entry);
  await run([
    'run',
    '--allow-read',
    '--allow-write',
    '--allow-run',
    join(ROOT, '.llm/tools/run-deno-check.ts'),
    '--file',
    join(OUTPUT, 'preview.tsx'),
    '--file',
    fromFileUrl(new URL('./preview.tsx', import.meta.url)),
    '--deno-arg',
    `--config=${config}`,
    '--deno-arg',
    `--import-map=${config}`,
  ]);
  await Deno.writeTextFile(
    join(OUTPUT, 'builder.ts'),
    `import ${JSON.stringify(new URL('./builder.ts', import.meta.url).href)};`,
  );
  // A fresh output directory prevents retired chunk files from entering the published inventory.
  const bundleDir = await Deno.makeTempDir({ prefix: 'fresh-ui-docs-' });
  try {
    await run([
      'bundle',
      '--config',
      config,
      '--import-map',
      config,
      '--platform',
      'browser',
      '--minify',
      '--code-splitting',
      '--outdir',
      bundleDir,
      join(OUTPUT, 'preview.tsx'),
      join(OUTPUT, 'builder.ts'),
    ]);
    const files: string[] = [];
    await Deno.mkdir(join(OUTPUT, 'js'), { recursive: true });
    for await (const file of sourceFiles(bundleDir)) {
      const name = relative(bundleDir, file).replaceAll('\\', '/');
      if (!name.endsWith('.js')) throw new Error('Unexpected browser bundle: ' + name);
      files.push(name);
      await Deno.mkdir(dirname(join(OUTPUT, 'js', name)), { recursive: true });
      await Deno.copyFile(file, join(OUTPUT, 'js', name));
    }
    await Deno.writeTextFile(join(OUTPUT, 'bundle-files.json'), JSON.stringify(files.sort()));
  } finally {
    await Deno.remove(bundleDir, { recursive: true });
  }
  await Deno.writeTextFile(
    join(OUTPUT, 'components.css'),
    (await Promise.all([...cssPaths].sort().map((path) => Deno.readTextFile(join(ROOT, path)))))
      .join('\n'),
  );
  console.log(
    `Fresh UI docs: generated ${components.length} component pages, ${catalog.presets.length} presets`,
  );
  return catalog;
}

if (import.meta.main) await generate();
