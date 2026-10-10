/** Client-address resolution with explicit trusted-proxy policy. @module */
import { isIP } from 'node:net';
import type { ServiceEnvironment } from '../../types.ts';
import type { ServiceProxyTrust } from './options.ts';

/**
 * Resolves a client address from socket metadata, ignoring XFF unless opted in.
 * Starting at the socket peer, walk XFF right to left while each hop is trusted.
 * Invalid chains (over 8192 characters or 32 hops, or non-IP tokens) fall back
 * to the socket. Missing socket metadata never permits forwarded-header trust.
 *
 * @param request - Request carrying optional X-Forwarded-For.
 * @param env - Socket metadata supplied by the listener or mounting host.
 * @param trustProxy - Explicit trusted-address predicate; defaults off as in auth transport policy.
 * @returns Client IP, socket hostname, or undefined when the host supplies no network peer.
 * @example
 * ```ts
 * import { resolveServiceClientAddress } from '@netscript/service/rate-limit';
 * const request = new Request('http://service.test', {
 *   headers: { 'x-forwarded-for': '192.0.2.1' },
 * });
 * const client = resolveServiceClientAddress(request, {
 *   remoteAddr: { transport: 'tcp', hostname: '127.0.0.1', port: 1234 },
 * }, (address) => address === '127.0.0.1');
 * console.log(client); // 192.0.2.1
 * ```
 */
export function resolveServiceClientAddress(
  request: Request,
  env?: ServiceEnvironment,
  trustProxy: ServiceProxyTrust = false,
): string | undefined {
  const remoteAddr = env?.remoteAddr;
  if (!remoteAddr || !('hostname' in remoteAddr)) return undefined;
  const socket = remoteAddr.hostname;
  if (!trustProxy || !trustProxy(socket)) return socket;
  const forwarded = request.headers.get('x-forwarded-for');
  if (!forwarded || forwarded.length > 8192) return socket;
  const hops = forwarded.split(',');
  if (hops.length > 32) return socket;
  const addresses = hops.map((hop) => hop.trim());
  if (addresses.some((address) => !isIP(address))) return socket;
  let client = socket;
  for (let i = addresses.length - 1; i >= 0; i--) {
    if (i < addresses.length - 1 && !trustProxy(client)) break;
    client = addresses[i]!;
  }
  return client;
}
