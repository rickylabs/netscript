/** Public abortable native release server command. */

import { Command } from '@cliffy/command';
import { resolve } from '@std/path';
import type { CliffyCommand } from '../../../../../../../kernel/presentation/command-types.ts';
import { outputText } from '../../../../../../../kernel/presentation/output/default-output.ts';
import { NativeReleaseError } from '../native-release-contract.ts';
import { createReleaseRequestHandler } from './release-handler.ts';

/** Minimal server lifecycle returned by the transport seam. */
export interface ReleaseServerLifecycle {
  /** Settles after server shutdown. */
  readonly finished: Promise<void>;
}

/** Dependencies for `release serve`. */
export interface ServeReleaseCommandDependencies {
  /** Resolve a project root from an optional CLI value. */
  readonly resolveProjectRoot: (projectRoot?: string) => Promise<string | undefined>;
  /** Start an HTTP transport with an explicit abort signal. */
  readonly serve?: (
    options: { readonly hostname: string; readonly port: number; readonly signal: AbortSignal },
    handler: (request: Request) => Response | Promise<Response>,
  ) => ReleaseServerLifecycle;
  /** Print the local listener address. */
  readonly print?: (message: string) => void;
}

function defaultServe(
  options: { readonly hostname: string; readonly port: number; readonly signal: AbortSignal },
  handler: (request: Request) => Response | Promise<Response>,
): ReleaseServerLifecycle {
  return Deno.serve({ ...options, onListen: () => undefined }, handler);
}

/** Create `netscript deploy desktop release serve`. */
export function createServeReleaseCommand(
  dependencies: ServeReleaseCommandDependencies,
): CliffyCommand {
  const print = dependencies.print ?? outputText;
  const serve = dependencies.serve ?? defaultServe;
  return new Command()
    .name('serve')
    .description('Serve native latest.json, patches, and installers')
    .option('--project-root <dir:string>', 'NetScript project root')
    .option('--release-dir <dir:string>', 'Filesystem release root', {
      default: '.deploy/desktop/releases',
    })
    .option('--hostname <hostname:string>', 'Listener hostname', { default: '127.0.0.1' })
    .option('--port <port:integer>', 'Listener port', { default: 8787 })
    .option('--base-path <path:string>', 'URL mount path matching the SDK base URL', { default: '/' })
    .action(async (options): Promise<void> => {
      const projectRoot = await dependencies.resolveProjectRoot(options.projectRoot);
      if (projectRoot === undefined) {
        throw new NativeReleaseError('invalid-input', 'Unable to locate a NetScript project root.');
      }
      if (!Number.isInteger(options.port) || options.port < 1 || options.port > 65_535) {
        throw new NativeReleaseError('invalid-input', 'Release server port must be between 1 and 65535.');
      }
      const releaseRoot = resolve(projectRoot, options.releaseDir);
      const abort = new AbortController();
      const signals: Deno.Signal[] = Deno.build.os === 'windows' ? ['SIGINT'] : ['SIGINT', 'SIGTERM'];
      const stop = () => abort.abort();
      for (const signal of signals) Deno.addSignalListener(signal, stop);
      try {
        const server = serve(
          { hostname: options.hostname, port: options.port, signal: abort.signal },
          createReleaseRequestHandler(releaseRoot, { basePath: options.basePath }),
        );
        print(`Serving native releases from ${releaseRoot} on http://${options.hostname}:${options.port}.`);
        await server.finished;
      } finally {
        for (const signal of signals) Deno.removeSignalListener(signal, stop);
      }
    });
}
