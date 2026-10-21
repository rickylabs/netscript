/**
 * The app-owned `navigation.ts` contract that `ui:add page` / `ui:remove page` edit.
 *
 * `netscript init` writes `navigation.ts` beside `router.ts`; `routes/_layout.tsx` renders its
 * `appNavigation` list as the top bar. The CLI only appends or removes one single-route entry
 * inside that array, so the layout markup stays free to restyle.
 */

import { resolve } from '@std/path';
import type { FileSystemPort } from '../../../ports/file-system-port.ts';

/** File name of the navigation module, relative to the Fresh app root. */
export const APP_NAVIGATION_FILE = 'navigation.ts';

/** Declaration whose array literal holds the top-bar links. */
export const APP_NAVIGATION_DECLARATION = 'export const appNavigation';

/** Line width of the generated workspace's `deno fmt` config; longer entries are wrapped. */
const GENERATED_LINE_WIDTH = 100;

/** Source range of the `appNavigation` array body, between `[` and the closing `\n];`. */
interface NavigationBlock {
  readonly start: number;
  readonly end: number;
}

/** What `ui:add page` asks for: the page's identity plus its `--nav` / `--no-nav` choice. */
export interface NavigationRegistrationInput {
  /** Fresh app root that holds `navigation.ts`. */
  readonly projectRoot: string;
  /** Page path relative to `routes/`. */
  readonly segment: string;
  /** Typed route id registered in `router.ts`. */
  readonly routeId: string;
  /** Default link label derived from the page path. */
  readonly title: string;
  /** A label or `true` links the page, `false` skips it, `undefined` links top-level pages only. */
  readonly nav?: boolean | string;
}

/** The planned `navigation.ts` rewrite, if any, plus guidance to print after the plan. */
export interface NavigationRegistrationPlan {
  readonly edit?: { readonly path: string; readonly content: string };
  readonly nextSteps: readonly string[];
}

/**
 * Plan the top-bar link for a page. An explicit `--nav` that cannot be honored fails before any
 * write; the implicit top-level default degrades to guidance instead.
 */
export async function planNavigationRegistration(
  input: NavigationRegistrationInput,
  fs: FileSystemPort,
): Promise<NavigationRegistrationPlan> {
  const wanted = input.nav ?? !input.segment.includes('/');
  if (wanted === false) {
    return {
      nextSteps: [
        `Not linked in the top bar; add appRoutes['${input.routeId}'] to appNavigation in ${APP_NAVIGATION_FILE} to link it.`,
      ],
    };
  }
  const path = resolve(input.projectRoot, APP_NAVIGATION_FILE);
  const source = await fs.exists(path) ? await fs.readFile(path) : undefined;
  const label = typeof wanted === 'string' ? wanted : input.title;
  const content = source === undefined
    ? undefined
    : addNavigationEntry(source, input.routeId, label);
  if (content !== undefined) return { edit: { path, content }, nextSteps: [] };
  const reason = source === undefined
    ? `${path} does not exist (the app predates scaffold navigation)`
    : `${path} has no recognizable '${APP_NAVIGATION_DECLARATION}' array`;
  if (input.nav !== undefined) {
    throw new Error(`Cannot link '${input.routeId}' in the top bar: ${reason}.`);
  }
  return {
    nextSteps: [
      `Not linked in the top bar: ${reason}. Link it from routes/_layout.tsx, which must also render the top bar for this route.`,
    ],
  };
}

/** Turn a page path segment such as `data-screen` into the link label `Data Screen`. */
export function navigationLabel(segment: string): string {
  const words = segment.split(/[-_]+/).filter(Boolean);
  return words.map((word) => word[0].toUpperCase() + word.slice(1)).join(' ') || segment;
}

/** Render the `appNavigation` entry that links a page through its typed route reference. */
export function renderNavigationEntry(routeId: string, label: string): string {
  const href = `appRoutes['${routeId}'].href()`;
  const text = `'${label.replace(/\s+/g, ' ').replaceAll('\\', '\\\\').replaceAll("'", "\\'")}'`;
  const line = `  { href: ${href}, label: ${text}, match: 'prefix' },`;
  if (line.length <= GENERATED_LINE_WIDTH) return line;
  return `  {\n    href: ${href},\n    label: ${text},\n    match: 'prefix',\n  },`;
}

/**
 * Append the page's entry to `appNavigation`. Returns the source unchanged when the route is
 * already linked, and `undefined` when the declaration is not recognizable.
 */
export function addNavigationEntry(
  source: string,
  routeId: string,
  label: string,
): string | undefined {
  const block = findNavigationBlock(source);
  if (!block) return undefined;
  if (routeReference(routeId).test(source.slice(block.start, block.end))) return source;
  const entry = renderNavigationEntry(routeId, label);
  return `${source.slice(0, block.end)}\n${entry}${source.slice(block.end)}`;
}

/** Remove the page's entry from `appNavigation`; other entries and edits are left untouched. */
export function removeNavigationEntry(source: string, routeId: string): string {
  const block = findNavigationBlock(source);
  if (!block) return source;
  const body = source.slice(block.start, block.end);
  const entry = new RegExp(
    `\\n[ \\t]*\\{[^{}]*?${routeReference(routeId).source}[^{}]*\\},?[ \\t]*(?=\\n|$)`,
  );
  const next = body.replace(entry, '');
  return next === body ? source : source.slice(0, block.start) + next + source.slice(block.end);
}

function findNavigationBlock(source: string): NavigationBlock | undefined {
  const declaration = source.indexOf(APP_NAVIGATION_DECLARATION);
  if (declaration < 0) return undefined;
  const open = source.indexOf('= [', declaration);
  if (open < 0) return undefined;
  const start = open + '= ['.length;
  const end = source.indexOf('\n];', start);
  // A one-line or already-closed array would otherwise borrow a later declaration's `];`.
  if (end < 0 || source.slice(start, end).includes('];')) return undefined;
  return { start, end };
}

function routeReference(routeId: string): RegExp {
  const id = routeId.replace(/[.*+?^${}()|[\]\\-]/g, '\\$&');
  const property = /^[A-Za-z_$][\w$]*$/.test(routeId) ? `|appRoutes\\.${id}\\b` : '';
  return new RegExp(`(?:appRoutes\\[\\s*['"]${id}['"]\\s*\\]${property})`);
}
