import {
  type Finding,
  normalizePath,
  parseOptions,
  report,
  sourceFiles,
  textFile,
} from './cli-fitness-shared.ts';

const options = parseOptions();
const findings: Finding[] = [];
const extensionPath = `${options.root}/src/kernel/extension-points.ts`;
const extensionText = await textFile(extensionPath).catch(() => '');

for (const path of await sourceFiles(options.root)) {
  if (!path.endsWith('.ts')) continue;
  const normalized = normalizePath(path);
  if (!normalized.includes('/registries/')) continue;
  const text = await textFile(path);
  const match = text.match(/export\s+class\s+([A-Z][A-Za-z0-9_]*Registry)\s+extends\s+Registry\b/);
  if (match && !extensionText.includes(match[1])) {
    findings.push({
      path,
      message: `Registry ${match[1]} is not listed by kernel/extension-points.ts.`,
    });
  }
}

report('F-CLI-31 extension points', findings, options.json);
