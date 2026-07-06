import { assert, assertExists, assertNotStrictEquals, assertStrictEquals } from '@std/assert';
import { freshUiRegistryManifest } from '../../../registry.manifest.ts';
import McpUiWidget, {
  MCP_UI_WIDGET_DEFAULT_SANDBOX,
  mcpUiFrameAttributes,
  resolveWidgetSrc,
  sanitizeSandbox,
} from '../../../registry/islands/McpUiWidget.tsx';

interface VNodeLike {
  type: unknown;
  props: Record<string, unknown>;
  key?: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isVNodeLike(value: unknown): value is VNodeLike {
  return isRecord(value) && 'type' in value && 'props' in value && isRecord(value.props);
}

/**
 * Depth-first search across children and precompiled-template exprs for the
 * first vnode rendering the requested intrinsic element.
 */
function findElement(value: unknown, type: string): VNodeLike | undefined {
  if (Array.isArray(value)) {
    for (const entry of value) {
      const found = findElement(entry, type);
      if (found) return found;
    }
    return undefined;
  }

  if (!isVNodeLike(value)) return undefined;
  if (value.type === type) return value;

  return findElement(value.props.children, type) ?? findElement(value.props.exprs, type);
}

function renderWidgetFrame(props: Parameters<typeof McpUiWidget>[0]): VNodeLike {
  const tree: unknown = McpUiWidget(props);
  const frame = findElement(tree, 'iframe');
  assertExists(frame, 'Expected McpUiWidget to render an iframe');
  return frame;
}

Deno.test('sanitizeSandbox defaults to allow-scripts only', () => {
  assertStrictEquals(sanitizeSandbox(), MCP_UI_WIDGET_DEFAULT_SANDBOX);
  assertStrictEquals(sanitizeSandbox(undefined), 'allow-scripts');
});

Deno.test('sanitizeSandbox strips allow-same-origin on every input shape', () => {
  assertStrictEquals(sanitizeSandbox('allow-same-origin'), 'allow-scripts');
  assertStrictEquals(
    sanitizeSandbox('allow-scripts allow-same-origin'),
    'allow-scripts',
    'Expected allow-same-origin to be removed',
  );
  assertStrictEquals(
    sanitizeSandbox('  Allow-Same-Origin   allow-popups  '),
    'allow-scripts allow-popups',
    'Expected case-insensitive stripping and guaranteed allow-scripts',
  );
  assertStrictEquals(
    sanitizeSandbox('allow-popups allow-popups allow-same-origin'),
    'allow-scripts allow-popups',
    'Expected duplicate collapse with allow-scripts guaranteed',
  );
});

Deno.test('resolveWidgetSrc stamps the active theme on absolute and relative sources', () => {
  assertStrictEquals(
    resolveWidgetSrc('https://sandbox.example.test/mcp/ui?uri=ui://widget/chart', 'dark'),
    'https://sandbox.example.test/mcp/ui?uri=ui%3A%2F%2Fwidget%2Fchart&theme=dark',
  );
  assertStrictEquals(
    resolveWidgetSrc('/mcp/ui?uri=ui://widget/chart', 'light'),
    '/mcp/ui?uri=ui%3A%2F%2Fwidget%2Fchart&theme=light',
    'Expected app-relative sources to stay relative',
  );
  assertStrictEquals(
    resolveWidgetSrc('/mcp/ui?theme=stale', 'dark'),
    '/mcp/ui?theme=dark',
    'Expected an existing theme param to be replaced',
  );
});

Deno.test('mcpUiFrameAttributes keeps the frame restrictive and unlinkable', () => {
  const attributes = mcpUiFrameAttributes({
    src: '/mcp/ui?uri=ui://widget/table',
    theme: 'dark',
    sandbox: 'allow-scripts allow-same-origin',
  });

  assertStrictEquals(attributes.sandbox, 'allow-scripts');
  assertStrictEquals(attributes.title, 'MCP UI widget');
  assertStrictEquals(attributes.loading, 'lazy');
  assertStrictEquals(attributes.referrerpolicy, 'no-referrer');
  assert(attributes.src.includes('theme=dark'), 'Expected the theme to be stamped on the src');
});

Deno.test('McpUiWidget keys the iframe on the theme so a theme change remounts', () => {
  const light = renderWidgetFrame({ src: '/mcp/ui?uri=ui://widget/chart', theme: 'light' });
  const dark = renderWidgetFrame({ src: '/mcp/ui?uri=ui://widget/chart', theme: 'dark' });

  assertStrictEquals(light.key, 'light', 'Expected the iframe key to be the active theme');
  assertStrictEquals(dark.key, 'dark', 'Expected the iframe key to be the active theme');
  assertNotStrictEquals(
    light.key,
    dark.key,
    'Expected a theme change to change the key (full unmount/remount)',
  );

  assert(
    typeof light.props.src === 'string' && light.props.src.includes('theme=light'),
    'Expected the light frame to load the light-themed sandbox document',
  );
  assert(
    typeof dark.props.src === 'string' && dark.props.src.includes('theme=dark'),
    'Expected the dark frame to load the dark-themed sandbox document',
  );
});

Deno.test('McpUiWidget never renders allow-same-origin, even when a caller asks for it', () => {
  const defaulted = renderWidgetFrame({ src: '/mcp/ui?uri=ui://widget/chart', theme: 'light' });
  assertStrictEquals(defaulted.props.sandbox, 'allow-scripts');

  const hostile = renderWidgetFrame({
    src: '/mcp/ui?uri=ui://widget/chart',
    theme: 'light',
    sandbox: 'allow-same-origin allow-scripts allow-forms',
  });
  const sandbox = hostile.props.sandbox;
  assert(typeof sandbox === 'string', 'Expected a sandbox attribute on the iframe');
  assert(!sandbox.includes('allow-same-origin'), 'Expected allow-same-origin to be stripped');
  assert(sandbox.includes('allow-scripts'), 'Expected allow-scripts to be guaranteed');
});

Deno.test('manifest wires mcp-ui-widget into the ai collection', () => {
  const item = freshUiRegistryManifest.items.find((entry) => entry.name === 'mcp-ui-widget');
  assertExists(item, 'Expected the mcp-ui-widget registry item to be present');
  assertStrictEquals(item.kind, 'island');
  assertStrictEquals(item.layer, 3);
  assert(
    item.registryDependencies?.includes('theme-seed'),
    'Expected mcp-ui-widget to consume the theme token contract',
  );
  for (const tag of ['ai', 'mcp-ui', 'iframe']) {
    assert(item.tags.includes(tag), `Expected mcp-ui-widget to carry the ${tag} tag`);
  }
  assert(
    item.files.some((file) => file.source === 'registry/islands/McpUiWidget.tsx'),
    'Expected the island source file to be registered',
  );

  const aiCollection = freshUiRegistryManifest.collections.find(
    (collection) => collection.name === 'ai',
  );
  assertExists(aiCollection, 'Expected the ai collection to be present');
  assert(
    aiCollection.items.includes('mcp-ui-widget'),
    'Expected the ai collection to include mcp-ui-widget',
  );
});
