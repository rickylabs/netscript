import { createStreamCollectionV1 } from '@netscript/sdk/streams/collections';
import type { StreamCollectionBindingV1 } from '@netscript/sdk/streams/collections';
import type { StreamFetchV1 } from '@netscript/sdk/streams/consumer';

export interface Execution {
  readonly id: string;
  readonly status: string;
}

function parseExecution(value: unknown): Execution {
  if (
    !value || typeof value !== 'object' || !('id' in value) ||
    typeof value.id !== 'string' || !('status' in value) ||
    typeof value.status !== 'string'
  ) throw new TypeError('Invalid execution');
  return { id: value.id, status: value.status };
}

export function createCockpitStream(
  url: string,
  fetch: StreamFetchV1,
): StreamCollectionBindingV1<Execution> {
  return createStreamCollectionV1({
    url,
    fetch,
    type: 'execution',
    parse: parseExecution,
    getKey: (execution) => execution.id,
  });
}
