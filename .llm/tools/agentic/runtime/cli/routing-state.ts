/** Read-only human edge for persisted quota fallback state. */

import { LocalRuntimeStateAdapter } from '../adapters/local-state-adapter.ts';
import type { RoutingState } from '../routing-state-machine.ts';
import { CANONICAL_ROUTE_POLICY } from '../routing-policy.ts';

export function renderCanonicalEvaluatorRoutes(): string {
  const routes = CANONICAL_ROUTE_POLICY.filter((route) => route.purpose === 'evaluation');
  return [
    'Canonical evaluator routes:',
    ...routes.map((route) =>
      `  ${route.lane}: evaluates=${route.evaluatesFamily} route=${route.agent}/${route.provider}/${route.model} effort=${route.effort}`
    ),
  ].join('\n');
}

export function renderRoutingStateHuman(states: readonly RoutingState[]): string {
  if (states.length === 0) return 'No persisted routing transitions.';
  return states.map((state) =>
    [
      `${state.routingStateId}: ${state.phase}`,
      `  reason=${state.reasonCategory} depth=${state.fallbackDepth} restoration=${state.restorationStatus}`,
      `  desired=${state.desiredRoute.agent}/${state.desiredRoute.model}`,
      `  active=${state.activeRoute.agent}/${state.activeRoute.model}`,
      `  transitions=${state.transitions.length} notificationRequired=${state.notificationRequired}`,
    ].join('\n')
  ).join('\n');
}

export async function readRoutingStates(home: string): Promise<readonly RoutingState[]> {
  const adapter = new LocalRuntimeStateAdapter(
    `${home}/.config/netscript-agentic/runtime`,
    `${home}/.config/netscript-agentic/foundation-state.json`,
  );
  return (await adapter.readPersistedState())?.routingStates ?? [];
}

async function main(): Promise<number> {
  if (Deno.args.some((value) => value !== '--json')) {
    console.error('Usage: deno task agentic:routing-state [--json]');
    return 3;
  }
  try {
    const states = await readRoutingStates(Deno.env.get('HOME') ?? '');
    console.log(
      Deno.args.includes('--json')
        ? JSON.stringify(states, null, 2)
        : `${renderCanonicalEvaluatorRoutes()}\n${renderRoutingStateHuman(states)}`,
    );
    return 0;
  } catch {
    console.error('Persisted routing state is missing, corrupt, or unsupported.');
    return 5;
  }
}

if (import.meta.main) Deno.exitCode = await main();
