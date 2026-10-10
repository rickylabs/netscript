/**
 * Installation secret and per-service internal credential primitives.
 *
 * This subpath depends only on Web Crypto and `Deno.open`, so service clients can derive the
 * credential a service accepts without importing the service's authentication middleware. Carriers
 * deliver the secret as a file reference in `NETSCRIPT_INSTALLATION_SECRET_FILE`, never as a value.
 * Services verify the credential with `createInternalCredentialAuthenticator` from
 * `@netscript/service/auth`; callers send it with the SDK's
 * `createInternalCredentialSdkClientContribution`.
 *
 * @example
 * ```ts
 * import {
 *   deriveInternalCredential,
 *   loadInstallationSecret,
 * } from '@netscript/service/internal-credential';
 *
 * const secret = await loadInstallationSecret();
 * const bearer = await deriveInternalCredential(secret, 'orders');
 * await fetch('http://localhost:8080/api/rpc/internal/sync', {
 *   method: 'POST',
 *   headers: { authorization: `Bearer ${bearer}` },
 * });
 * ```
 *
 * @module
 */

export {
  createInstallationSecret,
  INSTALLATION_SECRET_FILE_ENV,
  type InstallationSecret,
  loadInstallationSecret,
  type LoadInstallationSecretOptions,
} from './installation-secret.ts';
export { deriveInternalCredential } from './internal-credential.ts';
