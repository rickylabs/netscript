/**
 * Deferred promise rendering helpers.
 *
 * @module
 */

import type { ComponentChildren } from 'preact';
import { Suspense } from 'preact/compat';
import { usePromise } from '../hooks/use-promise.ts';

/** Renderable content accepted by deferred Suspense slots. */
export type DeferredRenderable =
  | object
  | string
  | number
  | bigint
  | boolean
  | null
  | undefined
  | readonly DeferredRenderable[];

/** Render function used to turn resolved deferred data into content. */
export type DeferredRenderFunction<T> = (data: T) => DeferredRenderable;

/** Props for the `Deferred` Suspense helper. */
export interface DeferredProps<T> {
  /** Promise whose resolved value is rendered by the child function. */
  promise: Promise<T>;
  /** Fallback content displayed while the promise is pending. */
  fallback?: DeferredRenderable;
  /** Render function, or the single child render function passed through JSX. */
  children: DeferredRenderable | DeferredRenderFunction<T>;
  /** Fallback renderer used when the promise rejects. */
  errorFallback?: (error: Error) => DeferredRenderable;
}

class DeferredRenderFunctionError extends TypeError {
  constructor() {
    super('Deferred requires a single render-function child.');
    this.name = 'DeferredRenderFunctionError';
  }
}

function resolveRenderChild<T>(children: DeferredProps<T>['children']): DeferredRenderFunction<T> {
  if (typeof children === 'function') {
    return children as DeferredRenderFunction<T>;
  }

  if (Array.isArray(children) && children.length === 1 && typeof children[0] === 'function') {
    return children[0] as DeferredRenderFunction<T>;
  }

  throw new DeferredRenderFunctionError();
}

function DeferredInner<T>(
  { promise, children, errorFallback }: DeferredProps<T>,
): DeferredRenderable {
  try {
    const data = usePromise(promise);
    return resolveRenderChild(children)(data);
  } catch (error) {
    if (error instanceof Promise) {
      throw error;
    }

    if (errorFallback) {
      return errorFallback(error instanceof Error ? error : new Error(String(error)));
    }

    return (
      <div class='ns-deferred-error'>
        <span>Section failed to load.</span>
      </div>
    );
  }
}

/**
 * Promise-prop consumer for RFC-style deferred data.
 *
 * In the current non-streaming Fresh runtime this behaves like a Suspense-ready
 * boundary and becomes fully progressive once streaming delivery lands.
 */
export function Deferred<T>(
  { promise, fallback, children, errorFallback }: DeferredProps<T>,
): DeferredRenderable {
  return (
    <Suspense fallback={(fallback ?? null) as ComponentChildren}>
      <DeferredInner promise={promise} errorFallback={errorFallback}>
        {children as ComponentChildren}
      </DeferredInner>
    </Suspense>
  );
}
