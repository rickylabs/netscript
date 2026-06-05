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
  if (!path.endsWith('.ts') && !path.endsWith('.tsx')) continue;
  const text = await textFile(path);
  const index = text.indexOf('@cliffy/');
  if (index === -1) continue;
  const normalized = normalizePath(path);
  const allowed = normalized.includes('/bin/') ||
    normalized.includes('/composition/') ||
    normalized.includes('/features/') ||
    normalized.includes('/adapters/prompt/') ||
    normalized.includes('/adapters/runtime/prompt/') ||
    normalized.includes('/e2e/src/presentation/');
  if (!allowed) {
    findings.push({
      path,
      line: lineOf(text, index),
      message:
        '@cliffy imports are confined to CLI presentation, feature command owners, composition, or bin edges.',
    });
  }
}

report('F-CLI-14 cliffy containment', findings, options.json);
