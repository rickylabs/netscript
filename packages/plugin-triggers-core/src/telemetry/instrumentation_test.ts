import { assertEquals } from '@std/assert';
import {
  DeprecatedTriggerAttributes,
  TriggerAttributes,
  TriggerSpanNames,
  TriggerTelemetryOutcomes,
} from './mod.ts';
import { createTriggerInstrumentation } from './instrumentation.ts';
import type {
  TriggerTelemetryAttributes,
  TriggerTelemetrySpan,
  TriggerTelemetrySpanKind,
  TriggerTelemetryStatus,
  TriggerTelemetryTracer,
} from './instrumentation.ts';

interface RecordedSpan {
  name: string;
  kind: TriggerTelemetrySpanKind;
  attributes: Record<string, unknown>;
  status?: { status: TriggerTelemetryStatus; description?: string };
  exceptions: unknown[];
  ended: boolean;
}

function createRecordingTracer(): {
  tracer: TriggerTelemetryTracer;
  spans: RecordedSpan[];
} {
  const spans: RecordedSpan[] = [];
  const tracer: TriggerTelemetryTracer = {
    startSpan(name, options) {
      const record: RecordedSpan = {
        name,
        kind: options.kind,
        attributes: { ...(options.attributes ?? {}) },
        exceptions: [],
        ended: false,
      };
      spans.push(record);
      const span: TriggerTelemetrySpan = {
        setAttribute(key, value) {
          record.attributes[key] = value;
        },
        addEvent(_name: string, _attributes?: TriggerTelemetryAttributes) {},
        setStatus(status, description) {
          record.status = { status, description };
        },
        recordException(error) {
          record.exceptions.push(error);
        },
        end() {
          record.ended = true;
        },
      };
      return span;
    },
  };
  return { tracer, spans };
}

Deno.test('ingress span carries netscript.* attributes and SERVER kind (TC-5/TC-6)', () => {
  const { tracer, spans } = createRecordingTracer();
  const instrumentation = createTriggerInstrumentation({ tracer });

  instrumentation.startIngressSpan({ triggerId: 'wh-1', eventId: 'evt-1', kind: 'webhook' });

  assertEquals(spans.length, 1);
  const span = spans[0]!;
  assertEquals(span.name, TriggerSpanNames.INGRESS);
  assertEquals(span.kind, 'server');
  assertEquals(span.attributes[TriggerAttributes.TRIGGER_ID], 'wh-1');
  assertEquals(span.attributes['netscript.trigger.id'], 'wh-1');
  assertEquals(span.attributes[TriggerAttributes.TRIGGER_EVENT_ID], 'evt-1');
  assertEquals(span.attributes[TriggerAttributes.TRIGGER_KIND], 'webhook');
});

Deno.test('deprecated bare aliases are emitted during the window (TC-6 alias)', () => {
  const { tracer, spans } = createRecordingTracer();
  const instrumentation = createTriggerInstrumentation({ tracer });

  instrumentation.startProcessSpan({ triggerId: 'wh-1', eventId: 'evt-1', kind: 'webhook' });

  const span = spans[0]!;
  // Every canonical key that has an alias must mirror its value to the old key.
  for (const [canonical, deprecated] of Object.entries(DeprecatedTriggerAttributes)) {
    if (span.attributes[canonical] !== undefined) {
      assertEquals(span.attributes[deprecated], span.attributes[canonical]);
    }
  }
  assertEquals(span.attributes['trigger.id'], 'wh-1');
  assertEquals(span.attributes['trigger.event.id'], 'evt-1');
});

Deno.test('finishSpan sets outcome + error_class under canonical and alias keys (TC-7/TC-8)', () => {
  const { tracer, spans } = createRecordingTracer();
  const instrumentation = createTriggerInstrumentation({ tracer });

  const ok = instrumentation.startProcessSpan({ triggerId: 'wh-1', kind: 'webhook' });
  instrumentation.finishSpan(ok, TriggerTelemetryOutcomes.SUCCESS);
  assertEquals(spans[0]!.status?.status, 'ok');
  assertEquals(spans[0]!.attributes[TriggerAttributes.OUTCOME], 'success');
  assertEquals(spans[0]!.attributes['outcome'], 'success');
  assertEquals(spans[0]!.ended, true);

  const failing = instrumentation.startProcessSpan({ triggerId: 'wh-1', kind: 'webhook' });
  instrumentation.finishSpan(failing, TriggerTelemetryOutcomes.ERROR, new TypeError('boom'));
  const errSpan = spans[1]!;
  assertEquals(errSpan.status?.status, 'error');
  assertEquals(errSpan.attributes[TriggerAttributes.ERROR_CLASS], 'TypeError');
  assertEquals(errSpan.attributes['error_class'], 'TypeError');
  assertEquals(errSpan.exceptions.length, 1);
});

Deno.test('ingress metric records outcome under canonical + alias keys (TC-11)', () => {
  const adds: Array<{ value: number; attributes?: TriggerTelemetryAttributes }> = [];
  const instrumentation = createTriggerInstrumentation({
    meter: {
      ingressTotal: {
        add(value, attributes) {
          adds.push({ value, attributes });
        },
      },
    },
  });

  instrumentation.recordIngress({
    triggerId: 'wh-1',
    kind: 'webhook',
    outcome: TriggerTelemetryOutcomes.ACCEPTED,
  });

  assertEquals(adds.length, 1);
  assertEquals(adds[0]!.attributes?.[TriggerAttributes.OUTCOME], 'accepted');
  assertEquals(adds[0]!.attributes?.['outcome'], 'accepted');
  assertEquals(adds[0]!.attributes?.[TriggerAttributes.TRIGGER_ID], 'wh-1');
});

Deno.test('every canonical trigger attribute is netscript.* namespaced (TC-6)', () => {
  for (const value of Object.values(TriggerAttributes)) {
    const isStandardSemconv = value === TriggerAttributes.HTTP_STATUS_CODE;
    if (!isStandardSemconv) {
      assertEquals(
        value.startsWith('netscript.trigger.'),
        true,
        `expected ${value} to be netscript.trigger.* namespaced`,
      );
    }
  }
});
