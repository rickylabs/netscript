/**
 * Platform constants shared by CLI command modes.
 */

/** Operating systems supported by the CLI. */
export const SUPPORTED_PLATFORMS = ['windows', 'linux', 'darwin'] as const;

/** Supported operating system identifier. */
export type SupportedPlatform = typeof SUPPORTED_PLATFORMS[number];

/** Windows service deployment target triple. */
export const WINDOWS_COMPILE_TARGET = 'x86_64-pc-windows-msvc';
