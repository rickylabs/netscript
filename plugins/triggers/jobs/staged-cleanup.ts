/**
 * Triggers Plugin — Staged Cleanup Job
 *
 * Minimal job that verifies a staged file exists and deletes it.
 * Used when lifecycle archiving is already handled and the staged
 * copy just needs to be cleaned up through the job queue.
 *
 * @module
 */

import {
  createFailureResult,
  createSuccessResult,
  defineJobHandler,
  type JobHandlerContext,
  type JobResult,
} from '@netscript/plugin-workers-core';
import { createJobTools } from './job-tools.ts';
import { z } from 'zod';

// ============================================================================
// PAYLOAD SCHEMA
// ============================================================================

const StagedCleanupPayloadSchema = z.object({
  filePath: z.string().min(1),
  fileName: z.string().min(1),
});

// ============================================================================
// JOB HANDLER
// ============================================================================

type StagedCleanupJobHandler = (
  context: JobHandlerContext,
) => JobResult<unknown> | Promise<JobResult<unknown>>;

const handler: StagedCleanupJobHandler = defineJobHandler(async (ctx) => {
  const payload = StagedCleanupPayloadSchema.parse(ctx.payload ?? {});
  const { log } = createJobTools(ctx);
  const { filePath, fileName } = payload;

  log.info('Starting staged file cleanup', { filePath, fileName });

  try {
    const stat = await Deno.stat(filePath);
    await Deno.remove(filePath);
    log.info('Staged file removed', { filePath, size: stat.size });

    return createSuccessResult({
      fileName,
      filePath,
      size: stat.size,
      removedAt: new Date().toISOString(),
    });
  } catch (error: unknown) {
    if (error instanceof Deno.errors.NotFound) {
      log.info('Staged file already gone', { filePath });
      return createSuccessResult({ fileName, filePath, alreadyGone: true });
    }
    const msg = error instanceof Error ? error.message : String(error);
    return createFailureResult(`Failed to clean up staged file: ${msg}`);
  }
});

const stagedCleanupJob:
  & StagedCleanupJobHandler
  & Readonly<{ id: 'triggers-plugin-staged-cleanup' }> = Object.assign(handler, {
    id: 'triggers-plugin-staged-cleanup' as const,
  });

export default stagedCleanupJob;
