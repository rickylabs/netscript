import type { StandardSchemaV1 } from '@standard-schema/spec';
import type { MetricQueryFilter, ResourceQueryFilter, TraceQueryFilter } from './types.ts';

type Issue = StandardSchemaV1.Issue;

function readOptionalString(source: object, key: string, issues: Issue[]): string | undefined {
  const raw = Reflect.get(source, key);
  if (raw === undefined) {
    return undefined;
  }
  if (typeof raw !== 'string' || raw.length === 0) {
    issues.push({ message: `${key} must be a non-empty string when set`, path: [key] });
    return undefined;
  }
  return raw;
}

function readOptionalNumber(source: object, key: string, issues: Issue[]): number | undefined {
  const raw = Reflect.get(source, key);
  if (raw === undefined) {
    return undefined;
  }
  if (typeof raw !== 'number' || !Number.isFinite(raw)) {
    issues.push({ message: `${key} must be a finite number when set`, path: [key] });
    return undefined;
  }
  return raw;
}

function readOptionalPositiveInteger(
  source: object,
  key: string,
  issues: Issue[],
): number | undefined {
  const raw = readOptionalNumber(source, key, issues);
  if (raw === undefined) {
    return undefined;
  }
  if (!Number.isInteger(raw) || raw <= 0) {
    issues.push({ message: `${key} must be a positive integer when set`, path: [key] });
    return undefined;
  }
  return raw;
}

function readOptionalBoolean(source: object, key: string, issues: Issue[]): boolean | undefined {
  const raw = Reflect.get(source, key);
  if (raw === undefined) {
    return undefined;
  }
  if (typeof raw !== 'boolean') {
    issues.push({ message: `${key} must be a boolean when set`, path: [key] });
    return undefined;
  }
  return raw;
}

function requireObject(value: unknown, label: string): object | readonly Issue[] {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return [{ message: `${label} must be an object` }];
  }
  return value;
}

function validateTraceQueryFilterValue(
  value: unknown,
): StandardSchemaV1.Result<TraceQueryFilter> {
  const source = requireObject(value, 'trace query filter');
  if (Array.isArray(source)) {
    return { issues: source };
  }

  const issues: Issue[] = [];
  const parsed: TraceQueryFilter = {
    resource: readOptionalString(source, 'resource', issues),
    serviceName: readOptionalString(source, 'serviceName', issues),
    sinceUnixMs: readOptionalNumber(source, 'sinceUnixMs', issues),
    limit: readOptionalPositiveInteger(source, 'limit', issues),
    follow: readOptionalBoolean(source, 'follow', issues),
  };

  if (issues.length > 0) {
    return { issues };
  }
  return { value: parsed };
}

function validateResourceQueryFilterValue(
  value: unknown,
): StandardSchemaV1.Result<ResourceQueryFilter> {
  const source = requireObject(value, 'resource query filter');
  if (Array.isArray(source)) {
    return { issues: source };
  }

  const issues: Issue[] = [];
  const parsed: ResourceQueryFilter = {
    resource: readOptionalString(source, 'resource', issues),
    serviceName: readOptionalString(source, 'serviceName', issues),
  };

  if (issues.length > 0) {
    return { issues };
  }
  return { value: parsed };
}

function validateMetricQueryFilterValue(
  value: unknown,
): StandardSchemaV1.Result<MetricQueryFilter> {
  const source = requireObject(value, 'metric query filter');
  if (Array.isArray(source)) {
    return { issues: source };
  }

  const issues: Issue[] = [];
  const parsed: MetricQueryFilter = {
    resource: readOptionalString(source, 'resource', issues),
    serviceName: readOptionalString(source, 'serviceName', issues),
    metricName: readOptionalString(source, 'metricName', issues),
    sinceUnixMs: readOptionalNumber(source, 'sinceUnixMs', issues),
    limit: readOptionalPositiveInteger(source, 'limit', issues),
    follow: readOptionalBoolean(source, 'follow', issues),
  };

  if (issues.length > 0) {
    return { issues };
  }
  return { value: parsed };
}

/**
 * Standard Schema validator for trace query filters.
 */
export const traceQueryFilterSchema: StandardSchemaV1<TraceQueryFilter, TraceQueryFilter> = {
  '~standard': {
    version: 1,
    vendor: 'netscript-telemetry',
    validate: validateTraceQueryFilterValue,
  },
};

/**
 * Standard Schema validator for resource query filters.
 */
export const resourceQueryFilterSchema: StandardSchemaV1<ResourceQueryFilter, ResourceQueryFilter> =
  {
    '~standard': {
      version: 1,
      vendor: 'netscript-telemetry',
      validate: validateResourceQueryFilterValue,
    },
  };

/**
 * Standard Schema validator for metric query filters.
 */
export const metricQueryFilterSchema: StandardSchemaV1<MetricQueryFilter, MetricQueryFilter> = {
  '~standard': {
    version: 1,
    vendor: 'netscript-telemetry',
    validate: validateMetricQueryFilterValue,
  },
};

/**
 * Error thrown when a telemetry query filter fails Standard Schema validation.
 */
export class TelemetryQueryValidationError extends Error {
  /** Validation issues that caused the failure. */
  readonly issues: readonly StandardSchemaV1.Issue[];

  /**
   * Construct the error from the failing validation issues.
   *
   * @param issues Standard Schema issues describing each validation failure.
   */
  constructor(issues: readonly StandardSchemaV1.Issue[]) {
    super(
      `Invalid telemetry query filter: ${issues.map((issue) => issue.message).join('; ')}`,
    );
    this.name = 'TelemetryQueryValidationError';
    this.issues = issues;
  }
}

function readSchemaResult<T>(result: StandardSchemaV1.Result<T>): T {
  if (result.issues) {
    throw new TelemetryQueryValidationError(result.issues);
  }
  return result.value;
}

/**
 * Validate a trace query filter against {@linkcode traceQueryFilterSchema}.
 *
 * @param filter Trace query filter to validate.
 * @returns The validated filter.
 */
export function validateTraceQueryFilter(filter: TraceQueryFilter): TraceQueryFilter {
  const result = traceQueryFilterSchema['~standard'].validate(filter);
  if (result instanceof Promise) {
    throw new TypeError('Trace query filter validation must be synchronous.');
  }
  return readSchemaResult(result);
}

/**
 * Validate a resource query filter against {@linkcode resourceQueryFilterSchema}.
 *
 * @param filter Resource query filter to validate.
 * @returns The validated filter.
 */
export function validateResourceQueryFilter(filter: ResourceQueryFilter): ResourceQueryFilter {
  const result = resourceQueryFilterSchema['~standard'].validate(filter);
  if (result instanceof Promise) {
    throw new TypeError('Resource query filter validation must be synchronous.');
  }
  return readSchemaResult(result);
}

/**
 * Validate a metric query filter against {@linkcode metricQueryFilterSchema}.
 *
 * @param filter Metric query filter to validate.
 * @returns The validated filter.
 */
export function validateMetricQueryFilter(filter: MetricQueryFilter): MetricQueryFilter {
  const result = metricQueryFilterSchema['~standard'].validate(filter);
  if (result instanceof Promise) {
    throw new TypeError('Metric query filter validation must be synchronous.');
  }
  return readSchemaResult(result);
}
