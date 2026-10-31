import { spawn } from 'node:child_process';
import { kill } from 'node:process';

/** Bound a whole-corpus compile, including cold dependency loading. */
export const SNIPPET_TIMEOUT_MS = 30_000;
/** Includes dependency loading before the checker can extract source fences. */
export const SNIPPET_CHECK_TIMEOUT_MS = 240_000;
/** The launcher allows its worker to finish the shorter compiler-group cleanup first. */
export const SNIPPET_LAUNCHER_GRACE_MS = 1_000;
const OUTPUT_LIMIT = 1024 * 1024;
const TERMINATION_GRACE_MS = 250;

/** Captured process result; timeouts always fail even if the child races to exit zero. */
export interface SnippetProcessResult {
  code: number;
  stdout: string;
  stderr: string;
  timedOut: boolean;
  interrupted: boolean;
}

/** Run a compiler or fixture with EOF on stdin and a deadline covering inherited output pipes. */
export function runSnippetProcess(
  command: string,
  args: string[],
  options: { source: string; cwd: string; timeoutMs?: number; terminationGraceMs?: number },
): Promise<SnippetProcessResult> {
  const timeoutMs = options.timeoutMs ?? SNIPPET_TIMEOUT_MS;
  const terminationGraceMs = options.terminationGraceMs ?? TERMINATION_GRACE_MS;
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1) {
    throw new Error(`${options.source}: invalid snippet timeout ${timeoutMs}`);
  }
  if (!Number.isSafeInteger(terminationGraceMs) || terminationGraceMs < 1) {
    throw new Error(`${options.source}: invalid termination grace ${terminationGraceMs}`);
  }
  return new Promise((resolve, reject) => {
    // detached creates a dedicated POSIX process group without an external setsid dependency.
    const child = spawn(command, args, {
      cwd: options.cwd,
      detached: Deno.build.os !== 'windows',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    let timedOut = false;
    let interrupted = false;
    let cleanup: Promise<void> | undefined;
    const signalGroup = (signal: 'SIGTERM' | 'SIGKILL') => {
      if (child.pid === undefined) return;
      try {
        kill(-child.pid, signal);
      } catch (error) {
        if (!(error instanceof Error && 'code' in error && error.code === 'ESRCH')) throw error;
      }
    };
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (data: string) => {
      stdout = (stdout + data).slice(-OUTPUT_LIMIT);
    });
    child.stderr.on('data', (data: string) => {
      stderr = (stderr + data).slice(-OUTPUT_LIMIT);
    });
    const terminate = (): Promise<void> => {
      if (cleanup) return cleanup;
      clearTimeout(timer);
      cleanup = (async () => {
        try {
          if (child.pid !== undefined) {
            if (Deno.build.os === 'windows') {
              // Windows has no POSIX groups; taskkill /T terminates the owned process tree.
              const treeKiller = spawn('taskkill', ['/PID', String(child.pid), '/T', '/F'], {
                stdio: 'ignore',
                timeout: 1_000,
              });
              await new Promise<void>((done, fail) => {
                treeKiller.once('error', fail);
                treeKiller.once(
                  'close',
                  (code) => code === 0 ? done() : fail(new Error('taskkill failed')),
                );
              });
            } else {
              signalGroup('SIGTERM');
              await new Promise((done) => setTimeout(done, terminationGraceMs));
              signalGroup('SIGKILL');
            }
          }
        } catch (error) {
          child.kill('SIGKILL');
          reject(new Error(`${options.source}: process-tree cleanup failed`, { cause: error }));
        } finally {
          // An escaped descendant must not keep the deadline waiting for EOF on inherited pipes.
          child.stdout.destroy();
          child.stderr.destroy();
        }
      })();
      return cleanup;
    };
    // Forward graceful termination before escalation so workers can reap their own groups.
    const forwardTermination = () => {
      interrupted = true;
      void terminate();
    };
    const removeTerminationListeners = () => {
      if (Deno.build.os === 'windows') return;
      Deno.removeSignalListener('SIGTERM', forwardTermination);
      Deno.removeSignalListener('SIGINT', forwardTermination);
    };
    const timer = setTimeout(() => {
      timedOut = true;
      void terminate();
    }, timeoutMs);
    if (Deno.build.os !== 'windows') {
      Deno.addSignalListener('SIGTERM', forwardTermination);
      Deno.addSignalListener('SIGINT', forwardTermination);
    }
    child.once('error', (error) => {
      clearTimeout(timer);
      removeTerminationListeners();
      reject(new Error(`${options.source}: failed to start snippet process`, { cause: error }));
    });
    child.once('close', async (code) => {
      clearTimeout(timer);
      await cleanup;
      removeTerminationListeners();
      resolve({
        code: timedOut || interrupted ? 1 : code ?? 1,
        stdout,
        stderr: timedOut
          ? `${options.source}: snippet process timed out after ${timeoutMs}ms\n${stderr}`
          : interrupted
          ? `${options.source}: snippet process interrupted\n${stderr}`
          : stderr,
        timedOut,
        interrupted,
      });
    });
  });
}
