import type { Attributes, Link, SpanContext } from '../domain/types.ts';
import type { SpanLinkPort } from '../ports/span-link-port.ts';
import { parseTraceparent, parseTraceState } from '../context/w3c.ts';

/** Message-like input that can be represented as a fan-in span link. */
export type FanInLinkMessage = Readonly<{
  /** W3C traceparent header captured from the upstream message. */
  traceparent?: string;
  /** W3C tracestate header captured from the upstream message. */
  tracestate?: string;
  /** Per-message attributes attached to the resulting span link. */
  attributes?: Attributes;
}>;

/**
 * Build span links for upstream messages using the active provider's link port.
 *
 * Invalid or missing traceparent values are skipped. Attribute preservation is
 * delegated to {@linkcode SpanLinkPort}, so SDK-backed providers keep
 * per-message attributes while Deno-native providers report dropped attributes.
 */
export function createFanInLinks(
  messages: readonly FanInLinkMessage[],
  spanLinks: SpanLinkPort,
): Link[] {
  const links: Link[] = [];
  for (const message of messages) {
    if (!message.traceparent) {
      continue;
    }
    const parsed = parseTraceparent(message.traceparent);
    if (!parsed) {
      continue;
    }
    const traceState = parseTraceState(message.tracestate);
    const context: SpanContext = {
      traceId: parsed.traceId,
      spanId: parsed.parentId,
      traceFlags: parsed.traceFlags,
      isRemote: true,
      ...(traceState ? { traceState } : {}),
    };
    links.push(spanLinks.createLink(context, message.attributes));
  }
  return links;
}
