import { assertEquals } from '@std/assert';

Deno.test('shipped destructive text uses the measured text role rather than the solid fill', async () => {
  const root = new URL('../../registry/components/ui/', import.meta.url);
  const violations: string[] = [];
  // Border/fill uses are intentional; only the CSS text color property needs the text role.
  for await (const file of Deno.readDir(root)) {
    if (!file.isFile || !file.name.endsWith('.css')) continue;
    const css = await Deno.readTextFile(new URL(file.name, root));
    if (/(?<![-\w])color\s*:\s*var\(--ns-destructive\)/.test(css)) {
      violations.push(file.name);
    }
  }
  assertEquals(violations, [], 'Destructive labels/icons must use --ns-destructive-text');
});
