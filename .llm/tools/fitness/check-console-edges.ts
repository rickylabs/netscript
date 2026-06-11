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
const consolePattern = /\bconsole\.(log|error|warn|info|debug)\b/g;

for (const path of await sourceFiles(options.root)) {
  const normalized = normalizePath(path);
  if (!normalized.endsWith('.ts') && !normalized.endsWith('.template')) continue;
  const text = await textFile(path);
  for (const match of text.matchAll(consolePattern)) {
    const allowed = normalized.includes('/kernel/presentation/output/') ||
      normalized.includes('/kernel/adapters/loggers/') ||
      normalized.endsWith('/testing.ts') ||
      normalized.includes('/kernel/assets/');
    if (!allowed) {
      findings.push({
        path,
        line: lineOf(text, match.index ?? 0),
        message:
          'console.* is only allowed in output renderers, logger adapters, or generated assets.',
      });
    }
  }
}

report('F-CLI-26 console edges', findings, options.json);
