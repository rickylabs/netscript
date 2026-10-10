import { fetch as expoFetch } from 'expo/fetch';
import type { StreamFetchV1 } from '@netscript/sdk/streams/consumer';

// RequestInit.body also admits ReadableStream; Expo FetchRequestInit.body does
// not. Stream consumption is GET, so forward only the fields actually used.
// FetchResponse satisfies the response subset consumed by the SDK, without a cast.
export const streamFetch: StreamFetchV1 = (url, init) =>
  expoFetch(url, { method: 'GET', headers: init.headers, signal: init.signal });
