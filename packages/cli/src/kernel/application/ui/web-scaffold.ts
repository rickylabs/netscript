import { dirname, relative, resolve } from "@std/path";
import type { FileSystemPort } from "../../ports/file-system-port.ts";
const PREREQUISITE = "netscript service add --name <service> --with-client";
export type UiGeneratedFileRole = "page" | "query-loader" | "island" | "route-registration";
export type UiGeneratedFile = Readonly<{
  path: string;
  content: string;
  role: UiGeneratedFileRole;
}>;
export type UiScaffoldResult = Readonly<{ files: readonly UiGeneratedFile[] }>;
type WriteOptions = Readonly<{ force?: boolean; dryRun?: boolean }>;
export interface UiPageScaffoldInput extends WriteOptions {
  readonly projectRoot: string;
  readonly path: string;
  readonly route?: string;
  readonly island?: boolean;
}
export interface UiIslandScaffoldInput extends WriteOptions {
  readonly projectRoot: string;
  readonly name: string;
  readonly query?: boolean;
}
type Binding = Readonly<{ path: string; queries: string; input: string }>;
export async function scaffoldUiPage(
  input: UiPageScaffoldInput,
  fs: FileSystemPort,
): Promise<UiScaffoldResult> {
  const segment = cleanPath(input.path);
  const routeId = cleanRouteId(input.route ?? segment.replaceAll("/", "."));
  const dir = resolve(input.projectRoot, "routes", segment);
  const name = pascalCase(segment.split("/").at(-1) ?? "Page");
  const binding = input.island ? await findBinding(input.projectRoot, fs) : undefined;
  const files: UiGeneratedFile[] = [{
    path: resolve(dir, "index.tsx"),
    content: pageTemplate(name, routeId, Boolean(binding)),
    role: "page",
  }];
  if (binding) {
    const loader = resolve(dir, "(_shared)", "query-loaders.ts");
    files.push({ path: loader, content: loaderTemplate(binding, loader, name), role: "query-loader" }, {
      path: resolve(dir, "(_islands)", `${name}Island.tsx`),
      content: dataIslandTemplate(binding, dir, name),
      role: "island",
    });
  }
  files.push(await routeRegistration(input.projectRoot, segment, routeId, fs));
  await applyPlan(files, input, fs);
  return { files };
}
export async function scaffoldUiIsland(
  input: UiIslandScaffoldInput,
  fs: FileSystemPort,
): Promise<UiScaffoldResult> {
  const name = pascalCase(input.name);
  const binding = input.query ? await findBinding(input.projectRoot, fs) : undefined;
  const path = resolve(
    input.projectRoot,
    "routes",
    "(_islands)",
    `${name}.tsx`,
  );
  const content = binding ? queryIslandTemplate(binding, path, name) : signalTemplate(name);
  const files: UiGeneratedFile[] = [{ path, content, role: "island" }];
  await applyPlan(files, input, fs);
  return { files };
}
async function applyPlan(
  files: readonly UiGeneratedFile[],
  options: WriteOptions,
  fs: FileSystemPort,
): Promise<void> {
  if (!options.force) {
    for (const file of files) {
      if (file.role !== "route-registration" && await fs.exists(file.path)) {
        throw new Error(`Refusing to overwrite existing file: ${file.path}`);
      }
    }
  }
  if (options.dryRun) return;
  for (const file of files) {
    await fs.createDir(dirname(file.path));
    await fs.writeFile(file.path, file.content);
  }
}
async function findBinding(root: string, fs: FileSystemPort): Promise<Binding> {
  const candidates: string[] = [];
  const lib = resolve(root, "lib");
  if (await fs.exists(lib)) {
    for (const entry of await fs.readDir(lib)) {
      const path = resolve(lib, entry.name);
      if (
        entry.isFile && entry.name.endsWith(".ts") &&
        (await fs.readFile(path)).includes("createQueryFactories(")
      ) candidates.push(path);
    }
  }
  const examples = resolve(root, "routes", "examples");
  if (!candidates.length && await fs.exists(examples)) {
    for (const entry of await fs.readDir(examples)) {
      if (!entry.isDirectory) continue;
      const fallback = resolve(examples, entry.name, "(_lib)", "service-query.ts");
      if (await fs.exists(fallback)) candidates.push(fallback);
    }
  }
  if (candidates.length !== 1) {
    bindingError(
      candidates.length ? "multiple query clients are ambiguous" : "no query client found",
      candidates,
    );
  }
  const path = candidates[0];
  const source = await fs.readFile(path);
  const service = source.match(/export const \w+Name\s*=\s*['"]([^'"]+)['"]/i)
    ?.[1];
  const queries = source.match(
    /export const (\w+Queries)\s*=\s*createQueryFactories\(/,
  )?.[1];
  if (!service || !queries) {
    bindingError("unsupported query client", candidates);
  }
  const contractPath = resolve(
    root,
    "..",
    "..",
    "contracts",
    "versions",
    "v1",
    `${service}.contract.ts`,
  );
  if (!await fs.exists(contractPath)) {
    bindingError(`missing contract ${contractPath}`, candidates);
  }
  const contract = await fs.readFile(contractPath);
  const input = contract.includes("createCrudContract(") ? `{ limit: 20, page: 1, sortBy: 'id', sortOrder: 'asc' } as const` : /ListInputSchemaV1[\s\S]*offset\s*:/.test(contract) ? `{ limit: 20, offset: 0 } as const` : undefined;
  if (!input) {
    bindingError(`unsupported list contract ${contractPath}`, candidates);
  }
  return { path, queries, input };
}
function bindingError(reason: string, candidates: readonly string[]): never {
  const detail = candidates.length ? ` Candidates: ${candidates.join(", ")}.` : "";
  throw new Error(
    `Cannot scaffold a data-bound island: ${reason}.${detail} Exactly one conventional generated client is required. Prerequisite: ${PREREQUISITE}.`,
  );
}
async function routeRegistration(
  root: string,
  segment: string,
  routeId: string,
  fs: FileSystemPort,
): Promise<UiGeneratedFile> {
  const path = resolve(root, "router.ts");
  if (!await fs.exists(path)) {
    throw new Error(`Cannot register page route: missing ${path}`);
  }
  const source = await fs.readFile(path);
  const start = source.indexOf("export const appRoutes = {");
  const end = source.indexOf("\n} as const;", start);
  if (start < 0 || end < 0 || !source.includes("createRouteReference")) {
    throw new Error(
      `Cannot register page route in ${path}: unsupported appRoutes declaration`,
    );
  }
  const block = source.slice(start, end);
  const exact = block.includes(
    `createRouteReference('/${segment}', { id: '${routeId}'`,
  );
  if (
    !exact &&
    (block.includes(`'${routeId}':`) ||
      block.includes(`createRouteReference('/${segment}'`))
  ) {
    throw new Error(
      `Cannot register '${routeId}' in ${path}: route id or path already exists`,
    );
  }
  const entry = `  '${routeId}': createRouteReference('/${segment}', { id: '${routeId}', kind: 'page' }),\n`;
  const content = exact ? source : source.slice(0, end) + "\n" + entry + source.slice(end + 1);
  return { path, content, role: "route-registration" };
}
function pageTemplate(
  name: string,
  routeId: string,
  dataBound: boolean,
): string {
  const camel = camelCase(name);
  const imports = dataBound ? `import ${name}Island from './(_islands)/${name}Island.tsx';\nimport { load${name}Data } from './(_shared)/query-loaders.ts';\n` : "";
  const layer = dataBound ? `.withLayer('${camel}', ${name}Island, { loader: load${name}Data })` : `.withLayer('${camel}', () => <main><h1>${name}</h1></main>, () => ({}))`;
  return `import { appRoutes } from '@app/router.ts';\nimport { definePage } from '@app/utils.ts';\n${imports}\nexport const ${camel}Page = definePage()\n  .withRoute(appRoutes['${routeId}'])\n  .withMeta(() => ({ title: '${name}' }))\n  ${layer}\n  .withLayout((slots) => slots.${camel}())\n  .build();\n\nexport const { default: page } = ${camel}Page;\nexport { page as default };\n`;
}
function loaderTemplate(binding: Binding, path: string, name: string): string {
  const query = binding.queries;
  const input = `${camelCase(name)}ListInput`;
  return `import { createNetScriptQueryClient } from '@netscript/sdk/query-client';\nimport { ${query} } from '${
    specifier(path, binding.path)
  }';\n\nexport const ${input} = ${binding.input};\n\nexport async function load${name}Data() {\n  const input = ${input};\n  const queryClient = createNetScriptQueryClient();\n  const queryOptions = ${query}.list.queryOptions(input);\n  const cachedAt = Date.now();\n  const initialData = await queryClient.fetchQuery({\n    queryKey: queryOptions.queryKey,\n    queryFn: queryOptions.queryFn,\n  });\n  return { input, initialData, cachedAt };\n}\n`;
}
function dataIslandTemplate(
  binding: Binding,
  dir: string,
  name: string,
): string {
  const query = binding.queries;
  const module = specifier(
    resolve(dir, "(_islands)", `${name}Island.tsx`),
    binding.path,
  );
  return `import type { InferDefinePageLayerLoaderProps } from '@netscript/fresh/builders';\nimport { QueryIsland, useIslandQuery } from '@netscript/fresh/query';\nimport { ${query} } from '${module}';\nimport { load${name}Data } from '../(_shared)/query-loaders.ts';\n\ntype Props = NonNullable<InferDefinePageLayerLoaderProps<typeof load${name}Data>>;\n\nfunction ${name}Data(props: Props) {\n  const query = useIslandQuery({\n    ...${query}.list.queryOptions(props.input),\n    queryKey: ${query}.list.clientKey(props.input),\n    initialData: props.initialData,\n    initialDataUpdatedAt: props.cachedAt,\n  });\n  return <pre>{JSON.stringify(query.data, null, 2)}</pre>;\n}\n\nexport default function ${name}Island(props: Props) {\n  return (\n    <QueryIsland>\n      <${name}Data {...props} />\n    </QueryIsland>\n  );\n}\n`;
}
function queryIslandTemplate(
  binding: Binding,
  path: string,
  name: string,
): string {
  const query = binding.queries;
  return `import { QueryIsland, useIslandQuery } from '@netscript/fresh/query';\nimport { ${query} } from '${specifier(path, binding.path)}';\n\nconst input = ${binding.input};\n\nfunction ${name}Data() {\n  const query = useIslandQuery({\n    ...${query}.list.queryOptions(input),\n    queryKey: ${query}.list.clientKey(input),\n  });\n  return <pre>{JSON.stringify(query.data, null, 2)}</pre>;\n}\n\nexport default function ${name}() {\n  return (\n    <QueryIsland>\n      <${name}Data />\n    </QueryIsland>\n  );\n}\n`;
}
function signalTemplate(name: string): string {
  return `import { useSignal } from '@preact/signals';\n\nexport default function ${name}() {\n  const count = useSignal(0);\n  return <button type="button" onClick={() => count.value++}>{count}</button>;\n}\n`;
}
function specifier(from: string, target: string): string {
  const path = relative(dirname(from), target).replaceAll("\\", "/");
  return path.startsWith(".") ? path : `./${path}`;
}
function cleanPath(path: string): string {
  const value = path.replace(/^\/+|\/+$/g, "");
  if (!value || value.split("/").some((part) => !/^[\w][\w-]*$/.test(part))) {
    throw new Error(`Invalid page path: ${path}`);
  }
  return value;
}
function cleanRouteId(id: string): string {
  if (!/^[\w][\w.-]*$/.test(id)) throw new Error(`Invalid route id: ${id}`);
  return id;
}
function pascalCase(value: string): string {
  const result = value.replace(
    /(^|[-_\s/]+)([\w])/g,
    (_m, _s, c: string) => c.toUpperCase(),
  )
    .replace(/[^a-zA-Z0-9]/g, "");
  if (!result) throw new Error(`Invalid generated name: ${value}`);
  return /^\d/.test(result) ? `Ui${result}` : result;
}
function camelCase(value: string): string {
  return value[0].toLowerCase() + value.slice(1);
}
