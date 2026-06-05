import { resolveStreamsProbeUrl } from './probe-context.ts';

const baseUrl = resolveStreamsProbeUrl();
const response = await fetch(`${baseUrl}/health`, {
  signal: AbortSignal.timeout(5_000),
});

if (!response.ok) {
  throw new Error(`Streams health probe failed with ${response.status} ${response.statusText}`);
}
