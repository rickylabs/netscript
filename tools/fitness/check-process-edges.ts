import {
  type Finding,
  isTestOrFixture,
  lineOf,
  normalizePath,
  parseOptions,
  report,
  sourceFiles,
  textFile,
} from './cli-fitness-shared.ts';

const options = parseOptions();
const findings: Finding[] = [];
const processPattern =
  /\bDeno\.(cwd|env|build|readDir|readFile|readTextFile|readFileSync|readTextFileSync|writeFile|writeTextFile|Command|openKv|exit)\b/g;

for (const path of await sourceFiles(options.root)) {
  const normalized = normalizePath(path);
  const text = await textFile(path);
  for (const match of text.matchAll(processPattern)) {
    const member = match[1];
    const allowedExit = member === 'exit' && normalized.startsWith('packages/cli/bin/');
    const allowedProcess = member !== 'exit' &&
      (normalized.includes('/adapters/') ||
        normalized.startsWith('packages/cli/bin/') ||
        normalized.startsWith('packages/cli/e2e/src/adapters/') ||
        normalized.includes('/assets/') ||
        normalized.includes('/templates/') ||
        normalized.includes('/features/deploy/') ||
        normalized.includes('/application/scaffold/post-scripts-init.ts') ||
        isTestOrFixture(normalized));
    if (!allowedExit && !allowedProcess) {
      findings.push({
        path,
        line: lineOf(text, match.index ?? 0),
        message:
          `Deno.${member} is only allowed in adapters, assets, or bin edges; Deno.exit is bin-only.`,
      });
    }
  }
}

report('F-CLI-15/F-CLI-16 process edges', findings, options.json);
