import { assertEquals, assertStringIncludes } from '@std/assert';
import { fromFileUrl, join } from '@std/path';

const repo = fromFileUrl(new URL('../../../', import.meta.url));
const browserFiles = ['auth/bff.ts', 'auth/service.ts', 'apps/web/routes/auth/[action].ts'];

for (const binary of ['netscript.ts', 'netscript-dev.ts']) {
  for (const present of [false, true]) {
    Deno.test(`${binary} install and generate preserve authored browser topology with files ${present ? 'present' : 'absent'}`, async () => {
      const root = await Deno.makeTempDir();
      const project = join(root, 'shop');
      const run = async (args: string[], entry = binary, diagnostic = false) => {
        const output = await new Deno.Command(Deno.execPath(), {
          args: ['run', '--no-lock', '-A', join(repo, 'packages/cli/bin', entry), ...args],
          cwd: repo,
          stdout: 'piped',
          stderr: 'piped',
        }).output();
        const text = new TextDecoder().decode(output.stdout) +
          new TextDecoder().decode(output.stderr);
        // Doctor also probes unrelated configured modules with its own bounded timeout.
        // This regression asserts the ownership report even if such a probe is inconclusive.
        if (diagnostic) assertEquals([0, 1].includes(output.code), true, text);
        else assertEquals(output.code, 0, text);
        return text;
      };
      try {
        await run([
          'init',
          'shop',
          '--path',
          root,
          '--db',
          'none',
          '--app-name',
          'web',
          '--no-agent',
          '--ci',
          '--yes',
          '--no-git',
          '--editor',
          'none',
        ], 'netscript.ts');
        const settingsPath = join(project, 'appsettings.json');
        const settings = JSON.parse(await Deno.readTextFile(settingsPath));
        settings.NetScript.Apps.web.Auth = { BrowserTopology: 'authored' };
        await Deno.writeTextFile(settingsPath, JSON.stringify(settings, null, 2) + '\n');
        if (present) {
          await Deno.mkdir(join(project, 'auth'), { recursive: true });
          await Deno.mkdir(join(project, 'apps/web/routes/auth'), { recursive: true });
          for (const path of browserFiles) {
            await Deno.writeTextFile(join(project, path), `// authored ${path}\n`);
          }
        }
        const verify = async () => {
          for (const path of browserFiles) {
            if (present) {
              assertEquals(await Deno.readTextFile(join(project, path)), `// authored ${path}\n`);
            } else {
              let exists = true;
              try {
                await Deno.stat(join(project, path));
              } catch (error) {
                if (!(error instanceof Deno.errors.NotFound)) throw error;
                exists = false;
              }
              assertEquals(exists, false, path);
            }
          }
        };
        const install = [
          'plugin',
          'install',
          'auth',
          '--name',
          'auth',
          '--project-root',
          project,
          '--force',
        ];
        if (binary === 'netscript.ts') install.push('--local-path', join(repo, 'plugins/auth'));
        await run(install);
        await verify();
        await run(install);
        await verify();
        await run(['generate', 'aspire', '--project-root', project]);
        await verify();
        await run(['generate', 'aspire', '--project-root', project]);
        await verify();
        const doctor = await run(['plugin', 'doctor', '--project-root', project], binary, true);
        assertStringIncludes(doctor, 'authored');
        assertStringIncludes(doctor, 'workspace\thealthy\tBrowser auth topology (web)\tauthored');
        assertStringIncludes(doctor, 'app-owned browser topology');
        assertEquals(
          JSON.parse(await Deno.readTextFile(settingsPath)).NetScript.Apps.web.Auth.BrowserTopology,
          'authored',
        );
      } finally {
        await Deno.remove(root, { recursive: true });
      }
    });
  }
}
