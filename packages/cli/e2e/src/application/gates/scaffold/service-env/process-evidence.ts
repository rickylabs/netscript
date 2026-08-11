/**
 * @module
 *
 * Reads the environment of the **process the AppHost started**, out of the
 * operating system's own record of it.
 *
 * This is the evidence #1447 actually needs. `aspire describe` reports the
 * resource model — what the AppHost intends the process to have. It cannot
 * distinguish "the service received the value" from "the AppHost meant to send
 * it", and it cannot distinguish a service that is serving from one that read EOF
 * and exited successfully within a second, which is exactly what #1447 reported.
 * `/proc/<pid>/environ` is written by the kernel at exec time from the
 * environment the parent handed over; nothing in this repository can spoof it.
 *
 * A process is matched to a resource by two independent facts: its working
 * directory is the workdir the generated registration passed to `addExecutable`,
 * and its own environment carries `OTEL_SERVICE_NAME` equal to the resource name
 * — a value the AppHost injects, so a stray hand-started `deno run` in the same
 * directory does not qualify.
 *
 * Linux only, and deliberately loud about it: the CLI E2E suites run on
 * `ubuntu-latest` in CI and under WSL locally. On any other platform this throws
 * rather than degrading to a check that cannot fail.
 */

/** Environment of one running process. */
export interface ProcessEvidence {
  /** Process id it was read from. */
  readonly pid: number;
  /** The process's own environment, as the kernel recorded it at exec time. */
  readonly environment: ReadonlyMap<string, string>;
}

/** What the scan saw, so an empty result can name why it is empty. */
export interface ProcessScanDiagnostics {
  /** Numeric `/proc` entries examined. */
  readonly examined: number;
  /** Processes whose working directory matched the resource workdir. */
  readonly workdirMatches: number;
  /** Of those, processes whose own environment identified them as the resource. */
  readonly identified: number;
}

/** Result of scanning for a resource's processes. */
export interface ProcessScanResult {
  /** Processes positively identified as the resource, in pid order. */
  readonly processes: readonly ProcessEvidence[];
  /** How the scan arrived there. */
  readonly diagnostics: ProcessScanDiagnostics;
}

/** Key the AppHost injects with the resource name; used to identify a process. */
const RESOURCE_IDENTITY_KEY = 'OTEL_SERVICE_NAME';

/**
 * Parses the NUL-separated `environ` blob the kernel exposes for a process.
 *
 * @param raw - Raw bytes of `/proc/<pid>/environ`.
 * @returns Variable names mapped to values; later duplicates win, as `execve` does.
 */
export function parseProcessEnvironment(raw: Uint8Array): Map<string, string> {
  const environment = new Map<string, string>();
  for (const entry of new TextDecoder().decode(raw).split('\0')) {
    if (!entry) continue;
    const separator = entry.indexOf('=');
    if (separator <= 0) continue;
    environment.set(entry.slice(0, separator), entry.slice(separator + 1));
  }
  return environment;
}

/**
 * Whether a process's own environment identifies it as a resource's process.
 *
 * @param environment - The process environment.
 * @param resourceName - Resource name from the generated topology.
 */
export function identifiesResource(
  environment: ReadonlyMap<string, string>,
  resourceName: string,
): boolean {
  return environment.get(RESOURCE_IDENTITY_KEY) === resourceName;
}

/**
 * Scans `/proc` for the processes belonging to one resource.
 *
 * @param workdir - Absolute working directory the AppHost starts the process in.
 * @param resourceName - Resource name, matched against the injected identity key.
 * @returns Identified processes plus the counts behind that result.
 * @throws on a platform without `/proc`, so the gate can never quietly stop
 *   checking the one thing it exists to check.
 */
export async function scanResourceProcesses(
  workdir: string,
  resourceName: string,
): Promise<ProcessScanResult> {
  if (Deno.build.os !== 'linux') {
    throw new Error(
      `process-level environment evidence needs /proc, which ${Deno.build.os} does not provide. ` +
        'The CLI E2E suites run on Linux (ubuntu-latest in CI, WSL locally); this gate does not ' +
        'have a weaker fallback on purpose.',
    );
  }

  const expected = await Deno.realPath(workdir);
  const processes: ProcessEvidence[] = [];
  let examined = 0;
  let workdirMatches = 0;

  for await (const entry of Deno.readDir('/proc')) {
    const pid = Number(entry.name);
    if (!Number.isInteger(pid) || pid <= 0) continue;
    examined += 1;

    // A process that exits mid-scan, or one owned by another user, is not an
    // error: the scan is over every process on the machine.
    const cwd = await readLinkOrNull(`/proc/${pid}/cwd`);
    if (cwd === null || cwd !== expected) continue;
    workdirMatches += 1;

    const raw = await readFileOrNull(`/proc/${pid}/environ`);
    if (raw === null) continue;
    const environment = parseProcessEnvironment(raw);
    if (!identifiesResource(environment, resourceName)) continue;
    processes.push({ pid, environment });
  }

  return {
    processes: processes.toSorted((left, right) => left.pid - right.pid),
    diagnostics: { examined, workdirMatches, identified: processes.length },
  };
}

/**
 * Fails when the scan identified no process, naming what it did see.
 *
 * Separate from the scan so the empty case is a decision with a message rather
 * than an empty loop the caller iterates zero times.
 *
 * @param result - Scan result.
 * @param resourceName - Resource the scan was for.
 * @param workdir - Workdir the scan matched on.
 * @returns The identified processes, guaranteed non-empty.
 * @throws when nothing was identified.
 */
export function requireResourceProcesses(
  result: ProcessScanResult,
  resourceName: string,
  workdir: string,
): readonly ProcessEvidence[] {
  if (result.processes.length > 0) return result.processes;
  const { examined, workdirMatches } = result.diagnostics;
  throw new Error(
    `no running process could be identified as ${resourceName}: examined ${examined} processes, ` +
      `${workdirMatches} ran in ${workdir}, none carried ${RESOURCE_IDENTITY_KEY}=${resourceName}. ` +
      'Either the AppHost never started the resource, or it started and exited — which is the ' +
      '#1447 symptom, not a reason to pass.',
  );
}

async function readLinkOrNull(path: string): Promise<string | null> {
  try {
    return await Deno.readLink(path);
  } catch {
    return null;
  }
}

async function readFileOrNull(path: string): Promise<Uint8Array | null> {
  try {
    return await Deno.readFile(path);
  } catch {
    return null;
  }
}
