/** Build per-target Deno compile config content for single-binary targets. */
import { join } from '@std/path';
import { discoverWorkspace } from '@netscript/config';
import { COMPILE_CONFIG, DEFAULT_BUNDLE_EXTERNAL_IMPORTS } from '../../../constants/windows.ts';

// ============================================================================
// COMPILE CONFIG BUILDER
// ============================================================================

const DEFAULT_UNSTABLE_FLAGS = ['kv', 'temporal', 'tsgo', 'worker-options', 'raw-imports'];

const DEFAULT_COMPILER_OPTIONS = {
  strict: true,
  noImplicitAny: true,
  noImplicitReturns: true,
  noUnusedLocals: false,
  noUnusedParameters: false,
};

function stringifyCompileConfig(
  imports: Record<string, string>,
  workspace?: string[],
  unstable: string[] = DEFAULT_UNSTABLE_FLAGS,
): string {
  return JSON.stringify(
    {
      version: '1.0.0',
      nodeModulesDir: 'none',
      imports,
      ...(workspace ? { workspace } : {}),
      unstable,
      compilerOptions: DEFAULT_COMPILER_OPTIONS,
    },
    null,
    2,
  );
}

/**
 * Build the JSON content for the per-target temp compile config.
 *
 * Derives the workspace array from the root deno.json at runtime, filtering
 * out `apps/*` entries (frontend packages bring Vite/Tailwind into the
 * resolution graph, bloating binaries). Falls back to the COMPILE_CONFIG
 * constant if deno.json cannot be read.
 *
 * @param projectRoot    Absolute path to the project root
 * @param workspaceOverride  Optional explicit workspace array (from config.deploy.targets.windows.workspace)
 * @param bundleExternalImports  npm specifier rewrites for externalized packages
 */
export async function buildCompileConfig(
  projectRoot: string,
  workspaceOverride?: string[],
  bundleExternalImports?: Record<string, string>,
  includeAppPath?: string,
): Promise<string> {
  const imports = bundleExternalImports ?? DEFAULT_BUNDLE_EXTERNAL_IMPORTS;

  // Use explicit override if provided
  if (workspaceOverride) {
    return stringifyCompileConfig(imports, workspaceOverride);
  }

  // Derive workspace from the named Deno workspace members, filtering apps/*.
  try {
    const workspace = (await discoverWorkspace(projectRoot)).members
      .map((member) => member.path)
      .filter((entry) => !entry.startsWith('apps/') && entry !== 'apps');

    // Include the specific app workspace member if compiling an app target
    // (exclude other apps to avoid cross-contamination of import maps)
    if (includeAppPath) {
      workspace.push(includeAppPath);
    }

    if (workspace.length > 0) {
      return stringifyCompileConfig(imports, workspace);
    }
  } catch {
    // Fall through to the root deno.json unstable flags / static fallback.
  }

  try {
    const denoJsonText = await Deno.readTextFile(join(projectRoot, 'deno.json'));
    const denoJson = JSON.parse(denoJsonText) as { unstable?: string[] };
    return stringifyCompileConfig(imports, undefined, denoJson.unstable ?? DEFAULT_UNSTABLE_FLAGS);
  } catch {
    // Fall through to the static fallback config.
  }

  // Fallback: use the compiled-in base config (no hardcoded workspace members).
  return COMPILE_CONFIG.content;
}
