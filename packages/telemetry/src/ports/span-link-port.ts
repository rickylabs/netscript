/**
 * Span-link port for {@linkcode @netscript/telemetry}.
 *
 * A span-link adapter builds {@linkcode Link} records whose attribute-carrying
 * behavior matches what the underlying provider preserves at export time. The
 * Deno-native provider drops per-link attributes, so its adapter reports that
 * via {@linkcode SpanLinkPort.supportsLinkAttributes} and elides them; the SDK
 * provider preserves them.
 *
 * @module
 */

import type { Attributes, Link, SpanContext } from '../domain/types.ts';

/**
 * Port a span-link adapter implements.
 *
 * The contract centralizes the one behavior that actually differs between
 * providers — whether a link keeps its attributes — so higher layers (for
 * example fan-in link composition) can build links without branching on the
 * active provider.
 */
export interface SpanLinkPort {
  /**
   * Whether links produced by this adapter retain their attributes at export
   * time.
   */
  readonly supportsLinkAttributes: boolean;
  /**
   * Build a link to `context`.
   *
   * When {@linkcode SpanLinkPort.supportsLinkAttributes} is `false` the adapter
   * omits `attributes` and records how many were dropped in
   * `droppedAttributesCount`, so the returned {@linkcode Link} truthfully
   * reflects what the provider will export.
   */
  createLink(context: SpanContext, attributes?: Attributes): Link;
}
