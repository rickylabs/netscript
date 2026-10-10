import { encodeTaskStdin } from '../task-stdin.ts';
import type {
  ResolvedTaskExecutionOptions,
  TaskDefinition,
  TaskLogEntry,
  TaskResult,
} from '../executor-types.ts';
import { classifyTaskLog } from './log-classifier.ts';

/** Process runner input shared by built-in runtime adapters. */
export type ProcessRunInput = Readonly<{
  command: string;
  args: readonly string[];
  task: TaskDefinition;
  options: ResolvedTaskExecutionOptions;
  /** Bytes written once and closed; absent stdin is null, never inherited. */
  stdin?: Uint8Array;
}>;

/** Subprocess primitive used by runtime adapters. */
export interface ProcessRunner {
  /** Run a subprocess and return the normalized task result. */
  run(input: ProcessRunInput): Promise<TaskResult>;
}

/**
 * Run task subprocesses with bounded Web Platform stream capture.
 * The historical class name is preserved; subprocess IO uses Deno.Command.
 */
export class DaxProcessRunner implements ProcessRunner {
  /** Run a subprocess and return the normalized task result. */
  run(input: ProcessRunInput): Promise<TaskResult> {
    return runProcess(input);
  }
}

/** Run a subprocess with bounded stdin, output capture, and log callbacks. */
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

  let child: Deno.ChildProcess | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let failure: { status: string; message: string } | undefined;
  const stop = (status: string, message: string): void => {
    if (failure) return;
    failure = { status, message };
    try {
      child?.kill('SIGKILL');
    } catch {
      // The child may have exited between the failure and the kill request.
    }
  };
  const cancel = (): void => stop('cancelled', 'Task cancelled.');
  try {
    const stdin = input.stdin !== undefined
      ? encodeTaskStdin(input.stdin)
      : Object.hasOwn(input.options, 'stdin')
      ? encodeTaskStdin(input.options.stdin!)
      : input.task.stdin !== undefined
      ? encodeTaskStdin(input.task.stdin)
      : undefined;
    const stdoutLimit = outputLimit(input.options.stdoutLimitBytes);
    const stderrLimit = outputLimit(input.options.stderrLimitBytes);
    child = new Deno.Command(input.command, {
      args: [...input.args],
      cwd: input.options.cwd || Deno.cwd(),
      env,
      stdin: stdin === undefined ? 'null' : 'piped',
      stdout: 'piped',
      stderr: 'piped',
    }).spawn();
    input.options.signal?.addEventListener('abort', cancel, { once: true });
    if (input.options.signal?.aborted) cancel();
    timer = setTimeout(() => stop('timeout', 'Task timeout.'), input.options.timeout);
    const guard = async (operation: Promise<void>): Promise<void> => {
      try {
        await operation;
      } catch (error) {
        stop('failed', error instanceof Error ? error.message : String(error));
      }
    };
    const [result] = await Promise.all([
      child.status,
      guard(streamOutput(child.stdout, input, 'stdout', stdout, stdoutLimit)),
      guard(streamOutput(child.stderr, input, 'stderr', stderr, stderrLimit)),
      stdin === undefined ? Promise.resolve() : guard(writeStdin(child.stdin, stdin)),
    ]);
    const success = !failure && result.code === 0;
    return createProcessResult(
      input.task,
      startedAt,
      failure ? -1 : result.code,
      stdout,
      stderr,
      failure?.status ?? (success ? 'completed' : 'failed'),
      failure?.message ??
        (success ? null : buildErrorMessage(result.code, input.command, stderr.join('\n'))),
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    stop('failed', message);
    if (child) await child.status;
    return createProcessResult(input.task, startedAt, -1, stdout, stderr, 'failed', message);
  } finally {
    clearTimeout(timer);
    input.options.signal?.removeEventListener('abort', cancel);
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
  limit: number,
): Promise<void> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let partial = '';
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) {
        throw new Error(
          `${
            source === 'stdout' ? 'Stdout' : 'Stderr'
          }LimitExceeded: output exceeds ${limit} bytes.`,
        );
      }
      const lines = (partial + decoder.decode(value, { stream: true })).split('\n');
      partial = lines.pop() ?? '';
      for (const line of lines) emitLine(line, input, source, buffer);
    }
    emitLine(partial + decoder.decode(), input, source, buffer);
  } finally {
    reader.releaseLock();
  }
}

function outputLimit(limit: number = 1024 * 1024): number {
  if (!Number.isSafeInteger(limit) || limit <= 0) {
    throw new Error('InvalidOutputLimit: expected a positive safe integer byte limit.');
  }
  return limit;
}

async function writeStdin(stream: WritableStream<Uint8Array>, bytes: Uint8Array): Promise<void> {
  const writer = stream.getWriter();
  try {
    for (let offset = 0; offset < bytes.length; offset += 16384) {
      await writer.write(bytes.subarray(offset, offset + 16384));
    }
    await writer.close();
  } catch {
    throw new Error('StdinWriteFailed: subprocess closed stdin before the payload was delivered.');
  } finally {
    writer.releaseLock();
  }
}

function emitLine(
  line: string,
  input: ProcessRunInput,
  source: TaskLogEntry['source'],
  buffer: string[],
): void {
  if (!line.trim()) return;
  buffer.push(line);
  if (input.options.streamLogs === false) return;
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
