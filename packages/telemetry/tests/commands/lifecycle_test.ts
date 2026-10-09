import { assert, assertEquals, assertThrows } from '@std/assert';
import { createOtelCommandTelemetryPort, type Tracer } from '../../commands.ts';
import { done, recording, start } from './native-fixture.ts';

Deno.test('command adapter bounds copies and validates configured registration pairs', async () => {
  await Promise.resolve();
  await recording(async (tracer) => {
    await Promise.resolve();
    for (
      const definitions of [
        [],
        Array.from({ length: 1025 }, (_, i) => ({ name: `command${i}`, definitionVersion: 1 })),
        [start, start],
        [{
          name: 'SECRET invalid',
          definitionVersion: 1,
        }],
        [{ name: 'a', definitionVersion: Number.MAX_SAFE_INTEGER + 1 }],
      ]
    ) {
      assertThrows(() => createOtelCommandTelemetryPort({ definitions, tracer }), TypeError);
    }
    const maximum = Array.from(
      { length: 1024 },
      (_, i) => ({ name: `command${i}`, definitionVersion: 1 }),
    );
    createOtelCommandTelemetryPort({ definitions: maximum, tracer });
  });
});

Deno.test('command adapter isolates malformed observations and throwing start finish end observers', async () => {
  await Promise.resolve();
  await recording(async (native, exporter) => {
    await Promise.resolve();
    for (const phase of ['startSpan', 'setAttributes', 'setStatus', 'end'] as const) {
      let ends = 0;
      let calls = 0;
      const tracer: Tracer = new Proxy(native, {
        get(target, property) {
          if (property !== 'startSpan') return Reflect.get(target, property);
          return (...args: Parameters<Tracer['startSpan']>) => {
            if (phase === 'startSpan') throw new Error('SECRET observer');
            const span = target.startSpan(...args);
            return new Proxy(span, {
              get(target, property) {
                if (property === 'end') {
                  return () => {
                    ends++;
                    target.end();
                    if (phase === 'end') throw new Error('SECRET end');
                  };
                }
                if (property === phase) {
                  return () => {
                    throw new Error('SECRET observer');
                  };
                }
                const value = Reflect.get(target, property);
                return typeof value === 'function' ? value.bind(target) : value;
              },
            });
          };
        },
      });
      const port = createOtelCommandTelemetryPort({ definitions: [start], tracer });
      const value = {};
      assert(
        await port.trace(start, async (span) => {
          await Promise.resolve();
          calls++;
          span.finish(done);
          span.finish(done);
          return value;
        }).catch(() => {
          assert(false, 'observer replaced success');
        }) === value,
      );
      const error = new Error('SECRET original');
      try {
        await port.trace(start, async () => {
          await Promise.resolve();
          calls++;
          throw error;
        });
      } catch (caught) {
        assert(caught === error);
      }
      assertEquals(calls, 2);
      assertEquals(ends, phase === 'startSpan' ? 0 : 2);
    }
    const port = createOtelCommandTelemetryPort({ definitions: [start], tracer: native });
    const hostile = { ...start };
    Object.defineProperty(hostile, 'idempotency', {
      get() {
        throw new Error('SECRET getter');
      },
    });
    assertEquals(await port.trace(hostile, () => Promise.resolve('unchanged')), 'unchanged');
    let calls = 0;
    assertEquals(
      await port.trace({ ...start, name: 'unregistered' }, async () => {
        await Promise.resolve();
        calls++;
        return 1;
      }),
      1,
    );
    assertEquals(
      await port.trace(start, async (span) => {
        await Promise.resolve();
        calls++;
        const malformed = Object.assign({}, done, { payload: 'SECRET' });
        Reflect.set(malformed, 'errorType', 'SECRET');
        span.finish(malformed);
        span.finish(done);
        return 2;
      }),
      2,
    );
    assertEquals(calls, 2);
    const spans = exporter.getFinishedSpans();
    assertEquals(spans.at(-1)!.attributes['netscript.command.outcome'], 'applied');
    assertEquals(
      JSON.stringify(
        spans.map((s) => ({ attributes: s.attributes, events: s.events, status: s.status })),
      ).includes('SECRET'),
      false,
    );
  });
});
