import { dirname } from 'jsr:@std/path@^1.0.0';
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
const abstractDirs = new Map<string, string>();

for (const path of await sourceFiles(options.root)) {
  if (!path.endsWith('.ts')) continue;
  const text = await textFile(path);
  const match = text.match(/abstract\s+class\s+([A-Z][A-Za-z0-9_]*)/);
  if (match) abstractDirs.set(match[1], normalizePath(dirname(path)));
}

for (const [abstractName, dir] of abstractDirs) {
  let concreteCount = 0;
  for (const path of await sourceFiles(dir)) {
    if (!path.endsWith('.ts')) continue;
    const text = await textFile(path);
    if (new RegExp(`extends\\s+${abstractName}\\b`).test(text)) concreteCount++;
  }
  if (concreteCount >= 2 && !dir.split('/').at(-1)?.endsWith('s')) {
    findings.push({
      path: dir,
      message:
        `Abstract ${abstractName} has ${concreteCount} concretes; the folder must be plural-named.`,
    });
  }
}

report('F-CLI-30 abstract co-location', findings, options.json);
