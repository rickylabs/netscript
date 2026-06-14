import { assertEquals } from '@std/assert';
import type { Attributes, Span, SpanContext, SpanStatus } from '@netscript/telemetry/tracer';
import { emitFreshError, withFreshSpan } from './telemetry.ts';

class MemorySpan implements Span {
  readonly attributes: Attributes[] = [];
  readonly events: Array<{ name: string; attributes?: Attributes }> = [];
  readonly exceptions: unknown[] = [];

  spanContext(): SpanContext {
    return {
      traceId: '0'.repeat(32),
      spanId: '0'.repeat(16),
      traceFlags: 0,
    };
  }

  setAttribute(
    key: string,
    value: string | number | boolean | string[] | number[] | boolean[],
  ): this {
    this.attributes.push({ [key]: value });
    return this;
  }

  setAttributes(attributes: Attributes): this {
    this.attributes.push(attributes);
    return this;
  }

  addEvent(name: string, attributes?: Attributes): this {
    this.events.push({ name, attributes });
    return this;
  }

  addLink(): this {
    return this;
  }

  addLinks(): this {
    return this;
  }

  setStatus(_status: SpanStatus): this {
    return this;
  }

  updateName(): this {
    return this;
  }

  isRecording(): boolean {
    return true;
  }

  recordException(exception: unknown): void {
    this.exceptions.push(exception);
  }

  end(): void {}
}

Deno.test('withFreshSpan returns callback result', async () => {
  const result = await withFreshSpan(
    {
      scope: 'test',
      name: 'test.operation',
      operation: 'test.operation',
    },
    () => 42,
  );

  assertEquals(result, 42);
});

Deno.test('emitFreshError records normalized error attributes', () => {
  const span = new MemorySpan();

  emitFreshError(span, new TypeError('bad'), {
    'netscript.operation': 'test.operation',
  });

  assertEquals(span.exceptions.length, 1);
  assertEquals(span.attributes.at(-1)?.['error.type'], 'TypeError');
  assertEquals(span.attributes.at(-1)?.['error.message'], 'bad');
  assertEquals(span.events.at(-1)?.name, 'error');
});
