/**
 * Central config barrel for the agentic suite — the ONE place volatile values
 * live. See `config/README.md` for the monthly-maintenance map (where to change
 * a model, a version, a policy, an endpoint, a dep).
 *
 * Concern → module:
 *  - models    → `config/models.ts`    (+ routing bindings in `runtime/routing-policy.ts`)
 *  - versions  → `config/versions.ts`
 *  - endpoints → `config/endpoints.ts`
 */
export * from './models.ts';
export * from './versions.ts';
export * from './endpoints.ts';
