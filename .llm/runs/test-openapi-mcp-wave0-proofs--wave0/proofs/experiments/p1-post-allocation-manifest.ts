import { mkdir, realpath, rename, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';

interface EndpointReferenceLike {
  exists(): Promise<boolean>;
  getValueAsync(): Promise<string>;
  host(): Promise<string>;
  isAllocated(): Promise<boolean>;
  port(): Promise<number>;
  scheme(): Promise<string>;
}

interface ExecutableResourceLike {
  getEndpoint(name: string): EndpointReferenceLike;
  onResourceEndpointsAllocated(
    callback: () => Promise<void>,
  ): PromiseLike<ExecutableResourceLike>;
}

type AddExecutable = (
  name: string,
  command: string,
  workingDirectory: string,
  args: string[],
) => ExecutableResourceLike;

interface BuilderLike {
  addExecutable: AddExecutable;
  appHostDirectory(): Promise<string>;
}

interface EndpointManifestEntry {
  readonly service: string;
  readonly endpoint: string;
  readonly url: string;
  readonly scheme: string;
  readonly host: string;
  readonly port: number;
  readonly allocated: boolean;
}

interface EndpointManifest {
  readonly schemaVersion: 1;
  readonly projectRoot: string;
  readonly runId: string;
  readonly writtenAt: string;
  readonly services: readonly EndpointManifestEntry[];
}

const ENDPOINT_NAME = 'http';
const MANIFEST_RELATIVE_PATH = join('.netscript', 'run', 'endpoints.json');

/** Captures generated service resources and installs the P1 allocation callback. */
export function captureP1ServiceResources(
  builder: BuilderLike,
  expectedServices: readonly string[],
): { subscribe(): Promise<void> } {
  const expected = new Set(expectedServices);
  const captured = new Map<string, ExecutableResourceLike>();
  const originalAddExecutable = builder.addExecutable.bind(builder);

  builder.addExecutable = (name, command, workingDirectory, args) => {
    const resource = originalAddExecutable(name, command, workingDirectory, args);
    if (expected.has(name)) captured.set(name, resource);
    return resource;
  };

  return {
    async subscribe(): Promise<void> {
      builder.addExecutable = originalAddExecutable;

      const missing = [...expected].filter((name) => !captured.has(name));
      if (missing.length > 0) {
        throw new Error(`P1 did not capture expected service resources: ${missing.join(', ')}`);
      }

      const projectRoot = await realpath(resolve(await builder.appHostDirectory(), '..'));
      const runId = crypto.randomUUID();
      const observations = new Map<string, EndpointManifestEntry>();
      let writeChain = Promise.resolve();

      for (const name of [...expected].sort()) {
        const resource = captured.get(name);
        if (!resource) throw new Error(`P1 resource disappeared after capture: ${name}`);

        await resource.onResourceEndpointsAllocated(async () => {
          const endpoint = resource.getEndpoint(ENDPOINT_NAME);
          const [url, scheme, host, port, allocated, exists] = await Promise.all([
            endpoint.getValueAsync(),
            endpoint.scheme(),
            endpoint.host(),
            endpoint.port(),
            endpoint.isAllocated(),
            endpoint.exists(),
          ]);
          if (!exists) throw new Error(`P1 endpoint ${name}/${ENDPOINT_NAME} does not exist`);

          observations.set(name, {
            service: name,
            endpoint: ENDPOINT_NAME,
            url,
            scheme,
            host,
            port,
            allocated,
          });

          writeChain = writeChain.then(async () => {
            if (observations.size !== expected.size) return;

            const manifest: EndpointManifest = {
              schemaVersion: 1,
              projectRoot,
              runId,
              writtenAt: new Date().toISOString(),
              services: [...observations.values()].sort((a, b) =>
                a.service.localeCompare(b.service)
              ),
            };
            const destination = join(projectRoot, MANIFEST_RELATIVE_PATH);
            const temporary = `${destination}.${runId}.tmp`;
            await mkdir(dirname(destination), { recursive: true });
            await writeFile(temporary, `${JSON.stringify(manifest, null, 2)}\n`, {
              encoding: 'utf8',
              flag: 'wx',
              mode: 0o600,
            });
            await rename(temporary, destination);
            console.log(`P1_ENDPOINT_MANIFEST_WRITTEN ${destination} ${runId}`);
          });
          await writeChain;
        });
      }
    },
  };
}
