import { normalizeProbePath } from '@netscript/plugin';

const DEFAULT_HEALTH_PATH = '/health';
const DEFAULT_ROUNDTRIP_PATH = '/api/v1/sagas/publish';

/** Roundtrip probe request payload. */
export interface SagasRoundtripProbePayload {
  /** Message type routed through the saga API. */
  readonly type: string;
  /** Probe payload sent to the saga API. */
  readonly payload: Readonly<{
    readonly probeId: string;
    readonly source: 'sagas-e2e';
  }>;
  /** Correlation id for the probe run. */
  readonly correlationId: string;
}

/** Resolve the sagas service URL used by E2E probes. */
export function resolveSagasProbeUrl(): string {
  const value = Deno.env.get('services__sagas-api__https__0') ??
    Deno.env.get('services__sagas-api__http__0') ??
    Deno.env.get('SAGAS_API_URL') ??
    Deno.env.get('NETSCRIPT_SAGAS_URL');
  if (value === undefined) {
    throw new Error(
      'Sagas probe endpoint was not discovered. Configure an Aspire service reference or SAGAS_API_URL.',
    );
  }
  return value.replace(/\/$/, '');
}

/** Resolve the health path used by E2E probes. */
export function resolveSagasHealthPath(): string {
  return normalizeProbePath(Deno.env.get('SAGAS_HEALTH_PATH') ?? DEFAULT_HEALTH_PATH);
}

/** Resolve the publish path used by the roundtrip probe. */
export function resolveSagasRoundtripPath(): string {
  return normalizeProbePath(Deno.env.get('SAGAS_ROUNDTRIP_PATH') ?? DEFAULT_ROUNDTRIP_PATH);
}

/** Return a unique roundtrip payload for an isolated probe run. */
export function createSagasRoundtripPayload(): SagasRoundtripProbePayload {
  const probeId = crypto.randomUUID();
  return Object.freeze({
    type: Deno.env.get('SAGAS_ROUNDTRIP_MESSAGE_TYPE') ?? 'sagas.e2e.requested',
    payload: Object.freeze({
      probeId,
      source: 'sagas-e2e' as const,
    }),
    correlationId: `sagas-e2e:${probeId}`,
  });
}
