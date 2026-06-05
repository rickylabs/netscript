/**
 * @module infra/platform
 *
 * Platform detection and privilege utilities for the NetScript CLI.
 *
 * Centralizes OS checks and admin detection so command modules
 * don't duplicate this logic. All functions are side-effect-free
 * (no process exit, no console output) — callers decide what to do
 * with the results.
 */

// ============================================================================
// OS DETECTION
// ============================================================================

/**
 * Whether the current platform is Windows.
 */
export function isWindows(): boolean {
  return Deno.build.os === 'windows';
}

/**
 * Whether the current platform is macOS.
 */
export function isMacOS(): boolean {
  return Deno.build.os === 'darwin';
}

/**
 * Whether the current platform is Linux.
 */
export function isLinux(): boolean {
  return Deno.build.os === 'linux';
}

/**
 * The current OS as a human-readable string.
 */
export function osName(): string {
  switch (Deno.build.os) {
    case 'windows':
      return 'Windows';
    case 'darwin':
      return 'macOS';
    case 'linux':
      return 'Linux';
    default:
      return Deno.build.os;
  }
}

/**
 * The CPU architecture of the current platform.
 */
export function arch(): string {
  return Deno.build.arch;
}

// ============================================================================
// ADMIN / PRIVILEGE DETECTION
// ============================================================================

/**
 * Check whether the current process has Windows administrator privileges.
 *
 * Uses `net session` which only succeeds under an elevated prompt.
 * Returns `false` on non-Windows platforms (no concept of "admin" in the
 * Windows sense — use `isRoot()` for Unix).
 */
export async function isAdmin(): Promise<boolean> {
  if (!isWindows()) return false;
  try {
    const cmd = new Deno.Command('net', {
      args: ['session'],
      stdin: 'null',
      stdout: 'null',
      stderr: 'null',
    });
    const { success } = await cmd.output();
    return success;
  } catch {
    return false;
  }
}

/**
 * Check whether the current process is running as root (Unix).
 * Always returns `false` on Windows.
 */
export async function isRoot(): Promise<boolean> {
  if (isWindows()) return false;
  try {
    const cmd = new Deno.Command('id', {
      args: ['-u'],
      stdin: 'null',
      stdout: 'piped',
      stderr: 'null',
    });
    const { success, stdout } = await cmd.output();
    if (!success) return false;
    const uid = new TextDecoder().decode(stdout).trim();
    return uid === '0';
  } catch {
    return false;
  }
}

/**
 * Check whether the current process has elevated privileges
 * (admin on Windows, root on Unix).
 */
export async function isElevated(): Promise<boolean> {
  return isWindows() ? await isAdmin() : await isRoot();
}

// ============================================================================
// EXECUTABLE DETECTION
// ============================================================================

/**
 * Check whether an executable exists at the given path.
 */
export async function executableExists(path: string): Promise<boolean> {
  try {
    const stat = await Deno.stat(path);
    return stat.isFile;
  } catch {
    return false;
  }
}

/**
 * Check whether a command is available on the system PATH.
 * Uses `where` on Windows and `which` on Unix.
 */
export async function commandExists(name: string): Promise<boolean> {
  try {
    const whichCmd = isWindows() ? 'where' : 'which';
    const cmd = new Deno.Command(whichCmd, {
      args: [name],
      stdin: 'null',
      stdout: 'null',
      stderr: 'null',
    });
    const { success } = await cmd.output();
    return success;
  } catch {
    return false;
  }
}

// ============================================================================
// PATH HELPERS
// ============================================================================

/**
 * Whether the current executable is a compiled binary (deno compile output)
 * rather than a script being run by `deno run`.
 *
 * Compiled binaries have `Deno.mainModule` pointing to a `file:///` URL
 * whose path matches `Deno.execPath()`. Script mode has `Deno.execPath()`
 * pointing to the deno binary itself.
 */
export function isCompiledBinary(): boolean {
  try {
    const execPath = Deno.execPath();
    const execName = execPath.split(/[\\/]/).pop()?.toLowerCase() ?? '';
    // When running via `deno run`, the executable is `deno` or `deno.exe`.
    // When compiled, it's the application binary name.
    return !execName.startsWith('deno');
  } catch {
    return false;
  }
}

/**
 * Get the directory containing the current executable.
 * Useful for compiled binaries to locate sibling files.
 */
export function executableDir(): string {
  const execPath = Deno.execPath();
  const lastSep = Math.max(execPath.lastIndexOf('/'), execPath.lastIndexOf('\\'));
  return lastSep >= 0 ? execPath.substring(0, lastSep) : '.';
}

// ============================================================================
// ENVIRONMENT HELPERS
// ============================================================================

/**
 * Get the value of `%LOCALAPPDATA%` on Windows.
 * Returns `undefined` on non-Windows platforms or if the variable is not set.
 */
export function localAppData(): string | undefined {
  if (!isWindows()) return undefined;
  return Deno.env.get('LOCALAPPDATA');
}

/**
 * Get the value of `%PROGRAMFILES%` on Windows.
 * Returns `undefined` on non-Windows platforms or if the variable is not set.
 */
export function programFiles(): string | undefined {
  if (!isWindows()) return undefined;
  return Deno.env.get('ProgramFiles');
}

/**
 * Resolve the default installation directory for a NetScript application.
 *
 * Priority:
 *   1. Explicit `installDir` argument
 *   2. `%LOCALAPPDATA%\NetScript\{name}`
 *   3. `C:\NetScript\{name}`
 */
export function resolveInstallDir(name: string, installDir?: string): string {
  if (installDir) return installDir;
  const appData = localAppData();
  if (appData) return `${appData}\\NetScript\\${name}`;
  return `C:\\NetScript\\${name}`;
}
