const ABORT_KILL_GRACE_MS = 1000;

/** Execute one cancellable Aspire CLI query with fully captured output. */
export async function executeAspireCliCommand(
  command: string,
  args: readonly string[],
  signal?: AbortSignal,
): Promise<{ readonly code: number; readonly stdout: string; readonly stderr: string }> {
  signal?.throwIfAborted();
  const child = new Deno.Command(command, {
    args: [...args],
    stdin: 'null',
    stdout: 'piped',
    stderr: 'piped',
  }).spawn();
  let aborted = false;
  let escalation: ReturnType<typeof setTimeout> | undefined;
  let exited = false;
  const status = child.status.then((result) => {
    exited = true;
    return result;
  });
  const abort = (): void => {
    if (aborted || exited) return;
    aborted = true;
    try {
      child.kill('SIGTERM');
    } catch (error) {
      if (!(error instanceof Deno.errors.NotFound)) throw error;
    }
    escalation = setTimeout(() => {
      if (!exited) {
        try {
          child.kill('SIGKILL');
        } catch { /* The child exited during escalation. */ }
      }
    }, ABORT_KILL_GRACE_MS);
  };
  signal?.addEventListener('abort', abort, { once: true });
  if (signal?.aborted) abort();
  let output: Deno.CommandOutput;
  try {
    output = await child.output();
  } finally {
    await status;
    if (escalation !== undefined) clearTimeout(escalation);
    signal?.removeEventListener('abort', abort);
  }
  if (aborted) throw new DOMException('Aspire CLI query was aborted', 'AbortError');
  const decoder = new TextDecoder();
  return {
    code: output.code,
    stdout: decoder.decode(output.stdout),
    stderr: decoder.decode(output.stderr),
  };
}
