/** Range definition with inclusive start/end boundaries. */
export interface PortRange {
  readonly start: number;
  readonly end: number;
}

/** Port allocation ranges for scaffolded resources. */
export const PORT_RANGES = {
  SERVICE: { start: 49_152, end: 53_247 } as PortRange,
  APP: { start: 53_248, end: 57_343 } as PortRange,
  PLUGIN_API: { start: 57_344, end: 61_439 } as PortRange,
  INFRA_PLUGIN: { start: 61_440, end: 65_535 } as PortRange,
  ASPIRE_DASHBOARD: 18888,
  OTEL_COLLECTOR: 4318,
} as const;

/**
 * Ports a user may pin for a resource: the unprivileged TCP range.
 *
 * Scaffolded resources let Aspire allocate their ports, so the narrower
 * `PORT_RANGES` windows only shape default assignment inside one workspace.
 * An explicitly requested port is validated against this range instead, so
 * pinning is not confined to a 100-port window that every workspace on the
 * machine would compete for.
 */
export const USER_PORT_RANGE: PortRange = { start: 1024, end: 65535 };

/**
 * Fallback port baked into a scaffolded Fresh app's own source, for running it
 * **outside** the AppHost (`deno task dev` in `apps/<name>/`).
 *
 * Deliberately offset from `PORT_RANGES.APP.start`. This is the app's *target*
 * port — the one the process itself binds — and it is the exact counterpart of
 * `PORT_RANGES.SERVICE` for services.
 *
 * It is **not** a host/proxy port: under Aspire the app publishes no fixed port (see
 * `render-http-endpoint.ts`), so a second workspace on the same machine does not collide.
 * Anything that needs to reach a *running* app must resolve the endpoint from the AppHost
 * rather than assume this number — see `e2e/.../generated-app-endpoint.ts`.
 */
export const SCAFFOLD_APP_PORT: number = PORT_RANGES.APP.start + 10;

export type RangedPortType = 'SERVICE' | 'APP' | 'PLUGIN_API' | 'INFRA_PLUGIN';
export type FixedPortType = 'ASPIRE_DASHBOARD' | 'OTEL_COLLECTOR';
export type PortType = RangedPortType | FixedPortType;
