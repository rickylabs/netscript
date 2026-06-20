import { join } from "@std/path";
import { parse as parseJsonc } from "@std/jsonc";

import { SCAFFOLD_FILES } from "../../kernel/constants/scaffold/scaffold-files.ts";
import type { PackageSourceMode } from "../../kernel/domain/scaffold/scaffold-options.ts";

export async function rewriteCopiedDenoJsons(options: {
  readonly root: string;
  readonly projectName: string;
  readonly importMode: PackageSourceMode;
  readonly workspacePackageName: string | null;
  readonly localProjectRoot?: string;
  readonly catalog?: Readonly<Record<string, string>>;
}): Promise<void> {
  for await (const entry of Deno.readDir(options.root)) {
    const path = join(options.root, entry.name);
    if (entry.isDirectory) {
      await rewriteCopiedDenoJsons({
        ...options,
        root: path,
        workspacePackageName: null,
        localProjectRoot: options.localProjectRoot
          ? toPosixPath(join("..", options.localProjectRoot))
          : undefined,
      });
      continue;
    }

    if (entry.name !== SCAFFOLD_FILES.DENO_JSON) {
      continue;
    }

    const raw = parseJsonc(await Deno.readTextFile(path)) as {
      name?: string;
      imports?: Record<string, string>;
    };

    if (options.workspacePackageName) {
      raw.name = options.workspacePackageName;
    }

    if (raw.imports) {
      raw.imports = rewriteImports(
        raw.imports,
        options.importMode,
        options.localProjectRoot,
        options.catalog,
      );
    }

    await Deno.writeTextFile(path, JSON.stringify(raw, null, 2) + "\n");
  }
}

function rewriteImports(
  imports: Record<string, string>,
  importMode: PackageSourceMode,
  localProjectRoot?: string,
  catalog?: Readonly<Record<string, string>>,
): Record<string, string> {
  const localImports = localProjectRoot
    ? Object.fromEntries(
      Object.entries(imports).map(([specifier, target]) => [
        specifier,
        rewriteLocalProjectPath(target, localProjectRoot) ?? target,
      ]),
    )
    : imports;

  if (importMode === "local") {
    return materializeCatalogImports(localImports, catalog);
  }

  return Object.fromEntries(
    Object.entries(localImports).map(([specifier, target]) => [
      specifier,
      rewritePackagePathToJsr(target) ?? target,
    ]),
  );
}

function materializeCatalogImports(
  imports: Record<string, string>,
  catalog?: Readonly<Record<string, string>>,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(imports).map(([specifier, target]) => {
      if (target !== "catalog:") {
        return [specifier, target];
      }

      const version = catalog?.[specifier];
      if (!version) {
        throw new Error(
          `Cannot materialize catalog import "${specifier}": catalog entry missing.`,
        );
      }

      return [specifier, `npm:${specifier}@${version}`];
    }),
  );
}

export async function readRootCatalog(
  sourceRoot: string,
): Promise<Record<string, string> | undefined> {
  const sourceDenoJsonPath = join(sourceRoot, SCAFFOLD_FILES.DENO_JSON);
  let sourceRootConfig: { readonly catalog?: unknown };
  try {
    sourceRootConfig = JSON.parse(
      await Deno.readTextFile(sourceDenoJsonPath),
    ) as {
      readonly catalog?: unknown;
    };
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      return undefined;
    }
    throw error;
  }

  if (!isStringRecord(sourceRootConfig.catalog)) {
    return undefined;
  }

  return sourceRootConfig.catalog;
}

function isStringRecord(value: unknown): value is Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  return Object.values(value).every((entry) => typeof entry === "string");
}

const OFFICIAL_PLUGIN_DIRS = new Set([
  "sagas",
  "streams",
  "triggers",
  "workers",
]);

function rewriteLocalProjectPath(
  target: string,
  localProjectRoot: string,
): string | null {
  const normalized = target.replaceAll("\\", "/");
  const packageMatch = /^(\.\.\/)+packages\/(?<rest>.+)$/.exec(normalized);
  if (packageMatch?.groups?.rest) {
    return `${localProjectRoot}/packages/${packageMatch.groups.rest}`;
  }

  const pluginMatch = /^(\.\.\/)+(?<plugin>[^/]+)(?<rest>\/.*)?$/.exec(
    normalized,
  );
  const plugin = pluginMatch?.groups?.plugin;
  if (!plugin || !OFFICIAL_PLUGIN_DIRS.has(plugin)) {
    return null;
  }

  return `${localProjectRoot}/plugins/${plugin}${
    pluginMatch?.groups?.rest ?? ""
  }`;
}

function toPosixPath(path: string): string {
  return path.replaceAll("\\", "/");
}

export function rewritePackagePathToJsr(target: string): string | null {
  const normalized = target.replaceAll("\\", "/");
  const match = /^(\.\.\/)+(?:packages)\/(?<pkg>[^/]+)(?<rest>\/.*)?$/.exec(
    normalized,
  );
  const pkg = match?.groups?.pkg;
  if (!pkg) {
    return null;
  }

  const rest = match?.groups?.rest ?? "";
  if (pkg === "plugin-workers-core") {
    if (rest === "/src/contracts/v1/mod.ts") {
      return "jsr:@netscript/plugin-workers-core@^1.0.0/contracts";
    }
    if (rest === "/src/domain/public-schema.ts") {
      return "jsr:@netscript/plugin-workers-core@^1.0.0/schemas";
    }
    if (rest === "/src/streams/mod.ts") {
      return "jsr:@netscript/plugin-workers-core@^1.0.0/streams";
    }
  }
  if (pkg === "plugin-auth-core") {
    if (rest === "/src/config/mod.ts") {
      return "jsr:@netscript/plugin-auth-core@^1.0.0/config";
    }
    if (rest === "/src/contracts/v1/mod.ts") {
      return "jsr:@netscript/plugin-auth-core@^1.0.0/contracts/v1";
    }
    if (rest === "/src/domain/mod.ts") {
      return "jsr:@netscript/plugin-auth-core@^1.0.0/domain";
    }
    if (rest === "/src/ports/mod.ts") {
      return "jsr:@netscript/plugin-auth-core@^1.0.0/ports";
    }
    if (rest === "/src/streams/mod.ts") {
      return "jsr:@netscript/plugin-auth-core@^1.0.0/streams";
    }
    if (rest === "/src/testing/mod.ts") {
      return "jsr:@netscript/plugin-auth-core@^1.0.0/testing";
    }
  }
  const subpath = toJsrSubpath(rest);
  return `jsr:@netscript/${pkg}@^1.0.0${subpath}`;
}

export function toJsrSubpath(rest: string): string {
  if (rest === "" || rest === "/mod.ts" || rest === "/src/mod.ts") {
    return "";
  }

  return `/${
    rest.replace(/^\//, "").replace(/\/mod\.ts$/, "").replace(/\.ts$/, "")
  }`;
}
