/** Combine caller cancellation with a transport-owned stop signal. */
export function combineSignals(first: AbortSignal, second?: AbortSignal): AbortSignal {
  if (second === undefined) {
    return first;
  }
  if (first.aborted) {
    return first;
  }
  if (second.aborted) {
    return second;
  }
  const controller = new AbortController();
  const abort = (event: Event): void => {
    const signal = event.target instanceof AbortSignal ? event.target : first;
    controller.abort(signal.reason);
  };
  first.addEventListener('abort', abort, { once: true });
  second.addEventListener('abort', abort, { once: true });
  return controller.signal;
}
