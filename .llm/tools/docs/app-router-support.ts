/**
 * The `@app/router.ts` support module for checked documentation examples, produced by the scaffold's
 * own seams instead of a hand-written stub (#1939).
 *
 * The router source is the CLI's shipped `app/router.ts.template`, rendered by the CLI's template
 * renderer. Its `.generated/{manifest,routes}.ts` siblings come from the Fresh route-manifest
 * generator the scaffold runs at `netscript init`, over every app route asset the CLI ships plus
 * the reader-authored routes the documentation itself describes. No route reference is restated, so
 * a template or generator change flows straight into the checked examples.
 *
 * The one local input is {@link APP_ROUTER_TEMPLATE_VARS}. `app-router-support_test.ts` holds it to
 * the scaffold by running the real app writer in memory and comparing the rendered router byte for
 * byte, so a wrong placeholder value fails there rather than passing as a still-valid route.
 *
 * @module
 */

import { dirname, join } from '@std/path';
// The generator the scaffold's `fresh-route-manifest.ts` adapter wraps, imported from its module
// rather than through `@netscript/fresh/vite`, which would load the Vite runtime into the check.
import {
  resolveNetScriptRouteManifestOptions,
  writeNetScriptRouteManifestSync,
} from '../../../packages/fresh/src/application/route/manifest.ts';
import {
  readTemplateAssetSync,
  renderTemplateAssetSync,
} from '../../../packages/cli/src/kernel/adapters/templates/template-asset.ts';
import {
  TEMPLATE_KEYS,
  TEMPLATE_MANIFEST,
  type TemplateKey,
} from '../../../packages/cli/src/kernel/assets/manifest.ts';

const APP_ROUTE_ASSET_PREFIX = 'app/routes/';
const TEMPLATE_SUFFIX = '.template';

/**
 * Router placeholders for an app scaffolded without the example service: the only variant whose
 * routes are fully determined by shipped assets. `renderTemplate` throws on any placeholder missing
 * here; the values are verified against the scaffold writer's own output by the drift test.
 */
export const APP_ROUTER_TEMPLATE_VARS: Readonly<Record<string, string>> = {
  serviceResourceRouteAlias: '',
  serviceExampleRouteReference: 'routes.examples.$route',
};

/**
 * Routes a documentation reader adds to the scaffolded app, keyed by path under `routes/`.
 *
 * Only route files are listed, never route references: the generator derives the reference.
 */
export const DOCUMENTED_READER_ROUTES: Readonly<Record<string, string>> = {
  // `packages/fresh/README.md` binds `definePartial` to `routes.partials.orders.$id.$route`.
  'partials/orders/[id].tsx': '// Reader-authored order summary partial.\nexport {};\n',
};

/** Inputs to {@link materializeAppRouterSupport}; defaults are the shipped scaffold. */
export interface AppRouterSupportOptions {
  /** App route assets to materialize. Defaults to every `app/routes/**` template the CLI ships. */
  readonly routeAssets?: readonly TemplateKey[];
  /** Reader-authored route files, keyed by path under `routes/`. */
  readonly readerRoutes?: Readonly<Record<string, string>>;
  /** Router template placeholders. Defaults to {@link APP_ROUTER_TEMPLATE_VARS}. */
  readonly routerTemplateVars?: Readonly<Record<string, string>>;
}

/** Every route-tree template asset the CLI ships for a scaffolded app. */
export function shippedAppRouteAssets(): readonly TemplateKey[] {
  return TEMPLATE_MANIFEST
    .map((item) => item.path)
    .filter((path) => path.startsWith(APP_ROUTE_ASSET_PREFIX));
}

function routeFilePath(asset: TemplateKey): string {
  const relative = asset.slice(APP_ROUTE_ASSET_PREFIX.length);
  return relative.endsWith(TEMPLATE_SUFFIX) ? relative.slice(0, -TEMPLATE_SUFFIX.length) : relative;
}

async function writeFile(path: string, content: string): Promise<void> {
  await Deno.mkdir(dirname(path), { recursive: true });
  await Deno.writeTextFile(path, content);
}

/**
 * Lay out a scaffold-shaped app under `appRoot`, generate its route modules with the scaffold's
 * route generator, and render the shipped router into it.
 *
 * @returns Absolute path of the rendered `router.ts`.
 */
export async function materializeAppRouterSupport(
  appRoot: string,
  options: AppRouterSupportOptions = {},
): Promise<string> {
  const routesDir = join(appRoot, 'routes');
  for (const asset of options.routeAssets ?? shippedAppRouteAssets()) {
    // Discovery scans module text for route-binding forms, so route files keep their real source.
    await writeFile(join(routesDir, routeFilePath(asset)), readTemplateAssetSync(asset));
  }
  for (const [path, content] of Object.entries(options.readerRoutes ?? DOCUMENTED_READER_ROUTES)) {
    await writeFile(join(routesDir, path), content);
  }
  writeNetScriptRouteManifestSync(resolveNetScriptRouteManifestOptions(appRoot));

  const routerPath = join(appRoot, 'router.ts');
  await writeFile(
    routerPath,
    renderTemplateAssetSync(
      TEMPLATE_KEYS.appRouter,
      options.routerTemplateVars ?? APP_ROUTER_TEMPLATE_VARS,
    ),
  );
  return routerPath;
}
