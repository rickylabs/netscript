import {
  type Finding,
  normalizePath,
  parseOptions,
  report,
  sourceFiles,
} from './cli-fitness-shared.ts';

const options = parseOptions();
const findings: Finding[] = [];
const allowed = new Set([
  'packages/cli/mod.ts',
  'packages/cli/e2e/mod.ts',
]);

for (const path of await sourceFiles(options.root)) {
  const normalized = normalizePath(path);
  if (
    (normalized.endsWith('/mod.ts') || normalized.endsWith('/index.ts')) && !allowed.has(normalized)
  ) {
    findings.push({
      path,
      message:
        'Sub-folder mod.ts/index.ts barrels are forbidden unless they are declared public subpath exports.',
    });
  }
}

report('F-CLI-20 barrel containment', findings, options.json);
