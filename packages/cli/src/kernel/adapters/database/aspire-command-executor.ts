type CommandStdio = 'inherit' | 'null' | 'piped';

export interface AspireCommandOptions {
  readonly cwd: string;
  readonly env?: Record<string, string>;
  readonly stdin?: CommandStdio;
  readonly stdout?: CommandStdio;
  readonly stderr?: CommandStdio;
}

export interface CommandOutput {
  readonly code: number;
  readonly stdout: string;
  readonly stderr: string;
}

export interface AspireCommandExecutor {
  output(args: readonly string[], options: AspireCommandOptions): Promise<CommandOutput>;
  spawn(args: readonly string[], options: AspireCommandOptions): Promise<number>;
}

export class DenoAspireCommandExecutor implements AspireCommandExecutor {
  async output(
    args: readonly string[],
    options: AspireCommandOptions,
  ): Promise<CommandOutput> {
    const output = await new Deno.Command('aspire', {
      args: [...args],
      cwd: options.cwd,
      env: options.env,
      stdin: options.stdin ?? 'null',
      stdout: options.stdout ?? 'piped',
      stderr: options.stderr ?? 'piped',
    }).output();

    return {
      code: output.code,
      stdout: new TextDecoder().decode(output.stdout),
      stderr: new TextDecoder().decode(output.stderr),
    };
  }

  async spawn(
    args: readonly string[],
    options: AspireCommandOptions,
  ): Promise<number> {
    const child = new Deno.Command('aspire', {
      args: [...args],
      cwd: options.cwd,
      env: options.env,
      stdin: options.stdin ?? 'inherit',
      stdout: options.stdout ?? 'inherit',
      stderr: options.stderr ?? 'inherit',
    }).spawn();

    const status = await child.status;
    return status.code;
  }
}
