import { createToolSchema, isRecord, type ToolSchema } from './schema.ts';
import type { ToolName } from './tool-types.ts';

const objectSchema = (
  properties: Record<string, unknown> = {},
  required: string[] = [],
): Readonly<Record<string, unknown>> => ({
  type: 'object',
  properties,
  required,
  additionalProperties: false,
});
const stringProperty = { type: 'string' } as const;
const limitProperty = { type: 'integer', minimum: 1, maximum: 100 } as const;
const searchLimitProperty = { type: 'integer', minimum: 1, maximum: 20 } as const;
const isObject = (value: unknown): value is Record<string, unknown> => isRecord(value);
const doctorCountsShape = objectSchema({
  pass: { type: 'integer' },
  warn: { type: 'integer' },
  fail: { type: 'integer' },
}, ['pass', 'warn', 'fail']);
const doctorCheckShape = objectSchema({
  name: stringProperty,
  status: { enum: ['pass', 'warn', 'fail'] },
  summary: stringProperty,
  fix: stringProperty,
}, ['name', 'status', 'summary']);
const doctorFamilyShape = objectSchema({
  name: { enum: ['telemetry', 'aspire', 'project', 'plugins'] },
  status: { enum: ['pass', 'warn', 'fail'] },
  counts: doctorCountsShape,
  checks: { type: 'array', maxItems: 20, items: doctorCheckShape },
}, ['name', 'status', 'counts', 'checks']);

/** Compact diagnostic severity. */
export type DoctorStatus = 'pass' | 'warn' | 'fail';
/** One doctor diagnostic check. */
export interface DoctorCheck {
  /** Stable check name. */ readonly name: string;
  /** Check severity. */ readonly status: DoctorStatus;
  /** Bounded human-readable outcome. */ readonly summary: string;
  /** Action that can resolve a warning or failure. */ readonly fix?: string;
}
/** Doctor check counts grouped by severity. */
export interface DoctorCounts {
  /** Passing checks. */ readonly pass: number;
  /** Warning checks. */ readonly warn: number;
  /** Failing checks. */ readonly fail: number;
}
/** Bounded doctor result. */
export interface DoctorResult {
  /** Overall severity. */ readonly status: DoctorStatus;
  /** Endpoint label that was probed. */ readonly endpoint: string;
  /** Counts grouped by severity. */ readonly counts: DoctorCounts;
  /** Bounded diagnostic checks. */ readonly checks: readonly DoctorCheck[];
  /** Checks grouped by diagnostic family. */ readonly families:
    readonly import('./doctor-check-family.ts').DoctorFamilyResult[];
}

const inputShapes: Record<ToolName, Readonly<Record<string, unknown>>> = {
  get_app_status: objectSchema({ service: stringProperty, limit: limitProperty }),
  list_runs: objectSchema({
    domain: stringProperty,
    status: stringProperty,
    service: stringProperty,
    sinceUnixMs: { type: 'number' },
    limit: limitProperty,
  }),
  get_run: objectSchema({ id: stringProperty }, ['id']),
  get_recent_errors: objectSchema({
    service: stringProperty,
    domain: stringProperty,
    sinceUnixMs: { type: 'number' },
    limit: limitProperty,
  }),
  get_last_job_result: objectSchema({
    jobId: stringProperty,
    jobName: stringProperty,
    service: stringProperty,
    sinceUnixMs: { type: 'number' },
  }),
  analyze_service_performance: objectSchema({
    service: stringProperty,
    sinceUnixMs: { type: 'number' },
    limit: limitProperty,
  }, ['service']),
  analyze_db_bottlenecks: objectSchema({
    service: stringProperty,
    sinceUnixMs: { type: 'number' },
    limit: limitProperty,
  }),
  doctor: objectSchema({ endpoint: stringProperty }),
  search_docs: objectSchema({ query: stringProperty, limit: searchLimitProperty }, ['query']),
  list_docs: objectSchema({ limit: limitProperty }),
  get_doc: objectSchema({ slug: stringProperty, section: stringProperty }, ['slug']),
  list_commands: objectSchema({ filter: stringProperty, limit: limitProperty }),
  execute_command: objectSchema({
    command: stringProperty,
    args: { type: 'array', items: stringProperty, maxItems: 32 },
  }, ['command']),
};

const outputShapes: Record<ToolName, Readonly<Record<string, unknown>>> = {
  get_app_status: objectSchema({
    status: { enum: ['pass', 'warn', 'fail'] },
    counts: { type: 'object' },
    domains: { type: 'array', maxItems: 5 },
  }, ['status', 'counts', 'domains']),
  list_runs: objectSchema({ count: { type: 'integer' }, runs: { type: 'array', maxItems: 100 } }, [
    'count',
    'runs',
  ]),
  get_run: objectSchema({
    id: stringProperty,
    summary: stringProperty,
    traceId: stringProperty,
    outcome: stringProperty,
    errorMessage: stringProperty,
    spans: { type: 'array', maxItems: 50 },
    logs: { type: 'array', maxItems: 20 },
  }, ['id', 'summary']),
  get_recent_errors: objectSchema({
    count: { type: 'integer' },
    groups: { type: 'array', maxItems: 20 },
  }, ['count', 'groups']),
  get_last_job_result: objectSchema({
    found: { type: 'boolean' },
    jobName: stringProperty,
    jobId: stringProperty,
    status: stringProperty,
    outcome: stringProperty,
    exitCode: { type: 'number' },
    startUnixMs: { type: 'number' },
    completedUnixMs: { type: 'number' },
    durationMs: { type: 'number' },
    errorMessage: stringProperty,
    traceId: stringProperty,
  }, ['found']),
  analyze_service_performance: objectSchema({
    service: stringProperty,
    sinceUnixMs: { type: 'number' },
    sampleCount: { type: 'integer' },
    errorCount: { type: 'integer' },
    errorRate: { type: 'number' },
    averageDurationMs: { type: 'number' },
    p50DurationMs: { type: 'number' },
    p95DurationMs: { type: 'number' },
    throughputPerMinute: { type: 'number' },
    topOperations: { type: 'array', maxItems: 20 },
  }, [
    'service',
    'sinceUnixMs',
    'sampleCount',
    'errorCount',
    'errorRate',
    'averageDurationMs',
    'p50DurationMs',
    'p95DurationMs',
    'throughputPerMinute',
    'topOperations',
  ]),
  analyze_db_bottlenecks: objectSchema({
    sinceUnixMs: { type: 'number' },
    sampleCount: { type: 'integer' },
    operations: { type: 'array', maxItems: 20 },
  }, ['sinceUnixMs', 'sampleCount', 'operations']),
  doctor: objectSchema({
    status: { enum: ['pass', 'warn', 'fail'] },
    endpoint: stringProperty,
    counts: doctorCountsShape,
    checks: { type: 'array', maxItems: 20, items: doctorCheckShape },
    families: { type: 'array', maxItems: 4, items: doctorFamilyShape },
  }, ['status', 'endpoint', 'counts', 'checks', 'families']),
  search_docs: objectSchema({
    count: { type: 'integer' },
    matches: {
      type: 'array',
      maxItems: 20,
      items: objectSchema({
        slug: stringProperty,
        title: stringProperty,
        snippet: stringProperty,
        score: { type: 'number' },
      }, ['slug', 'title', 'snippet', 'score']),
    },
  }, ['count', 'matches']),
  list_docs: objectSchema({
    count: { type: 'integer' },
    docs: {
      type: 'array',
      maxItems: 100,
      items: objectSchema({
        slug: stringProperty,
        title: stringProperty,
        description: stringProperty,
      }, ['slug', 'title', 'description']),
    },
  }, [
    'count',
    'docs',
  ]),
  get_doc: objectSchema({
    slug: stringProperty,
    title: stringProperty,
    section: stringProperty,
    content: stringProperty,
  }, [
    'slug',
    'title',
    'content',
  ]),
  list_commands: objectSchema({
    count: { type: 'integer' },
    commands: {
      type: 'array',
      maxItems: 100,
      items: objectSchema({
        path: stringProperty,
        description: stringProperty,
        usage: stringProperty,
      }, ['path', 'description', 'usage']),
    },
  }, ['count', 'commands']),
  execute_command: objectSchema({
    exitCode: { type: 'integer' },
    durationMs: { type: 'number' },
    outputTail: stringProperty,
    truncated: { type: 'boolean' },
    timedOut: { type: 'boolean' },
  }, ['exitCode', 'durationMs', 'outputTail', 'truncated', 'timedOut']),
};

/** Standard-Schema input contracts for the complete v1 tool surface. */
export const TOOL_INPUT_SCHEMAS: Readonly<Record<ToolName, ToolSchema<unknown>>> = Object
  .fromEntries(
    Object.entries(inputShapes).map((
      [name, schema],
    ) => [name, createToolSchema(schema, isObject, `${name} input must be an object`)]),
  ) as Record<ToolName, ToolSchema<unknown>>;

/** Standard-Schema output contracts for the complete v1 tool surface. */
export const TOOL_OUTPUT_SCHEMAS: Readonly<Record<ToolName, ToolSchema<unknown>>> = Object
  .fromEntries(
    Object.entries(outputShapes).map((
      [name, schema],
    ) => [name, createToolSchema(schema, isObject, `${name} output must be an object`)]),
  ) as Record<ToolName, ToolSchema<unknown>>;
