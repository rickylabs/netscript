import $, { type CommandChild } from '@david/dax';
import type { ResolvedTaskExecutionOptions, TaskLogEntry } from '../../abstracts/mod.ts';
import type { TaskDefinition, TaskResult } from '../../domain/mod.ts';
import { classifyTaskLog } from './log-classifier.ts';

/** Process runner input shared by built-in runtime adapters. */
export type ProcessRunInput = Readonly<{
  command: string;
  args: readonly string[];
  task: TaskDefinition;
  options: ResolvedTaskExecutionOptions;
}>;

/** Subprocess primitive used by runtime adapters. */
export interface ProcessRunner {
  run(input: ProcessRunInput): Promise<TaskResult>;
}

/** Run task subprocesses through Dax with streaming output capture. */
export class DaxProcessRunner implements ProcessRunner {
  run(input: ProcessRunInput): Promise<TaskResult> {
    return runProcess(input);
  }
}

/** Run a subprocess through Dax with result capture and log callbacks. */
export async function runProcess(input: ProcessRunInput): Promise<TaskResult> {
  const startedAt = Date.now();
  const stdout: string[] = [];
  const stderr: string[] = [];
  const env = buildEnvironment(input);

  if (input.options.signal?.aborted) {
    return createProcessResult(
      input.task,
      startedAt,
      -1,
      stdout,
      stderr,
      'cancelled',
      'Task cancelled.',
    );
  }

  try {
    let command = $`${[input.command, ...input.args]}`;
    command = command.cwd(input.options.cwd || Deno.cwd());
    command = command.env(env).timeout(`${input.options.timeout}ms`).noThrow();
    command = command.stdout('piped').stderr('piped');

    const child: CommandChild = command.spawn();
    const streamLogs = input.options.streamLogs !== false;
    const streams = streamLogs
      ? [
        streamOutput(child.stdout(), input, 'stdout', stdout),
        streamOutput(child.stderr(), input, 'stderr', stderr),
      ]
      : [];
    const [result] = await Promise.all([child, ...streams]);

    if (!streamLogs) {
      pushLines(String(result.stdout ?? ''), input, 'stdout', stdout);
      pushLines(String(result.stderr ?? ''), input, 'stderr', stderr);
    }

    const success = result.code === 0;
    return createProcessResult(
      input.task,
      startedAt,
      result.code,
      stdout,
      stderr,
      success ? 'completed' : 'failed',
      success ? null : buildErrorMessage(result.code, input.command, stderr.join('\n')),
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status = message.toLowerCase().includes('timeout') ? 'timeout' : 'failed';
    return createProcessResult(input.task, startedAt, -1, stdout, stderr, status, message);
  }
}

function buildEnvironment(input: ProcessRunInput): Record<string, string> {
  return {
    ...Deno.env.toObject(),
    ...(input.task.env ?? {}),
    ...input.options.env,
    ...(input.options.traceparent ? { TRACEPARENT: input.options.traceparent } : {}),
    ...(input.options.tracestate ? { TRACESTATE: input.options.tracestate } : {}),
    ...(input.options.correlationId ? { CORRELATION_ID: input.options.correlationId } : {}),
  };
}

async function streamOutput(
  stream: ReadableStream<Uint8Array>,
  input: ProcessRunInput,
  source: TaskLogEntry['source'],
  buffer: string[],
): Promise<void> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let partial = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const lines = (partial + decoder.decode(value, { stream: true })).split('\n');
      partial = lines.pop() ?? '';
      for (const line of lines) emitLine(line, input, source, buffer);
    }
    emitLine(partial, input, source, buffer);
  } finally {
    reader.releaseLock();
  }
}

function pushLines(
  text: string,
  input: ProcessRunInput,
  source: TaskLogEntry['source'],
  buffer: string[],
): void {
  for (const line of text.split('\n')) emitLine(line, input, source, buffer);
}

function emitLine(
  line: string,
  input: ProcessRunInput,
  source: TaskLogEntry['source'],
  buffer: string[],
): void {
  if (!line.trim()) return;
  buffer.push(line);
  const entry: TaskLogEntry = {
    message: line,
    severity: classifyTaskLog(line, source),
    source,
    taskId: input.task.id,
    timestamp: new Date(),
  };
  input.options.onLog?.(entry);
  if (source === 'stdout') input.options.onStdout?.(line);
  if (source === 'stderr') input.options.onStderr?.(line);
}

function createProcessResult(
  task: TaskDefinition,
  startedAt: number,
  exitCode: number,
  stdout: readonly string[],
  stderr: readonly string[],
  status: TaskResult['status'],
  error: string | null,
): TaskResult {
  const stdoutText = stdout.join('\n');
  return {
    taskId: task.id,
    status,
    exitCode,
    stdout: stdoutText,
    stderr: stderr.join('\n'),
    duration: Date.now() - startedAt,
    success: status === 'completed',
    error,
    result: parseJsonLastLine(stdoutText),
    startedAt: new Date(startedAt).toISOString(),
    completedAt: new Date().toISOString(),
    attempt: 0,
  };
}

function parseJsonLastLine(stdout: string): Record<string, unknown> | null {
  const lastLine = stdout.trim().split('\n').pop();
  if (!lastLine) return null;
  try {
    const parsed: unknown = JSON.parse(lastLine);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? parsed as Record<string, unknown>
      : null;
  } catch {
    return null;
  }
}

function buildErrorMessage(exitCode: number, command: string, stderr: string): string {
  let message = `Process exited with code ${exitCode}`;
  if (exitCode === 126) message += ' (command not executable)';
  if (exitCode === 127) message += ` (command not found: '${command}')`;
  const firstLine = stderr.trim().split('\n')[0];
  return firstLine && firstLine.length < 200 ? `${message}. stderr: ${firstLine}` : message;
}
