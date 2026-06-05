import { PluginContribution } from './plugin-contribution.ts';

/** Base class for telemetry contribution implementations. */
export abstract class PluginTelemetryContribution extends PluginContribution {
  readonly axis = 'telemetry' as const;
  abstract readonly name: string;
  abstract readonly module: string;
}
