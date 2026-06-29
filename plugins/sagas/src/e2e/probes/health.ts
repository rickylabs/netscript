import { assertSuccessfulProbe, joinProbeUrl, summarizeResponse } from '@netscript/plugin';
import { resolveSagasHealthPath, resolveSagasProbeUrl } from './probe-context.ts';

const response = await fetch(joinProbeUrl(resolveSagasProbeUrl(), resolveSagasHealthPath()), {
  signal: AbortSignal.timeout(5_000),
});

assertSuccessfulProbe(await summarizeResponse(response), 'Sagas health');
