/**
 * Triggers Plugin — File Import Job
 *
 * Generic file-import job: reads a staged file, parses it (CSV, JSON, or
 * raw text), cleans up the staged copy, then publishes a saga message
 * with the parsed data.
 *
 * Replaces the need to write a custom csv-import handler for every trigger.
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

const FileImportPayloadSchema = z.object({
  filePath: z.string().min(1),
  fileName: z.string().min(1),
  contentHash: z.string().nullable(),
  format: z.enum(['csv', 'json', 'text', 'auto']).default('auto'),
  sagaMessageType: z.string().optional(),
  csvDelimiter: z.string().default(','),
});

// ============================================================================
// HELPERS
// ============================================================================

function detectFormat(fileName: string): 'csv' | 'json' | 'text' {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (ext === 'csv' || ext === 'tsv') return 'csv';
  if (ext === 'json') return 'json';
  return 'text';
}

function parseCsv(
  content: string,
  delimiter: string,
): { headers: string[]; rows: Record<string, string>[]; rowCount: number } {
  const lines = content.trim().split('\n').filter((l) => l.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [], rowCount: 0 };

  const headers = lines[0].split(delimiter).map((h) => h.trim());
  const rows = lines.slice(1).map((line) => {
    const values = line.split(delimiter).map((v) => v.trim());
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = values[i] ?? '';
    });
    return row;
  });

  return { headers, rows, rowCount: rows.length };
}

// ============================================================================
// JOB HANDLER
// ============================================================================

const handler = defineJobHandler(async (ctx) => {
  const payload = FileImportPayloadSchema.parse(ctx.payload ?? {});
  const { log, progress, trace, traceContext } = createJobTools(ctx);
  const { filePath, fileName, contentHash, format, sagaMessageType, csvDelimiter } = payload;

  log.info('Starting file import', { filePath, fileName, format });
  trace.addEvent('file-import.started', { file_path: filePath, format });

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

  // Step 2: Clean up staged file — content is in memory
  try {
    await Deno.remove(filePath);
    log.info('Cleaned up staged file', { filePath });
  } catch {
    // Non-fatal — file may already be gone
  }

  // Step 3: Parse based on format
  progress(40, 'Parsing content');
  const resolvedFormat = format === 'auto' ? detectFormat(fileName) : format;

  let parsed: {
    format: string;
    headers?: string[];
    rows?: Record<string, string>[];
    data?: unknown;
    content?: string;
    rowCount: number;
  };

  switch (resolvedFormat) {
    case 'csv': {
      const csv = parseCsv(rawContent, csvDelimiter);
      parsed = { format: 'csv', ...csv };
      break;
    }
    case 'json': {
      try {
        const data = JSON.parse(rawContent);
        const rowCount = Array.isArray(data) ? data.length : 1;
        parsed = { format: 'json', data, rowCount };
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        return createFailureResult(`JSON parse error: ${msg}`);
      }
      break;
    }
    default: {
      const lines = rawContent.trim().split('\n');
      parsed = { format: 'text', content: rawContent, rowCount: lines.length };
      break;
    }
  }

  log.info('File parsed', { format: resolvedFormat, rowCount: parsed.rowCount });
  trace.addEvent('file-import.parsed', {
    format: resolvedFormat,
    row_count: parsed.rowCount,
  });

  progress(100, 'Complete');
  trace.addEvent('file-import.completed', {
    format: resolvedFormat,
    row_count: parsed.rowCount,
  });

  return createSuccessResult({
    fileName,
    contentHash,
    format: resolvedFormat,
    rowCount: parsed.rowCount,
    headers: parsed.headers,
    sagaMessage: sagaMessageType
      ? {
        type: sagaMessageType,
        payload: {
          filePath,
          fileName,
          contentHash: contentHash ?? crypto.randomUUID(),
          rowCount: parsed.rowCount,
          headers: parsed.headers ?? [],
          rows: parsed.rows ?? parsed.data ?? parsed.content,
        },
      }
      : undefined,
    completedAt: new Date().toISOString(),
  });
});

export default Object.assign(handler, { id: 'triggers-plugin-file-import' });
