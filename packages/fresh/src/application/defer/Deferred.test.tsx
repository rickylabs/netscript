import type { VNode } from 'preact';
import { Suspense } from 'preact/compat';
import { Deferred } from './Deferred.tsx';
import { resolvedPromise, usePromise } from '../../runtime/interactive-hooks/use-promise.ts';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

interface VNodeLike {
  type: unknown;
  props: Record<string, unknown>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function assertVNode(value: unknown, message: string): asserts value is VNodeLike {
  assert(isRecord(value), message);
  assert('type' in value, message);
  assert('props' in value && isRecord(value.props), message);
}

Deno.test('Deferred wraps the promise reader in a Suspense boundary', () => {
  const fallback = <p>Loading</p>;
  const element = Deferred({
    promise: Promise.resolve('Ada'),
    fallback,
    children: (value) => <span>{value}</span>,
  });

  assertVNode(element, 'Expected Deferred to return a vnode');

  assert(
    (element.type as unknown) === Suspense,
    'Expected Deferred to use Preact Suspense as the outer boundary',
  );
  const elementProps = element.props as Record<string, unknown>;
  assert(
    elementProps.fallback === fallback,
    'Expected Deferred fallback to flow into Suspense',
  );

  const boundary = elementProps.children;
  assertVNode(boundary, 'Expected Deferred to render an inner error boundary');
});

Deno.test('Deferred normalizes JSX render-function children before passing them to the inner reader', () => {
  const vnode = (
    <Deferred promise={Promise.resolve('Ada')}>{(value) => <span>{value}</span>}</Deferred>
  );

  assertVNode(vnode, 'Expected Deferred JSX to produce a vnode');

  const rendered = (vnode.type as (props: Record<string, unknown>) => VNode)(vnode.props);
  assertVNode(
    rendered,
    'Expected Deferred component to return a vnode when invoked with JSX props',
  );

  assert(
    (rendered.type as unknown) === Suspense,
    'Expected Deferred JSX render to keep Suspense outermost',
  );

  const renderedProps = rendered.props as Record<string, unknown>;
  const boundary = renderedProps.children;
  assertVNode(boundary, 'Expected Deferred JSX render to include an inner boundary');

  const inner = boundary;
  assert(
    typeof inner.props.children === 'function',
    'Expected Deferred to normalize the JSX children into a render function',
  );
});

Deno.test('usePromise throws the pending promise and later returns the fulfilled value', async () => {
  let resolvePromise: ((value: number) => void) | undefined;
  const promise = new Promise<number>((resolve) => {
    resolvePromise = resolve;
  });

  let pending: unknown;
  try {
    usePromise(promise);
  } catch (error: unknown) {
    pending = error;
  }

  assert(pending === promise, 'Expected usePromise to throw the pending promise');

  resolvePromise?.(42);
  await promise;
  await Promise.resolve();

  assert(usePromise(promise) === 42, 'Expected usePromise to return the resolved value');
});

Deno.test('resolvedPromise lets usePromise return synchronously for fulfilled values', () => {
  const promise = resolvedPromise(['ready']);
  const value = usePromise(promise);

  assert(
    Array.isArray(value) && value[0] === 'ready',
    'Expected resolvedPromise to prime the cache',
  );
});

Deno.test('usePromise rethrows the settled rejection after the promise fails', async () => {
  const expected = new Error('boom');
  let rejectPromise: ((reason: unknown) => void) | undefined;
  const promise = new Promise<number>((_resolve, reject) => {
    rejectPromise = reject;
  });

  let pending: unknown;
  try {
    usePromise(promise);
  } catch (error: unknown) {
    pending = error;
  }

  assert(pending === promise, 'Expected usePromise to suspend while pending');

  rejectPromise?.(expected);
  await promise.catch(() => undefined);
  await Promise.resolve();

  let thrown: unknown;
  try {
    usePromise(promise);
  } catch (error: unknown) {
    thrown = error;
  }

  assert(thrown === expected, 'Expected usePromise to rethrow the rejection reason');
});
