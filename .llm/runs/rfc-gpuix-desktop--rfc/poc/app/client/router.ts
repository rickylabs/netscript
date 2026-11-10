/**
 * "Fresh-native" spike: routes keep Fresh 3's route-module contract
 * (middleware → handler returns `{ data }` → page rendered inside layouts),
 * but the terminal step renders a VNode into the live renderer instead of
 * `renderPage()` to HTML. No SSR, no islands, no hydration: the server and the
 * client are the same process, so there is nothing to serialize.
 *
 * Fresh 3 composes exactly this in `freshHandler`/`invokeRoute` before calling
 * `renderPage(inner)`; a native target replaces only that last call.
 */
import type { ComponentType } from 'preact';
import { signal } from '@preact/signals';

export interface RouteContext {
  readonly url: URL;
  readonly params: Record<string, string>;
  readonly state: Record<string, unknown>;
}

/** Fresh-style handler result: data for the page, or a redirect. */
export type HandlerResult<T> = { data: T } | { redirect: string };

export interface RouteModule<T = unknown> {
  readonly pattern: string;
  readonly title: string;
  readonly handler?: (ctx: RouteContext) => HandlerResult<T> | Promise<HandlerResult<T>>;
  readonly page: ComponentType<{ data: T; params: Record<string, string>; url: URL; navigate: (href: string) => void }>;
}

export type Middleware = (ctx: RouteContext, next: () => Promise<void>) => Promise<string | void>;

export interface ActiveRoute {
  readonly route: RouteModule;
  readonly data: unknown;
  readonly params: Record<string, string>;
  readonly url: URL;
}

export const activeRoute = signal<ActiveRoute | null>(null);
export const navigating = signal(false);

function compile(pattern: string): (path: string) => Record<string, string> | null {
  const names: string[] = [];
  const source = pattern.replace(/:([a-zA-Z]+)/g, (_, name: string) => {
    names.push(name);
    return '([^/]+)';
  });
  const regex = new RegExp(`^${source}$`);
  return (path) => {
    const match = regex.exec(path);
    if (!match) return null;
    return Object.fromEntries(names.map((name, index) => [name, decodeURIComponent(match[index + 1])]));
  };
}

export function createRouter(routes: readonly RouteModule<never>[], middleware: readonly Middleware[]) {
  const table = routes.map((route) => ({ route: route as RouteModule, match: compile(route.pattern) }));
  let generation = 0;

  async function navigate(href: string, depth = 0): Promise<void> {
    if (depth > 5) throw new Error(`Redirect loop at ${href}`);
    const url = new URL(href, 'app://desktop');
    const hit = table.map((entry) => ({ ...entry, params: entry.match(url.pathname) })).find((entry) => entry.params);
    if (!hit || !hit.params) return navigate('/overview', depth + 1);
    const ctx: RouteContext = { url, params: hit.params, state: {} };
    const current = ++generation;
    navigating.value = true;
    try {
      // Middleware chain (Fresh `_middleware`): may redirect.
      for (const step of middleware) {
        const redirect = await step(ctx, () => Promise.resolve());
        if (redirect && redirect !== url.pathname) return navigate(redirect, depth + 1);
      }
      const result = hit.route.handler ? await hit.route.handler(ctx) : { data: undefined };
      if ('redirect' in result) return navigate(result.redirect, depth + 1);
      if (current !== generation) return; // a newer navigation won
      activeRoute.value = { route: hit.route, data: result.data, params: hit.params, url };
    } finally {
      if (current === generation) navigating.value = false;
    }
  }

  return { navigate };
}
