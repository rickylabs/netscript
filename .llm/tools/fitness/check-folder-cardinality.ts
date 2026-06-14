import { walk } from 'jsr:@std/fs@^1.0.0/walk';
import { type Finding, normalizePath, parseOptions, report } from './cli-fitness-shared.ts';

const options = parseOptions();
const findings: Finding[] = [];
const childCounts = new Map<string, number>();

for await (
  const entry of walk(`${options.root}/src`, {
    includeDirs: true,
    includeFiles: true,
    skip: [/kernel\/assets/],
  })
) {
  const path = normalizePath(entry.path);
  const parent = path.split('/').slice(0, -1).join('/');
  if (parent.startsWith(`${options.root}/src`)) {
    childCounts.set(parent, (childCounts.get(parent) ?? 0) + 1);
  }
}

for (const [path, count] of childCounts) {
  if (count > 12) {
    findings.push({ path, message: `Directory has ${count} immediate children; maximum is 12.` });
  }
}

report('F-CLI-25/F-CLI-29 folder cardinality', findings, options.json);
