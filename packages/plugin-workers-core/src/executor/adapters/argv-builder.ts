import type { RuntimeCommandBuildContext, RuntimeCommandSpec } from './command-spec.ts';
import { allTaskArgs, requireEntrypoint, runtimeMetadata } from './command-spec.ts';
import { buildDenoPermissionFlags } from './permission-flags.ts';
import { resolveGitBashUtilPaths, resolveTaskEntrypoint } from './path-resolution.ts';

/** Build the command for a Deno task. */
export function buildDenoCommand(ctx: RuntimeCommandBuildContext): RuntimeCommandSpec {
  const task = ctx.task;
  const entrypoint = resolveTaskEntrypoint(
    requireEntrypoint(task),
    ctx.options.cwd || task.cwd,
    ctx.env,
  );
  const args = [
    'run',
    ...buildDenoPermissionFlags(task.permissions),
    ...(task.importMapUrl ? [`--import-map=${task.importMapUrl}`] : []),
    entrypoint,
    ...allTaskArgs(task, ctx.options),
  ];
  return { command: ctx.env('DENO_EXECUTABLE') ?? 'deno', args };
}

/** Build the command for a Python task. */
export function buildPythonCommand(ctx: RuntimeCommandBuildContext): RuntimeCommandSpec {
  const metadata = runtimeMetadata(ctx.task);
  const config = metadata.pythonConfig;
  const python = config?.pythonPath ??
    venvPython(config?.venvPath, ctx.os) ??
    ctx.env('NETSCRIPT_PYTHON_PATH') ??
    (ctx.os === 'windows' ? 'py' : 'python3');
  const entrypoint = resolveTaskEntrypoint(
    requireEntrypoint(ctx.task),
    ctx.options.cwd || ctx.task.cwd,
    ctx.env,
  );
  return { command: python, args: ['-u', entrypoint, ...allTaskArgs(ctx.task, ctx.options)] };
}

/** Build the command for a .NET task. */
export function buildDotNetCommand(ctx: RuntimeCommandBuildContext): RuntimeCommandSpec {
  const metadata = runtimeMetadata(ctx.task);
  const config = metadata.dotnetConfig;
  const entrypoint = resolveTaskEntrypoint(
    requireEntrypoint(ctx.task),
    ctx.options.cwd || ctx.task.cwd,
    ctx.env,
  );
  const runtimeArgs = config?.runtimeArgs ?? [];
  const taskArgs = allTaskArgs(ctx.task, ctx.options);

  if (entrypoint.endsWith('.cs')) {
    return {
      command: 'dotnet',
      args: ['run', entrypoint, ...separatorArgs(runtimeArgs), ...taskArgs],
    };
  }
  if (config?.useDotnetRun) {
    return {
      command: 'dotnet',
      args: ['run', '--project', entrypoint, ...separatorArgs(runtimeArgs), ...taskArgs],
    };
  }
  return { command: entrypoint, args: [...runtimeArgs, ...taskArgs] };
}

/** Build the command for a POSIX or Git Bash shell task. */
export function buildShellCommand(ctx: RuntimeCommandBuildContext): RuntimeCommandSpec {
  const config = runtimeMetadata(ctx.task).shellConfig;
  const shell = config?.shell ?? defaultShell(ctx.os);
  const entrypoint = resolveTaskEntrypoint(
    requireEntrypoint(ctx.task),
    ctx.options.cwd || ctx.task.cwd,
    ctx.env,
  );
  const args = [
    ...(config?.loginShell ? ['-l'] : []),
    entrypoint,
    ...allTaskArgs(ctx.task, ctx.options),
  ];
  const gitPaths = resolveGitBashUtilPaths(shell, ctx.os);
  if (gitPaths.length === 0) return { command: shell, args };
  const currentPath = ctx.options.env.PATH ?? ctx.env('PATH') ?? '';
  return { command: shell, args, env: { PATH: `${gitPaths.join(';')};${currentPath}` } };
}

/** Build the command for a PowerShell task. */
export function buildPowerShellCommand(ctx: RuntimeCommandBuildContext): RuntimeCommandSpec {
  const command = ctx.os === 'windows' ? 'powershell' : 'pwsh';
  const entrypoint = resolveTaskEntrypoint(
    requireEntrypoint(ctx.task),
    ctx.options.cwd || ctx.task.cwd,
    ctx.env,
  );
  return {
    command,
    args: [
      '-NoProfile',
      '-NonInteractive',
      '-ExecutionPolicy',
      'Bypass',
      '-File',
      entrypoint,
      ...allTaskArgs(ctx.task, ctx.options),
    ],
  };
}

/** Build the command for a Windows cmd task. */
export function buildCmdCommand(ctx: RuntimeCommandBuildContext): RuntimeCommandSpec {
  return {
    command: 'cmd.exe',
    args: ['/c', requireEntrypoint(ctx.task), ...allTaskArgs(ctx.task, ctx.options)],
  };
}

/** Build the command for a generic executable task. */
export function buildExecutableCommand(ctx: RuntimeCommandBuildContext): RuntimeCommandSpec {
  const entrypoint = resolveTaskEntrypoint(
    requireEntrypoint(ctx.task),
    ctx.options.cwd || ctx.task.cwd,
    ctx.env,
  );
  return { command: entrypoint, args: allTaskArgs(ctx.task, ctx.options) };
}

function venvPython(venvPath: string | undefined, os: typeof Deno.build.os): string | undefined {
  if (!venvPath) return undefined;
  return os === 'windows' ? `${venvPath}\\Scripts\\python.exe` : `${venvPath}/bin/python`;
}

function defaultShell(os: typeof Deno.build.os): string {
  return os === 'windows' ? 'bash' : '/bin/bash';
}

function separatorArgs(args: readonly string[]): readonly string[] {
  return args.length === 0 ? [] : ['--', ...args];
}
