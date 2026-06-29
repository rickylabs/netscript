import { assertSuccessfulProbe, joinProbeUrl, summarizeResponse } from '@netscript/plugin';
import {
  createSagasRoundtripPayload,
  resolveSagasProbeUrl,
  resolveSagasRoundtripPath,
} from './probe-context.ts';

const response = await fetch(joinProbeUrl(resolveSagasProbeUrl(), resolveSagasRoundtripPath()), {
  body: JSON.stringify(createSagasRoundtripPayload()),
  headers: {
    'content-type': 'application/json',
  },
  method: 'POST',
  signal: AbortSignal.timeout(10_000),
});

assertSuccessfulProbe(await summarizeResponse(response), 'Sagas roundtrip publish');
