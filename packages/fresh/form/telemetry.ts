import { type Attributes, getTracer, SpanKind, withSpan } from '@netscript/telemetry/tracer';

const formTracer = getTracer('@netscript/fresh/form');

export async function withFormSpan<T>(
  spanName: string,
  phase: string,
  attributes: Record<string, string | number | boolean | undefined>,
  run: () => Promise<T>,
): Promise<T> {
  return await withSpan(formTracer, `${spanName}.${phase}`, async (span) => {
    for (const [key, value] of Object.entries(attributes)) {
      if (value !== undefined) {
        span.setAttribute(key, value);
      }
    }

    return await run();
  });
}

export async function emitFormError(
  spanName: string,
  phase: string,
  attributes: Record<string, string | number | boolean | undefined>,
  error: unknown,
): Promise<void> {
  const message = error instanceof Error ? error.message : String(error);
  const filteredAttributes = toAttributes(attributes);

  await withSpan(
    formTracer,
    `${spanName}.${phase}.error`,
    async (span) => {
      span.setAttributes({
        ...filteredAttributes,
        'form.phase': phase,
        'form.error.message': message,
      } as Attributes);
      span.recordException(error instanceof Error ? error : new Error(message));
      span.addEvent('form.error', {
        ...filteredAttributes,
        'form.phase': phase,
        'form.error.message': message,
      });
    },
    {
      kind: SpanKind.INTERNAL,
      attributes: {
        ...filteredAttributes,
        'form.phase': phase,
      },
    },
  );
}

function toAttributes(
  attributes: Record<string, string | number | boolean | undefined>,
): Attributes {
  return Object.fromEntries(
    Object.entries(attributes).filter(([, value]) => value !== undefined),
  );
}
