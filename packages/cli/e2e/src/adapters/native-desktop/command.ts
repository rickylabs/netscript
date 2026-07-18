/** Captured native command result. */
export interface NativeCommandResult {
  readonly code: number;
  readonly stdout: string;
  readonly stderr: string;
}

/** Execute one native tool with bounded time and captured evidence. */
export async function runNativeCommand(
  command: string,
  args: readonly string[],
  options: {
    readonly cwd?: string;
    readonly env?: Readonly<Record<string, string>>;
    readonly timeoutMs?: number;
  } = {},
): Promise<NativeCommandResult> {
  const child = new Deno.Command(command, {
    args: [...args],
    cwd: options.cwd,
    env: options.env === undefined ? undefined : { ...options.env },
    clearEnv: false,
    stdin: 'null',
    stdout: 'piped',
    stderr: 'piped',
  }).spawn();
  const timeout = setTimeout(() => {
    try {
      child.kill('SIGKILL');
    } catch {
      // The process already exited.
    }
  }, options.timeoutMs ?? 180_000);
  try {
    const output = await child.output();
    return {
      code: output.code,
      stdout: new TextDecoder().decode(output.stdout),
      stderr: new TextDecoder().decode(output.stderr),
    };
  } finally {
    clearTimeout(timeout);
  }
}

/** Require a successful native command and retain useful failure output. */
export async function requireNativeCommand(
  command: string,
  args: readonly string[],
  options?: Parameters<typeof runNativeCommand>[2],
): Promise<NativeCommandResult> {
  const result = await runNativeCommand(command, args, options);
  if (result.code !== 0) {
    const detail = result.stderr.trim() || result.stdout.trim() || `exit ${result.code}`;
    throw new Error(`${command} ${args.join(' ')} failed: ${detail}`);
  }
  return result;
}
