import { join } from '@std/path';

import { SCAFFOLD_FILES } from '../../kernel/constants/scaffold/scaffold-files.ts';
import type { PackageSourceMode } from '../../kernel/domain/scaffold/scaffold-options.ts';

export async function rewriteCopiedDenoJsons(options: {
  readonly root: string;
  readonly projectName: string;
  readonly importMode: PackageSourceMode;
  readonly workspacePackageName: string | null;
}): Promise<void> {
  for await (const entry of Deno.readDir(options.root)) {
    const path = join(options.root, entry.name);
    if (entry.isDirectory) {
      await rewriteCopiedDenoJsons({ ...options, root: path, workspacePackageName: null });
      continue;
    }

    if (entry.name !== SCAFFOLD_FILES.DENO_JSON) {
      continue;
    }

    const raw = JSON.parse(await Deno.readTextFile(path)) as {
      name?: string;
      imports?: Record<string, string>;
    };

    if (options.workspacePackageName) {
      raw.name = options.workspacePackageName;
    }

    if (raw.imports) {
      raw.imports = rewriteImports(raw.imports, options.importMode);
    }

    await Deno.writeTextFile(path, JSON.stringify(raw, null, 2) + '\n');
  }
}

function rewriteImports(
  imports: Record<string, string>,
  importMode: PackageSourceMode,
): Record<string, string> {
  if (importMode === 'local') {
    return imports;
  }

  return Object.fromEntries(
    Object.entries(imports).map(([specifier, target]) => [
      specifier,
      rewritePackagePathToJsr(target) ?? target,
    ]),
  );
}

export function rewritePackagePathToJsr(target: string): string | null {
  const normalized = target.replaceAll('\\', '/');
  const match = /^(\.\.\/)+(?:packages)\/(?<pkg>[^/]+)(?<rest>\/.*)?$/.exec(normalized);
  const pkg = match?.groups?.pkg;
  if (!pkg) {
    return null;
  }

  const rest = match?.groups?.rest ?? '';
  if (pkg === 'plugin-workers-core') {
    if (rest === '/src/contracts/v1/mod.ts') {
      return 'jsr:@netscript/plugin-workers-core@^1.0.0/contracts';
    }
    if (rest === '/src/domain/public-schema.ts') {
      return 'jsr:@netscript/plugin-workers-core@^1.0.0/schemas';
    }
    if (rest === '/src/streams/mod.ts') {
      return 'jsr:@netscript/plugin-workers-core@^1.0.0/streams';
    }
  }
  const subpath = toJsrSubpath(rest);
  return `jsr:@netscript/${pkg}@^1.0.0${subpath}`;
}

export function toJsrSubpath(rest: string): string {
  if (rest === '' || rest === '/mod.ts' || rest === '/src/mod.ts') {
    return '';
  }

  return `/${rest.replace(/^\//, '').replace(/\/mod\.ts$/, '').replace(/\.ts$/, '')}`;
}
