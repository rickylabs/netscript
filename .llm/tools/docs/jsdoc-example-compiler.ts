import { dirname, join, relative, toFileUrl } from '@std/path';
import {
  type JsdocDeferredExample,
  type JsdocExampleAnalysis,
  type JsdocExampleBlock,
  type JsdocExampleCompilationResult,
  type JsdocFailureCensus,
} from './jsdoc-example-contract.ts';
import {
  materializeSharedSupports,
  scaffoldAliasViolation,
  writeSnippetFile,
} from './snippet-supports.ts';
import { resolveWorkspaceSurface } from './snippet-workspace.ts';

interface SyntheticExampleModule {
  block: JsdocExampleBlock;
  path: string;
  headerLines: number;
}
interface PrecompileDiagnostic {
  message: string;
  failureClass: 'badSpecifier' | 'typeError';
  block: JsdocExampleBlock;
  tsCodes: number[];
}

interface DiagnosticClassification {
  census: Pick<JsdocFailureCensus, 'badSpecifier' | 'typeError' | 'unboundName'>;
  deferredExamples: JsdocDeferredExample[];
}

const IMPORT_SPECIFIER = /(?:\bfrom\s*|\bimport\s*\(|\bimport\s*)['"]([^'"]+)['"]/g;
const ANSI_PATTERN = /\u001b\[[0-9;]*m/g;

function stripAnsi(text: string): string {
  return text.replaceAll(ANSI_PATTERN, '');
}

function emptyFailureCensus(analysis: JsdocExampleAnalysis): JsdocFailureCensus {
  return {
    badSpecifier: 0,
    typeError: 0,
    unboundName: 0,
    unfenced: analysis.census.unfenced,
    malformed: analysis.census.malformed,
  };
}

function ownerLabel(block: JsdocExampleBlock): string {
  return `${block.owner.sourcePath} · ${block.owner.kind}${
    block.owner.symbol ? ` ${block.owner.symbol}` : ''
  } · example ${block.exampleOrdinal} · fence ${block.fenceOrdinal}`;
}

const TYPE_PARAMETER_ARITY = new Map<string, number>();

/**
 * Count a declaration's type parameters so the injected shim can mirror its arity.
 *
 * Returns 0 when the declaration is absent or non-generic. Angle-bracket depth ignores the
 * `>` of an arrow return type so a defaulted function-typed parameter is not miscounted.
 */
function declarationTypeParameterArity(root: string, sourcePath: string, symbol: string): number {
  const key = `${sourcePath}::${symbol}`;
  const cached = TYPE_PARAMETER_ARITY.get(key);
  if (cached !== undefined) return cached;
  let arity = 0;
  try {
    const source = Deno.readTextFileSync(join(root, sourcePath));
    const escaped = symbol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const declaration = new RegExp(
      `export\\s+(?:declare\\s+)?(?:abstract\\s+)?(?:type|interface|class)\\s+${escaped}\\s*<`,
    ).exec(source);
    if (declaration) {
      let depth = 1;
      let commas = 0;
      for (let i = declaration.index + declaration[0].length; i < source.length && depth > 0; i++) {
        const char = source[i];
        if (char === '<') depth += 1;
        else if (char === '>' && source[i - 1] !== '=') depth -= 1;
        else if (char === ',' && depth === 1) commas += 1;
      }
      if (depth === 0) arity = commas + 1;
    }
  } catch {
    arity = 0;
  }
  TYPE_PARAMETER_ARITY.set(key, arity);
  return arity;
}

function preamble(block: JsdocExampleBlock, repositoryRoot: string): string {
  const owner = block.owner;
  if (owner.kind !== 'symbol' || !owner.symbol || !owner.publicSpecifier) return 'export {};\n';
  const importedType = `import(${JSON.stringify(owner.publicSpecifier)}).${owner.symbol}`;
  const lines = ['export {};', 'declare global {'];
  if (owner.declarationKind === 'value' || owner.declarationKind === 'class') {
    lines.push(`  const ${owner.symbol}: typeof ${importedType};`);
  }
  if (owner.declarationKind === 'type' || owner.declarationKind === 'class') {
    // A bare `type X = import(spec).X` alias drops the declaration's type parameters, so a
    // documented generic type fails TS2315 when its own example applies type arguments. Mirror
    // the arity instead; the real constraints are still enforced where the alias applies them,
    // and `any` defaults keep the bare `X` spelling valid.
    const arity = declarationTypeParameterArity(repositoryRoot, owner.sourcePath, owner.symbol);
    if (arity > 0) {
      const parameters = Array.from({ length: arity }, (_, index) => `P${index + 1}`);
      lines.push(
        `  type ${owner.symbol}<${
          parameters.map((parameter) => `${parameter} = any`).join(', ')
        }> = ${importedType}<${parameters.join(', ')}>;`,
      );
    } else {
      lines.push(`  type ${owner.symbol} = ${importedType};`);
    }
  }
  lines.push('}', '');
  return lines.join('\n');
}

function forbiddenSpecifier(
  block: JsdocExampleBlock,
  publicImports: Record<string, string>,
): string | undefined {
  for (const match of block.body.matchAll(IMPORT_SPECIFIER)) {
    const specifier = match[1];
    if (!specifier) continue;
    if (specifier.startsWith('.') || specifier.startsWith('/') || specifier.startsWith('file:')) {
      return `relative/absolute import ${
        JSON.stringify(specifier)
      } is not a published consumer specifier`;
    }
    if (specifier.startsWith('@netscript/') && !(specifier in publicImports)) {
      return `undeclared NetScript subpath ${JSON.stringify(specifier)}`;
    }
    const scaffoldViolation = scaffoldAliasViolation(specifier, block.owner.memberName);
    if (scaffoldViolation) return scaffoldViolation;
  }
  return undefined;
}

function invalidPlaceholder(
  block: JsdocExampleBlock,
): { message: string; tsCodes: number[] } | undefined {
  const code = maskCommentsAndStrings(block.body);
  if (/\.\.\.\s*(?=[,)};\n])/.test(code)) {
    return {
      message:
        'standalone ellipsis is not valid TypeScript; narrow the example or provide a typed stand-in',
      tsCodes: [1109],
    };
  }
  if (/^\s*[A-Za-z_$][\w$]*\s*:/.test(code)) {
    return {
      message:
        'object-member fragment is not valid as a standalone module; narrow or wrap the example',
      tsCodes: [1005],
    };
  }
  return undefined;
}

function maskCommentsAndStrings(source: string): string {
  let result = '';
  let state: 'code' | 'lineComment' | 'blockComment' | 'single' | 'double' | 'template' = 'code';
  let escaped = false;
  for (let index = 0; index < source.length; index++) {
    const character = source[index];
    const next = source[index + 1];
    if (state === 'code') {
      if (character === '/' && next === '/') {
        result += '  ';
        state = 'lineComment';
        index += 1;
      } else if (character === '/' && next === '*') {
        result += '  ';
        state = 'blockComment';
        index += 1;
      } else if (character === "'") {
        result += ' ';
        state = 'single';
      } else if (character === '"') {
        result += ' ';
        state = 'double';
      } else if (character === '`') {
        result += ' ';
        state = 'template';
      } else {
        result += character;
      }
      continue;
    }
    if (state === 'lineComment') {
      if (character === '\n') {
        result += '\n';
        state = 'code';
      } else result += ' ';
      continue;
    }
    if (state === 'blockComment') {
      if (character === '*' && next === '/') {
        result += '  ';
        state = 'code';
        index += 1;
      } else result += character === '\n' ? '\n' : ' ';
      continue;
    }
    result += character === '\n' ? '\n' : ' ';
    if (escaped) {
      escaped = false;
    } else if (character === '\\') {
      escaped = true;
    } else if (
      (state === 'single' && character === "'") ||
      (state === 'double' && character === '"') ||
      (state === 'template' && character === '`')
    ) {
      state = 'code';
    }
  }
  return result;
}

async function materializeModules(
  tempRoot: string,
  blocks: JsdocExampleBlock[],
  imports: Record<string, string>,
  repositoryRoot: string,
): Promise<{ modules: SyntheticExampleModule[]; policyDiagnostics: PrecompileDiagnostic[] }> {
  const modules: SyntheticExampleModule[] = [];
  const policyDiagnostics: PrecompileDiagnostic[] = [];
  for (const [index, block] of blocks.entries()) {
    if (!block.compilationExtension) continue;
    const forbidden = forbiddenSpecifier(block, imports);
    if (forbidden) {
      policyDiagnostics.push({
        message: `${ownerLabel(block)}: ${forbidden}`,
        failureClass: 'badSpecifier',
        block,
        tsCodes: [],
      });
      continue;
    }
    if (block.exemptionReason !== undefined) continue;
    const placeholder = invalidPlaceholder(block);
    if (placeholder) {
      policyDiagnostics.push({
        message: `${ownerLabel(block)}: ${placeholder.message}`,
        failureClass: 'typeError',
        block,
        tsCodes: placeholder.tsCodes,
      });
      continue;
    }
    const directory = join(tempRoot, 'examples', String(index + 1));
    const preamblePath = join(directory, 'preamble.ts');
    const modulePath = join(directory, `example.${block.compilationExtension}`);
    await writeSnippetFile(preamblePath, preamble(block, repositoryRoot));
    await writeSnippetFile(
      modulePath,
      `// ${ownerLabel(block)}\nimport './preamble.ts';\n${block.body}\n`,
    );
    modules.push({ block, path: modulePath, headerLines: 2 });
  }
  return { modules, policyDiagnostics };
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function mapDiagnostics(raw: string, modules: SyntheticExampleModule[]): string {
  let mapped = raw;
  for (const module of modules) {
    const label = ownerLabel(module.block);
    for (const generated of [module.path, toFileUrl(module.path).href]) {
      mapped = mapped.replace(
        new RegExp(`${escapeRegExp(generated)}:(\\d+):(\\d+)`, 'g'),
        (_match, line: string, column: string) =>
          `${label}:${Math.max(1, Number(line) - module.headerLines)}:${column}`,
      );
      mapped = mapped.replaceAll(generated, label);
    }
  }
  return mapped;
}

function classifyDiagnostics(
  raw: string,
  modules: SyntheticExampleModule[],
  policyDiagnostics: PrecompileDiagnostic[],
  analysis: JsdocExampleAnalysis,
): {
  failureCensus: JsdocFailureCensus;
  deferredExamples: JsdocDeferredExample[];
  classifiedCompilerFailureCount: number;
} {
  const census = emptyFailureCensus(analysis);
  const precompiledDeferred = policyDiagnostics
    .filter((finding) => finding.failureClass === 'typeError')
    .map((finding): JsdocDeferredExample => ({
      failureClass: 'typeError',
      owner: finding.block.owner,
      exampleOrdinal: finding.block.exampleOrdinal,
      fenceOrdinal: finding.block.fenceOrdinal,
      tsCodes: finding.tsCodes,
    }));
  census.badSpecifier =
    policyDiagnostics.filter((finding) => finding.failureClass === 'badSpecifier').length;
  census.typeError = precompiledDeferred.length;
  const compiler = classifyDenoCheckDiagnostics(raw, modules);
  census.badSpecifier += compiler.census.badSpecifier;
  census.typeError += compiler.census.typeError;
  census.unboundName += compiler.census.unboundName;
  return {
    failureCensus: census,
    deferredExamples: [...precompiledDeferred, ...compiler.deferredExamples],
    classifiedCompilerFailureCount: Object.values(compiler.census).reduce(
      (sum, count) => sum + count,
      0,
    ),
  };
}

/** Classify each synthetic module from deterministic, ANSI-independent Deno diagnostics. */
export function classifyDenoCheckDiagnostics(
  raw: string,
  modules: ReadonlyArray<{ path: string; block: JsdocExampleBlock }>,
): DiagnosticClassification {
  const census = { badSpecifier: 0, typeError: 0, unboundName: 0 };
  const deferredExamples: JsdocDeferredExample[] = [];
  const normalized = stripAnsi(raw);
  for (const module of modules) {
    const paths = [module.path, toFileUrl(module.path).href];
    const relatedCodes = [
      ...normalized.matchAll(/TS(\d+) \[ERROR\]:[\s\S]*?\n\s+at ([^\n]+):(\d+):(\d+)/g),
    ]
      .filter((match) => paths.some((path) => match[2]?.startsWith(path)))
      .map((match) => Number(match[1]));
    if (relatedCodes.length === 0) continue;
    const tsCodes = [...new Set(relatedCodes)].sort((a, b) => a - b);
    if (relatedCodes.some((code) => code === 2305 || code === 2307 || code === 2724)) {
      census.badSpecifier += 1;
    } else if (relatedCodes.some((code) => code === 2304 || code === 2552 || code === 18004)) {
      census.unboundName += 1;
      deferredExamples.push({
        failureClass: 'unboundName',
        owner: module.block.owner,
        exampleOrdinal: module.block.exampleOrdinal,
        fenceOrdinal: module.block.fenceOrdinal,
        tsCodes,
      });
    } else {
      census.typeError += 1;
      deferredExamples.push({
        failureClass: 'typeError',
        owner: module.block.owner,
        exampleOrdinal: module.block.exampleOrdinal,
        fenceOrdinal: module.block.fenceOrdinal,
        tsCodes,
      });
    }
  }
  return { census, deferredExamples };
}

/** Compile published JSDoc examples in isolated modules without importing or executing them. */
export async function compileJsdocExamples(
  analysis: JsdocExampleAnalysis,
  repositoryRoot: string,
): Promise<JsdocExampleCompilationResult> {
  const failureCensus = emptyFailureCensus(analysis);
  const policyErrors = analysis.findings.filter((finding) =>
    finding.disposition === 'unfenced' || finding.disposition === 'malformed'
  );
  if (analysis.census.candidates === 0 || analysis.census.checked === 0) {
    const condition = analysis.census.candidates === 0 ? 'zero candidates' : 'zero checked modules';
    return {
      code: 1,
      diagnostics: `empty selection refused: ${condition}; deno check was not spawned`,
      failureCensus,
      enforcedFailureCount: failureCensus.unfenced + failureCensus.malformed,
      deferredExamples: [],
      rootLockUnchanged: true,
      temporaryLockRewritten: false,
      denoCheckSpawned: false,
    };
  }

  const tempRoot = await Deno.makeTempDir({ prefix: 'netscript-jsdoc-examples-' });
  const rootLockPath = join(repositoryRoot, 'deno.lock');
  const rootLockBefore = await Deno.readTextFile(rootLockPath);
  try {
    const supportImports = await materializeSharedSupports(tempRoot);
    const workspace = await resolveWorkspaceSurface(repositoryRoot, supportImports, {
      publishedOnly: true,
    });
    const { modules, policyDiagnostics } = await materializeModules(
      tempRoot,
      analysis.blocks,
      workspace.imports,
      repositoryRoot,
    );
    if (modules.length === 0) {
      const classified = classifyDiagnostics('', modules, policyDiagnostics, analysis);
      return {
        code: 1,
        diagnostics: [
          ...policyDiagnostics.map((finding) => finding.message),
          'empty selection refused: zero checked modules; deno check was not spawned',
        ].join('\n'),
        failureCensus: classified.failureCensus,
        enforcedFailureCount: classified.failureCensus.badSpecifier +
          classified.failureCensus.unfenced + classified.failureCensus.malformed,
        deferredExamples: classified.deferredExamples,
        rootLockUnchanged: true,
        temporaryLockRewritten: false,
        denoCheckSpawned: false,
      };
    }
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
      env: { FORCE_COLOR: '0', NO_COLOR: '1' },
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
    const stderr = stripAnsi(new TextDecoder().decode(output.stderr));
    const rootLockAfter = await Deno.readTextFile(rootLockPath);
    const tempLockAfter = await Deno.readTextFile(tempLockPath);
    const rootLockUnchanged = rootLockBefore === rootLockAfter;
    if (!rootLockUnchanged) throw new Error('tracked root deno.lock changed during JSDoc check');
    const classified = classifyDiagnostics(
      stderr,
      modules,
      policyDiagnostics,
      analysis,
    );
    const diagnostics = [
      ...policyErrors.map((finding) =>
        `${finding.owner.sourcePath} · ${finding.owner.kind}${
          finding.owner.symbol ? ` ${finding.owner.symbol}` : ''
        } · example ${finding.exampleOrdinal}: ${finding.reason}`
      ),
      ...policyDiagnostics.map((finding) => finding.message),
      mapDiagnostics(stderr, modules).trim(),
    ].filter(Boolean).join('\n');
    const enforcedFailureCount = classified.failureCensus.badSpecifier +
      classified.failureCensus.unfenced + classified.failureCensus.malformed;
    const unclassifiedCompilerFailure = output.code !== 0 &&
      classified.classifiedCompilerFailureCount === 0;
    const code = enforcedFailureCount === 0 && !unclassifiedCompilerFailure ? 0 : 1;
    return {
      code,
      diagnostics,
      failureCensus: classified.failureCensus,
      enforcedFailureCount,
      deferredExamples: classified.deferredExamples,
      rootLockUnchanged,
      temporaryLockRewritten: rootLockBefore !== tempLockAfter,
      denoCheckSpawned: true,
    };
  } finally {
    await Deno.remove(tempRoot, { recursive: true });
  }
}
