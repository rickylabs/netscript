/** Resolve the workers API base URL for E2E probes. */
export function resolveWorkersProbeUrl(): string {
  const value = Deno.env.get('services__workers-api__https__0') ??
    Deno.env.get('services__workers-api__http__0') ??
    Deno.env.get('WORKERS_API_URL');
  if (value === undefined) {
    throw new Error(
      'Workers probe endpoint was not discovered. Configure an Aspire service reference or WORKERS_API_URL.',
    );
  }
  return value;
}
