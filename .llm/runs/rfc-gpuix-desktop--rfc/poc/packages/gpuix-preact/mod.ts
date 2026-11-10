/**
 * Preact renderer for GPUIX (Zed's GPUI through Node-API).
 *
 * `preact/compat` cannot drive `@gpuix/react`: React's reconciler reads React's
 * private shared internals at module load. This package is a native Preact
 * host instead: a small DOM facade that Preact diffs against, translated into
 * GPUIX's batched mutation protocol (`@gpuix/native/host`), the same seam the
 * upstream Solid adapter uses.
 *
 * @example
 * ```tsx
 * import { render } from 'gpuix-preact';
 * render(<App />, { title: 'NetScript', width: 1280, height: 800 });
 * ```
 *
 * @module
 */
export { createRoot, gpuixDocument, render, useGpuix, useWindowSize } from './src/root.ts';
export type { GpuixApp, GpuixContextValue, GpuixPreactRoot, RenderOptions, RootOptions } from './src/root.ts';
export { GDocument, GElement, GText } from './src/dom.ts';
