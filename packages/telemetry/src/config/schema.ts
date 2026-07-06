import type { StandardSchemaV1 } from '@standard-schema/spec';
import type { TelemetryConfig } from './constants.ts';

type Issue = StandardSchemaV1.Issue;

function readBoolean(source: object, key: string, issues: Issue[]): boolean {
  const raw = Reflect.get(source, key);
  if (typeof raw !== 'boolean') {
    issues.push({ message: `${key} must be a boolean`, path: [key] });
    return false;
  }
  return raw;
}

function readNonEmptyString(source: object, key: string, issues: Issue[]): string {
  const raw = Reflect.get(source, key);
  if (typeof raw !== 'string' || raw.length === 0) {
    issues.push({ message: `${key} must be a non-empty string`, path: [key] });
    return '';
  }
  return raw;
}

function readOptionalUrl(source: object, key: string, issues: Issue[]): string | undefined {
  const raw = Reflect.get(source, key);
  if (raw === undefined) {
    return undefined;
  }
  if (typeof raw !== 'string' || !URL.canParse(raw)) {
    issues.push({
      message: `${key} must be a valid URL when set; received ${JSON.stringify(raw)}`,
      path: [key],
    });
    return undefined;
  }
  return raw;
}

function readStringRecord(source: object, key: string, issues: Issue[]): Record<string, string> {
  const raw = Reflect.get(source, key);
  if (typeof raw !== 'object' || raw === null) {
    issues.push({ message: `${key} must be an object`, path: [key] });
    return {};
  }
  const record: Record<string, string> = {};
  for (const [entryKey, entryValue] of Object.entries(raw)) {
    if (typeof entryValue === 'string') {
      record[entryKey] = entryValue;
    }
  }
  return record;
}

function validateTelemetryConfigValue(
  value: unknown,
): StandardSchemaV1.Result<TelemetryConfig> {
  if (typeof value !== 'object' || value === null) {
    return { issues: [{ message: 'telemetry configuration must be an object' }] };
  }

  const issues: Issue[] = [];
  const parsed: TelemetryConfig = {
    enabled: readBoolean(value, 'enabled', issues),
    endpoint: readOptionalUrl(value, 'endpoint', issues),
    protocol: readNonEmptyString(value, 'protocol', issues),
    semconvStabilityOptIn: readNonEmptyString(value, 'semconvStabilityOptIn', issues),
    serviceName: readNonEmptyString(value, 'serviceName', issues),
    serviceVersion: readNonEmptyString(value, 'serviceVersion', issues),
    resourceAttributes: readStringRecord(value, 'resourceAttributes', issues),
    sampler: readNonEmptyString(value, 'sampler', issues),
    debug: readBoolean(value, 'debug', issues),
  };

  if (issues.length > 0) {
    return { issues };
  }
  return { value: parsed };
}

/**
 * Standard Schema validator for resolved {@linkcode TelemetryConfig} values.
 *
 * Conforms to the {@link https://standardschema.dev | Standard Schema} contract
 * so the resolved telemetry configuration can be validated by any Standard
 * Schema-aware tool. Validation is synchronous and enforces that the OTLP
 * endpoint is a well-formed URL when present and that required string fields are
 * non-empty.
 */
export const telemetryConfigSchema: StandardSchemaV1<TelemetryConfig, TelemetryConfig> = {
  '~standard': {
    version: 1,
    vendor: 'netscript-telemetry',
    validate: validateTelemetryConfigValue,
  },
};

/**
 * Error thrown when telemetry configuration fails Standard Schema validation.
 */
export class TelemetryConfigError extends Error {
  /** Validation issues that caused the failure. */
  readonly issues: readonly StandardSchemaV1.Issue[];

  /**
   * Construct the error from the failing validation issues.
   *
   * @param issues Standard Schema issues describing each validation failure.
   */
  constructor(issues: readonly StandardSchemaV1.Issue[]) {
    super(
      `Invalid telemetry configuration: ${issues.map((issue) => issue.message).join('; ')}`,
    );
    this.name = 'TelemetryConfigError';
    this.issues = issues;
  }
}

/**
 * Validate a resolved telemetry configuration against
 * {@linkcode telemetryConfigSchema}.
 *
 * @param config The resolved telemetry configuration to validate.
 * @returns The validated configuration.
 * @throws {TelemetryConfigError} When validation reports one or more issues.
 */
export function validateTelemetryConfig(config: TelemetryConfig): TelemetryConfig {
  const result = telemetryConfigSchema['~standard'].validate(config);
  if (result instanceof Promise) {
    throw new TypeError('Telemetry configuration validation must be synchronous.');
  }
  if (result.issues) {
    throw new TelemetryConfigError(result.issues);
  }
  return result.value;
}
