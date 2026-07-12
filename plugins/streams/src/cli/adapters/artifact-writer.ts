import { artifactText, type ScaffoldArtifact } from '@netscript/plugin/adapter';

/** Write text scaffold artifacts beneath a project root. */
export async function writeStreamArtifacts(
  workspaceRoot: string,
  artifacts: readonly ScaffoldArtifact[],
): Promise<readonly string[]> {
  const root = workspaceRoot.replaceAll('\\', '/').replace(/\/+$/, '');
  const written: string[] = [];
  for (const artifact of artifacts) {
    const relative = artifact.path.replaceAll('\\', '/');
    if (relative.startsWith('/') || relative.split('/').includes('..')) {
      throw new TypeError(`Unsafe stream scaffold path: ${artifact.path}`);
    }
    const target = `${root}/${relative}`;
    await Deno.mkdir(target.slice(0, target.lastIndexOf('/')), { recursive: true });
    await Deno.writeTextFile(target, artifactText(artifact));
    written.push(relative);
  }
  return written;
}
