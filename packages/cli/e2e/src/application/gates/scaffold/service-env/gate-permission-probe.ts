/**
 * @module
 *
 * Reports what a process launched with a given permission set can actually do.
 *
 * A gate command's `--allow-*` flags are a claim, and before #1449 nothing
 * checked the claim. `BEHAVIOR_SERVICE_ENV` was registered with `--allow-read`,
 * every unit test of the `/proc` reader passed — the test runner holds
 * `--allow-all`, so the reader was never exercised under the gate's own
 * permissions — and the mismatch surfaced only as a `NotCapable` after the full
 * `scaffold.runtime` suite had already spent an hour getting an AppHost running.
 *
 * `service-env-gates_test.ts` launches this module with the flags taken out of
 * the real gate command, so narrowing or dropping one fails a second-long test
 * instead of the suite.
 *
 * The probe never decides what is sufficient; it only reports. The caller says
 * which capabilities to exercise and asserts on the result, so this module
 * cannot quietly degrade into a check that passes on any input.
 */

import { scanResourceProcesses } from './process-evidence.ts';

/** Every permission unit Deno grants; `/proc` access requires all of them, unscoped. */
export const PERMISSION_UNITS = [
  'read',
  'write',
  'net',
  'env',
  'run',
  'sys',
  'ffi',
  'import',
] as const;

/** One of Deno's permission units. */
export type PermissionUnit = typeof PERMISSION_UNITS[number];

/** The executables the #1447 gate scripts spawn. */
export const SPAWNED_EXECUTABLES = ['deno', 'aspire'] as const;

/** An executable a gate script spawns. */
export type SpawnedExecutable = typeof SPAWNED_EXECUTABLES[number];

/** Argument that asks the probe to exercise `/proc` rather than only report grants. */
export const SCAN_PROC = 'scan-proc';

/** What one probe run observed about the permissions it was launched with. */
export interface GatePermissionReport {
  /** Grant state of each permission unit, queried unscoped. */
  readonly units: Readonly<Record<PermissionUnit, Deno.PermissionState>>;
  /** Grant state for spawning each executable the gate scripts use. */
  readonly commands: Readonly<Record<SpawnedExecutable, Deno.PermissionState>>;
  /**
   * `/proc` entries the real scanner enumerated, or `null` when the caller did
   * not ask for a scan. A number here proves the scan ran to completion — a scan
   * the permission set does not allow throws before this field is built.
   */
  readonly examined: number | null;
}

/** Resource name nothing is called, so the scan enumerates without matching. */
const UNMATCHED_RESOURCE = 'no-aspire-resource-is-named-this';

/**
 * Queries the grant state of every permission unit and every spawnable executable.
 *
 * The two records are written out key by key rather than folded from the
 * constant lists: the declared return types then make the compiler, not a cast,
 * responsible for keeping them exhaustive.
 *
 * @returns The census; querying a permission neither prompts nor throws.
 */
export function censusPermissions(): Pick<GatePermissionReport, 'units' | 'commands'> {
  return {
    units: {
      read: unitState('read'),
      write: unitState('write'),
      net: unitState('net'),
      env: unitState('env'),
      run: unitState('run'),
      sys: unitState('sys'),
      ffi: unitState('ffi'),
      import: unitState('import'),
    },
    commands: {
      deno: commandState('deno'),
      aspire: commandState('aspire'),
    },
  };
}

function unitState(name: PermissionUnit): Deno.PermissionState {
  return Deno.permissions.querySync({ name }).state;
}

function commandState(command: SpawnedExecutable): Deno.PermissionState {
  return Deno.permissions.querySync({ name: 'run', command }).state;
}

if (import.meta.main) {
  const report: GatePermissionReport = {
    ...censusPermissions(),
    // Deliberately unguarded: when the caller asks for a scan, a permission the
    // gate failed to declare must surface as this process exiting non-zero with
    // Deno's own `NotCapable` message, not as a field the test has to interpret.
    examined: Deno.args.includes(SCAN_PROC)
      ? (await scanResourceProcesses(Deno.cwd(), UNMATCHED_RESOURCE)).diagnostics.examined
      : null,
  };
  console.log(JSON.stringify(report));
}
