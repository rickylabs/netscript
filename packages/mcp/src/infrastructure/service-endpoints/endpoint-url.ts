/** Normalize a discovered HTTP(S) URL under the endpoint-directory network policy. */
export function normalizeDiscoveredEndpointUrl(
  value: unknown,
  operatorTrusted: boolean,
): string | undefined {
  if (typeof value !== 'string') return undefined;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return undefined;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return undefined;
  if (!operatorTrusted) {
    if (url.hostname === 'localhost') url.hostname = '127.0.0.1';
    if (!isNumericLoopback(url.hostname)) return undefined;
  }
  url.pathname = url.pathname.replace(/\/$/, '');
  url.search = '';
  url.hash = '';
  return url.href.replace(/\/$/, '');
}

function isNumericLoopback(hostname: string): boolean {
  if (hostname === '[::1]' || hostname === '::1') return true;
  const octets = hostname.split('.');
  if (octets.length !== 4 || octets[0] !== '127') return false;
  return octets.every((octet) => {
    if (!/^\d{1,3}$/.test(octet)) return false;
    const value = Number(octet);
    return value >= 0 && value <= 255;
  });
}
