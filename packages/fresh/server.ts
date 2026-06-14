/**
 * Server-only utilities for Fresh
 *
 * This module exports utilities that depend on server-side packages like @netscript/kv.
 * Import from '@netscript/fresh/server' instead of '@netscript/fresh' for these utilities.
 *
 * @module
 */

export type { App, FreshConfig, Middleware } from 'fresh';
export { defineFreshApp, type DefineFreshAppOptions } from './server/define-fresh-app.ts';

// Streaming SSR
export {
  createStreamingResponse,
  renderToStream,
  type StreamingRenderable,
  type StreamingRenderer,
  type StreamingRenderStream,
  type StreamRenderOptions,
  type StreamRenderResult,
} from './server/stream.ts';

// Streaming error boundary
export {
  type StreamBoundaryRenderable,
  StreamErrorBoundary,
  type StreamErrorBoundaryProps,
} from './server/stream-error-boundary.tsx';
