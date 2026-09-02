#!/usr/bin/env -S deno run --allow-read --allow-write --allow-run
/**
 * Compile the TypeScript fences published in package and plugin READMEs.
 *
 * `check-readme-standard` asserts a `## Quick example` fence exists; it never compiles one.
 * `docs:snippets` compiles only `docs/site`. This closes the gap for the JSR landing pages (#1924)
 * by reusing the existing extractor and snippet compiler rather than introducing a second one.
 */
import { extractFencedBlocks, type FencedBlock } from './snippet-extractor.ts';
import { compileSnippetAnalysis } from './snippet-compiler.ts';
import type { SnippetSiteAnalysis } from './snippet-policy.ts';
import {
  formatReadmeFenceCensus,
  type ReadmeFenceCensus,
  readmeFenceRatchetFailures,
  type ReadmeSyntaxFailure,
} from './readme-fence-policy.ts';

const ANSI = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, 'g');
const SYNTAX_FAILURE = /SyntaxError:[\s\S]*?at file:\/\/([^\s:]+README\.md):(\d+):/;
const TYPE_ERROR = /TS(\d+) \[ERROR\][\s\S]*?at file:\/\/([^\s:]+README\.md)/g;
/** `deno check` aborts the whole program on the first parse failure, so exclusion must iterate. */
const MAX_SYNTAX_ROUNDS = 32;

/** Discover every published README under the package and plugin roots. */
export async function collectReadmePaths(repositoryRoot: string): Promise<string[]> {
  const paths: string[] = [];
  for (const root of ['packages', 'plugins']) {
    let entries: Deno.DirEntry[];
    try {
      entries = await Array.fromAsync(Deno.readDir(`${repositoryRoot}/${root}`));
    } catch {
      continue;
    }
    for (const entry of entries) {
      if (!entry.isDirectory) continue;
      const relative = `${root}/${entry.name}/README.md`;
      try {
        const info = await Deno.stat(`${repositoryRoot}/${relative}`);
        if (info.isFile) paths.push(relative);
      } catch {
        continue;
      }
    }
  }
  return paths.sort();
}

function analysisFor(all: FencedBlock[], checked: FencedBlock[], exempt: FencedBlock[]) {
  return {
    blocks: all,
    tier1Blocks: checked,
    exemptions: exempt,
    census: {
      scanned: all.length,
      ts: all.filter((block) => block.language === 'ts').length,
      tsx: all.filter((block) => block.language === 'tsx').length,
      typescript: all.filter((block) => block.language === 'typescript').length,
      tsLike: checked.length + exempt.length,
      tier1: checked.length,
      checked: checked.length,
      exempt: exempt.length,
      outsideFloor: 0,
      malformed: 0,
    },
  } satisfies SnippetSiteAnalysis;
}

/** Compile every README fence, excluding unparseable ones so one abort cannot mask the corpus. */
export async function checkReadmeFences(
  repositoryRoot: string,
): Promise<
  { census: ReadmeFenceCensus; syntaxFailures: ReadmeSyntaxFailure[]; diagnostics: string }
> {
  const readmes = await collectReadmePaths(repositoryRoot);
  const all: FencedBlock[] = [];
  for (const relative of readmes) {
    const source = await Deno.readTextFile(`${repositoryRoot}/${relative}`);
    all.push(...extractFencedBlocks(source, relative));
  }
  const tsLike = all.filter((block) => block.checkedLanguage !== undefined);
  const exempt = tsLike.filter((block) => block.exemptionReason !== undefined);
  const syntaxFailures: ReadmeSyntaxFailure[] = [];
  let checked = tsLike.filter((block) => block.exemptionReason === undefined);
  let plain = '';

  for (let round = 0; round <= MAX_SYNTAX_ROUNDS; round++) {
    const result = await compileSnippetAnalysis(
      analysisFor(all, checked, exempt),
      repositoryRoot,
    );
    plain = String((result as unknown as { diagnostics?: string }).diagnostics ?? '')
      .replaceAll(ANSI, '');
    const syntax = SYNTAX_FAILURE.exec(plain);
    if (!syntax) break;
    const [, sourcePath, line] = syntax;
    const reported = Number(line);
    const victim = checked.find((block) =>
      block.sourcePath === sourcePath && reported >= block.codeStartLine &&
      reported <= block.closingLine
    );
    if (!victim) break;
    syntaxFailures.push({ sourcePath: victim.sourcePath, codeStartLine: victim.codeStartLine });
    checked = checked.filter((block) => block !== victim);
  }

  const typeErrors = [...plain.matchAll(TYPE_ERROR)];
  const failingReadmes = new Set(typeErrors.map((match) => match[2]));
  return {
    census: {
      readmes: readmes.length,
      fences: all.length,
      tsLike: tsLike.length,
      exempt: exempt.length,
      checked: checked.length,
      syntaxInvalid: syntaxFailures.length,
      typeErrors: typeErrors.length,
      failingReadmes: failingReadmes.size,
    },
    syntaxFailures,
    diagnostics: plain,
  };
}

if (import.meta.main) {
  const repositoryRoot = Deno.cwd();
  const { census, syntaxFailures, diagnostics } = await checkReadmeFences(repositoryRoot);
  const failures = readmeFenceRatchetFailures(census);
  console.log(formatReadmeFenceCensus(census, failures.length === 0 ? 'PASS' : 'FAIL'));
  for (const failure of syntaxFailures) {
    console.log(`  syntax-invalid fence: ${failure.sourcePath}:${failure.codeStartLine}`);
  }
  for (const failure of failures) console.error(`ratchet failure: ${failure}`);
  if (failures.length > 0) {
    console.error(diagnostics);
    Deno.exit(1);
  }
}
