import { ASPIRE_DCP_APPHOST_PATH, ASPIRE_MOUNTS, pathContained } from './evidence/cleanup.ts';

/**
 * Read the log of one container this run owns, so a readiness receipt can quote the container's
 * own readiness announcement next to the health report it disagrees with (#863 gate 2, #1880).
 *
 * Ownership is proven the same way the post-stop probe proves it: the container's Aspire mounts
 * label (or `ASPIRE_DCP_APPHOST_PATH`) must resolve inside this run's project root. A container
 * without that proof is never read, let alone matched by image name alone — image names are shared
 * with every other run on the host.
 */

export interface OwnedContainerCandidate {
  readonly id: string;
  readonly image: string;
  readonly appHostSource?: string;
}

export interface OwnedContainerSelection {
  readonly id: string;
  readonly image: string;
}

/** Runs one Docker CLI invocation and returns its stdout+stderr; injectable for tests. */
export type DockerRunner = (args: readonly string[]) => Promise<string>;

/** Project the fields ownership selection needs out of one `docker inspect` record. */
export function toOwnedContainerCandidate(container: unknown): OwnedContainerCandidate | undefined {
  if (!container || typeof container !== 'object') return undefined;
  const id = Reflect.get(container, 'Id');
  const config = Reflect.get(container, 'Config');
  if (typeof id !== 'string' || !config || typeof config !== 'object') return undefined;
  const image = Reflect.get(config, 'Image');
  return {
    id,
    image: typeof image === 'string' ? image : '',
    appHostSource: appHostSourceOf(config),
  };
}

/**
 * Pick the single owned container whose image names the engine. Exactly one is required: zero
 * means the run has nothing to quote, more than one means ownership proof is ambiguous and the
 * receipt must not guess.
 */
export function selectOwnedContainer(
  candidates: readonly OwnedContainerCandidate[],
  projectRoot: string,
  imageNeedle: string,
): OwnedContainerSelection {
  const owned = candidates.filter((candidate) =>
    candidate.appHostSource !== undefined &&
    pathContained(candidate.appHostSource, projectRoot) &&
    candidate.image.toLowerCase().includes(imageNeedle.toLowerCase())
  );
  if (owned.length !== 1) {
    throw new Error(
      `expected exactly one owned ${imageNeedle} container under ${projectRoot}; found ` +
        `${owned.length}` +
        (owned.length
          ? ` (${owned.map((candidate) => candidate.id.slice(0, 12)).join(', ')})`
          : ''),
    );
  }
  return { id: owned[0].id, image: owned[0].image };
}

/** Read the tail of the owned engine container's log (Postgres announces readiness on stderr). */
export async function readOwnedContainerLog(
  projectRoot: string,
  imageNeedle: string,
  tailLines = 200,
  docker: DockerRunner = runDocker,
): Promise<{ readonly container: OwnedContainerSelection; readonly log: string }> {
  const ids = (await docker(['ps', '--quiet'])).split(/\s+/).filter(Boolean);
  if (ids.length === 0) {
    throw new Error('no running containers while reading an owned container log');
  }
  const parsed: unknown = JSON.parse(await docker(['inspect', ...ids]));
  if (!Array.isArray(parsed)) throw new Error('docker inspect did not return an array');
  const candidates = parsed
    .map(toOwnedContainerCandidate)
    .filter((candidate): candidate is OwnedContainerCandidate => candidate !== undefined);
  const container = selectOwnedContainer(candidates, projectRoot, imageNeedle);
  const log = await docker(['logs', '--tail', String(tailLines), container.id]);
  return { container, log };
}

function appHostSourceOf(config: object): string | undefined {
  const labels = Reflect.get(config, 'Labels');
  const mount = labels && typeof labels === 'object'
    ? Reflect.get(labels, ASPIRE_MOUNTS)
    : undefined;
  if (typeof mount === 'string') {
    const source = mount.match(/(?:^|,)src=([^,]+)(?:,|$)/)?.[1]?.trim();
    if (source) return source;
  }
  const environment = Reflect.get(config, 'Env');
  if (Array.isArray(environment)) {
    const entry = environment.find((value) =>
      typeof value === 'string' && value.startsWith(`${ASPIRE_DCP_APPHOST_PATH}=`)
    );
    if (typeof entry === 'string') return entry.slice(ASPIRE_DCP_APPHOST_PATH.length + 1);
  }
  return undefined;
}

async function runDocker(args: readonly string[]): Promise<string> {
  const output = await new Deno.Command('docker', {
    args: [...args],
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  const decoder = new TextDecoder();
  if (!output.success) {
    throw new Error(
      `docker ${args.join(' ')} failed (${output.code}): ${decoder.decode(output.stderr)}`,
    );
  }
  // `docker logs` replays the container's stderr on stderr; Postgres announces readiness there.
  return decoder.decode(output.stdout) + decoder.decode(output.stderr);
}
