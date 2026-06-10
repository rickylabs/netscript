/**
 * Triggers Plugin — File Relay Job
 *
 * Reads a staged file and forwards its content (or metadata) to an
 * external target via HTTP POST or queue message. Handles staged file
 * cleanup after reading.
 *
 * Use for "file arrived → notify external system" patterns without
 * saga orchestration.
 *
 * @module
 */

import {
  createFailureResult,
  createSuccessResult,
  defineJobHandler,
} from '@netscript/plugin-workers-core';
import { createJobTools } from './job-tools.ts';
import { createQueue } from '@netscript/queue';
import { z } from 'zod';

// ============================================================================
// PAYLOAD SCHEMA
// ============================================================================

const HttpTargetSchema = z.object({
  type: z.literal('http'),
  url: z.string().url(),
  method: z.enum(['POST', 'PUT']).default('POST'),
  headers: z.record(z.string(), z.string()).default({}),
  sendContent: z.boolean().default(true),
});

const QueueTargetSchema = z.object({
  type: z.literal('queue'),
  queueName: z.string(),
  messageType: z.string(),
});

const FileRelayPayloadSchema = z.object({
  filePath: z.string().min(1),
  fileName: z.string().min(1),
  contentHash: z.string().nullable(),
  target: z.discriminatedUnion('type', [HttpTargetSchema, QueueTargetSchema]),
});

// ============================================================================
// JOB HANDLER
// ============================================================================

const handler = defineJobHandler(async (ctx) => {
  const payload = FileRelayPayloadSchema.parse(ctx.payload ?? {});
  const { log, progress, trace } = createJobTools(ctx);
  const { filePath, fileName, contentHash, target } = payload;

  log.info('Starting file relay', { filePath, fileName, targetType: target.type });
  trace.addEvent('file-relay.started', { file_path: filePath, target_type: target.type });

  // Step 1: Read file
  progress(10, 'Reading file');
  let rawContent: string;
  try {
    rawContent = await Deno.readTextFile(filePath);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    log.error('Failed to read file', { filePath, error: msg });
    return createFailureResult(`Failed to read file: ${msg}`);
  }

  // Step 2: Clean up staged file
  try {
    await Deno.remove(filePath);
    log.info('Cleaned up staged file', { filePath });
  } catch {
    // Non-fatal
  }

  // Step 3: Forward to target
  progress(50, `Relaying to ${target.type}`);

  if (target.type === 'http') {
    try {
      const body = target.sendContent
        ? rawContent
        : JSON.stringify({ fileName, contentHash, size: rawContent.length });

      const headers: Record<string, string> = {
        ...target.headers,
        'X-File-Name': fileName,
        'X-Content-Hash': contentHash ?? '',
      };
      if (!target.sendContent) {
        headers['Content-Type'] = 'application/json';
      }

      const response = await fetch(target.url, {
        method: target.method,
        headers,
        body,
        signal: AbortSignal.timeout(30_000),
      });

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        return createFailureResult(`HTTP ${response.status}: ${text}`);
      }

      log.info('File relayed via HTTP', {
        url: target.url,
        status: response.status,
      });

      progress(100, 'Complete');
      return createSuccessResult({
        fileName,
        targetType: 'http',
        url: target.url,
        status: response.status,
        completedAt: new Date().toISOString(),
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      return createFailureResult(`HTTP relay failed: ${msg}`);
    }
  } else {
    // Queue target
    try {
      const queue = createQueue(target.queueName);
      await queue.enqueue({
        type: target.messageType,
        fileName,
        contentHash,
        content: rawContent,
        relayedAt: new Date().toISOString(),
      });

      log.info('File relayed via queue', {
        queueName: target.queueName,
        messageType: target.messageType,
      });

      progress(100, 'Complete');
      return createSuccessResult({
        fileName,
        targetType: 'queue',
        queueName: target.queueName,
        messageType: target.messageType,
        completedAt: new Date().toISOString(),
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      return createFailureResult(`Queue relay failed: ${msg}`);
    }
  }
});

export default Object.assign(handler, { id: 'triggers-plugin-file-relay' });
