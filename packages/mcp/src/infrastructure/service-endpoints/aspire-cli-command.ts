/** Execute one cancellable Aspire CLI query with fully captured output. */
export async function executeAspireCliCommand(
  command: string,
  args: readonly string[],
  signal?: AbortSignal,
): Promise<{ readonly code: number; readonly stdout: string; readonly stderr: string }> {
  signal?.throwIfAborted();
  const child = new Deno.Command(command, {
    args: [...args],
    stdout: 'piped',
    stderr: 'piped',
  }).spawn();
  let aborted = false;
  const abort = (): void => {
    aborted = true;
    try {
      child.kill('SIGTERM');
    } catch (error) {
      if (!(error instanceof Deno.errors.NotFound)) throw error;
    }
  };
  signal?.addEventListener('abort', abort, { once: true });
  let output: Deno.CommandOutput;
  try {
    output = await child.output();
  } finally {
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
