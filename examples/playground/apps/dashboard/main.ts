/**
 * Dashboard — Fresh application entry point.
 *
 * Uses `defineFreshApp` from `@netscript/fresh/server` so that the
 * baseline bootstrap (static files, fs routes) is framework-managed and
 * consistent with every other NetScript Fresh app. See
 * `apps/playground/main.ts` in the reference monorepo for the same
 * pattern in production use.
 */

import { defineFreshApp } from '@netscript/fresh/server';
import type { State } from '@app/utils.ts';

export const app = defineFreshApp<State>({ name: 'dashboard' });

// Startup banner — visible in `aspire run` console logs and local `deno task dev`.
const port = parseInt(Deno.env.get('PORT') || '8010');
const mode = Deno.env.get('MODE') ?? 'development';

console.log(`[dashboard] starting — ${mode}`);
console.log(`[dashboard] listening on http://localhost:${port}`);
console.log(`[dashboard] health at http://localhost:${port}/health`);
