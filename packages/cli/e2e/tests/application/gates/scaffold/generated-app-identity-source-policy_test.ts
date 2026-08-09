import { assertEquals } from '@std/assert';
import { walk } from '@std/fs';
import { relative, resolve } from '@std/path';

const SCAFFOLD_GATES_ROOT = resolve(
  import.meta.dirname ?? '.',
  '../../../../src/application/gates/scaffold',
);

// Aspire dashboard telemetry describes the orchestration dashboard, not a generated Fresh app.
// Keep that vocabulary out of this app-identity policy instead of banning the word "dashboard".
const EXCLUDED_FILES = new Set(['aspire-dashboard-telemetry.ts']);

const FORBIDDEN_GENERATED_APP_IDENTITIES = [
  { label: 'generated app path', pattern: /apps\/dashboard/ },
  {
    label: 'generated app-name default',
    pattern: /\bappName\s*=\s*(['"])dashboard\1/,
  },
] as const;

Deno.test('scaffold gate scripts do not assume the legacy generated app identity', async () => {
  const findings: string[] = [];

  for await (
    const entry of walk(SCAFFOLD_GATES_ROOT, {
      exts: ['.ts'],
      includeDirs: false,
      followSymlinks: false,
    })
  ) {
    if (EXCLUDED_FILES.has(entry.name)) continue;
    const source = await Deno.readTextFile(entry.path);
    const path = relative(SCAFFOLD_GATES_ROOT, entry.path);
    for (const [index, line] of source.split('\n').entries()) {
      for (const forbidden of FORBIDDEN_GENERATED_APP_IDENTITIES) {
        if (forbidden.pattern.test(line)) {
          findings.push(`${path}:${index + 1} ${forbidden.label}: ${line.trim()}`);
        }
      }
    }
  }

  assertEquals(findings, []);
});
