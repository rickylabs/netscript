/**
 * @component McpUiWidget
 * @layer 3
 * @depends theme-seed
 * @description Themed, sandboxed `ui://` widget frame for MCP generative UI.
 *
 * Renders an `<iframe>` against a caller-supplied, already-resolved `ui://`
 * source — the origin owned by the `@netscript/fresh/ai` sandbox route handler
 * (FA3), never a same-origin application route. The frame is sandboxed with
 * `allow-scripts` only and **never** `allow-same-origin`, so the embedded
 * document is an opaque origin that cannot reach the host page, cookies, or
 * storage regardless of where `src` points.
 *
 * The iframe is keyed on the active `theme`. When the consumer re-renders the
 * widget with a new theme, the key change forces a full unmount + remount, so
 * the frame always loads a fresh, correctly-themed sandbox document instead of
 * reusing a stale iframe with the previous theme's tokens baked in.
 */

import { h } from 'preact';
import type { VNode } from 'preact';

/** Props for {@link McpUiWidget}. */
export interface McpUiWidgetProps {
  /**
   * The resolved `ui://` source served by the FA3 sandbox route (an absolute
   * URL or an app-relative path to that handler). This is the frame origin; it
   * must never be a same-origin application route.
   */
  src: string;
  /** Active theme name. The iframe is keyed on this value for remount-on-change. */
  theme: string;
  /** Accessible title for the frame. Defaults to `"MCP UI widget"`. */
  title?: string;
  /**
   * Optional sandbox override. `allow-same-origin` is always stripped and
   * `allow-scripts` is always guaranteed, so the frame stays restrictive on
   * every render path. Defaults to {@link MCP_UI_WIDGET_DEFAULT_SANDBOX}.
   */
  sandbox?: string;
}

/** The only sandbox token granted by default: scripts, never same-origin. */
export const MCP_UI_WIDGET_DEFAULT_SANDBOX = 'allow-scripts';

/** Default accessible title used when the caller does not supply one. */
const MCP_UI_WIDGET_DEFAULT_TITLE = 'MCP UI widget';

/**
 * Normalize a sandbox token list so the frame is always restrictive:
 * `allow-same-origin` is removed (defense-in-depth against a same-origin
 * escape) and `allow-scripts` is guaranteed present. Token order is otherwise
 * preserved and duplicates are collapsed.
 *
 * @param sandbox Optional caller-supplied sandbox attribute value.
 * @returns A space-separated sandbox string that never grants same-origin access.
 */
export function sanitizeSandbox(sandbox?: string): string {
  const seen = new Set<string>();
  const tokens: string[] = [];

  for (const token of (sandbox ?? MCP_UI_WIDGET_DEFAULT_SANDBOX).split(/\s+/)) {
    const normalized = token.trim().toLowerCase();
    if (normalized === '' || normalized === 'allow-same-origin' || seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    tokens.push(normalized);
  }

  if (!seen.has('allow-scripts')) {
    tokens.unshift('allow-scripts');
  }

  return tokens.join(' ');
}

/**
 * Resolve the frame `src`, stamping the active theme as the `theme` query
 * parameter so the FA3 sandbox handler serves matching `--ns-*` tokens. Works
 * for both absolute URLs and app-relative paths; an unparseable value is
 * returned unchanged.
 *
 * @param src The caller-supplied `ui://`-resolved source.
 * @param theme The active theme name.
 * @returns The source with `?theme=` set to the active theme.
 */
export function resolveWidgetSrc(src: string, theme: string): string {
  const sentinelOrigin = 'https://ns-mcp-ui.invalid';
  let hadOrigin = true;
  let url: URL;

  try {
    url = new URL(src);
  } catch {
    try {
      hadOrigin = false;
      url = new URL(src, sentinelOrigin);
    } catch {
      return src;
    }
  }

  url.searchParams.set('theme', theme);
  return hadOrigin ? url.toString() : `${url.pathname}${url.search}${url.hash}`;
}

/** Directly-inspectable iframe attributes derived from {@link McpUiWidgetProps}. */
export interface McpUiFrameAttributes {
  /** Theme-stamped frame source. */
  src: string;
  /** Accessible frame title. */
  title: string;
  /** Restrictive sandbox string (never `allow-same-origin`). */
  sandbox: string;
  /** Lazy-load the frame until it scrolls into view. */
  loading: 'lazy';
  /** Never leak the host URL to the sandboxed origin. */
  referrerpolicy: 'no-referrer';
}

/**
 * Compute the security-critical iframe attributes for a widget render. Kept
 * pure (and separate from the theme key) so every render path shares one
 * restrictive-sandbox seam and tests can assert it directly.
 *
 * @param props Widget props.
 * @returns The resolved iframe attributes.
 */
export function mcpUiFrameAttributes(props: McpUiWidgetProps): McpUiFrameAttributes {
  return {
    src: resolveWidgetSrc(props.src, props.theme),
    title: props.title ?? MCP_UI_WIDGET_DEFAULT_TITLE,
    sandbox: sanitizeSandbox(props.sandbox),
    loading: 'lazy',
    referrerpolicy: 'no-referrer',
  };
}

/**
 * Renders a themed, sandboxed `ui://` widget frame.
 *
 * @param props Frame source, active theme, and optional title/sandbox overrides.
 * @returns A hydrated iframe keyed on the active theme.
 */
export default function McpUiWidget(props: McpUiWidgetProps): VNode {
  const attributes = mcpUiFrameAttributes(props);

  // The frame is created with `h()` instead of a JSX literal: the precompile
  // JSX transform inlines intrinsic elements into static templates and silently
  // drops `key`, which would defeat the theme-keyed remount contract. `h()`
  // always yields a real keyed VNode, so a theme change unmounts and remounts
  // the frame and the sandbox document reloads with the new theme — never a
  // reused stale iframe document.
  const frame = h('iframe', {
    key: props.theme,
    class: 'ns-mcp-ui-widget__frame',
    src: attributes.src,
    title: attributes.title,
    sandbox: attributes.sandbox,
    loading: attributes.loading,
    referrerpolicy: attributes.referrerpolicy,
  });

  return <div class='ns-mcp-ui-widget'>{frame}</div>;
}
