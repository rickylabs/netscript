import { dirname, resolve } from '@std/path';
import type { FileSystemPort } from '../../ports/file-system-port.ts';

export interface UiGeneratedFile { readonly path: string; readonly content: string }
export interface UiScaffoldResult { readonly files: readonly UiGeneratedFile[] }

export interface UiPageScaffoldInput {
  readonly projectRoot: string;
  readonly path: string;
  readonly route?: string;
  readonly island?: boolean;
}

/** Generate a typed Fresh page and its optional colocated island/query loader files. */
export async function scaffoldUiPage(
  input: UiPageScaffoldInput,
  fs: FileSystemPort,
): Promise<UiScaffoldResult> {
  const segment = cleanRoutePath(input.path);
  const routeId = input.route ?? segment.replaceAll('/', '.');
  const routeDirectory = resolve(input.projectRoot, 'routes', segment);
  const pageName = pascalCase(segment.split('/').at(-1) ?? 'Page');
  const islandImport = input.island
    ? `import ${pageName}Island from './(_islands)/${pageName}Island.tsx';\n`
    : '';
  const view = input.island ? `<${pageName}Island />` : `<main><h1>${pageName}</h1></main>`;
  const files: UiGeneratedFile[] = [{
    path: resolve(routeDirectory, 'index.tsx'),
    content: `import { createRouteReference } from '@netscript/fresh/route';\nimport { definePage } from '@app/utils.ts';\n${islandImport}\nconst route = createRouteReference('/${segment}', { id: '${routeId}', kind: 'page' });\n\nexport const ${camelCase(pageName)}Page = definePage()\n  .withRoute(route)\n  .withMeta(() => ({ title: '${pageName}' }))\n  .withLayer('${camelCase(pageName)}', () => ${view}, () => ({}))\n  .withLayout((slots) => slots.${camelCase(pageName)}())\n  .build();\n\nexport const { default: page } = ${camelCase(pageName)}Page;\nexport { page as default };\n`,
  }];
  if (input.island) {
    files.push({
      path: resolve(routeDirectory, '(_islands)', `${pageName}Island.tsx`),
      content: signalIslandTemplate(`${pageName}Island`),
    }, {
      path: resolve(routeDirectory, '(_shared)', 'query-loaders.ts'),
      content: `// Add route-owned query loaders here and import them from colocated islands.\nexport const queryLoaders = {} as const;\n`,
    });
  }
  await writeGeneratedFiles(files, fs);
  return { files };
}

/** Generate a user-named hydrating island, optionally using QueryIsland. */
export async function scaffoldUiIsland(
  input: { readonly projectRoot: string; readonly name: string; readonly query?: boolean },
  fs: FileSystemPort,
): Promise<UiScaffoldResult> {
  const name = pascalCase(input.name);
  const content = input.query
    ? `import { QueryIsland } from '@netscript/fresh/query';\n\nexport default function ${name}() {\n  return <QueryIsland><div>${name}</div></QueryIsland>;\n}\n`
    : signalIslandTemplate(name);
  const files = [{ path: resolve(input.projectRoot, 'islands', `${name}.tsx`), content }];
  await writeGeneratedFiles(files, fs);
  return { files };
}

async function writeGeneratedFiles(files: readonly UiGeneratedFile[], fs: FileSystemPort) {
  for (const file of files) {
    if (await fs.exists(file.path)) throw new Error(`Refusing to overwrite existing file: ${file.path}`);
    await fs.createDir(dirname(file.path));
    await fs.writeFile(file.path, file.content);
  }
}

function signalIslandTemplate(name: string): string {
  return `import { useSignal } from '@preact/signals';\n\nexport default function ${name}() {\n  const count = useSignal(0);\n  return <button type="button" onClick={() => count.value++}>{count}</button>;\n}\n`;
}

function cleanRoutePath(path: string): string {
  const value = path.replace(/^\/+|\/+$/g, '');
  if (!value || value.split('/').some((part) => part === '..' || part === '.')) {
    throw new Error(`Invalid page path: ${path}`);
  }
  return value;
}

function pascalCase(value: string): string {
  const result = value.replace(/(^|[-_\s/]+)([a-zA-Z0-9])/g, (_m, _s, c: string) => c.toUpperCase())
    .replace(/[^a-zA-Z0-9]/g, '');
  if (!result) throw new Error(`Invalid generated name: ${value}`);
  return /^\d/.test(result) ? `Ui${result}` : result;
}

function camelCase(value: string): string { return value[0].toLowerCase() + value.slice(1); }
