import type { DockerContainerInfo } from '../../domain/infrastructure-config.ts';

// ============================================================================
// DOCKER DETECTION
// ============================================================================

/**
 * Extract host port and password from a running Docker container.
 * Used when Aspire starts database containers and we need to connect.
 *
 * @param containerName - Full Docker container name (e.g., "test-app-postgres-...")
 * @param containerPort - Internal container port (e.g., 5432)
 * @param passwordEnvVar - Environment variable inside the container that holds the password
 */
export async function inspectDockerContainer(
  containerName: string,
  containerPort: number,
  passwordEnvVar: string,
): Promise<DockerContainerInfo | null> {
  try {
    const inspectCmd = new Deno.Command('docker', {
      args: ['inspect', containerName],
      stdin: 'null',
      stdout: 'piped',
      stderr: 'null',
    });
    const { success, stdout } = await inspectCmd.output();
    if (!success) return null;

    const info = JSON.parse(new TextDecoder().decode(stdout));
    if (!Array.isArray(info) || info.length === 0) return null;

    const container = info[0];

    // Extract host port mapping
    const portBindings = container.NetworkSettings?.Ports ?? {};
    const portKey = `${containerPort}/tcp`;
    const bindings = portBindings[portKey] as
      | Array<{ HostIp: string; HostPort: string }>
      | undefined;
    const hostPort = bindings?.[0]?.HostPort ? parseInt(bindings[0].HostPort, 10) : null;
    if (!hostPort) return null;

    // Extract password from container environment
    const env = container.Config?.Env as string[] ?? [];
    let password: string | undefined;
    for (const entry of env) {
      if (entry.startsWith(`${passwordEnvVar}=`)) {
        password = entry.slice(passwordEnvVar.length + 1);
        break;
      }
    }

    return { hostPort, password };
  } catch {
    return null;
  }
}

/**
 * Find a running Docker container by base name prefix.
 * Aspire names containers with a suffix like: `test-app-postgres-1a2b3c`.
 *
 * @param baseName - Base name to search for (e.g., "postgres", "garnet")
 */
export async function findAspireContainer(baseName: string): Promise<string | null> {
  try {
    const listCmd = new Deno.Command('docker', {
      args: ['ps', '--format', '{{.Names}}'],
      stdin: 'null',
      stdout: 'piped',
      stderr: 'null',
    });
    const { success, stdout } = await listCmd.output();
    if (!success) return null;

    const lines = new TextDecoder().decode(stdout).trim().split('\n');
    const projectName = Deno.env.get('COMPOSE_PROJECT_NAME') ?? 'test-app';
    const pattern = `${projectName}-${baseName}`;

    for (const line of lines) {
      if (line.includes(pattern)) return line.trim();
    }
    return null;
  } catch {
    return null;
  }
}
