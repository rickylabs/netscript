import { dirname, join, relative, toFileUrl } from '@std/path';
import type { FencedBlock } from './snippet-extractor.ts';
import type { SnippetSiteAnalysis } from './snippet-policy.ts';
import {
  materializePageSupports,
  materializeSharedSupports,
  writeSnippetFile,
} from './snippet-supports.ts';
import { resolveWorkspaceSurface } from './snippet-workspace.ts';

interface SyntheticModule {
  block: FencedBlock;
  path: string;
  headerLines: number;
}

/** Result of one compilation-only documentation check. */
export interface SnippetCompilationResult {
  code: number;
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
  let diagnostics = raw;
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
  const fences = modules.map((module) => `${module.block.sourcePath}:${module.block.openingLine}`)
    .join(', ');
  return `source fences: ${fences}\n${diagnostics}`;
}

/** Assemble page-isolated synthetic modules and run Deno check without executing snippets. */
export async function compileSnippetAnalysis(
  analysis: SnippetSiteAnalysis,
  repositoryRoot: string,
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
    const output = await new Deno.Command(Deno.execPath(), {
      cwd: repositoryRoot,
      args: [
        'check',
        '--unstable-kv',
        '--lock',
        tempLockPath,
        '--config',
        configPath,
        ...modules.map((module) => module.path),
      ],
      stdout: 'piped',
      stderr: 'piped',
    }).output();
    const rootLockAfter = await Deno.readTextFile(rootLockPath);
    const tempLockAfter = await Deno.readTextFile(tempLockPath);
    const rootLockUnchanged = rootLockBefore === rootLockAfter;
    if (!rootLockUnchanged) throw new Error('tracked root deno.lock changed during snippet check');
    return {
      code: output.code,
      stdout: new TextDecoder().decode(output.stdout),
      diagnostics: mapDiagnostics(new TextDecoder().decode(output.stderr), modules),
      memberCount: workspace.memberCount,
      catalogCount: Object.keys(workspace.catalog).length,
      rootLockUnchanged,
      temporaryLockRewritten: rootLockBefore !== tempLockAfter,
    };
  } finally {
    await Deno.remove(tempRoot, { recursive: true });
  }
}
