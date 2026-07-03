/**
 * @module deploy/compile/compile-platform
 *
 * OS-generic helpers for the `deno compile` pipeline. Replaces the hardcoded
 * Windows-triple assumptions so the same compile machinery emits binaries for
 * the host OS (Windows `.exe` / Linux ELF) or any explicit cross-compile triple.
 */

/**
 * The default compile target triple — the host triple (`Deno.build.target`).
 * On a Windows host this is `x86_64-pc-windows-msvc` (byte-identical to the
 * previous hardcoded default); on Linux it resolves to the Linux triple.
 */
export function defaultCompileTarget(): string {
  return Deno.build.target;
}

/**
 * Executable file extension for a compile target triple. Windows targets get
 * `.exe`; every other target (Linux/macOS) has no extension.
 */
export function binaryExtensionForTarget(target: string): string {
  return target.includes('windows') ? '.exe' : '';
}
