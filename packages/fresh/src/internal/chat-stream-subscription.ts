import { stream } from '@durable-streams/client';

/** Reads native chat chunks while keeping Deno's fetch abort link alive. */
export async function* subscribeChatStream(input: {
  readonly url: string;
  readonly headers: Record<string, string>;
  readonly offset?: string;
  readonly signal?: AbortSignal;
  readonly onOffset: (offset: string) => void;
}): AsyncIterable<unknown> {
  // One response per physical subscription, replaced on reconnect, never a history.
  // Remove after denoland/deno#37006 is fixed and the forced-GC regression passes.
  let liveResponse: Response | undefined;
  const response = await stream({
    url: input.url,
    headers: input.headers,
    offset: input.offset,
    signal: input.signal,
    live: 'sse',
    json: true,
    fetch: async (url, init) => {
      liveResponse = await fetch(url, init);
      return liveResponse;
    },
  });
  try {
    for await (const chunk of response.jsonStream()) {
      input.onOffset(response.offset);
      if (input.signal?.aborted) break;
      yield chunk;
    }
  } finally {
    input.onOffset(response.offset);
    response.cancel();
    // Read the retained object during teardown so it stays reachable through abort.
    if (liveResponse?.body && !liveResponse.body.locked) {
      await liveResponse.body.cancel().catch(() => {});
    }
    liveResponse = undefined;
  }
}
