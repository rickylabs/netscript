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

export type RangedPortType = 'SERVICE' | 'APP' | 'PLUGIN_API' | 'INFRA_PLUGIN';
export type FixedPortType = 'ASPIRE_DASHBOARD' | 'OTEL_COLLECTOR';
export type PortType = RangedPortType | FixedPortType;
