/**
 * @module kernel/domain/deploy/secrets-convention
 *
 * Target-agnostic **secrets convention** for the deploy core (R-DEPLOY-3).
 *
 * Every deploy target's `secrets` operation reconciles secret material the same
 * way: render a restricted-permission env file (`KEY=VALUE`, owner-read/write
 * only — never world- or group-readable) and hand it to a per-target
 * {@link SecretsStorePort} binding. The render + reconcile policy lives here
 * once; a target supplies only the store binding (env file on bare-metal,
 * `deno deploy env` on Deno Deploy, Aspire `Parameters__*` on compose).
 *
 * This module is **pure** (hexagonal kernel-domain, A11/F-CLI-16): no `Deno.*`
 * I/O and no `public/**` import. Side effects flow through the injected
 * {@link SecretsStorePort}.
 */

import { RESTRICTED_SECRET_FILE_MODE } from '../../constants/deploy.ts';

/**
 * Owner read/write-only POSIX mode for rendered secret files (0o600). Re-exported
 * from `kernel/constants/deploy.ts` as the domain-facing convention name so
 * adapters import the policy from the convention, not a constants module.
 */
export { RESTRICTED_SECRET_FILE_MODE };

/** A single secret exposed to the deployed service as an environment variable. */
export interface SecretRef {
  /** Environment variable name the secret is bound to (e.g. `DATABASE_URL`). */
  readonly key: string;
  /** Secret value. Plaintext at reconcile time; never logged or echoed. */
  readonly value: string;
}

/** The full set of secrets to reconcile for one deploy target. */
export interface SecretsBundle {
  /** Target key the bundle belongs to (e.g. `linux-service`). */
  readonly target: string;
  /** Secrets to persist, in the order they should appear in the env file. */
  readonly secrets: readonly SecretRef[];
}

/** Request to reconcile a target's persisted secrets to match a bundle. */
export interface SecretsReconcileRequest {
  /** Desired secret state; the bundle is authoritative (declarative reconcile). */
  readonly bundle: SecretsBundle;
}

/** Outcome of a {@link reconcileSecrets} pass. */
export interface SecretsReconcileResult {
  /** Target key the reconcile ran for. */
  readonly target: string;
  /** Keys written to the store (the bundle's keys, in order). */
  readonly written: readonly string[];
  /** Keys present before the reconcile but absent from the bundle (removed). */
  readonly pruned: readonly string[];
  /** POSIX mode the store was asked to apply to the rendered material. */
  readonly mode: number;
}

/** A rendered restricted-permission secret env file. */
export interface RenderedSecretsEnvFile {
  /** `KEY=VALUE` env-file body with a trailing newline. */
  readonly content: string;
  /** POSIX mode the store must apply (0o600). */
  readonly mode: number;
}

/**
 * Whether an env-file value must be double-quoted to survive a dotenv-style
 * parse round-trip: empty values, and values carrying whitespace or any of the
 * shell/env metacharacters `" ' # $ \ = \``.
 */
function needsQuoting(value: string): boolean {
  return value === '' || /[\s"'#$\\=`]/.test(value);
}

/** Escape + conditionally quote a single env-file value. */
function escapeValue(value: string): string {
  if (!needsQuoting(value)) return value;
  const escaped = value
    .replaceAll('\\', '\\\\')
    .replaceAll('"', '\\"')
    .replaceAll('\r', '\\r')
    .replaceAll('\n', '\\n');
  return `"${escaped}"`;
}

/**
 * Pure renderer: turn a {@link SecretsBundle} into a restricted-permission env
 * file. Values are escaped/quoted so the file round-trips through a dotenv
 * parser; the returned `mode` is always {@link RESTRICTED_SECRET_FILE_MODE}.
 * Insertion order is preserved so the output is deterministic.
 */
export function renderSecretsEnvFile(bundle: SecretsBundle): RenderedSecretsEnvFile {
  const lines = bundle.secrets.map(({ key, value }) => `${key}=${escapeValue(value)}`);
  const content = lines.length > 0 ? `${lines.join('\n')}\n` : '';
  return { content, mode: RESTRICTED_SECRET_FILE_MODE };
}

/**
 * Persist a target's secret material to a restricted store. The store owns the
 * only side effect (writing + applying restricted permissions); the render and
 * reconcile policy stays in the core.
 */
export interface SecretsStorePort {
  /** Persist the rendered secret file, applying `rendered.mode` restrictions. */
  put(rendered: RenderedSecretsEnvFile, bundle: SecretsBundle): Promise<void>;
  /** List the secret keys currently persisted for the target. */
  list(): Promise<readonly string[]>;
  /** Remove all persisted secret material for the target (teardown path). */
  clear(): Promise<void>;
}

/**
 * Pure orchestrator every target's `secrets` op delegates to. Renders the bundle
 * once, overwrites the store's material with the desired state, and reports which
 * keys were written vs. pruned (keys the store held before but the bundle no
 * longer declares). The bundle is authoritative — reconcile is declarative.
 */
export async function reconcileSecrets(
  request: SecretsReconcileRequest,
  store: SecretsStorePort,
): Promise<SecretsReconcileResult> {
  const { bundle } = request;
  const existing = await store.list();
  const rendered = renderSecretsEnvFile(bundle);
  await store.put(rendered, bundle);

  const written = bundle.secrets.map((secret) => secret.key);
  const declared = new Set(written);
  const pruned = existing.filter((key) => !declared.has(key));

  return { target: bundle.target, written, pruned, mode: rendered.mode };
}
