import type {
  DockerResourceCleaner,
  DockerResourceSnapshot,
} from '../../ports/docker-resource-cleaner.ts';

const decoder = new TextDecoder();

/** Docker CLI adapter that removes only containers created during a suite run. */
export class DockerCliResourceCleaner implements DockerResourceCleaner {
  async captureSnapshot(): Promise<DockerResourceSnapshot> {
    return { containerIds: await listContainers() };
  }

  async pruneCreatedResources(snapshot: DockerResourceSnapshot): Promise<readonly string[]> {
    const before = new Set(snapshot.containerIds);
    const current = await listContainers();
    const created = current.filter((id) => !before.has(id));
    for (const id of created) {
      const output = await new Deno.Command('docker', {
        args: ['rm', '-f', id],
        stdout: 'null',
        stderr: 'piped',
      }).output();
      if (output.code !== 0) {
        const error = decoder.decode(output.stderr).trim();
        throw new Error(`docker rm -f ${id} failed${error ? `: ${error}` : '.'}`);
      }
    }
    return created;
  }
}

async function listContainers(): Promise<string[]> {
  const output = await new Deno.Command('docker', {
    args: ['ps', '-a', '--format', '{{.ID}}'],
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  if (output.code !== 0) {
    const error = decoder.decode(output.stderr).trim();
    throw new Error(`docker ps failed${error ? `: ${error}` : '.'}`);
  }
  return decoder.decode(output.stdout).split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}
