type PromiseState<T> =
  | { status: 'pending'; promise: Promise<T> }
  | { status: 'fulfilled'; value: T }
  | { status: 'rejected'; reason: unknown };

const promiseStateCache = new WeakMap<Promise<unknown>, PromiseState<unknown>>();

/** Read a promise using the Suspense throw-promise protocol. */
export function usePromise<T>(promise: Promise<T>): T {
  let state = promiseStateCache.get(promise) as PromiseState<T> | undefined;

  if (!state) {
    state = { status: 'pending', promise };
    promiseStateCache.set(promise, state);

    promise.then(
      (value) => {
        promiseStateCache.set(promise, { status: 'fulfilled', value });
      },
      (reason: unknown) => {
        promiseStateCache.set(promise, { status: 'rejected', reason });
      },
    );
  }

  if (state.status === 'fulfilled') {
    return state.value;
  }

  if (state.status === 'rejected') {
    throw state.reason;
  }

  throw state.promise;
}

/** Create a promise already primed as fulfilled for `usePromise()`. */
export function resolvedPromise<T>(value: T): Promise<T> {
  const promise = Promise.resolve(value);
  promiseStateCache.set(promise, { status: 'fulfilled', value });
  return promise;
}
