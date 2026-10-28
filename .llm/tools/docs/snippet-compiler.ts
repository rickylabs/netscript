import { dirname, join, relative, toFileUrl } from '@std/path';
import type { FencedBlock } from './snippet-extractor.ts';
import type { SnippetSiteAnalysis } from './snippet-policy.ts';
import { runSnippetProcess } from './snippet-process.ts';
import {
  materializePageSupports,
  materializeSharedSupports,
  writeSnippetFile,
} from './snippet-supports.ts';
import { resolveWorkspaceSurface } from './snippet-workspace.ts';

const ANSI_SGR = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, 'g');

interface SyntheticModule {
  block: FencedBlock;
  path: string;
  headerLines: number;
}

/** Result of one compilation-only documentation check. */
export interface SnippetCompilationResult {
  code: number;
  /** Unfinished checks must never be absorbed by a caller's known-type-error ratchet. */
  incomplete: boolean;
  stdout: string;
  diagnostics: string;
  memberCount: number;
  catalogCount: number;
  rootLockUnchanged: boolean;
  temporaryLockRewritten: boolean;
}

function pageDirectory(tempRoot: string, sourcePath: string): string {
  return join(tempRoot, 'pages', sourcePath.replaceAll(/[^A-Za-z0-9._-]/g, '_'));
}

function explicitModulePath(block: FencedBlock): string | undefined {
  const firstLine = block.body.split('\n', 1)[0] ?? '';
  const match = /^\/\/\s+([^\s]+\.tsx?)(?:\s|$)/.exec(firstLine);
  if (!match) return undefined;
  const path = match[1].replaceAll('\\', '/');
  if (path.startsWith('/') || path.split('/').includes('..')) {
    throw new Error(
      `${block.sourcePath}:${block.openingLine}: unsafe synthetic module path ${path}`,
    );
  }
  return path.replace(/^\.\//, '');
}

function relativeImport(fromPath: string, toPath: string): string {
  const path = relative(dirname(fromPath), toPath).replaceAll('\\', '/');
  return path.startsWith('.') ? path : `./${path}`;
}

async function materializeModules(
  tempRoot: string,
  blocks: FencedBlock[],
  preamblePath: string,
): Promise<SyntheticModule[]> {
  const modules: SyntheticModule[] = [];
  const occupied = new Set<string>();
  for (const block of blocks) {
    if (!block.compilationExtension || block.exemptionReason !== undefined) continue;
    const pageRoot = pageDirectory(tempRoot, block.sourcePath);
    await materializePageSupports(pageRoot);
    const relativePath = explicitModulePath(block) ??
      `blocks/${
        block.sourcePath.replaceAll(/[^A-Za-z0-9._-]/g, '_')
      }-L${block.openingLine}-B${block.fenceOrdinal}.${block.compilationExtension}`;
    const path = join(pageRoot, relativePath);
    if (occupied.has(path)) {
      throw new Error(
        `${block.sourcePath}:${block.openingLine}: duplicate synthetic path ${relativePath}`,
      );
    }
    occupied.add(path);
    await writeSnippetFile(
      path,
      `// Source fence: ${block.sourcePath}:${block.openingLine}\nimport '${
        relativeImport(path, preamblePath)
      }';\n${block.body}\n`,
    );
    modules.push({ block, path, headerLines: 2 });
  }
  return modules;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function mapDiagnostics(raw: string, modules: SyntheticModule[]): string {
  // CI colors the path, line and column separately; normalize before matching source locations.
  let diagnostics = raw.replaceAll(ANSI_SGR, '');
  for (const module of modules) {
    for (const generatedPath of [module.path, toFileUrl(module.path).href]) {
      diagnostics = diagnostics.replace(
        new RegExp(`${escapeRegExp(generatedPath)}:(\\d+):(\\d+)`, 'g'),
        (_match, lineText: string, column: string) => {
          const generatedLine = Number(lineText);
          const sourceLine = module.block.codeStartLine + generatedLine - module.headerLines - 1;
          return `${module.block.sourcePath}:${
            Math.max(module.block.openingLine, sourceLine)
          }:${column}`;
        },
      );
      diagnostics = diagnostics.replaceAll(generatedPath, module.block.sourcePath);
    }
  }
  return diagnostics;
}

/** Assemble page-isolated synthetic modules and run Deno check without executing snippets. */
export async function compileSnippetAnalysis(
  analysis: SnippetSiteAnalysis,
  repositoryRoot: string,
  options: { timeoutMs?: number; processRunner?: typeof runSnippetProcess } = {},
): Promise<SnippetCompilationResult> {
  const tempRoot = await Deno.makeTempDir({ prefix: 'netscript-doc-snippets-' });
  const rootLockPath = join(repositoryRoot, 'deno.lock');
  const rootLockBefore = await Deno.readTextFile(rootLockPath);
  try {
    const preamblePath = join(tempRoot, '_shared/preamble.ts');
    await writeSnippetFile(preamblePath, 'export {};\n');
    const supportImports = await materializeSharedSupports(tempRoot);
    const workspace = await resolveWorkspaceSurface(repositoryRoot, supportImports);
    const modules = await materializeModules(tempRoot, analysis.tier1Blocks, preamblePath);
    const configPath = join(tempRoot, 'deno.json');
    await Deno.writeTextFile(
      configPath,
      `${
        JSON.stringify(
          {
            compilerOptions: {
              strict: true,
              noImplicitAny: true,
              noImplicitReturns: true,
              isolatedDeclarations: false,
              jsx: 'precompile',
              jsxImportSource: 'preact',
            },
            imports: workspace.imports,
            catalog: workspace.catalog,
          },
          null,
          2,
        )
      }\n`,
    );
    const tempLockPath = join(tempRoot, 'deno.lock');
    await Deno.copyFile(rootLockPath, tempLockPath);
    const processRunner = options.processRunner ?? runSnippetProcess;
    const checkModules = (entries: SyntheticModule[], source: string) =>
      processRunner(Deno.execPath(), [
        'check',
        '--unstable-kv',
        '--lock',
        tempLockPath,
        '--config',
        configPath,
        ...entries.map((module) => module.path),
      ], { cwd: repositoryRoot, source, timeoutMs: options.timeoutMs });
    let stdout = '';
    let diagnostics = '';
    let code = 0;
    let incomplete = false;
    // One compiler shares graph loading and type-checking across the whole corpus.
    if (modules.length > 0) {
      console.error(`Checking documentation corpus (${modules.length} fences)`);
      const output = await checkModules(modules, 'documentation corpus');
      code = output.code;
      incomplete = output.timedOut || output.interrupted;
      stdout = output.stdout;
      diagnostics = mapDiagnostics(output.stderr, modules);
      // After a timeout, identify a stalled fence under the same deadline and group cleanup.
      // External cancellation must abort instead of starting more compiler processes.
      if (output.timedOut && !output.interrupted) {
        for (const module of modules) {
          const source = `${module.block.sourcePath}:${module.block.openingLine}`;
          console.error(`Diagnosing documentation snippet ${source}`);
          const probe = await checkModules([module], source);
          stdout += probe.stdout;
          diagnostics += mapDiagnostics(probe.stderr, modules);
          if (probe.timedOut || probe.interrupted) break;
        }
      }
    }
    const fences = modules.map((module) => `${module.block.sourcePath}:${module.block.openingLine}`)
      .join(', ');
    const rootLockAfter = await Deno.readTextFile(rootLockPath);
    const tempLockAfter = await Deno.readTextFile(tempLockPath);
    const rootLockUnchanged = rootLockBefore === rootLockAfter;
    if (!rootLockUnchanged) throw new Error('tracked root deno.lock changed during snippet check');
    return {
      code,
      incomplete,
      stdout,
      diagnostics: `source fences: ${fences}\n${diagnostics}`,
      memberCount: workspace.memberCount,
      catalogCount: Object.keys(workspace.catalog).length,
      rootLockUnchanged,
      temporaryLockRewritten: rootLockBefore !== tempLockAfter,
    };
  } finally {
    await Deno.remove(tempRoot, { recursive: true });
  }
}
