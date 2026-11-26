import { assert, assertEquals, assertNotEquals, assertThrows } from '@std/assert';
import { CALLOUT_ICONS, CALLOUT_TYPES, calloutType } from './callout-types.ts';

/** Fenced code shows callout syntax as text; it never renders as a callout. */
function withoutFences(source: string): string {
  return source.replace(/^(`{3,}|~{3,})[^\n]*\n[\s\S]*?^\1[ \t]*$/gm, '');
}

Deno.test('every authored site alert type has an explicit tone without a Note fallback', async () => {
  // Both authoring forms render the same callout: the `comp callout` component and the
  // GitHub alert (`> [!TYPE]` alone on a top-level blockquote line; see markdown-alerts.ts).
  let components = 0;
  let alerts = 0;
  const seen = new Set<string>();
  async function visit(directory: URL): Promise<void> {
    for await (const entry of Deno.readDir(directory)) {
      if (['_site', '_cache', 'node_modules'].includes(entry.name)) continue;
      const path = new URL(entry.name + (entry.isDirectory ? '/' : ''), directory);
      if (entry.isDirectory) await visit(path);
      else if (/\.(?:md|mdx|vto|html)$/.test(entry.name)) {
        const source = await Deno.readTextFile(path);
        for (const match of source.matchAll(/\bcomp(?:\.|\s+)callout\s*(?:\(\s*)?\{([^}]*?)\}/g)) {
          const field = match[1].match(/\btype\s*:\s*(["'])(.*?)\1/);
          assert(field || !/\btype\s*:/.test(match[1]), `Dynamic callout type in ${path.pathname}`);
          const kind = calloutType(field?.[2]);
          if (field) assertEquals(kind, field[2].trim().toLowerCase(), path.pathname);
          assert(CALLOUT_TYPES[kind].tone, path.pathname);
          seen.add(kind);
          components++;
        }
        if (entry.name.endsWith('.html')) continue;
        for (const match of withoutFences(source).matchAll(/^>[ \t]*\[!([A-Za-z]+)\][ \t]*$/gm)) {
          const kind = calloutType(match[1]);
          assertEquals(kind, match[1].toLowerCase(), path.pathname);
          assert(CALLOUT_TYPES[kind].tone, path.pathname);
          seen.add(kind);
          alerts++;
        }
      }
    }
  }
  await visit(new URL('../../docs/site/', import.meta.url));
  assert(components + alerts > 100, 'The guard must inspect the actual authored corpus');
  assert(alerts > 0, 'The guard must inspect authored GitHub alerts as well as components');
  assertEquals([...seen].sort(), Object.keys(CALLOUT_TYPES).sort());
});

Deno.test('alert aliases preserve destructive semantics and unknown types fail closed', () => {
  assertEquals(calloutType(undefined), 'note');
  assertEquals(calloutType('NOTE'), 'note');
  for (const name of ['caution', 'danger', 'error'] as const) {
    assertEquals(calloutType(name), name);
    assertEquals(CALLOUT_TYPES[name].tone, 'destructive');
  }
  assertEquals(CALLOUT_TYPES.danger.markdown, 'CAUTION');
  assertEquals(CALLOUT_TYPES.caution.markdown, 'CAUTION');
  assertEquals(CALLOUT_TYPES.error.markdown, 'CAUTION');
  assertThrows(() => calloutType('unknown'), Error, 'Unsupported callout type');
  assertThrows(() => calloutType('dangre'), Error, 'Unsupported callout type');
});

Deno.test('every callout exports a GitHub-supported alert marker', () => {
  const supported = new Set(['NOTE', 'TIP', 'IMPORTANT', 'WARNING', 'CAUTION']);
  for (const [name, definition] of Object.entries(CALLOUT_TYPES)) {
    assert(supported.has(definition.markdown), `${name}: ${definition.markdown}`);
  }
});

Deno.test('alert meaning has distinct icon names and shapes except caution and danger', () => {
  const expected = {
    note: 'info',
    tip: 'lightbulb',
    important: 'message-square-warning',
    warning: 'triangle-alert',
    caution: 'octagon-alert',
    danger: 'octagon-alert',
    error: 'circle-x',
  };
  const entries = Object.entries(CALLOUT_TYPES);
  for (const [name, kind] of entries) {
    assertEquals(kind.icon, expected[name as keyof typeof expected]);
    assert(CALLOUT_ICONS[kind.icon]);
  }
  for (const [index, [a, first]] of entries.entries()) {
    for (const [b, second] of entries.slice(index + 1)) {
      if (a === 'caution' && b === 'danger') {
        assertEquals(CALLOUT_ICONS[first.icon], CALLOUT_ICONS[second.icon]);
      } else {
        assertNotEquals(CALLOUT_ICONS[first.icon], CALLOUT_ICONS[second.icon], `${a}/${b}`);
      }
    }
  }
});
