import { fromFileUrl } from '@std/path';

/** Run a test child with host detection disabled while retaining its other environment. */
export function agentHostFreeDenoArgs(args: readonly string[]): string[] {
  return ['run', '--no-lock', '-A', fromFileUrl(import.meta.url), ...args];
}

if (import.meta.main) {
  const env = Deno.env.toObject();
  for (const name of Object.keys(env)) {
    if (
      name === 'CLAUDECODE' || name === 'OPENCODE' || name === 'TERM_PROGRAM' ||
      name === 'ZED_TERM' || /^(OPENCODE_|VSCODE_|CURSOR_)/.test(name)
    ) delete env[name];
  }
  const child = new Deno.Command(Deno.execPath(), {
    args: Deno.args,
    env,
    clearEnv: true,
    stdin: 'inherit',
    stdout: 'inherit',
    stderr: 'inherit',
  }).spawn();
  Deno.exit((await child.status).code);
}
