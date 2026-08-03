import { assert, assertEquals, assertFalse, assertStringIncludes } from '@std/assert';
import type { ComponentChildren } from 'preact';
import {
  RENDER_UI_MAX_DEPTH,
  type RenderUiFallbackReason,
  renderUiPayload,
} from '../../src/ai/render-ui.tsx';

function nestedStack(depth: number): ComponentChildren {
  if (depth === 0) {
    return { type: 'metric', props: { label: 'Leaf', value: 'ok' } };
  }
  return { type: 'stack', props: { children: [nestedStack(depth - 1)] } };
}

function nestedArray(depth: number): unknown {
  let value: unknown = { type: 'metric', props: { label: 'Leaf', value: 'ok' } };
  for (let index = 0; index < depth; index++) {
    value = [value];
  }
  return value;
}

function serialize(value: unknown): string {
  return JSON.stringify(value, (_key, entry) => {
    if (typeof entry === 'function') return `[function ${entry.name}]`;
    if (typeof entry === 'symbol') return String(entry);
    return entry;
  });
}

Deno.test('renderUiPayload renders nested layout, viz, and data blocks', () => {
  const tree: unknown = renderUiPayload({
    component: 'section',
    title: 'Operations',
    props: {
      children: [
        {
          type: 'grid',
          props: {
            children: [
              {
                type: 'metric',
                props: { label: 'Requests', value: 42, detail: 'last minute' },
              },
              {
                type: 'chart',
                props: { data: [{ label: 'OK', value: 40 }, { label: 'Retry', value: 2 }] },
              },
              {
                type: 'table',
                title: 'Services',
                props: {
                  columns: [{ key: 'name', header: 'Service' }, {
                    key: 'status',
                    header: 'Status',
                  }],
                  rows: [{ name: 'api', status: 'healthy' }],
                },
              },
            ],
          },
        },
      ],
    },
  });
  const serialized = serialize(tree);

  assertStringIncludes(serialized, 'data-render-ui-type=\\"section\\"');
  assertStringIncludes(serialized, 'data-render-ui-type=\\"grid\\"');
  assertStringIncludes(serialized, 'data-render-ui-type=\\"metric\\"');
  assertStringIncludes(serialized, 'data-render-ui-type=\\"chart\\"');
  assertStringIncludes(serialized, 'data-render-ui-type=\\"table\\"');
});

Deno.test('renderUiPayload truncates payloads beyond the configured max depth', () => {
  const tree: unknown = renderUiPayload({
    component: 'stack',
    props: { children: [nestedStack(RENDER_UI_MAX_DEPTH + 2)] },
  });
  const fallbackAttribute =
    `data-render-ui-fallback=\\"${'max-depth' satisfies RenderUiFallbackReason}\\"`;

  assertStringIncludes(serialize(tree), fallbackAttribute);
});

Deno.test('renderUiPayload bounds nested arrays by the max depth guard', () => {
  const tree: unknown = renderUiPayload({
    component: 'stack',
    props: { children: nestedArray(50) },
  });
  const fallbackAttribute =
    `data-render-ui-fallback=\\"${'max-depth' satisfies RenderUiFallbackReason}\\"`;

  assertStringIncludes(serialize(tree), fallbackAttribute);
});

Deno.test('renderUiPayload falls back for unknown types without emitting raw markup', async () => {
  const raw = '<script>alert("owned")</script><img src=x onerror=alert(1)>';
  const tree: unknown = renderUiPayload({
    component: 'section',
    props: {
      children: [{
        type: 'marquee',
        props: { children: raw },
      }],
    },
  });
  const serialized = serialize(tree);

  assertStringIncludes(serialized, 'data-render-ui-fallback=\\"unknown-type\\"');
  assertFalse(serialized.includes(raw), 'fallback must not carry raw payload markup');

  const source = await Deno.readTextFile(new URL('../../src/ai/render-ui.tsx', import.meta.url));
  assertFalse(source.includes('dangerouslySetInnerHTML'));
  assertFalse(source.includes('__html'));
  assertStringIncludes(source, 'data-render-ui-fallback');
});

Deno.test('documented renderer imports match public subpath export map and fail on root', async () => {
  const rootMod = await import('../../mod.ts');
  const renderUiMod = await import('../../src/ai/render-ui.tsx');

  // Verify subpath exports the symbols
  assert(
    'renderUiPayload' in renderUiMod,
    'subpath @netscript/fresh-ui/ai/render-ui must export renderUiPayload',
  );
  assert(
    'RenderUiSurface' in renderUiMod,
    'subpath @netscript/fresh-ui/ai/render-ui must export RenderUiSurface',
  );

  // Verify root mod does NOT export the symbols
  assertFalse(
    'renderUiPayload' in (rootMod as object),
    'root @netscript/fresh-ui must NOT export renderUiPayload',
  );
  assertFalse(
    'RenderUiSurface' in (rootMod as object),
    'root @netscript/fresh-ui must NOT export RenderUiSurface',
  );

  // Inspect source files for documented snippet imports
  const sourcePath = new URL('../../src/ai/render-ui.tsx', import.meta.url);
  const sourceText = await Deno.readTextFile(sourcePath);

  const docRefPath = new URL('../../../../docs/site/reference/fresh-ui/index.md', import.meta.url);
  const docRefText = await Deno.readTextFile(docRefPath);

  for (
    const [location, text] of [['src/ai/render-ui.tsx', sourceText], [
      'docs/site/reference/fresh-ui/index.md',
      docRefText,
    ]] as const
  ) {
    const rootMatches = [
      ...text.matchAll(
        /import\s+\{[^}]*\b(renderUiPayload|RenderUiSurface)\b[^}]*\}\s+from\s+["']@netscript\/fresh-ui["']/g,
      ),
    ];
    assertEquals(
      rootMatches.length,
      0,
      `${location}: renderer symbols must not be imported from root @netscript/fresh-ui`,
    );

    const subpathMatches = [
      ...text.matchAll(
        /import\s+\{[^}]*\b(renderUiPayload|RenderUiSurface)\b[^}]*\}\s+from\s+["']@netscript\/fresh-ui\/ai\/render-ui["']/g,
      ),
    ];
    assert(
      subpathMatches.length > 0,
      `${location}: must contain valid imports from @netscript/fresh-ui/ai/render-ui`,
    );
  }
});
