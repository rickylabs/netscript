import type {
  DockerResourceCleaner,
  DockerResourceSnapshot,
} from '../../ports/docker-resource-cleaner.ts';

const decoder = new TextDecoder();
const encoder = new TextEncoder();

type DockerCommandOutput = Pick<Deno.CommandOutput, 'code' | 'stdout' | 'stderr'>;
type DockerCommandRunner = (
  args: readonly string[],
  stdout: 'null' | 'piped',
) => Promise<DockerCommandOutput>;
type DockerWarningWriter = (message: string) => Promise<unknown>;

/** Docker CLI adapter that removes only containers created during a suite run. */
export class DockerCliResourceCleaner implements DockerResourceCleaner {
  constructor(
    private readonly runDocker: DockerCommandRunner = runDockerCommand,
    private readonly writeWarning: DockerWarningWriter = writeDockerWarning,
  ) {}

  async captureSnapshot(): Promise<DockerResourceSnapshot> {
    return { containerIds: await this.listContainers() };
  }

  async pruneCreatedResources(snapshot: DockerResourceSnapshot): Promise<readonly string[]> {
    const before = new Set(snapshot.containerIds);
    const current = await this.listContainers();
    const created = current.filter((id) => !before.has(id));
    for (const id of created) {
      const output = await this.runDocker(['rm', '-f', id], 'null');
      if (output.code !== 0) {
        const error = decoder.decode(output.stderr).trim();
        // `aspire stop` removes its own containers concurrently with this prune. Both
        // "already in progress" and "no such container" mean the container is gone or
        // going, which is exactly the state this cleaner exists to reach, so they are
        // successful cleanup observations rather than failures.
        if (!isAlreadyRemovedByAnotherActor(error)) {
          throw new Error(`docker rm -f ${id} failed${error ? `: ${error}` : '.'}`);
        }
      }
    }
    return created;
  }

  private async listContainers(): Promise<string[]> {
    let output: DockerCommandOutput;
    try {
      output = await this.runDocker(['ps', '-a', '--format', '{{.ID}}'], 'piped');
    } catch (error) {
      if (!(error instanceof Deno.errors.NotFound)) throw error;
      await this.writeWarning(
        'Warning: Docker cleanup could not inspect containers because the docker executable was not found; treating the container set as empty.',
      );
      return [];
    }
    if (output.code !== 0) {
      const error = decoder.decode(output.stderr).trim();
      await this.writeWarning(
        `Warning: Docker cleanup could not inspect containers because docker ps failed${
          error ? `: ${error}` : '.'
        } Treating the container set as empty.`,
      );
      return [];
    }
    return decoder.decode(output.stdout).split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  }
}

function runDockerCommand(
  args: readonly string[],
  stdout: 'null' | 'piped',
): Promise<DockerCommandOutput> {
  return new Deno.Command('docker', {
    args: [...args],
    stdout,
    stderr: 'piped',
  }).output();
}

function writeDockerWarning(message: string): Promise<number> {
  return Deno.stderr.write(encoder.encode(`${message}\n`));
}

/** True when the daemon reports the container is already gone or already being removed. */
function isAlreadyRemovedByAnotherActor(stderr: string): boolean {
  const normalized = stderr.toLowerCase();
  return /removal of container .* is already in progress/.test(normalized) ||
    normalized.includes('no such container');
}
