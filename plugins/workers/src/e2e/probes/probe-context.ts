/** Resolve the workers API base URL for E2E probes. */
export function resolveWorkersProbeUrl(): string {
  return Deno.env.get('WORKERS_API_URL') ?? 'http://localhost:8091';
}
