/**
 * Child process for the React Native-like runtime regression.
 *
 * Loads the SDK client, captures its arguments, then removes the `Deno` global before the client
 * is created and called, leaving a runtime with neither `Deno.env` nor `import.meta.env`. Module
 * loading stays on the host runtime because Deno's own Node-compat loader reads the global; service
 * URL resolution is lazy, so it runs after the removal. The parent test owns the stub server.
 *
 * Usage: `<origin> <serviceName> <mode>` where mode is `resolver` or `default`.
 */
import { os } from '@orpc/server';
import { createServiceClient } from '../../../src/client/service-client.ts';

interface EchoOutput {
  readonly echoed: string;
}

const [origin, serviceName, mode] = Deno.args;
Reflect.deleteProperty(globalThis, 'Deno');

const contract = {
  echo: os.route({ method: 'POST', path: '/echo' }).handler(
    ({ input }: { input: unknown }): EchoOutput => ({
      echoed: (input as { readonly message: string }).message,
    }),
  ),
};
const resolverCalls: (readonly [string, string])[] = [];
const client = createServiceClient({
  contract,
  serviceName,
  propagateTraceContext: false,
  ...(mode === 'resolver'
    ? {
      resolveServiceUrl: (name: string, protocol: 'http' | 'https') => {
        resolverCalls.push([name, protocol]);
        return `${origin}/ignored-path`;
      },
    }
    : {}),
});

try {
  const response: EchoOutput = await client.echo({ message: 'from-a-runtime-without-deno' });
  console.log(JSON.stringify({
    denoGlobal: typeof Reflect.get(globalThis, 'Deno'),
    echoed: response.echoed,
    resolverCalls,
  }));
} catch (error) {
  console.log(JSON.stringify({
    denoGlobal: typeof Reflect.get(globalThis, 'Deno'),
    error: error instanceof Error ? error.message : String(error),
    resolverCalls,
  }));
}
