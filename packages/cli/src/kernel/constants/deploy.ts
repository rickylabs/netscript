/**
 * @module constants/deploy
 *
 * Target-agnostic defaults for the shared deploy conventions (R-DEPLOY-3):
 * health-gated activation, release retention, and the secret env-file policy.
 * These are DEFAULTS — overridable per target via the `activation` / `secrets`
 * blocks on `deploy.targets.*` (resolved into `ResolvedDeployBaseConfig`).
 */

/**
 * Default number of prior releases retained before pruning (NEEDS-USER U3,
 * reversible). The current release is always retained regardless of this value.
 */
export const DEFAULT_RELEASE_RETENTION = 3;

/**
 * Restricted POSIX file mode for generated secret env files: owner read/write
 * only, never world- or group-readable (NEEDS-USER U2; on Windows the store
 * applies an owner+SYSTEM-only ACL as the 0600-equivalent). Re-exported from
 * `kernel/domain/deploy/secrets-convention.ts` as the domain-facing name.
 */
export const RESTRICTED_SECRET_FILE_MODE = 0o600;

/** Default relative path of the generated restricted secret env file. */
export const DEFAULT_SECRET_ENV_FILE = '.env';

/** Default OTLP exporter protocol emitted by the OTEL convention. */
export const DEFAULT_OTLP_PROTOCOL = 'http/protobuf';

/** Default atomic activation strategy per platform family. */
export const DEFAULT_ACTIVATION_STRATEGY = {
  /** Linux uses a `current` symlink swapped between `releases/<id>/` dirs. */
  linux: 'symlink',
  /** Windows swaps the active release directory (junction / dir rename). */
  windows: 'dir-swap',
} as const;

/**
 * Default health-probe contract that gates a new release taking traffic
 * (NEEDS-USER U1, reversible): `GET /health`, expect `200`, 5 attempts,
 * 2s interval, 2s per-probe timeout.
 */
export const DEFAULT_HEALTH_GATE = {
  /** HTTP path probed for health. */
  path: '/health',
  /** HTTP status that signals healthy. */
  expectStatus: 200,
  /** Number of probe attempts before the gate fails. */
  retries: 5,
  /** Delay between probe attempts in milliseconds. */
  intervalMs: 2_000,
  /** Per-probe timeout in milliseconds. */
  timeoutMs: 2_000,
} as const;
