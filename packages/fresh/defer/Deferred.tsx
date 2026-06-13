/**
 * Deferred promise rendering helpers.
 *
 * @module
 */

import type { ComponentChildren, JSX, VNode } from 'preact';
import { Suspense } from 'preact/compat';
import { usePromise } from '../interactive/use-promise.ts';

/** Props for the `Deferred` Suspense helper. */
export interface DeferredProps<T> {
  promise: Promise<T>;
  fallback?: JSX.Element;
  children: ComponentChildren | ((data: T) => JSX.Element);
  errorFallback?: (error: Error) => JSX.Element;
}

class DeferredRenderFunctionError extends TypeError {
  constructor() {
    super('Deferred requires a single render-function child.');
    this.name = 'DeferredRenderFunctionError';
  }
}

function resolveRenderChild<T>(children: DeferredProps<T>['children']): (data: T) => JSX.Element {
  if (typeof children === 'function') {
    return children as (data: T) => JSX.Element;
  }

  if (Array.isArray(children) && children.length === 1 && typeof children[0] === 'function') {
    return children[0] as (data: T) => JSX.Element;
  }

  throw new DeferredRenderFunctionError();
}

function DeferredInner<T>(
  { promise, children, errorFallback }: DeferredProps<T>,
): JSX.Element {
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
): VNode {
  return (
    <Suspense fallback={fallback ?? null}>
      <DeferredInner promise={promise} children={children} errorFallback={errorFallback} />
    </Suspense>
  );
}
