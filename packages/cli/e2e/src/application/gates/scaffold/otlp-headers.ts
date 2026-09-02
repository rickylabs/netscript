/**
 * Parses the W3C-style `OTEL_EXPORTER_OTLP_HEADERS` value (`key=value[,key=value]`) that the
 * Aspire AppHost hands each resource (carrying `x-otlp-api-key` when the dashboard runs with
 * anonymous access disabled) into request headers for an OTLP/HTTP export.
 */
export function parseOtlpHeaders(value: string | undefined): Record<string, string> {
  const headers: Record<string, string> = {};
  if (!value) return headers;
  for (const pair of value.split(',')) {
    const separator = pair.indexOf('=');
    if (separator <= 0) continue;
    const key = pair.slice(0, separator).trim();
    const raw = pair.slice(separator + 1).trim();
    if (!key) continue;
    let decoded = raw;
    try {
      decoded = decodeURIComponent(raw);
    } catch {
      // Not percent-encoded; keep the raw value.
    }
    headers[key] = decoded;
  }
  return headers;
}
