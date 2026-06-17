import { PluginContribution } from './plugin-contribution.ts';

/** Base class for telemetry contribution implementations. */
export abstract class PluginTelemetryContribution extends PluginContribution {
  /** Contribution axis for telemetry modules. */
  readonly axis = 'telemetry' as const;
  /** Stable telemetry integration name. */
  abstract readonly name: string;
  /** Module path for the telemetry integration. */
  abstract readonly module: string;
}
