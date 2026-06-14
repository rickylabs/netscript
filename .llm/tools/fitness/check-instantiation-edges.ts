import {
  type Finding,
  lineOf,
  normalizePath,
  parseOptions,
  report,
  sourceFiles,
  textFile,
} from './cli-fitness-shared.ts';

const options = parseOptions();
const findings: Finding[] = [];
const instantiationPattern =
  /\bnew\s+[A-Z][A-Za-z0-9_]*(Adapter|Resolver|Scaffolder|Runner|Registry|Client|Copier|Logger|Port)\b/g;

for (const path of await sourceFiles(options.root)) {
  if (!path.endsWith('.ts')) continue;
  const normalized = normalizePath(path);
  const text = await textFile(path);
  for (const match of text.matchAll(instantiationPattern)) {
    const allowed = normalized.includes('/composition/') ||
      normalized.includes('/features/root/') ||
      normalized.startsWith('packages/cli/bin/') ||
      normalized.includes('/abstracts/') ||
      normalized.includes('/adapters/') ||
      normalized.includes('/features/') ||
      normalized.includes('/application/') ||
      normalized.includes('/templates/') ||
      normalized.includes('/testing') ||
      normalized.endsWith('/mod.ts') ||
      normalized.endsWith('/public-api.ts') ||
      normalized.endsWith('/maintainer-api.ts') ||
      normalized.endsWith('_test.ts') ||
      normalized.includes('/e2e/src/create-default-runner.ts');
    if (!allowed) {
      findings.push({
        path,
        line: lineOf(text, match.index ?? 0),
        message:
          'Infrastructure-like concrete instantiation belongs in composition, adapters, bin edges, abstracts, or fixtures.',
      });
    }
  }
}

report('F-CLI-19 instantiation edges', findings, options.json);
