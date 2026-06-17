import {
  type Finding,
  normalizePath,
  parseOptions,
  report,
  sourceFiles,
} from './cli-fitness-shared.ts';

const options = parseOptions();
const findings: Finding[] = [];

for (const path of await sourceFiles(options.root)) {
  const normalized = normalizePath(path);
  if (!normalized.startsWith('packages/cli/src/')) continue;
  const name = normalized.split('/').at(-1) ?? '';
  if (
    normalized.includes('/features/') && /command\.ts$/.test(name) && !/-command\.ts$/.test(name)
  ) {
    findings.push({ path, message: 'Feature command files must use the *-command.ts suffix.' });
  }
  if (normalized.includes('/ports/') && !/-port\.ts$/.test(name)) {
    findings.push({ path, message: 'Port files must use the *-port.ts suffix.' });
  }
  if (normalized.includes('/adapters/') && /interface/i.test(name)) {
    findings.push({ path, message: 'Adapters must not use interface vocabulary in filenames.' });
  }
}

report('F-CLI-21 naming and vertical slicing', findings, options.json);
