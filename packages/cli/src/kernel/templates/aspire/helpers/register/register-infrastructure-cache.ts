/** @module Cache registration helpers extracted from `generate-register-infrastructure.ts` (F-1). */

import type { CacheEntry } from '@netscript/aspire/types';
import { SCAFFOLD_VERSIONS } from '../../../../constants/scaffold/scaffold-versions.ts';
import { SCAFFOLD_CACHE_CONTAINER_IMAGES } from '../../../../constants/scaffold/scaffold-container-images.ts';

const CACHE_DEFAULT_PORT = 6379;
const GARNET_LEASE_ARGS = ['--lua', '--lua-transaction-mode'] as const;
const GARNET_PERSISTENCE_ARGS = [
  '--aof',
  '--recover',
  '--aof-commit-freq',
  '0',
  '--aof-commit-wait',
  '--storage-tier',
  '--device-type',
  'FileStream',
] as const;
const DENOKV_CONTAINER = { image: 'ghcr.io/denoland/denokv', tag: '0.11.0' } as const;
const DENOKV_HTTP_PORT = 4512;

/** Rendered lines and `CacheWiring` literal expression for one cache branch. */
export interface CacheSetupEmission {
  readonly lines: string[];
  readonly wiring: string;
}

/** Emits DenoKv Connect container setup lines (Container and Auto-Docker branches). */
export function denokvContainerSetup(
  id: string,
  name: string,
  entry: CacheEntry,
): CacheSetupEmission {
  const imageRef = `${DENOKV_CONTAINER.image}:${entry.ImageTag ?? DENOKV_CONTAINER.tag}`;
  const lines: string[] = [
    `  const ${id}_token = _generateAccessToken();`,
    `  const ${id} = await builder.addContainer(${JSON.stringify(name)}, ${
      JSON.stringify(imageRef)
    })`,
    `    .withEndpoint({ name: 'http', targetPort: ${DENOKV_HTTP_PORT}, scheme: 'http' })`,
    `    .withContainerRuntimeArgs(['--init'])`,
    `    .withArgs(['--sqlite-path', '/data/denokv.sqlite', 'serve'])`,
    `    .withEnvironment('DENO_KV_ACCESS_TOKEN', ${id}_token)`,
  ];
  if (entry.DataPath) {
    lines.push(
      `    .withBindMount(resolveDataPath(appHostDir, ${JSON.stringify(entry.DataPath)}, ${
        JSON.stringify(name)
      }), '/data')`,
    );
  }
  lines[lines.length - 1] += ';';
  lines.push(
    `  const ${id}_httpEndpoint = await ${id}.getEndpoint('http');`,
    `  const ${id}_httpUrl = ${id}_httpEndpoint.property(EndpointProperty.Url);`,
    `  caches.set(${JSON.stringify(name)}, ${id});`,
    `  cacheEndpoints.set(${JSON.stringify(name)}, ${id}_httpEndpoint);`,
  );
  const wiring =
    `{ resource: ${id}, reference: ${id}_httpEndpoint, env: { DENO_KV_URL: ${id}_httpUrl, DENO_KV_ACCESS_TOKEN: ${id}_token, CACHE_PROVIDER: 'denokv' }, local: false }`;
  return { lines, wiring };
}

/** Emits Garnet executable setup lines (Executable and Auto-fallback branches). */
export function garnetExecutableSetup(
  id: string,
  name: string,
  entry: CacheEntry,
): CacheSetupEmission {
  const version = entry.ToolVersion ?? SCAFFOLD_VERSIONS.GARNET_TOOL;
  const lines: string[] = [
    `  const ${id}_workdir = ensureGarnetToolManifest(appHostDir, ${JSON.stringify(version)});`,
  ];
  if (entry.DataPath) {
    lines.push(
      `  const ${id}_dataPath = resolveDataPath(appHostDir, ${JSON.stringify(entry.DataPath)}, ${
        JSON.stringify(name)
      });`,
    );
  }
  lines.push(
    `  const ${id} = await builder.addExecutable(${
      JSON.stringify(name)
    }, 'dotnet', ${id}_workdir, ['tool', 'run', 'garnet-server'])`,
    `    .withEndpoint(${cacheExecutableEndpointOptions(entry.Port)});`,
    `  const ${id}_tcpEndpoint = await ${id}.getEndpoint('tcp');`,
    `  await ${id}.withArgsCallback(async (context) => {`,
    `    const args = await context.args();`,
    `    await args.add('--port');`,
    `    await args.add(${id}_tcpEndpoint.property(EndpointProperty.TargetPort));`,
  );
  const args = [...GARNET_LEASE_ARGS, ...(entry.DataPath ? GARNET_PERSISTENCE_ARGS : [])];
  for (const arg of args) lines.push(`    await args.add(${JSON.stringify(arg)});`);
  if (entry.DataPath) {
    for (const flag of ['--logdir', '--checkpointdir']) {
      lines.push(`    await args.add(${JSON.stringify(flag)});`);
      lines.push(`    await args.add(${id}_dataPath);`);
    }
  }
  lines.push(
    `  });`,
    `  const ${id}_hostPort = ${id}_tcpEndpoint.property(EndpointProperty.HostAndPort);`,
  );
  if (['Redis', 'Garnet'].includes(entry.Engine)) appendRespReadinessLines(lines, id, name, false);
  lines.push(
    `  caches.set(${JSON.stringify(name)}, ${id});`,
    `  cacheEndpoints.set(${JSON.stringify(name)}, ${id}_tcpEndpoint);`,
  );
  const wiring =
    `{ resource: ${id}, reference: ${id}_tcpEndpoint, env: { GARNET_URI: ${id}_hostPort, REDIS_URI: ${id}_hostPort, CACHE_PROVIDER: 'garnet' }, local: false }`;
  return { lines, wiring };
}

/** Emits Redis/Garnet container setup lines (Container and Auto-Docker branches). */
export function redisGarnetContainerSetup(
  id: string,
  name: string,
  entry: CacheEntry,
): CacheSetupEmission {
  const image = SCAFFOLD_CACHE_CONTAINER_IMAGES[entry.Engine] ??
    SCAFFOLD_CACHE_CONTAINER_IMAGES.Redis;
  const imageRef = `${image.image}:${entry.ImageTag ?? image.tag}`;
  const provider = entry.Engine === 'Garnet' ? 'garnet' : 'redis';
  const hasGarnetDataPath = entry.Engine === 'Garnet' && Boolean(entry.DataPath);
  const lines: string[] = [];
  if (hasGarnetDataPath) {
    lines.push(
      `  const ${id}_dataPath = ensureContainerDataPath(resolveDataPath(appHostDir, ${
        JSON.stringify(entry.DataPath)
      }, ${JSON.stringify(name)}));`,
      `  const ${id}_runtimeArgs = resolveContainerBindMountRuntimeArgs();`,
    );
  }
  lines.push(
    `  const ${id} = await builder.addContainer(${JSON.stringify(name)}, ${
      JSON.stringify(imageRef)
    })`,
    `    .withEndpoint(${cacheEndpointOptions(entry.Port)})`,
  );
  if (entry.Engine === 'Garnet') {
    const args = entry.DataPath
      ? [
        ...GARNET_LEASE_ARGS,
        ...GARNET_PERSISTENCE_ARGS,
        '--logdir',
        '/data',
        '--checkpointdir',
        '/data',
      ]
      : GARNET_LEASE_ARGS;
    lines.push(`    .withArgs(${JSON.stringify(args)})`);
  }
  if (entry.DataPath) {
    lines.push(
      hasGarnetDataPath
        ? `    .withBindMount(${id}_dataPath, '/data')`
        : `    .withBindMount(resolveDataPath(appHostDir, ${JSON.stringify(entry.DataPath)}, ${
          JSON.stringify(name)
        }), '/data')`,
    );
  }
  lines[lines.length - 1] += ';';
  if (hasGarnetDataPath) {
    lines.push(
      `  if (${id}_runtimeArgs.length > 0) {`,
      `    await ${id}.withContainerRuntimeArgs(${id}_runtimeArgs);`,
      `  }`,
    );
  }
  lines.push(
    `  const ${id}_tcpEndpoint = await ${id}.getEndpoint('tcp');`,
    `  const ${id}_hostPort = ${id}_tcpEndpoint.property(EndpointProperty.HostAndPort);`,
  );
  if (['Redis', 'Garnet'].includes(entry.Engine)) appendRespReadinessLines(lines, id, name, true);
  lines.push(
    `  caches.set(${JSON.stringify(name)}, ${id});`,
    `  cacheEndpoints.set(${JSON.stringify(name)}, ${id}_tcpEndpoint);`,
  );
  const wiring =
    `{ resource: ${id}, reference: ${id}_tcpEndpoint, env: { GARNET_URI: ${id}_hostPort, REDIS_URI: ${id}_hostPort, CACHE_PROVIDER: ${
      JSON.stringify(provider)
    } }, local: false }`;
  return { lines, wiring };
}

function appendRespReadinessLines(
  lines: string[],
  id: string,
  name: string,
  containerBacked: boolean,
): void {
  const healthCheckKey = `${name}_resp`;
  const checkOptions = containerBacked ? '{ host, port, containerBacked: true }' : '{ host, port }';
  lines.push(
    `  builder.addHealthCheck(${JSON.stringify(healthCheckKey)}, async () => {`,
    `    const endpoint = await ${id}.getEndpoint('tcp');`,
    `    const host = await endpoint.host();`,
    `    const port = await endpoint.port();`,
    `    return createRespPingCheck(${checkOptions})();`,
    `  });`,
    `  await ${id}.withHealthCheck(${JSON.stringify(healthCheckKey)});`,
  );
}

function cacheEndpointOptions(port: number | undefined): string {
  const options = ["name: 'tcp'", `targetPort: ${CACHE_DEFAULT_PORT}`, "scheme: 'tcp'"];
  if (port !== undefined) options.unshift(`port: ${port}`);
  return `{ ${options.join(', ')} }`;
}

function cacheExecutableEndpointOptions(port: number | undefined): string {
  const options = ["name: 'tcp'", "scheme: 'tcp'"];
  if (port !== undefined) options.unshift(`port: ${port}`);
  return `{ ${options.join(', ')} }`;
}
