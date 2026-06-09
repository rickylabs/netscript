import { resolveWorkersProbeUrl } from './probe-context.ts';

const baseUrl = resolveWorkersProbeUrl();
const response = await fetch(`${baseUrl}/health`, {
  signal: AbortSignal.timeout(5_000),
});

if (!response.ok) {
  throw new Error(`Workers health probe failed with ${response.status} ${response.statusText}`);
}
