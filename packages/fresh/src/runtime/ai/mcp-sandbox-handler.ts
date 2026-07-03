/**
 * FA3 — MCP `ui://` sandbox response handler for `@netscript/fresh/ai`.
 *
 * The handler is intentionally route-agnostic: a Fresh route mounts it and the
 * requested MCP UI resource is selected with `?uri=ui://...`. The resource
 * lookup and theme source are caller-owned ports so this package does not take
 * a dependency on a registry or design-system implementation.
 *
 * @module
 */

const DEFAULT_THEME_NAME = 'default';
const UI_RESOURCE_QUERY_PARAM = 'uri';
const THEME_QUERY_PARAM = 'theme';
const CSP_HEADER = 'Content-Security-Policy';

/** Options for {@link createMcpSandboxHandler}. */
export interface McpSandboxHandlerOptions {
  /**
   * Resolve a registered MCP `ui://` resource body.
   *
   * The incoming request's `AbortSignal` is passed through so a client
   * disconnect can cancel registry/database work before the response is built.
   */
  readonly resolveResource: (
    uri: string,
    context: {
      readonly request: Request;
      readonly signal: AbortSignal;
    },
  ) =>
    | string
    | { readonly body: string }
    | null
    | undefined
    | Promise<string | { readonly body: string } | null | undefined>;
  /**
   * Theme-token source keyed by theme name, or a resolver invoked per request.
   * Only `--ns-*` custom properties are injected into the sandbox document.
   */
  readonly themes:
    | Readonly<Record<string, Readonly<Record<string, string>>>>
    | ((
      themeName: string,
      context: {
        readonly request: Request;
        readonly signal: AbortSignal;
      },
    ) =>
      | Readonly<Record<string, string>>
      | null
      | undefined
      | Promise<Readonly<Record<string, string>> | null | undefined>);
  /**
   * Theme used when `?theme=` is absent or unknown. Defaults to `"default"`.
   */
  readonly defaultThemeName?: string;
}

type McpSandboxThemeSource = McpSandboxHandlerOptions['themes'];
type McpSandboxThemeTokens = Readonly<Record<string, string>>;

function toResourceUri(request: Request): string | null {
  const uri = new URL(request.url).searchParams.get(UI_RESOURCE_QUERY_PARAM);
  if (!uri?.startsWith('ui://')) return null;
  return uri;
}

function requestedThemeName(request: Request): string | null {
  const value = new URL(request.url).searchParams.get(THEME_QUERY_PARAM);
  return value && value.trim().length > 0 ? value : null;
}

function normalizeResource(resource: string | { readonly body: string }): {
  readonly body: string;
} {
  if (typeof resource === 'string') {
    return { body: resource };
  }
  return { body: resource.body };
}

async function resolveThemeTokens(
  themes: McpSandboxThemeSource,
  requested: string | null,
  defaultThemeName: string,
  request: Request,
): Promise<{ readonly themeName: string; readonly tokens: McpSandboxThemeTokens }> {
  if (typeof themes !== 'function') {
    if (requested !== null && themes[requested]) {
      return { themeName: requested, tokens: themes[requested] };
    }
    if (themes[defaultThemeName]) {
      return { themeName: defaultThemeName, tokens: themes[defaultThemeName] };
    }
    const [firstName, firstTokens] = Object.entries(themes)[0] ?? [defaultThemeName, {}];
    return { themeName: firstName, tokens: firstTokens };
  }

  const resolve = async (name: string): Promise<McpSandboxThemeTokens | null | undefined> => {
    return await themes(name, { request, signal: request.signal });
  };

  if (requested !== null) {
    const tokens = await resolve(requested);
    if (tokens) return { themeName: requested, tokens };
  }

  const fallback = await resolve(defaultThemeName);
  return { themeName: defaultThemeName, tokens: fallback ?? {} };
}

function escapeHtmlAttribute(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function escapeStyleText(value: string): string {
  return value.replace(/<\/style/gi, '<\\/style');
}

function tokenStyle(themeName: string, tokens: McpSandboxThemeTokens): string {
  const declarations = Object.entries(tokens)
    .filter(([name]) => /^--ns-[a-zA-Z0-9_-]+$/.test(name))
    .map(([name, value]) => `  ${name}: ${escapeStyleText(value)};`);
  return [
    `:root {`,
    `  color-scheme: light dark;`,
    ...declarations,
    `}`,
    `[data-theme="${escapeStyleText(themeName)}"] {`,
    ...declarations,
    `}`,
  ].join('\n');
}

function uiCspSource(uri: string): string {
  const parsed = new URL(uri);
  const path = parsed.pathname === '' ? '/' : parsed.pathname;
  return `${parsed.protocol}//${parsed.host}${path}`;
}

async function sha256Source(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  const bytes = new Uint8Array(digest);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return `'sha256-${btoa(binary)}'`;
}

async function buildSandboxCsp(resourceUri: string, inlineStyle: string): Promise<string> {
  const resourceSource = `'${uiCspSource(resourceUri)}'`;
  const styleHash = await sha256Source(inlineStyle);
  return [
    `default-src 'none'`,
    `base-uri 'none'`,
    `form-action 'none'`,
    `frame-ancestors 'self'`,
    `img-src 'self' data: blob:`,
    `style-src 'self' ${styleHash}`,
    `script-src 'self' ${resourceSource}`,
    `frame-src 'self' ${resourceSource}`,
  ].join('; ');
}

function renderSandboxDocument(input: {
  readonly resourceBody: string;
  readonly themeName: string;
  readonly inlineStyle: string;
  readonly csp: string;
}): string {
  const themeName = escapeHtmlAttribute(input.themeName);
  const csp = escapeHtmlAttribute(input.csp);
  return [
    '<!doctype html>',
    `<html data-theme="${themeName}">`,
    '<head>',
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    `<meta http-equiv="${CSP_HEADER}" content="${csp}">`,
    `<style data-netscript-theme-tokens>${input.inlineStyle}</style>`,
    '</head>',
    '<body>',
    input.resourceBody,
    '</body>',
    '</html>',
  ].join('');
}

/**
 * Build a Fresh-compatible MCP sandbox route handler.
 *
 * The returned handler serves a registered `ui://` resource selected by
 * `?uri=`, injects the active theme's `--ns-*` custom properties before the
 * resource body, stamps `data-theme`, and applies a per-response CSP derived
 * from the requested resource URI. `?theme=` selects a token set; unknown or
 * absent themes fall back to `defaultThemeName` or the documented `"default"`.
 *
 * @param options Resource resolver, theme-token source, and optional fallback theme name.
 * @returns A request handler suitable for Fresh route exports.
 *
 * @example
 * ```ts
 * import { createMcpSandboxHandler } from '@netscript/fresh/ai';
 *
 * export const handler = {
 *   GET: createMcpSandboxHandler({
 *     resolveResource: (uri, { signal }) => registry.lookup(uri, { signal }),
 *     themes: {
 *       default: { '--ns-color-surface': '#ffffff' },
 *       dark: { '--ns-color-surface': '#111111' },
 *     },
 *   }),
 * };
 * ```
 */
export function createMcpSandboxHandler(
  options: McpSandboxHandlerOptions,
): (req: Request) => Promise<Response> {
  const defaultThemeName = options.defaultThemeName ?? DEFAULT_THEME_NAME;

  return async (request: Request): Promise<Response> => {
    const resourceUri = toResourceUri(request);
    if (resourceUri === null) {
      return new Response('Expected a `ui://` resource URI in `?uri=`.', { status: 400 });
    }

    const resolved = await options.resolveResource(resourceUri, {
      request,
      signal: request.signal,
    });
    if (resolved == null) {
      return new Response('MCP UI resource not found.', { status: 404 });
    }

    const resource = normalizeResource(resolved);
    const theme = await resolveThemeTokens(
      options.themes,
      requestedThemeName(request),
      defaultThemeName,
      request,
    );
    const inlineStyle = tokenStyle(theme.themeName, theme.tokens);
    const csp = await buildSandboxCsp(resourceUri, inlineStyle);
    const body = renderSandboxDocument({
      resourceBody: resource.body,
      themeName: theme.themeName,
      inlineStyle,
      csp,
    });

    return new Response(body, {
      status: 200,
      headers: {
        [CSP_HEADER]: csp,
        'content-type': 'text/html; charset=utf-8',
        'x-netscript-mcp-resource': resourceUri,
        'x-netscript-theme': theme.themeName,
      },
    });
  };
}
