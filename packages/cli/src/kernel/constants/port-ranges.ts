/** Range definition with inclusive start/end boundaries. */
export interface PortRange {
  readonly start: number;
  readonly end: number;
}

/** Port allocation ranges for scaffolded resources. */
export const PORT_RANGES = {
  SERVICE: { start: 3000, end: 3099 } as PortRange,
  APP: { start: 8000, end: 8099 } as PortRange,
  PLUGIN_API: { start: 8091, end: 8099 } as PortRange,
  INFRA_PLUGIN: { start: 4400, end: 4499 } as PortRange,
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

export type RangedPortType = 'SERVICE' | 'APP' | 'PLUGIN_API' | 'INFRA_PLUGIN';
export type FixedPortType = 'ASPIRE_DASHBOARD' | 'OTEL_COLLECTOR';
export type PortType = RangedPortType | FixedPortType;
