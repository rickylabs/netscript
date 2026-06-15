/**
 * Error boundary component for streaming SSR.
 *
 * Catches errors inside Suspense boundaries during streaming renders and
 * renders fallback content instead of crashing the entire stream.
 *
 * @module
 */

import { Component } from 'preact/compat';
import type { ComponentChildren } from 'preact';

/** Renderable content accepted by streaming error boundaries. */
export type StreamBoundaryRenderable =
  | object
  | string
  | number
  | bigint
  | boolean
  | null
  | undefined
  | readonly StreamBoundaryRenderable[];

/** Props for {@link StreamErrorBoundary}. */
export interface StreamErrorBoundaryProps {
  /** Fallback UI rendered when a child boundary errors. */
  fallback?: StreamBoundaryRenderable | ((error: Error) => StreamBoundaryRenderable);
  /** Optional callback invoked when an error is caught. */
  onError?: (error: Error) => void;
  /** Content protected by the boundary. */
  children: StreamBoundaryRenderable;
}

interface StreamErrorBoundaryState {
  error: Error | null;
}

/**
 * Preact class component that catches rendering errors within its subtree.
 *
 * Use this around `<Deferred>` or `<Suspense>` boundaries in streaming
 * pages so that a single failing data source does not tear down the
 * whole response.
 *
 * @example
 * ```tsx
 * <StreamErrorBoundary fallback={<p>Section unavailable.</p>}>
 *   <Deferred promise={expensiveQuery}>
 *     {(data) => <DataTable rows={data.rows} />}
 *   </Deferred>
 * </StreamErrorBoundary>
 * ```
 */
export function StreamErrorBoundary(props: StreamErrorBoundaryProps): object {
  return <StreamErrorBoundaryComponent {...props} />;
}

class StreamErrorBoundaryComponent extends Component<
  StreamErrorBoundaryProps,
  StreamErrorBoundaryState
> {
  override state: StreamErrorBoundaryState = { error: null };

  static override getDerivedStateFromError(
    error: unknown,
  ): StreamErrorBoundaryState {
    return {
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }

  override componentDidCatch(error: Error): void {
    this.props.onError?.(error);
  }

  override render(): ComponentChildren {
    if (this.state.error) {
      if (typeof this.props.fallback === 'function') {
        return this.props.fallback(this.state.error);
      }

      return this.props.fallback ?? (
        <div class='ns-stream-error' role='alert'>
          <p>This section failed to load.</p>
        </div>
      );
    }

    return this.props.children;
  }
}
