import { assertEquals } from 'jsr:@std/assert@^1';
import { binaryExtensionForTarget, defaultCompileTarget } from './compile-platform.ts';

Deno.test('compile-platform', async (t) => {
  await t.step('defaultCompileTarget returns the host triple', () => {
    assertEquals(defaultCompileTarget(), Deno.build.target);
  });

  await t.step('binaryExtensionForTarget appends .exe for windows triples', () => {
    assertEquals(binaryExtensionForTarget('x86_64-pc-windows-msvc'), '.exe');
    assertEquals(binaryExtensionForTarget('aarch64-pc-windows-msvc'), '.exe');
  });

  await t.step('binaryExtensionForTarget yields no extension for non-windows triples', () => {
    assertEquals(binaryExtensionForTarget('x86_64-unknown-linux-gnu'), '');
    assertEquals(binaryExtensionForTarget('aarch64-unknown-linux-gnu'), '');
    assertEquals(binaryExtensionForTarget('x86_64-apple-darwin'), '');
  });
});
