#!/usr/bin/env -S deno run --allow-read
/**
 * Fitness gate for AP-15: no `IFoo` style type or interface names.
 */

const ROOT = 'packages/cli/src';

interface Finding {
  path: string;
  line: number;
  name: string;
  note: string;
}

const findings: Finding[] = [];
const declarationPattern = /\b(?:interface|type)\s+(I[A-Z][A-Za-z0-9_]*)\b/g;

for await (const path of walk(ROOT)) {
  if (!path.endsWith('.ts')) continue;
  const lines = (await Deno.readTextFile(path)).split(/\r?\n/);
  lines.forEach((line, index) => {
    for (const match of line.matchAll(declarationPattern)) {
      findings.push({
        path,
        line: index + 1,
        name: match[1],
        note: 'I-prefix declarations are forbidden in CLI source',
      });
    }
  });
}

if (findings.length === 0) {
  console.log('F-CLI-7 no I-prefix declarations: PASS');
} else {
  for (const finding of findings) {
    console.error(
      `F-CLI-7 no I-prefix declarations: FAIL ${finding.path}:${finding.line} ${finding.name} - ${finding.note}`,
    );
  }
  Deno.exit(1);
}

async function* walk(root: string): AsyncGenerator<string> {
  for await (const entry of Deno.readDir(root)) {
    const path = `${root}/${entry.name}`;
    if (entry.isDirectory) {
      yield* walk(path);
      continue;
    }
    if (entry.isFile) yield path;
  }
}
