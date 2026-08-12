import { dirname, join, resolve } from '@std/path';
import { toFileUrl } from '@std/path/to-file-url';

interface DenoConfig {
  readonly name?: string;
  readonly exports?: string | Readonly<Record<string, string>>;
  readonly catalog?: Readonly<Record<string, string>>;
  imports?: Record<string, string>;
}

/** Replace first-party JSR fixture imports with exports from the checkout under test. */
export async function useLocalWorkspaceImports(
  projectRoot: string,
  repositoryRoot: string,
): Promise<void> {
  const configPath = join(projectRoot, 'deno.json');
  const config = JSON.parse(await Deno.readTextFile(configPath)) as DenoConfig;
  const repositoryConfig = JSON.parse(
    await Deno.readTextFile(join(repositoryRoot, 'deno.json')),
  ) as DenoConfig;
  config.imports = {
    ...catalogImports(repositoryConfig.catalog),
    ...repositoryConfig.imports,
    ...config.imports,
    ...await collectLocalWorkspaceImports(repositoryRoot),
  };
  Object.assign(config, { catalog: repositoryConfig.catalog });
  await Deno.writeTextFile(configPath, `${JSON.stringify(config, null, 2)}\n`);
}

function catalogImports(
  catalog: Readonly<Record<string, string>> | undefined,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(catalog ?? {}).map(([name, version]) => [name, `npm:${name}@${version}`]),
  );
}

async function collectLocalWorkspaceImports(
  repositoryRoot: string,
): Promise<Record<string, string>> {
  const imports: Record<string, string> = {};
  for (const collection of ['packages', 'plugins']) {
    const collectionRoot = join(repositoryRoot, collection);
    for await (const entry of Deno.readDir(collectionRoot)) {
      if (!entry.isDirectory) continue;
      const memberRoot = join(collectionRoot, entry.name);
      const manifestPath = join(memberRoot, 'deno.json');
      let manifest: DenoConfig;
      try {
        manifest = JSON.parse(await Deno.readTextFile(manifestPath)) as DenoConfig;
      } catch (error) {
        if (error instanceof Deno.errors.NotFound) continue;
        throw error;
      }
      if (!manifest.name?.startsWith('@netscript/') || manifest.exports === undefined) continue;
      for (const [exportName, target] of exportEntries(manifest.exports)) {
        const targetPath = resolve(dirname(manifestPath), target);
        const stat = await Deno.stat(targetPath);
        if (!stat.isFile) {
          throw new Error(`${manifest.name}${exportName} does not resolve to a file: ${targetPath}`);
        }
        const specifier = exportName === '.' ? manifest.name : `${manifest.name}${exportName.slice(1)}`;
        imports[specifier] = toFileUrl(targetPath).href;
      }
    }
  }
  return imports;
}

function exportEntries(
  exports: string | Readonly<Record<string, string>>,
): ReadonlyArray<readonly [string, string]> {
  return typeof exports === 'string' ? [['.', exports]] : Object.entries(exports);
}
