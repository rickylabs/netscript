import { type Attributes, SpanKind } from '@netscript/telemetry/tracer';
import { emitFreshError, withFreshSpan } from '../../../internal/package-telemetry/telemetry.ts';

type FormTelemetryAttributeMap = Record<string, string | number | boolean | undefined>;

export async function withFormSpan<T>(
  spanName: string,
  phase: string,
  attributes: FormTelemetryAttributeMap,
  run: () => Promise<T>,
): Promise<T> {
  const filteredAttributes = toAttributes(attributes);

  return await withFreshSpan(
    {
      scope: 'form',
      name: `${spanName}.${phase}`,
      operation: `form.${phase}`,
      kind: SpanKind.INTERNAL,
      attributes: {
        ...filteredAttributes,
        'form.phase': phase,
      },
    },
    async () => await run(),
  );
}

export async function emitFormError(
  spanName: string,
  phase: string,
  attributes: FormTelemetryAttributeMap,
  error: unknown,
): Promise<void> {
  const filteredAttributes = toAttributes(attributes);

  await withFreshSpan(
    {
      scope: 'form',
      name: `${spanName}.${phase}.error`,
      operation: `form.${phase}.error`,
      kind: SpanKind.INTERNAL,
      attributes: {
        ...filteredAttributes,
        'form.phase': phase,
      },
    },
    (span) => {
      emitFreshError(span, error, {
        ...filteredAttributes,
        'form.phase': phase,
        'netscript.operation': `form.${phase}.error`,
      });
    },
  );
}

function toAttributes(
  attributes: FormTelemetryAttributeMap,
): Attributes {
  return Object.fromEntries(
    Object.entries(attributes).filter(([, value]) => value !== undefined),
  );
}
