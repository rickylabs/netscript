const LOCKED_VITE_PREFIX = [
  'run',
  '--frozen',
  '--cached-only',
  '-A',
  'vite',
] as const;

/** Options for a Vite fixture process resolved from the locked Fresh workspace graph. */
export interface LockedViteCommandOptions {
  readonly args: readonly string[];
  readonly cwd: string;
  readonly stdout?: 'inherit' | 'piped' | 'null';
  readonly stderr?: 'inherit' | 'piped' | 'null';
  readonly env?: Readonly<Record<string, string>>;
}

/** Create a Vite command that cannot resolve a toolchain from the registry at test runtime. */
export function createLockedViteCommand(options: LockedViteCommandOptions): Deno.Command {
  return new Deno.Command(Deno.execPath(), {
    args: [...LOCKED_VITE_PREFIX, ...options.args],
    cwd: options.cwd,
    stdout: options.stdout,
    stderr: options.stderr,
    env: options.env,
  });
}
