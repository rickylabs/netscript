/** Regression coverage for the executable empty-contribution scaffold boundary. */
import { assert, assertEquals } from 'jsr:@std/assert@^1';
import { toFileUrl } from 'jsr:@std/path@^1';
import { DEFAULT_TEMPLATE_REGISTRY } from '../../../../application/registries/template-registry.ts';
import { generateRegisterBackground } from '../register/generate-register-background.ts';
import { generateRegisterPlugins } from '../register/generate-register-plugins.ts';
import { MINIMAL_DENO_DEFAULTS } from './generators-test-support.ts';

await DEFAULT_TEMPLATE_REGISTRY.hydrate();

const options = { version: 'test', denoDefaults: MINIMAL_DENO_DEFAULTS };
const cases = [
  {
    name: 'registerPlugins',
    source: () => generateRegisterPlugins({ ...options, plugins: {} }),
    argumentCount: 5,
  },
  {
    name: 'registerBackgroundProcessors',
    source: () => generateRegisterBackground({ ...options, processors: {} }),
    argumentCount: 6,
  },
];

for (const fixture of cases) {
  Deno.test(`${fixture.name}: empty output lints and returns a fresh map without accessing resources`, async () => {
    const directory = await Deno.makeTempDir({ prefix: 'empty-registration-' });
    try {
      const path = `${directory}/registration.mts`;
      await Deno.writeTextFile(path, fixture.source());
      const lint = await new Deno.Command(Deno.execPath(), {
        args: ['lint', '--no-config', path],
        stdout: 'piped',
        stderr: 'piped',
      }).output();
      assertEquals(lint.code, 0, new TextDecoder().decode(lint.stderr));

      const module: Record<string, unknown> = await import(toFileUrl(path).href);
      const register = module[fixture.name];
      assert(typeof register === 'function');
      assertEquals(register.length, fixture.argumentCount);
      const unreadable = new Proxy({}, {
        get() {
          throw new Error('Empty registration must not access resource/configuration arguments');
        },
      });
      const pending: unknown = register(...Array(fixture.argumentCount).fill(unreadable));
      assert(pending instanceof Promise);
      const first: unknown = await pending;
      const second: unknown = await register(...Array(fixture.argumentCount).fill(unreadable));
      assert(first instanceof Map && second instanceof Map);
      assertEquals(first.size, 0);
      assertEquals(second.size, 0);
      assert(first !== second, 'Each invocation must own its result map');
    } finally {
      await Deno.remove(directory, { recursive: true });
    }
  });
}
