import { decodeBase64 } from 'jsr:@std/encoding@^1.0.10/base64';
import { join, resolve, toFileUrl } from '@std/path';
import {
  EMBEDDED_AGENT_DOCS_GZIP_BASE64,
  EMBEDDED_AGENT_DOCS_PACKAGE_EXPORTS,
  EMBEDDED_AGENT_DOCS_PROVENANCE,
} from '../../../kernel/assets/agent-docs.generated.ts';
import { NETSCRIPT_RELEASE_VERSION } from '../../../kernel/constants/jsr-specifiers.ts';
import type {
  AgentDocsGeneration,
  AgentDocsGenerator,
} from '../../features/agent/init/agent-docs-generator.ts';

/** Captured command result used by exact-version API documentation generation. */
export interface AgentDocsCommandResult {
  readonly code: number;
  readonly stdout: string;
  readonly stderr: string;
}

/** Process seam for `deno doc`, including launch-throw fixtures. */
export interface AgentDocsCommandRunner {
  run(specifier: string, cwd: string): Promise<AgentDocsCommandResult>;
}

/** Installed NetScript package proven by project config/lock or workspace metadata. */
export interface InstalledNetScriptPackage {
  readonly name: string;
  readonly version: string;
  /** Local package root when documentation must come from workspace source. */
  readonly packageRoot?: string;
}

interface ProjectConfig {
  readonly imports?: Readonly<Record<string, string>>;
}

interface LockFile {
  readonly specifiers?: Readonly<Record<string, string>>;
}

const EXACT_VERSION = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;
const JSR_NETSCRIPT = /^jsr:(@netscript\/[a-z0-9-]+)@([^/]+)(\/.*)?$/;

async function readJson<T>(
  path: string,
  required: boolean,
): Promise<T | undefined> {
  try {
    return JSON.parse(await Deno.readTextFile(path)) as T;
  } catch (error) {
    if (!required && error instanceof Deno.errors.NotFound) return undefined;
    throw new Error(
      `Cannot read documentation package evidence from ${path}: ${String(error)}`,
    );
  }
}

interface WorkspacePackage {
  readonly version: string;
  readonly packageRoot: string;
}

async function findWorkspacePackage(
  root: string,
  packageName: string,
  depth = 0,
): Promise<WorkspacePackage | undefined> {
  if (depth > 4) return undefined;
  for await (const entry of Deno.readDir(root)) {
    if (
      !entry.isDirectory ||
      ['.git', '.llm', '.netscript', 'node_modules'].includes(entry.name)
    ) {
      continue;
    }
    const directory = join(root, entry.name);
    const manifest = await readJson<
      { readonly name?: string; readonly version?: string }
    >(
      join(directory, 'deno.json'),
      false,
    );
    if (manifest?.name === packageName && manifest.version) {
      return { version: manifest.version, packageRoot: directory };
    }
    const nested = await findWorkspacePackage(
      directory,
      packageName,
      depth + 1,
    );
    if (nested) return nested;
  }
  return undefined;
}

function lockedVersion(
  lock: LockFile | undefined,
  packageName: string,
  requested: string,
  fullSpecifier: string,
): string | undefined {
  if (EXACT_VERSION.test(requested)) return requested;
  return lock?.specifiers?.[`jsr:${packageName}@${requested}`] ??
    lock?.specifiers?.[fullSpecifier];
}

/** Resolve exact installed `@netscript/*` versions without registry access. */
export async function resolveInstalledNetScriptPackages(
  projectRoot: string,
): Promise<readonly InstalledNetScriptPackage[]> {
  const config = await readJson<ProjectConfig>(
    join(projectRoot, 'deno.json'),
    true,
  );
  const lock = await readJson<LockFile>(join(projectRoot, 'deno.lock'), false);
  const installed = new Map<string, InstalledNetScriptPackage>();
  for (const [alias, value] of Object.entries(config?.imports ?? {})) {
    const match = value.match(JSR_NETSCRIPT);
    let name: string | undefined;
    let version: string | undefined;
    let packageRoot: string | undefined;
    if (match) {
      name = match[1];
      version = lockedVersion(lock, name, match[2], value);
    } else if (
      alias.startsWith('@netscript/') &&
      /^(workspace:|file:|\.?\.?\/)/.test(value)
    ) {
      name = alias;
      const workspacePackage = await findWorkspacePackage(projectRoot, alias);
      version = workspacePackage?.version;
      packageRoot = workspacePackage?.packageRoot;
    } else {
      continue;
    }
    if (!name || !version || !EXACT_VERSION.test(version)) {
      throw new Error(
        `Cannot prove an exact installed version for ${name ?? alias} (${value})`,
      );
    }
    const prior = installed.get(name);
    if (prior && prior.version !== version) {
      throw new Error(
        `Installed ${name} versions disagree: ${prior.version} and ${version}`,
      );
    }
    installed.set(name, {
      name,
      version,
      ...(packageRoot ? { packageRoot } : {}),
    });
  }
  if (installed.size === 0) {
    throw new Error(
      'No installed @netscript/* package evidence was found in deno.json',
    );
  }
  return [...installed.values()].sort((left, right) => left.name.localeCompare(right.name));
}

async function sha256(bytes: Uint8Array): Promise<string> {
  const copied = new Uint8Array(bytes.byteLength);
  copied.set(bytes);
  const digest = await crypto.subtle.digest('SHA-256', copied.buffer);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function inflateProse(): Promise<Readonly<Record<string, string>>> {
  const compressed = decodeBase64(EMBEDDED_AGENT_DOCS_GZIP_BASE64);
  if (await sha256(compressed) !== EMBEDDED_AGENT_DOCS_PROVENANCE.sha256) {
    throw new Error(
      'Embedded offline documentation prose failed its SHA-256 check',
    );
  }
  const stream = new Blob([new Uint8Array(compressed).buffer]).stream()
    .pipeThrough(
      new DecompressionStream('gzip'),
    );
  const decoded = JSON.parse(await new Response(stream).text()) as {
    readonly schemaVersion: number;
    readonly files: Readonly<Record<string, string>>;
  };
  if (
    decoded.schemaVersion !== 1 ||
    !/^## Task router$/m.test(decoded.files['llms.txt'] ?? '')
  ) {
    throw new Error(
      'Embedded offline documentation prose is missing the #1068 task router',
    );
  }
  return decoded.files;
}

async function apiSpecifier(
  pkg: InstalledNetScriptPackage,
  subpath: string,
): Promise<string> {
  if (!pkg.packageRoot) {
    return `jsr:${pkg.name}@${pkg.version}${subpath === '.' ? '' : subpath.slice(1)}`;
  }
  const manifestPath = join(pkg.packageRoot, 'deno.json');
  const manifest = await readJson<
    { readonly exports?: string | Readonly<Record<string, string>> }
  >(
    manifestPath,
    true,
  );
  const target = typeof manifest?.exports === 'string'
    ? subpath === '.' ? manifest.exports : undefined
    : manifest?.exports?.[subpath];
  if (!target) {
    throw new Error(
      `No local export ${subpath} exists for ${pkg.name} in ${manifestPath}`,
    );
  }
  return toFileUrl(resolve(pkg.packageRoot, target)).href;
}

/** Real `deno doc` process adapter. */
export class DenoAgentDocsCommandRunner implements AgentDocsCommandRunner {
  async run(specifier: string, cwd: string): Promise<AgentDocsCommandResult> {
    const output = await new Deno.Command(Deno.execPath(), {
      args: ['doc', '--unstable-kv', specifier],
      cwd,
      env: { NO_COLOR: '1' },
      stdout: 'piped',
      stderr: 'piped',
    }).output();
    const decoder = new TextDecoder();
    return {
      code: output.code,
      stdout: decoder.decode(output.stdout),
      stderr: decoder.decode(output.stderr),
    };
  }
}

/** Builds a complete, exact-version docs map before the caller writes any output. */
export class DenoAgentDocsGenerator implements AgentDocsGenerator {
  constructor(
    private readonly runner: AgentDocsCommandRunner = new DenoAgentDocsCommandRunner(),
    private readonly now: () => Date = () => new Date(),
  ) {}

  async generate(projectRoot: string): Promise<AgentDocsGeneration> {
    if (EMBEDDED_AGENT_DOCS_PROVENANCE.version !== NETSCRIPT_RELEASE_VERSION) {
      throw new Error(
        `Offline docs ${EMBEDDED_AGENT_DOCS_PROVENANCE.version} do not match CLI ${NETSCRIPT_RELEASE_VERSION}`,
      );
    }
    const installed = await resolveInstalledNetScriptPackages(projectRoot);
    for (const pkg of installed) {
      if (pkg.version !== NETSCRIPT_RELEASE_VERSION) {
        throw new Error(
          `Installed ${pkg.name}@${pkg.version} does not match CLI ${NETSCRIPT_RELEASE_VERSION}`,
        );
      }
    }

    const files: Record<string, string> = { ...await inflateProse() };
    let apiExportCount = 0;
    for (const pkg of installed) {
      const subpaths = EMBEDDED_AGENT_DOCS_PACKAGE_EXPORTS[pkg.name];
      if (!subpaths?.length) {
        throw new Error(`No release export map exists for ${pkg.name}`);
      }
      const sections: string[] = [];
      for (const subpath of subpaths) {
        const specifier = await apiSpecifier(pkg, subpath);
        let result: AgentDocsCommandResult;
        try {
          result = await this.runner.run(specifier, projectRoot);
        } catch (error) {
          throw new Error(
            `Failed to launch deno doc for ${specifier}: ${String(error)}`,
          );
        }
        if (result.code !== 0 || result.stdout.trim().length === 0) {
          throw new Error(
            `deno doc failed for ${specifier} (exit ${result.code}): ${result.stderr.trim()}`,
          );
        }
        sections.push(
          `${'='.repeat(72)}\nimport ... from "${specifier}"\n${
            '='.repeat(72)
          }\n\n${result.stdout.trim()}\n`,
        );
        apiExportCount += 1;
      }
      files[`deno-doc/${pkg.name.slice('@netscript/'.length)}.txt`] = `${sections.join('\n')}\n`;
    }

    files['MANIFEST.md'] = this.renderManifest(
      installed,
      Object.keys(files).length,
      apiExportCount,
    );
    return {
      files,
      frameworkVersion: NETSCRIPT_RELEASE_VERSION,
      proseFileCount: EMBEDDED_AGENT_DOCS_PROVENANCE.files.length,
      apiPackageCount: installed.length,
      apiExportCount,
    };
  }

  private renderManifest(
    installed: readonly InstalledNetScriptPackage[],
    pageCount: number,
    apiExportCount: number,
  ): string {
    const packages = installed.map((pkg) => `| \`${pkg.name}\` | \`${pkg.version}\` |`).join('\n');
    return `# NetScript offline documentation\n\n` +
      `Generated for the exact NetScript packages installed in this project. Start with \`llms.txt\` for the task router and use \`llms-full.txt\` as the grep target.\n\n` +
      `| Field | Value |\n| --- | --- |\n` +
      `| Framework / CLI version | \`${NETSCRIPT_RELEASE_VERSION}\` |\n` +
      `| Prose source commit | \`${EMBEDDED_AGENT_DOCS_PROVENANCE.sourceCommit}\` |\n` +
      `| Prose extraction time | \`${EMBEDDED_AGENT_DOCS_PROVENANCE.extractionTimestamp}\` |\n` +
      `| API generation time | \`${this.now().toISOString()}\` |\n` +
      `| Prose files | ${EMBEDDED_AGENT_DOCS_PROVENANCE.files.length} |\n` +
      `| Total files | ${pageCount + 1} |\n` +
      `| API packages / export subpaths | ${installed.length} / ${apiExportCount} |\n\n` +
      `## Documented installed packages\n\n| Package | Exact version |\n| --- | --- |\n${packages}\n`;
  }
}
