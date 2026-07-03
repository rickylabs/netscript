/**
 * @module kernel/domain/deploy/observability-convention
 *
 * Target-agnostic **OpenTelemetry convention** for the deploy core
 * (R-DEPLOY-3, D6). `OTEL_DENO` is a Deno-*runtime* feature common to every
 * Deno deploy target, so deriving the OTEL env is convention — not a
 * bare-metal-private copy. Bare-metal sources its systemd `Environment=` /
 * SERVY XML env from this helper (S5); cloud adapters inject the same map into
 * their platform env.
 *
 * Pure module (A11/F-CLI-16/F-4): no `Deno.*` I/O, no `public/**` import.
 */

import { DEFAULT_OTLP_PROTOCOL } from '../../constants/deploy.ts';

/** Inputs for {@link observabilityEnv}. */
export interface ObservabilityEnvOptions {
  /** Whether OTEL env is emitted at all. Default `true`; `false` → empty map. */
  readonly enabled?: boolean;
  /** Base service name → `OTEL_SERVICE_NAME` (after any prefix). */
  readonly serviceName: string;
  /** Optional prefix prepended to `serviceName` (e.g. `acme-`). */
  readonly serviceNamePrefix?: string;
  /** OTLP exporter endpoint → `OTEL_EXPORTER_OTLP_ENDPOINT` (omitted when unset). */
  readonly endpoint?: string;
  /** OTLP exporter protocol → `OTEL_EXPORTER_OTLP_PROTOCOL`. Default `http/protobuf`. */
  readonly protocol?: string;
  /** Service version → `OTEL_RESOURCE_ATTRIBUTES=service.version=…` (omitted when unset). */
  readonly serviceVersion?: string;
  /**
   * Also emit `OTEL_SERVICE_VERSION` as a standalone var (SERVY parity: plugin /
   * worker binaries get it in addition to `OTEL_RESOURCE_ATTRIBUTES`).
   */
  readonly emitServiceVersionVar?: boolean;
}

/**
 * Pure derivation of the canonical OTEL runtime env map. Emits the Deno-runtime
 * flag `OTEL_DENO='true'` (canonical string value — never `1`), the derived
 * `OTEL_SERVICE_NAME`, the exporter protocol (defaulted), and — when configured
 * — the exporter endpoint and service-version resource attribute. Returns an
 * empty map when `enabled === false`.
 */
export function observabilityEnv(options: ObservabilityEnvOptions): Record<string, string> {
  if (options.enabled === false) return {};

  const env: Record<string, string> = {};
  env.OTEL_DENO = 'true';
  env.OTEL_SERVICE_NAME = `${options.serviceNamePrefix ?? ''}${options.serviceName}`;

  if (options.endpoint) {
    env.OTEL_EXPORTER_OTLP_ENDPOINT = options.endpoint;
  }
  env.OTEL_EXPORTER_OTLP_PROTOCOL = options.protocol ?? DEFAULT_OTLP_PROTOCOL;

  if (options.serviceVersion) {
    env.OTEL_RESOURCE_ATTRIBUTES = `service.version=${options.serviceVersion}`;
    if (options.emitServiceVersionVar) {
      env.OTEL_SERVICE_VERSION = options.serviceVersion;
    }
  }

  return env;
}
