import { resolveProbeUrl } from '@netscript/plugin';

/** Resolve the workers API base URL for E2E probes. */
export function resolveWorkersProbeUrl(): string {
  return resolveProbeUrl(['WORKERS_API_URL'], 'http://localhost:8091', {
    stripTrailingSlash: false,
  });
}
