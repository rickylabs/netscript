/** Subscription readiness and startup failure propagation for watch adapters. */

/**
 * Attach a readiness promise to a lazy watch generator.
 *
 * A backend calls `ready` only after its acknowledgement. Startup errors reach
 * both waiters and iteration; early cancellation rejects readiness. Attaching
 * a rejection observer also makes consumers that only iterate safe.
 */
export function createWatchHandle<T>(
  start: (ready: () => void) => AsyncIterable<T>,
): AsyncGenerator<T> & { readonly ready: Promise<void> } {
  const readiness = Promise.withResolvers<void>();
  let acknowledged = false;
  let started = false;
  const ready = (): void => {
    acknowledged = true;
    readiness.resolve();
  };
  const iterator = (async function* () {
    started = true;
    try {
      yield* start(ready);
    } catch (error) {
      readiness.reject(error);
      throw error;
    } finally {
      if (!acknowledged) {
        readiness.reject(
          new DOMException('Watch ended before subscription readiness', 'AbortError'),
        );
      }
    }
  })();
  const finish = iterator.return.bind(iterator);
  iterator.return = (value) => {
    // Returning an unstarted generator never enters its finally block.
    if (!started) {
      readiness.reject(new DOMException('Watch ended before subscription readiness', 'AbortError'));
    }
    return finish(value);
  };
  void readiness.promise.catch(() => {});
  return Object.defineProperty(iterator, 'ready', { value: readiness.promise }) as
    & AsyncGenerator<T>
    & { readonly ready: Promise<void> };
}
