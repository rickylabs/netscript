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

/**
 * Canonicalizes an address bucket, grouping IPv6 interface addresses by prefix.
 * URL supplies upstream IPv6 parsing/serialization, including IPv4-mapped forms.
 * This changes quota keys only; socket metadata and proxy trust use the original peer.
 * @param address - Resolved client address.
 * @param prefix - Validated IPv6 prefix length.
 * @returns Prefix bucket for IPv6, or the unchanged non-IPv6 address.
 */
export function rateLimitAddressKey(address: string, prefix: number): string {
  if (isIP(address) !== 6) return address;
  const [ip, zone] = address.split('%');
  const canonical = new URL(`http://[${ip}]/`).hostname.slice(1, -1);
  const [head = '', tail] = canonical.split('::');
  const left = head ? head.split(':') : [];
  const right = tail === undefined ? undefined : tail ? tail.split(':') : [];
  const words = right
    ? [...left, ...Array<string>(8 - left.length - right.length).fill('0'), ...right]
    : left;
  const network = words.map((word, index) => {
    const bits = Math.max(0, Math.min(16, prefix - index * 16));
    return (parseInt(word, 16) & (0xffff << (16 - bits))).toString(16);
  });
  return `${network.join(':')}${zone ? `%${zone}` : ''}/${prefix}`;
}
