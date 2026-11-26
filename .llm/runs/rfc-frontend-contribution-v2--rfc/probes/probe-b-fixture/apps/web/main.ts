import { defineFreshApp } from '@netscript/fresh/server';
import type { State } from '@app/utils.ts';
import type { Route } from 'fresh';
import * as routeExplicitStatic from '@acme/local-plugin/route-explicit';

function normalizeRouteMod(mod: Record<string, unknown>): Route<State> {
  return {
    component: mod.default as Route<State>['component'],
    handler: (mod.handlers ?? mod.handler) as Route<State>['handler'],
    config: mod.config as Route<State>['config'],
    css: mod.css as string[] | undefined,
  };
}

export const app = defineFreshApp<State>({
  name: 'probe-b-web',
  telemetry: false,
  queryCacheInvalidation: false,
  configure(freshApp) {
    freshApp.route(
      '/plugin-mounted',
      () => import('@acme/local-plugin/route').then((m) => normalizeRouteMod(m as Record<string, unknown>)),
    );
    freshApp.route(
      '/plugin-mounted-raw',
      () => import('@acme/local-plugin/route-raw').then((m) => normalizeRouteMod(m as Record<string, unknown>)),
    );
    freshApp.route(
      '/plugin-mounted-explicit',
      () => import('@acme/local-plugin/route-explicit').then((m) => normalizeRouteMod(m as Record<string, unknown>)),
    );
    freshApp.route(
      '/plugin-eager-explicit',
      normalizeRouteMod(routeExplicitStatic as unknown as Record<string, unknown>),
    );
  },
});
