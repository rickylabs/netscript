import { assertEquals } from '@std/assert';
import { walk } from 'jsr:@std/fs@1';
import { fromFileUrl, relative } from '@std/path';

// CSS-only layout aliases and gallery-owned helpers are outside the shared component contract.
const LAYOUT_ALIASES = new Set([
  'ns-stack',
  'ns-cluster',
  'ns-shell',
  'ns-section',
  'ns-scroll-region',
  'ns-grid',
  'ns-token-swatch',
  'ns-gallery-row',
  'ns-gallery-stack',
]);

Deno.test('shipped JSX and scaffold templates contain no component modifier classes', async () => {
  const roots = [
    new URL('../../registry/', import.meta.url),
    new URL('../../src/', import.meta.url),
    new URL('../../../cli/src/kernel/assets/app/', import.meta.url),
  ];
  const findings: string[] = [];
  for (const root of roots) {
    const directory = fromFileUrl(root);
    for await (const entry of walk(directory, { includeDirs: false })) {
      if (!entry.path.endsWith('.tsx') && !entry.path.endsWith('.tsx.template')) continue;
      const source = await Deno.readTextFile(entry.path);
      for (const match of source.matchAll(/\bns-[a-z][\w-]*--(?:[\w-]+|\$\{)/g)) {
        if (!LAYOUT_ALIASES.has(match[0].split('--')[0])) {
          findings.push(`${relative(directory, entry.path)}: ${match[0]}`);
        }
      }
      for (const match of source.matchAll(/['"]is-(?:active|selected|open|visible)['"]/g)) {
        findings.push(`${relative(directory, entry.path)}: ${match[0]}`);
      }
    }
  }
  assertEquals(findings, []);
});
