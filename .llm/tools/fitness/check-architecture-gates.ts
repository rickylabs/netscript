#!/usr/bin/env -S deno run --allow-read --allow-run
/**
 * Aggregated architecture gate.
 *
 * Keeps `deno task arch:check` as the single merge-readiness command for
 * doctrine checks and package-level design-system fitness gates.
 */

interface Gate {
  name: string;
  args: string[];
}

const gates: Gate[] = [
  {
    name: 'doctrine',
    args: [
      'run',
      '--allow-read',
      '.llm/tools/fitness/check-doctrine.ts',
      '--root',
      'packages/fresh-ui',
    ],
  },
  {
    name: 'ds-no-raw-hex',
    args: ['run', '--allow-read', '.llm/tools/fitness/check-ds-no-raw-hex.ts'],
  },
  {
    name: 'ds-color-utilities',
    args: ['run', '--allow-read', '.llm/tools/fitness/check-ds-color-utilities.ts'],
  },
];

for (const gate of gates) {
  console.log(`arch:check ${gate.name}: running`);
  const result = await new Deno.Command(Deno.execPath(), {
    args: gate.args,
    stdout: 'inherit',
    stderr: 'inherit',
  }).spawn().status;
  if (!result.success) {
    console.error(`arch:check ${gate.name}: FAIL exit=${result.code}`);
    Deno.exit(result.code || 1);
  }
  console.log(`arch:check ${gate.name}: PASS`);
}

console.log('arch:check: PASS');
