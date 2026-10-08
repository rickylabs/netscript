/** Restart credential inheritance through the actual lifecycle command. @module */
import { assertEquals } from '@std/assert';
import { join } from '@std/path';
import { createRuntimeGates } from '../../../src/application/gates/scaffold/runtime-gates.ts';
import { GATE } from '../../../src/domain/cli-surface.ts';
import type { RunContext } from '../../../src/domain/run-context.ts';

Deno.test('Aspire restart inherits auth dotenv on migration and targeted restart failures', async () => {
  const root = await Deno.makeTempDir();
  try {
    const credential = crypto.randomUUID();
    await Deno.writeTextFile(join(root, '.env'), `NETSCRIPT_AUTH_KV_OAUTH_KEY='${credential}'\n`);
    await Deno.writeTextFile(
      join(root, 'aspire.config.json'),
      JSON.stringify({
        profiles: { https: { environmentVariables: {} } },
      }),
    );
    const executable = join(root, 'aspire');
    await Deno.writeTextFile(
      executable,
      `#!/bin/sh
case "$1" in
  resource)
    if [ "$FAKE_FAIL_PHASE" = migrate ] || [ "$3" = restart ]; then exit 1; fi
    exit 0 ;;
  stop) exit 0 ;;
  start)
    printf '%s' "$NETSCRIPT_AUTH_KV_OAUTH_KEY" > "$FAKE_CAPTURE"
    printf '{"dashboardUrl":"http://localhost"}\\n' ;;
esac
`,
    );

    const gate = createRuntimeGates().find((gate) =>
      gate.id === GATE.RUNTIME_ASPIRE_RESTART_AFTER_DB
    );
    if (gate?.kind !== 'command') throw new Error('Expected restart command.');
    const command = [...gate.command({
      project: { appHost: join(root, 'apphost.mts'), projectRoot: root },
    } as RunContext)];
    // Launch the Aspire fixture through sh so TMPDIR can be mounted noexec.
    const scriptIndex = command.findIndex((argument) => argument.includes('const database ='));
    command[scriptIndex] = command[scriptIndex]
      .replaceAll('new Deno.Command("aspire", {', 'new Deno.Command("sh", {')
      .replaceAll('args: [', 'args: [Deno.env.get("FAKE_ASPIRE_SCRIPT"),');
    for (const phase of ['migrate', 'restart']) {
      const capture = join(root, `${phase}.txt`);
      const child = await new Deno.Command(Deno.execPath(), {
        args: command.slice(1),
        cwd: root,
        clearEnv: true,
        env: {
          PATH: `${root}:${Deno.env.get('PATH') ?? ''}`,
          FAKE_ASPIRE_SCRIPT: executable,
          FAKE_FAIL_PHASE: phase,
          FAKE_CAPTURE: capture,
        },
      }).output();
      assertEquals(child.code, 0, new TextDecoder().decode(child.stderr));
      assertEquals(await Deno.readTextFile(capture), credential);
    }
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});
