export interface LocalSourceImport {
  readonly specifier: string;
  readonly entrypoint: string;
}

export interface LocalSourceTarget {
  readonly path: string;
  readonly includeConfig?: boolean;
}

export interface LocalSourceFixtureOptions {
  readonly projectRoot: string;
  readonly sourceBase: string;
  readonly packages: readonly LocalSourceImport[];
  readonly targets: readonly LocalSourceTarget[];
  readonly imports?: Readonly<Record<string, string>>;
}

/** Resolve explicit workspace package entrypoints from a selected source base. */
export function resolveLocalSourceImports(
  sourceBase: string,
  packages: readonly LocalSourceImport[],
): Record<string, string> {
  const base = sourceBase.replace(/\/$/, '');
  return Object.fromEntries(
    packages.map(({ specifier, entrypoint }) => [specifier, `${base}/${entrypoint}`]),
  );
}

/** Merge local workspace package imports into generated-project config targets. */
export async function prepareLocalSourceFixture(options: LocalSourceFixtureOptions): Promise<void> {
  const configPath = `${options.projectRoot}/deno.json`;
  const config = JSON.parse(await Deno.readTextFile(configPath));
  if (!isRecord(config) || !isRecord(config.imports)) {
    throw new Error('generated deno.json did not contain imports');
  }
  const imports = {
    ...config.imports,
    ...options.imports,
    ...resolveLocalSourceImports(options.sourceBase, options.packages),
  };
  for (const target of options.targets) {
    const path = `${options.projectRoot}/${target.path}`;
    const parent = path.slice(0, path.lastIndexOf('/'));
    if (parent) await Deno.mkdir(parent, { recursive: true });
    const value = target.includeConfig ? { ...config, imports } : { imports };
    await Deno.writeTextFile(path, `${JSON.stringify(value, null, 2)}\n`);
  }
}

/** Create a self-contained eval script for a generated-project local-source fixture. */
export function localSourceFixtureScript(options: LocalSourceFixtureOptions): string {
  return `await (${prepareLocalSourceFixture.toString()})(${JSON.stringify(options)});\n` +
    `function isRecord(value) { return value !== null && typeof value === "object" && !Array.isArray(value); }\n` +
    `function resolveLocalSourceImports(sourceBase, packages) { const base = sourceBase.replace(/\\\/$/, ""); return Object.fromEntries(packages.map(({ specifier, entrypoint }) => [specifier, \`\${base}/\${entrypoint}\`])); }`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
