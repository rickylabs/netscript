import { type Context, context, type Span, trace } from '@opentelemetry/api';

export function withContext<T>(ctx: Context, fn: () => T): T {
  return context.with(ctx, fn);
}

export async function withContextAsync<T>(ctx: Context, fn: () => Promise<T>): Promise<T> {
  return await context.with(ctx, fn);
}

export function contextWithSpan(span: Span, parentContext?: Context): Context {
  return trace.setSpan(parentContext ?? context.active(), span);
}

export function getSpanFromContext(ctx: Context): Span | undefined {
  return trace.getSpan(ctx);
}

export function hasActiveSpan(ctx?: Context): boolean {
  return trace.getSpan(ctx ?? context.active()) !== undefined;
}

export function getTraceId(ctx?: Context): string | undefined {
  return trace.getSpan(ctx ?? context.active())?.spanContext().traceId;
}

export function getSpanId(ctx?: Context): string | undefined {
  return trace.getSpan(ctx ?? context.active())?.spanContext().spanId;
}
