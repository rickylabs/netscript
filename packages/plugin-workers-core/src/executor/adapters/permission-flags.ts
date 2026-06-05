import type { TaskPermissions } from '../../domain/mod.ts';

/** Build Deno permission flags from a task permissions object. */
export function buildDenoPermissionFlags(permissions?: TaskPermissions): readonly string[] {
  if (!permissions) return ['--allow-all'];
  const flags: string[] = [];

  pushPermission(flags, 'net', permissions.net);
  pushPermission(flags, 'read', permissions.read);
  pushPermission(flags, 'write', permissions.write);
  pushPermission(flags, 'env', permissions.env);
  pushPermission(flags, 'run', permissions.run);
  if (permissions.ffi) flags.push('--allow-ffi');
  if (permissions.import && permissions.import.length > 0) {
    flags.push(`--allow-import=${permissions.import.join(',')}`);
  }

  return flags;
}

function pushPermission(
  flags: string[],
  name: 'env' | 'net' | 'read' | 'run' | 'write',
  value: boolean | readonly string[] | undefined,
): void {
  if (value === true) {
    flags.push(`--allow-${name}`);
  } else if (Array.isArray(value) && value.length > 0) {
    flags.push(`--allow-${name}=${value.join(',')}`);
  }
}
