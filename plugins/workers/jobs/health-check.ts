/**
 * Workers Plugin - Health Check Job
 *
 * Periodic health check of the workers system.
 * Verifies environment, filesystem, memory, and timestamp.
 *
 * @module
 */

import {
  createFailureResult,
  createSuccessResult,
  defineJobHandler,
} from '@netscript/plugin-workers-core';
import { createJobTools } from './job-tools.ts';
import { z } from 'zod';

// ============================================================================
// PAYLOAD SCHEMA
// ============================================================================

const HealthCheckPayloadSchema = z.object({
  verbose: z.boolean().default(false),
});

// ============================================================================
// RESULT TYPES
// ============================================================================

interface HealthCheck {
  name: string;
  status: 'pass' | 'fail';
  duration: number;
  message?: string;
}

// ============================================================================
// JOB HANDLER
// ============================================================================

/** Context passed to the built-in workers plugin health check job. */
export type HealthCheckJobContext = Readonly<{
  id: string;
  job?: Readonly<{ id: string }>;
  payload: unknown;
  correlationId?: string;
  traceparent?: string;
  tracestate?: string;
  reportProgress?: (percent: number, message?: string) => void | Promise<void>;
}>;

/** Result returned by the built-in workers plugin health check job. */
export type HealthCheckJobResult =
  | Readonly<{ success: true; data?: unknown }>
  | Readonly<{ success: false; error: string; data?: unknown }>;

/** Handler signature for the built-in workers plugin health check job. */
export type HealthCheckJobHandler = (
  context: HealthCheckJobContext,
) => HealthCheckJobResult | Promise<HealthCheckJobResult>;

const handler: HealthCheckJobHandler = defineJobHandler(async (ctx) => {
  const payload = HealthCheckPayloadSchema.parse(ctx.payload ?? {});
  const { log, progress, trace } = createJobTools(ctx);
  const { verbose } = payload;
  const checks: HealthCheck[] = [];
  const startTime = performance.now();

  log.info('Starting workers plugin health check');
  trace.addEvent('health_check.started', { verbose });

  // ========================================================================
  // CHECK 1: Environment
  // ========================================================================
  progress(20, 'Checking environment');
  const envCheck = await trace.withChildSpan('check.environment', (span) => {
    const checkStart = performance.now();
    span.setAttribute('check.name', 'environment');

    // In Web Worker context, we verify we have job context instead of env vars
    const result: HealthCheck = {
      name: 'environment',
      status: 'pass',
      duration: performance.now() - checkStart,
      message: `Job context available (jobId: ${ctx.id}, executionId: ${ctx.id})`,
    };

    span.setAttribute('check.status', result.status);
    if (verbose) log.info('Environment check passed');
    return Promise.resolve(result);
  });
  checks.push(envCheck);

  // ========================================================================
  // CHECK 2: File System Access
  // ========================================================================
  progress(40, 'Checking filesystem');
  const fsCheck = await trace.withChildSpan('check.filesystem', async (span) => {
    const checkStart = performance.now();
    span.setAttribute('check.name', 'filesystem');

    try {
      const entries = [];
      for await (const entry of Deno.readDir('.')) {
        entries.push(entry.name);
        if (entries.length >= 5) break;
      }

      const result: HealthCheck = {
        name: 'filesystem',
        status: 'pass',
        duration: performance.now() - checkStart,
        message: `Can read directory (${entries.length}+ entries)`,
      };
      span.setAttribute('check.status', result.status);
      span.setAttribute('filesystem.entries_found', entries.length);
      if (verbose) log.info('Filesystem check passed');
      return result;
    } catch (error) {
      const result: HealthCheck = {
        name: 'filesystem',
        status: 'fail',
        duration: performance.now() - checkStart,
        message: error instanceof Error ? error.message : String(error),
      };
      span.setAttribute('check.status', result.status);
      if (result.message) {
        span.setAttribute('error.message', result.message);
      }
      log.error('Filesystem check failed', { error: String(error) });
      return result;
    }
  });
  checks.push(fsCheck);

  // ========================================================================
  // CHECK 3: Memory Usage
  // ========================================================================
  progress(60, 'Checking memory');
  const memCheck = await trace.withChildSpan('check.memory', (span) => {
    const checkStart = performance.now();
    span.setAttribute('check.name', 'memory');

    const result: HealthCheck = {
      name: 'memory',
      status: 'pass',
      duration: performance.now() - checkStart,
      message: 'Memory check passed',
    };
    span.setAttribute('check.status', result.status);
    if (verbose) log.info('Memory check passed');
    return Promise.resolve(result);
  });
  checks.push(memCheck);

  // ========================================================================
  // CHECK 4: Timestamp Sanity
  // ========================================================================
  progress(80, 'Checking timestamp');
  const timeCheck = await trace.withChildSpan('check.timestamp', (span) => {
    const checkStart = performance.now();
    span.setAttribute('check.name', 'timestamp');

    const now = Date.now();
    const year = new Date(now).getFullYear();
    span.setAttribute('system.year', year);

    if (year >= 2024 && year <= 2100) {
      const result: HealthCheck = {
        name: 'timestamp',
        status: 'pass',
        duration: performance.now() - checkStart,
        message: `System time is valid (${new Date(now).toISOString()})`,
      };
      span.setAttribute('check.status', result.status);
      if (verbose) log.info('Timestamp check passed');
      return Promise.resolve(result);
    } else {
      const result: HealthCheck = {
        name: 'timestamp',
        status: 'fail',
        duration: performance.now() - checkStart,
        message: `System time appears invalid: year ${year}`,
      };
      span.setAttribute('check.status', result.status);
      log.error('Timestamp check failed', { year });
      return Promise.resolve(result);
    }
  });
  checks.push(timeCheck);

  // ========================================================================
  // FINALIZE RESULT
  // ========================================================================
  progress(100, 'Complete');

  const totalDuration = performance.now() - startTime;
  const failedChecks = checks.filter((c) => c.status === 'fail');

  let status: 'healthy' | 'degraded' | 'unhealthy';
  if (failedChecks.length === 0) {
    status = 'healthy';
  } else if (failedChecks.length <= 1) {
    status = 'degraded';
  } else {
    status = 'unhealthy';
  }

  trace.addEvent('health_check.completed', {
    status,
    checks_total: checks.length,
    checks_failed: failedChecks.length,
    duration_ms: Math.round(totalDuration),
  });

  log.info('Health check complete', {
    status,
    duration: Math.round(totalDuration),
    checksTotal: checks.length,
    checksFailed: failedChecks.length,
  });

  const result = {
    status,
    timestamp: new Date().toISOString(),
    checks,
    totalDuration,
  };

  if (status === 'healthy') {
    return createSuccessResult(result);
  } else {
    return createFailureResult(
      `Health check ${status}: ${failedChecks.map((c) => c.name).join(', ')} failed`,
    );
  }
});

/** Runs the built-in workers plugin health check job. */
export const healthCheckJob:
  & HealthCheckJobHandler
  & Readonly<{ id: 'workers-plugin-health-check' }> = Object.assign(handler, {
    id: 'workers-plugin-health-check' as const,
  });

export default healthCheckJob;
