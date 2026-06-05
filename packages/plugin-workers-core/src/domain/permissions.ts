import type { TaskPermissions } from './task.ts';

/** Permission preset compatible with Deno task permissions. */
export type PermissionPreset = TaskPermissions;

/** Worker permission presets for common task and job execution modes. */
export type PermissionPresets = Readonly<{
  minimal: PermissionPreset;
  none: PermissionPreset;
  network: PermissionPreset;
  filesystem: PermissionPreset;
  readOnly: PermissionPreset;
  subprocess: PermissionPreset;
  full: PermissionPreset;
  allAccess: PermissionPreset;
}>;

/** Worker permission presets for common task and job execution modes. */
export const permissions = {
  minimal: {
    net: false,
    read: false,
    write: false,
    env: true,
    run: false,
    ffi: false,
  },
  network: {
    net: true,
    read: false,
    write: false,
    env: true,
    run: false,
    ffi: false,
  },
  filesystem: {
    net: false,
    read: true,
    write: true,
    env: true,
    run: false,
    ffi: false,
  },
  readOnly: {
    net: false,
    read: true,
    write: false,
    env: true,
    run: false,
    ffi: false,
  },
  full: {
    net: true,
    read: true,
    write: true,
    env: true,
    run: true,
    ffi: false,
  },
  allAccess: {
    net: true,
    read: true,
    write: true,
    env: true,
    run: true,
    ffi: true,
  },
  none: {
    net: false,
    read: false,
    write: false,
    env: true,
    run: false,
    ffi: false,
  },
  subprocess: {
    net: false,
    read: false,
    write: false,
    env: true,
    run: true,
    ffi: false,
  },
} as const;

/** Create a custom permission preset. */
export function createPermissionPreset(overrides: Partial<PermissionPreset>): PermissionPreset {
  return {
    ...permissions.minimal,
    ...overrides,
  };
}

/** Merge multiple permission presets with most-permissive semantics. */
export function mergePermissions(...presets: PermissionPreset[]): PermissionPreset {
  const result: PermissionPreset = {
    net: false,
    read: false,
    write: false,
    env: false,
    run: false,
    ffi: false,
  };

  for (const preset of presets) {
    result.net = mergePermissionField(result.net, preset.net);
    result.read = mergePermissionField(result.read, preset.read);
    result.write = mergePermissionField(result.write, preset.write);
    result.env = mergePermissionField(result.env, preset.env);
    result.run = mergePermissionField(result.run, preset.run);
    result.ffi = result.ffi || preset.ffi;
  }

  return result;
}

function mergePermissionField(
  left: boolean | string[],
  right: boolean | string[],
): boolean | string[] {
  if (left === true || right === true) return true;
  if (left === false && right === false) return false;
  if (Array.isArray(left) && Array.isArray(right)) return [...new Set([...left, ...right])];
  if (Array.isArray(left)) return left;
  if (Array.isArray(right)) return right;
  return false;
}
