import { assertEquals } from '@std/assert';
import { join } from '@std/path';
import { regenerateAspireHelpers } from '../../adapters/service/workspace-mutator.ts';
import { DenoFileSystem } from '../../adapters/runtime/file-system/deno-file-system.ts';
import { Scaffolder } from '../../adapters/scaffold/scaffolder.ts';
import { StringTemplateAdapter } from '../../adapters/scaffold/template-adapter.ts';
import { SCAFFOLD_WORKSPACE_CATALOG } from '../../constants/scaffold/scaffold-app-catalog.ts';
import { NETSCRIPT_ASPIRE_CLI_ENV } from '../../constants/scaffold/scaffold-aspire.ts';
import { generateDenoJson } from './deno-json.ts';

for (
  const variant of [
    { name: 'default', grant: 'new', override: false },
    { name: 'override', grant: 'new', override: true },
    { name: 'legacy unset', grant: 'legacy', override: false },
    { name: 'legacy ungranted override', grant: 'legacy', override: true },
  ]
) {
  for (const mode of ['otel', 'export']) {
    Deno.test({
      name:
        `Aspire ${mode} regenerated task runs primary and ps fallback with ${variant.name} executable`,
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
          const executable = join(
            bin,
            variant.override && variant.grant === 'new' ? 'pinned-aspire' : 'aspire',
          );
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
          const config = JSON.parse(generateDenoJson({
            name: 'fixture',
            appName: 'dashboard',
            workspaceMembers: [],
            importMode: 'jsr',
          }));
          const task = variant.grant === 'legacy'
            ? `deno run --allow-run=aspire --allow-read .netscript/aspire-cli.ts ${mode}`
            : config.tasks[`aspire:${mode}`];
          const repoRoot = new URL('../../../../../../', import.meta.url);
          await Deno.writeTextFile(
            join(root, 'deno.json'),
            JSON.stringify({
              tasks: { [mode]: task },
              catalog: SCAFFOLD_WORKSPACE_CATALOG,
              imports: { '@netscript/config': new URL('packages/config/mod.ts', repoRoot).href },
            }),
          );
          await Deno.writeTextFile(
            join(root, 'netscript.config.ts'),
            `import { defineConfig } from '@netscript/config';
export default defineConfig({ name: 'fixture', databases: { config: [] }, plugins: [] });
`,
          );
          await Deno.writeTextFile(
            join(root, 'appsettings.json'),
            JSON.stringify({
              NetScript: {
                Name: 'fixture',
                Version: '1.0.0',
                Otel: { HttpEndpoint: 'http://localhost:4318', Protocol: 'http/protobuf' },
                Databases: {},
                Cache: {},
                Services: {},
                Plugins: {},
                BackgroundProcessors: {},
                Apps: {},
                Tools: {},
              },
            }),
          );
          const fs = new DenoFileSystem();
          const templates = new StringTemplateAdapter(fs);
          await regenerateAspireHelpers(root, fs, new Scaffolder(templates, fs), templates);
          // Run the real regenerated helper/reader; change only its package import to avoid a fetch.
          const reader = new URL(
            '../../../../../mcp/src/infrastructure/aspire-ps-dashboard-reader.ts',
            import.meta.url,
          ).href;
          const helperPath = join(root, '.netscript', 'aspire-cli.ts');
          await Deno.writeTextFile(
            helperPath,
            (await Deno.readTextFile(helperPath)).replace(
              "'@netscript/mcp'",
              JSON.stringify(reader),
            ),
          );
          const output = await new Deno.Command(Deno.execPath(), {
            args: [
              'task',
              mode,
              '--',
              ...(mode === 'otel' ? ['traces', 'users'] : ['-o', 'out.zip']),
            ],
            cwd: root,
            stdin: 'null',
            clearEnv: true,
            env: {
              ...(variant.override
                ? { [NETSCRIPT_ASPIRE_CLI_ENV]: join(bin, 'pinned-aspire') }
                : {}),
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
