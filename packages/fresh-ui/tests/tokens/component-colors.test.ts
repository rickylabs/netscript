import { assert, assertEquals } from '@std/assert';
import { fromFileUrl, relative } from '@std/path';
import { walk } from 'jsr:@std/fs@1';

Deno.test('shipped destructive text uses the measured text role rather than the solid fill', async () => {
  const repository = fromFileUrl(new URL('../../../../', import.meta.url));
  const scopes = [
    {
      root: new URL('../../registry/components/ui/', import.meta.url),
      match: /\.css$/,
      maxDepth: 1,
    },
    {
      root: new URL('../../../cli/src/kernel/assets/', import.meta.url),
      match: /\.css\.template$/,
    },
  ];
  const violations: string[] = [];
  // Border/fill uses are intentional; only the CSS text color property needs the text role.
  for (const { root, ...options } of scopes) {
    let scanned = 0;
    for await (
      const file of walk(root, { ...options, match: [options.match], includeDirs: false })
    ) {
      scanned++;
      const css = await Deno.readTextFile(file.path);
      if (/(?<![-\w])color\s*:\s*var\(--ns-destructive\)/.test(css)) {
        violations.push(relative(repository, file.path));
      }
    }
    assert(scanned > 0, `No CSS consumers scanned in ${relative(repository, fromFileUrl(root))}`);
  }
  assertEquals(violations.sort(), [], 'Destructive labels/icons must use --ns-destructive-text');
});
