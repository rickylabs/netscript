import { assertEquals } from '@std/assert';
import { join } from '@std/path';
import { generateAspireCliTaskRunner } from './aspire-cli-task.ts';
import { generateDenoJson } from './deno-json.ts';

for (const override of [false, true]) {
  for (const mode of ['otel', 'export']) {
    Deno.test({
      name: `Aspire ${mode} task runs primary and ps fallback with ${
        override ? 'override' : 'default'
      } executable`,
      ignore: Deno.build.os === 'windows', // Executable fixture uses a POSIX shebang.
      async fn() {
        const root = await Deno.makeTempDir();
        try {
          const bin = join(root, 'pinned toolchain');
          await Deno.mkdir(bin);
          await Deno.symlink(Deno.execPath(), join(bin, 'deno'));
          await Deno.mkdir(join(root, '.netscript'));
          await Deno.mkdir(join(root, 'aspire'));
          await Deno.writeTextFile(join(root, 'aspire', 'apphost.mts'), '');
          const executable = join(bin, override ? 'pinned-aspire' : 'aspire');
          const log = join(root, 'commands.log');
          await Deno.writeTextFile(
            executable,
            `#!/bin/sh
printf '%s\\n' CALL "$@" >> "$COMMAND_LOG"
if [ "$1" = ps ]; then
  printf '%s\\n' '[{"status":"Running","appHostPath":"aspire/apphost.mts","dashboardUrl":"http://localhost:18888"}]'
  exit 0
fi
for arg in "$@"; do
  if [ "$arg" = --dashboard-url ]; then
    printf '%s\\n' 'fallback succeeded'
    exit 0
  fi
done
exit 7
`,
          );
          await Deno.chmod(executable, 0o755);
          // Keep the real reader and replace only the package import to avoid a registry fetch.
          const reader = new URL(
            '../../../../../mcp/src/infrastructure/aspire-ps-dashboard-reader.ts',
            import.meta.url,
          ).href;
          await Deno.writeTextFile(
            join(root, '.netscript', 'aspire-cli.ts'),
            generateAspireCliTaskRunner().replace("'@netscript/mcp'", JSON.stringify(reader)),
          );
          const config = JSON.parse(generateDenoJson({
            name: 'fixture',
            appName: 'dashboard',
            workspaceMembers: [],
            importMode: 'jsr',
          }));
          // Run the exact generated grant through deno task in an isolated workspace.
          await Deno.writeTextFile(
            join(root, 'deno.json'),
            JSON.stringify({ tasks: { [mode]: config.tasks[`aspire:${mode}`] } }),
          );
          const output = await new Deno.Command(Deno.execPath(), {
            args: [
              'task',
              mode,
              '--',
              ...(mode === 'otel' ? ['traces', 'users'] : ['-o', 'out.zip']),
            ],
            cwd: root,
            env: {
              NETSCRIPT_ASPIRE_CLI: override ? executable : '',
              PATH: bin,
              COMMAND_LOG: log,
            },
            stdout: 'piped',
            stderr: 'piped',
          }).output();
          assertEquals(output.code, 0, new TextDecoder().decode(output.stderr));
          assertEquals(new TextDecoder().decode(output.stdout), 'fallback succeeded\n');
          const forwarded = mode === 'otel' ? ['traces', 'users'] : ['-o', 'out.zip'];
          assertEquals((await Deno.readTextFile(log)).trim().split('\n'), [
            'CALL',
            mode,
            ...forwarded,
            'CALL',
            'ps',
            '--format',
            'Json',
            '--nologo',
            '--non-interactive',
            'CALL',
            mode,
            ...forwarded,
            '--dashboard-url',
            'http://localhost:18888',
          ]);
        } finally {
          await Deno.remove(root, { recursive: true });
        }
      },
    });
  }
}
