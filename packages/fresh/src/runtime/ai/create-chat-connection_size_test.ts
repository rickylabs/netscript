/**
 * Size ratchet for the over-cap chat connection module (A8/AP-1/F-1, #2067 IMPL-EVAL).
 *
 * `create-chat-connection.ts` is past the 500-line cap. Growth is allowed only while the
 * architecture debt registry carries an owned entry for it, and only up to the size that
 * entry records, so the next addition is a recorded decision rather than a default.
 *
 * @module
 */

import { assert, assertMatch } from '@std/assert';

const DEBT_ID = 'fresh-ai-chat-connection-a8-2067';
const MODULE = new URL('./create-chat-connection.ts', import.meta.url);
const REGISTRY = new URL('../../../../../.llm/harness/debt/arch-debt.md', import.meta.url);

function debtEntry(registry: string): string {
  const start = registry.indexOf(`(\`${DEBT_ID}\`)`);
  assert(start >= 0, `arch-debt.md has no \`${DEBT_ID}\` entry for create-chat-connection.ts`);
  const next = registry.indexOf('\n## ', start);
  return registry.slice(start, next < 0 ? undefined : next);
}

Deno.test('create-chat-connection.ts stays within its recorded debt ceiling', async () => {
  const entry = debtEntry(await Deno.readTextFile(REGISTRY));
  for (const field of ['Owner', 'Target', 'Gate']) {
    assertMatch(entry, new RegExp(`\\*\\*${field}:\\*\\* \\S`), `debt entry lacks ${field}`);
  }
  const ceiling = Number(/from \*\*\d+ to (\d+) lines\*\*/.exec(entry)?.[1]);
  assert(Number.isSafeInteger(ceiling), 'debt entry does not record the line ceiling');

  // Counted exactly as `arch:check` counts (check-doctrine.ts), so the WARN and the entry agree.
  const lines = (await Deno.readTextFile(MODULE)).split(/\r?\n/).length;
  assert(
    lines <= ceiling,
    `create-chat-connection.ts is ${lines} lines, above the ${ceiling} recorded in ${DEBT_ID}; ` +
      'split the module or update the debt entry with an owner decision',
  );
});
