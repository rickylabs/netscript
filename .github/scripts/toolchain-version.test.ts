import { assert, assertEquals } from '@std/assert';
import { SCAFFOLD_DEFAULTS } from '../../packages/cli/src/kernel/constants/scaffold/scaffold-defaults.ts';

const REPO_ROOT = new URL('../../', import.meta.url);

Deno.test('Deno workflow and scaffold pins match toolchain.env', async () => {
  const toolchain = await Deno.readTextFile(new URL('.github/toolchain.env', REPO_ROOT));
  const version = toolchain.match(/^NETSCRIPT_DENO_VERSION=v?(\d+\.\d+\.\d+)$/m)?.[1];
  assertEquals(typeof version, 'string', 'toolchain.env must declare an exact Deno version');
  assertEquals(SCAFFOLD_DEFAULTS.DENO_VERSION, version, 'scaffold Deno version drift');

  let pins = 0;
  for await (const entry of Deno.readDir(new URL('.github/workflows/', REPO_ROOT))) {
    if (!entry.isFile || !/\.ya?ml$/.test(entry.name)) continue;
    const source = await Deno.readTextFile(new URL(`.github/workflows/${entry.name}`, REPO_ROOT));
    for (
      const match of source.matchAll(
        /^\s*(?:deno-version|DENO_VERSION):\s*['"]?v?(\d+\.\d+\.\d+)['"]?\s*$/gm,
      )
    ) {
      pins++;
      assertEquals(match[1], version, `${entry.name}: Deno pin drift`);
    }
    // Every indirect setup-deno value must use one of the declared canonical sources.
    for (const match of source.matchAll(/^\s*deno-version:\s*(.+)$/gm)) {
      const value = match[1].trim().replace(/^['"]|['"]$/g, '');
      if (/^v?\d+\.\d+\.\d+$/.test(value)) continue;
      assert(
        ['${{ env.DENO_VERSION }}', '${{ steps.toolchain.outputs.deno-version }}'].includes(value),
        `${entry.name}: unrecognized Deno version source: ${value}`,
      );
      if (value === '${{ env.DENO_VERSION }}') {
        assert(
          /^\s*DENO_VERSION:\s*['"]?v?\d+\.\d+\.\d+['"]?\s*$/m.test(source),
          `${entry.name}: env.DENO_VERSION must declare an exact Deno version`,
        );
      } else {
        assert(
          source.includes('.github/toolchain.env'),
          `${entry.name}: canonical toolchain file must be loaded`,
        );
        assert(
          /^\s*source \S*\/toolchain\.env$/m.test(source),
          `${entry.name}: canonical toolchain file must be sourced`,
        );
        assert(
          source.includes('deno-version=${NETSCRIPT_DENO_VERSION}'),
          `${entry.name}: deno-version output must derive from NETSCRIPT_DENO_VERSION`,
        );
      }
    }
  }
  assert(pins > 0, '.github/workflows: pin inventory must not be empty');
});
