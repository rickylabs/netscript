import { type Context, context } from '@opentelemetry/api';
import { extractContext, injectContext } from './w3c.ts';
import type { PropagationHeaders } from './types.ts';

export function createMessageHeaders(
  additionalHeaders: PropagationHeaders = {},
): PropagationHeaders {
  return injectContext({ ...additionalHeaders });
}

export function resolveParentContextFromHeaders(headers?: PropagationHeaders): Context {
  if (!headers) {
    return context.active();
  }

  const normalizedHeaders: PropagationHeaders = {};
  for (const [key, value] of Object.entries(headers)) {
    let normalizedValue = value;
    const lowerKey = key.toLowerCase();
    if (value.includes(',') && (lowerKey === 'traceparent' || lowerKey === 'tracestate')) {
      normalizedValue = (value.split(',')[0] ?? '').trim();
    }
    normalizedHeaders[lowerKey] = normalizedValue;
  }

  return extractContext(normalizedHeaders);
}
