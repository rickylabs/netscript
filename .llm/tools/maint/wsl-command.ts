// Shell-free command plans for maintainer tools that act on a WSL account (for example
// `maint:gh-token store`). Everything runs through `Deno.Command(bin, { args })`, an argv array
// no shell parses, so `<`, `>` and `$(...)` inside a script stay inert. On Linux the "WSL" user
// must be the current account; elsewhere the plan goes through `wsl.exe -u <user>`.

export interface CommandResult {
  code: number;
  stdout: string;
  stderr: string;
}

/** A shell-free process invocation that can be executed with `Deno.Command`. */
export interface CommandPlan {
  bin: string;
  args: string[];
  cwd?: string;
}

/** Resolve the current account name without making `--allow-env` mandatory. */
export function currentUsername(): string | null {
  for (const name of ['USER', 'LOGNAME', 'USERNAME']) {
    try {
      const value = Deno.env.get(name)?.trim();
      if (value) return value;
    } catch {
      break;
    }
  }
  try {
    const uid = String(Deno.uid());
    const passwd = Deno.readTextFileSync('/etc/passwd');
    for (const line of passwd.split('\n')) {
      const fields = line.split(':');
      if (fields[2] === uid) return fields[0] || null;
    }
  } catch {
    // A clear diagnostic is produced by buildWslCommand when identity is unavailable.
  }
  return null;
}

/** Build the host-specific argv for a WSL-targeted script without spawning it. */
export function buildWslCommand(
  user: string,
  script: string,
  opts: { cwd?: string; os?: string; currentUser?: string | null } = {},
): CommandPlan {
  const os = opts.os ?? Deno.build.os;
  if (os !== 'linux') {
    return {
      bin: 'wsl.exe',
      args: [
        '-u',
        user,
        ...(opts.cwd ? ['--cd', opts.cwd] : []),
        '--',
        'bash',
        '-lc',
        script,
      ],
    };
  }

  const actual = opts.currentUser;
  if (!actual) {
    throw new Error(
      `Cannot run WSL command locally for requested user ${JSON.stringify(user)}: ` +
        'the current Linux user could not be determined.',
    );
  }
  if (user !== actual) {
    throw new Error(
      `Cannot run WSL command locally as requested user ${JSON.stringify(user)}; ` +
        `the current Linux user is ${JSON.stringify(actual)}. ` +
        'Run as the requested user or pass the matching --user/NETSCRIPT_WSL_USER value.',
    );
  }
  return { bin: 'bash', args: ['-lc', script], cwd: opts.cwd };
}

/** Resolve local identity when needed, then build the host-specific command plan. */
export async function resolveWslCommand(
  user: string,
  script: string,
  opts: { cwd?: string; os?: string } = {},
): Promise<CommandPlan> {
  const os = opts.os ?? Deno.build.os;
  if (os !== 'linux') return buildWslCommand(user, script, { ...opts, os });

  let actual = currentUsername();
  if (!actual) {
    try {
      const result = await runBin('id', ['-un']);
      if (result.code === 0 && result.stdout) actual = result.stdout;
    } catch {
      // buildWslCommand supplies the clear identity diagnostic below.
    }
  }
  return buildWslCommand(user, script, { ...opts, os, currentUser: actual });
}

/** Render a command plan for diagnostics without invoking a shell. */
export function renderCommandPlan(plan: CommandPlan): string {
  const command = [plan.bin, ...plan.args].map((part) => JSON.stringify(part)).join(' ');
  return plan.cwd ? `(cwd=${JSON.stringify(plan.cwd)}) ${command}` : command;
}

/**
 * Run an arbitrary binary via Deno.Command (argv array — no shell parsing).
 * Returns trimmed decoded stdout/stderr and the exit code.
 */
export async function runBin(
  bin: string,
  args: string[],
  opts: { cwd?: string } = {},
): Promise<CommandResult> {
  const out = await new Deno.Command(bin, {
    args,
    cwd: opts.cwd,
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  const dec = new TextDecoder();
  return {
    code: out.code,
    stdout: dec.decode(out.stdout).trim(),
    stderr: dec.decode(out.stderr).trim(),
  };
}
