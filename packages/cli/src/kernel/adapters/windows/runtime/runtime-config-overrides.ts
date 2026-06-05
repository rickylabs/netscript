/** Generate built-in runtime override seed data for Windows deployments. */
import type { NetScriptConfig } from '@netscript/config';
import type {
  FeatureFlag,
  JobOverride,
  SagaOverride,
  TriggerOverride,
} from '../../../domain/deploy/runtime-overrides.ts';

interface WorkersPluginConfigSection {
  readonly groups?: readonly WorkersPluginConfigGroup[];
}

interface WorkersPluginConfigGroup {
  readonly jobs?: readonly WorkersPluginConfigJob[];
}

interface WorkersPluginConfigJob {
  readonly id: string;
  readonly enabled?: boolean;
  readonly schedule?: string;
  readonly timeout?: number;
  readonly maxRetries?: number;
}

// ============================================================================
// DEFAULT FEATURE FLAGS
// ============================================================================

export const DEFAULT_FEATURE_FLAGS: FeatureFlag[] = [
  {
    id: 'enable-telemetry',
    enabled: true,
    description: 'Send traces and metrics to OTLP endpoint',
  },
  {
    id: 'enable-health-checks',
    enabled: true,
    description: 'Enable Servy health monitoring for services',
  },
  {
    id: 'enable-log-rotation',
    enabled: true,
    description: 'Enable automatic log file rotation',
  },
  {
    id: 'enable-auto-restart',
    enabled: true,
    description: 'Automatically restart failed services',
  },
];

// ============================================================================
// GENERATORS
// ============================================================================

/**
 * Generate job override stubs from netscript.config.ts workers groups.
 * Each job gets an override stub with its current values so operators can
 * easily toggle or reschedule individual jobs.
 */
export function generateJobOverrides(netscriptConfig: NetScriptConfig): JobOverride[] {
  const overrides: JobOverride[] = [];
  const workersConfig = netscriptConfig['workers'] as WorkersPluginConfigSection | undefined;

  for (const group of workersConfig?.groups ?? []) {
    for (const job of group.jobs ?? []) {
      overrides.push({
        id: job.id,
        enabled: job.enabled ?? true,
        ...(job.schedule ? { schedule: job.schedule } : {}),
        ...(job.timeout ? { timeout: job.timeout } : {}),
        ...(job.maxRetries ? { maxRetries: job.maxRetries } : {}),
      });
    }
  }

  return overrides;
}

/**
 * Generate saga override stubs from netscript.config.ts sagas groups.
 */
export function generateSagaOverrides(netscriptConfig: NetScriptConfig): SagaOverride[] {
  const overrides: SagaOverride[] = [];

  for (const group of netscriptConfig.sagas?.groups ?? []) {
    for (const saga of group.sagas ?? []) {
      overrides.push({
        id: saga.id,
        enabled: saga.enabled ?? true,
        // Flatten completionTimeout from the nested timeout object for runtime overrides
        ...(saga.timeout?.completionTimeout ? { timeout: saga.timeout.completionTimeout } : {}),
      });
    }
  }

  return overrides;
}

/**
 * Generate trigger override stubs from netscript.config.ts triggers groups.
 * Each trigger gets an override stub so operators can toggle or repath individual triggers.
 */
export function generateTriggerOverrides(netscriptConfig: NetScriptConfig): TriggerOverride[] {
  const overrides: TriggerOverride[] = [];

  for (const group of netscriptConfig.triggers?.groups ?? []) {
    for (const trigger of group.triggers ?? []) {
      overrides.push({
        id: trigger.id,
        enabled: trigger.enabled ?? true,
        // paths intentionally omitted — operators add these at runtime to override env vars
      });
    }
  }

  return overrides;
}
