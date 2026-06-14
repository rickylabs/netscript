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
const inlineCliffy = /\.(command|option|action)\(/;

for (const path of await sourceFiles(options.root)) {
  const normalized = normalizePath(path);
  if (
    !normalized.includes('/composition/') ||
    !normalized.endsWith('.ts') ||
    !normalized.includes('/create-')
  ) continue;
  const text = await textFile(path);
  if (!/extends\s+CliRoot\b/.test(text)) {
    findings.push({ path, message: 'Composition files must expose a CliRoot subclass.' });
  }
  const inline = text.search(inlineCliffy);
  if (inline !== -1) {
    findings.push({
      path,
      line: lineOf(text, inline),
      message:
        'Composition files must not contain inline Cliffy command, option, or action bodies.',
    });
  }
}

report('F-CLI-27/F-CLI-28 composition shape', findings, options.json);
