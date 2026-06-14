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

for (const path of await sourceFiles(options.root)) {
  const normalized = normalizePath(path);
  if (normalized.endsWith('.template') && !normalized.includes('/src/kernel/assets/')) {
    findings.push({ path, message: '.template files must live under src/kernel/assets/**.' });
  }
  if (!normalized.endsWith('.ts') || normalized.includes('/src/kernel/assets/')) continue;
  const text = await textFile(path);
  for (const match of text.matchAll(/`(?:[^`\\]|\\[\s\S])*`/g)) {
    const literal = match[0];
    if (literal.split('\n').length >= 20) {
      findings.push({
        path,
        line: lineOf(text, match.index ?? 0),
        message: 'Backtick template literals of 20+ lines belong under kernel/assets/**.',
      });
    }
  }
}

report('F-CLI-22/F-CLI-23 template location', findings, options.json);
